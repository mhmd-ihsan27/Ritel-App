package logger

import (
	"io"
	"log"

	"github.com/wailsapp/wails/v2/pkg/logger"
)

// SilentLogger is a custom logger that suppresses all output except errors
type SilentLogger struct {
	logger.Logger
}

// NewSilentLogger creates a new silent logger
func NewSilentLogger() logger.Logger {
	return &SilentLogger{}
}

// Print suppresses all print statements
func (l *SilentLogger) Print(message string) {
	// Silently ignore
}

// Trace suppresses trace logs
func (l *SilentLogger) Trace(message string) {
	// Silently ignore
}

// Debug suppresses debug logs
func (l *SilentLogger) Debug(message string) {
	// Silently ignore
}

// Info suppresses info logs
func (l *SilentLogger) Info(message string) {
	// Silently ignore
}

// Warning suppresses warning logs
func (l *SilentLogger) Warning(message string) {
	// Silently ignore
}

// Error only shows errors
func (l *SilentLogger) Error(message string) {
	log.Println("ERROR:", message)
}

// Fatal shows fatal errors and exits
func (l *SilentLogger) Fatal(message string) {
	log.Fatal("FATAL:", message)
}

// SetLogLevel does nothing for silent logger
func (l *SilentLogger) SetLogLevel(level logger.LogLevel) {
	// Ignore
}

// SetOutput sets the output writer
func (l *SilentLogger) SetOutput(w io.Writer) {
	// Ignore
}
