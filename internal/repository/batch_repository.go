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
	// TanggalRestok is normalized to midnight, so this will give us the correct expiry date
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

	_, err := database.Exec(
		// use database.Exec for dialect translation
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
	err := database.QueryRow(query, id).Scan(
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

	rows, err := database.Query(query, produkID)
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
	log.Printf("[BATCH REPO] GetAllBatches called")

	query := `
		SELECT id, produk_id, qty, qty_tersisa, tanggal_restok,
		       masa_simpan_hari, tanggal_kadaluarsa, status,
		       supplier, keterangan, created_at, updated_at
		FROM batch
		ORDER BY tanggal_restok DESC, created_at DESC
	`

	log.Printf("[BATCH REPO] Executing query...")
	rows, err := database.Query(query)
	if err != nil {
		log.Printf("[BATCH REPO] ❌ ERROR: Query failed: %v", err)
		return nil, fmt.Errorf("failed to query expiring batches: %w", err)
	}
	defer rows.Close()

	log.Printf("[BATCH REPO] Query executed, scanning rows...")
	var batches []*models.Batch
	rowCount := 0
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
			log.Printf("[BATCH REPO] ❌ ERROR: Scan failed at row %d: %v", rowCount, err)
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		// Update status based on current date
		batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)
		batches = append(batches, batch)
		rowCount++
	}

	log.Printf("[BATCH REPO] ✅ GetAllBatches success - returned %d batches", len(batches))
	return batches, nil
}

// GetExpiringBatches retrieves batches that are expiring soon
// Uses each product's notification threshold (hari_pemberitahuan_kadaluarsa)
// to determine if a batch should be shown in the warning list
func (r *BatchRepository) GetExpiringBatches(daysThreshold int) ([]*models.Batch, error) {
	log.Printf("[BATCH REPO] GetExpiringBatches called with threshold: %d days", daysThreshold)

	// Use WIB timezone for consistent date calculation
	nowWIB := time.Now().UTC().Add(7 * time.Hour)
	todayStr := nowWIB.Format("2006-01-02")

	log.Printf("[BATCH REPO] Using WIB date: %s", todayStr)

	var query string

	// Use the reliable IsPostgreSQL() helper function
	log.Printf("[BATCH REPO] Database driver: CurrentDriver=%s, IsPostgreSQL=%v", database.CurrentDriver, database.IsPostgreSQL())

	// Check if using PostgreSQL or SQLite using the helper function
	if database.IsPostgreSQL() {
		// PostgreSQL syntax - use explicit ::date cast
		query = `
			SELECT
				b.id, b.produk_id, b.qty, b.qty_tersisa, b.tanggal_restok,
				b.masa_simpan_hari, b.tanggal_kadaluarsa, b.status,
				b.supplier, b.keterangan, b.created_at, b.updated_at,
				p.hari_pemberitahuan_kadaluarsa,
				p.nama as produk_nama,
				(b.tanggal_kadaluarsa::date - $1::date) as days_diff
			FROM batch b
			INNER JOIN produk p ON b.produk_id = p.id
			WHERE b.qty_tersisa > 0
			  AND (b.tanggal_kadaluarsa::date - $1::date) <= p.hari_pemberitahuan_kadaluarsa
			ORDER BY b.tanggal_kadaluarsa ASC
		`
	} else {
		// SQLite syntax - use manual date diff with WIB date
		query = `
			SELECT
				b.id, b.produk_id, b.qty, b.qty_tersisa, b.tanggal_restok,
				b.masa_simpan_hari, b.tanggal_kadaluarsa, b.status,
				b.supplier, b.keterangan, b.created_at, b.updated_at,
				p.hari_pemberitahuan_kadaluarsa,
				p.nama as produk_nama,
				CAST(julianday(DATE(b.tanggal_kadaluarsa)) - julianday(DATE(?)) AS INTEGER) as days_diff
			FROM batch b
			INNER JOIN produk p ON b.produk_id = p.id
			WHERE b.qty_tersisa > 0
			  AND julianday(DATE(b.tanggal_kadaluarsa)) - julianday(DATE(?)) <= p.hari_pemberitahuan_kadaluarsa
			ORDER BY b.tanggal_kadaluarsa ASC
		`
	}

	log.Printf("[BATCH REPO] Executing query with WIB date: %s", todayStr)

	var rows *sql.Rows
	var err error

	if database.IsPostgreSQL() {
		rows, err = database.Query(query, todayStr)
	} else {
		rows, err = database.Query(query, todayStr, todayStr, todayStr)
	}

	if err != nil {
		log.Printf("[BATCH REPO] ❌ Query failed: %v", err)
		return nil, fmt.Errorf("failed to query expiring batches: %w", err)
	}
	defer rows.Close()

	log.Printf("[BATCH REPO] Scanning rows...")
	var batches []*models.Batch
	rowCount := 0

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
			log.Printf("[BATCH REPO] ❌ Scan failed at row %d: %v", rowCount, err)
			return nil, fmt.Errorf("failed to scan batch: %w", err)
		}

		// Update status based on current date (WIB)
		batch.Status = r.calculateBatchStatus(batch.TanggalKadaluarsa)
		batches = append(batches, batch)
		rowCount++
	}

	log.Printf("[BATCH REPO] ✅ GetExpiringBatches success - returned %d batches", len(batches))
	return batches, nil
}

