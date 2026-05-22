package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// New creates a new structured logger
// If the level is invalid or empty, defaults to "info" level
func New(level string) (*zap.Logger, error) {
	// Default to info level if empty or invalid
	if level == "" {
		level = "info"
	}

	var zapLevel zapcore.Level
	if err := zapLevel.UnmarshalText([]byte(level)); err != nil {
		// Fall back to info level on invalid input
		zapLevel = zapcore.InfoLevel
	}

	config := zap.Config{
		Level:            zap.NewAtomicLevelAt(zapLevel),
		Development:      false,
		Encoding:         "json",
		EncoderConfig:    zap.NewProductionEncoderConfig(),
		OutputPaths:      []string{"stdout"},
		ErrorOutputPaths: []string{"stderr"},
	}

	config.EncoderConfig.TimeKey = "ts"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	return config.Build()
}

// MustNew creates a logger with fallback to default configuration
// If the level is invalid, falls back to "info" level instead of panicking
func MustNew(level string) *zap.Logger {
	logger, err := New(level)
	if err != nil {
		// If config.Build() fails, return a basic production logger
		logger, _ = zap.NewProduction()
	}
	return logger
}
