# WhatsApp Service Setup Guide

## Prerequisites

- **Go 1.22+**: [Download](https://go.dev/dl/)
- **PostgreSQL 15+**: Running on port 5433
- **Air** (optional, for hot reload): `go install github.com/cosmtrek/air@latest`

## Step 1: Database Setup

The database is shared with the Bun server. Migrations are managed by Prisma.

### Run Prisma Migrations

From the project root:

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Or create migration
bun run db:migrate
```

### Apply NOTIFY Trigger

The NOTIFY trigger is in `packages/db/prisma/migrations/add_whatsapp_notify_trigger.sql`.

Apply it manually:

```bash
psql -h localhost -p 5433 -U postgres -d whatstrade -f packages/db/prisma/migrations/add_whatsapp_notify_trigger.sql
```

Or include it in your migration workflow.

## Step 2: Install Dependencies

From `services/whatsapp`:

```bash
go mod download
```

GORM models are already defined in `internal/adapter/repository/models.go` - no code generation needed.

## Step 3: Environment Configuration

Create `.env` file in `services/whatsapp`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/whatstrade
PORT=8080
LOG_LEVEL=info
WHATSAPP_LOG_LEVEL=INFO
```

## Step 4: Run the Service

### Development (with hot reload)

```bash
task dev
```

### Production

```bash
task build
./bin/whatsapp-service
```

### Docker

```bash
# Build image
task docker:build

# Run container
task docker:run
```

## Step 5: WhatsApp Authentication

### Get QR Code

```bash
curl http://localhost:8080/api/whatsapp/qr
```

Response:

```json
{
  "qr_code": "2@abc123..."
}
```

### Scan QR Code

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code

### Verify Connection

```bash
curl http://localhost:8080/api/whatsapp/status
```

Response:

```json
{
  "connected": true,
  "logged_in": true
}
```

## Step 6: Sync Groups

After authentication, sync WhatsApp groups:

```bash
curl -X POST http://localhost:8080/api/whatsapp/groups/sync
```

This will:

1. Fetch all groups from WhatsApp
2. Insert/update them in the database
3. Set `is_monitored = false` by default

## Step 7: Enable Group Monitoring

Update groups in the database to enable monitoring:

```sql
UPDATE groups
SET is_monitored = true
WHERE name LIKE '%pharmacy%';
```

Or use the Bun server API to manage groups.

## Step 8: Test Message Flow

### Send Test Message

Send a message in a monitored WhatsApp group:

```
عندي باندول 500mg كمية 10 بسعر 50 جنيه
```

### Verify Queue

Check the message queue:

```sql
SELECT * FROM whatsapp_message_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Check Logs

```bash
# Service logs
tail -f /path/to/logs

# Or if running with task dev
# Logs appear in terminal
```

## Troubleshooting

### Issue: Database connection failed

Check PostgreSQL is running:

```bash
psql -h localhost -p 5433 -U postgres -d whatstrade -c "SELECT 1"
```

### Issue: WhatsApp not connecting

1. Check logs for errors
2. Verify QR code was scanned
3. Check WhatsApp session in database:

```sql
SELECT * FROM whatsapp_sessions;
```

### Issue: Messages not being processed

1. Verify group is monitored:

```sql
SELECT * FROM groups WHERE is_monitored = true;
```

2. Check NOTIFY trigger exists:

```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_notify_new_whatsapp_message';
```

3. Verify Bun server is listening:

```typescript
// In Bun server, check LISTEN connection
```

### Issue: Build errors

```bash
# Clean and rebuild
task clean
go mod tidy
task build
```

## Development Workflow

### 1. Make Schema Changes

Edit Prisma schema in `packages/db/prisma/schema/`:

```prisma
model WhatsAppMessageQueue {
  // Add new field
  priority Int @default(0)
}
```

### 2. Generate Migration

```bash
cd packages/db
bun run db:migrate
```

### 3. Update SQL Queries

### 3. Update GORM Models

Edit `services/whatsapp/internal/adapter/repository/models.go`:

### 4. Update Dependencies

```bash
cd services/whatsapp
go mod tidy
```

### 5. Update Use Cases

Use the updated GORM models in your use cases.

### 6. Test

```bash
task test
```

## Docker Compose Setup

### Start All Services

```bash
docker-compose up -d
```

This starts:

- PostgreSQL (port 5433)
- WhatsApp Service (port 8080)
- Bun Server (port 3000)

### View Logs

```bash
# All services
docker-compose logs -f

# WhatsApp service only
docker-compose logs -f whatsapp-service
```

### Stop Services

```bash
docker-compose down
```

### Rebuild After Changes

```bash
docker-compose up -d --build whatsapp-service
```

## Production Deployment

### 1. Build Optimized Binary

```bash
CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o whatsapp-service ./cmd/server
```

### 2. Set Environment Variables

```bash
export DATABASE_URL="postgresql://user:pass@prod-db:5432/whatstrade"
export PORT=8080
export LOG_LEVEL=warn
```

### 3. Run with Systemd

Create `/etc/systemd/system/whatsapp-service.service`:

```ini
[Unit]
Description=WhatsApp Service
After=network.target postgresql.service

[Service]
Type=simple
User=whatsapp
WorkingDirectory=/opt/whatsapp-service
EnvironmentFile=/opt/whatsapp-service/.env
ExecStart=/opt/whatsapp-service/whatsapp-service
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable whatsapp-service
sudo systemctl start whatsapp-service
sudo systemctl status whatsapp-service
```

### 4. Monitor

```bash
# Logs
sudo journalctl -u whatsapp-service -f

# Health check
curl http://localhost:8080/health
```

## Next Steps

1. **Configure Monitoring**: Set up Prometheus metrics
2. **Set Up Alerts**: Alert on connection failures
3. **Enable Backups**: Backup WhatsApp session data
4. **Load Testing**: Test with high message volume
5. **Security Audit**: Review PII/PHI handling

## Resources

- [whatsmeow Documentation](https://pkg.go.dev/go.mau.fi/whatsmeow)
- [GORM Documentation](https://gorm.io/docs/)
- [Gin Documentation](https://gin-gonic.com/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
