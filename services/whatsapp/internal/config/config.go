package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all configuration for the service
type Config struct {
	// Database
	DatabaseURL string

	// Server
	Port     int
	LogLevel string

	// WhatsApp
	WhatsAppLogLevel string
}

// Load reads configuration from .env file and environment variables
func Load() (*Config, error) {
	// Set config file name and type
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./services/whatsapp")
	viper.AddConfigPath("$HOME/.config/whatsapp-service")

	// Enable reading from environment variables
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// Set defaults
	viper.SetDefault("PORT", 8080)
	viper.SetDefault("LOG_LEVEL", "info")
	viper.SetDefault("WHATSAPP_LOG_LEVEL", "INFO")

	// Read config file (optional - will use env vars if not found)
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// Config file not found; using environment variables and defaults
	}

	// Validate required fields
	if !viper.IsSet("DATABASE_URL") {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	cfg := &Config{
		DatabaseURL:      viper.GetString("DATABASE_URL"),
		Port:             viper.GetInt("PORT"),
		LogLevel:         viper.GetString("LOG_LEVEL"),
		WhatsAppLogLevel: viper.GetString("WHATSAPP_LOG_LEVEL"),
	}

	return cfg, nil
}

// MustLoad loads config or panics
func MustLoad() *Config {
	cfg, err := Load()
	if err != nil {
		panic(err)
	}
	return cfg
}
