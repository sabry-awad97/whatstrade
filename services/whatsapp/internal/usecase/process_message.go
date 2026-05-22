package usecase

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/port"
)

// ProcessMessage handles incoming WhatsApp messages
type ProcessMessage struct {
	messageRepo port.MessageRepository
	groupRepo   port.GroupRepository
	logger      *zap.Logger
}

// NewProcessMessage creates a new ProcessMessage use case
func NewProcessMessage(
	messageRepo port.MessageRepository,
	groupRepo port.GroupRepository,
	logger *zap.Logger,
) *ProcessMessage {
	return &ProcessMessage{
		messageRepo: messageRepo,
		groupRepo:   groupRepo,
		logger:      logger,
	}
}

// Execute processes a WhatsApp message
func (uc *ProcessMessage) Execute(ctx context.Context, msg *domain.Message) error {
	// Validate message
	if err := msg.Validate(); err != nil {
		uc.logger.Error("invalid message",
			zap.Error(err),
			zap.String("whatsapp_message_id", msg.WhatsAppID),
		)
		return fmt.Errorf("message validation failed: %w", err)
	}

	// Check if group is monitored
	group, err := uc.groupRepo.GetGroupByJID(ctx, msg.GroupID)
	if err != nil {
		uc.logger.Error("failed to get group",
			zap.Error(err),
			zap.String("group_jid", msg.GroupID),
		)
		return fmt.Errorf("failed to get group: %w", err)
	}

	if !group.ShouldProcessMessages() {
		uc.logger.Debug("skipping message from unmonitored group",
			zap.String("group_jid", msg.GroupID),
			zap.String("group_name", group.Name),
		)
		return domain.ErrGroupNotMonitored
	}

	// Save message to queue (will trigger NOTIFY)
	if err := uc.messageRepo.SaveMessage(ctx, msg); err != nil {
		uc.logger.Error("failed to save message",
			zap.Error(err),
			zap.String("whatsapp_message_id", msg.WhatsAppID),
		)
		return fmt.Errorf("failed to save message: %w", err)
	}

	// Update group's last message timestamp
	if err := uc.groupRepo.UpdateGroupLastMessage(ctx, msg.GroupID); err != nil {
		uc.logger.Warn("failed to update group last message",
			zap.Error(err),
			zap.String("group_jid", msg.GroupID),
		)
		// Non-critical error, don't fail the operation
	}

	uc.logger.Info("message processed successfully",
		zap.String("whatsapp_message_id", msg.WhatsAppID),
		zap.String("group_name", msg.GroupName),
		zap.String("sender", msg.SenderPhone),
	)

	return nil
}
