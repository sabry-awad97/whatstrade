package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver for whatsmeow
	"go.uber.org/zap"

	"whatstrade/whatsapp-service/internal/adapter/api"
	"whatstrade/whatsapp-service/internal/adapter/repository"
	"whatstrade/whatsapp-service/internal/adapter/whatsapp"
	"whatstrade/whatsapp-service/internal/config"
	"whatstrade/whatsapp-service/internal/domain"
	"whatstrade/whatsapp-service/internal/usecase"
	"whatstrade/whatsapp-service/pkg/logger"
)

func main() {
	// Load configuration
	cfg := config.MustLoad()

	// Initialize logger
	log := logger.MustNew(cfg.LogLevel)
	defer log.Sync()

	log.Info("starting WhatsApp service",
		zap.String("port", string(rune(cfg.Port))),
		zap.String("log_level", cfg.LogLevel),
	)

	// Initialize repository
	messageRepo, groupRepo, err := repository.NewPostgresRepository(cfg.DatabaseURL, log)
	if err != nil {
		log.Fatal("failed to initialize repository", zap.Error(err))
	}

	log.Info("database connection established")

	// Initialize use cases
	processMessage := usecase.NewProcessMessage(messageRepo, groupRepo, log)

	// Initialize WhatsApp event handler
	eventHandler := &EventHandler{
		processMessage: processMessage,
		logger:         log,
	}

	// Initialize WhatsApp client
	whatsappClient, err := whatsapp.NewClient(
		cfg.DatabaseURL,
		eventHandler,
		cfg.WhatsAppLogLevel,
		log,
	)
	if err != nil {
		log.Fatal("failed to initialize WhatsApp client", zap.Error(err))
	}

	// Connect to WhatsApp
	ctx := context.Background()
	if err := whatsappClient.Connect(ctx); err != nil {
		log.Fatal("failed to connect to WhatsApp", zap.Error(err))
	}

	log.Info("WhatsApp client initialized",
		zap.Bool("connected", whatsappClient.IsConnected()),
		zap.Bool("logged_in", whatsappClient.IsLoggedIn()),
	)

	// Initialize manage groups use case
	manageGroups := usecase.NewManageGroups(groupRepo, whatsappClient, log)

	// Initialize HTTP server
	server := api.NewServer(whatsappClient, manageGroups, log)

	// Start HTTP server in goroutine
	go func() {
		if err := server.Start(cfg.Port); err != nil {
			log.Fatal("failed to start HTTP server", zap.Error(err))
		}
	}()

	log.Info("service started successfully")

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("shutting down service...")

	// Graceful shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown HTTP server
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("failed to shutdown HTTP server", zap.Error(err))
	}

	// Disconnect WhatsApp
	if err := whatsappClient.Disconnect(); err != nil {
		log.Error("failed to disconnect WhatsApp", zap.Error(err))
	}

	log.Info("service stopped")
}

// EventHandler implements port.WhatsAppEventHandler
type EventHandler struct {
	processMessage *usecase.ProcessMessage
	logger         *zap.Logger
}

// OnMessage handles incoming WhatsApp messages
func (h *EventHandler) OnMessage(ctx context.Context, msg *domain.Message) error {
	return h.processMessage.Execute(ctx, msg)
}

// OnConnected handles connection events
func (h *EventHandler) OnConnected(ctx context.Context) error {
	h.logger.Info("WhatsApp connected event received")
	return nil
}

// OnDisconnected handles disconnection events
func (h *EventHandler) OnDisconnected(ctx context.Context) error {
	h.logger.Warn("WhatsApp disconnected event received")
	return nil
}
