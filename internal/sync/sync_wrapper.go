package sync

import (
	"database/sql"
	"fmt"
	"log"
)

// ExecWithSync executes a query on local database and queues it for remote sync
// Use this for INSERT, UPDATE, DELETE operations that need to be synced
func ExecWithSync(tableName, operation string, query string, args ...interface{}) (sql.Result, error) {
	if Engine == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}

	// Execute on local database first
	result, err := Engine.localDB.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("local exec failed: %w", err)
	}

	// Get the affected record ID
	var recordID int64
	if operation == "INSERT" {
		recordID, _ = result.LastInsertId()
	} else {
		// For UPDATE/DELETE, record ID should be in the args (usually last parameter)
		if len(args) > 0 {
			if id, ok := args[len(args)-1].(int64); ok {
				recordID = id
			} else if id, ok := args[len(args)-1].(int); ok {
				recordID = int64(id)
			}
		}
	}

	// Queue for sync if online or offline
	// Create a data map from the operation
	dataMap := make(map[string]interface{})

	// For INSERT operations, we need to fetch the inserted record
	if operation == "INSERT" && recordID > 0 {
		// For now, just store the ID
		// TODO: Fetch full record data if needed for more accurate sync
		dataMap["id"] = recordID
	} else if operation == "UPDATE" || operation == "DELETE" {
		dataMap["id"] = recordID
	}

	// Queue the sync operation
	if err := Engine.QueueSync(tableName, operation, recordID, dataMap); err != nil {
		log.Printf("[SYNC] Warning: Failed to queue sync for %s on %s: %v", operation, tableName, err)
		// Don't fail the operation just because queueing failed
	}

	return result, nil
}

// QueryRowWithSync is for SELECT operations (no sync needed, just uses local DB)
func QueryRowWithSync(query string, args ...interface{}) *sql.Row {
	if Engine == nil || Engine.localDB == nil {
		log.Println("[SYNC] Warning: Sync engine not initialized, cannot query")
		return nil
	}
	return Engine.localDB.QueryRow(query, args...)
}

// QueryWithSync is for SELECT operations (no sync needed, just uses local DB)
func QueryWithSync(query string, args ...interface{}) (*sql.Rows, error) {
	if Engine == nil || Engine.localDB == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}
	return Engine.localDB.Query(query, args...)
}

// TransactionWithSync provides a transaction that will be synced
type TransactionWithSync struct {
	tx        *sql.Tx
	tableName string
	operations []syncQueuedOp
}

type syncQueuedOp struct {
	tableName string
	operation string
	recordID  int64
	data      map[string]interface{}
}

// BeginTx starts a new transaction with sync support
func BeginTx(tableName string) (*TransactionWithSync, error) {
	if Engine == nil || Engine.localDB == nil {
		return nil, fmt.Errorf("sync engine not initialized")
	}

	tx, err := Engine.localDB.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}

	return &TransactionWithSync{
		tx:        tx,
		tableName: tableName,
		operations: make([]syncQueuedOp, 0),
	}, nil
}

// Exec executes a query within the transaction
func (t *TransactionWithSync) Exec(operation string, query string, args ...interface{}) (sql.Result, error) {
	result, err := t.tx.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	// Track the operation for later sync
	var recordID int64
	if operation == "INSERT" {
		recordID, _ = result.LastInsertId()
	} else if len(args) > 0 {
		if id, ok := args[len(args)-1].(int64); ok {
			recordID = id
		} else if id, ok := args[len(args)-1].(int); ok {
			recordID = int64(id)
		}
	}

	t.operations = append(t.operations, syncQueuedOp{
		tableName: t.tableName,
		operation: operation,
		recordID:  recordID,
		data:      map[string]interface{}{"id": recordID},
	})

	return result, nil
}

// QueryRow executes a query within the transaction
func (t *TransactionWithSync) QueryRow(query string, args ...interface{}) *sql.Row {
	return t.tx.QueryRow(query, args...)
}

// Query executes a query within the transaction
func (t *TransactionWithSync) Query(query string, args ...interface{}) (*sql.Rows, error) {
	return t.tx.Query(query, args...)
}

// Commit commits the transaction and queues all operations for sync
func (t *TransactionWithSync) Commit() error {
	if err := t.tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Queue all operations for sync
	for _, op := range t.operations {
		if err := Engine.QueueSync(op.tableName, op.operation, op.recordID, op.data); err != nil {
			log.Printf("[SYNC] Warning: Failed to queue sync after commit: %v", err)
		}
	}

	return nil
}

// Rollback rolls back the transaction
func (t *TransactionWithSync) Rollback() error {
	return t.tx.Rollback()
}

// ForceSyncNow triggers an immediate sync of all pending operations
func ForceSyncNow() error {
	if Engine == nil {
		return fmt.Errorf("sync engine not initialized")
	}

	if !Engine.IsOnline() {
		return fmt.Errorf("server is offline, cannot sync")
	}

	log.Println("[SYNC] Manual sync triggered...")
	return Engine.processPendingSyncs()
}

// GetLocalDB returns the local SQLite database connection
func GetLocalDB() *sql.DB {
	if Engine == nil {
		return nil
	}
	return Engine.localDB
}

// GetRemoteDB returns the remote PostgreSQL database connection
func GetRemoteDB() *sql.DB {
	if Engine == nil {
		return nil
	}
	return Engine.remoteDB
}
