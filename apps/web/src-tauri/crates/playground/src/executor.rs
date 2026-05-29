//! Execution strategies for prompts

use crate::client::PlaygroundClient;
use crate::types::{ExecutionSummary, PromptResult};
use anyhow::Result;
use futures::stream::{self, StreamExt};
use std::time::Instant;

/// Execute a single prompt
pub async fn execute_single(
    client: &PlaygroundClient,
    prompt: &str,
    stream: bool,
) -> Result<PromptResult> {
    if stream {
        client.generate_stream(prompt).await
    } else {
        client.generate(prompt).await
    }
}

/// Execute multiple prompts sequentially
pub async fn execute_sequential(
    client: &PlaygroundClient,
    prompts: &[String],
) -> Result<ExecutionSummary> {
    let start = Instant::now();
    let mut results = Vec::with_capacity(prompts.len());

    for (i, prompt) in prompts.iter().enumerate() {
        println!(
            "[{}/{}] Processing: \"{}\"",
            i + 1,
            prompts.len(),
            truncate(prompt, 50)
        );

        let result = client.generate(prompt).await?;
        results.push(result);
    }

    let total_duration = start.elapsed();
    Ok(ExecutionSummary::new(results, total_duration))
}

/// Execute multiple prompts concurrently with a limit
pub async fn execute_concurrent(
    client: &PlaygroundClient,
    prompts: &[String],
    limit: usize,
) -> Result<ExecutionSummary> {
    let start = Instant::now();

    // Create a stream of futures and process them with concurrency limit
    let results: Vec<PromptResult> = stream::iter(prompts)
        .map(|prompt| async move { client.generate(prompt).await })
        .buffer_unordered(limit)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<Vec<_>>>()?;

    let total_duration = start.elapsed();
    Ok(ExecutionSummary::new(results, total_duration))
}

/// Truncate text for display
fn truncate(text: &str, max_length: usize) -> String {
    if text.len() <= max_length {
        text.to_string()
    } else {
        format!("{}...", &text[..max_length - 3])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_truncate() {
        assert_eq!(truncate("short", 10), "short");
        assert_eq!(truncate("this is a very long text", 10), "this is...");
    }
}
