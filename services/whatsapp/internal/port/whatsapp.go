package port

import (
	"context"

	"whatstrade/whatsapp-service/internal/domain"
)

// WhatsAppClient defines the interface for WhatsApp operations
type WhatsAppClient interface {
	// Connect establishes connection to WhatsApp
	Connect(ctx context.Context) error

	// Disconnect closes the WhatsApp connection
	Disconnect() error

	// IsConnected checks if client is connected
	IsConnected() bool

	// IsLoggedIn checks if client is authenticated
	IsLoggedIn() bool

	// GetQRCode returns the QR code for authentication
	GetQRCode(ctx context.Context) (string, error)

	// GetJoinedGroups retrieves all groups the account is part of
	GetJoinedGroups(ctx context.Context) ([]*domain.Group, error)

	// SendMessage sends a text message to a group
	SendMessage(ctx context.Context, groupJID string, text string) error

	// SyncHistory manually triggers history sync for a specific group
	SyncHistory(ctx context.Context, groupJID string) error
}

// WhatsAppEventHandler defines the interface for handling WhatsApp events
type WhatsAppEventHandler interface {
	// OnMessage is called when a new message is received
	OnMessage(ctx context.Context, msg *domain.Message) error

	// OnConnected is called when connection is established
	OnConnected(ctx context.Context) error

	// OnDisconnected is called when connection is lost
	OnDisconnected(ctx context.Context) error
}
