package sync

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/database/dialect"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/mattn/go-sqlite3"
)

// SyncEngine handles automatic synchronization between local SQLite and remote PostgreSQL
type SyncEngine struct {
	localDB         *sql.DB       // SQLite database
	remoteDB        *sql.DB       // PostgreSQL database
	isOnline        bool          // Current connection status
	syncInterval    time.Duration // How often to check for pending syncs
	healthInterval  time.Duration // How often to check server health
	stopChan        chan bool     // Channel to stop sync worker
	mu              sync.RWMutex  // Mutex for thread-safe operations
	sqliteDialect   dialect.Dialect
	postgresDialect dialect.Dialect
}

// SyncOperation represents a database operation that needs to be synced
type SyncOperation struct {
	ID         int64      `json:"id"`
	TableName  string     `json:"table_name"`
	Operation  string     `json:"operation"` // INSERT, UPDATE, DELETE
	RecordID   string     `json:"record_id"`
	Data       string     `json:"data"` // JSON representation of the record
	CreatedAt  time.Time  `json:"created_at"`
	SyncedAt   *time.Time `json:"synced_at"`
	RetryCount int        `json:"retry_count"`
	LastError  string     `json:"last_error"`
	Status     string     `json:"status"` // pending, synced, failed
}

var (
	// Global sync engine instance
	Engine *SyncEngine
)

// InitSyncEngine initializes the sync engine with dual database setup
func InitSyncEngine(sqliteDSN, postgresDSN string) error {

	// Open SQLite connection
	var sqliteDB *sql.DB
	if database.IsSQLite() && database.DB != nil {
		sqliteDB = database.DB
	} else {
		var err error
		sqliteDB, err = sql.Open("sqlite3", sqliteDSN)
		if err != nil {
			return fmt.Errorf("failed to open SQLite: %w", err)
		}
	}

	// Configure SQLite for better concurrency
	// sqliteDB.SetMaxOpenConns(1) // DISABLED: Causing deadlock when transaction is open and new query is made
	sqliteDB.Exec("PRAGMA journal_mode=WAL")
	sqliteDB.Exec("PRAGMA synchronous=NORMAL")

	// Try to open PostgreSQL connection (might fail if offline)
	postgresDB, err := sql.Open("pgx", postgresDSN)
	if err != nil {
		postgresDB = nil
	}

	if postgresDB != nil {
		// Configure PostgreSQL connection pool
		postgresDB.SetMaxOpenConns(10)
		postgresDB.SetMaxIdleConns(5)
		postgresDB.SetConnMaxLifetime(5 * time.Minute)
		postgresDB.SetConnMaxIdleTime(2 * time.Minute)
	}

	Engine = &SyncEngine{
		localDB:         sqliteDB,
		remoteDB:        postgresDB,
		isOnline:        false,
		syncInterval:    3 * time.Second,  // Check more frequently (was 10s)
		healthInterval:  30 * time.Second, // Check server health every 30 seconds
		stopChan:        make(chan bool),
		sqliteDialect:   &dialect.SQLiteDialect{},
		postgresDialect: &dialect.PostgreSQLDialect{},
	}

	// Create sync queue table in SQLite
	if err := Engine.createSyncQueueTable(); err != nil {
		return fmt.Errorf("failed to create sync queue table: %w", err)
	}

	// SAFETY: Force unpause triggers on startup
	// In case the app crashed while pulling data, 'paused' might be stuck at '1'.
	if _, err := sqliteDB.Exec("UPDATE sync_meta SET value = '0' WHERE key = 'paused'"); err != nil {
		// It's okay if table doesn't exist yet, createSyncQueueTable will handle it
		// But if it does, we want to be sure.
	}

	// Initial health check
	Engine.checkServerHealth()

	// Start background workers
	go Engine.syncWorker()
	go Engine.healthCheckWorker()
	go Engine.bootstrapWorker()

	go Engine.bootstrapWorker()

	return nil
}

