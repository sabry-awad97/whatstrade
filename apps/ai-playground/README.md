# AI Playground

Simple CLI tool to test OpenAI-compatible AI models with the AI SDK.

## Features

- ✅ Single prompt execution with detailed statistics
- ✅ Multiple prompts (sequential or concurrent)
- ✅ **Controlled concurrency with p-limit** - Prevent server overload
- ✅ Batch processing from text files
- ✅ **Benchmark mode** - Compare sequential vs concurrent performance
- ✅ Streaming text generation
- ✅ Detailed token usage (input, output, cache, reasoning)
- ✅ Performance metrics (tokens/sec, throughput)
- ✅ **Beautiful colored output** with tables (picocolors + cli-table3)
- ✅ **Human-readable durations** (pretty-ms)
- ✅ Works with any OpenAI-compatible API (Docker Model Runner, Ollama, OpenAI, etc.)

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Run with default prompt
bun run dev

# Run with custom prompt
bun run dev "What is the capital of France?"

# Run multiple prompts concurrently
bun run dev --concurrent "Prompt 1" "Prompt 2" "Prompt 3"

# Run prompts from a file
bun run dev --batch prompts.txt

# Benchmark: Compare sequential vs concurrent performance
bun run dev --benchmark "Prompt 1" "Prompt 2" "Prompt 3"

# Control concurrency limit (default: 5)
bun run dev --concurrent --limit 2 "Prompt 1" "Prompt 2" "Prompt 3"

# Skip streaming test
bun run dev --no-stream "Your prompt"
```

## Configuration

The playground is configured to use Docker Model Runner by default.

Set environment variables in `.env` file:

```bash
AI_BASE_URL=http://localhost:12434/engines/v1
AI_MODEL=gemma4
AI_API_KEY=not-needed
```

### Check Available Models

```bash
# List models in Docker Model Runner
docker model ls

# Or via API
curl http://localhost:12434/engines/v1/models
```

## Examples

### Benchmark Mode (Recommended!)

Compare sequential vs concurrent performance with beautiful tables:

```bash
bun run dev --benchmark "What is 2+2?" "What is the capital of Spain?" "Name a color"
```

**Example output:**

```
⚡ Performance Comparison

┌────────────────┬──────────────────┬───────────────────┬─────────┐
│ Metric         │ Sequential       │ Concurrent        │ Speedup │
├────────────────┼──────────────────┼───────────────────┼─────────┤
│ Total Duration │ 611 milliseconds │ 213 milliseconds  │ 2.86x   │
├────────────────┼──────────────────┼───────────────────┼─────────┤
│ Avg per Prompt │ 204 milliseconds │ 71 milliseconds   │ 2.86x   │
├────────────────┼──────────────────┼───────────────────┼─────────┤
│ Throughput     │ 4.91 prompts/sec │ 14.05 prompts/sec │ 2.86x   │
└────────────────┴──────────────────┴───────────────────┴─────────┘

🏆 Verdict:
   Concurrent is 2.86x faster - Highly recommended! 🚀
```

### Single Prompt

```bash
bun run dev "Hello!"
```

### Multiple Prompts (Sequential)

```bash
# Runs prompts one after another
bun run dev "What is 2+2?" "What is the capital of Spain?" "Name a color"
```

### Multiple Prompts (Concurrent)

```bash
# Runs all prompts at the same time - much faster!
bun run dev --concurrent "What is 2+2?" "What is the capital of Spain?" "Name a color"
```

### Multiple Prompts (Concurrent)

```bash
# Runs all prompts at the same time - much faster!
bun run dev --concurrent "What is 2+2?" "What is the capital of Spain?" "Name a color"
```

**Performance comparison:**

- Sequential: ~2 seconds for 3 prompts (one at a time)
- Concurrent: ~600ms for 3 prompts (all at once)

### Batch Processing from File

Create a `prompts.txt` file:

```txt
# My prompts
What is the capital of France?
Explain quantum computing
Write a haiku about coding
```

Run it:

```bash
# Sequential
bun run dev --batch prompts.txt

