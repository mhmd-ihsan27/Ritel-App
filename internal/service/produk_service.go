package service

import (
	"fmt"
	"log"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"strings"
	"time"
)

// ProdukService handles business logic for products
type ProdukService struct {
	produkRepo    *repository.ProdukRepository
	keranjangRepo *repository.KeranjangRepository
	batchService  *BatchService
}

// NewProdukService creates a new instance
func NewProdukService() *ProdukService {
	return &ProdukService{
		produkRepo:    repository.NewProdukRepository(),
		keranjangRepo: repository.NewKeranjangRepository(),
		batchService:  NewBatchService(),
	}
}

// CreateProduk creates a new product with validation
func (s *ProdukService) CreateProduk(produk *models.Produk) error {
	// Validate required fields
	if strings.TrimSpace(produk.SKU) == "" {
		return fmt.Errorf("SKU is required")
	}
	if strings.TrimSpace(produk.Nama) == "" {
		return fmt.Errorf("product name is required")
	}
	if produk.HargaJual <= 0 {
		return fmt.Errorf("selling price must be greater than 0")
	}

	// Validate that notification days does not exceed shelf life
	if produk.HariPemberitahuanKadaluarsa > produk.MasaSimpanHari {
		return fmt.Errorf("hari pemberitahuan (%d hari) tidak boleh melebihi masa simpan (%d hari)", produk.HariPemberitahuanKadaluarsa, produk.MasaSimpanHari)
	}

	// Check if SKU already exists
	existing, err := s.produkRepo.GetBySKU(produk.SKU)
	if err != nil {
		return fmt.Errorf("failed to check existing SKU: %w", err)
	}
	if existing != nil {
		return fmt.Errorf("SKU already exists")
	}

	// Check if barcode already exists (if provided)
	if strings.TrimSpace(produk.Barcode) != "" {
		existing, err := s.produkRepo.GetByBarcode(produk.Barcode)
		if err != nil {
			return fmt.Errorf("failed to check existing barcode: %w", err)
		}
		if existing != nil {
			return fmt.Errorf("barcode already exists")
		}
	}

	// Set timestamps
	now := time.Now()
	produk.CreatedAt = now
	produk.UpdatedAt = now

	// Create product
	if err := s.produkRepo.Create(produk); err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}

	// AUTO-CREATE INITIAL BATCH if product has initial stock and shelf life
	// This ensures batch warning works immediately for new products
	if produk.Stok > 0 && produk.MasaSimpanHari > 0 {
		log.Printf("[CREATE PRODUK] Auto-creating initial batch for '%s': stok=%.2f, masa_simpan=%d days",
			produk.Nama, produk.Stok, produk.MasaSimpanHari)

		// Create batch using batch service
		batch, err := s.batchService.CreateInitialBatch(produk.ID, produk.Stok, produk.MasaSimpanHari, produk.Nama)
		if err != nil {
			// Log error but don't fail product creation
			log.Printf("[CREATE PRODUK] Warning: Failed to create initial batch: %v", err)
		} else {
			log.Printf("[CREATE PRODUK] Initial batch created successfully: %s (expires: %s)",
				batch.ID, batch.TanggalKadaluarsa.Format("2006-01-02"))
		}
	}

	return nil
}


// ScanBarcode scans a barcode and adds to cart
func (s *ProdukService) ScanBarcode(barcode string, jumlah int) (*models.ScanBarcodeResponse, error) {
	// Validate barcode
	if strings.TrimSpace(barcode) == "" {
		return &models.ScanBarcodeResponse{
			Success: false,
			Message: "Barcode cannot be empty",
		}, nil
	}

	// Validate quantity
	if jumlah <= 0 {
		jumlah = 1
	}

	// Find product by barcode
	produk, err := s.produkRepo.GetByBarcode(barcode)
	if err != nil {
		return nil, fmt.Errorf("failed to find product: %w", err)
	}

	if produk == nil {
		return &models.ScanBarcodeResponse{
			Success: false,
			Message: fmt.Sprintf("Product with barcode '%s' not found", barcode),
		}, nil
	}

	// Add to cart
	if err := s.keranjangRepo.AddItem(produk.ID, jumlah, produk.HargaBeli); err != nil {
		return nil, fmt.Errorf("failed to add to cart: %w", err)
	}

	// Get updated cart item
	cartItem, err := s.keranjangRepo.GetByProdukID(produk.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get cart item: %w", err)
	}

	return &models.ScanBarcodeResponse{
		Success: true,
		Message: fmt.Sprintf("Product '%s' added to cart", produk.Nama),
		Produk:  produk,
		Item: &models.KeranjangItem{
			ID:        cartItem.ID,
			Produk:    produk,
			Jumlah:    cartItem.Jumlah,
			HargaBeli: cartItem.HargaBeli,
			Subtotal:  cartItem.Subtotal,
			CreatedAt: cartItem.CreatedAt,
		},
	}, nil
}

