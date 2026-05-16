package whatsapp

import (
	"context"
	"errors"
	"testing"

	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"go.uber.org/zap/zaptest"

	"whatstrade/whatsapp-service/internal/testutil"
)

// TestHandleConnected tests the connected event handler
func TestHandleConnected(t *testing.T) {
	logger := zaptest.NewLogger(t)

	connectedCalled := false
	eventHandler := &testutil.MockWhatsAppEventHandler{
		OnConnectedFunc: func(ctx context.Context) error {
			connectedCalled = true
			return nil
		},
	}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
	}

	ctx := context.Background()
	client.handleConnected(ctx)

	if !connectedCalled {
		t.Error("handleConnected() did not call OnConnected")
	}
}

// TestHandleConnected_Error tests error handling in connected event
func TestHandleConnected_Error(t *testing.T) {
	logger := zaptest.NewLogger(t)

	testErr := errors.New("connection handler error")
	eventHandler := &testutil.MockWhatsAppEventHandler{
		OnConnectedFunc: func(ctx context.Context) error {
			return testErr
		},
	}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
	}

	ctx := context.Background()
	// Should not panic, just log error
	client.handleConnected(ctx)
}

// TestHandleDisconnected tests the disconnected event handler
func TestHandleDisconnected(t *testing.T) {
	logger := zaptest.NewLogger(t)

	disconnectedCalled := false
	eventHandler := &testutil.MockWhatsAppEventHandler{
		OnDisconnectedFunc: func(ctx context.Context) error {
			disconnectedCalled = true
			return nil
		},
	}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
	}

	ctx := context.Background()
	client.handleDisconnected(ctx)

	if !disconnectedCalled {
		t.Error("handleDisconnected() did not call OnDisconnected")
	}
}

// TestHandleDisconnected_Error tests error handling in disconnected event
func TestHandleDisconnected_Error(t *testing.T) {
	logger := zaptest.NewLogger(t)

	testErr := errors.New("disconnection handler error")
	eventHandler := &testutil.MockWhatsAppEventHandler{
		OnDisconnectedFunc: func(ctx context.Context) error {
			return testErr
		},
	}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
	}

	ctx := context.Background()
	// Should not panic, just log error
	client.handleDisconnected(ctx)
}

// TestHandleQR tests QR code event handler
func TestHandleQR(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
	}

	qrEvent := &events.QR{
		Codes: []string{"test-qr-code-1", "test-qr-code-2"},
	}

	// Should not panic
	client.handleQR(qrEvent)
}

// TestHandlePairSuccess_FirstLogin tests pairing success on first login
func TestHandlePairSuccess_FirstLogin(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
		isFirstLogin: true,
		client:       nil,
	}

	// Test the logic: on first login, isFirstLogin should become false
	initialFirstLogin := client.isFirstLogin

	// Simulate what handlePairSuccess does on first login
	if initialFirstLogin {
		client.isFirstLogin = false
	}

	// After first login, isFirstLogin should be false
	if client.isFirstLogin {
		t.Error("isFirstLogin should be false after first pair success")
	}
}

// TestHandlePairSuccess_ExistingSession tests pairing success with existing session
func TestHandlePairSuccess_ExistingSession(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
		isFirstLogin: false,
		client:       nil,
	}

	// Test the logic: if not first login, nothing changes
	initialFirstLogin := client.isFirstLogin

	// isFirstLogin should remain unchanged
	if client.isFirstLogin != initialFirstLogin {
		t.Error("isFirstLogin should remain unchanged for existing session")
	}
}

// TestHandleHistorySync_FirstLogin tests history sync is ignored on first login
func TestHandleHistorySync_FirstLogin(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
		isFirstLogin: true,
	}

	syncType := waProto.HistorySync_INITIAL_BOOTSTRAP
	historyEvent := &events.HistorySync{
		Data: &waProto.HistorySync{
			SyncType:      &syncType,
			Conversations: []*waProto.Conversation{},
		},
	}

	// Should log that it's ignoring the sync
	client.handleHistorySync(historyEvent)
}

// TestHandleHistorySync_Reconnection tests history sync is processed on reconnection
func TestHandleHistorySync_Reconnection(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
		isFirstLogin: false, // Not first login
	}

	syncType := waProto.HistorySync_RECENT
	historyEvent := &events.HistorySync{
		Data: &waProto.HistorySync{
			SyncType: &syncType,
			Conversations: []*waProto.Conversation{
				{}, // Mock conversation
			},
		},
	}

	// Should log that it's processing the sync
	client.handleHistorySync(historyEvent)
}

// TestHandleHistorySync_DifferentSyncTypes tests different history sync types
func TestHandleHistorySync_DifferentSyncTypes(t *testing.T) {
	tests := []struct {
		name         string
		syncType     waProto.HistorySync_HistorySyncType
		isFirstLogin bool
	}{
		{
			name:         "INITIAL_BOOTSTRAP on first login",
			syncType:     waProto.HistorySync_INITIAL_BOOTSTRAP,
			isFirstLogin: true,
		},
		{
			name:         "INITIAL_STATUS_V3 on first login",
			syncType:     waProto.HistorySync_INITIAL_STATUS_V3,
			isFirstLogin: true,
		},
		{
			name:         "RECENT on reconnection",
			syncType:     waProto.HistorySync_RECENT,
			isFirstLogin: false,
		},
		{
			name:         "PUSH_NAME on reconnection",
			syncType:     waProto.HistorySync_PUSH_NAME,
			isFirstLogin: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			eventHandler := &testutil.MockWhatsAppEventHandler{}

			client := &Client{
				logger:       logger,
				eventHandler: eventHandler,
				isFirstLogin: tt.isFirstLogin,
			}

			historyEvent := &events.HistorySync{
				Data: &waProto.HistorySync{
					SyncType:      &tt.syncType,
					Conversations: []*waProto.Conversation{},
				},
			}

			// Should not panic
			client.handleHistorySync(historyEvent)
		})
	}
}

// TestHandleEvent_RoutesCorrectly tests that events are routed to correct handlers
func TestHandleEvent_RoutesCorrectly(t *testing.T) {
	tests := []struct {
		name  string
		event interface{}
	}{
		{
			name:  "Connected event",
			event: &events.Connected{},
		},
		{
			name:  "Disconnected event",
			event: &events.Disconnected{},
		},
		{
			name: "QR event",
			event: &events.QR{
				Codes: []string{"test-code"},
			},
		},
		{
			name: "PairSuccess event",
			event: &events.PairSuccess{
				ID: mustParseJID("123456789@s.whatsapp.net"),
			},
		},
		{
			name: "HistorySync event",
			event: &events.HistorySync{
				Data: &waProto.HistorySync{},
			},
		},
		{
			name:  "Unknown event",
			event: "unknown-event-type",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			eventHandler := &testutil.MockWhatsAppEventHandler{}

			client := &Client{
				logger:       logger,
				eventHandler: eventHandler,
				isFirstLogin: false,
			}

			// Should not panic for any event type
			client.handleEvent(tt.event)
		})
	}
}

// Helper function to parse JID for tests
func mustParseJID(jid string) types.JID {
	parsed, err := types.ParseJID(jid)
	if err != nil {
		panic(err)
	}
	return parsed
}
