package usecase

import (
	"context"
	"errors"
	"testing"

	"go.uber.org/zap/zaptest"

	"whatstrade/whatsapp-service/internal/domain"
)

func TestManageGroups_GetMonitoredGroups_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)
	groupRepo := &mockGroupRepository{
		getMonitoredGroupsFunc: func(ctx context.Context) ([]*domain.Group, error) {
			return []*domain.Group{
				{
					JID:         "123456789@g.us",
					Name:        "Test Group 1",
					IsMonitored: true,
				},
				{
					JID:         "987654321@g.us",
					Name:        "Test Group 2",
					IsMonitored: true,
				},
			}, nil
		},
	}
	whatsappClient := &mockWhatsAppClient{}

	uc := NewManageGroups(groupRepo, whatsappClient, logger)

	groups, err := uc.GetMonitoredGroups(context.Background())
	if err != nil {
		t.Errorf("GetMonitoredGroups() error = %v, want nil", err)
	}

	if len(groups) != 2 {
		t.Errorf("GetMonitoredGroups() returned %d groups, want 2", len(groups))
	}
}

func TestManageGroups_SyncGroups_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)

	upsertedGroups := make(map[string]*domain.Group)
	groupRepo := &mockGroupRepository{
		getGroupByJIDFunc: func(ctx context.Context, jid string) (*domain.Group, error) {
			return &domain.Group{
				JID:         jid,
				Name:        "Test Group",
				IsMonitored: false,
			}, nil
		},
		upsertGroupFunc: func(ctx context.Context, group *domain.Group) error {
			upsertedGroups[group.JID] = group
			return nil
		},
	}

	whatsappClient := &mockWhatsAppClient{}

	uc := NewManageGroups(groupRepo, whatsappClient, logger)

	err := uc.SyncGroups(context.Background())
	if err != nil {
		t.Errorf("SyncGroups() error = %v, want nil", err)
	}

	if len(upsertedGroups) != 2 {
		t.Errorf("SyncGroups() upserted %d groups, want 2", len(upsertedGroups))
	}
}

func TestManageGroups_SyncGroups_NotLoggedIn(t *testing.T) {
	logger := zaptest.NewLogger(t)
	groupRepo := &mockGroupRepository{}
	whatsappClient := &mockWhatsAppClient{
		isLoggedInFunc: func() bool {
			return false
		},
	}

	uc := NewManageGroups(groupRepo, whatsappClient, logger)

	err := uc.SyncGroups(context.Background())
	if !errors.Is(err, domain.ErrNotAuthenticated) {
		t.Errorf("SyncGroups() error = %v, want %v", err, domain.ErrNotAuthenticated)
	}
}

func TestManageGroups_SyncGroups_GetJoinedGroupsError(t *testing.T) {
	logger := zaptest.NewLogger(t)
	groupRepo := &mockGroupRepository{}
	whatsappClient := &mockWhatsAppClient{
		getJoinedGroupsFunc: func(ctx context.Context) ([]*domain.Group, error) {
			return nil, errors.New("whatsapp error")
		},
	}

	uc := NewManageGroups(groupRepo, whatsappClient, logger)

	err := uc.SyncGroups(context.Background())
	if err == nil {
		t.Error("SyncGroups() error = nil, want error for GetJoinedGroups failure")
	}
}

func TestManageGroups_SyncGroups_UpsertError(t *testing.T) {
	logger := zaptest.NewLogger(t)
	groupRepo := &mockGroupRepository{
		getGroupByJIDFunc: func(ctx context.Context, jid string) (*domain.Group, error) {
			return &domain.Group{
				JID:         jid,
				Name:        "Test Group",
				IsMonitored: false,
			}, nil
		},
		upsertGroupFunc: func(ctx context.Context, group *domain.Group) error {
			return errors.New("database error")
		},
	}

	whatsappClient := &mockWhatsAppClient{}

	uc := NewManageGroups(groupRepo, whatsappClient, logger)

	err := uc.SyncGroups(context.Background())
	if err == nil {
		t.Error("SyncGroups() error = nil, want error for UpsertGroup failure")
	}
}