// createSyncQueueTable creates the sync_queue table in SQLite
func (s *SyncEngine) createSyncQueueTable() error {
	query := `
		CREATE TABLE IF NOT EXISTS sync_meta (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sync_queue (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			table_name TEXT NOT NULL,
			operation TEXT NOT NULL,
			record_id TEXT NOT NULL,
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

	if _, err := s.localDB.Exec(query); err != nil {
		return err
	}
	_, err := s.localDB.Exec(`INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('paused', '0')`)
	return err
}

func (s *SyncEngine) bootstrapWorker() {
	if !s.IsOnline() {
		return
	}

	pending, _ := s.countPending()
	if pending != 0 {
		return
	}

	// AUTOMATIC SYNC: Always try to pull latest data from Web on startup
	log.Println("[SYNC] 🔄 Auto-Sync: Checking for remote updates...")
	if err := s.TriggerForcePull(); err != nil {
		log.Printf("[SYNC] ⚠️ Auto-Pull failed (safe to ignore if offline): %v", err)
	} else {
		log.Println("[SYNC] ✅ Auto-Pull Completed: Desktop is up-to-date with Web")
	}

	// Auto-Fix Postgres Sequences on startup to prevent "duplicate key" errors
	// This is crucial after Initial Sync or Restore operations
	go func() {
		log.Println("[SYNC] 🛠️  Startup: Fixing remote sequences...")
		if err := s.syncRemoteSequences(nil); err != nil {
			log.Printf("[SYNC] Warning: Failed to fix sequences on startup: %v", err)
		}
	}()

	_ = s.refreshFromRemote()
}

// TriggerForcePull manually triggers a full pull from remote to local
func (s *SyncEngine) TriggerForcePull() error {
	log.Println("[SYNC] 🚀 Manual Force Pull Triggered (Remote -> Local)")
	return s.refreshFromRemote()
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
		log.Println("[SYNC] 🟢 Remote Server Connected (Online)")
	} else if wasOnline && !s.isOnline {
		log.Printf("[SYNC] 🔴 Remote Server Disconnected (Offline): %v", err)
	}

	// Force log for debugging initial connection
	// log.Printf("[SYNC DEBUG] Health Check: Err=%v, Online=%v", err, s.isOnline)
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
			return
		}
	}
}

// syncWorker periodically syncs pending operations
func (s *SyncEngine) syncWorker() {
	log.Println("[SYNC] 🚀 Sync Worker Started!")
	ticker := time.NewTicker(s.syncInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			pending, _ := s.countPending()
			online := s.IsOnline()

			// Diagnostic Log every tick (temporary for debugging)
			// log.Printf("[SYNC DEBUG] Worker Tick | Online: %v | Pending Items: %d", online, pending)

			if online {
				if err := s.processPendingSyncs(); err != nil {
					log.Printf("[SYNC] Error processing pending syncs: %v", err)
				}

				if pending == 0 {
					if err := s.refreshFromRemote(); err != nil {
						// Suppress unique constraint errors to avoid log spam
						if !strings.Contains(err.Error(), "UNIQUE constraint failed") {
							log.Printf("[SYNC] Error refreshing from remote: %v", err)
						}
					}
				}
			} else {
				// Try to reconnect/check health aggressively
				s.checkServerHealth()
			}
		case <-s.stopChan:
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
	// Ignore print_settings as it is device-specific
	if tableName == "print_settings" {
		return nil
	}

	// Convert data to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	// Use INSERT OR REPLACE to support force re-syncing existing items
	// This resets status to 'pending', retry_count to 0, and updates the data payload
	query := `
		INSERT OR REPLACE INTO sync_queue (table_name, operation, record_id, data, status, retry_count, last_error)
		VALUES (?, ?, ?, ?, 'pending', 0, NULL)
	`

	_, err = s.localDB.Exec(query, tableName, operation, fmt.Sprint(recordID), string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to queue sync operation: %w", err)
	}

	// Cleaned up duplicate error check

	// OPTIMIZATION: Do NOT trigger immediate sync here.
	// Launching a goroutine for every item causes massive contention during batch operations.
	// The background syncWorker (running every 3s) will pick this up efficiently.
	/*
		if s.IsOnline() {
			go func() {
				if err := s.processPendingSyncs(); err != nil {
				}
			}()
		}
	*/

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
	affectedTables := make(map[string]bool)

	for rows.Next() {
		var op SyncOperation
		err := rows.Scan(&op.ID, &op.TableName, &op.Operation, &op.RecordID, &op.Data, &op.RetryCount)
		if err != nil {
			continue
		}

		if err := s.executeSyncOperation(&op); err != nil {
			failCount++
			log.Printf("[SYNC] Failed to execute sync op %d (%s %s): %v", op.ID, op.Operation, op.TableName, err)
			s.markSyncFailed(op.ID, err.Error())
		} else {
			successCount++
			s.markSyncCompleted(op.ID)
			affectedTables[op.TableName] = true
		}
	}

	if successCount > 0 || failCount > 0 {
		log.Printf("[SYNC] Batch synced: %d success, %d failed", successCount, failCount)
	}

	// Auto-fix sequences for tables that were updated
	if successCount > 0 && len(affectedTables) > 0 {
		var tableList []string
		for t := range affectedTables {
			tableList = append(tableList, t)
		}
		// logic to fix sequences
		go func() {
			if err := s.syncRemoteSequences(tableList); err != nil {
				log.Printf("[SYNC] Warning: Failed to update sequences: %v", err)
			}
		}()
	}

	return nil
}

// executeSyncOperation executes a single sync operation on remote database
func (s *SyncEngine) executeSyncOperation(op *SyncOperation) error {
	// Ignore print_settings as it is device-specific
	if op.TableName == "print_settings" {
		return nil
	}
	// Ignore backup tables
	if strings.HasPrefix(op.TableName, "transaksi_item_backup_") || strings.HasPrefix(op.TableName, "backup_") {
		return nil
	}

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
		return s.upsertRemote(op.TableName, dataMap)
	case "UPDATE":
		return s.upsertRemote(op.TableName, dataMap)
	case "DELETE":
		return s.executeDelete(op.TableName, op.RecordID, dataMap)
	default:
		return fmt.Errorf("unknown operation: %s", op.Operation)
	}
}

func quoteIdent(s string) string {
	return `"` + strings.ReplaceAll(s, `"`, `""`) + `"`
}

