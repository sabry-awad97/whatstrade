//! Example: Structured Output with JSON Schema
//!
//! This example demonstrates how to use the playground client to generate
//! structured outputs that conform to a specific JSON schema.
//!
//! Run with:
//! ```bash
//! cargo run --example structured_output
//! ```

use ai_client::AiClient;
use anyhow::Result;
use async_openai::types::chat::{
    ChatCompletionRequestSystemMessage, ChatCompletionRequestUserMessage,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

/// A single step in a math problem solution
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Step {
    /// The output of this step
    pub output: String,
    /// Explanation of what was done in this step
    pub explanation: String,
}

/// Complete math reasoning response with steps
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct MathReasoningResponse {
    /// The final answer to the problem
    pub final_answer: String,
    /// Step-by-step solution
    pub steps: Vec<Step>,
}

/// Weather forecast response
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct WeatherForecast {
    /// Location name
    pub location: String,
    /// Temperature in Celsius
    pub temperature: f32,
    /// Weather condition (e.g., "sunny", "rainy")
    pub condition: String,
    /// Humidity percentage
    pub humidity: u8,
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("🔧 Structured Output Examples\n");

    // Load configuration
    ai_client::load_dotenv();
    let config = ai_client::load_from_env()?;

    // Create client
    let client = AiClient::new(&config)?;

    println!("📊 Configuration:");
    println!("   Model: {}", config.model);
    println!("   Base URL: {}\n", config.base_url);

    // Example 1: Math Reasoning
    println!("{}", "=".repeat(70));
    println!("Example 1: Math Reasoning with Steps");
    println!("{}", "=".repeat(70));

    let math_messages = vec![
        ChatCompletionRequestSystemMessage::from(
            "You are a helpful math tutor. Guide the user through the solution step by step.",
        )
        .into(),
        ChatCompletionRequestUserMessage::from("How can I solve 8x + 7 = -23?").into(),
    ];

    match client
        .generate_structured::<MathReasoningResponse>(
            math_messages,
            "math_reasoning",
            Some("Step-by-step math problem solution".to_string()),
        )
        .await?
    {
        Some(response) => {
            println!("\n✅ Structured Response:");
            println!("{}", serde_json::to_string_pretty(&response)?);

            println!("\n📝 Formatted Output:");
            println!("Final Answer: {}", response.final_answer);
            println!("\nSteps:");
            for (i, step) in response.steps.iter().enumerate() {
                println!("  {}. {}", i + 1, step.explanation);
                println!("     Output: {}", step.output);
            }
        }
        None => println!("❌ No response received"),
    }

    // Example 2: Weather Forecast
    println!("\n{}", "=".repeat(70));
    println!("Example 2: Weather Forecast");
    println!("{}", "=".repeat(70));

    let weather_messages = vec![
        ChatCompletionRequestSystemMessage::from(
            "You are a weather assistant. Provide weather information in the requested format.",
        )
        .into(),
        ChatCompletionRequestUserMessage::from(
            "What's the weather like in Tokyo? Provide temperature in Celsius.",
        )
        .into(),
    ];

    match client
        .generate_structured::<WeatherForecast>(
            weather_messages,
            "weather_forecast",
            Some("Current weather forecast".to_string()),
        )
        .await?
    {
        Some(response) => {
            println!("\n✅ Structured Response:");
            println!("{}", serde_json::to_string_pretty(&response)?);

            println!("\n🌤️  Formatted Output:");
            println!("Location: {}", response.location);
            println!("Temperature: {}°C", response.temperature);
            println!("Condition: {}", response.condition);
            println!("Humidity: {}%", response.humidity);
        }
        None => println!("❌ No response received"),
    }

    println!("\n✅ Examples completed!\n");

    Ok(())
}
