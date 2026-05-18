# WhatsApp Service Architecture

## Overview

This service implements **Clean Architecture** principles with **Domain-Driven Design** patterns for WhatsApp integration.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                         cmd/server                          │
│                    (Application Entry)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    internal/adapter                         │
│              (External System Integrations)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  WhatsApp    │  │     API      │  │  Repository  │     │
│  │   (Client)   │  │  (Gin HTTP)  │  │ (PostgreSQL) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     internal/usecase                        │
│                  (Business Logic Layer)                     │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ ProcessMessage   │  │  ManageGroups    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      internal/port                          │
│                  (Interface Definitions)                    │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ WhatsAppClient   │  │   Repository     │               │
│  │   (interface)    │  │   (interface)    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     internal/domain                         │
│                  (Business Entities)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Message  │  │  Group   │  │ Session  │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Dependency Rule

**Dependencies point inward:** `domain` ← `usecase` ← `adapter` ← `cmd`

- **Domain** has no dependencies (pure business logic)
- **Use Cases** depend only on domain and port interfaces
- **Adapters** implement port interfaces and depend on external libraries
- **CMD** wires everything together (dependency injection)

## Data Flow

### Incoming WhatsApp Message

```
WhatsApp → whatsmeow → Client.handleEvent() → EventHandler.OnMessage()
    ↓
ProcessMessage.Execute() → Validate → Check Group → Save to Queue
    ↓
PostgreSQL INSERT → NOTIFY trigger → Bun Server (LISTEN)
    ↓
AI Extraction → Create Offer/Request → Matching Algorithm
```

### HTTP API Request

```
HTTP Request → Gin Router → Handler → Use Case → Repository → Database
    ↓
Response ← JSON ← Handler ← Use Case ← Repository ← Query Result
```

## Key Design Patterns

### 1. Dependency Inversion Principle (DIP)

Use cases depend on **interfaces** (ports), not concrete implementations:

```go
// ❌ BAD: Direct dependency on concrete type
type ProcessMessage struct {
    repo *PostgresRepository  // Tight coupling
}

// ✅ GOOD: Dependency on interface
type ProcessMessage struct {
    repo port.MessageRepository  // Loose coupling
}
```

### 2. Repository Pattern

All database access goes through repository interfaces:

```go
// Port (interface)
type MessageRepository interface {
    SaveMessage(ctx context.Context, msg *domain.Message) error
    GetPendingMessages(ctx context.Context, limit int) ([]*domain.Message, error)
}

// Adapter (implementation using GORM)
type PostgresRepository struct {
    db     *gorm.DB
    logger *zap.Logger
}

func (r *PostgresRepository) SaveMessage(ctx context.Context, msg *domain.Message) error {
    // Map domain entity to GORM model
    dbMsg := &WhatsAppMessageQueue{
        WhatsAppMessageID: msg.WhatsAppID,
        WhatsAppGroupID:   msg.GroupID,
        GroupName:         msg.GroupName,
        SenderPhone:       msg.SenderPhone,
        RawText:           msg.RawText,
        ReceivedAt:        msg.ReceivedAt,
        Status:            string(msg.Status),
    }

    // Use GORM to insert
    return r.db.WithContext(ctx).Create(dbMsg).Error
}

func (r *PostgresRepository) GetPendingMessages(ctx context.Context, limit int) ([]*domain.Message, error) {
    var dbMessages []WhatsAppMessageQueue

    // Use GORM query with WHERE and LIMIT
    err := r.db.WithContext(ctx).
        Where("status = ?", "pending").
        Order("created_at ASC").
        Limit(limit).
        Find(&dbMessages).Error

    if err != nil {
        return nil, err
    }

    // Map GORM models back to domain entities
    messages := make([]*domain.Message, len(dbMessages))
    for i, dbMsg := range dbMessages {
        messages[i] = &domain.Message{
            ID:          dbMsg.ID,
            WhatsAppID:  dbMsg.WhatsAppMessageID,
            GroupID:     dbMsg.WhatsAppGroupID,
            GroupName:   dbMsg.GroupName,
            SenderPhone: dbMsg.SenderPhone,
            RawText:     dbMsg.RawText,
            ReceivedAt:  dbMsg.ReceivedAt,
            Status:      domain.MessageStatus(dbMsg.Status),
        }
    }

    return messages, nil
}
```

### 3. Event Handler Pattern

WhatsApp events are routed through a handler:

```go
type WhatsAppEventHandler interface {
    OnMessage(ctx context.Context, msg *domain.Message) error
    OnConnected(ctx context.Context) error
    OnDisconnected(ctx context.Context) error
}
```

### 4. Use Case Pattern

Each business operation is a separate use case:

```go
type ProcessMessage struct {
    messageRepo port.MessageRepository
    groupRepo   port.GroupRepository
    logger      *zap.Logger
}

func (uc *ProcessMessage) Execute(ctx context.Context, msg *domain.Message) error {
    // Business logic here
}
```

