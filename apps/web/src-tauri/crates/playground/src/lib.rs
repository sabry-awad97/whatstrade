//! AI Playground Library
//!
//! A Rust library for testing OpenAI-compatible AI models with support for:
//! - Single and batch prompt execution
//! - Concurrent execution with configurable limits
//! - Streaming responses
//! - Performance benchmarking
//! - Token usage tracking

pub mod client;
pub mod config;
pub mod display;
pub mod executor;
pub mod types;

// Re-export commonly used types
pub use client::PlaygroundClient;
pub use executor::{execute_concurrent, execute_sequential, execute_single};
pub use types::{Config, ExecutionSummary, PromptResult};

/// Library version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