// GetAllProduk retrieves all products
func (s *ProdukService) GetAllProduk() ([]*models.Produk, error) {
	return s.produkRepo.GetAll()
}

// GetKeranjang retrieves all cart items
func (s *ProdukService) GetKeranjang() ([]*models.KeranjangItem, error) {
	return s.keranjangRepo.GetAll()
}

 

// ProcessKeranjang processes cart items and updates stock
func (s *ProdukService) ProcessKeranjang() error {
	// Get all cart items
	items, err := s.keranjangRepo.GetAll()
	if err != nil {
		return fmt.Errorf("failed to get cart items: %w", err)
	}

	if len(items) == 0 {
		return fmt.Errorf("cart is empty")
	}

	// Update stock for each item
	for _, item := range items {
		newStok := item.Produk.Stok + float64(item.Jumlah)
		if err := s.produkRepo.UpdateStok(item.Produk.ID, newStok); err != nil {
			return fmt.Errorf("failed to update stock for product %s: %w", item.Produk.Nama, err)
		}
	}

	// Clear cart
	if err := s.keranjangRepo.Clear(); err != nil {
		return fmt.Errorf("failed to clear cart: %w", err)
	}

	return nil
}

// ClearKeranjang clears the cart
func (s *ProdukService) ClearKeranjang() error {
	return s.keranjangRepo.Clear()
}

// RemoveFromKeranjang removes an item from cart
func (s *ProdukService) RemoveFromKeranjang(id int) error {
	return s.keranjangRepo.DeleteItem(id)
}

// UpdateKeranjangJumlah updates quantity in cart
func (s *ProdukService) UpdateKeranjangJumlah(id int, jumlah int) error {
	if jumlah <= 0 {
		return fmt.Errorf("quantity must be greater than 0")
	}

	return s.keranjangRepo.UpdateJumlah(id, jumlah)
}

func (s *ProdukService) UpdateProduk(produk *models.Produk) error {
	 

	// Validate required fields
	if strings.TrimSpace(produk.SKU) == "" {
		return fmt.Errorf("SKU is required")
	}
	if strings.TrimSpace(produk.Nama) == "" {
		return fmt.Errorf("product name is required")
	}
	if produk.HargaJual <= 0 {
		return fmt.Errorf("selling price must be greater than 0")
	}

	// Validate that notification days does not exceed shelf life
	if produk.HariPemberitahuanKadaluarsa > produk.MasaSimpanHari {
		return fmt.Errorf("hari pemberitahuan (%d hari) tidak boleh melebihi masa simpan (%d hari)", produk.HariPemberitahuanKadaluarsa, produk.MasaSimpanHari)
	}

	// Check if product exists
	existing, err := s.produkRepo.GetByID(produk.ID)
	if err != nil {
		return fmt.Errorf("failed to check existing product: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("product not found")
	}

	// Check if SKU already exists (for other products)
	existingBySKU, err := s.produkRepo.GetBySKU(produk.SKU)
	if err != nil {
		return fmt.Errorf("failed to check existing SKU: %w", err)
	}
	if existingBySKU != nil && existingBySKU.ID != produk.ID {
		return fmt.Errorf("SKU already exists for another product")
	}

	// Check if barcode already exists (for other products)
	if strings.TrimSpace(produk.Barcode) != "" {
		existingByBarcode, err := s.produkRepo.GetByBarcode(produk.Barcode)
		if err != nil {
			return fmt.Errorf("failed to check existing barcode: %w", err)
		}
		if existingByBarcode != nil && existingByBarcode.ID != produk.ID {
			return fmt.Errorf("barcode already exists for another product")
		}
	}

	// Check if masa_simpan_hari has changed
	masaSimpanChanged := existing.MasaSimpanHari != produk.MasaSimpanHari

	// Update product
	if err := s.produkRepo.Update(produk); err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}

	// If masa_simpan_hari changed, update all batches for this product
	if masaSimpanChanged && produk.MasaSimpanHari > 0 {
		log.Printf("[UPDATE PRODUK] Masa simpan changed from %d to %d days for product %d (%s). Updating all batches...",
			existing.MasaSimpanHari, produk.MasaSimpanHari, produk.ID, produk.Nama)

		err := s.batchService.UpdateBatchShelfLifeForProduct(produk.ID, produk.MasaSimpanHari)
		if err != nil {
			// Log error but don't fail the product update
			log.Printf("[UPDATE PRODUK] Warning: Failed to update batches: %v", err)
		} else {
			log.Printf("[UPDATE PRODUK] Successfully updated all batches for product %d with new shelf life", produk.ID)
		}
	}

	return nil
}

