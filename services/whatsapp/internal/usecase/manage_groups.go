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

	// Track errors with context about which groups failed
	type groupError struct {
		jid   string
		name  string
		error error
	}
	var syncErrors []groupError

	// Upsert each group
	for _, group := range whatsappGroups {
		if err := uc.groupRepo.UpsertGroup(ctx, group); err != nil {
			uc.logger.Error("failed to upsert group",
				zap.Error(err),
				zap.String("jid", group.JID),
				zap.String("name", group.Name),
			)
			syncErrors = append(syncErrors, groupError{
				jid:   group.JID,
				name:  group.Name,
				error: err,
			})
			// Continue with other groups
			continue
		}

		uc.logger.Debug("group synced",
			zap.String("jid", group.JID),
			zap.String("name", group.Name),
		)
	}

	// Log and return based on sync results
	if len(syncErrors) > 0 {
		// Build detailed error message with failed group info
		failedJIDs := make([]string, len(syncErrors))
		failedNames := make([]string, len(syncErrors))
		for i, ge := range syncErrors {
			failedJIDs[i] = ge.jid
			failedNames[i] = ge.name
		}

		uc.logger.Error("groups sync completed with errors",
			zap.Int("total", len(whatsappGroups)),
			zap.Int("failed", len(syncErrors)),
			zap.Int("succeeded", len(whatsappGroups)-len(syncErrors)),
			zap.Strings("failed_jids", failedJIDs),
			zap.Strings("failed_names", failedNames),
		)

		return fmt.Errorf("failed to sync %d of %d groups: %v", len(syncErrors), len(whatsappGroups), failedJIDs)
	}

	uc.logger.Info("groups synced successfully",
		zap.Int("count", len(whatsappGroups)),
	)

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