func (s *SyncEngine) remoteColumnSet(tableName string) (map[string]struct{}, error) {
	if s.remoteDB == nil {
		return nil, fmt.Errorf("remote database not available")
	}

	rows, err := s.remoteDB.Query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, tableName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	set := map[string]struct{}{}
	for rows.Next() {
		var col string
		if err := rows.Scan(&col); err != nil {
			return nil, err
		}
		set[col] = struct{}{}
	}
	return set, nil
}

func mapToRemoteColumn(local string, remoteSet map[string]struct{}) (string, bool) {
	if _, ok := remoteSet[local]; ok {
		return local, true
	}

	switch local {
	case "berat_gram":
		if _, ok := remoteSet["beratgram"]; ok {
			return "beratgram", true
		}
	case "beratgram":
		if _, ok := remoteSet["berat_gram"]; ok {
			return "berat_gram", true
		}
	}

	return "", false
}

func (s *SyncEngine) upsertRemote(tableName string, data map[string]interface{}) error {
	if len(data) == 0 {
		return nil
	}

	remoteSet, err := s.remoteColumnSet(tableName)
	if err != nil {
		log.Printf("[SYNC] Error fetching remote columns for %s: %v", tableName, err)
		return err
	}

	mapped := make(map[string]interface{}, len(data))
	for localCol, val := range data {
		remoteCol, ok := mapToRemoteColumn(localCol, remoteSet)
		if !ok {
			continue
		}

		// if strings.Contains(localCol, "created_at") {
		// 	log.Printf("[SYNC DEBUG] Processing Col: %s. Value: %v (Type: %T). Local: %v", localCol, val, val, time.Local)
		// }

		if t, isTime := val.(time.Time); isTime {
			// Trust time.Time values from driver, just ensure UTC
			// AND Format as RFC3339 String because target column might be TEXT (OID 25)
			// pgx won't auto-encode time.Time to TEXT, but will encode string to TEXT.
			val = t.UTC().Format(time.RFC3339)
		} else if strVal, isStr := val.(string); isStr {
			// Handle SQLite string formats
			// Format 3: "2026-01-16 00:38:03.9558929+00:00" (Space + Nano + TZ)
			// Format 2: RFC3339 (T + Nano + TZ)
			// Format 1: "2006-01-02 15:04:05" (Simple)

			// Try robust parsing
			var parsedTime time.Time
			var parseErr error

			// Try parse with space instead of T (Common in SQLite default)
			// "2006-01-02 15:04:05.999999999Z07:00"
			if t, err := time.Parse("2006-01-02 15:04:05.999999999Z07:00", strVal); err == nil {
				parsedTime = t
			} else if t, err := time.Parse(time.RFC3339Nano, strVal); err == nil {
				parsedTime = t
			} else if t, err := time.Parse("2006-01-02 15:04:05", strVal); err == nil {
				// Assume this is Local if no TZ
				parsedTime = time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), time.Local)
			} else {
				parseErr = fmt.Errorf("no match")
			}

			if parseErr == nil {
				// Convert back to String (RFC3339) for Postgres TEXT/TIMESTAMPTZ compatibility
				val = parsedTime.UTC().Format(time.RFC3339)
				if strings.Contains(localCol, "created_at") {
					// log.Printf("[SYNC DEBUG] SUCCESFULLY PARSED: %s -> %v", strVal, val)
				}

			} else {
				if strings.Contains(localCol, "created_at") {
					if strings.Contains(localCol, "created_at") {
						// log.Printf("[SYNC DEBUG] Failed to parse string date: %s", strVal)
					}
				}
			}
		}

		mapped[remoteCol] = val
	}

	if _, ok := mapped["id"]; !ok {
		return fmt.Errorf("missing id for upsert on %s", tableName)
	}

	// Extract name for friendly logging
	var friendlyName string
	if val, ok := data["nama"]; ok {
		friendlyName = fmt.Sprintf("%v", val)
	} else if val, ok := data["name"]; ok {
		friendlyName = fmt.Sprintf("%v", val)
	}

	if friendlyName != "" {
		// log.Printf("[SYNC] 📦 Sending %s: %s (ID: %v)...", tableName, friendlyName, data["id"])
	}

	columns := make([]string, 0, len(mapped))
	for col := range mapped {
		columns = append(columns, col)
	}
	sort.Strings(columns)

	placeholders := make([]string, 0, len(columns))
	values := make([]interface{}, 0, len(columns))
	for i, col := range columns {
		placeholders = append(placeholders, fmt.Sprintf("$%d", i+1))
		values = append(values, mapped[col])
	}

	updateClauses := make([]string, 0, len(columns))
	for _, col := range columns {
		if col == "id" {
			continue
		}
		updateClauses = append(updateClauses, fmt.Sprintf("%s = EXCLUDED.%s", quoteIdent(col), quoteIdent(col)))
	}

	var query string
	if len(updateClauses) == 0 {
		query = fmt.Sprintf(
			`INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO NOTHING`,
			quoteIdent(tableName),
			joinStringsQuoted(columns, ", "),
			joinStrings(placeholders, ", "),
			quoteIdent("id"),
		)
	} else {
		query = fmt.Sprintf(
			`INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO UPDATE SET %s`,
			quoteIdent(tableName),
			joinStringsQuoted(columns, ", "),
			joinStrings(placeholders, ", "),
			quoteIdent("id"),
			joinStrings(updateClauses, ", "),
		)
	}

	// log.Printf("[SYNC DEBUG] Executing UPSERT on %s: %s", tableName, query)
	_, err = s.remoteDB.Exec(query, values...)
	if err != nil {
		// Handle duplicate key error (SQLSTATE 23505) specifically for transactions
		if strings.Contains(err.Error(), "23505") && tableName == "transaksi" {
			log.Printf("[SYNC] Conflict detected for table %s. Attempting to resolve...", tableName)

			// Extract nomor_transaksi from values (it's in the data map, but we need to find it safely)
			if nomorTrx, ok := data["nomor_transaksi"].(string); ok && nomorTrx != "" {
				if resolveErr := s.resolveTransactionConflict(nomorTrx); resolveErr != nil {
					log.Printf("[SYNC] Failed to resolve conflict for %s: %v", nomorTrx, resolveErr)
					return err
				} else {
					log.Printf("[SYNC] Conflict resolved for %s. Retrying upsert...", nomorTrx)
					_, err = s.remoteDB.Exec(query, values...)
				}
			}
		}

		if err != nil {
			log.Printf("[SYNC] Error executing UPSERT on %s: %v", tableName, err)
		}
	} else {
		// log.Printf("[SYNC] Successfully upserted %s ID %v", tableName, mapped["id"])
	}
	return err
}

