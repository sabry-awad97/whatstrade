# AI Playground Rust Implementation Research

## Overview

This document outlines the research and planning for rewriting the TypeScript AI Playground (`apps/ai-playground`) as a Rust crate within the Tauri workspace at `apps/web/src-tauri/crates/playground`.

## Current TypeScript Implementation Analysis

### Features

- ✅ Single prompt generation with streaming
- ✅ Concurrent prompt execution with p-limit
- ✅ Batch processing from file
- ✅ Sequential vs Concurrent benchmarking
- ✅ Beautiful CLI tables with statistics
- ✅ Token usage tracking (input/output/total)
- ✅ Performance metrics (duration, tokens/sec, throughput)
- ✅ Colored terminal output
- ✅ OpenAI-compatible API support

### Command-Line Interface

```bash
# Single prompt
bun run src/index.ts "Your prompt"

# Concurrent execution
bun run src/index.ts --concurrent "Prompt 1" "Prompt 2" "Prompt 3"

# Batch from file
bun run src/index.ts --batch prompts.txt

# Benchmark mode
bun run src/index.ts --benchmark "Prompt 1" "Prompt 2"

# Flags
--concurrent    # Run prompts concurrently
--batch FILE    # Read prompts from file
--no-stream     # Skip streaming test
--benchmark     # Compare sequential vs concurrent
--limit N       # Set concurrency limit (default: 5)
```

### Configuration (Environment Variables)

