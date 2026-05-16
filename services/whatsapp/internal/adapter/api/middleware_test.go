package api

import (
	"testing"
)

func TestSanitizeQuery(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "empty query",
			input:    "",
			expected: "",
		},
		{
			name:     "no sensitive params",
			input:    "page=1&limit=10",
			expected: "limit=10&page=1", // url.Values.Encode() sorts keys
		},
		{
			name:     "token param",
			input:    "page=1&token=secret123",
			expected: "page=1&token=%5BREDACTED%5D",
		},
		{
			name:     "api_key param",
			input:    "api_key=abc123&user=john",
			expected: "api_key=%5BREDACTED%5D&user=john",
		},
		{
			name:     "password param",
			input:    "username=admin&password=secret",
			expected: "password=%5BREDACTED%5D&username=admin",
		},
		{
			name:     "multiple sensitive params",
			input:    "token=abc&password=xyz&page=1",
			expected: "page=1&password=%5BREDACTED%5D&token=%5BREDACTED%5D",
		},
		{
			name:     "case insensitive matching",
			input:    "TOKEN=abc&Password=xyz",
			expected: "Password=%5BREDACTED%5D&TOKEN=%5BREDACTED%5D",
		},
		{
			name:     "invalid query",
			input:    "%%%invalid",
			expected: "[invalid query]",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeQuery(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeQuery(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
