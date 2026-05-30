//! WhatsApp integration abstraction layer
//!
//! This crate provides a provider-agnostic interface for WhatsApp operations.
//! Currently supports wa-rs backend through a trait-based design with event streaming.

pub mod error;
pub mod events;
pub mod provider;
pub mod types;

// Provider implementations
pub mod wa_rs_provider;

// Re-exports
pub use error::{ProviderError, ProviderResult};
pub use events::*;
pub use provider::WhatsAppProvider;
pub use types::*;

pub use wa_rs_provider::{WaRsConfig, WaRsProvider};
