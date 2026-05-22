# WhatsApp Service

Go microservice for WhatsApp integration using whatsmeow library.

## Architecture

```
WhatsApp Groups
    ↓
whatsmeow Client (Go)
    ↓
PostgreSQL Queue + NOTIFY
    ↓
Bun Server (LISTEN)
    ↓
AI Extraction + Matching
```

## Tech Stack

- **Runtime:** Go 1.25+
- **Web Framework:** Gin
- **Database:** PostgreSQL (shared with Bun server)
- **ORM:** GORM (type-safe database access)
- **WhatsApp:** whatsmeow
- **Logging:** zap (structured logging)
- **Config:** viper

## Project Structure

````
services/whatsapp/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── domain/                  # Business entities (pure Go)
│   │   ├── message.go
│   │   ├── group.go
│   │   ├── session.go
│   │   └── errors.go
│   ├── usecase/                 # Business logic
│   │   ├── process_message.go
│   │   ├── manage_groups.go
│   │   └── authenticate.go
│   ├── port/                    # Interfaces (dependency inversion)
│   │   ├── whatsapp.go
│   │   ├── repository.go
│   │   └── queue.go
│   ├── adapter/                 # External integrations
│   │   ├── whatsapp/
│   │   │   ├── client.go
│   │   │   ├── event_handler.go
│   │   │   └── qr.go
│   │   ├── repository/
│   │   │   ├── postgres.go
│   │   │   └── models.go
│   │   └── api/
│   │       ├── server.go
│   │       ├── handlers.go
│   │       └── middleware.go
│   └── config/
│       └── config.go
├── pkg/
│   └── logger/
│       └── logger.go
├── go.mod
├── go.sum
├── Dockerfile
└── Taskfile.yml
```

## Setup

### Prerequisites

- Go 1.25+
- PostgreSQL 15+

### Environment Variables

```bash
# Database (shared with Bun server)
DATABASE_URL=postgresql://postgres:password@localhost:5433/whatstrade

# Server
PORT=8080
LOG_LEVEL=info

# WhatsApp
WHATSAPP_LOG_LEVEL=INFO
````

### Installation

```bash
# Install dependencies
go mod download

# Run migrations (done by Bun server)
# This service only reads from migrated database

# Run service
task run

# Or with hot reload
task dev
```

## Development

### Available Tasks

View all available tasks:

```bash
task --list
```

### Generate SQL Code

```bash
# Note: This project uses GORM, not sqlc
# No code generation needed
```

### Run Tests

```bash
task test
```

### Run Tests with Coverage

```bash
task test:coverage
```

### Build

```bash
task build
```

### Run Service

```bash
# Development mode with hot reload
task dev

# Or run directly
task run
```

### Docker

```bash
# Build image
task docker:build

# Run container
task docker:run

# Or use docker-compose
task docker:up
task docker:logs
task docker:down
```

### Linting

```bash
# Run linter
task lint

# Run linter and fix issues
task lint:fix
```

### Install Tools

Development tools required for formatting, linting, and hot reload:

```bash
# Install all development tools (air, golangci-lint, goimports)
task tools

# Install specific tools
task tools:air        # Hot reload
task tools:lint       # Linter
task tools:goimports  # Code formatting with import management
```

**Tools installed:**

- `air` - Hot reload for development
- `golangci-lint` - Comprehensive Go linter
- `goimports` - Formats code and manages imports (used by `task format`)

## API Endpoints

### Health Check

```bash
GET /health
```

### WhatsApp Status

```bash
GET /api/whatsapp/status
```

### Get QR Code (for authentication)

```bash
GET /api/whatsapp/qr
```

### List Groups

```bash
GET /api/whatsapp/groups
```

### Sync Groups

```bash
POST /api/whatsapp/groups/sync
```

## Message Flow

1. **Receive WhatsApp message** → whatsmeow event handler
2. **Validate & transform** → domain entity
3. **Insert into queue** → PostgreSQL + NOTIFY
4. **Bun server receives** → LISTEN notification
5. **Process message** → AI extraction + matching

## Retry Strategy

- **Max retries:** 3
- **Backoff:** Exponential (1min, 2min, 4min)
- **Dead letter:** After 3 failures → manual review

## Monitoring

### Metrics

- WhatsApp connection status
- Messages received/sec
- Queue depth
- Processing errors

### Logs

Structured JSON logs with zap:

```json
{
  "level": "info",
  "ts": "2024-01-01T12:00:00Z",
  "msg": "message received",
  "message_id": "ABC123",
  "group_id": "XYZ789",
  "sender": "201234567890"
}
```

## Troubleshooting

### WhatsApp not connecting

1. Check QR code endpoint: `GET /api/whatsapp/qr`
2. Scan QR with WhatsApp mobile app
3. Check logs for connection errors

### Messages not being processed

1. Check queue: `SELECT * FROM whatsapp_message_queue WHERE status = 'pending'`
2. Verify NOTIFY trigger exists
3. Check Bun server LISTEN connection

### Database connection issues

1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running on port 5433
3. Ensure migrations are applied (by Bun server)

## License

MIT
