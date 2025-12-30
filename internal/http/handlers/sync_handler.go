package handlers

import (
	"ritel-app/internal/http/response"
	"ritel-app/internal/sync"

	"github.com/gin-gonic/gin"
)

type SyncHandler struct{}

func NewSyncHandler() *SyncHandler {
	return &SyncHandler{}
}

// GetSyncStatus returns current sync engine status
func (h *SyncHandler) GetSyncStatus(c *gin.Context) {
	if sync.Engine == nil {
		response.BadRequest(c, "Sync mode is not enabled", nil)
		return
	}

	stats := sync.Engine.GetSyncStats()
	response.Success(c, stats, "Sync status retrieved successfully")
}

// ForceSyncNow manually triggers sync of all pending operations
func (h *SyncHandler) ForceSyncNow(c *gin.Context) {
	if sync.Engine == nil {
		response.BadRequest(c, "Sync mode is not enabled", nil)
		return
	}

	if err := sync.ForceSyncNow(); err != nil {
		response.InternalServerError(c, "Failed to force sync", err)
		return
	}

	response.Success(c, sync.Engine.GetSyncStats(), "Sync completed successfully")
}

// GetPendingSyncs returns list of pending sync operations
func (h *SyncHandler) GetPendingSyncs(c *gin.Context) {
	if sync.Engine == nil {
		response.BadRequest(c, "Sync mode is not enabled", nil)
		return
	}

	// Query pending operations from sync queue
	db := sync.GetLocalDB()
	if db == nil {
		response.InternalServerError(c, "Local database not available", nil)
		return
	}

	query := `
		SELECT id, table_name, operation, record_id, created_at, retry_count, last_error, status
		FROM sync_queue
		WHERE status IN ('pending', 'failed')
		ORDER BY created_at DESC
		LIMIT 100
	`

	rows, err := db.Query(query)
	if err != nil {
		response.InternalServerError(c, "Failed to get pending syncs", err)
		return
	}
	defer rows.Close()

	type PendingSync struct {
		ID         int64  `json:"id"`
		TableName  string `json:"table_name"`
		Operation  string `json:"operation"`
		RecordID   int64  `json:"record_id"`
		CreatedAt  string `json:"created_at"`
		RetryCount int    `json:"retry_count"`
		LastError  string `json:"last_error"`
		Status     string `json:"status"`
	}

	var syncs []PendingSync
	for rows.Next() {
		var s PendingSync
		var lastError *string
		err := rows.Scan(&s.ID, &s.TableName, &s.Operation, &s.RecordID, &s.CreatedAt, &s.RetryCount, &lastError, &s.Status)
		if err != nil {
			continue
		}
		if lastError != nil {
			s.LastError = *lastError
		}
		syncs = append(syncs, s)
	}

	response.Success(c, syncs, "Pending syncs retrieved successfully")
}

// ClearSyncedQueue clears successfully synced operations from queue
func (h *SyncHandler) ClearSyncedQueue(c *gin.Context) {
	if sync.Engine == nil {
		response.BadRequest(c, "Sync mode is not enabled", nil)
		return
	}

	db := sync.GetLocalDB()
	if db == nil {
		response.InternalServerError(c, "Local database not available", nil)
		return
	}

	// Delete synced operations older than 7 days
	query := `
		DELETE FROM sync_queue
		WHERE status = 'synced'
		AND synced_at < datetime('now', '-7 days')
	`

	result, err := db.Exec(query)
	if err != nil {
		response.InternalServerError(c, "Failed to clear synced queue", err)
		return
	}

	rowsAffected, _ := result.RowsAffected()

	response.Success(c, map[string]interface{}{
		"cleared": rowsAffected,
	}, "Synced queue cleared successfully")
}
