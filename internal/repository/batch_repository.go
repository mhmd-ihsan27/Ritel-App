package repository

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/models"

	"github.com/google/uuid"
)

// BatchRepository handles batch database operations
type BatchRepository struct {
	db *sql.DB
}

// NewBatchRepository creates a new batch repository
func NewBatchRepository() *BatchRepository {
	return &BatchRepository{
		db: database.DB,
	}
}

// CreateBatch creates a new batch
func (r *BatchRepository) CreateBatch(batch *models.Batch) error {
	// Generate UUID for batch ID
	if batch.ID == "" {
		batch.ID = uuid.New().String()
	}

	// Calculate expiry date from restock date + shelf life
	batch.TanggalKadaluarsa = batch.TanggalRestok.AddDate(0, 0, batch.MasaSimpanHari)

	// Determine initial status
	batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)

	// Initialize qty_tersisa same as qty
	batch.QtyTersisa = batch.Qty

	query := `
		INSERT INTO batch (
			id, produk_id, qty, qty_tersisa, tanggal_restok,
			masa_simpan_hari, tanggal_kadaluarsa, status,
			supplier, keterangan
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.Exec(
		query,
		batch.ID,
		batch.ProdukID,
		batch.Qty,
		batch.QtyTersisa,
		batch.TanggalRestok,
		batch.MasaSimpanHari,
		batch.TanggalKadaluarsa,
		batch.Status,
		batch.Supplier,
		batch.Keterangan,
	)

	if err != nil {
		return fmt.Errorf("failed to create batch: %w", err)
	}

	return nil
}

// GetBatchByID retrieves a batch by ID
func (r *BatchRepository) GetBatchByID(id string) (*models.Batch, error) {
	query := `
		SELECT id, produk_id, qty, qty_tersisa, tanggal_restok,
		       masa_simpan_hari, tanggal_kadaluarsa, status,
		       supplier, keterangan, created_at, updated_at
		FROM batch
		WHERE id = ?
	`

	batch := &models.Batch{}
	err := r.db.QueryRow(query, id).Scan(
		&batch.ID,
		&batch.ProdukID,
		&batch.Qty,
		&batch.QtyTersisa,
		&batch.TanggalRestok,
		&batch.MasaSimpanHari,
		&batch.TanggalKadaluarsa,
		&batch.Status,
		&batch.Supplier,
		&batch.Keterangan,
		&batch.CreatedAt,
		&batch.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("batch not found")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get batch: %w", err)
	}

	// Update status based on current date
	batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)

	return batch, nil
}

// GetBatchesByProdukID retrieves all batches for a product, ordered by FIFO (oldest first)
func (r *BatchRepository) GetBatchesByProdukID(produkID int) ([]*models.Batch, error) {
	log.Printf("[BATCH REPO] GetBatchesByProdukID called for produk_id=%d", produkID)

	query := `
		SELECT id, produk_id, qty, qty_tersisa, tanggal_restok,
		       masa_simpan_hari, tanggal_kadaluarsa, status,
		       supplier, keterangan, created_at, updated_at
		FROM batch
		WHERE produk_id = ? AND qty_tersisa > 0
		ORDER BY tanggal_restok ASC, created_at ASC
	`

	rows, err := r.db.Query(query, produkID)
	if err != nil {
		log.Printf("[BATCH REPO] ❌ Error querying batches for produk_id=%d: %v", produkID, err)
		return nil, fmt.Errorf("failed to query batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		err := rows.Scan(
			&batch.ID,
			&batch.ProdukID,
			&batch.Qty,
			&batch.QtyTersisa,
			&batch.TanggalRestok,
			&batch.MasaSimpanHari,
			&batch.TanggalKadaluarsa,
			&batch.Status,
			&batch.Supplier,
			&batch.Keterangan,
			&batch.CreatedAt,
			&batch.UpdatedAt,
		)
		if err != nil {
			log.Printf("[BATCH REPO] ❌ Error scanning batch row for produk_id=%d: %v", produkID, err)
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		// Update status based on current date
		batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)
		batches = append(batches, batch)
	}

	log.Printf("[BATCH REPO] ✅ GetBatchesByProdukID success: %d batches found for produk_id=%d", len(batches), produkID)
	return batches, nil
}

// GetAllBatches retrieves all batches (for admin view)
func (r *BatchRepository) GetAllBatches() ([]*models.Batch, error) {
	query := `
		SELECT id, produk_id, qty, qty_tersisa, tanggal_restok,
		       masa_simpan_hari, tanggal_kadaluarsa, status,
		       supplier, keterangan, created_at, updated_at
		FROM batch
		ORDER BY tanggal_restok DESC, created_at DESC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		err := rows.Scan(
			&batch.ID,
			&batch.ProdukID,
			&batch.Qty,
			&batch.QtyTersisa,
			&batch.TanggalRestok,
			&batch.MasaSimpanHari,
			&batch.TanggalKadaluarsa,
			&batch.Status,
			&batch.Supplier,
			&batch.Keterangan,
			&batch.CreatedAt,
			&batch.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		// Update status based on current date
		batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)
		batches = append(batches, batch)
	}

	return batches, nil
}