// executeDelete performs DELETE on remote database
func (s *SyncEngine) executeDelete(tableName string, recordID string, data map[string]interface{}) error {
	var id interface{} = recordID
	if v, ok := data["id"]; ok {
		id = v
	}
	query := fmt.Sprintf("DELETE FROM %s WHERE %s = $1", quoteIdent(tableName), quoteIdent("id"))
	_, err := s.remoteDB.Exec(query, id)
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
	close(s.stopChan)

	if s.localDB != nil {
		s.localDB.Close()
	}
	if s.remoteDB != nil {
		s.remoteDB.Close()
	}
}

// resolveTransactionConflict deletes a conflicting transaction and its dependencies from remote
func (s *SyncEngine) resolveTransactionConflict(nomorTransaksi string) error {
	// Find the ID of the conflicting transaction
	var remoteID int64
	query := "SELECT id FROM transaksi WHERE nomor_transaksi = $1"
	err := s.remoteDB.QueryRow(query, nomorTransaksi).Scan(&remoteID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil // No conflict found?
		}
		return fmt.Errorf("failed to find conflicting transaction: %w", err)
	}

	log.Printf("[SYNC-FIX] Deleting conflicting remote transaction ID=%d (%s) to allow sync...", remoteID, nomorTransaksi)

	// Delete dependencies first (manual cascade)
	s.remoteDB.Exec("DELETE FROM pembayaran WHERE transaksi_id = $1", remoteID)
	s.remoteDB.Exec("DELETE FROM transaksi_item WHERE transaksi_id = $1", remoteID)
	s.remoteDB.Exec("DELETE FROM transaksi_batch WHERE transaksi_id = $1", remoteID)
	s.remoteDB.Exec("DELETE FROM returns WHERE transaksi_id = $1", remoteID)

	// Delete the transaction itself
	_, err = s.remoteDB.Exec("DELETE FROM transaksi WHERE id = $1", remoteID)
	if err != nil {
		return fmt.Errorf("failed to delete conflicting transaction: %w", err)
	}

	return nil
}

