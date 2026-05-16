package config

import (
	"os"
	"testing"

	"github.com/spf13/viper"
)

func TestLoad_Success(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
	os.Setenv("PORT", "9090")
	os.Setenv("LOG_LEVEL", "debug")
	os.Setenv("WHATSAPP_LOG_LEVEL", "DEBUG")
	defer func() {
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("PORT")
		os.Unsetenv("LOG_LEVEL")
		os.Unsetenv("WHATSAPP_LOG_LEVEL")
		viper.Reset()
	}()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}

	if cfg.DatabaseURL != "postgresql://test:test@localhost:5432/testdb" {
		t.Errorf("DatabaseURL = %v, want postgresql://test:test@localhost:5432/testdb", cfg.DatabaseURL)
	}

	if cfg.Port != 9090 {
		t.Errorf("Port = %v, want 9090", cfg.Port)
	}

	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel = %v, want debug", cfg.LogLevel)
	}

	if cfg.WhatsAppLogLevel != "DEBUG" {
		t.Errorf("WhatsAppLogLevel = %v, want DEBUG", cfg.WhatsAppLogLevel)
	}
}

func TestLoad_Defaults(t *testing.T) {
	// Set only required DATABASE_URL
	os.Setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
	defer func() {
		os.Unsetenv("DATABASE_URL")
		viper.Reset()
	}()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v, want nil", err)
	}

	// Check defaults
	if cfg.Port != 8080 {
		t.Errorf("Port = %v, want 8080 (default)", cfg.Port)
	}

	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel = %v, want info (default)", cfg.LogLevel)
	}

	if cfg.WhatsAppLogLevel != "INFO" {
		t.Errorf("WhatsAppLogLevel = %v, want INFO (default)", cfg.WhatsAppLogLevel)
	}
}

func TestLoad_MissingDatabaseURL(t *testing.T) {
	// Ensure DATABASE_URL is not set
	os.Unsetenv("DATABASE_URL")
	defer viper.Reset()

	_, err := Load()
	if err == nil {
		t.Error("Load() error = nil, want error for missing DATABASE_URL")
	}
}

func TestMustLoad_Panic(t *testing.T) {
	// Ensure DATABASE_URL is not set
	os.Unsetenv("DATABASE_URL")
	defer func() {
		if r := recover(); r == nil {
			t.Error("MustLoad() did not panic, want panic for missing DATABASE_URL")
		}
		viper.Reset()
	}()

	MustLoad()
}

func TestMustLoad_Success(t *testing.T) {
	os.Setenv("DATABASE_URL", "postgresql://test:test@localhost:5432/testdb")
	defer func() {
		os.Unsetenv("DATABASE_URL")
		viper.Reset()
	}()

	cfg := MustLoad()
	if cfg == nil {
		t.Error("MustLoad() returned nil, want non-nil config")
	}

	if cfg.DatabaseURL != "postgresql://test:test@localhost:5432/testdb" {
		t.Errorf("DatabaseURL = %v, want postgresql://test:test@localhost:5432/testdb", cfg.DatabaseURL)
	}
}
