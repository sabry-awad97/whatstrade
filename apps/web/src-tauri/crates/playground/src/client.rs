//! OpenAI client wrapper for the AI Playground

use crate::types::{Config, PromptResult};
use anyhow::{Context, Result};
use async_openai::{
    Client,
    config::OpenAIConfig,
    types::chat::{
        ChatCompletionRequestSystemMessageArgs, ChatCompletionRequestUserMessageArgs,
        CreateChatCompletionRequestArgs,
    },
};
use futures::StreamExt;
use std::io::{Write, stdout};
use std::time::Instant;

/// Wrapper around the async-openai client
pub struct PlaygroundClient {
    client: Client<OpenAIConfig>,
    model: String,
}

impl PlaygroundClient {
    /// Create a new playground client from configuration
    pub fn new(config: &Config) -> Result<Self> {
        let openai_config = OpenAIConfig::new()
            .with_api_key(&config.api_key)
            .with_api_base(&config.base_url);

        let client = Client::with_config(openai_config);

        Ok(Self {
            client,
            model: config.model.clone(),
        })
    }

    /// Generate a response for a single prompt
    pub async fn generate(&self, prompt: &str) -> Result<PromptResult> {
        let start = Instant::now();

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages([
                ChatCompletionRequestSystemMessageArgs::default()
                    .content("You are a helpful AI assistant.")
                    .build()?
                    .into(),
                ChatCompletionRequestUserMessageArgs::default()
                    .content(prompt)
                    .build()?
                    .into(),
            ])
            .build()
            .context("Failed to build chat completion request")?;

        let response = self
            .client
            .chat()
            .create(request)
            .await
            .context("Failed to create chat completion")?;

        let duration = start.elapsed();

        // Extract response data
        let choice = response.choices.first().context("No choices in response")?;

        let response_text = choice
            .message
            .content
            .clone()
            .unwrap_or_else(|| String::from(""));

        let finish_reason = choice
            .finish_reason
            .as_ref()
            .map(|r| format!("{:?}", r))
            .unwrap_or_else(|| "unknown".to_string());

        // Extract token usage
        let usage = response.usage.context("No usage data in response")?;
        let input_tokens = usage.prompt_tokens;
        let output_tokens = usage.completion_tokens;
        let total_tokens = usage.total_tokens;

        let mut result = PromptResult {
            prompt: prompt.to_string(),
            response: response_text,
            input_tokens,
            output_tokens,
            total_tokens,
            duration,
            finish_reason,
            tokens_per_sec: 0.0,
        };

        result.calculate_tokens_per_sec();

        Ok(result)
    }

    /// Stream a response for a single prompt (returns final result)
    pub async fn generate_stream(&self, prompt: &str) -> Result<PromptResult> {
        let start = Instant::now();

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages([
                ChatCompletionRequestSystemMessageArgs::default()
                    .content("You are a helpful AI assistant.")
                    .build()?
                    .into(),
                ChatCompletionRequestUserMessageArgs::default()
                    .content(prompt)
                    .build()?
                    .into(),
            ])
            .build()
            .context("Failed to build streaming chat completion request")?;

        let mut stream = self
            .client
            .chat()
            .create_stream(request)
            .await
            .context("Failed to create streaming chat completion")?;

        let mut response_text = String::new();
        let mut finish_reason = String::from("unknown");
        let mut input_tokens = 0;
        let mut output_tokens = 0;

        // Lock stdout for efficient writing
        let mut lock = stdout().lock();

        // Process stream
        while let Some(result) = stream.next().await {
            match result {
                Ok(response) => {
                    for choice in response.choices {
                        if let Some(ref content) = choice.delta.content {
                            write!(lock, "{}", content)?;
                            response_text.push_str(content);
                        }
                        if let Some(reason) = &choice.finish_reason {
                            finish_reason = format!("{:?}", reason);
                        }
                    }

                    // Extract usage if available (usually in last chunk)
                    if let Some(usage) = response.usage {
                        input_tokens = usage.prompt_tokens;
                        output_tokens = usage.completion_tokens;
                    }
                }
                Err(e) => {
                    return Err(anyhow::anyhow!("Stream error: {}", e));
                }
            }
        }

        stdout().flush()?;
        println!(); // New line after streaming

        let duration = start.elapsed();
        let total_tokens = input_tokens + output_tokens;

        let mut result = PromptResult {
            prompt: prompt.to_string(),
            response: response_text,
            input_tokens,
            output_tokens,
            total_tokens,
            duration,
            finish_reason,
            tokens_per_sec: 0.0,
        };

        result.calculate_tokens_per_sec();

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let config = Config::default();
        let result = PlaygroundClient::new(&config);
        assert!(result.is_ok());
    }
}
