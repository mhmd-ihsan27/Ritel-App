package sync

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/database/dialect"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

// SyncEngine handles automatic synchronization between local SQLite and remote PostgreSQL
type SyncEngine struct {
	localDB        *sql.DB          // SQLite database
	remoteDB       *sql.DB          // PostgreSQL database
	isOnline       bool             // Current connection status
	syncInterval   time.Duration    // How often to check for pending syncs
	healthInterval time.Duration    // How often to check server health
	stopChan       chan bool        // Channel to stop sync worker
	mu             sync.RWMutex     // Mutex for thread-safe operations
	sqliteDialect  dialect.Dialect
	postgresDialect dialect.Dialect
}

// SyncOperation represents a database operation that needs to be synced
type SyncOperation struct {
	ID          int64     `json:"id"`
	TableName   string    `json:"table_name"`
	Operation   string    `json:"operation"` // INSERT, UPDATE, DELETE
	RecordID    int64     `json:"record_id"`
	Data        string    `json:"data"`        // JSON representation of the record
	CreatedAt   time.Time `json:"created_at"`
	SyncedAt    *time.Time `json:"synced_at"`
	RetryCount  int       `json:"retry_count"`
	LastError   string    `json:"last_error"`
	Status      string    `json:"status"` // pending, synced, failed
}

var (
	// Global sync engine instance
	Engine *SyncEngine
)

// InitSyncEngine initializes the sync engine with dual database setup
func InitSyncEngine(sqliteDSN, postgresDSN string) error {
	log.Println("[SYNC] Initializing Sync Engine...")

	// Open SQLite connection
	sqliteDB, err := sql.Open("sqlite3", sqliteDSN)
	if err != nil {
		return fmt.Errorf("failed to open SQLite: %w", err)
	}

	// Configure SQLite for better concurrency
	sqliteDB.SetMaxOpenConns(1) // SQLite works best with single connection
	sqliteDB.Exec("PRAGMA journal_mode=WAL")
	sqliteDB.Exec("PRAGMA synchronous=NORMAL")

	// Try to open PostgreSQL connection (might fail if offline)
	postgresDB, err := sql.Open("postgres", postgresDSN)
	if err != nil {
		log.Printf("[SYNC] Warning: Failed to open PostgreSQL connection: %v", err)
		postgresDB = nil
	}

	if postgresDB != nil {
		// Configure PostgreSQL connection pool
		postgresDB.SetMaxOpenConns(10)
		postgresDB.SetMaxIdleConns(5)
		postgresDB.SetConnMaxLifetime(time.Hour)
	}

	Engine = &SyncEngine{
		localDB:         sqliteDB,
		remoteDB:        postgresDB,
		isOnline:        false,
		syncInterval:    10 * time.Second,  // Check for pending syncs every 10 seconds
		healthInterval:  30 * time.Second,  // Check server health every 30 seconds
		stopChan:        make(chan bool),
		sqliteDialect:   &dialect.SQLiteDialect{},
		postgresDialect: &dialect.PostgreSQLDialect{},
	}

	// Create sync queue table in SQLite
	if err := Engine.createSyncQueueTable(); err != nil {
		return fmt.Errorf("failed to create sync queue table: %w", err)
	}

	// Initial health check
	Engine.checkServerHealth()

	// Start background workers
	go Engine.syncWorker()
	go Engine.healthCheckWorker()

	log.Printf("[SYNC] ✓ Sync Engine initialized (Status: %s)", Engine.getStatusString())
	return nil
}

