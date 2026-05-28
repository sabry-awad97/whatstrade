/**
 * AI Playground - Test OpenAI-Compatible Models (CLI)
 *
 * Simple CLI tool to test AI model inference with any OpenAI-compatible endpoint.
 *
 * Usage:
 *   bun run src/index.ts
 *   bun run src/index.ts "Your custom prompt here"
 *   bun run src/index.ts --concurrent "Prompt 1" "Prompt 2" "Prompt 3"
 *   bun run src/index.ts --batch prompts.txt
 *   bun run src/index.ts --benchmark "Prompt 1" "Prompt 2" "Prompt 3"
 *
 * Flags:
 *   --concurrent  Run multiple prompts concurrently (with p-limit)
 *   --batch       Read prompts from a file (one per line)
 *   --no-stream   Skip streaming test
 *   --benchmark   Compare sequential vs concurrent performance
 *   --limit N     Set concurrency limit (default: 5)
 *
 * Environment Variables:
 *   AI_BASE_URL - Model endpoint URL (default: http://localhost:12434/engines/v1)
 *   AI_MODEL - Model name (default: gemma4)
 *   AI_API_KEY - API key (optional, default: not-needed)
 *   CONCURRENCY_LIMIT - Default concurrency limit (default: 5)
 */

import { generateText, streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { readFileSync } from "fs";
import pc from "picocolors";
import Table from "cli-table3";
import prettyMs from "pretty-ms";
import pLimit from "p-limit";

// Configuration from environment
const config = {
  baseUrl: process.env.AI_BASE_URL || "http://localhost:12434/engines/v1",
  model: process.env.AI_MODEL || "gemma4",
  apiKey: process.env.AI_API_KEY || "not-needed",
  concurrencyLimit: parseInt(process.env.CONCURRENCY_LIMIT || "5", 10),
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    concurrent: args.includes("--concurrent"),
    batch: args.includes("--batch"),
    noStream: args.includes("--no-stream"),
    benchmark: args.includes("--benchmark"),
  };

  const prompts: string[] = [];
  let batchFile: string | null = null;
  let limit = config.concurrencyLimit;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith("--")) {
      if (arg === "--batch" && args[i + 1] && !args[i + 1]?.startsWith("--")) {
        batchFile = args[i + 1] || null;
        i++; // Skip next arg
      } else if (arg === "--limit" && args[i + 1]) {
        limit = parseInt(args[i + 1] || "5", 10);
        i++; // Skip next arg
      }
      continue;
    }
    prompts.push(arg);
  }

  return { flags, prompts, batchFile, limit };
}

