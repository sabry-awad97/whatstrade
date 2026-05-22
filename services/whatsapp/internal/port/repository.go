package port

import (
	"context"

	"whatstrade/whatsapp-service/internal/domain"
)

// MessageRepository defines the interface for message persistence
type MessageRepository interface {
	// SaveMessage inserts a new message into the queue
	// Message processing (status updates, retries, etc.) is handled by the TypeScript/Bun service
	SaveMessage(ctx context.Context, msg *domain.Message) error
}

// GroupRepository defines the interface for group management
type GroupRepository interface {
	// GetMonitoredGroups retrieves all groups that should be monitored
	GetMonitoredGroups(ctx context.Context) ([]*domain.Group, error)

	// GetGroupByJID retrieves a group by its WhatsApp JID
	GetGroupByJID(ctx context.Context, jid string) (*domain.Group, error)

	// UpsertGroup creates or updates a group
	UpsertGroup(ctx context.Context, group *domain.Group) error

	// UpdateGroupLastMessage updates the last message timestamp
	UpdateGroupLastMessage(ctx context.Context, jid string) error
}

// SessionRepository defines the interface for session management
type SessionRepository interface {
	// GetSession retrieves the WhatsApp session
	GetSession(ctx context.Context) (*domain.Session, error)

	// SaveSession saves or updates the session
	SaveSession(ctx context.Context, session *domain.Session) error

	// UpdateConnectionStatus updates the connection status
	UpdateConnectionStatus(ctx context.Context, connected bool) error
}
