package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap/zaptest"

	"whatstrade/whatsapp-service/internal/testutil"
)

// TestHandleHealth_WithRequestTime tests health endpoint with request_time in context
func TestHandleHealth_WithRequestTime(t *testing.T) {
	gin.SetMode(gin.TestMode)

	logger := zaptest.NewLogger(t)
	mockClient := &testutil.MockWhatsAppClient{}

	server := &Server{
		logger:         logger,
		whatsappClient: mockClient,
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/health", nil)

	// Set request_time in context (simulating middleware)
	testTime := time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
	c.Set("request_time", testTime)

	server.handleHealth(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "ok", response["status"])

	timestamp, ok := response["timestamp"]
	assert.True(t, ok, "timestamp should be present")
	assert.NotNil(t, timestamp, "timestamp should not be nil")
}

// TestHandleHealth_WithoutRequestTime tests health endpoint without request_time
func TestHandleHealth_WithoutRequestTime(t *testing.T) {
	gin.SetMode(gin.TestMode)

	logger := zaptest.NewLogger(t)
	mockClient := &testutil.MockWhatsAppClient{}

	server := &Server{
		logger:         logger,
		whatsappClient: mockClient,
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/health", nil)

	// Do NOT set request_time - testing fallback

	server.handleHealth(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "ok", response["status"])

	timestamp, ok := response["timestamp"]
	assert.True(t, ok, "timestamp should be present")
	assert.NotNil(t, timestamp, "timestamp should not be nil")
}

// TestHandleHealth_WithInvalidRequestTime tests with wrong type in context
func TestHandleHealth_WithInvalidRequestTime(t *testing.T) {
	gin.SetMode(gin.TestMode)

	logger := zaptest.NewLogger(t)
	mockClient := &testutil.MockWhatsAppClient{}

	server := &Server{
		logger:         logger,
		whatsappClient: mockClient,
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/health", nil)

	// Set wrong type - should use fallback
	c.Set("request_time", "not a time")

	server.handleHealth(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "ok", response["status"])

	timestamp, ok := response["timestamp"]
	assert.True(t, ok, "timestamp should be present")
	assert.NotNil(t, timestamp, "timestamp should not be nil")
}
