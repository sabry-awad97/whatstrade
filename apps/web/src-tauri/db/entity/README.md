# Database Entity Layer

This crate contains SeaORM v2 entity definitions converted from the Prisma schema.

## Structure

Each entity is organized in its own module:

```
entities/
├── {entity_name}/
│   ├── mod.rs   # SeaORM entity definition with relations
│   └── dto.rs   # Data Transfer Object with TypedBuilder and Getters
```

## Entities

### Authentication & Authorization

- **User** - Authenticated users
- **Session** - User authentication sessions
- **Account** - OAuth/authentication provider accounts
- **Verification** - Email/phone verification tokens
- **AuditLog** - Audit trail for system operations

### WhatsApp Integration

- **Group** - WhatsApp groups being monitored
- **WhatsAppMessageQueue** - Message processing queue
- **WhatsAppSession** - WhatsApp session storage

### Core Business Logic

- **Offer** - Medication offers (⚠️ Contains PII/PHI)
- **Request** - Medication requests (⚠️ Contains PII/PHI)
- **Match** - Matches between offers and requests
- **ReviewItem** - Items pending review (⚠️ Contains PII/PHI)
- **MatchingWeights** - Configurable matching algorithm weights

## Enums

### Offer & Request

- `OfferStatus`: active, matched, expired, cancelled
- `RequestStatus`: active, fulfilled, expired, cancelled

### Matching

- `ConfidenceBand`: auto, suggest, review, none
- `MatchStatus`: pending, confirmed, rejected, auto_confirmed

### Review

- `ReviewStatus`: pending, approved, rejected
- `ReviewType`: offer, request, match

### WhatsApp

- `MessageQueueStatus`: pending, processing, completed, failed, dead_letter

## Type Mappings

| Prisma Type                | Rust Type              | Notes                  |
| -------------------------- | ---------------------- | ---------------------- |
| String                     | String                 |                        |
| Int                        | i32                    |                        |
| Boolean                    | bool                   |                        |
| DateTime                   | DateTime (chrono)      |                        |
| DateTime @db.Timestamptz() | DateTimeWithTimeZone   | PostgreSQL timestamptz |
| Decimal @db.Decimal(10, 2) | Decimal (rust_decimal) | Prices                 |
| Decimal @db.Decimal(5, 4)  | Decimal (rust_decimal) | Scores/weights         |
| Json                       | Json (sea_orm)         |                        |
| String?                    | Option<String>         | Nullable fields        |

## Security Notices

Several entities contain sensitive PII/PHI data:

### ⚠️ PHI (Protected Health Information)

- `medicationName` fields in: Offer, Request, ReviewItem

### ⚠️ PII (Personally Identifiable Information)

- `senderPhone` fields in: Offer, Request, ReviewItem, WhatsAppMessageQueue
- `rawText` fields may contain unstructured PII/PHI

**Required Controls:**

1. Database encryption-at-rest (TDE/CMK)
2. Role-based access control (RBAC)
3. Audit logging for sensitive field access
4. Data retention and automated purge policies
5. Query restrictions (no SELECT \*, explicit field selection)

## Relationships

### User Relations

- User 1:N Session
- User 1:N Account
- User 1:N AuditLog (nullable operator_id)

### WhatsApp Relations

- WhatsAppMessageQueue 1:1 Offer (via whatsapp_message_id)
- WhatsAppMessageQueue 1:1 Request (via whatsapp_message_id)
- WhatsAppMessageQueue N:1 Offer (created_offer_id)
- WhatsAppMessageQueue N:1 Request (created_request_id)

### Matching Relations

- Offer 1:N Match
- Request 1:N Match
- Match N:1 Offer
- Match N:1 Request

## Usage Examples

### Creating an Entity

```rust
use db_entity::entities::user;

let user = user::ActiveModel::builder()
    .set_id("user_123")
    .set_name("Alice")
    .set_email("alice@example.com")
    .set_email_verified(false)
    .insert(&db)
    .await?;
```

### Querying with Relations

```rust
use db_entity::entities::{user, session};

let user = user::Entity::load()
    .filter_by_id("user_123")
    .with(session::Entity)
    .one(&db)
    .await?;
```

### Using DTOs

```rust
use db_entity::entities::user::dto::UserDto;

let dto = UserDto::builder()
    .id("user_123".to_string())
    .name("Alice".to_string())
    .email("alice@example.com".to_string())
    .email_verified(false)
    .image(None)
    .created_at(Utc::now())
    .updated_at(Utc::now())
    .build();

// Access fields via getters
println!("User: {}", dto.name());
```

## Dependencies

- `sea-orm` v2.0 - ORM with PostgreSQL support
- `serde` - Serialization/deserialization
- `chrono` - Date/time handling
- `rust_decimal` - Precise decimal arithmetic
- `uuid` - UUID generation
- `typed-builder` - Type-safe builder pattern
- `derive-getters` - Auto-generate field getters

## Compilation

```bash
cargo check --manifest-path apps/web/src-tauri/db/entity/Cargo.toml
```

## Notes

- All struct fields are private (not `pub`)
- DTOs use `TypedBuilder` for construction
- DTOs derive `Getters` for field access
- Follows SeaORM v2 patterns (see `.kiro/steering/sea-orm-v2.md`)
- Column names use snake_case via `#[sea_orm(column_name = "...")]`
- Relations use SeaORM v2 inline syntax
