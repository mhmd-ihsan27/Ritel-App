package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
	"time"
)

// TransaksiBatchRepository handles transaksi_batch database operations
type TransaksiBatchRepository struct {
	db *sql.DB
}

// NewTransaksiBatchRepository creates a new repository
func NewTransaksiBatchRepository() *TransaksiBatchRepository {
	return &TransaksiBatchRepository{
		db: database.DB,
	}
}

// Create creates a new transaksi_batch record
func (r *TransaksiBatchRepository) Create(tb *models.TransaksiBatch) error {
	query := `
		INSERT INTO transaksi_batch (
			transaksi_id, batch_id, produk_id, qty_diambil, created_at
		) VALUES (?, ?, ?, ?, ?)`

	query = database.TranslateQuery(query)

	if database.IsSQLite() {
		_, err := database.Exec(query,
			tb.TransaksiID,
			tb.BatchID,
			tb.ProdukID,
			tb.QtyDiambil,
			time.Now(),
		)
		return err
	}

	// PostgreSQL with RETURNING
	query += " RETURNING id"
	err := database.QueryRow(query,
		tb.TransaksiID,
		tb.BatchID,
		tb.ProdukID,
		tb.QtyDiambil,
		time.Now(),
	).Scan(&tb.ID)

	if err != nil {
		return fmt.Errorf("failed to create transaksi_batch: %w", err)
	}

	return nil
}

// CreateTx creates a new transaksi_batch record within a transaction context
func (r *TransaksiBatchRepository) CreateTx(tx *sql.Tx, tb *models.TransaksiBatch) error {
	query := `
		INSERT INTO transaksi_batch (
			transaksi_id, batch_id, produk_id, qty_diambil, created_at
		) VALUES (?, ?, ?, ?, ?)`

	query = database.TranslateQuery(query)

	_, err := tx.Exec(query,
		tb.TransaksiID,
		tb.BatchID,
		tb.ProdukID,
		tb.QtyDiambil,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to create transaksi_batch in tx: %w", err)
	}

	return nil
}

// GetByTransaksiID retrieves all batch usages for a transaction
func (r *TransaksiBatchRepository) GetByTransaksiID(transaksiID int) ([]*models.TransaksiBatch, error) {
	query := `
		SELECT id, transaksi_id, batch_id, produk_id, qty_diambil, created_at
		FROM transaksi_batch
		WHERE transaksi_id = ?
		ORDER BY created_at ASC`

	query = database.TranslateQuery(query)

	rows, err := database.Query(query, transaksiID)
	if err != nil {
		return nil, fmt.Errorf("failed to query transaksi_batch: %w", err)
	}
	defer rows.Close()

	var results []*models.TransaksiBatch
	for rows.Next() {
		tb := &models.TransaksiBatch{}
		var createdAtStr string // Read as string first for SQLite compatibility
		err := rows.Scan(
			&tb.ID,
			&tb.TransaksiID,
			&tb.BatchID,
			&tb.ProdukID,
			&tb.QtyDiambil,
			&createdAtStr,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaksi_batch: %w", err)
		}

		// Parse the datetime string - try multiple formats for SQLite compatibility
		if createdAtStr != "" {
			if t, err := time.Parse("2006-01-02 15:04:05", createdAtStr); err == nil {
				tb.CreatedAt = t
			} else if t, err := time.Parse(time.RFC3339, createdAtStr); err == nil {
				tb.CreatedAt = t
			} else if t, err := time.Parse("2006-01-02T15:04:05Z07:00", createdAtStr); err == nil {
				tb.CreatedAt = t
			}
		}

		results = append(results, tb)
	}

	return results, nil
}

// GetByBatchID retrieves all transaction usages for a specific batch
func (r *TransaksiBatchRepository) GetByBatchID(batchID string) ([]*models.TransaksiBatch, error) {
	query := `
		SELECT id, transaksi_id, batch_id, produk_id, qty_diambil, created_at
		FROM transaksi_batch
		WHERE batch_id = ?
		ORDER BY created_at DESC`

	query = database.TranslateQuery(query)

	rows, err := database.Query(query, batchID)
	if err != nil {
		return nil, fmt.Errorf("failed to query transaksi_batch: %w", err)
	}
	defer rows.Close()

	var results []*models.TransaksiBatch
	for rows.Next() {
		tb := &models.TransaksiBatch{}
		err := rows.Scan(
			&tb.ID,
			&tb.TransaksiID,
			&tb.BatchID,
			&tb.ProdukID,
			&tb.QtyDiambil,
			&tb.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaksi_batch: %w", err)
		}
		results = append(results, tb)
	}

	return results, nil
}

// DeleteByTransaksiID deletes all batch records for a transaction
func (r *TransaksiBatchRepository) DeleteByTransaksiID(transaksiID int) error {
	query := `DELETE FROM transaksi_batch WHERE transaksi_id = ?`
	query = database.TranslateQuery(query)

	_, err := database.Exec(query, transaksiID)
	if err != nil {
		return fmt.Errorf("failed to delete transaksi_batch: %w", err)
	}

	return nil
}
