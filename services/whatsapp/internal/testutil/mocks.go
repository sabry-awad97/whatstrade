package testutil

import (
	"context"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/port"
)

// MockMessageRepository is a mock implementation of port.MessageRepository
type MockMessageRepository struct {
	SaveMessageFunc          func(ctx context.Context, msg *domain.Message) error
	GetPendingMessagesFunc   func(ctx context.Context, limit int) ([]*domain.Message, error)
	UpdateMessageStatusFunc  func(ctx context.Context, id string, status domain.MessageStatus) error
	MarkMessageFailedFunc    func(ctx context.Context, id string, err error) error
	MarkMessageCompletedFunc func(ctx context.Context, id string) error
}

func (m *MockMessageRepository) SaveMessage(ctx context.Context, msg *domain.Message) error {
	if m.SaveMessageFunc != nil {
		return m.SaveMessageFunc(ctx, msg)
	}
	return nil
}

func (m *MockMessageRepository) GetPendingMessages(ctx context.Context, limit int) ([]*domain.Message, error) {
	if m.GetPendingMessagesFunc != nil {
		return m.GetPendingMessagesFunc(ctx, limit)
	}
	return nil, nil
}

func (m *MockMessageRepository) UpdateMessageStatus(ctx context.Context, id string, status domain.MessageStatus) error {
	if m.UpdateMessageStatusFunc != nil {
		return m.UpdateMessageStatusFunc(ctx, id, status)
	}
	return nil
}

func (m *MockMessageRepository) MarkMessageFailed(ctx context.Context, id string, err error) error {
	if m.MarkMessageFailedFunc != nil {
		return m.MarkMessageFailedFunc(ctx, id, err)
	}
	return nil
}

func (m *MockMessageRepository) MarkMessageCompleted(ctx context.Context, id string) error {
	if m.MarkMessageCompletedFunc != nil {
		return m.MarkMessageCompletedFunc(ctx, id)
	}
	return nil
}

// MockGroupRepository is a mock implementation of port.GroupRepository
type MockGroupRepository struct {
	GetMonitoredGroupsFunc     func(ctx context.Context) ([]*domain.Group, error)
	GetGroupByJIDFunc          func(ctx context.Context, jid string) (*domain.Group, error)
	UpsertGroupFunc            func(ctx context.Context, group *domain.Group) error
	UpdateGroupLastMessageFunc func(ctx context.Context, jid string) error
}

func (m *MockGroupRepository) GetMonitoredGroups(ctx context.Context) ([]*domain.Group, error) {
	if m.GetMonitoredGroupsFunc != nil {
		return m.GetMonitoredGroupsFunc(ctx)
	}
	return nil, nil
}

func (m *MockGroupRepository) GetGroupByJID(ctx context.Context, jid string) (*domain.Group, error) {
	if m.GetGroupByJIDFunc != nil {
		return m.GetGroupByJIDFunc(ctx, jid)
	}
	return &domain.Group{
		JID:         jid,
		Name:        "Test Group",
		IsMonitored: true,
	}, nil
}

func (m *MockGroupRepository) UpsertGroup(ctx context.Context, group *domain.Group) error {
	if m.UpsertGroupFunc != nil {
		return m.UpsertGroupFunc(ctx, group)
	}
	return nil
}

func (m *MockGroupRepository) UpdateGroupLastMessage(ctx context.Context, jid string) error {
	if m.UpdateGroupLastMessageFunc != nil {
		return m.UpdateGroupLastMessageFunc(ctx, jid)
	}
	return nil
}

// MockWhatsAppClient is a mock implementation of port.WhatsAppClient
type MockWhatsAppClient struct {
	ConnectFunc         func(ctx context.Context) error
	DisconnectFunc      func() error
	IsConnectedFunc     func() bool
	IsLoggedInFunc      func() bool
	GetQRCodeFunc       func(ctx context.Context) (string, error)
	GetJoinedGroupsFunc func(ctx context.Context) ([]*domain.Group, error)
	SendMessageFunc     func(ctx context.Context, groupJID string, text string) error
	SyncHistoryFunc     func(ctx context.Context, groupJID string) error
}

var _ port.WhatsAppClient = (*MockWhatsAppClient)(nil)

func (m *MockWhatsAppClient) Connect(ctx context.Context) error {
	if m.ConnectFunc != nil {
		return m.ConnectFunc(ctx)
	}
	return nil
}

func (m *MockWhatsAppClient) Disconnect() error {
	if m.DisconnectFunc != nil {
		return m.DisconnectFunc()
	}
	return nil
}

func (m *MockWhatsAppClient) IsConnected() bool {
	if m.IsConnectedFunc != nil {
		return m.IsConnectedFunc()
	}
	return true
}

func (m *MockWhatsAppClient) IsLoggedIn() bool {
	if m.IsLoggedInFunc != nil {
		return m.IsLoggedInFunc()
	}
	return true
}

func (m *MockWhatsAppClient) GetQRCode(ctx context.Context) (string, error) {
	if m.GetQRCodeFunc != nil {
		return m.GetQRCodeFunc(ctx)
	}
	return "mock-qr-code", nil
}

func (m *MockWhatsAppClient) GetJoinedGroups(ctx context.Context) ([]*domain.Group, error) {
	if m.GetJoinedGroupsFunc != nil {
		return m.GetJoinedGroupsFunc(ctx)
	}
	return []*domain.Group{
		{
			JID:         "123456789@g.us",
			Name:        "Test Group 1",
			MemberCount: 10,
		},
	}, nil
}

func (m *MockWhatsAppClient) SendMessage(ctx context.Context, groupJID string, text string) error {
	if m.SendMessageFunc != nil {
		return m.SendMessageFunc(ctx, groupJID, text)
	}
	return nil
}

func (m *MockWhatsAppClient) SyncHistory(ctx context.Context, groupJID string) error {
	if m.SyncHistoryFunc != nil {
		return m.SyncHistoryFunc(ctx, groupJID)
	}
	return nil
}

// MockWhatsAppEventHandler is a mock implementation of port.WhatsAppEventHandler
type MockWhatsAppEventHandler struct {
	OnMessageFunc      func(ctx context.Context, msg *domain.Message) error
	OnConnectedFunc    func(ctx context.Context) error
	OnDisconnectedFunc func(ctx context.Context) error
}

var _ port.WhatsAppEventHandler = (*MockWhatsAppEventHandler)(nil)

func (m *MockWhatsAppEventHandler) OnMessage(ctx context.Context, msg *domain.Message) error {
	if m.OnMessageFunc != nil {
		return m.OnMessageFunc(ctx, msg)
	}
	return nil
}

func (m *MockWhatsAppEventHandler) OnConnected(ctx context.Context) error {
	if m.OnConnectedFunc != nil {
		return m.OnConnectedFunc(ctx)
	}
	return nil
}

func (m *MockWhatsAppEventHandler) OnDisconnected(ctx context.Context) error {
	if m.OnDisconnectedFunc != nil {
		return m.OnDisconnectedFunc(ctx)
	}
	return nil
}
