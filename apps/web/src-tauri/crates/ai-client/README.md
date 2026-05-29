# AI Client

A Rust library for interacting with OpenAI-compatible AI models.

## Features

- ✅ **Chat Completions**: Generate text responses from prompts
- ✅ **Streaming Support**: Real-time response streaming
- ✅ **Structured Outputs**: Generate JSON responses with schema validation using `schemars`
- ✅ **Token Tracking**: Monitor input/output/total token usage
- ✅ **OpenAI Compatible**: Works with any OpenAI-compatible API endpoint
- ✅ **Async/Await**: Built on `tokio` for efficient async operations

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
ai-client = { path = "../ai-client" }
tokio = { version = "1", features = ["full"] }
```

## Usage

### Basic Chat Completion

```rust
use ai_client::{AiClient, Config, load_from_env, load_dotenv};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    load_dotenv();
    let config = load_from_env()?;

    // Create client
    let client = AiClient::new(&config)?;

    // Generate response
    let response = client.generate("What is Rust?").await?;

    println!("Response: {}", response.response);
    println!("Tokens used: {}", response.total_tokens);

    Ok(())
}
```

### Streaming Response

```rust
use ai_client::{AiClient, Config};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = Config::default();
    let client = AiClient::new(&config)?;

    // Stream response (prints to stdout as it arrives)
    let response = client.generate_stream("Tell me a story").await?;

    Ok(())
}
```

### Structured Output with JSON Schema

```rust
use ai_client::AiClient;
use async_openai::types::chat::{
    ChatCompletionRequestSystemMessage,
    ChatCompletionRequestUserMessage,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
struct MathResponse {
    final_answer: String,
    steps: Vec<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = ai_client::Config::default();
    let client = AiClient::new(&config)?;

    let messages = vec![
        ChatCompletionRequestSystemMessage::from("You are a math tutor.").into(),
        ChatCompletionRequestUserMessage::from("Solve 2x + 5 = 15").into(),
    ];

    let response: Option<MathResponse> = client
        .generate_structured(messages, "math_response", None)
        .await?;

    if let Some(math) = response {
        println!("Answer: {}", math.final_answer);
    }

    Ok(())
}
```

## Configuration

Configure via environment variables or `.env` file:

```bash
# API endpoint (default: http://localhost:12434/engines/v1)
AI_BASE_URL=http://localhost:12434/engines/v1

# Model name (default: gemma4)
AI_MODEL=gemma4

# API key (default: not-needed)
AI_API_KEY=not-needed

# Default concurrency limit (default: 5)
CONCURRENCY_LIMIT=5
```

Or create a `Config` manually:

```rust
use ai_client::Config;

let config = Config {
    base_url: "http://localhost:12434/engines/v1".to_string(),
    model: "gemma4".to_string(),
    api_key: "not-needed".to_string(),
    concurrency_limit: 5,
};
```

## Examples

Run the structured output example:

```bash
cargo run --example structured_output
```

## API Reference

### `AiClient`

Main client for interacting with AI models.

#### Methods

- `new(config: &Config) -> Result<Self>` - Create a new client
- `generate(prompt: &str) -> Result<ChatResponse>` - Generate a response
- `generate_stream(prompt: &str) -> Result<ChatResponse>` - Stream a response
- `generate_structured<T>(messages, schema_name, description) -> Result<Option<T>>` - Generate structured output

### `ChatResponse`

Response from a chat completion.

#### Fields

- `prompt: String` - The original prompt
- `response: String` - The generated response
- `input_tokens: u32` - Number of input tokens
- `output_tokens: u32` - Number of output tokens
- `total_tokens: u32` - Total tokens used
- `duration: Duration` - Time taken
- `finish_reason: String` - Completion reason
- `tokens_per_sec: f64` - Generation speed

## Use Cases

### In Tauri Applications

Perfect for adding AI chat functionality to Tauri desktop apps:

```rust
use ai_client::{AiClient, Config};
use tauri::State;

#[tauri::command]
async fn chat(
    client: State<'_, AiClient>,
    message: String,
) -> Result<String, String> {
    let response = client
        .generate(&message)
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.response)
}
```

### CLI Tools

Use with the `playground` crate for CLI testing tools.

### Web Services

Integrate into web services for AI-powered features.

## License

MIT
