# WhatsApp Service - Quick Start Guide

## ✅ Status: Ready to Run

The service has been successfully built with:

- **Go 1.22**
- **Gin** web framework
- **GORM** ORM with PostgreSQL
- **whatsmeow** WhatsApp library
- **Clean Architecture** structure

## Prerequisites

1. **PostgreSQL** running on port 5433
2. **Go 1.22+** installed
3. **Environment variables** configured

## Quick Start

### 1. Set Up Environment

Create `.env` file in `services/whatsapp/`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/whatstrade
PORT=8080
LOG_LEVEL=info
WHATSAPP_LOG_LEVEL=INFO
```

### 2. Run Prisma Migrations

From project root:

```bash
# Generate Prisma client
bun run db:generate

# Apply migrations (includes NOTIFY trigger)
bun run db:push
```

**Note:** The NOTIFY trigger for WhatsApp message processing is automatically applied as part of the main migration (`20260518032257_init/migration.sql`). No separate trigger file is needed.

### 3. Run the Service

```bash
cd services/whatsapp
go run ./cmd/server/main.go
```

Or use Task:

```bash
task run
```

## Verify It's Working

### Check Health

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T12:00:00Z"
}
```

### Check WhatsApp Status

```bash
curl http://localhost:8080/api/whatsapp/status
```

Expected response:

```json
{
  "connected": false,
  "logged_in": false
}
```

## Next Steps

### 1. Authenticate WhatsApp

Get QR code:

```bash
curl http://localhost:8080/api/whatsapp/qr
```

Scan the QR code with WhatsApp mobile app.

### 2. Sync Groups

```bash
curl -X POST http://localhost:8080/api/whatsapp/groups/sync
```

### 3. Enable Monitoring

Update database to monitor specific groups:

```sql
UPDATE groups
SET is_monitored = true
WHERE name LIKE '%pharmacy%';
```

### 4. Test Message Flow

Send a test message in a monitored WhatsApp group:

```
عندي باندول 500mg كمية 10 بسعر 50 جنيه
```

Check the queue:

```sql
SELECT * FROM whatsapp_message_queue
ORDER BY created_at DESC
LIMIT 10;
```

## Architecture Overview

```
services/whatsapp/
├── cmd/server/main.go          # Entry point
├── internal/
│   ├── domain/                 # Business entities
│   ├── usecase/                # Business logic
│   ├── port/                   # Interfaces
│   ├── adapter/                # Implementations
│   │   ├── whatsapp/           # WhatsApp client
│   │   ├── repository/         # GORM repository
│   │   └── api/                # Gin HTTP server
│   └── config/                 # Configuration
└── pkg/logger/                 # Logging utility
```

## Key Features

✅ **Clean Architecture** - Domain-driven design with dependency inversion
✅ **GORM** - Type-safe database access with manual models
✅ **PostgreSQL LISTEN/NOTIFY** - Real-time message processing
✅ **Retry Logic** - Exponential backoff with dead letter queue
✅ **Graceful Shutdown** - Proper cleanup on SIGINT/SIGTERM
✅ **Structured Logging** - zap logger with JSON output
✅ **Health Checks** - HTTP endpoints for monitoring

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql -h localhost -p 5433 -U postgres -d whatstrade -c "SELECT 1"
```

### WhatsApp Not Connecting

1. Check logs for errors
2. Verify QR code was scanned
3. Check session in database:

```sql
SELECT * FROM whatsapp_sessions;
```

### Messages Not Being Processed

1. Verify group is monitored:

```sql
SELECT * FROM groups WHERE is_monitored = true;
```

2. Check NOTIFY trigger exists:

```sql
SELECT tgname FROM pg_trigger
WHERE tgname = 'trigger_notify_new_whatsapp_message';
```

3. Verify Bun server is listening (separate service)

## Development

### Hot Reload

```bash
# Install air
task tools:air

# Run with hot reload
task dev
```

### Build

```bash
task build
```

### Run Tests

```bash
task test
```

### View All Tasks

```bash
task --list
```

## Docker

### Build Image

```bash
task docker:build
```

### Run Container

```bash
task docker:up
```

### View Logs

```bash
task docker:logs
```

## Production Deployment

See [SETUP.md](./SETUP.md) for detailed production deployment instructions.

## Documentation

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture details
- [SETUP.md](./SETUP.md) - Detailed setup guide

## Support

For issues or questions, check the logs:

```bash
# View logs
tail -f /path/to/logs

# Or if running with Docker
docker-compose logs -f whatsapp-service
```
