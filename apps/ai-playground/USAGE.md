# AI Playground Usage Guide

Complete guide for using the AI Playground CLI tool.

## Command Line Flags

| Flag             | Description                         | Example                              |
| ---------------- | ----------------------------------- | ------------------------------------ |
| `--concurrent`   | Run multiple prompts simultaneously | `bun run dev --concurrent "Q1" "Q2"` |
| `--batch <file>` | Load prompts from a text file       | `bun run dev --batch prompts.txt`    |
| `--no-stream`    | Skip the streaming test             | `bun run dev --no-stream "Hello"`    |

## Usage Patterns

### 1. Single Prompt (Default)

```bash
bun run dev "What is TypeScript?"
```

**Output includes:**

- Full response text
- Token usage (input, output, total)
- Cache statistics
- Performance metrics
- Streaming test (counts 1-5)

### 2. Multiple Prompts (Sequential)

```bash
bun run dev "Question 1" "Question 2" "Question 3"
```

**Behavior:**

- Processes prompts one after another
- Shows progress (1/3, 2/3, 3/3)
- Displays summary with total time and tokens

**Use when:**

- You want to see results as they come
- Order matters
- You're debugging

### 3. Multiple Prompts (Concurrent)

```bash
bun run dev --concurrent "Question 1" "Question 2" "Question 3"
```

**Behavior:**

- Sends all prompts at once
- Waits for all to complete
- Shows all results together
- Much faster than sequential

**Use when:**

- Speed is important
- Prompts are independent
- Testing throughput

**Performance Example:**

```
Sequential: 3 prompts × 800ms = 2400ms total
Concurrent: 3 prompts = 850ms total (3x faster!)
```

### 4. Batch Processing from File

Create `prompts.txt`:

```txt
# Comments start with #
What is the capital of France?
Explain quantum computing
Write a haiku about coding
```

Run it:

```bash
# Sequential
bun run dev --batch prompts.txt

# Concurrent (recommended for large batches)
bun run dev --concurrent --batch prompts.txt
```

**File format:**

- One prompt per line
- Lines starting with `#` are ignored
- Empty lines are skipped
- No quotes needed

## Environment Variables

Set these in `.env` file or export them:

```bash
# Required
AI_BASE_URL=http://localhost:12434/engines/v1
AI_MODEL=gemma4

# Optional
AI_API_KEY=not-needed
```

### Switching Models

```bash
# Use different model
export AI_MODEL=qwen3-vl
bun run dev "Your prompt"

# Or inline
AI_MODEL=embeddinggemma bun run dev "Generate embeddings"
```

## Output Interpretation

### Token Statistics

```
Input tokens: 28        # Tokens in your prompt + system message
Output tokens: 36       # Tokens in the response
Total tokens: 64        # Sum of input + output
```

### Cache Information

```
Input details:
  - No cache: 28        # Fresh tokens processed
  - Cache read: 0       # Tokens loaded from cache
  - Cache write: 0      # Tokens saved to cache
```

**Cache benefits:**

- Faster responses
- Lower cost (on paid APIs)
- Appears when using same context repeatedly

### Performance Metrics

```
Duration: 799ms         # Time from request to response
Tokens/sec: 45.06       # Output tokens per second
```

**Good performance:**

- Local models: 30-80 tokens/sec
- Cloud APIs: 50-150 tokens/sec
- Depends on model size and hardware

### Concurrent Summary

```
Total prompts: 5
Total duration: 28579ms          # Wall clock time
Average per prompt: 5715.80ms    # Total / count
Throughput: 0.17 prompts/sec     # Prompts / second
Total tokens: 5042               # Sum of all tokens
```

## Common Use Cases

### 1. Quick Model Test

```bash
bun run dev "Hello!"
```

### 2. Compare Responses

```bash
bun run dev --concurrent \
  "Explain AI in simple terms" \
  "Explain AI in technical terms" \
  "Explain AI to a 5-year-old"
```

### 3. Batch Translation

Create `translate.txt`:

```txt
Translate to Spanish: Hello
Translate to French: Hello
Translate to German: Hello
```

```bash
bun run dev --concurrent --batch translate.txt
```

### 4. Performance Testing

```bash
# Test throughput with 10 identical prompts
bun run dev --concurrent \
  "Test" "Test" "Test" "Test" "Test" \
  "Test" "Test" "Test" "Test" "Test"
```

### 5. Skip Streaming (Faster)

```bash
bun run dev --no-stream "Your prompt"
```

## Tips & Tricks

### 1. Escaping Special Characters

```bash
# Use quotes for prompts with spaces or special chars
bun run dev "What's the difference between 'let' and 'const'?"

# Or escape them
bun run dev What\'s the difference
```

### 2. Long Prompts

```bash
# Use a file for very long prompts
echo "Your very long prompt here..." > prompt.txt
bun run dev --batch prompt.txt
```

### 3. Timing Comparison

```bash
# Sequential
time bun run dev "Q1" "Q2" "Q3"

# Concurrent
time bun run dev --concurrent "Q1" "Q2" "Q3"
```

### 4. Redirect Output

```bash
# Save results to file
bun run dev "Your prompt" > output.txt

# Append to file
bun run dev "Your prompt" >> results.txt
```

### 5. Pipe from Other Commands

```bash
# Generate prompts dynamically
echo -e "Question 1\nQuestion 2" | bun run dev --batch /dev/stdin
```

## Troubleshooting

### "Connection refused"

```bash
# Check if model server is running
curl http://localhost:12434/engines/v1/models

# Check Docker Model Runner
docker model ls
```

### "Model not found"

```bash
# List available models
curl http://localhost:12434/engines/v1/models | jq

# Or
docker model ls
```

### Slow responses

- Check model size (larger = slower)
- Check system resources (CPU/GPU usage)
- Try smaller model: `AI_MODEL=gemma2:2b`
- Use concurrent mode for multiple prompts

### Out of memory

- Use smaller model
- Reduce context size in docker-compose.yml
- Process fewer prompts concurrently

## Advanced Examples

### Benchmark Different Models

```bash
#!/bin/bash
for model in gemma4 qwen3-vl embeddinggemma; do
  echo "Testing $model..."
  AI_MODEL=$model bun run dev --no-stream "Hello" 2>&1 | grep "Tokens/sec"
done
```

### Automated Testing

```bash
#!/bin/bash
# Test all prompts in a directory
for file in prompts/*.txt; do
  echo "Processing $file..."
  bun run dev --concurrent --batch "$file" > "results/$(basename $file .txt).txt"
done
```

### JSON Output (Custom)

Modify the code to output JSON for programmatic use:

```typescript
// Add --json flag support
if (flags.json) {
  console.log(
    JSON.stringify({
      prompt,
      response: result.text,
      usage: result.usage,
      duration,
    }),
  );
}
```

## Performance Benchmarks

Based on gemma4 (7.52B) on typical hardware:

| Scenario         | Sequential | Concurrent | Speedup |
| ---------------- | ---------- | ---------- | ------- |
| 3 short prompts  | ~2.4s      | ~0.8s      | 3x      |
| 5 medium prompts | ~15s       | ~5s        | 3x      |
| 10 short prompts | ~8s        | ~1.2s      | 6.7x    |

**Note:** Actual speedup depends on:

- Model size
- Hardware (CPU/GPU)
- Prompt complexity
- Server load
