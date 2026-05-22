package repository

import (
	"time"

	"github.com/google/uuid"
)

// WhatsAppMessageQueue represents the message queue table
type WhatsAppMessageQueue struct {
	ID                uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	WhatsAppMessageID string     `gorm:"column:whatsapp_message_id;uniqueIndex;not null"`
	WhatsAppGroupID   string     `gorm:"column:whatsapp_group_id;index;not null"`
	GroupName         string     `gorm:"column:group_name;not null"`
	SenderPhone       string     `gorm:"column:sender_phone;not null"`
	SenderName        *string    `gorm:"column:sender_name"`
	RawText           string     `gorm:"column:raw_text;not null"`
	ReceivedAt        time.Time  `gorm:"column:received_at;type:timestamptz;not null"`
	Status            string     `gorm:"column:status;not null;default:'pending'"`
	RetryCount        int        `gorm:"column:retry_count;not null;default:0"`
	MaxRetries        int        `gorm:"column:max_retries;not null;default:3"`
	LastError         *string    `gorm:"column:last_error"`
	LastErrorAt       *time.Time `gorm:"column:last_error_at;type:timestamptz"`
	CreatedAt         time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()"`
	ProcessedAt       *time.Time `gorm:"column:processed_at;type:timestamptz"`
	CompletedAt       *time.Time `gorm:"column:completed_at;type:timestamptz"`
	ExtractedData     *string    `gorm:"column:extracted_data;type:jsonb"`
	CreatedOfferID    *uuid.UUID `gorm:"column:created_offer_id;type:uuid"`
	CreatedRequestID  *uuid.UUID `gorm:"column:created_request_id;type:uuid"`
}

// TableName specifies the table name for GORM
func (WhatsAppMessageQueue) TableName() string {
	return "whatsapp_message_queue"
}

// Group represents the groups table
type Group struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	JID           string     `gorm:"column:jid;uniqueIndex;not null"`
	Name          string     `gorm:"column:name;not null"`
	IsMonitored   bool       `gorm:"column:is_monitored;not null;default:false"`
	MemberCount   int        `gorm:"column:member_count;not null;default:0"`
	LastMessageAt *time.Time `gorm:"column:last_message_at;type:timestamptz"`
	CreatedAt     time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()"`
	UpdatedAt     time.Time  `gorm:"column:updated_at;type:timestamptz;not null;default:now()"`
}

// TableName specifies the table name for GORM
func (Group) TableName() string {
	return "groups"
}

// WhatsAppSession represents the whatsapp_sessions table
type WhatsAppSession struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	PhoneNumber   string     `gorm:"column:phone_number;uniqueIndex;not null"`
	SessionData   string     `gorm:"column:session_data;type:jsonb;not null"`
	IsConnected   bool       `gorm:"column:is_connected;not null;default:false"`
	LastConnected *time.Time `gorm:"column:last_connected;type:timestamptz"`
	CreatedAt     time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()"`
	UpdatedAt     time.Time  `gorm:"column:updated_at;type:timestamptz;not null;default:now()"`
}

// TableName specifies the table name for GORM
func (WhatsAppSession) TableName() string {
	return "whatsapp_sessions"
}
