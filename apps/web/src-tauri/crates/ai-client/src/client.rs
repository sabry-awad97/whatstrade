//! OpenAI-compatible AI client

use crate::types::{ChatResponse, Config};
use anyhow::{Context, Result};
use async_openai::{
    Client,
    config::OpenAIConfig,
    types::chat::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs, ResponseFormat,
        ResponseFormatJsonSchema,
    },
};
use futures::StreamExt;
use schemars::{JsonSchema, schema_for};
use serde::de::DeserializeOwned;
use std::io::{Write, stdout};
use std::time::Instant;

/// AI client for OpenAI-compatible APIs
#[derive(Clone)]
pub struct AiClient {
    client: Client<OpenAIConfig>,
    model: String,
    system_prompt: Option<String>,
}

impl AiClient {
    /// Create a new AI client from configuration
    pub fn new(config: &Config) -> Result<Self> {
        let openai_config = OpenAIConfig::new()
            .with_api_key(&config.api_key)
            .with_api_base(&config.base_url);

        let client = Client::with_config(openai_config);

        Ok(Self {
            client,
            model: config.model.clone(),
            system_prompt: None,
        })
    }

    /// Set a default system prompt for all requests
    pub fn with_system_prompt(mut self, prompt: impl Into<String>) -> Self {
        self.system_prompt = Some(prompt.into());
        self
    }

    /// Get the current system prompt
    pub fn system_prompt(&self) -> Option<&str> {
        self.system_prompt.as_deref()
    }

    /// Generate a response for a single prompt
    ///
    /// Uses the default system prompt if set, otherwise uses a generic assistant prompt
    pub async fn generate(&self, prompt: &str) -> Result<ChatResponse> {
        let start = Instant::now();

        let system_content = self
            .system_prompt
            .as_deref()
            .unwrap_or("You are a helpful AI assistant.");

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages([
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_content)
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

        let mut result = ChatResponse {
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
    ///
    /// Uses the default system prompt if set, otherwise uses a generic assistant prompt
    pub async fn generate_stream(&self, prompt: &str) -> Result<ChatResponse> {
        let start = Instant::now();

        let system_content = self
            .system_prompt
            .as_deref()
            .unwrap_or("You are a helpful AI assistant.");

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages([
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_content)
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

        let mut result = ChatResponse {
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

    /// Generate structured output with JSON schema validation using a simple user prompt
    ///
    /// # Type Parameters
    /// * `T` - The type to deserialize the response into. Must implement `Serialize`, `DeserializeOwned`, and `JsonSchema`
    ///
    /// # Arguments
    /// * `user_prompt` - The user message content
    /// * `schema_name` - Name for the JSON schema (e.g., "math_reasoning")
    /// * `schema_description` - Optional description for the schema
    ///
    /// # Example
    /// ```rust,ignore
    /// use schemars::JsonSchema;
    /// use serde::{Deserialize, Serialize};
    ///
    /// #[derive(Debug, Serialize, Deserialize, JsonSchema)]
    /// #[serde(deny_unknown_fields)]
    /// struct MathResponse {
    ///     final_answer: String,
    ///     steps: Vec<String>,
    /// }
    ///
    /// let response: Option<MathResponse> = client
    ///     .generate_structured_simple("Solve 2x + 5 = 15", "math_response", None)
    ///     .await?;
    /// ```
    pub async fn generate_structured_simple<T>(
        &self,
        user_prompt: &str,
        schema_name: &str,
        schema_description: Option<String>,
    ) -> Result<Option<T>>
    where
        T: serde::Serialize + DeserializeOwned + JsonSchema,
    {
        let messages = vec![
            ChatCompletionRequestUserMessageArgs::default()
                .content(user_prompt)
                .build()?
                .into(),
        ];

        self.generate_structured(messages, schema_name, schema_description)
            .await
    }

    /// Generate structured output with JSON schema validation
    ///
    /// # Type Parameters
    /// * `T` - The type to deserialize the response into. Must implement `Serialize`, `DeserializeOwned`, and `JsonSchema`
    ///
    /// # Arguments
    /// * `messages` - Custom messages for the chat completion
    /// * `schema_name` - Name for the JSON schema (e.g., "math_reasoning")
    /// * `schema_description` - Optional description for the schema
    ///
    /// # Example
    /// ```rust,ignore
    /// use schemars::JsonSchema;
    /// use serde::{Deserialize, Serialize};
    ///
    /// #[derive(Debug, Serialize, Deserialize, JsonSchema)]
    /// #[serde(deny_unknown_fields)]
    /// struct MathResponse {
    ///     final_answer: String,
    ///     steps: Vec<String>,
    /// }
    ///
    /// let messages = vec![
    ///     ChatCompletionRequestSystemMessage::from("You are a math tutor.").into(),
    ///     ChatCompletionRequestUserMessage::from("Solve 2x + 5 = 15").into(),
    /// ];
    ///
    /// let response: Option<MathResponse> = client
    ///     .generate_structured(messages, "math_response", None)
    ///     .await?;
    /// ```
    pub async fn generate_structured<T>(
        &self,
        messages: Vec<ChatCompletionRequestMessage>,
        schema_name: &str,
        schema_description: Option<String>,
    ) -> Result<Option<T>>
    where
        T: serde::Serialize + DeserializeOwned + JsonSchema,
    {
        let schema = schema_for!(T);
        let schema_value =
            serde_json::to_value(&schema).context("Failed to serialize JSON schema")?;

        let response_format = ResponseFormat::JsonSchema {
            json_schema: ResponseFormatJsonSchema {
                description: schema_description,
                name: schema_name.to_string(),
                schema: schema_value,
                strict: Some(true),
            },
        };

        let request = CreateChatCompletionRequestArgs::default()
            .model(&self.model)
            .messages(messages)
            .response_format(response_format)
            .build()
            .context("Failed to build structured output request")?;

        let response = self
            .client
            .chat()
            .create(request)
            .await
            .context("Failed to create structured chat completion")?;

        for choice in response.choices {
            if let Some(content) = choice.message.content {
                let parsed: T = serde_json::from_str(&content)
                    .context("Failed to parse structured response")?;
                return Ok(Some(parsed));
            }
        }

        Ok(None)
    }
}
