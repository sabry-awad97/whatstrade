package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"whatstrade/whatsapp-service/internal/port"
	"whatstrade/whatsapp-service/internal/usecase"
)

// Server represents the HTTP API server
type Server struct {
	router         *gin.Engine
	whatsappClient port.WhatsAppClient
	manageGroups   *usecase.ManageGroups
	logger         *zap.Logger
	httpServer     *http.Server
}

// NewServer creates a new API server
func NewServer(
	whatsappClient port.WhatsAppClient,
	manageGroups *usecase.ManageGroups,
	logger *zap.Logger,
) *Server {
	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()

	// Middleware
	router.Use(gin.Recovery())
	router.Use(LoggerMiddleware(logger))

	server := &Server{
		router:         router,
		whatsappClient: whatsappClient,
		manageGroups:   manageGroups,
		logger:         logger,
	}

	// Register routes
	server.registerRoutes()

	return server
}

// registerRoutes sets up all HTTP routes
func (s *Server) registerRoutes() {
	// Health check
	s.router.GET("/health", s.handleHealth)

	// WhatsApp API
	api := s.router.Group("/api/whatsapp")
	{
		api.GET("/status", s.handleStatus)
		api.GET("/qr", s.handleQR)
		api.GET("/groups", s.handleListGroups)
		api.POST("/groups/sync", s.handleSyncGroups)
		api.POST("/history/sync", s.handleSyncHistory)
	}
}

// Start starts the HTTP server
func (s *Server) Start(port int) error {
	addr := fmt.Sprintf(":%d", port)

	s.httpServer = &http.Server{
		Addr:         addr,
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	s.logger.Info("starting HTTP server", zap.String("addr", addr))

	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("shutting down HTTP server")
	if s.httpServer == nil {
		return nil
	}
	return s.httpServer.Shutdown(ctx)
}
