package domain

import "time"

// Group represents a WhatsApp group
type Group struct {
	ID            string
	JID           string // WhatsApp JID (unique identifier)
	Name          string
	IsMonitored   bool
	MemberCount   int
	LastMessageAt *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// ShouldProcessMessages checks if messages from this group should be processed
func (g *Group) ShouldProcessMessages() bool {
	return g.IsMonitored
}
