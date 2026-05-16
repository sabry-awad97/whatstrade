package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/port"
)

// PostgresRepository implements repository interfaces using PostgreSQL
type PostgresRepository struct {
	db     *gorm.DB
	logger *zap.Logger
}

// NewPostgresRepository creates a new PostgreSQL repository
func NewPostgresRepository(databaseURL string, log *zap.Logger) (port.MessageRepository, port.GroupRepository, error) {
	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Silent)

	// Open database connection
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Test connection
	sqlDB, err := db.DB()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	repo := &PostgresRepository{
		db:     db,
		logger: log,
	}

	return repo, repo, nil
}

// Close closes the database connection
func (r *PostgresRepository) Close() error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// SaveMessage inserts a new message into the queue
func (r *PostgresRepository) SaveMessage(ctx context.Context, msg *domain.Message) error {
	dbMsg := &WhatsAppMessageQueue{
		WhatsAppMessageID: msg.WhatsAppID,
		WhatsAppGroupID:   msg.GroupID,
		GroupName:         msg.GroupName,
		SenderPhone:       msg.SenderPhone,
		RawText:           msg.RawText,
		ReceivedAt:        msg.ReceivedAt,
		Status:            string(msg.Status),
		RetryCount:        msg.RetryCount,
		MaxRetries:        msg.MaxRetries,
	}

	if msg.SenderName != "" {
		dbMsg.SenderName = &msg.SenderName
	}

	// Use ON CONFLICT DO NOTHING to handle duplicates
	result := r.db.WithContext(ctx).
		Exec("INSERT INTO whatsapp_message_queue (whatsapp_message_id, whatsapp_group_id, group_name, sender_phone, sender_name, raw_text, received_at, status, retry_count, max_retries) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (whatsapp_message_id) DO NOTHING",
			dbMsg.WhatsAppMessageID, dbMsg.WhatsAppGroupID, dbMsg.GroupName, dbMsg.SenderPhone, dbMsg.SenderName, dbMsg.RawText, dbMsg.ReceivedAt, dbMsg.Status, dbMsg.RetryCount, dbMsg.MaxRetries)

	if result.Error != nil {
		return fmt.Errorf("failed to insert message: %w", result.Error)
	}

	r.logger.Info("message saved to queue",
		zap.String("whatsapp_message_id", msg.WhatsAppID),
		zap.String("group_id", msg.GroupID),
	)

	return nil
}

// GetPendingMessages retrieves pending messages for processing
func (r *PostgresRepository) GetPendingMessages(ctx context.Context, limit int) ([]*domain.Message, error) {
	var dbMessages []WhatsAppMessageQueue

	// Use FOR UPDATE SKIP LOCKED for concurrent processing
	result := r.db.WithContext(ctx).
		Raw("SELECT * FROM whatsapp_message_queue WHERE status = ? ORDER BY created_at ASC LIMIT ? FOR UPDATE SKIP LOCKED", "pending", limit).
		Scan(&dbMessages)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to get pending messages: %w", result.Error)
	}

	messages := make([]*domain.Message, 0, len(dbMessages))
	for _, dbMsg := range dbMessages {
		msg := &domain.Message{
			ID:          dbMsg.ID.String(),
			WhatsAppID:  dbMsg.WhatsAppMessageID,
			GroupID:     dbMsg.WhatsAppGroupID,
			GroupName:   dbMsg.GroupName,
			SenderPhone: dbMsg.SenderPhone,
			RawText:     dbMsg.RawText,
			ReceivedAt:  dbMsg.ReceivedAt,
			Status:      domain.MessageStatus(dbMsg.Status),
			RetryCount:  dbMsg.RetryCount,
			MaxRetries:  dbMsg.MaxRetries,
		}

		if dbMsg.SenderName != nil {
			msg.SenderName = *dbMsg.SenderName
		}

		messages = append(messages, msg)
	}

	return messages, nil
}

// UpdateMessageStatus updates the status of a message
func (r *PostgresRepository) UpdateMessageStatus(ctx context.Context, id string, status domain.MessageStatus) error {
	msgID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid message ID: %w", err)
	}

	now := time.Now()
	result := r.db.WithContext(ctx).
		Model(&WhatsAppMessageQueue{}).
		Where("id = ?", msgID).
		Updates(map[string]interface{}{
			"status":       string(status),
			"processed_at": now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update message status: %w", result.Error)
	}

	return nil
}

