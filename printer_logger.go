package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

var printerLogFile *os.File

// InitPrinterLog initializes the printer log file
func InitPrinterLog() error {
	// Create logs directory
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Open log file in append mode
	logPath := filepath.Join(logsDir, "printer_debug.log")
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	printerLogFile = file

	// Write startup header
	logToPrinterFile("========================================")
	logToPrinterFile("PRINTER DEBUG LOG STARTED")
	logToPrinterFile(fmt.Sprintf("Time: %s", time.Now().Format("2006-01-02 15:04:05")))
	logToPrinterFile("========================================")

	return nil
}

// logToPrinterFile writes a message to the printer log file
func logToPrinterFile(message string) {
	if printerLogFile == nil {
		return
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logLine := fmt.Sprintf("[%s] %s\n", timestamp, message)

	printerLogFile.WriteString(logLine)
	printerLogFile.Sync() // Flush to disk immediately
}

// ClosePrinterLog closes the printer log file
func ClosePrinterLog() {
	if printerLogFile != nil {
		logToPrinterFile("========================================")
		logToPrinterFile("PRINTER DEBUG LOG CLOSED")
		logToPrinterFile("========================================")
		printerLogFile.Close()
		printerLogFile = nil
	}
}
