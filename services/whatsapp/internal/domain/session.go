package domain

import "time"

// Session represents a WhatsApp session
type Session struct {
	ID            string
	PhoneNumber   string
	IsConnected   bool
	LastConnected *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// IsActive checks if the session is currently active
func (s *Session) IsActive() bool {
	return s.IsConnected && s.LastConnected != nil
}