// createSyncQueueTable creates the sync_queue table in SQLite
func (s *SyncEngine) createSyncQueueTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS sync_queue (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			table_name TEXT NOT NULL,
			operation TEXT NOT NULL,
			record_id INTEGER NOT NULL,
			data TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			synced_at TIMESTAMP,
			retry_count INTEGER DEFAULT 0,
			last_error TEXT,
			status TEXT DEFAULT 'pending'
		);

		CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
		CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
	`

	_, err := s.localDB.Exec(query)
	return err
}

// checkServerHealth checks if PostgreSQL server is reachable
func (s *SyncEngine) checkServerHealth() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.remoteDB == nil {
		s.isOnline = false
		return
	}

	// Try to ping the database with timeout
	ctx, cancel := database.GetContextWithTimeout(5 * time.Second)
	defer cancel()

	err := s.remoteDB.PingContext(ctx)
	wasOnline := s.isOnline
	s.isOnline = (err == nil)

	// Log status changes
	if !wasOnline && s.isOnline {
		log.Println("[SYNC] ✓ Server connection RESTORED - Auto-sync will begin")
	} else if wasOnline && !s.isOnline {
		log.Println("[SYNC] ⚠ Server connection LOST - Switching to offline mode")
	}
}

// healthCheckWorker periodically checks server health
func (s *SyncEngine) healthCheckWorker() {
	ticker := time.NewTicker(s.healthInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.checkServerHealth()
		case <-s.stopChan:
			log.Println("[SYNC] Health check worker stopped")
			return
		}
	}
}

// syncWorker periodically syncs pending operations
func (s *SyncEngine) syncWorker() {
	ticker := time.NewTicker(s.syncInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if s.IsOnline() {
				if err := s.processPendingSyncs(); err != nil {
					log.Printf("[SYNC] Error processing pending syncs: %v", err)
				}
			}
		case <-s.stopChan:
			log.Println("[SYNC] Sync worker stopped")
			return
		}
	}
}

// IsOnline returns current connection status
func (s *SyncEngine) IsOnline() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isOnline
}

// getStatusString returns human-readable status
func (s *SyncEngine) getStatusString() string {
	if s.IsOnline() {
		return "🟢 ONLINE"
	}
	return "🔴 OFFLINE"
}

// QueueSync adds a database operation to the sync queue
func (s *SyncEngine) QueueSync(tableName, operation string, recordID int64, data interface{}) error {
	// Convert data to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	query := `
		INSERT INTO sync_queue (table_name, operation, record_id, data, status)
		VALUES (?, ?, ?, ?, 'pending')
	`

	_, err = s.localDB.Exec(query, tableName, operation, recordID, string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to queue sync operation: %w", err)
	}

	log.Printf("[SYNC] Queued %s operation for %s (ID: %d)", operation, tableName, recordID)

	// If online, try to sync immediately
	if s.IsOnline() {
		go func() {
			if err := s.processPendingSyncs(); err != nil {
				log.Printf("[SYNC] Error in immediate sync: %v", err)
			}
		}()
	}

	return nil
}

// processPendingSyncs processes all pending sync operations
func (s *SyncEngine) processPendingSyncs() error {
	if !s.IsOnline() {
		return nil // Skip if offline
	}

	// Get pending operations
	query := `
		SELECT id, table_name, operation, record_id, data, retry_count
		FROM sync_queue
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT 100
	`

	rows, err := s.localDB.Query(query)
	if err != nil {
		return fmt.Errorf("failed to get pending syncs: %w", err)
	}
	defer rows.Close()

	successCount := 0
	failCount := 0

	for rows.Next() {
		var op SyncOperation
		err := rows.Scan(&op.ID, &op.TableName, &op.Operation, &op.RecordID, &op.Data, &op.RetryCount)
		if err != nil {
			log.Printf("[SYNC] Error scanning sync operation: %v", err)
			continue
		}

		// Execute sync operation
		if err := s.executeSyncOperation(&op); err != nil {
			failCount++
			s.markSyncFailed(op.ID, err.Error())
			log.Printf("[SYNC] Failed to sync %s on %s (ID: %d): %v", op.Operation, op.TableName, op.RecordID, err)
		} else {
			successCount++
			s.markSyncCompleted(op.ID)
		}
	}

	if successCount > 0 || failCount > 0 {
		log.Printf("[SYNC] Processed %d operations: %d succeeded, %d failed", successCount+failCount, successCount, failCount)
	}

	return nil
}

// executeSyncOperation executes a single sync operation on remote database
func (s *SyncEngine) executeSyncOperation(op *SyncOperation) error {
	if s.remoteDB == nil {
		return fmt.Errorf("remote database not available")
	}

	// Parse the data JSON
	var dataMap map[string]interface{}
	if err := json.Unmarshal([]byte(op.Data), &dataMap); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	// Execute based on operation type
	switch op.Operation {
	case "INSERT":
		return s.executeInsert(op.TableName, dataMap)
	case "UPDATE":
		return s.executeUpdate(op.TableName, op.RecordID, dataMap)
	case "DELETE":
		return s.executeDelete(op.TableName, op.RecordID)
	default:
		return fmt.Errorf("unknown operation: %s", op.Operation)
	}
}

// executeInsert performs INSERT on remote database
func (s *SyncEngine) executeInsert(tableName string, data map[string]interface{}) error {
	// Build INSERT query dynamically
	columns := make([]string, 0, len(data))
	values := make([]interface{}, 0, len(data))
	placeholders := make([]string, 0, len(data))

	i := 1
	for col, val := range data {
		if col == "id" {
			continue // Skip ID, let PostgreSQL auto-generate
		}
		columns = append(columns, col)
		values = append(values, val)
		placeholders = append(placeholders, fmt.Sprintf("$%d", i))
		i++
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s) ON CONFLICT DO NOTHING",
		tableName,
		joinStrings(columns, ", "),
		joinStrings(placeholders, ", "),
	)

	_, err := s.remoteDB.Exec(query, values...)
	return err
}

// executeUpdate performs UPDATE on remote database
func (s *SyncEngine) executeUpdate(tableName string, recordID int64, data map[string]interface{}) error {
	// Build UPDATE query dynamically
	setClauses := make([]string, 0, len(data))
	values := make([]interface{}, 0, len(data)+1)

	i := 1
	for col, val := range data {
		if col == "id" {
			continue // Skip ID
		}
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", col, i))
		values = append(values, val)
		i++
	}

	values = append(values, recordID)

	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE id = $%d",
		tableName,
		joinStrings(setClauses, ", "),
		i,
	)

	_, err := s.remoteDB.Exec(query, values...)
	return err
}

// executeDelete performs DELETE on remote database
func (s *SyncEngine) executeDelete(tableName string, recordID int64) error {
	query := fmt.Sprintf("DELETE FROM %s WHERE id = $1", tableName)
	_, err := s.remoteDB.Exec(query, recordID)
	return err
}

// markSyncCompleted marks a sync operation as completed
func (s *SyncEngine) markSyncCompleted(syncID int64) error {
	query := `UPDATE sync_queue SET status = 'synced', synced_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := s.localDB.Exec(query, syncID)
	return err
}

