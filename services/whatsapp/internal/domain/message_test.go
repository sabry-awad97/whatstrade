package domain

import (
	"errors"
	"testing"
	"time"
)

func TestMessage_Validate(t *testing.T) {
	tests := []struct {
		name    string
		message *Message
		wantErr error
	}{
		{
			name: "valid message",
			message: &Message{
				RawText:     "Hello World",
				GroupID:     "123456789@g.us",
				SenderPhone: "201234567890",
			},
			wantErr: nil,
		},
		{
			name: "empty raw text",
			message: &Message{
				RawText:     "",
				GroupID:     "123456789@g.us",
				SenderPhone: "201234567890",
			},
			wantErr: ErrEmptyMessage,
		},
		{
			name: "whitespace only raw text",
			message: &Message{
				RawText:     "   ",
				GroupID:     "123456789@g.us",
				SenderPhone: "201234567890",
			},
			wantErr: ErrEmptyMessage,
		},
		{
			name: "empty group ID",
			message: &Message{
				RawText:     "Hello World",
				GroupID:     "",
				SenderPhone: "201234567890",
			},
			wantErr: ErrInvalidGroupID,
		},
		{
			name: "whitespace only group ID",
			message: &Message{
				RawText:     "Hello World",
				GroupID:     "   ",
				SenderPhone: "201234567890",
			},
			wantErr: ErrInvalidGroupID,
		},
		{
			name: "empty sender phone",
			message: &Message{
				RawText:     "Hello World",
				GroupID:     "123456789@g.us",
				SenderPhone: "",
			},
			wantErr: ErrInvalidSenderPhone,
		},
		{
			name: "whitespace only sender phone",
			message: &Message{
				RawText:     "Hello World",
				GroupID:     "123456789@g.us",
				SenderPhone: "   ",
			},
			wantErr: ErrInvalidSenderPhone,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.message.Validate()
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestMessage_CanRetry(t *testing.T) {
	tests := []struct {
		name    string
		message *Message
		want    bool
	}{
		{
			name: "can retry - failed with retries remaining",
			message: &Message{
				Status:     MessageStatusFailed,
				RetryCount: 1,
				MaxRetries: 3,
			},
			want: true,
		},
		{
			name: "cannot retry - max retries reached",
			message: &Message{
				Status:     MessageStatusFailed,
				RetryCount: 3,
				MaxRetries: 3,
			},
			want: false,
		},
		{
			name: "cannot retry - status is completed",
			message: &Message{
				Status:     MessageStatusCompleted,
				RetryCount: 0,
				MaxRetries: 3,
			},
			want: false,
		},
		{
			name: "cannot retry - status is pending",
			message: &Message{
				Status:     MessageStatusPending,
				RetryCount: 0,
				MaxRetries: 3,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.message.CanRetry(); got != tt.want {
				t.Errorf("CanRetry() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestMessage_ShouldMoveToDeadLetter(t *testing.T) {
	tests := []struct {
		name    string
		message *Message
		want    bool
	}{
		{
			name: "should move to dead letter - max retries exceeded",
			message: &Message{
				Status:     MessageStatusFailed,
				RetryCount: 3,
				MaxRetries: 3,
			},
			want: true,
		},
		{
			name: "should not move - retries remaining",
			message: &Message{
				Status:     MessageStatusFailed,
				RetryCount: 1,
				MaxRetries: 3,
			},
			want: false,
		},
		{
			name: "should not move - status is completed",
			message: &Message{
				Status:     MessageStatusCompleted,
				RetryCount: 3,
				MaxRetries: 3,
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.message.ShouldMoveToDeadLetter(); got != tt.want {
				t.Errorf("ShouldMoveToDeadLetter() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestMessage_MarkProcessing(t *testing.T) {
	msg := &Message{
		Status: MessageStatusPending,
	}

	before := time.Now()
	msg.MarkProcessing()
	after := time.Now()

	if msg.Status != MessageStatusProcessing {
		t.Errorf("MarkProcessing() status = %v, want %v", msg.Status, MessageStatusProcessing)
	}

	if msg.ProcessedAt == nil {
		t.Error("MarkProcessing() ProcessedAt is nil, want non-nil")
	} else if msg.ProcessedAt.Before(before) || msg.ProcessedAt.After(after) {
		t.Errorf("MarkProcessing() ProcessedAt = %v, want between %v and %v", msg.ProcessedAt, before, after)
	}
}

func TestMessage_MarkCompleted(t *testing.T) {
	msg := &Message{
		Status: MessageStatusProcessing,
	}

	before := time.Now()
	msg.MarkCompleted()
	after := time.Now()

	if msg.Status != MessageStatusCompleted {
		t.Errorf("MarkCompleted() status = %v, want %v", msg.Status, MessageStatusCompleted)
	}

	if msg.CompletedAt == nil {
		t.Error("MarkCompleted() CompletedAt is nil, want non-nil")
	} else if msg.CompletedAt.Before(before) || msg.CompletedAt.After(after) {
		t.Errorf("MarkCompleted() CompletedAt = %v, want between %v and %v", msg.CompletedAt, before, after)
	}
}

func TestMessage_MarkFailed(t *testing.T) {
	msg := &Message{
		Status:     MessageStatusProcessing,
		RetryCount: 1,
	}

	testErr := errors.New("test error")
	before := time.Now()
	msg.MarkFailed(testErr)
	after := time.Now()

	if msg.Status != MessageStatusFailed {
		t.Errorf("MarkFailed() status = %v, want %v", msg.Status, MessageStatusFailed)
	}

	if msg.LastError != testErr.Error() {
		t.Errorf("MarkFailed() LastError = %v, want %v", msg.LastError, testErr.Error())
	}

	if msg.RetryCount != 2 {
		t.Errorf("MarkFailed() RetryCount = %v, want %v", msg.RetryCount, 2)
	}

	if msg.LastErrorAt == nil {
		t.Error("MarkFailed() LastErrorAt is nil, want non-nil")
	} else if msg.LastErrorAt.Before(before) || msg.LastErrorAt.After(after) {
		t.Errorf("MarkFailed() LastErrorAt = %v, want between %v and %v", msg.LastErrorAt, before, after)
	}
}

func TestMessage_MarkDeadLetter(t *testing.T) {
	msg := &Message{
		Status: MessageStatusFailed,
	}

	msg.MarkDeadLetter()

	if msg.Status != MessageStatusDeadLetter {
		t.Errorf("MarkDeadLetter() status = %v, want %v", msg.Status, MessageStatusDeadLetter)
	}
}
