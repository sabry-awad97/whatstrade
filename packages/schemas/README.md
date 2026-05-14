# @workspace/schemas

Centralized Zod schema definitions for the WhatsTrade API, refactored from generated OpenAPI specifications into a maintainable, domain-organized structure.

## Overview

This package provides type-safe validation schemas and TypeScript types for all API endpoints in the WhatsTrade system. Schemas are organized by domain for better maintainability and discoverability.

## Installation

This package is part of the monorepo workspace. Reference it in your `package.json`:

```json
{
  "dependencies": {
    "@workspace/schemas": "workspace:*"
  }
}
```

## Usage

### Import schemas and types

```typescript
import {
  ListOffersQueryParams,
  GetOfferResponse,
  type ListOffersResponse,
} from "@workspace/schemas";

// Validate query parameters
const params = ListOffersQueryParams.parse({ page: 1, limit: 20 });

// Use inferred types
const offer: GetOfferResponse = {
  id: 1,
  medicationName: "Aspirin",
  dosage: "500mg",
  quantity: 100,
  price: 50.0,
  groupName: "Pharmacy Group",
  senderPhone: "+1234567890",
  status: "active",
  rawText: "Aspirin 500mg x100 for $50",
  createdAt: new Date(),
};
```

### Import from specific domains

```typescript
// Import only what you need
import {
  ListOffersQueryParams,
  GetOfferResponse,
} from "@workspace/schemas/offers";
import { GetMatchStatsResponse } from "@workspace/schemas/matches";
import { HealthCheckResponse } from "@workspace/schemas/health";
```

## Schema Organization

Schemas are organized into logical domain modules:

### Core Domains

- **`common.ts`** - Shared utilities and base schemas (pagination, ID params, etc.)
- **`health.ts`** - Health check endpoints
- **`dashboard.ts`** - Dashboard statistics and metrics

### Business Domains

- **`offers.ts`** - Medication offer schemas (list, get, query params)
- **`requests.ts`** - Medication request schemas (list, get, query params)
- **`matches.ts`** - Offer-request matching schemas (list, confirm, reject, stats)
- **`groups.ts`** - WhatsApp group management (list, monitor, unmonitor)
- **`review.ts`** - Manual review queue for parsed messages
- **`simulation.ts`** - Message parsing and matching simulation

### Configuration & Audit

- **`weights.ts`** - Matching algorithm weight configuration
- **`audit.ts`** - Audit log for operator actions

## Design Principles

### 1. Domain-Driven Organization

Schemas are grouped by business domain rather than technical concerns, making it easier to find and maintain related schemas.

### 2. DRY with Composition

Common patterns are extracted into reusable base schemas in `common.ts`:

- `PaginationQueryParams` - Standard pagination
- `SearchablePaginationQueryParams` - Pagination with search
- `IdParams` - Route parameter with ID
- `OptionalNoteBody` - Optional note field for operator actions

### 3. Type Safety

All schemas export both the Zod schema and the inferred TypeScript type:

```typescript
export const GetOfferResponse = z.object({ ... });
export type GetOfferResponse = z.infer<typeof GetOfferResponse>;
```

### 4. Preserved Constants

Default values and constraints are exported as constants for reuse:

```typescript
export const listOffersQueryPageDefault = 1;
export const listOffersQueryLimitDefault = 20;
```

### 5. Descriptive Comments

Each schema includes JSDoc comments explaining its purpose and usage context.

## Migration from Generated API

This package replaces the monolithic `out-of-scope/Fluent-Design-Layout/lib/api-zod/src/generated/api.ts` file. All schema names and type exports remain identical to ensure zero breaking changes for consumers.

### Breaking Change Checklist

- ✅ All schema names preserved
- ✅ All type exports preserved
- ✅ All default value constants preserved
- ✅ All validation constraints preserved
- ✅ Import path changed from generated file to `@workspace/schemas`

## Development

### Type Checking

```bash
bun run check-types
```

### Adding New Schemas

1. Identify the appropriate domain module (or create a new one)
2. Add the schema with JSDoc comments
3. Export both the schema and its inferred type
4. Re-export from `index.ts`
5. Update this README if adding a new domain module

## Best Practices

### Nullable vs Optional

- Use `.nullish()` for fields that can be `null` or `undefined` in the database
- Use `.optional()` for fields that may be omitted from requests
- Use `.nullable()` for fields that explicitly allow `null` but not `undefined`

### Schema Composition

Prefer extending base schemas over duplicating structure:

```typescript
// Good
export const ListOffersQueryParams = SearchablePaginationQueryParams.extend({
  page: z.coerce.number().default(1),
});

// Avoid
export const ListOffersQueryParams = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.coerce.string().optional(),
});
```

### Validation Constraints

Export min/max constants for reuse in documentation and error messages:

```typescript
export const updateWeightsBodyMedicationMin = 0;
export const updateWeightsBodyMedicationMax = 1;

export const UpdateWeightsBody = z.object({
  medication: z
    .number()
    .min(updateWeightsBodyMedicationMin)
    .max(updateWeightsBodyMedicationMax),
});
```

## License

Internal workspace package - not for external distribution.
