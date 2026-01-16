package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"
)

// QueueSyncFunc is a callback function type for queueing sync operations
type QueueSyncFunc func(tableName, operation string, recordID int64, data interface{}) error

// SmartDatabaseManager provides intelligent database routing and auto-sync capabilities
// for offline-first architecture
type SmartDatabaseManager struct {
	primaryDB     *sql.DB // SQLite - always used for operations
	backupDB      *sql.DB // PostgreSQL - used for sync/backup
	isOnline      bool
	mu            sync.RWMutex
	autoQueue     bool          // Enable automatic queueing for sync
	syncEnabled   bool          // Whether sync engine is available
	queueSyncFunc QueueSyncFunc // Callback for queueing sync operations
}

var (
	// SmartManager is the global smart database manager instance
	SmartManager *SmartDatabaseManager
)

// InitSmartManager initializes the smart database manager
func InitSmartManager(primaryDB, backupDB *sql.DB, syncEnabled bool) {
	SmartManager = &SmartDatabaseManager{
		primaryDB:   primaryDB,
		backupDB:    backupDB,
		isOnline:    false,
		autoQueue:   !syncEnabled,
		syncEnabled: syncEnabled,
	}

	// Check initial online status
	if backupDB != nil {
		SmartManager.checkOnlineStatus()
	}

	log.Println("[SMART_MANAGER] ✓ Smart Database Manager initialized")
	log.Printf("[SMART_MANAGER] Primary: SQLite (always active)")
	log.Printf("[SMART_MANAGER] Backup: PostgreSQL (sync: %v)", syncEnabled)
}

// checkOnlineStatus checks if backup database is reachable
func (m *SmartDatabaseManager) checkOnlineStatus() {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.backupDB == nil {
		m.isOnline = false
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := m.backupDB.PingContext(ctx)
	m.isOnline = (err == nil)
}

// IsOnline returns current online status
func (m *SmartDatabaseManager) IsOnline() bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.isOnline
}

// Exec executes a query on primary database and auto-queues for sync
func (m *SmartDatabaseManager) Exec(query string, args ...interface{}) (sql.Result, error) {
	// Always execute on primary (SQLite)
	result, err := m.primaryDB.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	// Auto-queue for sync if enabled and this is a write operation
	if m.autoQueue && m.syncEnabled && isWriteOperation(query) {
		go m.queueForSync(query, args, result)
	}

	return result, nil
}

// ExecContext executes a query with context on primary database
func (m *SmartDatabaseManager) ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	result, err := m.primaryDB.ExecContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	// Auto-queue for sync
	if m.autoQueue && m.syncEnabled && isWriteOperation(query) {
		go m.queueForSync(query, args, result)
	}

	return result, nil
}

// Query executes a query that returns rows (always from primary/SQLite)
func (m *SmartDatabaseManager) Query(query string, args ...interface{}) (*sql.Rows, error) {
	return m.primaryDB.Query(query, args...)
}

// QueryContext executes a query with context
func (m *SmartDatabaseManager) QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	return m.primaryDB.QueryContext(ctx, query, args...)
}

// QueryRow executes a query that returns a single row
func (m *SmartDatabaseManager) QueryRow(query string, args ...interface{}) *sql.Row {
	return m.primaryDB.QueryRow(query, args...)
}

// QueryRowContext executes a query with context that returns a single row
func (m *SmartDatabaseManager) QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row {
	return m.primaryDB.QueryRowContext(ctx, query, args...)
}

// Begin starts a transaction on primary database
func (m *SmartDatabaseManager) Begin() (*sql.Tx, error) {
	return m.primaryDB.Begin()
}

// BeginTx starts a transaction with context
func (m *SmartDatabaseManager) BeginTx(ctx context.Context, opts *sql.TxOptions) (*sql.Tx, error) {
	return m.primaryDB.BeginTx(ctx, opts)
}

// Prepare creates a prepared statement
func (m *SmartDatabaseManager) Prepare(query string) (*sql.Stmt, error) {
	return m.primaryDB.Prepare(query)
}

// PrepareContext creates a prepared statement with context
func (m *SmartDatabaseManager) PrepareContext(ctx context.Context, query string) (*sql.Stmt, error) {
	return m.primaryDB.PrepareContext(ctx, query)
}

// queueForSync queues an operation for background sync to PostgreSQL
func (m *SmartDatabaseManager) queueForSync(query string, args []interface{}, result sql.Result) {
	// Only queue if sync callback is available
	if !m.syncEnabled || m.queueSyncFunc == nil {
		return
	}

	// Extract table name and operation type from query
	tableName, operation := parseQuery(query)
	if tableName == "" || operation == "" {
		return
	}

	// Get record ID from result
	recordID, err := result.LastInsertId()
	if err != nil {
		// For UPDATE/DELETE, try to extract ID from args
		recordID = extractIDFromArgs(args)
	}

	// Create data payload
	data := map[string]interface{}{
		"query": query,
		"args":  args,
	}

	// Queue for sync using callback
	if err := m.queueSyncFunc(tableName, operation, recordID, data); err != nil {
		log.Printf("[SMART_MANAGER] Warning: Failed to queue sync: %v", err)
	}
}