// GetExpiringBatches retrieves batches that are expiring soon
// Uses each product's notification threshold (hari_pemberitahuan_kadaluarsa)
// to determine if a batch should be shown in the warning list
func (r *BatchRepository) GetExpiringBatches(daysThreshold int) ([]*models.Batch, error) {
	// Modified query to JOIN with produk table and use product-specific notification days
	// Only show batches where:
	// 1. qty_tersisa > 0 (still has stock)
	// 2. Days until expiry <= product's hari_pemberitahuan_kadaluarsa setting

	var query string

	// Use the reliable IsPostgreSQL() helper function
	log.Printf("[BATCH REPO] Database driver: CurrentDriver=%s, IsPostgreSQL=%v", database.CurrentDriver, database.IsPostgreSQL())

	// Check if using PostgreSQL or SQLite using the helper function
	if database.IsPostgreSQL() {
		// PostgreSQL syntax - use DATE subtraction
		query = `
			SELECT
				b.id, b.produk_id, b.qty, b.qty_tersisa, b.tanggal_restok,
				b.masa_simpan_hari, b.tanggal_kadaluarsa, b.status,
				b.supplier, b.keterangan, b.created_at, b.updated_at,
				p.hari_pemberitahuan_kadaluarsa,
				p.nama as produk_nama,
				(DATE(b.tanggal_kadaluarsa) - CURRENT_DATE) as days_diff
			FROM batch b
			INNER JOIN produk p ON b.produk_id = p.id
			WHERE b.qty_tersisa > 0
			  AND (DATE(b.tanggal_kadaluarsa) - CURRENT_DATE) <= p.hari_pemberitahuan_kadaluarsa
			ORDER BY b.tanggal_kadaluarsa ASC
		`
	} else {
		// SQLite syntax - use julianday
		query = `
			SELECT
				b.id, b.produk_id, b.qty, b.qty_tersisa, b.tanggal_restok,
				b.masa_simpan_hari, b.tanggal_kadaluarsa, b.status,
				b.supplier, b.keterangan, b.created_at, b.updated_at,
				p.hari_pemberitahuan_kadaluarsa,
				p.nama as produk_nama,
				CAST(julianday(b.tanggal_kadaluarsa) - julianday('now') AS INTEGER) as days_diff
			FROM batch b
			INNER JOIN produk p ON b.produk_id = p.id
			WHERE b.qty_tersisa > 0
			  AND julianday(b.tanggal_kadaluarsa) - julianday('now') <= p.hari_pemberitahuan_kadaluarsa
			ORDER BY b.tanggal_kadaluarsa ASC
		`
	}

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query expiring batches: %w", err)
	}
	defer rows.Close()

	var batches []*models.Batch
	for rows.Next() {
		batch := &models.Batch{}
		var hariPemberitahuan int
		var produkNama string
		var daysDiff int

		err := rows.Scan(
			&batch.ID,
			&batch.ProdukID,
			&batch.Qty,
			&batch.QtyTersisa,
			&batch.TanggalRestok,
			&batch.MasaSimpanHari,
			&batch.TanggalKadaluarsa,
			&batch.Status,
			&batch.Supplier,
			&batch.Keterangan,
			&batch.CreatedAt,
			&batch.UpdatedAt,
			&hariPemberitahuan,
			&produkNama,
			&daysDiff,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		// DEBUG LOGGING

		// Update status based on current date
		batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)
		batches = append(batches, batch)
	}

	fmt.Printf("[BATCH WARNING] Total batches found: %d\n", len(batches))
	return batches, nil
}

