# WhatsApp Provider Crate

Provider-agnostic WhatsApp integration layer for the WhatsTrade application.

## Overview

This crate provides a unified interface for WhatsApp operations through the `WhatsAppProvider` trait. It supports multiple backend implementations:

- **GoServiceProvider** - HTTP-based communication with external Go WhatsApp service (temporary)
- **WaRsProvider** - Native Rust implementation using wa-rs library (future)
- **MockWhatsAppProvider** - Testing mock with configurable behavior

## Architecture

```
┌─────────────────────────────────────┐
│      WhatsApp Service Layer         │
│   (Business Logic - db/service)     │
└──────────────┬──────────────────────┘
               │ depends on trait
               ▼
┌─────────────────────────────────────┐
│     WhatsAppProvider Trait          │
│  (Domain Interface - this crate)    │
└──────────────┬──────────────────────┘
               │ implemented by
       ┌───────┴────────┬──────────────┐
       ▼                ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌──────────┐
│ GoService   │  │   WaRs      │  │   Mock   │
│  Provider   │  │  Provider   │  │ Provider │
└─────────────┘  └─────────────┘  └──────────┘
```

## Usage

### Using Go Service Provider (Current)

```rust
use whatsapp::{GoServiceProvider, WhatsAppProvider, SyncConfig};

let provider = GoServiceProvider::new("http://localhost:8080");
let groups = provider.sync_groups(&SyncConfig::default()).await?;
```

### Using Mock Provider (Testing)

```rust
use whatsapp::{MockWhatsAppProvider, GroupInfo};

let groups = vec![
    GroupInfo {
        jid: "123@g.us".to_string(),
        name: "Test Group".to_string(),
        participant_count: 5,
        description: None,
        created_at: None,
    }
];

let provider = MockWhatsAppProvider::with_groups(groups);
let status = provider.get_status().await?;
```

### Switching Providers

The service layer accepts any `Arc<dyn WhatsAppProvider>`, making it easy to switch:

```rust
// Development with mock
let provider: Arc<dyn WhatsAppProvider> = Arc::new(MockWhatsAppProvider::new());

// Production with Go service
let provider: Arc<dyn WhatsAppProvider> = Arc::new(GoServiceProvider::new(url));

// Future with wa-rs
// let provider: Arc<dyn WhatsAppProvider> = Arc::new(WaRsProvider::new().await?);

let service = WhatsAppService::new(db, provider);
```

## Domain Types

All types are provider-agnostic and represent the business domain:

- `GroupInfo` - WhatsApp group information
- `ConnectionStatus` - Connection and authentication status
- `QRCode` - Authentication QR code
- `MessageId` - Sent message identifier
- `OutgoingMessage` - Message to be sent
- `SyncConfig` - Configuration for sync operations

## Error Handling

All operations return `ProviderResult<T>` which is `Result<T, ProviderError>`.

Error types:

- `Connection` - Network/connectivity issues
- `Authentication` - Login/auth failures
- `InvalidJid` - Invalid WhatsApp identifier
- `SendFailed` - Message sending failed
- `GroupOperationFailed` - Group operation failed
- `Timeout` - Operation timed out
- `ServiceUnavailable` - Provider not ready
- `Internal` - Internal provider error
- `Serialization` - Data parsing error

## Testing

The mock provider supports various testing scenarios:

```rust
// Success case
let provider = MockWhatsAppProvider::new();

// Disconnected state
let provider = MockWhatsAppProvider::disconnected();

// Failure simulation
let provider = MockWhatsAppProvider::failing("Network error");

// Custom groups
let provider = MockWhatsAppProvider::with_groups(groups);

// Dynamic state changes
provider.set_connected(false);
provider.set_should_fail(true);

// Message tracking
provider.send_message(&msg).await?;
let sent = provider.get_sent_messages();
```

## Migration Path

### Phase 1: Current (Go Service)

- ✅ Trait defined
- ✅ GoServiceProvider implemented
- ✅ Mock provider for testing
- ✅ Service layer uses trait

### Phase 2: Transition (Both)

- 🔄 wa-rs integration started
- 🔄 WaRsProvider implementation
- 🔄 Feature flag to switch providers
- 🔄 Parallel testing

### Phase 3: Future (wa-rs only)

- ⏳ Remove GoServiceProvider
- ⏳ Remove Go service dependency
- ⏳ wa-rs as default

## Development

### Adding a New Provider

1. Create a new file in `src/` (e.g., `my_provider.rs`)
2. Implement `WhatsAppProvider` trait
3. Map provider-specific types to domain types
4. Handle errors by converting to `ProviderError`
5. Export in `lib.rs`
6. Add tests

### Running Tests

```bash
cargo test -p whatsapp
```

### Building

```bash
cargo build -p whatsapp
```

## Dependencies

- `async-trait` - Async trait support
- `chrono` - Date/time handling
- `serde` - Serialization
- `thiserror` - Error handling
- `tokio` - Async runtime
- `reqwest` - HTTP client (for GoServiceProvider)
- `tracing` - Logging

## License

Same as parent project.
