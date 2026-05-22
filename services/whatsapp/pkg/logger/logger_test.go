package logger

import (
	"testing"

	"go.uber.org/zap/zapcore"
)

func TestNew_ValidLevels(t *testing.T) {
	tests := []struct {
		name  string
		level string
	}{
		{"debug level", "debug"},
		{"info level", "info"},
		{"warn level", "warn"},
		{"error level", "error"},
		{"DEBUG uppercase", "DEBUG"},
		{"INFO uppercase", "INFO"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger, err := New(tt.level)
			if err != nil {
				t.Errorf("New(%q) error = %v, want nil", tt.level, err)
			}
			if logger == nil {
				t.Errorf("New(%q) returned nil logger", tt.level)
			}
		})
	}
}

func TestNew_InvalidLevel(t *testing.T) {
	// Invalid level should default to info level, not error
	logger, err := New("invalid")
	if err != nil {
		t.Errorf("New(invalid) error = %v, want nil (should default to info)", err)
	}
	if logger == nil {
		t.Error("New(invalid) returned nil logger, want non-nil with default level")
	}
}

func TestNew_EmptyLevel(t *testing.T) {
	// Empty level should default to info level
	logger, err := New("")
	if err != nil {
		t.Errorf("New(\"\") error = %v, want nil (should default to info)", err)
	}
	if logger == nil {
		t.Error("New(\"\") returned nil logger, want non-nil with default level")
	}
}

func TestMustNew_Success(t *testing.T) {
	logger := MustNew("info")
	if logger == nil {
		t.Error("MustNew(info) returned nil logger")
	}
}

func TestMustNew_InvalidLevel(t *testing.T) {
	// Should not panic with invalid level (defaults to info)
	defer func() {
		if r := recover(); r != nil {
			t.Errorf("MustNew(invalid) panicked = %v, want no panic (should default to info)", r)
		}
	}()

	logger := MustNew("invalid")
	if logger == nil {
		t.Error("MustNew(invalid) returned nil logger")
	}
}

func TestNew_LoggerConfiguration(t *testing.T) {
	logger, err := New("debug")
	if err != nil {
		t.Fatalf("New(debug) error = %v, want nil", err)
	}

	// Verify logger is at debug level
	if !logger.Core().Enabled(zapcore.DebugLevel) {
		t.Error("Logger should be enabled at debug level")
	}

	// Test with info level
	logger, err = New("info")
	if err != nil {
		t.Fatalf("New(info) error = %v, want nil", err)
	}

	// Debug should be disabled at info level
	if logger.Core().Enabled(zapcore.DebugLevel) {
		t.Error("Logger should not be enabled at debug level when set to info")
	}

	// Info should be enabled
	if !logger.Core().Enabled(zapcore.InfoLevel) {
		t.Error("Logger should be enabled at info level")
	}
}