// DumpQueueStats prints sync queue statistics to log
func (s *SyncEngine) DumpQueueStats() {
	var pending, synced, failed int
	s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'").Scan(&pending)
	s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'synced'").Scan(&synced)
	s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'failed'").Scan(&failed)

	log.Printf("[SYNC DIAGNOSTIC] Queue Stats: Pending=%d, Synced=%d, Failed=%d", pending, synced, failed)

	if failed > 0 {
		rows, err := s.localDB.Query("SELECT id, table_name, last_error FROM sync_queue WHERE status = 'failed' ORDER BY id DESC LIMIT 5")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id int64
				var table, errMsg string
				rows.Scan(&id, &table, &errMsg)
				log.Printf("[SYNC DIAGNOSTIC] ❌ FAILED ITEM #%d (%s): %s", id, table, errMsg)
			}
		}
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

func joinStringsQuoted(strs []string, sep string) string {
	result := ""
	for i, str := range strs {
		if i > 0 {
			result += sep
		}
		result += quoteIdent(str)
	}
	return result
}

func (s *SyncEngine) countPending() (int, error) {
	var pending int
	err := s.localDB.QueryRow("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'").Scan(&pending)
	return pending, err
}

func (s *SyncEngine) listLocalTables() ([]string, error) {
	rows, err := s.localDB.Query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		switch name {
		case "migrations", "sync_queue", "sync_meta", "print_settings", "schema_migrations", "shift_settings", "shift_cashier":
			continue
		default:
			tables = append(tables, name)
		}
	}
	sort.Strings(tables)
	return tables, nil
}

func (s *SyncEngine) listTableColumns(table string) ([]string, error) {
	rows, err := s.localDB.Query(fmt.Sprintf(`PRAGMA table_info(%s)`, quoteIdent(table)))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cols []string
	for rows.Next() {
		var cid int
		var name string
		var ctype string
		var notnull int
		var dflt sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return nil, err
		}
		cols = append(cols, name)
	}
	return cols, nil
}

