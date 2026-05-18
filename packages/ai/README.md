# @workspace/ai

Centralized AI functionality for WhatsTrade application. Provides a unified interface for AI-powered features with support for multiple providers and models.

## Features

- 🤖 **Multiple Provider Support**: Currently supports Google AI (Gemini), extensible for OpenAI, Anthropic, etc.
- 📦 **Structured Extraction**: Extract structured data from unstructured text
- 🏥 **Pharmaceutical Parsing**: Specialized extraction for Arabic pharmaceutical messages
- ⚙️ **Environment-Based Configuration**: Model selection via environment variables
- 🔒 **Type-Safe**: Full TypeScript support with Zod schemas

## Installation

This is an internal workspace package. Add it to your package dependencies:

```json
{
  "dependencies": {
    "@workspace/ai": "workspace:*"
  }
}
```

## Usage

### Pharmaceutical Message Extraction

```typescript
import { extractPharmaceuticalMessage } from "@workspace/ai";

const result = await extractPharmaceuticalMessage(
  "عندي باندول 500mg كمية 10 بسعر 50 جنيه",
);

console.log(result);
// {
//   messageType: "offer",
//   medicationName: "باندول",
//   dosage: "500mg",
//   quantity: 10,
//   price: 50,
//   confidence: {
//     medicationName: 0.95,
//     dosage: 0.9,
//     quantity: 0.85,
//     price: 0.8
//   },
//   reasoning: "Message indicates an offer with clear medication details"
// }
```

### Generic Structured Extraction

```typescript
import { extractStructuredData } from "@workspace/ai";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  occupation: z.string(),
});

const result = await extractStructuredData(
  "John Smith is a 30-year-old software engineer",
  schema,
  "Extract person information from the text",
);
```

### Using Different Models

```typescript
import { google } from "@workspace/ai/google";

// Use a specific model directly
const model = google("gemini-1.5-pro");

// Or use the default configured model
import { getGoogleModel } from "@workspace/ai";
const defaultModel = getGoogleModel();
```

## Environment Variables

Required:

- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google AI API key
- `GOOGLE_GENERATIVE_AI_MODEL` - Model to use (e.g., `gemini-1.5-flash`, `gemini-1.5-pro`)

## Available Models

### Google AI (Gemini)

- `gemini-1.5-flash` (default) - Fast, cost-effective
- `gemini-1.5-flash-8b` - Smaller, faster, lower cost
- `gemini-1.5-pro` - More capable, better reasoning
- `gemini-2.0-flash-exp` - Experimental, latest features

## Architecture

```
packages/ai/
├── src/
│   ├── providers/          # AI provider configurations
│   │   └── google.ts       # Google AI (Gemini) setup
│   ├── services/           # AI-powered services
│   │   └── extraction.ts   # Structured data extraction
│   └── index.ts            # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

## Adding New Providers

To add support for a new AI provider (e.g., OpenAI):

1. Create `src/providers/openai.ts`:

```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@workspace/env/server";

export const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export function getOpenAIModel() {
  return openai(env.OPENAI_MODEL);
}
```

2. Update `src/index.ts` to export the new provider

3. Add environment variables to `packages/env/src/server.ts`

4. Update services to support provider selection

## Best Practices

1. **Always use environment-based configuration** for API keys and model selection
2. **Define schemas with descriptions** - AI models use descriptions for better extraction
3. **Handle errors gracefully** - AI calls can fail, always have fallbacks
4. **Monitor costs** - Different models have different pricing
5. **Test with real data** - AI extraction quality varies with input

## Future Enhancements

- [ ] Add OpenAI provider support
- [ ] Add Anthropic (Claude) provider support
- [ ] Implement streaming extraction
- [ ] Add caching layer for repeated extractions
- [ ] Add retry logic with exponential backoff
- [ ] Add usage tracking and cost monitoring
- [ ] Support for fine-tuned models
- [ ] Multi-language support beyond Arabic

## License

Internal workspace package - not for external distribution
