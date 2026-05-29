//! Configuration management for the AI Client

use crate::types::Config;
use anyhow::{Context, Result};

/// Load configuration from environment variables using envy
///
/// Environment variables:
/// - AI_BASE_URL (default: http://localhost:12434/engines/v1)
/// - AI_MODEL (default: gemma4)
/// - AI_API_KEY (default: not-needed)
/// - AI_CONCURRENCY_LIMIT (default: 5)
pub fn load_from_env() -> Result<Config> {
    // Use envy with prefix "AI_" for AI-specific vars
    // Note: envy expects uppercase env vars matching struct field names
    let config = envy::prefixed("AI_")
        .from_env::<EnvConfig>()
        .context("Failed to parse AI_ environment variables")?;

    Ok(Config {
        base_url: config.base_url,
        model: config.model,
        api_key: config.api_key,
        concurrency_limit: config.concurrency_limit,
    })
}

/// Internal config struct for envy deserialization
#[derive(serde::Deserialize, Debug)]
struct EnvConfig {
    #[serde(default = "default_base_url")]
    base_url: String,

    #[serde(default = "default_model")]
    model: String,

    #[serde(default = "default_api_key")]
    api_key: String,

    #[serde(default = "default_concurrency_limit")]
    concurrency_limit: usize,
}

impl Default for EnvConfig {
    fn default() -> Self {
        Self {
            base_url: default_base_url(),
            model: default_model(),
            api_key: default_api_key(),
            concurrency_limit: default_concurrency_limit(),
        }
    }
}

fn default_base_url() -> String {
    "http://localhost:12434/engines/v1".to_string()
}

fn default_model() -> String {
    "gemma4".to_string()
}

fn default_api_key() -> String {
    "not-needed".to_string()
}

fn default_concurrency_limit() -> usize {
    5
}

/// Load .env file if it exists
pub fn load_dotenv() {
    if let Err(e) = dotenvy::dotenv() {
        // Silently ignore if .env doesn't exist
        if e.not_found() {
            return;
        }
        eprintln!("Warning: Failed to load .env file: {}", e);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.base_url, "http://localhost:12434/engines/v1");
        assert_eq!(config.model, "gemma4");
        assert_eq!(config.api_key, "not-needed");
        assert_eq!(config.concurrency_limit, 5);
    }

    #[test]
    fn test_load_from_env() {
        // Should not panic even with no env vars set
        let result = load_from_env();
        assert!(result.is_ok());
    }
}