// Load prompts from file
function loadPromptsFromFile(filename: string): string[] {
  try {
    const content = readFileSync(filename, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch (error) {
    console.error(pc.red(`❌ Error reading file ${filename}:`), error);
    process.exit(1);
  }
}

// Generate text for a single prompt
async function generateForPrompt(
  model: any,
  prompt: string,
): Promise<{
  text: string;
  usage: any;
  duration: number;
  finishReason: string;
}> {
  const startTime = performance.now();
  const result = await generateText({
    model,
    prompt,
    system: "You are a helpful AI assistant.",
  });
  const duration = performance.now() - startTime;

  return {
    text: result.text,
    usage: result.usage,
    duration,
    finishReason: result.finishReason,
  };
}

// Create a pretty table for results
function createResultsTable() {
  return new Table({
    head: [
      pc.cyan("Prompt"),
      pc.cyan("Input"),
      pc.cyan("Output"),
      pc.cyan("Total"),
      pc.cyan("Duration"),
      pc.cyan("Tokens/sec"),
    ],
    style: {
      head: [],
      border: ["gray"],
    },
    colWidths: [40, 10, 10, 10, 15, 12],
    wordWrap: true,
  });
}

// Create a comparison table
function createComparisonTable() {
  return new Table({
    head: [
      pc.cyan("Metric"),
      pc.cyan("Sequential"),
      pc.cyan("Concurrent"),
      pc.cyan("Speedup"),
    ],
    style: {
      head: [],
      border: ["gray"],
    },
  });
}

// Truncate text for display
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// Run concurrent requests with p-limit
async function runConcurrent(
  model: any,
  prompts: string[],
  limitCount: number,
) {
  console.log(
    pc.bold(
      pc.blue(
        `\n🚀 Running ${prompts.length} prompts concurrently (limit: ${limitCount})...\n`,
      ),
    ),
  );

  const limit = pLimit(limitCount);
  const startTime = performance.now();

  const results = await Promise.all(
    prompts.map((prompt) => limit(() => generateForPrompt(model, prompt))),
  );

  const totalDuration = performance.now() - startTime;

  // Create results table
  const table = createResultsTable();

  results.forEach((result, index) => {
    const prompt = prompts[index];
    if (!prompt) return;

    const tokensPerSec = result.usage.outputTokens
      ? (result.usage.outputTokens / (result.duration / 1000)).toFixed(2)
      : "N/A";

    table.push([
      truncate(prompt, 37),
      result.usage.inputTokens ?? "N/A",
      result.usage.outputTokens ?? "N/A",
      result.usage.totalTokens ?? "N/A",
      pc.green(prettyMs(result.duration)),
      pc.yellow(tokensPerSec),
    ]);
  });

  console.log(table.toString());

  // Print summary
  const totalTokens = results.reduce(
    (sum, r) => sum + (r.usage.totalTokens ?? 0),
    0,
  );
  const avgDuration = totalDuration / prompts.length;

  console.log(pc.bold(pc.cyan("\n📊 Concurrent Execution Summary:")));
  console.log(`   Total prompts: ${pc.yellow(prompts.length.toString())}`);
  console.log(`   Concurrency limit: ${pc.yellow(limitCount.toString())}`);
  console.log(
    `   Total duration: ${pc.green(prettyMs(totalDuration, { verbose: true }))}`,
  );
  console.log(
    `   Average per prompt: ${pc.green(prettyMs(avgDuration, { verbose: true }))}`,
  );
  console.log(
    `   Throughput: ${pc.yellow((prompts.length / (totalDuration / 1000)).toFixed(2))} prompts/sec`,
  );
  console.log(`   Total tokens: ${pc.yellow(totalTokens.toString())}`);

  return { results, totalDuration, totalTokens };
}

// Run sequential requests
async function runSequential(model: any, prompts: string[]) {
  console.log(
    pc.bold(
      pc.blue(`\n📋 Running ${prompts.length} prompts sequentially...\n`),
    ),
  );

  const startTime = performance.now();
  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    if (!prompt) continue;

    console.log(
      pc.dim(
        `[${i + 1}/${prompts.length}] Processing: "${truncate(prompt, 50)}"`,
      ),
    );

    const result = await generateForPrompt(model, prompt);
    results.push(result);
  }

  const totalDuration = performance.now() - startTime;

  // Create results table
  const table = createResultsTable();

  results.forEach((result, index) => {
    const prompt = prompts[index];
    if (!prompt) return;

    const tokensPerSec = result.usage.outputTokens
      ? (result.usage.outputTokens / (result.duration / 1000)).toFixed(2)
      : "N/A";

    table.push([
      truncate(prompt, 37),
      result.usage.inputTokens ?? "N/A",
      result.usage.outputTokens ?? "N/A",
      result.usage.totalTokens ?? "N/A",
      pc.green(prettyMs(result.duration)),
      pc.yellow(tokensPerSec),
    ]);
  });

  console.log("\n" + table.toString());

  // Print summary
  const totalTokens = results.reduce(
    (sum, r) => sum + (r.usage.totalTokens ?? 0),
    0,
  );
  const avgDuration = totalDuration / prompts.length;

  console.log(pc.bold(pc.cyan("\n📊 Sequential Execution Summary:")));
  console.log(`   Total prompts: ${pc.yellow(prompts.length.toString())}`);
  console.log(
    `   Total duration: ${pc.green(prettyMs(totalDuration, { verbose: true }))}`,
  );
  console.log(
    `   Average per prompt: ${pc.green(prettyMs(avgDuration, { verbose: true }))}`,
  );
  console.log(`   Total tokens: ${pc.yellow(totalTokens.toString())}`);

  return { results, totalDuration, totalTokens };
}

// Run benchmark comparing sequential vs concurrent
async function runBenchmark(model: any, prompts: string[], limitCount: number) {
  console.log(
    pc.bold(
      pc.magenta(
        `\n⚡ Benchmarking ${prompts.length} prompts (Sequential vs Concurrent)\n`,
      ),
    ),
  );

  // Run sequential
  console.log(pc.bold(pc.blue("=".repeat(70))));
  console.log(pc.bold(pc.blue("Phase 1: Sequential Execution")));
  console.log(pc.bold(pc.blue("=".repeat(70))));
  const sequential = await runSequential(model, prompts);

  // Wait a bit between runs
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Run concurrent
  console.log(pc.bold(pc.blue("\n" + "=".repeat(70))));
  console.log(pc.bold(pc.blue("Phase 2: Concurrent Execution")));
  console.log(pc.bold(pc.blue("=".repeat(70))));
  const concurrent = await runConcurrent(model, prompts, limitCount);

  // Create comparison table
  console.log(pc.bold(pc.magenta("\n⚡ Performance Comparison\n")));

  const speedup =
    concurrent.totalDuration > 0
      ? sequential.totalDuration / concurrent.totalDuration
      : 0;
  const speedupColor =
    speedup > 2 ? pc.green : speedup > 1.5 ? pc.yellow : pc.red;

  const table = createComparisonTable();

  table.push(
    [
      "Total Duration",
      pc.blue(prettyMs(sequential.totalDuration, { verbose: true })),
      pc.green(prettyMs(concurrent.totalDuration, { verbose: true })),
      speedupColor(`${speedup.toFixed(2)}x`),
    ],
    [
      "Avg per Prompt",
      pc.blue(
        prettyMs(sequential.totalDuration / prompts.length, { verbose: true }),
      ),
      pc.green(
        prettyMs(concurrent.totalDuration / prompts.length, { verbose: true }),
      ),
      speedupColor(`${speedup.toFixed(2)}x`),
    ],
    [
      "Throughput",
      pc.blue(
        `${(prompts.length / (sequential.totalDuration / 1000)).toFixed(2)} prompts/sec`,
      ),
      pc.green(
        `${(prompts.length / (concurrent.totalDuration / 1000)).toFixed(2)} prompts/sec`,
      ),
      speedupColor(`${speedup.toFixed(2)}x`),
    ],
    [
      "Total Tokens",
      sequential.totalTokens.toString(),
      concurrent.totalTokens.toString(),
      "~",
    ],
  );

  console.log(table.toString());

  // Verdict
  console.log(pc.bold(pc.magenta("\n🏆 Verdict:")));
  if (speedup > 2) {
    console.log(
      pc.green(
        `   Concurrent is ${speedupColor(speedup.toFixed(2) + "x faster")} - Highly recommended! 🚀`,
      ),
    );
  } else if (speedup > 1.5) {
    console.log(
      pc.yellow(
        `   Concurrent is ${speedupColor(speedup.toFixed(2) + "x faster")} - Good improvement! ⚡`,
      ),
    );
  } else if (speedup > 1) {
    console.log(
      pc.yellow(
        `   Concurrent is ${speedupColor(speedup.toFixed(2) + "x faster")} - Marginal improvement.`,
      ),
    );
  } else {
    console.log(
      pc.red(
        `   Sequential is actually faster! This might indicate server-side queuing.`,
      ),
    );
  }
}

// Run single prompt
async function runSingle(model: any, prompt: string, skipStream: boolean) {
  console.log(pc.bold(pc.cyan("\n💬 Prompt:")));
  console.log(`   "${pc.white(prompt)}"`);
  console.log(pc.bold(pc.blue("\n" + "=".repeat(70))));
  console.log(pc.dim("🔄 Generating response...\n"));

  const result = await generateForPrompt(model, prompt);

  console.log(pc.bold(pc.green("✅ Response:")));
  console.log(pc.dim("-".repeat(70)));
  console.log(result.text);
  console.log(pc.dim("-".repeat(70)));

  // Create stats table
  const table = new Table({
    head: [pc.cyan("Metric"), pc.cyan("Value")],
    style: { head: [], border: ["gray"] },
  });

  table.push(
    ["Input tokens", result.usage.inputTokens?.toString() ?? "N/A"],
    ["Output tokens", result.usage.outputTokens?.toString() ?? "N/A"],
    ["Total tokens", result.usage.totalTokens?.toString() ?? "N/A"],
    ["Duration", pc.green(prettyMs(result.duration, { verbose: true }))],
    [
      "Tokens/sec",
      result.usage.outputTokens
        ? pc.yellow(
            (result.usage.outputTokens / (result.duration / 1000)).toFixed(2),
          )
        : "N/A",
    ],
    ["Finish reason", result.finishReason],
  );

  // Add detailed token info if available
  if (result.usage.inputTokenDetails) {
    const details = result.usage.inputTokenDetails;
    if (details.noCacheTokens !== undefined) {
      table.push(["  └─ No cache", details.noCacheTokens.toString()]);
    }
    if (details.cacheReadTokens !== undefined) {
      table.push(["  └─ Cache read", details.cacheReadTokens.toString()]);
    }
  }

  if (result.usage.outputTokenDetails) {
    const details = result.usage.outputTokenDetails;
    if (details.textTokens !== undefined) {
      table.push(["  └─ Text tokens", details.textTokens.toString()]);
    }
    if (details.reasoningTokens !== undefined) {
      table.push(["  └─ Reasoning", details.reasoningTokens.toString()]);
    }
  }

  console.log("\n" + table.toString());

  // Test streaming if not disabled
  if (!skipStream) {
    console.log(pc.bold(pc.blue("\n" + "=".repeat(70))));
    console.log(pc.bold(pc.cyan("🌊 Testing streaming...\n")));

    const streamResult = streamText({
      model,
      prompt: "Count from 1 to 5, one number per line.",
    });

    console.log(pc.dim("-".repeat(70)));

    for await (const chunk of streamResult.textStream) {
      process.stdout.write(chunk);
    }

    console.log("\n" + pc.dim("-".repeat(70)));
  }
}

async function main() {
  console.log(
    pc.bold(pc.cyan("🤖 AI Playground - OpenAI-Compatible Model Test\n")),
  );
  console.log(pc.bold(pc.blue("=".repeat(70))));

  // Show configuration
  console.log(pc.bold(pc.cyan("\n📊 Configuration:")));
  console.log(`   Base URL: ${pc.yellow(config.baseUrl)}`);
  console.log(`   Model: ${pc.yellow(config.model)}`);
  console.log(
    `   API Key: ${pc.dim(config.apiKey === "not-needed" ? "not-needed" : "***" + config.apiKey.slice(-4))}`,
  );
  console.log(
    `   Concurrency limit: ${pc.yellow(config.concurrencyLimit.toString())}`,
  );

  // Parse arguments
  const { flags, prompts: argPrompts, batchFile, limit } = parseArgs();

  // Determine prompts to use
  let prompts: string[] = [];

  if (batchFile) {
    prompts = loadPromptsFromFile(batchFile);
    console.log(
      pc.green(`\n📄 Loaded ${prompts.length} prompts from ${batchFile}`),
    );
  } else if (argPrompts.length > 0) {
    prompts = argPrompts;
  } else {
    prompts = ["Hello! Please introduce yourself and tell me what you can do."];
  }

  console.log(pc.bold(pc.blue("\n" + "=".repeat(70))));

  try {
    // Create OpenAI-compatible client
    const client = createOpenAICompatible({
      name: "ai-provider",
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    const model = client(config.model);

    // Run based on mode
    if (flags.benchmark && prompts.length > 1) {
      await runBenchmark(model, prompts, limit);
    } else if (prompts.length > 1 && flags.concurrent) {
      await runConcurrent(model, prompts, limit);
    } else if (prompts.length > 1) {
      await runSequential(model, prompts);
    } else {
      await runSingle(model, prompts[0] || "", flags.noStream);
    }

    console.log(pc.bold(pc.green("\n✅ All tests completed successfully!\n")));
  } catch (error) {
    console.error(pc.bold(pc.red("\n❌ Error during generation:")));
    console.error(
      pc.red(error instanceof Error ? error.message : "Unknown error"),
    );
    console.error(pc.dim("\nFull error:"), error);
    console.error(pc.yellow("\n💡 Tips:"));
    console.error(pc.dim("   - Make sure the model server is running"));
    console.error(pc.dim("   - Check the AI_BASE_URL is correct"));
    console.error(pc.dim("   - Verify the AI_MODEL name matches the server"));
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(pc.red("Fatal error:"), error);
  process.exit(1);
});
