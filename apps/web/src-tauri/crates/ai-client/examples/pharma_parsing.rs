//! Pharmaceutical Message Parsing Example
//!
//! Demonstrates using AI client with Tera templates for parsing pharmaceutical
//! WhatsApp messages in Arabic/English to extract medication information.
//!
//! Run with:
//! ```bash
//! cargo run --example pharma_parsing
//! ```

use ai_client::AiClient;
use anyhow::Result;
use async_openai::types::chat::ChatCompletionRequestUserMessage;
use chrono::Datelike;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tera::{Context, Tera};

/// Medication extracted from message
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Medication {
    pub name: String,
    pub concentration: Option<String>,
    pub form: Option<String>,
    pub expiry: Option<String>,
    pub confidence: f64,
    pub reason: String,
}

/// Parsed pharmaceutical message
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct PharmaMessage {
    pub intent: String,
    pub urgency: String,
    pub reason: String,
    pub medications: Vec<Medication>,
}

/// Build system prompt using Tera template
fn build_system_prompt() -> Result<String> {
    let mut tera = Tera::default();
    let system_template = include_str!("prompts/pharma_system.txt");
    tera.add_raw_template("system", system_template)?;

    let now = chrono::Utc::now();
    let current_year = now.year();
    let current_year_short = current_year % 100;
    let max_year = current_year + 10;
    let max_year_short = max_year % 100;

    let mut context = Context::new();
    context.insert("current_year", &current_year);
    context.insert("current_year_short", &current_year_short);
    context.insert("max_year", &max_year);
    context.insert("max_year_short", &max_year_short);

    Ok(tera.render("system", &context)?)
}

/// Build user prompt using Tera template
fn build_user_prompt(
    content: &str,
    sender_name: Option<&str>,
    group_name: &str,
    reply_to: Option<&str>,
    medication_mappings: Option<&[String]>,
) -> Result<String> {
    let mut tera = Tera::default();
    let user_template = include_str!("prompts/pharma_user.txt");
    tera.add_raw_template("user", user_template)?;

    let now = chrono::Utc::now();
    let current_year = now.year();
    let current_year_short = current_year % 100;
    let max_year = current_year + 10;
    let max_year_short = max_year % 100;

    let mut context = Context::new();
    context.insert("current_year", &current_year);
    context.insert("current_year_short", &current_year_short);
    context.insert("max_year", &max_year);
    context.insert("max_year_short", &max_year_short);
    context.insert("content", content);
    context.insert("group_name", group_name);

    if let Some(sender) = sender_name {
        context.insert("sender_name", sender);
    }

    if let Some(reply) = reply_to {
        context.insert("reply_to", reply);
    }

    if let Some(mappings) = medication_mappings {
        context.insert("medication_mappings", mappings);
    }

    Ok(tera.render("user", &context)?)
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("💊 Pharmaceutical Message Parsing Example\n");

    // Load configuration
    ai_client::load_dotenv();
    let config = ai_client::load_from_env()?;

    // Build system prompt
    let system_prompt = build_system_prompt()?;

    // Create client with system prompt
    let client = AiClient::new(&config)?.with_system_prompt(system_prompt);

    println!("📊 Configuration:");
    println!("   Model: {}", config.model);
    println!("   Base URL: {}", config.base_url);
    println!("   System Prompt: Loaded from template\n");

    // Example 1: Arabic offer message
    println!("{}", "=".repeat(70));
    println!("Example 1: Arabic Offer Message");
    println!("{}", "=".repeat(70));

    let arabic_message = "متوفر\nاوزمبك 10/27\nريبلسس ١٤ صلاحية ٣/٢٦\nكونسرتا ٣٦ و١٨";

    let user_prompt = build_user_prompt(
        arabic_message,
        Some("Ahmed Pharmacy"),
        "Cairo Pharma Group",
        None,
        Some(&[
            "اوزمبك -> Ozempic".to_string(),
            "ريبلسس -> Rybelsus".to_string(),
        ]),
    )?;

    println!("\n📝 Message:");
    println!("{}\n", arabic_message);

    let messages = vec![ChatCompletionRequestUserMessage::from(user_prompt.as_str()).into()];

    match client
        .generate_structured::<PharmaMessage>(
            messages,
            "pharma_message",
            Some("Pharmaceutical message parsing".to_string()),
        )
        .await?
    {
        Some(response) => {
            println!("✅ Parsed Response:");
            println!("{}", serde_json::to_string_pretty(&response)?);

            println!("\n📋 Summary:");
            println!("   Intent: {}", response.intent);
            println!("   Urgency: {}", response.urgency);
            println!("   Medications found: {}", response.medications.len());

            for (i, med) in response.medications.iter().enumerate() {
                println!("\n   {}. {}", i + 1, med.name);
                if let Some(conc) = &med.concentration {
                    println!("      Concentration: {}", conc);
                }
                if let Some(form) = &med.form {
                    println!("      Form: {}", form);
                }
                if let Some(expiry) = &med.expiry {
                    println!("      Expiry: {}", expiry);
                }
                println!("      Confidence: {:.0}%", med.confidence * 100.0);
            }
        }
        None => println!("❌ No response received"),
    }

    // Example 2: Urgent request message
    println!("\n{}", "=".repeat(70));
    println!("Example 2: Urgent Request Message");
    println!("{}", "=".repeat(70));

    let urgent_message = "ضروري اليوم\nمطلوب Ozempic 1mg\nمصل تيتانوس امبول";

    let user_prompt = build_user_prompt(
        urgent_message,
        Some("Dr. Mohamed"),
        "Medical Supplies",
        None,
        None,
    )?;

    println!("\n📝 Message:");
    println!("{}\n", urgent_message);

    let messages = vec![ChatCompletionRequestUserMessage::from(user_prompt.as_str()).into()];

    match client
        .generate_structured::<PharmaMessage>(
            messages,
            "pharma_message",
            Some("Pharmaceutical message parsing".to_string()),
        )
        .await?
    {
        Some(response) => {
            println!("✅ Parsed Response:");
            println!("{}", serde_json::to_string_pretty(&response)?);

            println!("\n📋 Summary:");
            println!("   Intent: {}", response.intent);
            println!("   Urgency: {} ⚠️", response.urgency);
            println!("   Reason: {}", response.reason);
            println!("   Medications requested: {}", response.medications.len());
        }
        None => println!("❌ No response received"),
    }

    // Example 3: Using simple generate (non-structured)
    println!("\n{}", "=".repeat(70));
    println!("Example 3: Simple Generate with System Prompt");
    println!("{}", "=".repeat(70));

    let mixed_message = "متوفر ديبوكسنت ٣٠٠\nOzempic 1mg exp 10/2027";

    let user_prompt = build_user_prompt(
        mixed_message,
        Some("Pharmacy Network"),
        "Suppliers Group",
        None,
        None,
    )?;

    println!("\n📝 Message:");
    println!("{}\n", mixed_message);

    let response = client.generate(&user_prompt).await?;

    println!("✅ Raw Response:");
    println!("{}\n", response.response);

    // Try to parse as JSON
    if let Ok(parsed) = serde_json::from_str::<Value>(&response.response) {
        println!("📊 Parsed JSON:");
        println!("{}", serde_json::to_string_pretty(&parsed)?);
    }

    println!("\n✅ Examples completed!\n");

    Ok(())
}
