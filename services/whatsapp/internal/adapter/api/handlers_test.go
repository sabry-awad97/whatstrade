package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap/zaptest"

	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/testutil"
	"whatstrade/whatsapp-service/internal/usecase"
)

func init() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
}

func TestHandleHealth(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("handleHealth() status = %d, want %d", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if response["status"] != "ok" {
		t.Errorf("handleHealth() status = %v, want ok", response["status"])
	}
}

func TestHandleStatus(t *testing.T) {
	tests := []struct {
		name          string
		isConnected   bool
		isLoggedIn    bool
		wantConnected bool
		wantLoggedIn  bool
	}{
		{
			name:          "connected and logged in",
			isConnected:   true,
			isLoggedIn:    true,
			wantConnected: true,
			wantLoggedIn:  true,
		},
		{
			name:          "connected but not logged in",
			isConnected:   true,
			isLoggedIn:    false,
			wantConnected: true,
			wantLoggedIn:  false,
		},
		{
			name:          "not connected",
			isConnected:   false,
			isLoggedIn:    false,
			wantConnected: false,
			wantLoggedIn:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			whatsappClient := &testutil.MockWhatsAppClient{
				IsConnectedFunc: func() bool { return tt.isConnected },
				IsLoggedInFunc:  func() bool { return tt.isLoggedIn },
			}
			groupRepo := &testutil.MockGroupRepository{}
			manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

			server := NewServer(whatsappClient, manageGroups, logger)

			req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/status", nil)
			w := httptest.NewRecorder()

			server.router.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Errorf("handleStatus() status = %d, want %d", w.Code, http.StatusOK)
			}

			var response map[string]interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Fatalf("failed to unmarshal response: %v", err)
			}

			if response["connected"] != tt.wantConnected {
				t.Errorf("handleStatus() connected = %v, want %v", response["connected"], tt.wantConnected)
			}

			if response["logged_in"] != tt.wantLoggedIn {
				t.Errorf("handleStatus() logged_in = %v, want %v", response["logged_in"], tt.wantLoggedIn)
			}
		})
	}
}

func TestHandleQR_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		IsLoggedInFunc: func() bool { return false },
		GetQRCodeFunc: func(ctx context.Context) (string, error) {
			return "test-qr-code", nil
		},
	}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("handleQR() status = %d, want %d", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if response["qr_code"] != "test-qr-code" {
		t.Errorf("handleQR() qr_code = %v, want test-qr-code", response["qr_code"])
	}
}

func TestHandleQR_AlreadyLoggedIn(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		IsLoggedInFunc: func() bool { return true },
	}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("handleQR() status = %d, want %d", w.Code, http.StatusBadRequest)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if response["error"] != "already logged in" {
		t.Errorf("handleQR() error = %v, want 'already logged in'", response["error"])
	}
}

func TestHandleQR_Error(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		IsLoggedInFunc: func() bool { return false },
		GetQRCodeFunc: func(ctx context.Context) (string, error) {
			return "", errors.New("qr generation failed")
		},
	}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/qr", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("handleQR() status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestHandleListGroups_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{}
	groupRepo := &testutil.MockGroupRepository{
		GetMonitoredGroupsFunc: func(ctx context.Context) ([]*domain.Group, error) {
			return []*domain.Group{
				{JID: "123@g.us", Name: "Group 1", IsMonitored: true},
				{JID: "456@g.us", Name: "Group 2", IsMonitored: true},
			}, nil
		},
	}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/groups", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("handleListGroups() status = %d, want %d", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if response["count"] != float64(2) {
		t.Errorf("handleListGroups() count = %v, want 2", response["count"])
	}
}

func TestHandleListGroups_Error(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{}
	groupRepo := &testutil.MockGroupRepository{
		GetMonitoredGroupsFunc: func(ctx context.Context) ([]*domain.Group, error) {
			return nil, errors.New("database error")
		},
	}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodGet, "/api/whatsapp/groups", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("handleListGroups() status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestHandleSyncGroups_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		IsLoggedInFunc: func() bool { return true },
		GetJoinedGroupsFunc: func(ctx context.Context) ([]*domain.Group, error) {
			return []*domain.Group{
				{JID: "123@g.us", Name: "Group 1"},
			}, nil
		},
	}
	groupRepo := &testutil.MockGroupRepository{
		UpsertGroupFunc: func(ctx context.Context, group *domain.Group) error {
			return nil
		},
	}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodPost, "/api/whatsapp/groups/sync", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("handleSyncGroups() status = %d, want %d", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if response["message"] != "groups synced successfully" {
		t.Errorf("handleSyncGroups() message = %v, want 'groups synced successfully'", response["message"])
	}
}

func TestHandleSyncGroups_Error(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		IsLoggedInFunc: func() bool { return false },
	}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	req := httptest.NewRequest(http.MethodPost, "/api/whatsapp/groups/sync", nil)
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("handleSyncGroups() status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}

func TestHandleSyncHistory_Success(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		SyncHistoryFunc: func(ctx context.Context, groupJID string) error {
			return nil
		},
	}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	body := map[string]string{"group_jid": "123456789@g.us"}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/whatsapp/history/sync", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("handleSyncHistory() status = %d, want %d", w.Code, http.StatusOK)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if response["message"] != "history sync triggered" {
		t.Errorf("handleSyncHistory() message = %v, want 'history sync triggered'", response["message"])
	}

	if response["group_jid"] != "123456789@g.us" {
		t.Errorf("handleSyncHistory() group_jid = %v, want '123456789@g.us'", response["group_jid"])
	}
}

func TestHandleSyncHistory_InvalidRequest(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	// Missing required field
	body := map[string]string{}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/whatsapp/history/sync", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("handleSyncHistory() status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestHandleSyncHistory_Error(t *testing.T) {
	logger := zaptest.NewLogger(t)
	whatsappClient := &testutil.MockWhatsAppClient{
		SyncHistoryFunc: func(ctx context.Context, groupJID string) error {
			return errors.New("sync failed")
		},
	}
	groupRepo := &testutil.MockGroupRepository{}
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, logger)

	server := NewServer(whatsappClient, manageGroups, logger)

	body := map[string]string{"group_jid": "123456789@g.us"}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/whatsapp/history/sync", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	server.router.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("handleSyncHistory() status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}
