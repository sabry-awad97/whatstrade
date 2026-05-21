package usecase

import (
	"context"

	"whatstrade/whatsapp-service/internal/domain"
)

// Shared mocks for usecase tests

type mockMessageRepository struct {
	saveMessageFunc func(ctx context.Context, msg *domain.Message) error
}

func (m *mockMessageRepository) SaveMessage(ctx context.Context, msg *domain.Message) error {
	if m.saveMessageFunc != nil {
		return m.saveMessageFunc(ctx, msg)
	}
	return nil
}

type mockGroupRepository struct {
	getMonitoredGroupsFunc     func(ctx context.Context) ([]*domain.Group, error)
	getGroupByJIDFunc          func(ctx context.Context, jid string) (*domain.Group, error)
	upsertGroupFunc            func(ctx context.Context, group *domain.Group) error
	updateGroupLastMessageFunc func(ctx context.Context, jid string) error
}

func (m *mockGroupRepository) GetMonitoredGroups(ctx context.Context) ([]*domain.Group, error) {
	if m.getMonitoredGroupsFunc != nil {
		return m.getMonitoredGroupsFunc(ctx)
	}
	return nil, nil
}

func (m *mockGroupRepository) GetGroupByJID(ctx context.Context, jid string) (*domain.Group, error) {
	if m.getGroupByJIDFunc != nil {
		return m.getGroupByJIDFunc(ctx, jid)
	}
	return &domain.Group{
		JID:         jid,
		Name:        "Test Group",
		IsMonitored: true,
	}, nil
}

func (m *mockGroupRepository) UpsertGroup(ctx context.Context, group *domain.Group) error {
	if m.upsertGroupFunc != nil {
		return m.upsertGroupFunc(ctx, group)
	}
	return nil
}

func (m *mockGroupRepository) UpdateGroupLastMessage(ctx context.Context, jid string) error {
	if m.updateGroupLastMessageFunc != nil {
		return m.updateGroupLastMessageFunc(ctx, jid)
	}
	return nil
}

type mockWhatsAppClient struct {
	connectFunc         func(ctx context.Context) error
	disconnectFunc      func() error
	isConnectedFunc     func() bool
	isLoggedInFunc      func() bool
	getQRCodeFunc       func(ctx context.Context) (string, error)
	getJoinedGroupsFunc func(ctx context.Context) ([]*domain.Group, error)
	sendMessageFunc     func(ctx context.Context, groupJID string, text string) error
	syncHistoryFunc     func(ctx context.Context, groupJID string) error
}

func (m *mockWhatsAppClient) Connect(ctx context.Context) error {
	if m.connectFunc != nil {
		return m.connectFunc(ctx)
	}
	return nil
}

func (m *mockWhatsAppClient) Disconnect() error {
	if m.disconnectFunc != nil {
		return m.disconnectFunc()
	}
	return nil
}

func (m *mockWhatsAppClient) IsConnected() bool {
	if m.isConnectedFunc != nil {
		return m.isConnectedFunc()
	}
	return true
}

func (m *mockWhatsAppClient) IsLoggedIn() bool {
	if m.isLoggedInFunc != nil {
		return m.isLoggedInFunc()
	}
	return true
}

func (m *mockWhatsAppClient) GetQRCode(ctx context.Context) (string, error) {
	if m.getQRCodeFunc != nil {
		return m.getQRCodeFunc(ctx)
	}
	return "mock-qr-code", nil
}

func (m *mockWhatsAppClient) GetJoinedGroups(ctx context.Context) ([]*domain.Group, error) {
	if m.getJoinedGroupsFunc != nil {
		return m.getJoinedGroupsFunc(ctx)
	}
	return []*domain.Group{
		{
			JID:         "123456789@g.us",
			Name:        "Test Group 1",
			MemberCount: 10,
		},
		{
			JID:         "987654321@g.us",
			Name:        "Test Group 2",
			MemberCount: 20,
		},
	}, nil
}

func (m *mockWhatsAppClient) SendMessage(ctx context.Context, groupJID string, text string) error {
	if m.sendMessageFunc != nil {
		return m.sendMessageFunc(ctx, groupJID, text)
	}
	return nil
}

func (m *mockWhatsAppClient) SyncHistory(ctx context.Context, groupJID string) error {
	if m.syncHistoryFunc != nil {
		return m.syncHistoryFunc(ctx, groupJID)
	}
	return nil
}