// markSyncFailed marks a sync operation as failed and increments retry count
func (s *SyncEngine) markSyncFailed(syncID int64, errorMsg string) error {
	query := `
		UPDATE sync_queue
		SET retry_count = retry_count + 1,
		    last_error = ?,
		    status = CASE WHEN retry_count >= 5 THEN 'failed' ELSE 'pending' END
		WHERE id = ?
	`
	_, err := s.localDB.Exec(query, errorMsg, syncID)
	return err
}

// GetSyncStats returns current sync statistics
func (s *SyncEngine) GetSyncStats() map[string]interface{} {
	stats := map[string]interface{}{
		"online": s.IsOnline(),
		"status": s.getStatusString(),
	}

	// Count pending operations
	var pending, synced, failed int
	s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'").Scan(&pending)
	s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'synced'").Scan(&synced)
	s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'failed'").Scan(&failed)

	stats["pending"] = pending
	stats["synced"] = synced
	stats["failed"] = failed

	return stats
}

// Stop stops the sync engine
func (s *SyncEngine) Stop() {
	log.Println("[SYNC] Stopping sync engine...")
	close(s.stopChan)

	if s.localDB != nil {
		s.localDB.Close()
	}
	if s.remoteDB != nil {
		s.remoteDB.Close()
	}
}

// Helper function to join strings
func joinStrings(strs []string, sep string) string {
	result := ""
	for i, str := range strs {
		if i > 0 {
			result += sep
		}
		result += str
	}
	return result
}