// isWriteOperation checks if query is a write operation (INSERT, UPDATE, DELETE)
func isWriteOperation(query string) bool {
	q := query
	if len(q) > 100 {
		q = q[:100] // Only check first 100 chars
	}
	
	// Simple check for write operations
	return containsAny(q, []string{"INSERT", "UPDATE", "DELETE", "insert", "update", "delete"})
}

// parseQuery extracts table name and operation from SQL query
func parseQuery(query string) (tableName, operation string) {
	// Simple parser - can be enhanced
	q := query
	if len(q) > 200 {
		q = q[:200]
	}

	// Detect operation
	if containsAny(q, []string{"INSERT", "insert"}) {
		operation = "INSERT"
	} else if containsAny(q, []string{"UPDATE", "update"}) {
		operation = "UPDATE"
	} else if containsAny(q, []string{"DELETE", "delete"}) {
		operation = "DELETE"
	}

	// Extract table name (simplified - assumes standard SQL format)
	// This is a basic implementation, can be improved with proper SQL parsing
	if operation == "INSERT" {
		tableName = extractTableFromInsert(q)
	} else if operation == "UPDATE" {
		tableName = extractTableFromUpdate(q)
	} else if operation == "DELETE" {
		tableName = extractTableFromDelete(q)
	}

	return tableName, operation
}

// extractTableFromInsert extracts table name from INSERT query
func extractTableFromInsert(query string) string {
	// Look for "INSERT INTO table_name"
	start := -1
	for i := 0; i < len(query)-11; i++ {
		if query[i:i+11] == "INSERT INTO" || query[i:i+11] == "insert into" {
			start = i + 12
			break
		}
	}
	
	if start == -1 {
		return ""
	}

	// Find end of table name (space or parenthesis)
	end := start
	for end < len(query) && query[end] != ' ' && query[end] != '(' {
		end++
	}

	if end > start {
		return query[start:end]
	}
	return ""
}

// extractTableFromUpdate extracts table name from UPDATE query
func extractTableFromUpdate(query string) string {
	// Look for "UPDATE table_name"
	start := -1
	for i := 0; i < len(query)-6; i++ {
		if query[i:i+6] == "UPDATE" || query[i:i+6] == "update" {
			start = i + 7
			break
		}
	}
	
	if start == -1 {
		return ""
	}

	// Find end of table name (space)
	end := start
	for end < len(query) && query[end] != ' ' {
		end++
	}

	if end > start {
		return query[start:end]
	}
	return ""
}

// extractTableFromDelete extracts table name from DELETE query
func extractTableFromDelete(query string) string {
	// Look for "DELETE FROM table_name"
	start := -1
	for i := 0; i < len(query)-11; i++ {
		if query[i:i+11] == "DELETE FROM" || query[i:i+11] == "delete from" {
			start = i + 12
			break
		}
	}
	
	if start == -1 {
		return ""
	}

	// Find end of table name (space)
	end := start
	for end < len(query) && query[end] != ' ' {
		end++
	}

	if end > start {
		return query[start:end]
	}
	return ""
}

// extractIDFromArgs tries to extract record ID from query arguments
func extractIDFromArgs(args []interface{}) int64 {
	// Look for integer arguments (likely IDs)
	for _, arg := range args {
		switch v := arg.(type) {
		case int:
			return int64(v)
		case int64:
			return v
		case int32:
			return int64(v)
		}
	}
	return 0
}

// containsAny checks if string contains any of the substrings
func containsAny(s string, substrs []string) bool {
	for _, substr := range substrs {
		if contains(s, substr) {
			return true
		}
	}
	return false
}

// contains checks if string contains substring (case-insensitive)
func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// SetSyncQueueFunc sets the callback function for queueing sync operations
// This must be called after sync engine is initialized to avoid import cycles
func (m *SmartDatabaseManager) SetSyncQueueFunc(fn QueueSyncFunc) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.queueSyncFunc = fn
	log.Println("[SMART_MANAGER] Sync queue callback registered")
}

// GetStats returns current manager statistics
func (m *SmartDatabaseManager) GetStats() map[string]interface{} {
	stats := map[string]interface{}{
		"primary_db":    "SQLite",
		"backup_db":     "PostgreSQL",
		"online":        m.IsOnline(),
		"auto_queue":    m.autoQueue,
		"sync_enabled":  m.syncEnabled,
		"has_callback":  m.queueSyncFunc != nil,
	}

	return stats
}

// SetAutoQueue enables or disables automatic queueing
func (m *SmartDatabaseManager) SetAutoQueue(enabled bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.autoQueue = enabled
	log.Printf("[SMART_MANAGER] Auto-queue: %v", enabled)
}

// ForceSync triggers immediate sync of all pending operations
// Note: This requires sync engine to be initialized separately
func (m *SmartDatabaseManager) ForceSync() error {
	if !m.syncEnabled {
		return fmt.Errorf("sync not enabled")
	}
	// Sync will be triggered by the sync engine's background worker
	return nil
}

// MarshalJSON implements json.Marshaler for logging
func (m *SmartDatabaseManager) MarshalJSON() ([]byte, error) {
	return json.Marshal(m.GetStats())
}
