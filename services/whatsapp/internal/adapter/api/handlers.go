package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// handleHealth returns the health status of the service
func (s *Server) handleHealth(c *gin.Context) {
	// Get request_time from context and type-assert to time.Time
	requestTime := time.Now() // Default fallback
	if val, exists := c.Get("request_time"); exists {
		if ts, ok := val.(time.Time); ok {
			requestTime = ts
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": requestTime,
	})
}

// handleStatus returns the WhatsApp connection status
func (s *Server) handleStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"connected": s.whatsappClient.IsConnected(),
		"logged_in": s.whatsappClient.IsLoggedIn(),
	})
}

// handleQR returns the QR code for authentication
func (s *Server) handleQR(c *gin.Context) {
	if s.whatsappClient.IsLoggedIn() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "already logged in",
		})
		return
	}

	qrCode, err := s.whatsappClient.GetQRCode(c.Request.Context())
	if err != nil {
		s.logger.Error("failed to get QR code", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to get QR code",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"qr_code": qrCode,
	})
}

// handleListGroups returns all monitored groups
func (s *Server) handleListGroups(c *gin.Context) {
	groups, err := s.manageGroups.GetMonitoredGroups(c.Request.Context())
	if err != nil {
		s.logger.Error("failed to get monitored groups", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to get groups",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"groups": groups,
		"count":  len(groups),
	})
}

// handleSyncGroups synchronizes WhatsApp groups with the database
func (s *Server) handleSyncGroups(c *gin.Context) {
	if err := s.manageGroups.SyncGroups(c.Request.Context()); err != nil {
		s.logger.Error("failed to sync groups", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to sync groups",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "groups synced successfully",
	})
}

// handleSyncHistory manually triggers history sync for a specific group
func (s *Server) handleSyncHistory(c *gin.Context) {
	var req struct {
		GroupJID string `json:"group_jid" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	if err := s.whatsappClient.SyncHistory(c.Request.Context(), req.GroupJID); err != nil {
		s.logger.Error("failed to sync history",
			zap.String("group_jid", req.GroupJID),
			zap.Error(err),
		)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to sync history",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "history sync triggered",
		"group_jid": req.GroupJID,
	})
}
