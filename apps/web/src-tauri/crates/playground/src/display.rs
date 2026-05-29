//! Terminal display and formatting utilities

use crate::types::{BenchmarkResult, ExecutionSummary, PromptResult};
use colored::*;
use comfy_table::*;
use humantime::format_duration;

/// Display configuration information
pub fn display_config(base_url: &str, model: &str, api_key: &str, concurrency_limit: usize) {
    println!("{}", "📊 Configuration:".cyan().bold());
    println!("   Base URL: {}", base_url.yellow());
    println!("   Model: {}", model.yellow());
    println!(
        "   API Key: {}",
        if api_key == "not-needed" {
            "not-needed".dimmed().to_string()
        } else {
            format!("***{}", &api_key[api_key.len().saturating_sub(4)..])
                .dimmed()
                .to_string()
        }
    );
    println!(
        "   Concurrency limit: {}",
        concurrency_limit.to_string().yellow()
    );
}

/// Display a single prompt result
pub fn display_single_result(result: &PromptResult) {
    println!("{}", "💬 Prompt:".cyan().bold());
    println!("   \"{}\"", result.prompt.white());
    println!("{}", "=".repeat(70).blue().bold());
    println!("{}", "✅ Response:".green().bold());
    println!("{}", "-".repeat(70).dimmed());
    println!("{}", result.response);
    println!("{}", "-".repeat(70).dimmed());

    // Create stats table
    let mut table = Table::new();
    table
        .set_header(vec![
            "Metric".cyan().to_string(),
            "Value".cyan().to_string(),
        ])
        .add_row(vec!["Input tokens", &result.input_tokens.to_string()])
        .add_row(vec!["Output tokens", &result.output_tokens.to_string()])
        .add_row(vec!["Total tokens", &result.total_tokens.to_string()])
        .add_row(vec![
            "Duration",
            &format_duration(result.duration).to_string(),
        ])
        .add_row(vec!["Tokens/sec", &format!("{:.2}", result.tokens_per_sec)])
        .add_row(vec!["Finish reason", &result.finish_reason]);

    println!("\n{table}");
}

/// Display execution summary
pub fn display_summary(summary: &ExecutionSummary, title: &str) {
    // Create results table
    let mut table = Table::new();
    table.set_header(vec![
        "Prompt".cyan().to_string(),
        "Input".cyan().to_string(),
        "Output".cyan().to_string(),
        "Total".cyan().to_string(),
        "Duration".cyan().to_string(),
        "Tokens/sec".cyan().to_string(),
    ]);

    for result in &summary.results {
        table.add_row(vec![
            truncate(&result.prompt, 37),
            result.input_tokens.to_string(),
            result.output_tokens.to_string(),
            result.total_tokens.to_string(),
            format_duration(result.duration).to_string(),
            format!("{:.2}", result.tokens_per_sec),
        ]);
    }

    println!("\n{table}");

    // Print summary
    println!("{}", format!("\n📊 {}:", title).cyan().bold());
    println!(
        "   Total prompts: {}",
        summary.total_prompts.to_string().yellow()
    );
    println!(
        "   Total duration: {}",
        format_duration(summary.total_duration).to_string().green()
    );
    println!(
        "   Average per prompt: {}",
        format_duration(summary.avg_duration).to_string().green()
    );
    println!(
        "   Throughput: {} prompts/sec",
        format!("{:.2}", summary.throughput).yellow()
    );
    println!(
        "   Total tokens: {}",
        summary.total_tokens.to_string().yellow()
    );
}

/// Display benchmark comparison
pub fn display_benchmark(benchmark: &BenchmarkResult) {
    println!("{}", "\n⚡ Performance Comparison\n".magenta().bold());

    let mut table = Table::new();
    table.set_header(vec![
        "Metric".cyan().to_string(),
        "Sequential".cyan().to_string(),
        "Concurrent".cyan().to_string(),
        "Speedup".cyan().to_string(),
    ]);

    let speedup_str = format!("{:.2}x", benchmark.speedup);
    let speedup_colored = if benchmark.speedup > 2.0 {
        speedup_str.green().to_string()
    } else if benchmark.speedup > 1.5 {
        speedup_str.yellow().to_string()
    } else {
        speedup_str.red().to_string()
    };

    table
        .add_row(vec![
            "Total Duration",
            &format_duration(benchmark.sequential.total_duration).to_string(),
            &format_duration(benchmark.concurrent.total_duration).to_string(),
            &speedup_colored,
        ])
        .add_row(vec![
            "Avg per Prompt",
            &format_duration(benchmark.sequential.avg_duration).to_string(),
            &format_duration(benchmark.concurrent.avg_duration).to_string(),
            &speedup_colored,
        ])
        .add_row(vec![
            "Throughput",
            &format!("{:.2} prompts/sec", benchmark.sequential.throughput),
            &format!("{:.2} prompts/sec", benchmark.concurrent.throughput),
            &speedup_colored,
        ])
        .add_row(vec![
            "Total Tokens",
            &benchmark.sequential.total_tokens.to_string(),
            &benchmark.concurrent.total_tokens.to_string(),
            "~",
        ]);

    println!("{table}");

    // Verdict
    println!("{}", "\n🏆 Verdict:".magenta().bold());
    if benchmark.speedup > 2.0 {
        println!(
            "   {} - Highly recommended! 🚀",
            format!("Concurrent is {:.2}x faster", benchmark.speedup).green()
        );
    } else if benchmark.speedup > 1.5 {
        println!(
            "   {} - Good improvement! ⚡",
            format!("Concurrent is {:.2}x faster", benchmark.speedup).yellow()
        );
    } else if benchmark.speedup > 1.0 {
        println!(
            "   {} - Marginal improvement.",
            format!("Concurrent is {:.2}x faster", benchmark.speedup).yellow()
        );
    } else {
        println!(
            "   {}",
            "Sequential is actually faster! This might indicate server-side queuing.".red()
        );
    }
}

/// Truncate text for display
fn truncate(text: &str, max_length: usize) -> String {
    if text.len() <= max_length {
        text.to_string()
    } else {
        format!("{}...", &text[..max_length - 3])
    }
}