func (s *SyncEngine) listTableInfo(table string) ([]string, []string, error) {
	rows, err := s.localDB.Query(fmt.Sprintf(`PRAGMA table_info(%s)`, quoteIdent(table)))
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var cols []string
	var pkCols []string
	for rows.Next() {
		var cid int
		var name string
		var ctype string
		var notnull int
		var dflt sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return nil, nil, err
		}
		cols = append(cols, name)
		if pk > 0 {
			pkCols = append(pkCols, name)
		}
	}

	return cols, pkCols, nil
}

func (s *SyncEngine) refreshFromRemote() error {
	if s.remoteDB == nil {
		return nil
	}

	_, _ = s.localDB.Exec(`INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('paused', '0')`)
	_, _ = s.localDB.Exec(`UPDATE sync_meta SET value = '1' WHERE key = 'paused'`)
	_, _ = s.localDB.Exec(`PRAGMA foreign_keys = OFF`)
	defer func() {
		_, _ = s.localDB.Exec(`PRAGMA foreign_keys = ON`)
		_, _ = s.localDB.Exec(`UPDATE sync_meta SET value = '0' WHERE key = 'paused'`)
	}()

	tables, err := s.listLocalTables()
	if err != nil {
		return err
	}

	for _, table := range tables {
		cols, pkCols, err := s.listTableInfo(table)
		if err != nil {
			return fmt.Errorf("failed reading local table info for %s: %w", table, err)
		}
		if len(cols) == 0 {
			continue
		}
		if len(pkCols) == 0 {
			continue
		}

		remoteSet, err := s.remoteColumnSet(table)
		if err != nil {
			if strings.Contains(err.Error(), "does not exist") {
				continue
			}
			return err
		}

		localCols := make([]string, 0, len(cols))
		remoteCols := make([]string, 0, len(cols))
		for _, localCol := range cols {
			remoteCol, ok := mapToRemoteColumn(localCol, remoteSet)
			if !ok {
				continue
			}
			localCols = append(localCols, localCol)
			remoteCols = append(remoteCols, quoteIdent(remoteCol))
		}
		if len(localCols) == 0 {
			continue
		}

		rows, err := s.remoteDB.Query(fmt.Sprintf("SELECT %s FROM %s", joinStrings(remoteCols, ", "), quoteIdent(table)))
		if err != nil {
			if strings.Contains(err.Error(), "does not exist") {
				continue
			}
			return fmt.Errorf("failed reading remote table %s: %w", table, err)
		}

		placeholders := make([]string, 0, len(localCols))
		for i := 0; i < len(localCols); i++ {
			placeholders = append(placeholders, "?")
		}

		pkSet := map[string]struct{}{}
		for _, pk := range pkCols {
			pkSet[pk] = struct{}{}
		}

		updateClauses := make([]string, 0, len(localCols))
		for _, c := range localCols {
			if _, isPK := pkSet[c]; isPK {
				continue
			}
			updateClauses = append(updateClauses, fmt.Sprintf("%s = excluded.%s", quoteIdent(c), quoteIdent(c)))
		}
		conflictTarget := joinStringsQuoted(pkCols, ", ")

		var insertSQL string
		if len(updateClauses) == 0 {
			insertSQL = fmt.Sprintf(
				"INSERT INTO %s (%s) VALUES (%s) ON CONFLICT(%s) DO NOTHING",
				quoteIdent(table),
				joinStringsQuoted(localCols, ", "),
				joinStrings(placeholders, ", "),
				conflictTarget,
			)
		} else {
			insertSQL = fmt.Sprintf(
				"INSERT INTO %s (%s) VALUES (%s) ON CONFLICT(%s) DO UPDATE SET %s",
				quoteIdent(table),
				joinStringsQuoted(localCols, ", "),
				joinStrings(placeholders, ", "),
				conflictTarget,
				joinStrings(updateClauses, ", "),
			)
		}

		colHolders := make([]interface{}, len(localCols))
		colPtrs := make([]interface{}, len(localCols))
		for i := range colHolders {
			colPtrs[i] = &colHolders[i]
		}

		tx, err := s.localDB.Begin()
		if err != nil {
			rows.Close()
			return err
		}

		stmt, err := tx.Prepare(insertSQL)
		if err != nil {
			rows.Close()
			tx.Rollback()
			return err
		}

		for rows.Next() {
			for i := range colHolders {
				colHolders[i] = nil
			}
			if err := rows.Scan(colPtrs...); err != nil {
				stmt.Close()
				rows.Close()
				tx.Rollback()
				return fmt.Errorf("failed scanning remote row for %s: %w", table, err)
			}
			if _, err := stmt.Exec(colHolders...); err != nil {
				// Resilient Pull: If Local has data that conflicts with Remote,
				// assume Local is Truth (for sales) or just preserve it to avoid data loss.
				if strings.Contains(err.Error(), "UNIQUE constraint failed") || strings.Contains(err.Error(), "constraint failed") {
					// log.Printf("[SYNC] ⚠️ Pull Conflict (Local Wins): %s row ignored due to constraint: %v", table, err)
					continue // Skip this row, keep Local version
				}

				stmt.Close()
				rows.Close()
				tx.Rollback()
				// Don't fail the entire sync, just this table
				log.Printf("[SYNC] Error upserting into local table %s: %v", table, err)
				break // Stop processing this table
			}
		}

		stmt.Close()
		rows.Close()
		if err := tx.Commit(); err != nil {
			return err
		}
	}

	return nil
}

