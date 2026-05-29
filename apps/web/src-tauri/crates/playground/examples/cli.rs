//! AI Playground CLI
//!
//! Test OpenAI-compatible models with concurrent execution and benchmarking

use ai_client::{load_dotenv, load_from_env, AiClient};
use anyhow::{Context, Result};
use clap::Parser;
use colored::*;
use playground::{
    display::{display_benchmark, display_config, display_single_result, display_summary},
    executor::{execute_concurrent, execute_sequential, execute_single},
    types::BenchmarkResult,
};
use std::fs;

#[derive(Parser, Debug)]
#[command(name = "playground")]
#[command(about = "AI Playground - Test OpenAI-compatible models", long_about = None)]
#[command(version)]
struct Args {
    /// Prompts to process
    #[arg(value_name = "PROMPT")]
    prompts: Vec<String>,

    /// Run prompts concurrently
    #[arg(long)]
    concurrent: bool,

    /// Read prompts from file (one per line)
    #[arg(long, value_name = "FILE")]
    batch: Option<String>,

    /// Skip streaming test
    #[arg(long)]
    no_stream: bool,

    /// Benchmark sequential vs concurrent performance
    #[arg(long)]
    benchmark: bool,

    /// Concurrency limit (default: from env or 5)
    #[arg(long)]
    limit: Option<usize>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables
    load_dotenv();

    // Parse command-line arguments
    let args = Args::parse();

    // Load configuration
    let mut config = load_from_env()?;

    // Override concurrency limit if provided
    if let Some(limit) = args.limit {
        config.concurrency_limit = limit;
    }

    // Display header
    println!(
        "{}",
        "🤖 AI Playground - OpenAI-Compatible Model Test\n"
            .cyan()
            .bold()
    );
    println!("{}", "=".repeat(70).blue().bold());

    // Display configuration
    display_config(
        &config.base_url,
        &config.model,
        &config.api_key,
        config.concurrency_limit,
    );

    println!(
        "{}",
        "\n".to_string() + &"=".repeat(70).blue().bold().to_string()
    );

    // Determine prompts to use
    let prompts = if let Some(batch_file) = args.batch {
        load_prompts_from_file(&batch_file)?
    } else if !args.prompts.is_empty() {
        args.prompts
    } else {
        vec!["Hello! Please introduce yourself and tell me what you can do.".to_string()]
    };

    // Create client
    let client = AiClient::new(&config).context("Failed to create client")?;

    // Execute based on mode
    if args.benchmark && prompts.len() > 1 {
        run_benchmark(&client, &prompts, config.concurrency_limit).await?;
    } else if prompts.len() > 1 && args.concurrent {
        run_concurrent(&client, &prompts, config.concurrency_limit).await?;
    } else if prompts.len() > 1 {
        run_sequential(&client, &prompts).await?;
    } else {
        run_single(&client, &prompts[0], args.no_stream).await?;
    }

    println!(
        "{}",
        "\n✅ All tests completed successfully!\n".green().bold()
    );

    Ok(())
}

/// Run a single prompt
async fn run_single(client: &AiClient, prompt: &str, no_stream: bool) -> Result<()> {
    let result = execute_single(client, prompt, false).await?;
    display_single_result(&result);

    // Test streaming if not disabled
    if !no_stream {
        println!(
            "{}",
            "\n".to_string() + &"=".repeat(70).blue().bold().to_string()
        );
        println!("{}", "🌊 Testing streaming...\n".cyan().bold());
        println!("{}", "-".repeat(70).dimmed());

        let _stream_result = client
            .generate_stream("Count from 1 to 5, one number per line.")
            .await?;

        println!("{}", "-".repeat(70).dimmed());
    }

    Ok(())
}

/// Run sequential execution
async fn run_sequential(client: &AiClient, prompts: &[String]) -> Result<()> {
    println!(
        "{}",
        format!("\n📋 Running {} prompts sequentially...\n", prompts.len())
            .blue()
            .bold()
    );

    let summary = execute_sequential(client, prompts).await?;
    display_summary(&summary, "Sequential Execution Summary");

    Ok(())
}

/// Run concurrent execution
async fn run_concurrent(client: &AiClient, prompts: &[String], limit: usize) -> Result<()> {
    println!(
        "{}",
        format!(
            "\n🚀 Running {} prompts concurrently (limit: {})...\n",
            prompts.len(),
            limit
        )
        .blue()
        .bold()
    );

    let summary = execute_concurrent(client, prompts, limit).await?;
    display_summary(&summary, "Concurrent Execution Summary");

    Ok(())
}

/// Run benchmark comparing sequential vs concurrent
async fn run_benchmark(client: &AiClient, prompts: &[String], limit: usize) -> Result<()> {
    println!(
        "{}",
        format!(
            "\n⚡ Benchmarking {} prompts (Sequential vs Concurrent)\n",
            prompts.len()
        )
        .magenta()
        .bold()
    );

    // Run sequential
    println!("{}", "=".repeat(70).blue().bold());
    println!("{}", "Phase 1: Sequential Execution".blue().bold());
    println!("{}", "=".repeat(70).blue().bold());
    let sequential = execute_sequential(client, prompts).await?;
    display_summary(&sequential, "Sequential Execution Summary");

    // Wait a bit between runs
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

    // Run concurrent
    println!(
        "{}",
        "\n".to_string() + &"=".repeat(70).blue().bold().to_string()
    );
    println!("{}", "Phase 2: Concurrent Execution".blue().bold());
    println!("{}", "=".repeat(70).blue().bold());
    let concurrent = execute_concurrent(client, prompts, limit).await?;
    display_summary(&concurrent, "Concurrent Execution Summary");

    // Display comparison
    let benchmark = BenchmarkResult::new(sequential, concurrent);
    display_benchmark(&benchmark);

    Ok(())
}

/// Load prompts from a file
fn load_prompts_from_file(filename: &str) -> Result<Vec<String>> {
    let content =
        fs::read_to_string(filename).context(format!("Failed to read file: {}", filename))?;

    let prompts: Vec<String> = content
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty() && !line.starts_with('#'))
        .collect();

    if prompts.is_empty() {
        anyhow::bail!("No valid prompts found in file: {}", filename);
    }

    println!(
        "{}",
        format!("\n📄 Loaded {} prompts from {}", prompts.len(), filename).green()
    );

    Ok(prompts)
}
