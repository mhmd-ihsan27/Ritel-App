package service

import (
	"fmt"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"time"
)

// ReturnService handles business logic for returns
type ReturnService struct {
	returnRepo     *repository.ReturnRepository
	transaksiRepo  *repository.TransaksiRepository
	produkService  *ProdukService
	pelangganRepo  *repository.PelangganRepository
}

// NewReturnService creates a new instance
func NewReturnService() *ReturnService {
	return &ReturnService{
		returnRepo:    repository.NewReturnRepository(),
		transaksiRepo: repository.NewTransaksiRepository(),
		produkService: NewProdukService(),
		pelangganRepo: repository.NewPelangganRepository(),
	}
}

// CreateReturn creates a new return transaction with complete business logic
func (s *ReturnService) CreateReturn(req *models.CreateReturnRequest) error {
	// Validate required fields
	if req.TransaksiID == 0 && req.NoTransaksi == "" {
		return fmt.Errorf("transaksi ID or number is required")
	}

	if len(req.Products) == 0 {
		return fmt.Errorf("at least one product is required")
	}

	if req.Reason == "" {
		return fmt.Errorf("return reason is required")
	}

	if req.Type != "refund" && req.Type != "exchange" {
		return fmt.Errorf("return type must be 'refund' or 'exchange'")
	}

	if req.Type == "exchange" && req.ReplacementProductID == 0 {
		return fmt.Errorf("replacement product is required for exchange")
	}

	// Get original transaction
	var transaksi *models.TransaksiDetail
	var err error
	if req.NoTransaksi != "" {
		transaksi, err = s.transaksiRepo.GetByNomorTransaksi(req.NoTransaksi)
	} else {
		transaksi, err = s.transaksiRepo.GetByID(req.TransaksiID)
	}
	if err != nil {
		return fmt.Errorf("failed to get transaction: %w", err)
	}
	if transaksi == nil {
		return fmt.Errorf("transaction not found")
	}

	// Set TransaksiID if not provided
	if req.TransaksiID == 0 {
		req.TransaksiID = transaksi.Transaksi.ID
	}
	if req.NoTransaksi == "" {
		req.NoTransaksi = transaksi.Transaksi.NomorTransaksi
	}

	// Validate return window (max 30 days)
	returnWindowDays := 30
	transaksiDate := transaksi.Transaksi.Tanggal
	daysSinceTransaction := int(time.Since(transaksiDate).Hours() / 24)
	if daysSinceTransaction > returnWindowDays {
		return fmt.Errorf("return window exceeded (max %d days from transaction date)", returnWindowDays)
	}

	// Validate products and quantities
	for _, returnProduct := range req.Products {
		if returnProduct.Quantity <= 0 {
			return fmt.Errorf("product quantity must be greater than 0")
		}

		// Find product in original transaction
		found := false
		for _, item := range transaksi.Items {
			if item.ProdukID != nil && *item.ProdukID == returnProduct.ProductID {
				// Check if return quantity exceeds purchased quantity
				alreadyReturned, err := s.returnRepo.GetReturnedQuantity(req.TransaksiID, returnProduct.ProductID)
				if err != nil {
					return fmt.Errorf("failed to check returned quantity: %w", err)
				}

				availableToReturn := item.Jumlah - alreadyReturned
				if returnProduct.Quantity > availableToReturn {
					return fmt.Errorf("cannot return %d units of product (purchased: %d, already returned: %d, available: %d)",
						returnProduct.Quantity, item.Jumlah, alreadyReturned, availableToReturn)
				}
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("product ID %d was not in the original transaction", returnProduct.ProductID)
		}
	}

	// Validate replacement product for exchange
	if req.Type == "exchange" {
		replacementProduct, err := s.produkService.produkRepo.GetByID(req.ReplacementProductID)
		if err != nil {
			return fmt.Errorf("failed to get replacement product: %w", err)
		}
		if replacementProduct == nil {
			return fmt.Errorf("replacement product not found")
		}

		// Calculate total return quantity
		totalReturnQty := 0
		for _, p := range req.Products {
			totalReturnQty += p.Quantity
		}

		// Check if replacement product has sufficient stock
		if replacementProduct.Stok < float64(totalReturnQty) {
			return fmt.Errorf("insufficient stock for replacement product (available: %.2f, needed: %d)",
				replacementProduct.Stok, totalReturnQty)
		}
	}

	// Calculate refund amount
	refundAmount, err := s.CalculateRefundAmount(transaksi, req.Products)
	if err != nil {
		return fmt.Errorf("failed to calculate refund amount: %w", err)
	}

	// Parse return date
	returnDate, err := time.Parse(time.RFC3339, req.ReturnDate)
	if err != nil {
		returnDate = time.Now()
	}

	// Create return transaction
	returnData := &models.Return{
		TransaksiID:          req.TransaksiID,
		NoTransaksi:          req.NoTransaksi,
		ReturnDate:           returnDate,
		Reason:               req.Reason,
		Type:                 req.Type,
		ReplacementProductID: req.ReplacementProductID,
		RefundAmount:         refundAmount,
		RefundMethod:         req.RefundMethod,
		RefundStatus:         "pending",
		Notes:                req.Notes,
	}

	if err := s.returnRepo.Create(returnData); err != nil {
		return fmt.Errorf("failed to create return: %w", err)
	}

	// Create return items and process stock changes
	for _, product := range req.Products {
		item := &models.ReturnItem{
			ReturnID:  returnData.ID,
			ProductID: product.ProductID,
			Quantity:  product.Quantity,
		}

		if err := s.returnRepo.CreateReturnItem(item); err != nil {
			return fmt.Errorf("failed to create return item: %w", err)
		}

		// Restore stock if not damaged
		if req.Reason != "damaged" {
			stockReq := &models.UpdateStokRequest{
				ProdukID:   product.ProductID,
				Perubahan:  float64(product.Quantity), // Positive = increase
				Jenis:      "return",
				Keterangan: fmt.Sprintf("Return dari transaksi %s - alasan: %s", req.NoTransaksi, req.Reason),
			}
			if err := s.produkService.UpdateStokIncrement(stockReq); err != nil {
				return fmt.Errorf("failed to restore stock: %w", err)
			}
		} else {
			// For damaged goods, still record in history but don't restore sellable stock
			stockReq := &models.UpdateStokRequest{
				ProdukID:   product.ProductID,
				Perubahan:  0, // No stock change
				Jenis:      "return_damaged",
				Keterangan: fmt.Sprintf("Return barang rusak dari transaksi %s (stok tidak dikembalikan)", req.NoTransaksi),
			}
			// Create history entry without changing stock
			produk, _ := s.produkService.produkRepo.GetByID(product.ProductID)
			if produk != nil {
				history := &models.StokHistory{
					ProdukID:       product.ProductID,
					StokSebelum:    produk.Stok,
					StokSesudah:    produk.Stok,
					Perubahan:      0,
					JenisPerubahan: "return_damaged",
					Keterangan:     stockReq.Keterangan,
					CreatedAt:      time.Now(),
				}
				s.produkService.produkRepo.CreateStokHistory(history)
			}
		}
	}

	// For exchange type, deduct stock for replacement product
	if req.Type == "exchange" && req.ReplacementProductID > 0 {
		totalReturnQty := 0
		for _, p := range req.Products {
			totalReturnQty += p.Quantity
		}

		stockReq := &models.UpdateStokRequest{
			ProdukID:   req.ReplacementProductID,
			Perubahan:  -float64(totalReturnQty), // Negative = decrease
			Jenis:      "exchange",
			Keterangan: fmt.Sprintf("Tukar barang untuk return %s", req.NoTransaksi),
		}
		if err := s.produkService.UpdateStokIncrement(stockReq); err != nil {
			return fmt.Errorf("failed to deduct replacement product stock: %w", err)
		}
	}

	// Update transaction status
	newStatus := s.calculateTransactionStatus(transaksi, req.TransaksiID)
	if err := s.returnRepo.UpdateTransactionStatus(req.TransaksiID, newStatus); err != nil {
		return fmt.Errorf("failed to update transaction status: %w", err)
	}

	// Adjust customer points if customer exists
	if transaksi.Transaksi.PelangganID > 0 {
		if err := s.adjustCustomerPoints(transaksi, refundAmount); err != nil {
			// Log error but don't fail the return
			fmt.Printf("Warning: failed to adjust customer points: %v\n", err)
		}
	}

	// Mark refund as completed if method is provided
	if req.RefundMethod != "" {
		if err := s.returnRepo.UpdateRefundStatus(returnData.ID, "completed"); err != nil {
			fmt.Printf("Warning: failed to update refund status: %v\n", err)
		}
	}

	return nil
}

// CalculateRefundAmount calculates the refund amount for returned products
// UPDATED: Menggunakan harga_beli (modal/HPP) bukan harga_jual
func (s *ReturnService) CalculateRefundAmount(transaksi *models.TransaksiDetail, returnProducts []models.ReturnProductRequest) (int, error) {
	if transaksi == nil || len(returnProducts) == 0 {
		return 0, fmt.Errorf("invalid transaction or products")
	}

	refundAmount := 0

	// Calculate refund based on cost price (harga_beli) instead of selling price
	for _, returnProduct := range returnProducts {
		for _, item := range transaksi.Items {
			if item.ProdukID != nil && *item.ProdukID == returnProduct.ProductID {
				// Get product to retrieve harga_beli (cost price)
				produk, err := s.produkService.produkRepo.GetByID(*item.ProdukID)
				if err != nil || produk == nil {
					// Fallback to selling price if product not found
					itemRefund := item.HargaSatuan * returnProduct.Quantity
					refundAmount += itemRefund
				} else {
					// Use harga_beli (cost price) for refund calculation
					// This ensures refund is based on modal, not profit margin
					if item.BeratGram > 0 {
						// Barang curah: refund = (berat_gram / 1000) * harga_beli_per_kg
						itemRefund := int((item.BeratGram / 1000.0) * float64(produk.HargaBeli))
						refundAmount += itemRefund
					} else {
						// Barang satuan: refund = jumlah * harga_beli
						itemRefund := returnProduct.Quantity * produk.HargaBeli
						refundAmount += itemRefund
					}
				}
				break
			}
		}
	}

	// Do NOT apply discounts for refund - refund is based on cost price
	// Customer gets back the modal/cost, not the discounted selling price

	// Ensure refund amount is not negative
	if refundAmount < 0 {
		refundAmount = 0
	}

	return refundAmount, nil
}

// calculateTransactionStatus determines the new status of the transaction after return
func (s *ReturnService) calculateTransactionStatus(transaksi *models.TransaksiDetail, transaksiID int) string {
	// Get all returned items for this transaction
	returnedItems, err := s.returnRepo.GetAllReturnedItemsByTransaksi(transaksiID)
	if err != nil {
		return transaksi.Transaksi.Status // Keep current status on error
	}

	// Count total purchased vs returned quantities
	allReturned := true
	hasReturns := false

	for _, item := range transaksi.Items {
		returnedQty := 0
		for _, returnedItem := range returnedItems {
			if item.ProdukID != nil && returnedItem.ProductID == *item.ProdukID {
				returnedQty += returnedItem.Quantity
				hasReturns = true
			}
		}

		// If any item is not fully returned, it's partial
		if returnedQty < item.Jumlah {
			allReturned = false
		}
	}

	if !hasReturns {
		return "selesai"
	} else if allReturned {
		return "fully_returned"
	} else {
		return "partial_return"
	}
}

// adjustCustomerPoints adjusts customer points based on return amount
func (s *ReturnService) adjustCustomerPoints(transaksi *models.TransaksiDetail, refundAmount int) error {
	if transaksi.Transaksi.PelangganID == 0 {
		return nil // No customer to adjust
	}

	pelanggan, err := s.pelangganRepo.GetByID(transaksi.Transaksi.PelangganID)
	if err != nil {
		return fmt.Errorf("failed to get customer: %w", err)
	}
	if pelanggan == nil {
		return fmt.Errorf("customer not found")
	}

	// Calculate points to deduct (proportional to refund amount)
	// Assuming original transaction earned points based on total spent
	if transaksi.Transaksi.Total > 0 {
		// Get point earning rate (example: 1 point per 25000 spent)
		// This should match your point earning logic
		pointsToDeduct := int(float64(refundAmount) / 25000.0) // Adjust based on your point system

		if pointsToDeduct > pelanggan.Poin {
			pointsToDeduct = pelanggan.Poin // Don't deduct more than available
		}

		// Update customer points and total spending
		newPoints := pelanggan.Poin - pointsToDeduct
		newTotalSpending := pelanggan.TotalBelanja - refundAmount
		if newTotalSpending < 0 {
			newTotalSpending = 0
		}

		// Update customer record
		if err := s.pelangganRepo.UpdatePointsAndSpending(pelanggan.ID, newPoints, newTotalSpending); err != nil {
			return fmt.Errorf("failed to update customer points: %w", err)
		}
	}

	return nil
}

// GetAllReturn retrieves all returns with their products
func (s *ReturnService) GetAllReturn() ([]*models.ReturnDetail, error) {
	returns, err := s.returnRepo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("failed to get returns: %w", err)
	}

	var returnDetails []*models.ReturnDetail
	for _, ret := range returns {
		products, err := s.returnRepo.GetReturnItemsByReturnID(ret.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get return items: %w", err)
		}

		returnDetails = append(returnDetails, &models.ReturnDetail{
			Return:   ret,
			Products: products,
		})
	}

	return returnDetails, nil
}

// GetReturnByID retrieves a return by ID with its products
func (s *ReturnService) GetReturnByID(id int) (*models.ReturnDetail, error) {
	ret, err := s.returnRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get return: %w", err)
	}
	if ret == nil {
		return nil, fmt.Errorf("return not found")
	}

	products, err := s.returnRepo.GetReturnItemsByReturnID(ret.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get return items: %w", err)
	}

	return &models.ReturnDetail{
		Return:   ret,
		Products: products,
	}, nil
}
