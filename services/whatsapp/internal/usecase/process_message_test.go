package usecase

import (
	"context"
	"errors"
	"testing"
	"time"

	"go.uber.org/zap/zaptest"

	"whatstrade/whatsapp-service/internal/domain"
)

func TestProcessMessage_Execute_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)
	messageRepo := &mockMessageRepository{}
	groupRepo := &mockGroupRepository{}

	uc := NewProcessMessage(messageRepo, groupRepo, logger)

	msg := &domain.Message{
		WhatsAppID:  "msg123",
		GroupID:     "123456789@g.us",
		GroupName:   "Test Group",
		SenderPhone: "201234567890",
		RawText:     "Hello World",
		ReceivedAt:  time.Now(),
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	err := uc.Execute(context.Background(), msg)
	if err != nil {
		t.Errorf("Execute() error = %v, want nil", err)
	}
}

func TestProcessMessage_Execute_InvalidMessage(t *testing.T) {
	logger := zaptest.NewLogger(t)
	messageRepo := &mockMessageRepository{}
	groupRepo := &mockGroupRepository{}

	uc := NewProcessMessage(messageRepo, groupRepo, logger)

	msg := &domain.Message{
		WhatsAppID:  "msg123",
		GroupID:     "123456789@g.us",
		GroupName:   "Test Group",
		SenderPhone: "201234567890",
		RawText:     "", // Invalid: empty text
		ReceivedAt:  time.Now(),
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	err := uc.Execute(context.Background(), msg)
	if err == nil {
		t.Error("Execute() error = nil, want error for invalid message")
	}
}

func TestProcessMessage_Execute_GroupNotFound(t *testing.T) {
	logger := zaptest.NewLogger(t)
	messageRepo := &mockMessageRepository{}
	groupRepo := &mockGroupRepository{
		getGroupByJIDFunc: func(ctx context.Context, jid string) (*domain.Group, error) {
			return nil, errors.New("group not found")
		},
	}

	uc := NewProcessMessage(messageRepo, groupRepo, logger)

	msg := &domain.Message{
		WhatsAppID:  "msg123",
		GroupID:     "123456789@g.us",
		GroupName:   "Test Group",
		SenderPhone: "201234567890",
		RawText:     "Hello World",
		ReceivedAt:  time.Now(),
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	err := uc.Execute(context.Background(), msg)
	if err == nil {
		t.Error("Execute() error = nil, want error for group not found")
	}
}

func TestProcessMessage_Execute_GroupNotMonitored(t *testing.T) {
	logger := zaptest.NewLogger(t)
	messageRepo := &mockMessageRepository{}
	groupRepo := &mockGroupRepository{
		getGroupByJIDFunc: func(ctx context.Context, jid string) (*domain.Group, error) {
			return &domain.Group{
				JID:         jid,
				Name:        "Test Group",
				IsMonitored: false, // Not monitored
			}, nil
		},
	}

	uc := NewProcessMessage(messageRepo, groupRepo, logger)

	msg := &domain.Message{
		WhatsAppID:  "msg123",
		GroupID:     "123456789@g.us",
		GroupName:   "Test Group",
		SenderPhone: "201234567890",
		RawText:     "Hello World",
		ReceivedAt:  time.Now(),
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	err := uc.Execute(context.Background(), msg)
	if !errors.Is(err, domain.ErrGroupNotMonitored) {
		t.Errorf("Execute() error = %v, want %v", err, domain.ErrGroupNotMonitored)
	}
}

func TestProcessMessage_Execute_SaveMessageError(t *testing.T) {
	logger := zaptest.NewLogger(t)
	saveErr := errors.New("database error")
	messageRepo := &mockMessageRepository{
		saveMessageFunc: func(ctx context.Context, msg *domain.Message) error {
			return saveErr
		},
	}
	groupRepo := &mockGroupRepository{}

	uc := NewProcessMessage(messageRepo, groupRepo, logger)

	msg := &domain.Message{
		WhatsAppID:  "msg123",
		GroupID:     "123456789@g.us",
		GroupName:   "Test Group",
		SenderPhone: "201234567890",
		RawText:     "Hello World",
		ReceivedAt:  time.Now(),
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	err := uc.Execute(context.Background(), msg)
	if err == nil {
		t.Error("Execute() error = nil, want error for save message failure")
	}
}

func TestProcessMessage_Execute_UpdateGroupLastMessageError(t *testing.T) {
	logger := zaptest.NewLogger(t)
	messageRepo := &mockMessageRepository{}
	groupRepo := &mockGroupRepository{
		updateGroupLastMessageFunc: func(ctx context.Context, jid string) error {
			return errors.New("update error")
		},
	}

	uc := NewProcessMessage(messageRepo, groupRepo, logger)

	msg := &domain.Message{
		WhatsAppID:  "msg123",
		GroupID:     "123456789@g.us",
		GroupName:   "Test Group",
		SenderPhone: "201234567890",
		RawText:     "Hello World",
		ReceivedAt:  time.Now(),
		Status:      domain.MessageStatusPending,
		MaxRetries:  3,
	}

	// Should succeed even if UpdateGroupLastMessage fails (non-critical error)
	err := uc.Execute(context.Background(), msg)
	if err != nil {
		t.Errorf("Execute() error = %v, want nil (UpdateGroupLastMessage error should not fail the operation)", err)
	}
}
