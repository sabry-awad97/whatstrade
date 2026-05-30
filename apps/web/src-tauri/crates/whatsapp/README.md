# WhatsApp Provider Crate

Provider-agnostic WhatsApp integration layer for the WhatsTrade application.

## Overview

This crate provides a unified interface for WhatsApp operations through the `WhatsAppProvider` trait. Currently being implemented with the wa-rs native Rust library.

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
               ▼
         ┌─────────────┐
         │   WaRs      │
         │  Provider   │
         └─────────────┘
```

## Usage

### Using WaRs Provider (In Development)

```rust
use whatsapp::{WaRsProvider, WhatsAppProvider, SyncConfig};

// TODO: Once wa-rs is fully implemented
let provider = WaRsProvider::new().await?;
let groups = provider.sync_groups(&SyncConfig::default()).await?;
```

### Integration with Service Layer

The service layer accepts any `Arc<dyn WhatsAppProvider>`:

```rust
use whatsapp::WaRsProvider;

// Initialize provider
let provider: Arc<dyn WhatsAppProvider> = Arc::new(WaRsProvider::new().await?);

// Pass to service
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

## Implementation Status

### Current Status

- ✅ Trait defined
- ✅ Domain types defined
- ✅ Error handling
- 🔄 WaRsProvider implementation (in progress)

### Next Steps

1. Add wa-rs dependency to Cargo.toml
2. Implement WaRsProvider methods:
   - `sync_groups()` - Fetch groups from WhatsApp
   - `get_status()` - Check connection status
   - `get_qr_code()` - Get QR code for authentication
   - `send_message()` - Send messages to groups
   - `logout()` - Disconnect from WhatsApp
3. Add integration tests
4. Update service layer to use WaRsProvider

## Development

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
- `reqwest` - HTTP client (temporary, will be removed)
- `tracing` - Logging

## License

Same as parent project.
