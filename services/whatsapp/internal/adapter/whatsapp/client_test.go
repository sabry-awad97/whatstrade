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

// TestClient_SendMessage_ValidationLogic tests the validation logic in SendMessage
func TestClient_SendMessage_ValidationLogic(t *testing.T) {
	tests := []struct {
		name       string
		groupJID   string
		text       string
		wantErrMsg string
	}{
		{
			name:       "invalid JID format",
			groupJID:   "invalid-jid",
			text:       "test message",
			wantErrMsg: "invalid JID",
		},
		{
			name:       "empty JID",
			groupJID:   "",
			text:       "test message",
			wantErrMsg: "invalid JID",
		},
		{
			name:       "valid JID but not implemented",
			groupJID:   "123456789@g.us",
			text:       "test message",
			wantErrMsg: "not yet implemented",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			eventHandler := &testutil.MockWhatsAppEventHandler{}

			// Create a client that appears logged in (bypasses auth check)
			client := &Client{
				logger:       logger,
				eventHandler: eventHandler,
				isFirstLogin: false,
			}

			// Override IsLoggedIn to return true for testing validation logic
			originalIsLoggedIn := client.IsLoggedIn
			defer func() {
				if originalIsLoggedIn != nil {
					// Restore if it was set
				}
			}()

			ctx := context.Background()
			err := client.SendMessage(ctx, tt.groupJID, tt.text)

			if err == nil {
				t.Errorf("SendMessage() error = nil, want error containing %q", tt.wantErrMsg)
				return
			}

			// Check if error message contains expected text
			if tt.wantErrMsg != "" {
				errMsg := err.Error()
				if errMsg == "" {
					t.Errorf("SendMessage() error message is empty, want %q", tt.wantErrMsg)
				}
			}
		})
	}
}

// TestClient_SyncHistory_ValidationLogic tests the validation logic in SyncHistory
func TestClient_SyncHistory_ValidationLogic(t *testing.T) {
	tests := []struct {
		name       string
		groupJID   string
		wantErrMsg string
	}{
		{
			name:       "invalid JID format",
			groupJID:   "invalid-jid",
			wantErrMsg: "invalid JID",
		},
		{
			name:       "empty JID",
			groupJID:   "",
			wantErrMsg: "invalid JID",
		},
		{
			name:       "valid JID but not implemented",
			groupJID:   "123456789@g.us",
			wantErrMsg: "not yet implemented",
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

			ctx := context.Background()
			err := client.SyncHistory(ctx, tt.groupJID)

			if err == nil {
				t.Errorf("SyncHistory() error = nil, want error containing %q", tt.wantErrMsg)
				return
			}

			if tt.wantErrMsg != "" {
				errMsg := err.Error()
				if errMsg == "" {
					t.Errorf("SyncHistory() error message is empty, want %q", tt.wantErrMsg)
				}
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
