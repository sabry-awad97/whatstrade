//! Go service provider implementation
//!
//! This provider communicates with an external Go WhatsApp service via HTTP.
//! This is a temporary implementation that will be replaced by wa-rs.

use crate::{
    error::{ProviderError, ProviderResult},
    provider::WhatsAppProvider,
    types::{ConnectionStatus, GroupInfo, MessageId, OutgoingMessage, QRCode, SyncConfig},
};
use async_trait::async_trait;
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{debug, warn};

/// Provider that communicates with Go WhatsApp service
pub struct GoServiceProvider {
    client: Client,
    base_url: String,
}

impl GoServiceProvider {
    /// Create a new Go service provider
    ///
    /// # Arguments
    ///
    /// * `base_url` - Base URL of the Go service (e.g., "http://localhost:8080")
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
            base_url: base_url.into(),
        }
    }

    /// Create with custom HTTP client
    pub fn with_client(base_url: impl Into<String>, client: Client) -> Self {
        Self {
            client,
            base_url: base_url.into(),
        }
    }

    /// Build URL for an endpoint
    fn url(&self, path: &str) -> String {
        format!("{}{}", self.base_url, path)
    }
}

#[async_trait]
impl WhatsAppProvider for GoServiceProvider {
    async fn sync_groups(&self, config: &SyncConfig) -> ProviderResult<Vec<GroupInfo>> {
        debug!("Syncing groups from Go service");

        let url = self.url("/api/whatsapp/groups/sync");
        let response = self
            .client
            .post(&url)
            .timeout(Duration::from_secs(config.timeout_seconds))
            .send()
            .await
            .map_err(|e| ProviderError::connection(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ProviderError::connection(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        // Go service triggers sync but doesn't return groups directly
        // We need to fetch groups separately
        let groups_url = self.url("/api/whatsapp/groups");
        let groups_response = self
            .client
            .get(&groups_url)
            .send()
            .await
            .map_err(|e| ProviderError::connection(format!("Failed to fetch groups: {}", e)))?;

        if !groups_response.status().is_success() {
            return Err(ProviderError::connection(format!(
                "Failed to fetch groups: status {}",
                groups_response.status()
            )));
        }

        let go_groups: Vec<GoServiceGroup> = groups_response
            .json()
            .await
            .map_err(|e| ProviderError::Serialization(format!("Failed to parse groups: {}", e)))?;

        let groups: Vec<GroupInfo> = go_groups
            .into_iter()
            .map(|g| GroupInfo {
                jid: g.jid,
                name: g.name,
                participant_count: g.participant_count.unwrap_or(0),
                description: g.description,
                created_at: None, // Go service doesn't provide this
            })
            .collect();

        debug!("Synced {} groups", groups.len());
        Ok(groups)
    }

    async fn get_status(&self) -> ProviderResult<ConnectionStatus> {
        debug!("Fetching status from Go service");

        let url = self.url("/api/whatsapp/status");
        let response = self
            .client
            .get(&url)
            .timeout(Duration::from_secs(5))
            .send()
            .await
            .map_err(|e| ProviderError::connection(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ProviderError::connection(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        let status: GoServiceStatus = response
            .json()
            .await
            .map_err(|e| ProviderError::Serialization(format!("Failed to parse status: {}", e)))?;

        Ok(ConnectionStatus {
            connected: status.connected,
            logged_in: status.logged_in,
            phone_number: status.phone_number,
            timestamp: Utc::now(),
        })
    }

    async fn get_qr_code(&self) -> ProviderResult<QRCode> {
        debug!("Fetching QR code from Go service");

        let url = self.url("/api/whatsapp/qr");
        let response = self
            .client
            .get(&url)
            .timeout(Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| ProviderError::connection(format!("HTTP request failed: {}", e)))?;

        if response.status() == 400 {
            return Err(ProviderError::authentication("Already logged in"));
        }

        if !response.status().is_success() {
            return Err(ProviderError::connection(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        let qr_data: GoServiceQRCode = response
            .json()
            .await
            .map_err(|e| ProviderError::Serialization(format!("Failed to parse QR code: {}", e)))?;

        Ok(QRCode {
            data: qr_data.qr_code,
            expires_at: Utc::now() + chrono::Duration::seconds(60),
        })
    }

    async fn send_message(&self, message: &OutgoingMessage) -> ProviderResult<MessageId> {
        debug!(
            "Sending message via Go service to {}",
            message.recipient_jid
        );

        let url = self.url("/api/whatsapp/send");
        let request_body = GoServiceSendRequest {
            jid: message.recipient_jid.clone(),
            text: message.text.clone(),
            quoted_message_id: message.quoted_message_id.clone(),
        };

        let response = self
            .client
            .post(&url)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| ProviderError::SendFailed(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ProviderError::SendFailed(format!(
                "Go service returned status {}",
                response.status()
            )));
        }

        let send_response: GoServiceSendResponse = response.json().await.map_err(|e| {
            ProviderError::Serialization(format!("Failed to parse response: {}", e))
        })?;

        Ok(MessageId {
            id: send_response.message_id,
            timestamp: Utc::now(),
        })
    }

    async fn logout(&self) -> ProviderResult<()> {
        debug!("Logging out from Go service");

        let url = self.url("/api/whatsapp/logout");
        let response = self
            .client
            .post(&url)
            .send()
            .await
            .map_err(|e| ProviderError::connection(format!("HTTP request failed: {}", e)))?;

        if !response.status().is_success() {
            warn!("Logout returned status {}", response.status());
            return Err(ProviderError::connection(format!(
                "Logout failed with status {}",
                response.status()
            )));
        }

        Ok(())
    }

    async fn is_ready(&self) -> ProviderResult<bool> {
        match self.get_status().await {
            Ok(_) => Ok(true),
            Err(e) => {
                warn!("Health check failed: {}", e);
                Ok(false)
            }
        }
    }
}

// Go service response types
#[derive(Debug, Deserialize)]
struct GoServiceStatus {
    connected: bool,
    logged_in: bool,
    phone_number: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoServiceQRCode {
    qr_code: String,
}

#[derive(Debug, Deserialize)]
struct GoServiceGroup {
    jid: String,
    name: String,
    participant_count: Option<usize>,
    description: Option<String>,
}

#[derive(Debug, Serialize)]
struct GoServiceSendRequest {
    jid: String,
    text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    quoted_message_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoServiceSendResponse {
    message_id: String,
}