# Concurrent (faster)
bun run dev --concurrent --batch prompts.txt
```

### Test with Docker Model Runner (Default)

```bash
# Check available models
docker model ls

# Run with default model (gemma4)
bun run dev "Hello!"

# Use a different model
export AI_MODEL=qwen3-vl
bun run dev "Describe this image"

# Use embedding model
export AI_MODEL=embeddinggemma
bun run dev "Generate embeddings"
```

### Test with OpenAI

```bash
export AI_BASE_URL=https://api.openai.com/v1
export AI_MODEL=gpt-4o-mini
export AI_API_KEY=sk-your-key-here

bun run dev "Hello!"
```

### Test with Ollama

```bash
# Start Ollama (if not running)
ollama serve

# Configure
export AI_BASE_URL=http://localhost:11434/v1
export AI_MODEL=gemma2:2b

# Run
bun run dev "Hello!"
```

## What it does

The playground supports three modes:

1. **Single Prompt**: Sends one prompt and displays the response with statistics + streaming test
2. **Sequential Multiple**: Processes multiple prompts one after another
3. **Concurrent Multiple**: Processes all prompts simultaneously (much faster!)

## Output Example

### Single Prompt

```
🤖 AI Playground - OpenAI-Compatible Model Test

============================================================

📊 Configuration:
   Base URL: http://localhost:12434/engines/v1
   Model: gemma4
   API Key: not-needed

============================================================

💬 Prompt:
   "Hello! How are you?"

============================================================

🔄 Generating response...

✅ Response:
------------------------------------------------------------
Hello! I'm doing well, thank you for asking...
------------------------------------------------------------

📈 Statistics:
   Input tokens: 28
   Output tokens: 36
   Total tokens: 64
   Input details:
     - No cache: 28
     - Cache read: 0
   Output details:
     - Text: 36
     - Reasoning: 0
   Finish reason: stop
   Duration: 799ms
   Tokens/sec: 45.06

============================================================

🌊 Testing streaming...

✅ Stream output:
------------------------------------------------------------
1
2
3
4
5
------------------------------------------------------------

✅ All tests completed successfully!
```

### Concurrent Execution

```
🚀 Running 3 prompts concurrently...

============================================================

📝 Prompt 1:
   "What is 2+2?"

✅ Response:
------------------------------------------------------------
2 + 2 equals **4**.
------------------------------------------------------------

📈 Statistics:
   Input tokens: 29
   Output tokens: 9
   Total tokens: 38
   Duration: 594ms
   Tokens/sec: 15.15
   Finish reason: stop

============================================================

📝 Prompt 2:
   "What is the capital of Spain?"

✅ Response:
------------------------------------------------------------
The capital of Spain is **Madrid**.
------------------------------------------------------------

📈 Statistics:
   Input tokens: 29
   Output tokens: 9
   Total tokens: 38
   Duration: 607ms
   Tokens/sec: 14.83
   Finish reason: stop

============================================================

📝 Prompt 3:
   "Name a programming language"

✅ Response:
------------------------------------------------------------
Python
------------------------------------------------------------

📈 Statistics:
   Input tokens: 26
   Output tokens: 2
   Total tokens: 28
   Duration: 499ms
   Tokens/sec: 4.01
   Finish reason: stop

============================================================

📊 Concurrent Execution Summary:
   Total prompts: 3
   Total duration: 610ms
   Average per prompt: 203.33ms
   Throughput: 4.92 prompts/sec
   Total tokens: 104

✅ All tests completed successfully!
```

## Troubleshooting

### Connection refused

Make sure your model server is running:

- **Ollama**: `ollama serve` (default port 11434)
- **Docker Model Runner**: Check Docker Desktop settings
- **Other**: Verify the server is running on the configured port

### Model not found

Ensure the model name matches what's available on your server:

- **Ollama**: `ollama list`
- **Docker Model Runner**: `docker model ls`

### API key errors

For local models, use `AI_API_KEY=not-needed`. For cloud APIs, provide a valid key.
