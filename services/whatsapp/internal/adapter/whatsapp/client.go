package whatsapp

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"go.uber.org/zap"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/port"
)

// Client implements the WhatsApp client using whatsmeow
type Client struct {
	client       *whatsmeow.Client
	eventHandler port.WhatsAppEventHandler
	logger       *zap.Logger
	qrChan       <-chan whatsmeow.QRChannelItem
	isFirstLogin bool // Track if this is the first login
	maxRetries   int  // Maximum retry attempts for message processing
	mu           sync.Mutex
}

// NewClient creates a new WhatsApp client
func NewClient(
	databaseURL string,
	eventHandler port.WhatsAppEventHandler,
	logLevel string,
	maxRetries int,
	logger *zap.Logger,
) (*Client, error) {
	// Create whatsmeow logger
	waLogger := waLog.Stdout("WhatsApp", logLevel, true)

	// Connect to database for session storage
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	container, err := sqlstore.New(ctx, "postgres", databaseURL, waLogger)
	if err != nil {
		return nil, fmt.Errorf("failed to create sqlstore: %w", err)
	}

	// Get first device (or create new)
	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get device: %w", err)
	}

	// Create WhatsApp client
	client := whatsmeow.NewClient(deviceStore, waLogger)

	// Check if this is first login (no stored session)
	isFirstLogin := deviceStore.ID == nil

	// Enable auto-reconnect for all cases
	client.EnableAutoReconnect = true

	// Only disable automatic message re-request on first login
	// After first login, allow automatic history sync on reconnections
	if isFirstLogin {
		client.AutomaticMessageRerequestFromPhone = false
		logger.Info("first login detected - history sync disabled until manual trigger")
	} else {
		client.AutomaticMessageRerequestFromPhone = true
		logger.Info("existing session found - automatic history sync enabled")
	}

	waClient := &Client{
		client:       client,
		eventHandler: eventHandler,
		logger:       logger,
		isFirstLogin: isFirstLogin,
		maxRetries:   maxRetries,
	}

	// Register event handler
	client.AddEventHandler(waClient.handleEvent)

	return waClient, nil
}

// Connect establishes connection to WhatsApp
func (c *Client) Connect(ctx context.Context) error {
	if c.client.Store.ID == nil {
		// No ID stored, new login required
		qrChan, err := c.client.GetQRChannel(ctx)
		if err != nil {
			return fmt.Errorf("failed to get QR channel: %w", err)
		}
		c.qrChan = qrChan

		c.logger.Info("QR code required for authentication")
	}

	if err := c.client.Connect(); err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	c.logger.Info("WhatsApp client connected")
	return nil
}

// Disconnect closes the WhatsApp connection
func (c *Client) Disconnect() error {
	if c.client != nil {
		c.client.Disconnect()
	}
	c.logger.Info("WhatsApp client disconnected")
	return nil
}
func (c *Client) IsConnected() bool {
	if c.client == nil {
		return false
	}
	return c.client.IsConnected()
}

// IsLoggedIn checks if client is authenticated
func (c *Client) IsLoggedIn() bool {
	if c.client == nil {
		return false
	}
	return c.client.IsLoggedIn()
}

// GetQRCode returns the QR code for authentication
func (c *Client) GetQRCode(ctx context.Context) (string, error) {
	if c.qrChan == nil {
		return "", fmt.Errorf("QR channel not available")
	}

	select {
	case evt := <-c.qrChan:
		if evt.Event == "code" {
			return evt.Code, nil
		}
		return "", fmt.Errorf("unexpected QR event: %s", evt.Event)
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

// GetJoinedGroups retrieves all groups the account is part of
func (c *Client) GetJoinedGroups(ctx context.Context) ([]*domain.Group, error) {
	if !c.IsLoggedIn() {
		return nil, domain.ErrNotAuthenticated
	}

	groups, err := c.client.GetJoinedGroups(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get joined groups: %w", err)
	}

	domainGroups := make([]*domain.Group, 0, len(groups))
	for _, groupInfo := range groups {
		domainGroups = append(domainGroups, &domain.Group{
			JID:         groupInfo.JID.String(),
			Name:        groupInfo.Name,
			MemberCount: len(groupInfo.Participants),
		})
	}

	return domainGroups, nil
}

// SendMessage sends a text message to a group
func (c *Client) SendMessage(ctx context.Context, groupJID string, text string) error {
	if !c.IsLoggedIn() {
		return domain.ErrNotAuthenticated
	}

	jid, err := types.ParseJID(groupJID)
	if err != nil {
		return fmt.Errorf("invalid JID: %w", err)
	}

	// Note: Sending messages requires proper WhatsApp message proto
	// This is a placeholder - implement based on whatsmeow documentation
	_ = jid
	_ = text

	return fmt.Errorf("send message not yet implemented")
}

// SyncHistory manually triggers history sync for a specific group
// Call this when you're ready to sync message history
func (c *Client) SyncHistory(ctx context.Context, groupJID string) error {
	if !c.IsLoggedIn() {
		return domain.ErrNotAuthenticated
	}

	jid, err := types.ParseJID(groupJID)
	if err != nil {
		return fmt.Errorf("invalid JID: %w", err)
	}

	c.logger.Info("manually syncing history for group",
		zap.String("group_jid", groupJID),
	)

	// Request history sync for specific group
	// Note: This is a placeholder - implement based on whatsmeow's history sync API
	_ = jid

	return fmt.Errorf("manual history sync not yet implemented")
}