func (s *ProdukService) DeleteProduk(id int) error {
	// Validate ID
	if id <= 0 {
		return fmt.Errorf("ID produk tidak valid")
	}

	// Check if product exists
	existing, err := s.produkRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("gagal memeriksa produk: %v", err)
	}
	if existing == nil {
		return fmt.Errorf("produk dengan ID %d tidak ditemukan", id)
	}

	// Log cascade delete information
	fmt.Printf("Deleting product '%s' (ID: %d) and all related data (batches, history, transaction items, cart items)...\n",
		existing.Nama, id)

	// Delete product and all related data (cascade delete)
	if err := s.produkRepo.Delete(id); err != nil {
		// Error message sudah dalam bahasa Indonesia dari repository
		return err
	}

	fmt.Printf("Product '%s' and all related data successfully deleted\n", existing.Nama)
	return nil
}


// UpdateStok updates product stock with history tracking
func (s *ProdukService) UpdateStok(req *models.UpdateStokRequest) error {
	// Validate
	if req.StokBaru < 0 {
		return fmt.Errorf("stock cannot be negative")
	}

	// Get current stock
	currentProduk, err := s.produkRepo.GetByID(req.ProdukID)
	if err != nil {
		return fmt.Errorf("failed to get product: %w", err)
	}
	if currentProduk == nil {
		return fmt.Errorf("product not found")
	}

	// Update stock
	if err := s.produkRepo.UpdateStok(req.ProdukID, req.StokBaru); err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}

	// Record history
	history := &models.StokHistory{
		ProdukID:       req.ProdukID,
		StokSebelum:    currentProduk.Stok,
		StokSesudah:    req.StokBaru,
		Perubahan:      req.StokBaru - currentProduk.Stok,
		JenisPerubahan: req.Jenis,
		Keterangan:     req.Keterangan,
		TipeKerugian:   req.TipeKerugian,
		NilaiKerugian:  req.NilaiKerugian,
		CreatedAt:      time.Now(),
	}

	if err := s.produkRepo.CreateStokHistory(history); err != nil {
		// Log error but don't fail the update
		log.Printf("Failed to record stock history: %v", err)
	}

	return nil
}

// UpdateStokIncrement updates stock by increment/decrement
func (s *ProdukService) UpdateStokIncrement(req *models.UpdateStokRequest) error {
	// Validate
	if req.Perubahan == 0 {
		return fmt.Errorf("perubahan stok tidak boleh 0")
	}

	// Get current product
	currentProduk, err := s.produkRepo.GetByID(req.ProdukID)
	if err != nil {
		return fmt.Errorf("failed to get product: %w", err)
	}
	if currentProduk == nil {
		return fmt.Errorf("product not found")
	}

	newStock := currentProduk.Stok + req.Perubahan
	if newStock < 0 {
		return fmt.Errorf("stok tidak boleh negatif")
	}

	// Update stock
	if err := s.produkRepo.UpdateStok(req.ProdukID, newStock); err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}

	// ===  BATCH SYSTEM: Handle batch updates ===
	if req.Perubahan > 0 && req.MasaSimpanHari > 0 {
		// POSITIVE CHANGE (Adding stock): Create new batch
		log.Printf("Creating batch for restock: produk=%d, qty=%.2f, shelf_life=%d days", req.ProdukID, req.Perubahan, req.MasaSimpanHari)

		batch, err := s.batchService.CreateBatchFromRestok(req)
		if err != nil {
			// Log error but don't fail the stock update
			log.Printf("Warning: Failed to create batch: %v", err)
		} else {
			log.Printf("Batch created successfully: %s", batch.ID)
		}
	} else if req.Perubahan < 0 {
		// NEGATIVE CHANGE (Reducing stock): Deduct from batches using FIFO
		qtyToDeduct := -req.Perubahan
		log.Printf("Reducing stock for produk=%d, qty=%.2f - deducting from batches (FIFO)", req.ProdukID, qtyToDeduct)

		err := s.batchService.DeductFromBatches(req.ProdukID, qtyToDeduct)
		if err != nil {
			// Log error but don't fail the stock update
			log.Printf("Warning: Failed to deduct from batches: %v", err)
		} else {
			log.Printf("Successfully deducted %.2f units from batches", qtyToDeduct)
		}
	}

	// Record history
	history := &models.StokHistory{
		ProdukID:       req.ProdukID,
		StokSebelum:    currentProduk.Stok,
		StokSesudah:    newStock,
		Perubahan:      req.Perubahan,
		JenisPerubahan: req.Jenis,
		Keterangan:     req.Keterangan,
		TipeKerugian:   req.TipeKerugian,
		NilaiKerugian:  req.NilaiKerugian,
		CreatedAt:      time.Now(),
	}

	if err := s.produkRepo.CreateStokHistory(history); err != nil {
		log.Printf("Failed to record stock history: %v", err)
	}

	return nil
}

// GetStokHistory retrieves stock change history for a product
func (s *ProdukService) GetStokHistory(produkID int) ([]*models.StokHistory, error) {
	return s.produkRepo.GetStokHistory(produkID)
}
