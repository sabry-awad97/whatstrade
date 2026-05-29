//! CLI-specific types for the AI Playground

use ai_client::ChatResponse;
use std::time::Duration;

// Re-export from ai-client
pub use ai_client::{ChatMessage, Config};

/// Result of executing a single prompt (alias for ChatResponse)
pub type PromptResult = ChatResponse;

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
    pub results: Vec<PromptResult>,
    /// Average duration per prompt
    pub avg_duration: Duration,
    /// Throughput in prompts per second
    pub throughput: f64,
}

impl ExecutionSummary {
    /// Create a new execution summary from results
    pub fn new(results: Vec<PromptResult>, total_duration: Duration) -> Self {
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
