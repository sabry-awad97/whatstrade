//! Mock WhatsApp provider for testing
//!
//! This provider simulates WhatsApp operations without making real connections.
//! Useful for unit tests and development without a real WhatsApp account.

use crate::{
    error::{ProviderError, ProviderResult},
    provider::WhatsAppProvider,
    types::{ConnectionStatus, GroupInfo, MessageId, OutgoingMessage, QRCode, SyncConfig},
};
use async_trait::async_trait;
use chrono::Utc;
use std::sync::{Arc, RwLock};
use tracing::debug;

/// Mock provider state
#[derive(Debug, Clone)]
struct MockState {
    connected: bool,
    logged_in: bool,
    phone_number: Option<String>,
    groups: Vec<GroupInfo>,
    sent_messages: Vec<OutgoingMessage>,
    should_fail: bool,
    failure_message: String,
}

impl Default for MockState {
    fn default() -> Self {
        Self {
            connected: true,
            logged_in: true,
            phone_number: Some("+1234567890".to_string()),
            groups: vec![],
            sent_messages: vec![],
            should_fail: false,
            failure_message: "Mock failure".to_string(),
        }
    }
}

/// Mock WhatsApp provider for testing
pub struct MockWhatsAppProvider {
    state: Arc<RwLock<MockState>>,
}

impl MockWhatsAppProvider {
    /// Create a new mock provider with default state
    pub fn new() -> Self {
        Self {
            state: Arc::new(RwLock::new(MockState::default())),
        }
    }

    /// Create a mock provider with custom groups
    pub fn with_groups(groups: Vec<GroupInfo>) -> Self {
        let mut state = MockState::default();
        state.groups = groups;
        Self {
            state: Arc::new(RwLock::new(state)),
        }
    }

    /// Create a mock provider that simulates being disconnected
    pub fn disconnected() -> Self {
        let mut state = MockState::default();
        state.connected = false;
        state.logged_in = false;
        Self {
            state: Arc::new(RwLock::new(state)),
        }
    }

    /// Create a mock provider that fails all operations
    pub fn failing(message: impl Into<String>) -> Self {
        let mut state = MockState::default();
        state.should_fail = true;
        state.failure_message = message.into();
        Self {
            state: Arc::new(RwLock::new(state)),
        }
    }

    /// Set whether operations should fail
    pub fn set_should_fail(&self, should_fail: bool) {
        if let Ok(mut state) = self.state.write() {
            state.should_fail = should_fail;
        }
    }

    /// Set connection status
    pub fn set_connected(&self, connected: bool) {
        if let Ok(mut state) = self.state.write() {
            state.connected = connected;
            if !connected {
                state.logged_in = false;
            }
        }
    }

    /// Set login status
    pub fn set_logged_in(&self, logged_in: bool) {
        if let Ok(mut state) = self.state.write() {
            state.logged_in = logged_in;
        }
    }

    /// Add a group to the mock state
    pub fn add_group(&self, group: GroupInfo) {
        if let Ok(mut state) = self.state.write() {
            state.groups.push(group);
        }
    }

    /// Get all sent messages
    pub fn get_sent_messages(&self) -> Vec<OutgoingMessage> {
        self.state
            .read()
            .map(|state| state.sent_messages.clone())
            .unwrap_or_default()
    }

    /// Clear sent messages
    pub fn clear_sent_messages(&self) {
        if let Ok(mut state) = self.state.write() {
            state.sent_messages.clear();
        }
    }

    /// Check if operation should fail
    fn check_failure(&self) -> ProviderResult<()> {
        let state = self
            .state
            .read()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        if state.should_fail {
            return Err(ProviderError::internal(state.failure_message.clone()));
        }

        Ok(())
    }
}