## Testing Strategy

### Unit Tests (Use Cases)

Test business logic in isolation using mocks:

```go
func TestProcessMessage_Execute(t *testing.T) {
    mockRepo := &MockMessageRepository{}
    mockGroupRepo := &MockGroupRepository{}
    logger := zap.NewNop()

    uc := usecase.NewProcessMessage(mockRepo, mockGroupRepo, logger)

    msg := &domain.Message{
        WhatsAppID: "test-123",
        RawText: "test message",
    }

    err := uc.Execute(context.Background(), msg)
    assert.NoError(t, err)
    assert.True(t, mockRepo.SaveCalled)
}
```

### Integration Tests (Adapters)

Test adapters with real dependencies:

```go
func TestPostgresRepository_SaveMessage(t *testing.T) {
    // Use testcontainers for real PostgreSQL
    pool := setupTestDatabase(t)
    defer pool.Close()

    repo := repository.NewPostgresRepository(pool, logger)

    msg := &domain.Message{...}
    err := repo.SaveMessage(context.Background(), msg)

    assert.NoError(t, err)
}
```

### End-to-End Tests

Test complete flows:

```go
func TestWhatsAppMessageFlow(t *testing.T) {
    // Start test server
    // Send mock WhatsApp message
    // Verify message in database
    // Verify NOTIFY was sent
}
```

## Configuration

Configuration is loaded from environment variables using `envconfig`:

```go
type Config struct {
    DatabaseURL      string `envconfig:"DATABASE_URL" required:"true"`
    Port             int    `envconfig:"PORT" default:"8080"`
    LogLevel         string `envconfig:"LOG_LEVEL" default:"info"`
    WhatsAppLogLevel string `envconfig:"WHATSAPP_LOG_LEVEL" default:"INFO"`
}
```

## Logging

Structured logging with zap:

```go
logger.Info("message processed",
    zap.String("message_id", msg.ID),
    zap.String("group_name", msg.GroupName),
    zap.Duration("latency", time.Since(start)),
)
```

## Error Handling

Domain errors are defined in `domain/errors.go`:

```go
var (
    ErrEmptyMessage = errors.New("message text cannot be empty")
    ErrGroupNotMonitored = errors.New("group is not monitored")
    ErrNotConnected = errors.New("whatsapp client not connected")
)
```

Use cases wrap errors with context:

```go
if err := msg.Validate(); err != nil {
    return fmt.Errorf("message validation failed: %w", err)
}
```

## Database Access

### GORM for Type-Safe Database Access

GORM provides type-safe database operations with struct tags:

```go
type WhatsAppMessageQueue struct {
    ID                uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    WhatsAppMessageID string     `gorm:"column:whatsapp_message_id;uniqueIndex;not null"`
    // ... other fields
}
```

Repository methods use GORM's chainable API:

```go
func (r *PostgresRepository) InsertMessage(ctx context.Context, msg *domain.Message) error {
    queue := &WhatsAppMessageQueue{
        WhatsAppMessageID: msg.WhatsAppID,
        // ... map fields
    }
    return r.db.WithContext(ctx).Create(queue).Error
}
```

### Connection Pooling

GORM uses database/sql connection pooling for efficient database access:

```go
db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
    Logger: gormLogger,
})
```

## Graceful Shutdown

The service handles SIGINT/SIGTERM for graceful shutdown:

```go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Shutdown HTTP server
server.Shutdown(ctx)

// Disconnect WhatsApp
whatsappClient.Disconnect()
```

## Performance Considerations

1. **Connection Pooling**: GORM uses database/sql connection pooling
2. **Prepared Statements**: GORM automatically uses prepared statements
3. **Batch Processing**: Process multiple messages in parallel
4. **Indexes**: Database indexes on frequently queried fields
5. **SKIP LOCKED**: Prevents race conditions in queue processing

## Security

1. **PII/PHI Protection**: Sensitive fields documented in schema
2. **Input Validation**: Domain entities validate themselves
3. **SQL Injection**: GORM uses parameterized queries
4. **Localhost Only**: API binds to localhost in sidecar mode
5. **Structured Logging**: Never log sensitive data

## Monitoring

Key metrics to track:

- WhatsApp connection status
- Messages received/sec
- Queue depth (pending messages)
- Processing latency
- Error rate
- Retry count

## Future Enhancements

1. **Metrics Endpoint**: Prometheus metrics at `/metrics`
2. **Distributed Tracing**: OpenTelemetry integration
3. **Circuit Breaker**: Prevent cascade failures
4. **Rate Limiting**: Protect against message floods
5. **Message Deduplication**: Redis-based dedup cache
6. **Multi-Account Support**: Multiple WhatsApp accounts
