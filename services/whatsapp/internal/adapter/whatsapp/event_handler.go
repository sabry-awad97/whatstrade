package whatsapp

import (
	"context"
	"os"

	"github.com/mdp/qrterminal/v3"
	"go.mau.fi/whatsmeow/types/events"
	"go.uber.org/zap"

	"whatstrade/whatsapp-service/internal/domain"
)

// handleEvent routes WhatsApp events to appropriate handlers
func (c *Client) handleEvent(evt interface{}) {
	ctx := context.Background()

	switch v := evt.(type) {
	case *events.Message:
		c.handleMessage(ctx, v)
	case *events.Connected:
		c.handleConnected(ctx)
	case *events.Disconnected:
		c.handleDisconnected(ctx)
	case *events.QR:
		c.handleQR(v)
	case *events.PairSuccess:
		c.handlePairSuccess(v)
	case *events.HistorySync:
		c.handleHistorySync(v)
	default:
		// Ignore other events
	}
}

// handleMessage processes incoming WhatsApp messages
func (c *Client) handleMessage(ctx context.Context, evt *events.Message) {
	// Only process group messages
	if !evt.Info.IsGroup {
		return
	}

	// Only process text messages
	text := evt.Message.GetConversation()
	if text == "" && evt.Message.GetExtendedTextMessage() != nil {
		text = evt.Message.GetExtendedTextMessage().GetText()
	}

	if text == "" {
		return
	}

	// Get group info
	groupInfo, err := c.client.GetGroupInfo(ctx, evt.Info.Chat)
	if err != nil {
		c.logger.Error("failed to get group info",
			zap.String("chat", evt.Info.Chat.String()),
			zap.Error(err),
		)
		return
	}

	// Create domain message
	msg := &domain.Message{
		WhatsAppID:  evt.Info.ID,
		GroupID:     evt.Info.Chat.String(),
		GroupName:   groupInfo.Name,
		SenderPhone: evt.Info.Sender.User,
		SenderName:  evt.Info.PushName,
		RawText:     text,
		ReceivedAt:  evt.Info.Timestamp,
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	// Call event handler
	if err := c.eventHandler.OnMessage(ctx, msg); err != nil {
		c.logger.Error("failed to handle message",
			zap.String("message_id", evt.Info.ID),
			zap.Error(err),
		)
	}
}

// handleConnected processes connection events
func (c *Client) handleConnected(ctx context.Context) {
	c.logger.Info("WhatsApp connected")

	if err := c.eventHandler.OnConnected(ctx); err != nil {
		c.logger.Error("failed to handle connected event", zap.Error(err))
	}
}

// handleDisconnected processes disconnection events
func (c *Client) handleDisconnected(ctx context.Context) {
	c.logger.Warn("WhatsApp disconnected")

	if err := c.eventHandler.OnDisconnected(ctx); err != nil {
		c.logger.Error("failed to handle disconnected event", zap.Error(err))
	}
}

// handleQR processes QR code events
func (c *Client) handleQR(evt *events.QR) {
	c.logger.Info("QR code received - scan with WhatsApp mobile app")

	// Print QR code to terminal
	qrterminal.GenerateHalfBlock(evt.Codes[0], qrterminal.L, os.Stdout)

	c.logger.Info("QR code displayed in terminal",
		zap.Int("codes_count", len(evt.Codes)),
	)
}

// handlePairSuccess processes successful pairing
func (c *Client) handlePairSuccess(evt *events.PairSuccess) {
	c.logger.Info("WhatsApp paired successfully",
		zap.String("id", evt.ID.String()),
	)

	// After first successful pairing, enable automatic history sync for future reconnections
	if c.isFirstLogin {
		c.isFirstLogin = false
		c.client.AutomaticMessageRerequestFromPhone = true
		c.logger.Info("first login completed - automatic history sync enabled for future reconnections")
	}
}

// handleHistorySync processes history sync events
func (c *Client) handleHistorySync(evt *events.HistorySync) {
	syncType := evt.Data.GetSyncType().String()

	if c.isFirstLogin {
		// Ignore history sync on first login - user will trigger manually
		c.logger.Info("ignoring history sync on first login (will sync manually)",
			zap.String("sync_type", syncType),
		)
		return
	}

	// Allow automatic history sync on reconnections
	c.logger.Info("processing automatic history sync on reconnection",
		zap.String("sync_type", syncType),
		zap.Int("conversations", len(evt.Data.GetConversations())),
	)

	// TODO: Process history sync data if needed
	// For now, just log that we received it
}
