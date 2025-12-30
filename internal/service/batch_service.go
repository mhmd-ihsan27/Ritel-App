package service

import (
	"fmt"
	"time"

	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

// BatchService handles business logic for batch operations
type BatchService struct {
	batchRepo  *repository.BatchRepository
	produkRepo *repository.ProdukRepository
}

// NewBatchService creates a new batch service
func NewBatchService() *BatchService {
	return &BatchService{
		batchRepo:  repository.NewBatchRepository(),
		produkRepo: repository.NewProdukRepository(),
	}
}

// CreateInitialBatch creates a batch for a newly created product
// Used when creating products with initial stock
func (s *BatchService) CreateInitialBatch(produkID int, qty float64, masaSimpanHari int, produkNama string) (*models.Batch, error) {
	if produkID <= 0 {
		return nil, fmt.Errorf("invalid product ID")
	}
	if qty <= 0 {
		return nil, fmt.Errorf("quantity must be positive")
	}
	if masaSimpanHari <= 0 {
		return nil, fmt.Errorf("shelf life must be positive")
	}

	now := time.Now()

	// Create initial batch
	batch := &models.Batch{
		ProdukID:       produkID,
		Qty:            qty,
		QtyTersisa:     qty,
		TanggalRestok:  now,
		MasaSimpanHari: masaSimpanHari,
		Supplier:       "Initial Stock",
		Keterangan:     fmt.Sprintf("Batch awal saat membuat produk '%s'", produkNama),
	}

	// Save batch
	err := s.batchRepo.CreateBatch(batch)
	if err != nil {
		return nil, fmt.Errorf("failed to create initial batch: %w", err)
	}

	return batch, nil
}

// CreateBatchFromRestok creates a new batch when restocking a product
// If a batch with the same product, date, and shelf life exists, merge into it
func (s *BatchService) CreateBatchFromRestok(req *models.UpdateStokRequest) (*models.Batch, error) {
	// Validate
	if req.ProdukID <= 0 {
		return nil, fmt.Errorf("invalid product ID")
	}
	if req.Perubahan <= 0 {
		return nil, fmt.Errorf("quantity must be positive")
	}
	if req.MasaSimpanHari <= 0 {
		return nil, fmt.Errorf("shelf life must be positive")
	}

	// Get product to verify it exists
	produk, err := s.produkRepo.GetByID(req.ProdukID)
	if err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	// Check if there's an existing batch from today with the same shelf life
	today := time.Now().Format("2006-01-02")
	existingBatch, err := s.batchRepo.FindBatchByDateAndShelfLife(req.ProdukID, today, req.MasaSimpanHari)
	if err == nil && existingBatch != nil {
		// Merge into existing batch
		existingBatch.Qty += req.Perubahan
		existingBatch.QtyTersisa += req.Perubahan

		// Update the batch
		err = s.batchRepo.UpdateBatch(existingBatch)
		if err != nil {
			return nil, fmt.Errorf("failed to update existing batch: %w", err)
		}

		return existingBatch, nil
	}

	// Create new batch if no matching batch found
	batch := &models.Batch{
		ProdukID:       produk.ID,
		Qty:            req.Perubahan,
		QtyTersisa:     req.Perubahan,
		TanggalRestok:  time.Now(),
		MasaSimpanHari: req.MasaSimpanHari,
		Supplier:       req.Supplier,
		Keterangan:     req.Keterangan,
	}

	// Save batch
	err = s.batchRepo.CreateBatch(batch)
	if err != nil {
		return nil, fmt.Errorf("failed to create batch: %w", err)
	}

	return batch, nil
}

// GetBatchesByProduk retrieves all batches for a product (FIFO order)
// and recalculates status based on product's hariPemberitahuanKadaluarsa
func (s *BatchService) GetBatchesByProduk(produkID int) ([]*models.Batch, error) {
	// Get batches from repository
	batches, err := s.batchRepo.GetBatchesByProdukID(produkID)
	if err != nil {
		return nil, err
	}

	// Get product to access hariPemberitahuanKadaluarsa
	produk, err := s.produkRepo.GetByID(produkID)
	if err != nil {
		// If product not found, return batches with default status calculation
		return batches, nil
	}

	// Recalculate status for each batch based on product's notification days
	notificationDays := produk.HariPemberitahuanKadaluarsa
	if notificationDays <= 0 {
		notificationDays = 30 // Default to 30 days if not set
	}

	for _, batch := range batches {
		batch.Status = s.calculateBatchStatus(batch.TanggalKadaluarsa, notificationDays)
	}

	return batches, nil
}

// GetBatchByID retrieves a specific batch
func (s *BatchService) GetBatchByID(batchID string) (*models.Batch, error) {
	return s.batchRepo.GetBatchByID(batchID)
}

// GetAllBatches retrieves all batches
func (s *BatchService) GetAllBatches() ([]*models.Batch, error) {
	return s.batchRepo.GetAllBatches()
}

// GetExpiringBatches retrieves batches expiring within threshold days
// Repository query already filters correctly using per-product notification days
// This service just recalculates status for display
func (s *BatchService) GetExpiringBatches(daysThreshold int) ([]*models.Batch, error) {
	// Repository query already filters based on product's hari_pemberitahuan_kadaluarsa
	// So we just need to get the batches and recalculate their status for display
	batches, err := s.batchRepo.GetExpiringBatches(daysThreshold)
	if err != nil {
		fmt.Printf("[BATCH SERVICE] Error getting expiring batches: %v\n", err)
		return nil, fmt.Errorf("failed to get expiring batches: %w", err)
	}

	// Recalculate status for each batch based on product's notification days
	for _, batch := range batches {
		produk, err := s.produkRepo.GetByID(batch.ProdukID)
		if err != nil {
			// If product not found, skip recalculation
			continue
		}

		notificationDays := produk.HariPemberitahuanKadaluarsa
		if notificationDays <= 0 {
			notificationDays = 30 // Default to 30 days if not set
		}

		// Recalculate status based on product's notification threshold
		batch.Status = s.calculateBatchStatus(batch.TanggalKadaluarsa, notificationDays)
	}

	// Return ALL batches from repository - no additional filtering
	// Repository SQL query already filtered correctly
	return batches, nil
}

// ReduceBatchQtyFIFO reduces stock from batches using FIFO method
// Returns list of batch IDs that were affected
func (s *BatchService) ReduceBatchQtyFIFO(produkID int, qtyToReduce float64) ([]string, error) {
	// Get all available batches for this product (ordered by FIFO)
	batches, err := s.batchRepo.GetBatchesByProdukID(produkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get batches: %w", err)
	}

	if len(batches) == 0 {
		return nil, fmt.Errorf("no batches available for this product")
	}

	// Calculate total available stock
	var totalAvailable float64 = 0
	for _, batch := range batches {
		totalAvailable += batch.QtyTersisa
	}

	if totalAvailable < qtyToReduce {
		return nil, fmt.Errorf("insufficient stock: need %.2f, available %.2f", qtyToReduce, totalAvailable)
	}

	// Reduce from batches using FIFO
	remainingToReduce := qtyToReduce
	affectedBatchIDs := []string{}

	for _, batch := range batches {
		if remainingToReduce <= 0 {
			break
		}

		// Determine how much to take from this batch
		qtyFromThisBatch := remainingToReduce
		if qtyFromThisBatch > batch.QtyTersisa {
			qtyFromThisBatch = batch.QtyTersisa
		}

		// Update batch quantity
		err := s.batchRepo.UpdateBatchQty(batch.ID, qtyFromThisBatch)
		if err != nil {
			return nil, fmt.Errorf("failed to update batch %s: %w", batch.ID, err)
		}

		affectedBatchIDs = append(affectedBatchIDs, batch.ID)
		remainingToReduce -= qtyFromThisBatch
	}

	return affectedBatchIDs, nil
}

// DeleteExpiredBatch marks a batch as expired and sets qty to 0
func (s *BatchService) DeleteExpiredBatch(batchID string) error {
	return s.batchRepo.DeleteBatch(batchID)
}

// UpdateBatchStatuses updates status for all batches
func (s *BatchService) UpdateBatchStatuses() error {
	return s.batchRepo.UpdateAllBatchStatuses()
}

// GetBatchSummaryByProduk returns summary of batches for a product
func (s *BatchService) GetBatchSummaryByProduk(produkID int) (map[string]interface{}, error) {
	batches, err := s.batchRepo.GetBatchesByProdukID(produkID)
	if err != nil {
		return nil, err
	}

	summary := map[string]interface{}{
		"total_batches":      len(batches),
		"total_qty":          0,
		"fresh_batches":      0,
		"expiring_batches":   0,
		"expired_batches":    0,
		"oldest_batch_date":  nil,
		"newest_batch_date":  nil,
	}

	if len(batches) == 0 {
		return summary, nil
	}

	var totalQty float64 = 0
	freshCount := 0
	expiringCount := 0
	expiredCount := 0

	for _, batch := range batches {
		totalQty += batch.QtyTersisa

		switch batch.Status {
		case "fresh":
			freshCount++
		case "hampir_expired":
			expiringCount++
		case "expired":
			expiredCount++
		}
	}

	summary["total_qty"] = totalQty
	summary["fresh_batches"] = freshCount
	summary["expiring_batches"] = expiringCount
	summary["expired_batches"] = expiredCount
	summary["oldest_batch_date"] = batches[0].TanggalRestok
	summary["newest_batch_date"] = batches[len(batches)-1].TanggalRestok

	return summary, nil
}

// DeductFromBatches deducts quantity from batches using FIFO method
// This is called when manually reducing stock
func (s *BatchService) DeductFromBatches(produkID int, qtyToDeduct float64) error {
	_, err := s.ReduceBatchQtyFIFO(produkID, qtyToDeduct)
	return err
}

// calculateBatchStatus determines batch status based on expiry date and notification threshold
// notificationDays: how many days before expiry to consider "hampir_expired"
// Uses date comparison (ignoring time) for consistency with SQL julianday calculation
func (s *BatchService) calculateBatchStatus(expiryDate time.Time, notificationDays int) string {
	now := time.Now()

	// Normalize to start of day for consistent date comparison (like SQL DATE())
	nowDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	expiryDateNormalized := time.Date(expiryDate.Year(), expiryDate.Month(), expiryDate.Day(), 0, 0, 0, 0, expiryDate.Location())

	// Calculate difference in days (should be exact multiple of 24 hours since normalized to midnight)
	diffHours := expiryDateNormalized.Sub(nowDate).Hours()
	daysUntilExpiry := int(diffHours / 24)

	if daysUntilExpiry < 0 {
		return "expired"
	} else if daysUntilExpiry <= notificationDays {
		return "hampir_expired"
	}
	return "fresh"
}

// UpdateBatchShelfLifeForProduct updates shelf life for all batches of a product
// This is called when a product's masa_simpan_hari is changed
func (s *BatchService) UpdateBatchShelfLifeForProduct(produkID int, newMasaSimpanHari int) error {
	return s.batchRepo.UpdateBatchShelfLifeForProduct(produkID, newMasaSimpanHari)
}
