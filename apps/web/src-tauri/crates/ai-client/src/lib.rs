//! AI Client Library
//!
//! A Rust library for interacting with OpenAI-compatible AI models with support for:
//! - Chat completions
//! - Streaming responses
//! - Structured outputs with JSON schema validation
//! - Token usage tracking

pub mod client;
pub mod config;
pub mod types;

// Re-export commonly used types
pub use client::AiClient;
pub use config::{load_dotenv, load_from_env};
pub use types::{ChatMessage, ChatResponse, Config};

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
