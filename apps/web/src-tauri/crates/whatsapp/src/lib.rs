//! WhatsApp integration abstraction layer
//!
//! This crate provides a provider-agnostic interface for WhatsApp operations.
//! Currently supports wa-rs backend through a trait-based design.

pub mod error;
pub mod provider;
pub mod types;

// Provider implementations
pub mod wa_rs_provider;

// Re-exports
pub use error::{ProviderError, ProviderResult};
pub use provider::WhatsAppProvider;
pub use types::*;

pub use wa_rs_provider::WaRsProvider;