- `AI_BASE_URL` - Model endpoint (default: http://localhost:12434/engines/v1)
- `AI_MODEL` - Model name (default: gemma4)
- `AI_API_KEY` - API key (default: not-needed)
- `CONCURRENCY_LIMIT` - Default concurrency (default: 5)

## Rust Crate Ecosystem Research

### 1. OpenAI API Client

**UPDATE: async-openai v0.40+ API Changes**

The `async-openai` crate underwent significant API changes in v0.40, moving from chat completions to a "responses" API. The new API structure is:

- `client.responses().create()` instead of `client.chat().create()`
- Different message types and request builders
- Requires `_api` feature flag

**Recommended Alternative: `openai_dive`**

- **Crate**: [openai_dive](https://crates.io/crates/openai_dive)
- **Latest Version**: 0.5+
- **Repository**: https://github.com/tjardoo/openai-client
- **Documentation**: https://docs.rs/openai_dive

**Key Features:**

- ✅ Stable, well-documented API
- ✅ Full chat completions support
- ✅ Streaming support (SSE)
- ✅ Custom base URL support
- ✅ Async/await with tokio
- ✅ Type-safe request/response
- ✅ Active maintenance

**Usage Pattern:**

```rust
use openai_dive::v1::{api::Client, resources::chat::{ChatCompletionParameters, ChatMessage, ChatMessageContent}};

let client = Client::new_from_env(); // or Client::new(api_key)

let parameters = ChatCompletionParameters {
    model: "gpt-4".to_string(),
    messages: vec![
        ChatMessage::User {
            content: ChatMessageContent::Text("Hello!".to_string()),
            name: None,
        },
    ],
    ..Default::default()
};

let response = client.chat().create(parameters).await?;
```

**Primary Choice (if sticking with async-openai): `async-openai` v0.23**

- Last stable version before API breaking changes
- Well-tested and documented
- Use version `0.23` instead of `0.40+`

### 1. OpenAI API Client (Original Research - async-openai v0.23)

**Primary Choice: `async-openai` v0.40+**

- **Crate**: [async-openai](https://crates.io/crates/async-openai)
- **Latest Version**: 0.40.2 (as of research date)
- **Repository**: https://github.com/64bit/async-openai
- **Documentation**: https://docs.rs/async-openai

**Key Features:**

- ✅ Full OpenAI API coverage
- ✅ Streaming support (SSE)
- ✅ Ergonomic builder pattern
- ✅ Async/await with tokio
- ✅ Automatic retry with exponential backoff
- ✅ Custom base URL support (for OpenAI-compatible endpoints)
- ✅ Type-safe request/response handling

**Usage Pattern (v0.40+):**

```rust
use async_openai::{Client, types::{CreateChatCompletionRequestArgs, ChatCompletionRequestMessage}};
use async_openai::config::OpenAIConfig;

// Custom endpoint configuration
let config = OpenAIConfig::new()
    .with_api_key("not-needed")
    .with_api_base("http://localhost:12434/engines/v1");

let client = Client::with_config(config);

// Create chat completion
let request = CreateChatCompletionRequestArgs::default()
    .model("gemma4")
    .messages(vec![
        ChatCompletionRequestMessage::System {
            content: "You are a helpful assistant".into(),
            name: None,
        },
        ChatCompletionRequestMessage::User {
            content: "Hello!".into(),
            name: None,
        },
    ])
    .build()?;

let response = client.chat().create(request).await?;

// Streaming
let stream = client.chat().create_stream(request).await?;
while let Some(result) = stream.next().await {
    match result {
        Ok(response) => {
            for choice in response.choices {
                if let Some(content) = choice.delta.content {
                    print!("{}", content);
                }
            }
        }
        Err(err) => eprintln!("Error: {}", err),
    }
}
```

**Alternative: `openai-api-rs`**

- Simpler but less feature-complete
- Good for basic use cases
- Less active maintenance

### 2. CLI Argument Parsing

**Primary Choice: `clap` v4+**

- **Crate**: [clap](https://crates.io/crates/clap)
- **Latest Version**: 4.5+
- **Features**: Derive macros, subcommands, validation

**Usage Pattern:**

```rust
use clap::Parser;

#[derive(Parser, Debug)]
#[command(name = "ai-playground")]
#[command(about = "Test OpenAI-compatible models", long_about = None)]
struct Args {
    /// Prompts to process
    #[arg(value_name = "PROMPT")]
    prompts: Vec<String>,

    /// Run prompts concurrently
    #[arg(long)]
    concurrent: bool,

    /// Read prompts from file
    #[arg(long, value_name = "FILE")]
    batch: Option<String>,

    /// Skip streaming test
    #[arg(long)]
    no_stream: bool,

    /// Benchmark sequential vs concurrent
    #[arg(long)]
    benchmark: bool,

    /// Concurrency limit
    #[arg(long, default_value = "5")]
    limit: usize,
}
```

### 3. Terminal Colors & Formatting

**Primary Choice: `colored` v2+**

- **Crate**: [colored](https://crates.io/crates/colored)
- **Latest Version**: 2.1+
- **Features**: ANSI colors, styles, cross-platform

**Usage Pattern:**

```rust
use colored::*;

println!("{}", "Success!".green().bold());
println!("{}", "Warning".yellow());
println!("{}", "Error".red());
```

**Alternative: `owo-colors`**

- More modern API
- Better performance
- Compile-time color support

### 4. CLI Tables

**Primary Choice: `comfy-table` v7+**

- **Crate**: [comfy-table](https://crates.io/crates/comfy-table)
- **Latest Version**: 7.1+
- **Features**: Beautiful tables, automatic wrapping, styling

**Usage Pattern:**

```rust
use comfy_table::*;

let mut table = Table::new();
table
    .set_header(vec!["Prompt", "Input", "Output", "Duration"])
    .add_row(vec!["Hello", "10", "50", "1.2s"]);

println!("{table}");
```

**Alternative: `cli-table`**

- Derive-based API
- Good for struct-based tables

### 5. Async Runtime & Concurrency

**Primary Choice: `tokio` v1.52+**

- **Crate**: [tokio](https://crates.io/crates/tokio)
- **Latest Version**: 1.52+
- **Features**: Full async runtime, channels, timers

**Concurrency Pattern:**

```rust
use tokio::task::JoinSet;
use futures::stream::{self, StreamExt};

// Concurrent with limit (like p-limit)
let results: Vec<_> = stream::iter(prompts)
    .map(|prompt| async move {
        generate_for_prompt(client, prompt).await
    })
    .buffer_unordered(limit) // Concurrency limit
    .collect()
    .await;
```

**Alternative: `futures::stream::FuturesUnordered`**

- Lower-level control
- No built-in limit

### 6. Time & Duration Formatting

**Primary Choice: `humantime` v2+**

- **Crate**: [humantime](https://crates.io/crates/humantime)
- **Latest Version**: 2.1+
- **Features**: Human-readable durations

**Usage Pattern:**

```rust
use humantime::format_duration;
use std::time::Duration;

let duration = Duration::from_millis(1234);
println!("{}", format_duration(duration)); // "1s 234ms"
```

**Alternative: Custom formatting**

```rust
fn format_duration(duration: Duration) -> String {
    let ms = duration.as_millis();
    if ms < 1000 {
        format!("{}ms", ms)
    } else if ms < 60_000 {
        format!("{:.2}s", ms as f64 / 1000.0)
    } else {
        format!("{:.2}m", ms as f64 / 60_000.0)
    }
}
```

### 7. Error Handling

**Primary Choice: `anyhow` v1+**

- **Crate**: [anyhow](https://crates.io/crates/anyhow)
- **Latest Version**: 1.0+
- **Features**: Easy error propagation, context

**Usage Pattern:**

```rust
use anyhow::{Context, Result};

fn load_prompts(path: &str) -> Result<Vec<String>> {
    let content = std::fs::read_to_string(path)
        .context(format!("Failed to read file: {}", path))?;

    Ok(content
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && !s.starts_with('#'))
        .collect())
}
```

**Alternative: `thiserror`**

- For library crates
- Custom error types
- Already in workspace dependencies

### 8. Serialization

**Primary Choice: `serde` + `serde_json`**

- Already in workspace dependencies
- Industry standard
- Full JSON support

### 9. File I/O

**Standard Library: `std::fs`**

- Sufficient for reading prompt files
- No additional dependencies needed

```rust
use std::fs;

fn load_prompts_from_file(filename: &str) -> Result<Vec<String>> {
    let content = fs::read_to_string(filename)?;
    Ok(content
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .collect())
}
```

## Recommended Dependencies

### Core Dependencies

```toml
[dependencies]
# OpenAI API
async-openai = "0.40"

# Async runtime
tokio = { version = "1.52", features = ["full"] }
futures = "0.3"

# CLI
clap = { version = "4.5", features = ["derive"] }

# Terminal UI
colored = "2.1"
comfy-table = "7.1"

# Utilities
anyhow = "1.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
humantime = "2.1"

# Performance tracking
tokio-metrics = "0.3" # Optional: for detailed metrics
```

### Development Dependencies

```toml
[dev-dependencies]
tokio-test = "0.4"
mockito = "1.2" # For mocking HTTP endpoints
```

## Architecture Design

### Module Structure

```
crates/playground/
├── Cargo.toml
├── RESEARCH.md (this file)
├── README.md
└── src/
    ├── lib.rs           # Library exports
    ├── main.rs          # CLI entry point
    ├── client.rs        # OpenAI client wrapper
    ├── config.rs        # Configuration management
    ├── executor.rs      # Prompt execution logic
    ├── benchmark.rs     # Benchmarking functionality
    ├── display.rs       # Terminal output formatting
    └── types.rs         # Shared types and structs
```

### Key Types

```rust
// types.rs
use std::time::Duration;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct Config {
    pub base_url: String,
    pub model: String,
    pub api_key: String,
    pub concurrency_limit: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptResult {
    pub prompt: String,
    pub response: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub total_tokens: u32,
    pub duration: Duration,
    pub finish_reason: String,
}

#[derive(Debug)]
pub struct ExecutionSummary {
    pub total_prompts: usize,
    pub total_duration: Duration,
    pub total_tokens: u32,
    pub results: Vec<PromptResult>,
}

#[derive(Debug)]
pub struct BenchmarkResult {
    pub sequential: ExecutionSummary,
    pub concurrent: ExecutionSummary,
    pub speedup: f64,
}
```

### Execution Modes

1. **Single Mode**: Execute one prompt with optional streaming
2. **Sequential Mode**: Execute multiple prompts one by one
3. **Concurrent Mode**: Execute multiple prompts with concurrency limit
4. **Benchmark Mode**: Compare sequential vs concurrent performance

## Implementation Plan

### Phase 1: Project Setup

- [ ] Create crate structure
- [ ] Add dependencies to Cargo.toml
- [ ] Set up basic CLI with clap
- [ ] Configure environment variable loading

### Phase 2: Core Functionality

- [ ] Implement OpenAI client wrapper
- [ ] Create prompt execution logic
- [ ] Add streaming support
- [ ] Implement token usage tracking

### Phase 3: Execution Modes

- [ ] Single prompt execution
- [ ] Sequential execution
- [ ] Concurrent execution with limit
- [ ] Batch file loading

### Phase 4: Display & Formatting

- [ ] Create table formatters
- [ ] Add colored output
- [ ] Implement progress indicators
- [ ] Format duration and metrics

### Phase 5: Benchmarking

- [ ] Sequential benchmark
- [ ] Concurrent benchmark
- [ ] Comparison table
- [ ] Performance analysis

### Phase 6: Testing & Documentation

- [ ] Unit tests
- [ ] Integration tests
- [ ] CLI documentation
- [ ] Usage examples

## Performance Considerations

### Advantages of Rust Implementation

1. **Compiled Performance**: 10-100x faster startup time
2. **Memory Efficiency**: Lower memory footprint
3. **Native Concurrency**: Better thread management with tokio
4. **Single Binary**: No runtime dependencies
5. **Type Safety**: Compile-time error checking

### Expected Performance Gains

- **Startup**: ~50ms (Rust) vs ~200ms (Bun)
- **Memory**: ~5MB (Rust) vs ~30MB (Bun)
- **Concurrent Execution**: Similar (network-bound)
- **File I/O**: 2-3x faster

## Migration Strategy

### Compatibility

- Maintain same CLI interface
- Support same environment variables
- Produce similar output format
- Keep same feature set

### Testing

- Compare output with TypeScript version
- Validate token counts match
- Verify timing accuracy
- Test edge cases

## Open Questions

1. **Streaming Display**: How to handle real-time streaming output in tables?
   - Option A: Print chunks as they arrive
   - Option B: Buffer and display after completion
   - **Recommendation**: Option A for better UX

2. **Progress Indicators**: Should we add progress bars for long operations?
   - Use `indicatif` crate for spinners/progress bars
   - **Recommendation**: Yes, for batch operations

3. **Output Format**: Support JSON output for scripting?
   - Add `--json` flag for machine-readable output
   - **Recommendation**: Yes, useful for automation

4. **Error Recovery**: How to handle partial failures in batch mode?
   - Continue on error vs fail fast
   - **Recommendation**: Continue with error reporting

## References

### Crate Documentation

- [async-openai docs](https://docs.rs/async-openai)
- [clap docs](https://docs.rs/clap)
- [comfy-table docs](https://docs.rs/comfy-table)
- [tokio docs](https://docs.rs/tokio)

### Examples & Tutorials

- [async-openai examples](https://github.com/64bit/async-openai/tree/main/examples)
- [Rust CLI book](https://rust-cli.github.io/book/)
- [Tokio tutorial](https://tokio.rs/tokio/tutorial)

### Related Projects

- [openai-stream-rust-demo](https://github.com/a-poor/openai-stream-rust-demo)
- [rs_openai](https://crates.io/crates/rs_openai)

## Next Steps

1. ✅ Complete research document
2. ⏳ Create crate scaffold with `cargo new`
3. ⏳ Add dependencies with `cargo add`
4. ⏳ Implement basic CLI structure
5. ⏳ Port core functionality
6. ⏳ Add tests and documentation
7. ⏳ Performance benchmarking
8. ⏳ Integration with Tauri workspace

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-29  
**Status**: Research Complete, Ready for Implementation
