//! Core types for the AI Client

use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Simple chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Configuration for the AI client
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    /// Base URL for the OpenAI-compatible API
    #[serde(default = "default_base_url")]
    pub base_url: String,

    /// Model name to use
    #[serde(default = "default_model")]
    pub model: String,

    /// API key for authentication
    #[serde(default = "default_api_key")]
    pub api_key: String,

    /// Maximum number of concurrent requests
    #[serde(default = "default_concurrency_limit")]
    pub concurrency_limit: usize,
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

impl Default for Config {
    fn default() -> Self {
        Self {
            base_url: "http://localhost:12434/engines/v1".to_string(),
            model: "gemma4".to_string(),
            api_key: "not-needed".to_string(),
            concurrency_limit: 5,
        }
    }
}

/// Result of executing a single prompt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    /// The original prompt
    pub prompt: String,
    /// The generated response
    pub response: String,
    /// Number of input tokens used
    pub input_tokens: u32,
    /// Number of output tokens generated
    pub output_tokens: u32,
    /// Total tokens (input + output)
    pub total_tokens: u32,
    /// Time taken to generate the response
    #[serde(with = "duration_serde")]
    pub duration: Duration,
    /// Reason for completion (e.g., "stop", "length")
    pub finish_reason: String,
    /// Tokens per second (output tokens / duration in seconds)
    pub tokens_per_sec: f64,
}

impl ChatResponse {
    /// Calculate tokens per second
    pub fn calculate_tokens_per_sec(&mut self) {
        let duration_secs = self.duration.as_secs_f64();
        self.tokens_per_sec = if duration_secs > 0.0 {
            self.output_tokens as f64 / duration_secs
        } else {
            0.0
        };
    }
}

/// Summary of execution results
#[derive(Debug, Clone)]
pub struct ExecutionSummary {
    /// Total number of prompts executed
    pub total_prompts: usize,
    /// Total time taken for all prompts
    pub total_duration: Duration,
    /// Total tokens used across all prompts
    pub total_tokens: u32,
    /// Individual results for each prompt
    pub results: Vec<ChatResponse>,
    /// Average duration per prompt
    pub avg_duration: Duration,
    /// Throughput in prompts per second
    pub throughput: f64,
}

impl ExecutionSummary {
    /// Create a new execution summary from results
    pub fn new(results: Vec<ChatResponse>, total_duration: Duration) -> Self {
        let total_prompts = results.len();
        let total_tokens = results.iter().map(|r| r.total_tokens).sum();
        let avg_duration = if total_prompts > 0 {
            total_duration / total_prompts as u32
        } else {
            Duration::ZERO
        };
        let throughput = if total_duration.as_secs_f64() > 0.0 {
            total_prompts as f64 / total_duration.as_secs_f64()
        } else {
            0.0
        };

        Self {
            total_prompts,
            total_duration,
            total_tokens,
            results,
            avg_duration,
            throughput,
        }
    }
}

/// Benchmark comparison results
#[derive(Debug, Clone)]
pub struct BenchmarkResult {
    /// Sequential execution summary
    pub sequential: ExecutionSummary,
    /// Concurrent execution summary
    pub concurrent: ExecutionSummary,
    /// Speedup factor (sequential time / concurrent time)
    pub speedup: f64,
}

impl BenchmarkResult {
    /// Create a new benchmark result
    pub fn new(sequential: ExecutionSummary, concurrent: ExecutionSummary) -> Self {
        let speedup = if concurrent.total_duration.as_secs_f64() > 0.0 {
            sequential.total_duration.as_secs_f64() / concurrent.total_duration.as_secs_f64()
        } else {
            0.0
        };

        Self {
            sequential,
            concurrent,
            speedup,
        }
    }
}

/// Custom serde module for Duration
mod duration_serde {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use std::time::Duration;

    pub fn serialize<S>(duration: &Duration, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        duration.as_millis().serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let millis = u64::deserialize(deserializer)?;
        Ok(Duration::from_millis(millis))
    }
}