// TriggerInitialSync pushes all local data to the remote server
// This is used for the initial migration from Desktop -> Web
func (s *SyncEngine) TriggerInitialSync(force bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.remoteDB == nil {
		return fmt.Errorf("remote database not connected")
	}

	// Check if already completed
	var completed string
	err := s.localDB.QueryRow(`SELECT value FROM sync_meta WHERE key = 'initial_sync_completed'`).Scan(&completed)

	forceResync := os.Getenv("FORCE_RESYNC") == "true" || force

	if err == nil && completed == "1" && !forceResync {
		// SMART CHECK: Check if remote DB was wiped
		var remoteCount int
		var localCount int

		// Check 'transaksi' table as indicator
		if rErr := s.remoteDB.QueryRow("SELECT COUNT(*) FROM transaksi").Scan(&remoteCount); rErr == nil {
			if lErr := s.localDB.QueryRow("SELECT COUNT(*) FROM transaksi").Scan(&localCount); lErr == nil {
				if remoteCount == 0 && localCount > 0 {
					log.Printf("[SYNC] ⚠️ Remote DB appears empty (Trans: %d) while Local has data (%d). FORCING RE-SYNC.", remoteCount, localCount)
					forceResync = true
				}
			}
		}

		if !forceResync {
			return nil // Truly already done
		}
	}

	if forceResync {
		log.Println("[SYNC] ⚠️ FORCE RESYNC TRIGGERED (Push Local -> Remote)")
	}

	log.Println("[SYNC] Starting Initial Sync (Push Local -> Remote)...")

	// Get all syncable tables
	tables, err := s.listLocalTables()
	if err != nil {
		return fmt.Errorf("failed to list tables: %w", err)
	}

	totalItems := 0

	for _, table := range tables {
		// Skip non-data tables
		if table == "sqlite_sequence" || table == "migrations" || table == "sync_queue" || table == "sync_meta" {
			continue
		}
		// Skip backup tables
		if strings.HasPrefix(table, "transaksi_item_backup_") {
			continue
		}

		// READ PHASE: Fetch all rows into memory to avoid holding DB lock
		rows, err := s.localDB.Query(fmt.Sprintf("SELECT * FROM %s", quoteIdent(table)))
		if err != nil {
			log.Printf("[SYNC] Warning: skipping table %s: %v", table, err)
			continue
		}

		cols, err := rows.Columns()
		if err != nil {
			rows.Close()
			continue
		}

		// Buffer for row data
		var rowBuffer []map[string]interface{}

		for rows.Next() {
			columns := make([]interface{}, len(cols))
			columnPointers := make([]interface{}, len(cols))
			for i := range columns {
				columnPointers[i] = &columns[i]
			}

			if err := rows.Scan(columnPointers...); err != nil {
				log.Printf("[SYNC] Warning: failed to scan row in %s: %v", table, err)
				continue
			}

			data := make(map[string]interface{})
			for i, colName := range cols {
				val := columnPointers[i].(*interface{})
				if val != nil {
					data[colName] = *val
				}
			}
			rowBuffer = append(rowBuffer, data)
		}
		rows.Close() // Release READ lock

		// WRITE PHASE: Process buffered rows
		if len(rowBuffer) > 0 {
			log.Printf("[SYNC] Table %s: Processing %d buffered items...", table, len(rowBuffer))
		}

		for _, data := range rowBuffer {
			// Extract ID
			var id int64
			if val, ok := data["id"]; ok {
				// Handle various number types
				switch v := val.(type) {
				case int64:
					id = v
				case int:
					id = int64(v)
				case float64:
					id = int64(v)
				default:
					id = 0
				}
			}

			if err := s.QueueSync(table, "INSERT", id, data); err != nil {
				log.Printf("[SYNC] Failed to queue initial item for %s: %v", table, err)
			} else {
				totalItems++
			}
		}
		log.Printf("[SYNC] Table %s: queued items for sync.", table)
	}

	// Mark as completed
	_, err = s.localDB.Exec(`INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('initial_sync_completed', '1')`)
	if err != nil {
		return fmt.Errorf("failed to mark initial sync as completed: %w", err)
	}

	// Fix Postgres Sequences to prevent ID conflicts
	if err := s.syncRemoteSequences(tables); err != nil {
		log.Printf("[SYNC] Warning: Failed to sync remote sequences: %v", err)
		// Don't fail the whole sync for this, but log it
	}

	log.Printf("[SYNC] Initial Sync Queued: %d items ready to push.", totalItems)
	return nil
}

