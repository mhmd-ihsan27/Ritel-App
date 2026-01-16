package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

// DebugLogger writes debug logs to file
type DebugLogger struct {
	file *os.File
}

var debugLogger *DebugLogger

// InitDebugLogger initializes the debug logger
func InitDebugLogger() error {
	// Create logs directory if not exists
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Create log file
	logPath := filepath.Join(logsDir, "startup_debug.log")
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	debugLogger = &DebugLogger{file: file}

	// Write startup message
	debugLogger.Log("===========================================")
	debugLogger.Log("DEBUG LOGGER INITIALIZED")
	debugLogger.Log(fmt.Sprintf("Time: %s", time.Now().Format("2006-01-02 15:04:05")))
	debugLogger.Log("===========================================")

	return nil
}

// Log writes a log message to file
func (d *DebugLogger) Log(message string) {
	if d == nil || d.file == nil {
		return
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logLine := fmt.Sprintf("[%s] %s\n", timestamp, message)

	d.file.WriteString(logLine)
	d.file.Sync() // Ensure it's written immediately

	// Also print to console
	log.Print(message)
}

// LogError writes an error log
func (d *DebugLogger) LogError(context string, err error) {
	if d == nil {
		return
	}

	d.Log(fmt.Sprintf("ERROR [%s]: %v", context, err))
}

// Close closes the logger
func (d *DebugLogger) Close() {
	if d != nil && d.file != nil {
		d.Log("===========================================")
		d.Log("DEBUG LOGGER CLOSED")
		d.Log("===========================================")
		d.file.Close()
	}
}

// Global logging functions
func LogDebug(message string) {
	if debugLogger != nil {
		debugLogger.Log(message)
	}
}

func LogDebugError(context string, err error) {
	if debugLogger != nil {
		debugLogger.LogError(context, err)
	}
}

func CloseDebugLogger() {
	if debugLogger != nil {
		debugLogger.Close()
	}
}
