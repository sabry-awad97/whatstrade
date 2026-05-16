package usecase

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/port"
)

// ManageGroups handles group synchronization and management
type ManageGroups struct {
	groupRepo      port.GroupRepository
	whatsappClient port.WhatsAppClient
	logger         *zap.Logger
}

// NewManageGroups creates a new ManageGroups use case
func NewManageGroups(
	groupRepo port.GroupRepository,
	whatsappClient port.WhatsAppClient,
	logger *zap.Logger,
) *ManageGroups {
	return &ManageGroups{
		groupRepo:      groupRepo,
		whatsappClient: whatsappClient,
		logger:         logger,
	}
}

// SyncGroups synchronizes WhatsApp groups with the database
func (uc *ManageGroups) SyncGroups(ctx context.Context) error {
	if !uc.whatsappClient.IsLoggedIn() {
		return domain.ErrNotAuthenticated
	}

	// Get groups from WhatsApp
	whatsappGroups, err := uc.whatsappClient.GetJoinedGroups(ctx)
	if err != nil {
		uc.logger.Error("failed to get WhatsApp groups", zap.Error(err))
		return fmt.Errorf("failed to get WhatsApp groups: %w", err)
	}

	uc.logger.Info("syncing groups", zap.Int("count", len(whatsappGroups)))

	// Track errors but continue syncing other groups
	var syncErrors []error

	// Upsert each group
	for _, group := range whatsappGroups {
		if err := uc.groupRepo.UpsertGroup(ctx, group); err != nil {
			uc.logger.Error("failed to upsert group",
				zap.Error(err),
				zap.String("jid", group.JID),
				zap.String("name", group.Name),
			)
			syncErrors = append(syncErrors, err)
			// Continue with other groups
			continue
		}

		uc.logger.Debug("group synced",
			zap.String("jid", group.JID),
			zap.String("name", group.Name),
		)
	}

	uc.logger.Info("groups synced successfully", zap.Int("count", len(whatsappGroups)))

	// Return error if any groups failed to sync
	if len(syncErrors) > 0 {
		return fmt.Errorf("failed to sync %d groups", len(syncErrors))
	}

	return nil
}

// GetMonitoredGroups retrieves all monitored groups
func (uc *ManageGroups) GetMonitoredGroups(ctx context.Context) ([]*domain.Group, error) {
	groups, err := uc.groupRepo.GetMonitoredGroups(ctx)
	if err != nil {
		uc.logger.Error("failed to get monitored groups", zap.Error(err))
		return nil, fmt.Errorf("failed to get monitored groups: %w", err)
	}

	return groups, nil
}
