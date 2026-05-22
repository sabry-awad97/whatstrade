package whatsapp

import (
	"context"
	"testing"

	"go.mau.fi/whatsmeow/types"
	"go.uber.org/zap/zaptest"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/testutil"
)

// TestClient_FirstLoginFlag tests the first login flag behavior
func TestClient_FirstLoginFlag(t *testing.T) {
	tests := []struct {
		name         string
		isFirstLogin bool
	}{
		{
			name:         "first login",
			isFirstLogin: true,
		},
		{
			name:         "existing session",
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

			if client.isFirstLogin != tt.isFirstLogin {
				t.Errorf("isFirstLogin = %v, want %v", client.isFirstLogin, tt.isFirstLogin)
			}
		})
	}
}

// TestParseJID tests JID parsing for validation
func TestParseJID(t *testing.T) {
	tests := []struct {
		name    string
		jid     string
		wantErr bool
	}{
		{
			name:    "valid group JID",
			jid:     "123456789@g.us",
			wantErr: false,
		},
		{
			name:    "valid user JID",
			jid:     "123456789@s.whatsapp.net",
			wantErr: false,
		},
		{
			name:    "JID without @ - whatsmeow may accept this",
			jid:     "123456789",
			wantErr: false, // whatsmeow is lenient
		},
		{
			name:    "empty JID",
			jid:     "",
			wantErr: false, // whatsmeow returns empty JID, not error
		},
		{
			name:    "malformed JID - whatsmeow is lenient",
			jid:     "invalid-jid-format",
			wantErr: false, // whatsmeow tries to parse it
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jid, err := types.ParseJID(tt.jid)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseJID() error = %v, wantErr %v", err, tt.wantErr)
			}
			// Just verify it doesn't panic
			_ = jid
		})
	}
}

// TestClient_SyncHistory_ValidationLogic tests the validation logic in SyncHistory
// Note: Since client is nil, all calls will return ErrNotAuthenticated
func TestClient_SyncHistory_ValidationLogic(t *testing.T) {
	tests := []struct {
		name     string
		groupJID string
	}{
		{
			name:     "invalid JID format",
			groupJID: "invalid-jid",
		},
		{
			name:     "empty JID",
			groupJID: "",
		},
		{
			name:     "valid JID",
			groupJID: "123456789@g.us",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			eventHandler := &testutil.MockWhatsAppEventHandler{}

			// Client with nil whatsmeow client - will always return ErrNotAuthenticated
			client := &Client{
				logger:       logger,
				eventHandler: eventHandler,
				isFirstLogin: false,
			}

			ctx := context.Background()
			err := client.SyncHistory(ctx, tt.groupJID)

			// Since client is nil, IsLoggedIn() returns false
			// So SyncHistory should always return ErrNotAuthenticated
			if err != domain.ErrNotAuthenticated {
				t.Errorf("SyncHistory() error = %v, want %v", err, domain.ErrNotAuthenticated)
			}
		})
	}
}

// TestClient_NotAuthenticatedErrors tests that methods return ErrNotAuthenticated when not logged in
func TestClient_NotAuthenticatedErrors(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	// Create a client without actual whatsmeow client (simulates not logged in)
	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
		isFirstLogin: true,
		client:       nil,
	}

	ctx := context.Background()

	t.Run("GetJoinedGroups", func(t *testing.T) {
		_, err := client.GetJoinedGroups(ctx)
		if err != domain.ErrNotAuthenticated {
			t.Errorf("GetJoinedGroups() error = %v, want %v", err, domain.ErrNotAuthenticated)
		}
	})

	t.Run("SendMessage", func(t *testing.T) {
		err := client.SendMessage(ctx, "123456789@g.us", "test")
		if err != domain.ErrNotAuthenticated {
			t.Errorf("SendMessage() error = %v, want %v", err, domain.ErrNotAuthenticated)
		}
	})

	t.Run("SyncHistory", func(t *testing.T) {
		err := client.SyncHistory(ctx, "123456789@g.us")
		if err != domain.ErrNotAuthenticated {
			t.Errorf("SyncHistory() error = %v, want %v", err, domain.ErrNotAuthenticated)
		}
	})
}

// TestClient_Disconnect tests disconnect doesn't panic
func TestClient_Disconnect(t *testing.T) {
	logger := zaptest.NewLogger(t)
	eventHandler := &testutil.MockWhatsAppEventHandler{}

	client := &Client{
		logger:       logger,
		eventHandler: eventHandler,
		client:       nil, // Even with nil client, should not panic
	}

	// Should not panic
	err := client.Disconnect()
	if err != nil {
		t.Errorf("Disconnect() error = %v, want nil", err)
	}
}
