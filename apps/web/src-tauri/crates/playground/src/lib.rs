//! AI Playground Library
//!
//! A CLI tool for testing OpenAI-compatible AI models with support for:
//! - Single and batch prompt execution
//! - Concurrent execution with configurable limits
//! - Streaming responses
//! - Performance benchmarking
//! - Token usage tracking

pub mod display;
pub mod executor;
pub mod types;

// Re-export ai-client
pub use ai_client;

// Re-export commonly used types
pub use executor::{execute_concurrent, execute_sequential, execute_single};
pub use types::{ExecutionSummary, PromptResult};

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
