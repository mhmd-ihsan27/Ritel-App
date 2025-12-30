package database

import (
	"context"
	"time"
)

// GetContextWithTimeout creates a context with the specified timeout
func GetContextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), timeout)
}

// GetContext creates a context without timeout
func GetContext() context.Context {
	return context.Background()
}
