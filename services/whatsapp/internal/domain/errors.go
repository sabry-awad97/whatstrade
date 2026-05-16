package domain

import "errors"

var (
	// ErrEmptyMessage is returned when message text is empty
	ErrEmptyMessage = errors.New("message text cannot be empty")

	// ErrInvalidGroupID is returned when group ID is invalid
	ErrInvalidGroupID = errors.New("invalid group ID")

	// ErrInvalidSenderPhone is returned when sender phone is invalid
	ErrInvalidSenderPhone = errors.New("invalid sender phone number")

	// ErrGroupNotMonitored is returned when trying to process message from unmonitored group
	ErrGroupNotMonitored = errors.New("group is not monitored")

	// ErrSessionNotFound is returned when WhatsApp session doesn't exist
	ErrSessionNotFound = errors.New("whatsapp session not found")

	// ErrNotConnected is returned when WhatsApp client is not connected
	ErrNotConnected = errors.New("whatsapp client not connected")

	// ErrNotAuthenticated is returned when WhatsApp client is not authenticated
	ErrNotAuthenticated = errors.New("whatsapp client not authenticated")
)
