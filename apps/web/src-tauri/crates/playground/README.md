# AI Playground (Rust)

A high-performance Rust CLI tool for testing OpenAI-compatible AI models with support for concurrent execution, streaming, and benchmarking.

## Features

- ✅ **Single & Batch Execution**: Test one prompt or many
- ✅ **Concurrent Processing**: Execute multiple prompts in parallel with configurable limits
- ✅ **Streaming Support**: Real-time response streaming
- ✅ **Structured Outputs**: Generate JSON responses with schema validation
- ✅ **Performance Benchmarking**: Compare sequential vs concurrent execution
- ✅ **Token Tracking**: Monitor input/output/total token usage
- ✅ **Beautiful CLI**: Colored output with formatted tables
- ✅ **OpenAI Compatible**: Works with any OpenAI-compatible API endpoint

## Installation

```bash
# Build the binary
cargo build --release

# The binary will be at target/release/playground
```

## Usage

### Single Prompt

```bash
# Basic usage
playground "Hello, how are you?"

# Skip streaming test
playground "Hello" --no-stream
```

### Multiple Prompts (Sequential)

```bash
playground "Prompt 1" "Prompt 2" "Prompt 3"
```

### Concurrent Execution

```bash
# Run with default concurrency limit (5)
playground --concurrent "Prompt 1" "Prompt 2" "Prompt 3"

# Custom concurrency limit
playground --concurrent --limit 10 "Prompt 1" "Prompt 2" "Prompt 3"
```

### Batch from File

```bash
# Read prompts from file (one per line)
playground --batch prompts.txt

# Concurrent batch processing
playground --batch prompts.txt --concurrent --limit 10
```

### Benchmark Mode

```bash
# Compare sequential vs concurrent performance
playground --benchmark "Prompt 1" "Prompt 2" "Prompt 3"
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

## Prompt File Format

Create a text file with one prompt per line:

```text
# This is a comment (lines starting with # are ignored)
What is the capital of France?
Explain quantum computing in simple terms.
Write a haiku about programming.

# Empty lines are also ignored
Tell me a joke.
```

## Examples

### Example 1: Quick Test

```bash
playground "What is Rust?"
```

Output:

```
🤖 AI Playground - OpenAI-Compatible Model Test

======================================================================
📊 Configuration:
   Base URL: http://localhost:12434/engines/v1
   Model: gemma4
   API Key: not-needed
   Concurrency limit: 5
======================================================================

💬 Prompt:
   "What is Rust?"
======================================================================
✅ Response:
----------------------------------------------------------------------
Rust is a systems programming language...
----------------------------------------------------------------------

┌─────────────────┬──────────┐
│ Metric          │ Value    │
├─────────────────┼──────────┤
│ Input tokens    │ 15       │
│ Output tokens   │ 120      │
│ Total tokens    │ 135      │
│ Duration        │ 1.2s     │
│ Tokens/sec      │ 100.00   │
│ Finish reason   │ stop     │
└─────────────────┴──────────┘
```

### Example 2: Concurrent Execution

```bash
playground --concurrent --limit 3 \
  "What is AI?" \
  "Explain machine learning" \
  "What is deep learning?"
```

### Example 3: Benchmark

```bash
playground --benchmark \
  "Prompt 1" \
  "Prompt 2" \
  "Prompt 3" \
  "Prompt 4" \
  "Prompt 5"
```

Output includes:

- Sequential execution results
- Concurrent execution results
- Performance comparison table
- Speedup analysis

## Performance

Compared to the TypeScript version:

| Metric          | TypeScript (Bun) | Rust          | Improvement   |
| --------------- | ---------------- | ------------- | ------------- |
| Startup Time    | ~200ms           | ~50ms         | **4x faster** |
| Memory Usage    | ~30MB            | ~5MB          | **6x less**   |
| Binary Size     | N/A (runtime)    | ~8MB          | Single binary |
| Concurrent Perf | Network-bound    | Network-bound | Similar       |

## Development

### Build

```bash
cargo build
```

### Run

```bash
cargo run -- "Your prompt here"
```

### Run Examples

```bash
# Structured output example
cargo run --example structured_output
```

### Test

```bash
cargo test
```

### Format

```bash
cargo fmt
```

### Lint

```bash
cargo clippy
```

## Architecture

```
src/
├── lib.rs          # Library exports
├── main.rs         # CLI entry point
├── client.rs       # OpenAI client wrapper
├── config.rs       # Configuration management
├── executor.rs     # Prompt execution logic
├── display.rs      # Terminal output formatting
└── types.rs        # Shared types and structs
```

## Dependencies

- `async-openai` - OpenAI API client
- `tokio` - Async runtime
- `clap` - CLI argument parsing
- `colored` - Terminal colors
- `comfy-table` - Beautiful tables
- `humantime` - Duration formatting
- `anyhow` - Error handling
- `serde` - Serialization

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
