package api

import (
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// sensitiveQueryParams lists query parameter names that should be redacted from logs
var sensitiveQueryParams = []string{
	"token",
	"api_key",
	"apikey",
	"password",
	"secret",
	"auth",
	"authorization",
	"session",
	"key",
}

// sanitizeQuery redacts sensitive query parameters from the query string
func sanitizeQuery(rawQuery string) string {
	if rawQuery == "" {
		return ""
	}

	values, err := url.ParseQuery(rawQuery)
	if err != nil {
		// If parsing fails, don't log the query at all
		return "[invalid query]"
	}

	// Redact sensitive parameters
	for _, sensitive := range sensitiveQueryParams {
		for key := range values {
			if strings.EqualFold(key, sensitive) {
				values.Set(key, "[REDACTED]")
			}
		}
	}

	return values.Encode()
}

// LoggerMiddleware logs HTTP requests
func LoggerMiddleware(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := sanitizeQuery(c.Request.URL.RawQuery)

		// Store request time in context
		c.Set("request_time", start)

		// Process request
		c.Next()

		// Log after request
		latency := time.Since(start)
		statusCode := c.Writer.Status()

		logger.Info("http request",
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.Int("status", statusCode),
			zap.Duration("latency", latency),
			zap.String("ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
		)
	}
}