// syncRemoteSequences resets the Postgres ID sequences to max(id)
func (s *SyncEngine) syncRemoteSequences(tables []string) error {
	if s.remoteDB == nil {
		return nil
	}

	log.Println("[SYNC] Synchronizing remote sequence IDs...")

	// If no tables specified, sync ALL tables
	if len(tables) == 0 {
		var err error
		tables, err = s.listLocalTables()
		if err != nil {
			return fmt.Errorf("failed to list tables for sequence sync: %w", err)
		}
	}

	for _, table := range tables {
		// Skip typical non-data tables
		if table == "sqlite_sequence" || table == "migrations" || table == "sync_queue" || table == "sync_meta" {
			continue
		}

		// Try to reset sequence. We use a safe query that works even if table is empty.
		// pg_get_serial_sequence returns the sequence name for the column.
		// COALESCE(MAX(id), 0) + 1 gets the next available ID.
		query := fmt.Sprintf(`
			SELECT setval(pg_get_serial_sequence('%s', 'id'), COALESCE(MAX(id), 0) + 1, false) 
			FROM %s;
		`, quoteIdent(table), quoteIdent(table))

		// We execute this on the REMOTE database
		if _, err := s.remoteDB.Exec(query); err != nil {
			errStr := err.Error()

			// Case 1: Sequence Overflow (ID too big for standard INTEGER sequence)
			if strings.Contains(errStr, "out of bounds") || strings.Contains(errStr, "SQLSTATE 22003") {
				log.Printf("[SYNC] ⚠️ Sequence overflow for %s. Upgrading to BIGINT...", table)

				// 1. Get sequence name
				var seqName string
				_ = s.remoteDB.QueryRow(fmt.Sprintf("SELECT pg_get_serial_sequence('%s', 'id')", quoteIdent(table))).Scan(&seqName)

				if seqName != "" {
					// 2. Upgrade Sequence to BIGINT
					if _, err := s.remoteDB.Exec(fmt.Sprintf("ALTER SEQUENCE %s AS BIGINT", seqName)); err == nil {
						// 3. Retry setval
						s.remoteDB.Exec(query)
						log.Printf("[SYNC] ✅ Upgraded and fixed sequence for %s", table)
						continue
					}
				}
			}

			// Case 2: TEXT/String ID (e.g. 'batch' table or UUIDs) - No sequence needed
			if strings.Contains(errStr, "types text and integer cannot be matched") || strings.Contains(errStr, "SQLSTATE 42804") {
				// This table probably uses String IDs, so no sequence to reset.
				continue
			}

			// Ignore other errors
			// log.Printf("[SYNC] Debug: Could not reset sequence for %s: %v", table, err)
			continue
		} else {
			// LOG SUCCESS for debugging
			if table == "transaksi" {
				log.Printf("[SYNC] 🔧 Sequence fixed for table: %s", table)
			}
		}
	}

	return nil
}