// UpdateBatchQty updates the remaining quantity of a batch (used during sales)
func (r *BatchRepository) UpdateBatchQty(batchID string, qtyReduction float64) error {
	query := `
		UPDATE batch
		SET qty_tersisa = qty_tersisa - ?
		WHERE id = ? AND qty_tersisa >= ?
	`

	result, err := r.db.Exec(query, qtyReduction, batchID, qtyReduction)
	if err != nil {
		return fmt.Errorf("failed to update batch qty: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("insufficient quantity in batch or batch not found")
	}

	return nil
}

// UpdateBatchStatus updates the status of a batch
func (r *BatchRepository) UpdateBatchStatus(batchID string, status string) error {
	query := `UPDATE batch SET status = ? WHERE id = ?`

	_, err := r.db.Exec(query, status, batchID)
	if err != nil {
		return fmt.Errorf("failed to update batch status: %w", err)
	}

	return nil
}

// DeleteBatch deletes a batch (soft delete by setting qty_tersisa to 0)
func (r *BatchRepository) DeleteBatch(batchID string) error {
	query := `UPDATE batch SET qty_tersisa = 0, status = 'expired' WHERE id = ?`

	_, err := r.db.Exec(query, batchID)
	if err != nil {
		return fmt.Errorf("failed to delete batch: %w", err)
	}

	return nil
}

// UpdateAllBatchStatuses updates status for all batches based on current date
func (r *BatchRepository) UpdateAllBatchStatuses() error {
	batches, err := r.GetAllBatches()
	if err != nil {
		return err
	}

	for _, batch := range batches {
		newStatus := r.calculateBatchStatus(batch.TanggalKadaluarsa)
		if newStatus != batch.Status {
			err := r.UpdateBatchStatus(batch.ID, newStatus)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// calculateBatchStatus determines batch status based on expiry date
func (r *BatchRepository) calculateBatchStatus(expiryDate time.Time) string {
	now := time.Now()
	daysUntilExpiry := int(expiryDate.Sub(now).Hours() / 24)

	if daysUntilExpiry < 0 {
		return "expired"
	} else if daysUntilExpiry <= 2 {
		return "hampir_expired"
	}
	return "fresh"
}

// FindBatchByDateAndShelfLife finds a batch by product ID, restock date, and shelf life
func (r *BatchRepository) FindBatchByDateAndShelfLife(produkID int, date string, masaSimpanHari int) (*models.Batch, error) {
	query := `
		SELECT id, produk_id, qty, qty_tersisa, tanggal_restok,
		       masa_simpan_hari, tanggal_kadaluarsa, status,
		       supplier, keterangan, created_at, updated_at
		FROM batch
		WHERE produk_id = ?
		  AND DATE(tanggal_restok) = DATE(?)
		  AND masa_simpan_hari = ?
		  AND qty_tersisa > 0
		ORDER BY created_at DESC
		LIMIT 1
	`

	batch := &models.Batch{}
	err := r.db.QueryRow(query, produkID, date, masaSimpanHari).Scan(
		&batch.ID,
		&batch.ProdukID,
		&batch.Qty,
		&batch.QtyTersisa,
		&batch.TanggalRestok,
		&batch.MasaSimpanHari,
		&batch.TanggalKadaluarsa,
		&batch.Status,
		&batch.Supplier,
		&batch.Keterangan,
		&batch.CreatedAt,
		&batch.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil // No batch found
	}

	if err != nil {
		return nil, fmt.Errorf("failed to find batch: %w", err)
	}

	return batch, nil
}

// UpdateBatch updates an existing batch
func (r *BatchRepository) UpdateBatch(batch *models.Batch) error {
	query := `
		UPDATE batch
		SET qty = ?,
		    qty_tersisa = ?,
		    supplier = ?,
		    keterangan = ?,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	result, err := r.db.Exec(
		query,
		batch.Qty,
		batch.QtyTersisa,
		batch.Supplier,
		batch.Keterangan,
		batch.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update batch: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("batch not found")
	}

	return nil
}

// UpdateBatchShelfLifeForProduct updates masa_simpan_hari and recalculates tanggal_kadaluarsa
// for all batches of a specific product
func (r *BatchRepository) UpdateBatchShelfLifeForProduct(produkID int, newMasaSimpanHari int) error {
	// SQL to update all batches for this product:
	// 1. Update masa_simpan_hari to new value
	// 2. Recalculate tanggal_kadaluarsa = tanggal_restok + new masa_simpan_hari

	var query string
	if database.IsPostgreSQL() {
		// PostgreSQL syntax - use helper function for reliable detection
		query = `
			UPDATE batch
			SET masa_simpan_hari = $1,
			    tanggal_kadaluarsa = tanggal_restok + ($2 || ' days')::INTERVAL,
			    updated_at = CURRENT_TIMESTAMP
			WHERE produk_id = $3 AND qty_tersisa > 0
		`
	} else {
		// SQLite syntax
		query = `
			UPDATE batch
			SET masa_simpan_hari = ?,
			    tanggal_kadaluarsa = datetime(tanggal_restok, '+' || ? || ' days'),
			    updated_at = CURRENT_TIMESTAMP
			WHERE produk_id = ? AND qty_tersisa > 0
		`
	}

	result, err := r.db.Exec(query, newMasaSimpanHari, newMasaSimpanHari, produkID)
	if err != nil {
		return fmt.Errorf("failed to update batch shelf life: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	fmt.Printf("[BATCH UPDATE] Updated %d batches for product %d with new shelf life %d days\n",
		rowsAffected, produkID, newMasaSimpanHari)

	return nil
}