// UpdateBatchQty updates the remaining quantity of a batch (used during sales)
func (r *BatchRepository) UpdateBatchQty(batchID string, qtyReduction float64) error {
	query := `
		UPDATE batch
		SET qty_tersisa = qty_tersisa - ?
		WHERE id = ? AND qty_tersisa >= ?
	`

	result, err := database.Exec(query, qtyReduction, batchID, qtyReduction)
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

// UpdateBatchQtyTx updates batch quantity within a transaction (avoids connection leak)
func (r *BatchRepository) UpdateBatchQtyTx(tx *sql.Tx, batchID string, qtyReduction float64) error {
	query := `
		UPDATE batch
		SET qty_tersisa = qty_tersisa - ?
		WHERE id = ? AND qty_tersisa >= ?
	`
	query = database.TranslateQuery(query)

	result, err := tx.Exec(query, qtyReduction, batchID, qtyReduction)
	if err != nil {
		return fmt.Errorf("failed to update batch qty in transaction: %w", err)
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

// RestoreQty restores quantity to a batch (used for returns)
func (r *BatchRepository) RestoreQty(batchID string, qty float64) error {
	query := `
		UPDATE batch
		SET qty_tersisa = qty_tersisa + ?,
		    updated_at = ?
		WHERE id = ?`

	query = database.TranslateQuery(query)

	_, err := database.Exec(query, qty, time.Now(), batchID)
	if err != nil {
		return fmt.Errorf("failed to restore qty to batch: %w", err)
	}

	log.Printf("[BATCH] Restored %.2f qty to batch %s", qty, batchID)
	return nil
}

// UpdateBatchStatus updates the status of a batch
func (r *BatchRepository) UpdateBatchStatus(batchID string, status string) error {
	query := `UPDATE batch SET status = ? WHERE id = ?`

	_, err := database.Exec(query, status, batchID)
	if err != nil {
		return fmt.Errorf("failed to update batch status: %w", err)
	}

	return nil
}

// DeleteBatch deletes a batch (soft delete by setting qty_tersisa to 0)
func (r *BatchRepository) DeleteBatch(batchID string) error {
	query := `UPDATE batch SET qty_tersisa = 0, status = 'expired' WHERE id = ?`

	_, err := database.Exec(query, batchID)
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
// Uses WIB timezone (UTC+7) for consistency with transaction timestamps
func (r *BatchRepository) calculateBatchStatus(expiryDate time.Time) string {
	// Use WIB timezone (UTC+7) - consistent with transaction creation
	now := time.Now().UTC().Add(7 * time.Hour)
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
	var query string
	if database.IsPostgreSQL() {
		query = `
			SELECT id, produk_id, qty, qty_tersisa, tanggal_restok,
			       masa_simpan_hari, tanggal_kadaluarsa, status,
			       supplier, keterangan, created_at, updated_at
			FROM batch
			WHERE produk_id = $1
			  AND tanggal_restok::date = $2::date
			  AND masa_simpan_hari = $3
			  AND qty_tersisa > 0
			ORDER BY created_at DESC
			LIMIT 1
		`
	} else {
		query = `
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
	}

	batch := &models.Batch{}
	err := database.QueryRow(query, produkID, date, masaSimpanHari).Scan(
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

	result, err := database.Exec(
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

	result, err := database.Exec(query, newMasaSimpanHari, newMasaSimpanHari, produkID)
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