// MarkMessageFailed marks a message as failed with error details
func (r *PostgresRepository) MarkMessageFailed(ctx context.Context, id string, err error) error {
	msgID, parseErr := uuid.Parse(id)
	if parseErr != nil {
		return fmt.Errorf("invalid message ID: %w", parseErr)
	}

	now := time.Now()
	errMsg := err.Error()

	result := r.db.WithContext(ctx).
		Model(&WhatsAppMessageQueue{}).
		Where("id = ?", msgID).
		Updates(map[string]interface{}{
			"status":        "failed",
			"retry_count":   gorm.Expr("retry_count + 1"),
			"last_error":    errMsg,
			"last_error_at": now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to mark message as failed: %w", result.Error)
	}

	return nil
}

// MarkMessageCompleted marks a message as completed
func (r *PostgresRepository) MarkMessageCompleted(ctx context.Context, id string) error {
	msgID, err := uuid.Parse(id)
	if err != nil {
		return fmt.Errorf("invalid message ID: %w", err)
	}

	now := time.Now()
	result := r.db.WithContext(ctx).
		Model(&WhatsAppMessageQueue{}).
		Where("id = ?", msgID).
		Updates(map[string]interface{}{
			"status":       "completed",
			"completed_at": now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to mark message as completed: %w", result.Error)
	}

	return nil
}

// GetMonitoredGroups retrieves all groups that should be monitored
func (r *PostgresRepository) GetMonitoredGroups(ctx context.Context) ([]*domain.Group, error) {
	var dbGroups []Group

	result := r.db.WithContext(ctx).
		Where("is_monitored = ?", true).
		Find(&dbGroups)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to get monitored groups: %w", result.Error)
	}

	groups := make([]*domain.Group, 0, len(dbGroups))
	for _, dbGroup := range dbGroups {
		group := &domain.Group{
			ID:            dbGroup.ID.String(),
			JID:           dbGroup.JID,
			Name:          dbGroup.Name,
			IsMonitored:   dbGroup.IsMonitored,
			MemberCount:   dbGroup.MemberCount,
			LastMessageAt: dbGroup.LastMessageAt,
			CreatedAt:     dbGroup.CreatedAt,
			UpdatedAt:     dbGroup.UpdatedAt,
		}

		groups = append(groups, group)
	}

	return groups, nil
}

// GetGroupByJID retrieves a group by its WhatsApp JID
func (r *PostgresRepository) GetGroupByJID(ctx context.Context, jid string) (*domain.Group, error) {
	var dbGroup Group

	result := r.db.WithContext(ctx).
		Where("jid = ?", jid).
		First(&dbGroup)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("group not found: %w", result.Error)
		}
		return nil, fmt.Errorf("failed to get group by JID: %w", result.Error)
	}

	group := &domain.Group{
		ID:            dbGroup.ID.String(),
		JID:           dbGroup.JID,
		Name:          dbGroup.Name,
		IsMonitored:   dbGroup.IsMonitored,
		MemberCount:   dbGroup.MemberCount,
		LastMessageAt: dbGroup.LastMessageAt,
		CreatedAt:     dbGroup.CreatedAt,
		UpdatedAt:     dbGroup.UpdatedAt,
	}

	return group, nil
}

// UpsertGroup creates or updates a group
func (r *PostgresRepository) UpsertGroup(ctx context.Context, group *domain.Group) error {
	dbGroup := &Group{
		JID:           group.JID,
		Name:          group.Name,
		IsMonitored:   group.IsMonitored,
		MemberCount:   group.MemberCount,
		LastMessageAt: group.LastMessageAt,
	}

	// GORM upsert using raw SQL
	result := r.db.WithContext(ctx).
		Exec("INSERT INTO groups (jid, name, is_monitored, member_count, last_message_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (jid) DO UPDATE SET name = EXCLUDED.name, is_monitored = EXCLUDED.is_monitored, member_count = EXCLUDED.member_count, last_message_at = EXCLUDED.last_message_at, updated_at = NOW()",
			dbGroup.JID, dbGroup.Name, dbGroup.IsMonitored, dbGroup.MemberCount, dbGroup.LastMessageAt)

	if result.Error != nil {
		return fmt.Errorf("failed to upsert group: %w", result.Error)
	}

	return nil
}

// UpdateGroupLastMessage updates the last message timestamp
func (r *PostgresRepository) UpdateGroupLastMessage(ctx context.Context, jid string) error {
	now := time.Now()

	result := r.db.WithContext(ctx).
		Model(&Group{}).
		Where("jid = ?", jid).
		Updates(map[string]interface{}{
			"last_message_at": now,
			"updated_at":      now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update group last message: %w", result.Error)
	}

	return nil
}