impl Default for MockWhatsAppProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl WhatsAppProvider for MockWhatsAppProvider {
    async fn sync_groups(&self, _config: &SyncConfig) -> ProviderResult<Vec<GroupInfo>> {
        debug!("Mock: Syncing groups");
        self.check_failure()?;

        let state = self
            .state
            .read()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        if !state.connected {
            return Err(ProviderError::connection("Not connected"));
        }

        if !state.logged_in {
            return Err(ProviderError::authentication("Not logged in"));
        }

        Ok(state.groups.clone())
    }

    async fn get_status(&self) -> ProviderResult<ConnectionStatus> {
        debug!("Mock: Getting status");
        self.check_failure()?;

        let state = self
            .state
            .read()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        Ok(ConnectionStatus {
            connected: state.connected,
            logged_in: state.logged_in,
            phone_number: state.phone_number.clone(),
            timestamp: Utc::now(),
        })
    }

    async fn get_qr_code(&self) -> ProviderResult<QRCode> {
        debug!("Mock: Getting QR code");
        self.check_failure()?;

        let state = self
            .state
            .read()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        if state.logged_in {
            return Err(ProviderError::authentication("Already logged in"));
        }

        Ok(QRCode {
            data: "mock_qr_code_data_base64".to_string(),
            expires_at: Utc::now() + chrono::Duration::seconds(60),
        })
    }

    async fn send_message(&self, message: &OutgoingMessage) -> ProviderResult<MessageId> {
        debug!("Mock: Sending message to {}", message.recipient_jid);
        self.check_failure()?;

        let mut state = self
            .state
            .write()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        if !state.connected {
            return Err(ProviderError::connection("Not connected"));
        }

        if !state.logged_in {
            return Err(ProviderError::authentication("Not logged in"));
        }

        // Store the sent message
        state.sent_messages.push(message.clone());

        Ok(MessageId {
            id: format!("mock_msg_{}", state.sent_messages.len()),
            timestamp: Utc::now(),
        })
    }

    async fn logout(&self) -> ProviderResult<()> {
        debug!("Mock: Logging out");
        self.check_failure()?;

        let mut state = self
            .state
            .write()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        state.logged_in = false;
        state.connected = false;
        state.phone_number = None;

        Ok(())
    }

    async fn is_ready(&self) -> ProviderResult<bool> {
        let state = self
            .state
            .read()
            .map_err(|_| ProviderError::internal("Lock poisoned"))?;

        Ok(!state.should_fail)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_mock_provider_default_state() {
        let provider = MockWhatsAppProvider::new();
        let status = provider.get_status().await.unwrap();

        assert!(status.connected);
        assert!(status.logged_in);
        assert_eq!(status.phone_number, Some("+1234567890".to_string()));
    }

    #[tokio::test]
    async fn test_mock_provider_with_groups() {
        let groups = vec![GroupInfo {
            jid: "123@g.us".to_string(),
            name: "Test Group".to_string(),
            participant_count: 5,
            description: None,
            created_at: None,
        }];

        let provider = MockWhatsAppProvider::with_groups(groups.clone());
        let synced = provider.sync_groups(&SyncConfig::default()).await.unwrap();

        assert_eq!(synced.len(), 1);
        assert_eq!(synced[0].name, "Test Group");
    }

    #[tokio::test]
    async fn test_mock_provider_disconnected() {
        let provider = MockWhatsAppProvider::disconnected();
        let result = provider.sync_groups(&SyncConfig::default()).await;

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ProviderError::Connection(_)));
    }

    #[tokio::test]
    async fn test_mock_provider_failing() {
        let provider = MockWhatsAppProvider::failing("Test failure");
        let result = provider.get_status().await;

        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_send_message_tracking() {
        let provider = MockWhatsAppProvider::new();
        let message = OutgoingMessage::text("123@g.us", "Hello");

        provider.send_message(&message).await.unwrap();

        let sent = provider.get_sent_messages();
        assert_eq!(sent.len(), 1);
        assert_eq!(sent[0].text, "Hello");
    }
}
