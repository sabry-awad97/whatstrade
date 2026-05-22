package domain

import (
	"strings"
	"time"
)

// Message represents a WhatsApp message
type Message struct {
	ID               string
	WhatsAppID       string
	GroupID          string
	GroupName        string
	SenderPhone      string
	SenderName       string
	RawText          string
	ReceivedAt       time.Time
	Status           MessageStatus
	RetryCount       int
	MaxRetries       int
	LastError        string
	LastErrorAt      *time.Time
	ProcessedAt      *time.Time
	CompletedAt      *time.Time
	CreatedOfferID   *string
	CreatedRequestID *string
}

// MessageStatus represents the processing status of a message
type MessageStatus string

const (
	MessageStatusPending    MessageStatus = "pending"
	MessageStatusProcessing MessageStatus = "processing"
	MessageStatusCompleted  MessageStatus = "completed"
	MessageStatusFailed     MessageStatus = "failed"
	MessageStatusDeadLetter MessageStatus = "dead_letter"
)

// Validate checks if the message is valid
func (m *Message) Validate() error {
	if strings.TrimSpace(m.RawText) == "" {
		return ErrEmptyMessage
	}
	if strings.TrimSpace(m.GroupID) == "" {
		return ErrInvalidGroupID
	}
	if strings.TrimSpace(m.SenderPhone) == "" {
		return ErrInvalidSenderPhone
	}
	return nil
}

// CanRetry checks if the message can be retried
func (m *Message) CanRetry() bool {
	return m.Status == MessageStatusFailed && m.RetryCount < m.MaxRetries
}

// ShouldMoveToDeadLetter checks if message should be moved to dead letter queue
func (m *Message) ShouldMoveToDeadLetter() bool {
	return m.Status == MessageStatusFailed && m.RetryCount >= m.MaxRetries
}

// MarkProcessing marks the message as being processed
func (m *Message) MarkProcessing() {
	m.Status = MessageStatusProcessing
	now := time.Now()
	m.ProcessedAt = &now
}

// MarkCompleted marks the message as completed
func (m *Message) MarkCompleted() {
	m.Status = MessageStatusCompleted
	now := time.Now()
	m.CompletedAt = &now
}

// MarkFailed marks the message as failed
func (m *Message) MarkFailed(err error) {
	m.Status = MessageStatusFailed
	m.LastError = err.Error()
	now := time.Now()
	m.LastErrorAt = &now
	m.RetryCount++
}

// MarkDeadLetter marks the message as dead letter
func (m *Message) MarkDeadLetter() {
	m.Status = MessageStatusDeadLetter
}
