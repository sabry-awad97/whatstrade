//! WhatsApp integration abstraction layer
//!
//! This crate provides a provider-agnostic interface for WhatsApp operations.
//! It supports multiple backends (Go service, wa-rs) through a trait-based design.

pub mod error;
pub mod provider;
pub mod types;

// Provider implementations
pub mod go_service_provider;
pub mod mock_provider;
// pub mod wa_rs_provider; // TODO: Implement when wa-rs is ready

// Re-exports
pub use error::{ProviderError, ProviderResult};
pub use provider::WhatsAppProvider;
pub use types::*;

pub use go_service_provider::GoServiceProvider;
pub use mock_provider::MockWhatsAppProvider;
