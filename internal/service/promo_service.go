package service

import (
	"fmt"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"strings"
	"time"
)

// PromoService handles business logic for promotions
type PromoService struct {
	promoRepo     *repository.PromoRepository
	pelangganRepo *repository.PelangganRepository
	produkRepo    *repository.ProdukRepository
}

// NewPromoService creates a new instance
func NewPromoService() *PromoService {
	return &PromoService{
		promoRepo:     repository.NewPromoRepository(),
		pelangganRepo: repository.NewPelangganRepository(),
		produkRepo:    repository.NewProdukRepository(),
	}
}

func (s *PromoService) CreatePromo(req *models.CreatePromoRequest) (*models.Promo, error) {
	// Validate required fields
	if strings.TrimSpace(req.Nama) == "" {
		return nil, fmt.Errorf("promo name is required")
	}

	// Validate promo type
	validPromoTypes := map[string]bool{
		"diskon_produk": true,
		"bundling":      true,
		"buy_x_get_y":   true,
	}
	if !validPromoTypes[req.TipePromo] {
		return nil, fmt.Errorf("promo type must be 'diskon_produk', 'bundling', or 'buy_x_get_y'")
	}

	// Check if kode already exists (if provided)
	if req.Kode != "" {
		existing, err := s.promoRepo.GetByKode(req.Kode)
		if err != nil {
			return nil, fmt.Errorf("failed to check existing promo: %w", err)
		}
		if existing != nil {
			return nil, fmt.Errorf("promo with code '%s' already exists", req.Kode)
		}
	}

	// Parse dates
	var tanggalMulai, tanggalSelesai time.Time
	var err error

	if req.TanggalMulai != "" {
		tanggalMulai, err = time.Parse("2006-01-02", req.TanggalMulai)
		if err != nil {
			return nil, fmt.Errorf("invalid start date format: %w", err)
		}
	}

	if req.TanggalSelesai != "" {
		tanggalSelesai, err = time.Parse("2006-01-02", req.TanggalSelesai)
		if err != nil {
			return nil, fmt.Errorf("invalid end date format: %w", err)
		}
	}

	// VALIDASI KHUSUS UNTUK DISKON_PRODUK
	if req.TipePromo == "diskon_produk" {
		// 1. WAJIB pilih tipe produk
		if req.TipeProduk == "" {
			return nil, fmt.Errorf("tipe produk harus dipilih untuk promo diskon produk (curah atau satuan)")
		}

		if req.TipeProduk != "curah" && req.TipeProduk != "satuan" {
			return nil, fmt.Errorf("tipe produk harus 'curah' atau 'satuan'")
		}

		// 2. Validasi minimal gramasi untuk curah
		if req.TipeProduk == "curah" {
			if req.MinGramasi <= 0 {
				return nil, fmt.Errorf("minimal gramasi harus lebih dari 0 untuk promo produk curah")
			}
			if len(req.ProdukIDs) == 0 {
				return nil, fmt.Errorf("pilih minimal 1 produk curah untuk promo ini")
			}
		}

		// 3. Validasi minimal quantity untuk satuan
		if req.TipeProduk == "satuan" {
			if req.MinQuantity <= 0 {
				return nil, fmt.Errorf("minimal quantity harus lebih dari 0 untuk promo produk satuan")
			}
			if len(req.ProdukIDs) == 0 {
				return nil, fmt.Errorf("pilih minimal 1 produk satuan untuk promo ini")
			}
		}
	}

	// Get product details for produkX and produkY (for Buy X Get Y)
	var produkXID, produkYID int
	if req.TipePromo == "buy_x_get_y" {
		produkX, err := s.produkRepo.GetByID(*req.ProdukX)
		if err != nil || produkX == nil {
			return nil, fmt.Errorf("product X not found")
		}
		// Validate produk X jenis_produk matches TipeProduk
		// if req.TipePromo == "buy_x_get_y" && produkX.Satuan == "kg" {
		// 	return nil, fmt.Errorf("produk X harus berupa produk satuan tetap (bukan curah) untuk promo Buy X Get Y")
		// }
		produkXID = produkX.ID
	}
	if req.ProdukY != nil {
		produkY, err := s.produkRepo.GetByID(*req.ProdukY)
		if err != nil || produkY == nil {
			return nil, fmt.Errorf("product Y not found")
		}
		// Validate produk Y jenis_produk matches TipeProduk
		// if req.TipePromo == "buy_x_get_y" && produkY.Satuan == "kg" {
		// 	return nil, fmt.Errorf("produk Y harus berupa produk satuan tetap (bukan curah) untuk promo Buy X Get Y")
		// }
		produkYID = produkY.ID
	}

	// Create promo model
	promo := &models.Promo{
		Nama:           req.Nama,
		Kode:           req.Kode,
		Tipe:           req.Tipe,
		TipePromo:      req.TipePromo,
		TipeProduk:     req.TipeProduk,
		MinGramasi:     req.MinGramasi,
		Nilai:          req.Nilai,
		MinQuantity:    req.MinQuantity, // PASTIKAN INI
		MaxDiskon:      req.MaxDiskon,
		TanggalMulai:   tanggalMulai,
		TanggalSelesai: tanggalSelesai,
		Status:         req.Status,
		Deskripsi:      req.Deskripsi,
		BuyQuantity:    req.BuyQuantity,
		GetQuantity:    req.GetQuantity,
		TipeBuyGet:     req.TipeBuyGet,
		HargaBundling:  req.HargaBundling,
		TipeBundling:   req.TipeBundling,
		DiskonBundling: req.DiskonBundling,
		ProdukXID:      produkXID,
		ProdukYID:      produkYID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Create promo
	if err := s.promoRepo.Create(promo); err != nil {
		return nil, fmt.Errorf("failed to create promo: %w", err)
	}

	// Add products to promo if specified (for diskon_produk and bundling)
	if len(req.ProdukIDs) > 0 && (req.TipePromo == "diskon_produk" || req.TipePromo == "bundling") {
		for _, produkID := range req.ProdukIDs {
			if err := s.promoRepo.AddPromoProduk(promo.ID, produkID); err != nil {
				// Don't fail the whole operation if adding product fails
				fmt.Printf("Warning: Failed to add product %d to promo: %v\n", produkID, err)
			}
		}
	}

	return promo, nil
}

// GetAllPromo retrieves all promos
func (s *PromoService) GetAllPromo() ([]*models.Promo, error) {
	return s.promoRepo.GetAll()
}

// GetActivePromos retrieves all active promos
func (s *PromoService) GetActivePromos() ([]*models.Promo, error) {
	return s.promoRepo.GetActivePromos()
}

// GetPromoByID retrieves a promo by ID
func (s *PromoService) GetPromoByID(id int) (*models.Promo, error) {
	promo, err := s.promoRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}
	if promo == nil {
		return nil, fmt.Errorf("promo not found")
	}
	return promo, nil
}

// GetPromoByKode retrieves a promo by code
func (s *PromoService) GetPromoByKode(kode string) (*models.Promo, error) {
	promo, err := s.promoRepo.GetByKode(kode)
	if err != nil {
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}
	if promo == nil {
		return nil, fmt.Errorf("promo not found")
	}
	return promo, nil
}

func (s *PromoService) UpdatePromo(req *models.UpdatePromoRequest) (*models.Promo, error) {
	// Validate required fields
	if strings.TrimSpace(req.Nama) == "" {
		return nil, fmt.Errorf("promo name is required")
	}

	// Check if promo exists
	existing, err := s.promoRepo.GetByID(req.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing promo: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("promo not found")
	}

	// Check if new kode conflicts with another promo
	if req.Kode != "" && existing.Kode != req.Kode {
		kodeCheck, err := s.promoRepo.GetByKode(req.Kode)
		if err != nil {
			return nil, fmt.Errorf("failed to check promo code: %w", err)
		}
		if kodeCheck != nil {
			return nil, fmt.Errorf("promo with code '%s' already exists", req.Kode)
		}
	}

	// Parse dates
	var tanggalMulai, tanggalSelesai time.Time

	if req.TanggalMulai != "" {
		tanggalMulai, err = time.Parse("2006-01-02", req.TanggalMulai)
		if err != nil {
			return nil, fmt.Errorf("invalid start date format: %w", err)
		}
	}

	if req.TanggalSelesai != "" {
		tanggalSelesai, err = time.Parse("2006-01-02", req.TanggalSelesai)
		if err != nil {
			return nil, fmt.Errorf("invalid end date format: %w", err)
		}
	}

	// Set default tipe_produk_berlaku if not provided
	TipeProduk := req.TipeProduk
	if TipeProduk == "" {
		TipeProduk = "semua"
	}

	// Validate for Buy X Get Y: only allow 'satuan' products
	// if req.TipePromo == "buy_x_get_y" && TipeProduk != "satuan" {
	// 	return nil, fmt.Errorf("promo Buy X Get Y hanya berlaku untuk produk dengan tipe satuan tetap")
	// }

	// Get product details for produkX and produkY
	var produkXID, produkYID int
	if req.ProdukX != nil {
		produkX, err := s.produkRepo.GetByID(*req.ProdukX)
		if err != nil || produkX == nil {
			return nil, fmt.Errorf("product X not found")
		}
		// Validate produk X jenis_produk matches TipeProduk
		// if req.TipePromo == "buy_x_get_y" && produkX.Satuan == "kg" {
		// 	return nil, fmt.Errorf("produk X harus berupa produk satuan tetap (bukan curah) untuk promo Buy X Get Y")
		// }
		produkXID = produkX.ID
	}
	if req.ProdukY != nil {
		produkY, err := s.produkRepo.GetByID(*req.ProdukY)
		if err != nil || produkY == nil {
			return nil, fmt.Errorf("product Y not found")
		}
		// Validate produk Y jenis_produk matches TipeProduk
		// if req.TipePromo == "buy_x_get_y" && produkY.Satuan == "kg" {
		// 	return nil, fmt.Errorf("produk Y harus berupa produk satuan tetap (bukan curah) untuk promo Buy X Get Y")
		// }
		produkYID = produkY.ID
	}

	// Update promo model
	promo := &models.Promo{
		ID:             req.ID,
		Nama:           req.Nama,
		Kode:           req.Kode,
		Tipe:           req.Tipe,
		TipePromo:      req.TipePromo,
		TipeProduk:     TipeProduk,
		Nilai:          req.Nilai,
		MinQuantity:    req.MinQuantity, // PASTIKAN INI
		MaxDiskon:      req.MaxDiskon,
		TanggalMulai:   tanggalMulai,
		TanggalSelesai: tanggalSelesai,
		Status:         req.Status,
		Deskripsi:      req.Deskripsi,
		BuyQuantity:    req.BuyQuantity,
		GetQuantity:    req.GetQuantity,
		TipeBuyGet:     req.TipeBuyGet,
		HargaBundling:  req.HargaBundling,
		TipeBundling:   req.TipeBundling,
		DiskonBundling: req.DiskonBundling,
		ProdukXID:      produkXID,
		ProdukYID:      produkYID,
	}

	// Update promo
	if err := s.promoRepo.Update(promo); err != nil {
		return nil, fmt.Errorf("failed to update promo: %w", err)
	}

	// Update promo products if provided (for diskon_produk and bundling)
	if len(req.ProdukIDs) > 0 && (req.TipePromo == "diskon_produk" || req.TipePromo == "bundling") {
		// Clear existing products first
		existingProducts, err := s.promoRepo.GetPromoProducts(req.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get existing promo products: %w", err)
		}

		// Remove all existing products
		for _, p := range existingProducts {
			if err := s.promoRepo.RemovePromoProduk(req.ID, p.ID); err != nil {
				fmt.Printf("Warning: Failed to remove product %d from promo: %v\n", p.ID, err)
			}
		}

		// Add new products
		for _, produkID := range req.ProdukIDs {
			if err := s.promoRepo.AddPromoProduk(req.ID, produkID); err != nil {
				fmt.Printf("Warning: Failed to add product %d to promo: %v\n", produkID, err)
			}
		}
	}

	// Get updated promo
	return s.promoRepo.GetByID(req.ID)
}

// DeletePromo deletes a promo
func (s *PromoService) DeletePromo(id int) error {
	// Check if promo exists
	promo, err := s.promoRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("failed to check existing promo: %w", err)
	}
	if promo == nil {
		return fmt.Errorf("promo not found")
	}

	// Delete promo (cascade will delete promo_produk entries)
	if err := s.promoRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete promo: %w", err)
	}

	return nil
}

// ApplyPromo dengan logging yang lebih detail
func (s *PromoService) ApplyPromo(req *models.ApplyPromoRequest) (*models.ApplyPromoResponse, error) {

	// Get promo by code
	promo, err := s.promoRepo.GetByKode(req.Kode)
	if err != nil {
		fmt.Printf("ERROR: Failed to get promo: %v\n", err)
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}
	if promo == nil {
		fmt.Printf("ERROR: Promo not found\n")
		return &models.ApplyPromoResponse{
			Success: false,
			Message: "Kode promo tidak valid",
		}, nil
	}

	fmt.Printf("Promo found: %s (ID: %d, Type: %s)\n", promo.Nama, promo.ID, promo.TipePromo)
	fmt.Printf("=== DEBUG ITEMS DATA ===\n")
	fmt.Printf("Total items: %d\n", len(req.Items))
	for i, item := range req.Items {
		fmt.Printf("Item[%d]: ProdukID=%d, HargaSatuan=%d, Jumlah=%d, BeratGram=%.2f\n",
			i, item.ProdukID, item.HargaSatuan, item.Jumlah, item.BeratGram)
	}
	fmt.Printf("========================\n")

	// Check if promo is active
	if promo.Status != "aktif" {
		fmt.Printf("ERROR: Promo not active\n")
		return &models.ApplyPromoResponse{
			Success: false,
			Message: "Promo tidak aktif",
		}, nil
	}

	// Check date validity
	now := time.Now()
	if !promo.TanggalMulai.IsZero() && now.Before(promo.TanggalMulai) {
		fmt.Printf("ERROR: Promo not started\n")
		return &models.ApplyPromoResponse{
			Success: false,
			Message: "Promo belum dimulai",
		}, nil
	}
	if !promo.TanggalSelesai.IsZero() && now.After(promo.TanggalSelesai) {
		fmt.Printf("ERROR: Promo expired\n")
		return &models.ApplyPromoResponse{
			Success: false,
			Message: "Promo sudah berakhir",
		}, nil
	}

	// VALIDASI MINIMUM QUANTITY
	// Validasi dipindahkan ke per-item level di calculateDiscount
	// agar lebih akurat (misal: beli 1kg ayam diskon, tapi beli 1pcs permen tidak)
	fmt.Printf("Validating individual product requirements...\n")

	// VALIDASI PRODUK
	fmt.Printf("Starting product validation...\n")
	if err := s.validatePromoProducts(promo, req.Items); err != nil {
		fmt.Printf("ERROR: Product validation failed: %v\n", err)
		return &models.ApplyPromoResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	// Calculate discount based on promo type
	fmt.Printf("Calculating discount...\n")
	diskonJumlah := s.CalculateDiscount(promo, req.Subtotal, req.Items)
	fmt.Printf("Discount calculated: %d\n", diskonJumlah)

	// Jika diskon 0, beri pesan error yang lebih spesifik
	if diskonJumlah == 0 {
		fmt.Printf("WARNING: Discount is 0\n")

		// Beri pesan error berdasarkan tipe promo
		var errorMsg string
		switch promo.TipePromo {
		case "diskon_produk":
			errorMsg = "Tidak ada produk yang memenuhi syarat untuk diskon ini"
		case "bundling":
			errorMsg = "Produk di keranjang tidak memenuhi syarat bundling"
		case "buy_x_get_y":
			// Beri pesan yang lebih spesifik untuk Buy X Get Y
			if promo.TipeBuyGet == "sama" {
				setSize := promo.BuyQuantity + promo.GetQuantity
				errorMsg = fmt.Sprintf("Masukkan minimal %d %s ke keranjang untuk promo ini (Beli %d Gratis %d)",
					setSize, promo.ProdukX.Nama, promo.BuyQuantity, promo.GetQuantity)
			} else {
				errorMsg = fmt.Sprintf("Minimal beli %d %s untuk mendapat promo ini", promo.BuyQuantity, promo.ProdukX.Nama)
			}
		default:
			errorMsg = "Promo tidak memenuhi syarat untuk produk di keranjang"
		}

		return &models.ApplyPromoResponse{
			Success: false,
			Message: errorMsg,
		}, nil
	}

	totalSetelah := req.Subtotal - diskonJumlah
	fmt.Printf("Final total after discount: %d\n", totalSetelah)
	fmt.Printf("=== APPLY PROMO COMPLETED ===\n")

	// Collect product IDs yang terkait dengan promo
	var promoProdukIds []int
	switch promo.TipePromo {
	case "diskon_produk", "bundling":
		// Untuk diskon_produk dan bundling, ambil dari promo_produk table
		promoProducts, err := s.promoRepo.GetPromoProducts(promo.ID)
		if err == nil && len(promoProducts) > 0 {
			for _, p := range promoProducts {
				promoProdukIds = append(promoProdukIds, p.ID)
			}
		}
	case "buy_x_get_y":
		// Untuk buy_x_get_y, ambil dari produk X dan Y
		if promo.ProdukX != nil {
			promoProdukIds = append(promoProdukIds, promo.ProdukX.ID)
		}
		if promo.TipeBuyGet == "beda" && promo.ProdukY != nil {
			promoProdukIds = append(promoProdukIds, promo.ProdukY.ID)
		}
	}

	return &models.ApplyPromoResponse{
		Success:        true,
		Message:        fmt.Sprintf("Promo '%s' berhasil diterapkan", promo.Nama),
		Promo:          promo,
		DiskonJumlah:   diskonJumlah,
		TotalSetelah:   totalSetelah,
		PromoProdukIds: promoProdukIds,
	}, nil
}

// Validasi produk untuk promo - VERSI DIPERBAIKI
func (s *PromoService) validatePromoProducts(promo *models.Promo, items []models.TransaksiItemRequest) error {

	switch promo.TipePromo {
	case "diskon_produk":
		// Dapatkan produk yang termasuk dalam promo
		promoProducts, err := s.promoRepo.GetPromoProducts(promo.ID)
		if err != nil {
			return fmt.Errorf("gagal memvalidasi produk promo")
		}

		// Jika ada produk spesifik yang dipilih untuk promo, gunakan validasi lama
		if len(promoProducts) > 0 {
			// Buat map untuk produk promo
			promoProductIDs := make(map[int]bool)
			for _, p := range promoProducts {
				promoProductIDs[p.ID] = true
			}

			// Validasi apakah ada produk di cart yang sesuai dengan promo
			hasValidProduct := false
			for _, item := range items {
				if promoProductIDs[item.ProdukID] {
					hasValidProduct = true
					break
				}
			}

			if !hasValidProduct {
				productNames := make([]string, 0)
				for _, p := range promoProducts {
					productNames = append(productNames, p.Nama)
				}
				errorMsg := fmt.Sprintf("promo hanya berlaku untuk produk: %s", strings.Join(productNames, ", "))
				return fmt.Errorf("%s", errorMsg)
			}
		} else {
			// Jika tidak ada produk spesifik, gunakan TipeProduk untuk validasi
			if promo.TipeProduk != "semua" {
				hasValidProduct := false
				for _, item := range items {
					// Load produk untuk cek satuan
					produk, err := s.produkRepo.GetByID(item.ProdukID)
					if err != nil || produk == nil {
						continue
					}

					// Cek apakah produk sesuai dengan TipeProduk
					isCurah := produk.Satuan == "kg"
					if promo.TipeProduk == "curah" && isCurah {
						hasValidProduct = true
						break
					} else if promo.TipeProduk == "satuan" && !isCurah {
						hasValidProduct = true
						break
					}
				}

				if !hasValidProduct {
					tipeLabel := "curah (kg)"
					if promo.TipeProduk == "satuan" {
						tipeLabel = "satuan tetap (ikat, pack, dll)"
					}
					return fmt.Errorf("promo hanya berlaku untuk produk %s", tipeLabel)
				}
			}
			// Jika TipeProduk == "semua", tidak perlu validasi tambahan
		}

	case "bundling":
		// Dapatkan produk yang termasuk dalam promo bundling
		promoProducts, err := s.promoRepo.GetPromoProducts(promo.ID)
		if err != nil {

			return fmt.Errorf("gagal memvalidasi produk bundling")
		}

		if len(promoProducts) == 0 {
			return fmt.Errorf("promo bundling tidak memiliki produk yang valid")
		}

		// Untuk bundling, perlu semua produk ada di cart
		cartProductIDs := make(map[int]bool)
		for _, item := range items {
			cartProductIDs[item.ProdukID] = true
		}

		missingProducts := make([]string, 0)
		for _, p := range promoProducts {
			if !cartProductIDs[p.ID] {
				missingProducts = append(missingProducts, p.Nama)
			}
		}

		if len(missingProducts) > 0 {
			errorMsg := fmt.Sprintf("promo bundling membutuhkan produk: %s", strings.Join(missingProducts, ", "))

			return fmt.Errorf("%s", errorMsg)
		}

	case "buy_x_get_y":

		// Load produk X jika belum diload
		if promo.ProdukX == nil && promo.ProdukXID > 0 {
			produkX, err := s.produkRepo.GetByID(promo.ProdukXID)
			if err != nil {

				return fmt.Errorf("gagal memuat produk X")
			}
			promo.ProdukX = produkX
		}

		if promo.ProdukX == nil {

			return fmt.Errorf("promo buy_x_get_y tidak memiliki produk X yang valid")
		}

		// Validasi apakah produk X ada di cart dengan quantity yang cukup
		hasProductX := false
		var productXQuantity int
		var usedWeightForX bool // Flag to track if we used weight or quantity

		// Helper function for checking bulk unit (keep for fallback)
		isCurah := func(p *models.Produk) bool {
			if p == nil {
				return false
			}
			if strings.ToLower(p.JenisProduk) == "curah" {
				return true
			}
			s := strings.ToLower(strings.TrimSpace(p.Satuan))
			return s == "kg" || s == "gram" || s == "g" || s == "kilogram"
		}

		for _, item := range items {
			if item.ProdukID == promo.ProdukX.ID {
				hasProductX = true

				// CHECK: Use BeratGram if available (User input weight), OR if product is Curah
				if item.BeratGram > 0 {
					productXQuantity = int(item.BeratGram)
					usedWeightForX = true
				} else if isCurah(promo.ProdukX) {
					productXQuantity = int(item.BeratGram)
					usedWeightForX = true
				} else {
					productXQuantity = item.Jumlah
					usedWeightForX = false
				}
				break
			}
		}

		if !hasProductX {
			errorMsg := fmt.Sprintf("promo buy_x_get_y membutuhkan produk: %s", promo.ProdukX.Nama)

			return fmt.Errorf("%s", errorMsg)
		}

		// Cek apakah quantity cukup untuk menerapkan promo
		// Untuk produk "sama", user harus masukkan X+Y unit (1 set lengkap)
		// Untuk produk "beda", user hanya perlu X unit dari produk X

		unitLabel := "unit"
		if usedWeightForX {
			unitLabel = "gram"
		}

		if promo.TipeBuyGet == "sama" {
			// Produk sama: user harus masukkan minimal 1 set lengkap (X + Y)
			setSize := promo.BuyQuantity + promo.GetQuantity
			if productXQuantity < setSize {
				errorMsg := fmt.Sprintf("minimal masukkan %d %s %s ke keranjang untuk promo ini (Beli %d Gratis %d)", setSize, unitLabel, promo.ProdukX.Nama, promo.BuyQuantity, promo.GetQuantity)
				return fmt.Errorf("%s", errorMsg)
			}

		} else {
			// Produk beda: cukup cek produk X
			if productXQuantity < promo.BuyQuantity {
				errorMsg := fmt.Sprintf("minimal beli %d %s %s untuk menggunakan promo ini", promo.BuyQuantity, unitLabel, promo.ProdukX.Nama)
				return fmt.Errorf("%s", errorMsg)
			}

		}

		// Untuk tipe "beda", validasi produk Y
		if promo.TipeBuyGet == "beda" {
			// Load produk Y jika belum diload
			if promo.ProdukY == nil && promo.ProdukYID > 0 {
				produkY, err := s.produkRepo.GetByID(promo.ProdukYID)
				if err != nil {

					return fmt.Errorf("gagal memuat produk Y")
				}
				promo.ProdukY = produkY
			}

			if promo.ProdukY == nil {

				return fmt.Errorf("promo buy_x_get_y tidak memiliki produk Y yang valid")
			}

			// Validasi apakah produk Y ada di cart
			hasProductY := false
			for _, item := range items {
				if item.ProdukID == promo.ProdukY.ID {
					hasProductY = true

					break
				}
			}

			if !hasProductY {
				errorMsg := fmt.Sprintf("promo buy_x_get_y membutuhkan produk: %s", promo.ProdukY.Nama)

				return fmt.Errorf("%s", errorMsg)
			}
		}

	}

	return nil
}

func (s *PromoService) CalculateDiscount(promo *models.Promo, subtotal int, items []models.TransaksiItemRequest) int {
	switch promo.TipePromo {
	case "diskon_produk":
		return s.calculateProductDiscount(promo, subtotal, items)
	case "bundling":
		return s.calculateBundlingDiscount(promo, subtotal, items)
	case "buy_x_get_y":
		// Untuk Buy X Get Y, gunakan fungsi baru dengan logging

		fmt.Printf("Promo: Buy %d Get %d (%s)\n", promo.BuyQuantity, promo.GetQuantity, promo.TipeBuyGet)

		_, diskon := s.CalculateBuyXGetYTotal(promo, items)
		fmt.Printf("Final discount: %d\n", diskon)
		return diskon
	default:
		return 0
	}
}

func (s *PromoService) CalculateTotalDiscount(subtotal int, totalQuantity int, promoKode string, pelangganID int64, items []models.TransaksiItemRequest) (int, int, error) {
	var promoDiskon int
	var customerDiskon int

	// Apply promo discount if provided
	if promoKode != "" {
		// Support multiple promo codes delimited by comma
		codes := strings.Split(promoKode, ",")
		appliedCodes := make(map[string]bool)

		for _, code := range codes {
			code = strings.TrimSpace(code)
			if code == "" {
				continue
			}

			// Prevent duplicate codes in the same request
			if appliedCodes[code] {
				continue
			}
			appliedCodes[code] = true

			promoResponse, err := s.ApplyPromo(&models.ApplyPromoRequest{
				Kode:          code,
				Subtotal:      subtotal,
				TotalQuantity: totalQuantity,
				PelangganID:   pelangganID,
				Items:         items,
			})

			if err != nil {
				return 0, 0, fmt.Errorf("gagal validasi promo '%s': %w", code, err)
			}

			if promoResponse.Success {
				promoDiskon += promoResponse.DiskonJumlah
			} else {
				// Jika promo validation fails, return error
				return 0, 0, fmt.Errorf("promo '%s' tidak valid: %s", code, promoResponse.Message)
			}
		}
	}

	// Tidak ada diskon berdasarkan level pelanggan
	// Diskon hanya dari promo dan poin
	_ = customerDiskon // unused, keep for future if needed

	totalDiskon := promoDiskon
	return totalDiskon, promoDiskon, nil
}

func (s *PromoService) calculateProductDiscount(promo *models.Promo, subtotal int, items []models.TransaksiItemRequest) int {
	// Dapatkan produk yang termasuk dalam promo
	promoProducts, err := s.promoRepo.GetPromoProducts(promo.ID)
	if err != nil {
		return 0
	}

	// Hitung subtotal hanya untuk produk yang termasuk dalam promo
	subtotalPromoProducts := 0

	// Jika ada produk spesifik yang dipilih untuk promo
	if len(promoProducts) > 0 {
		promoProductIDs := make(map[int]bool)
		for _, p := range promoProducts {
			promoProductIDs[p.ID] = true
		}

		for _, item := range items {
			if promoProductIDs[item.ProdukID] {
				// Load produk untuk cek jenis (curah/satuan)
				produk, err := s.produkRepo.GetByID(item.ProdukID)
				if err != nil || produk == nil {
					continue
				}

				// VALIDASI MINIMUM QTY / GRAMASI PER ITEM
				if produk.Satuan == "kg" {
					// Untuk produk curah, cek MinGramasi
					if promo.MinGramasi > 0 && float64(item.BeratGram) < float64(promo.MinGramasi) {
						fmt.Printf("[DISCOUNT SKIP] Item %s excluded: Weight %.2fg < Min %.2fg\n",
							produk.Nama, item.BeratGram, promo.MinGramasi)
						continue
					}
				} else {
					// Untuk produk satuan, cek MinQuantity
					if promo.MinQuantity > 0 && item.Jumlah < promo.MinQuantity {
						fmt.Printf("[DISCOUNT SKIP] Item %s excluded: Qty %d < Min %d\n",
							produk.Nama, item.Jumlah, promo.MinQuantity)
						continue
					}
				}

				// Hitung subtotal sesuai jenis produk
				if produk.Satuan == "kg" {
					// Produk curah: HargaSatuan per kg, BeratGram dalam gram
					itemSubtotal := int((float64(item.HargaSatuan) * item.BeratGram) / 1000.0)
					subtotalPromoProducts += itemSubtotal
					fmt.Printf("[DISCOUNT CALC] Produk curah %s: Harga=%d, Berat=%.2fg, Subtotal=%d\n",
						produk.Nama, item.HargaSatuan, item.BeratGram, itemSubtotal)
				} else {
					// Produk satuan tetap
					itemSubtotal := item.HargaSatuan * item.Jumlah
					subtotalPromoProducts += itemSubtotal
					fmt.Printf("[DISCOUNT CALC] Produk satuan %s: Harga=%d, Jumlah=%d, Subtotal=%d\n",
						produk.Nama, item.HargaSatuan, item.Jumlah, itemSubtotal)
				}
			}
		}
	} else {
		// Jika tidak ada produk spesifik, gunakan TipeProduk
		for _, item := range items {
			// Load produk untuk cek satuan
			produk, err := s.produkRepo.GetByID(item.ProdukID)
			if err != nil || produk == nil {
				continue
			}

			// Cek apakah produk sesuai dengan TipeProduk
			isCurah := produk.Satuan == "kg"
			shouldInclude := false

			if promo.TipeProduk == "semua" {
				shouldInclude = true
			} else if promo.TipeProduk == "curah" && isCurah {
				shouldInclude = true
			} else if promo.TipeProduk == "satuan" && !isCurah {
				shouldInclude = true
			}

			if shouldInclude {
				// VALIDASI MINIMUM QTY / GRAMASI PER ITEM
				if isCurah {
					// Untuk produk curah, cek MinGramasi
					if promo.MinGramasi > 0 && item.BeratGram < float64(promo.MinGramasi) {
						fmt.Printf("[DISCOUNT SKIP] Item %s excluded: Weight %.2fg < Min %d.00g\n",
							produk.Nama, item.BeratGram, promo.MinGramasi)
						continue
					}
				} else {
					// Untuk produk satuan, cek MinQuantity
					if promo.MinQuantity > 0 && item.Jumlah < promo.MinQuantity {
						fmt.Printf("[DISCOUNT SKIP] Item %s excluded: Qty %d < Min %d\n",
							produk.Nama, item.Jumlah, promo.MinQuantity)
						continue
					}
				}

				// Hitung subtotal sesuai jenis produk
				if isCurah {
					// Produk curah: HargaSatuan per kg, BeratGram dalam gram
					itemSubtotal := int((float64(item.HargaSatuan) * item.BeratGram) / 1000.0)
					subtotalPromoProducts += itemSubtotal
					fmt.Printf("[DISCOUNT CALC] Produk curah %s: Harga=%d, Berat=%.2fg, Subtotal=%d\n",
						produk.Nama, item.HargaSatuan, item.BeratGram, itemSubtotal)
				} else {
					// Produk satuan tetap
					itemSubtotal := item.HargaSatuan * item.Jumlah
					subtotalPromoProducts += itemSubtotal
					fmt.Printf("[DISCOUNT CALC] Produk satuan %s: Harga=%d, Jumlah=%d, Subtotal=%d\n",
						produk.Nama, item.HargaSatuan, item.Jumlah, itemSubtotal)
				}
			}
		}
	}

	fmt.Printf("[DISCOUNT CALC] Total subtotal produk promo: %d\n", subtotalPromoProducts)

	if subtotalPromoProducts == 0 {
		return 0
	}

	if promo.Tipe == "persen" {
		diskon := (subtotalPromoProducts * promo.Nilai) / 100
		fmt.Printf("[DISCOUNT CALC] Tipe: Persentase, Nilai: %d%%, Diskon sebelum max: %d\n", promo.Nilai, diskon)
		// Apply max discount if set
		if promo.MaxDiskon > 0 && diskon > promo.MaxDiskon {
			fmt.Printf("[DISCOUNT CALC] Diskon dipotong ke MaxDiskon: %d\n", promo.MaxDiskon)
			return promo.MaxDiskon
		}
		fmt.Printf("[DISCOUNT CALC] Diskon final (persen): %d\n", diskon)
		return diskon
	} else {
		// Nominal discount
		diskon := promo.Nilai
		fmt.Printf("[DISCOUNT CALC] Tipe: Nominal, Nilai: %d\n", diskon)
		// Don't exceed subtotal of promo products
		if diskon > subtotalPromoProducts {
			fmt.Printf("[DISCOUNT CALC] Diskon dipotong ke subtotal: %d\n", subtotalPromoProducts)
			return subtotalPromoProducts
		}
		fmt.Printf("[DISCOUNT CALC] Diskon final (nominal): %d\n", diskon)
		return diskon
	}
}

func (s *PromoService) calculateBundlingDiscount(promo *models.Promo, subtotal int, items []models.TransaksiItemRequest) int {
	// For bundling, we need to check if all required products are in cart
	requiredProducts, err := s.promoRepo.GetPromoProducts(promo.ID)
	if err != nil || len(requiredProducts) == 0 {
		return 0
	}

	// Check if cart contains all required products
	cartProductIDs := make(map[int]bool)
	for _, item := range items {
		cartProductIDs[item.ProdukID] = true
	}

	for _, reqProduct := range requiredProducts {
		if !cartProductIDs[reqProduct.ID] {
			return 0 // Missing required product
		}
	}

	// Calculate bundling discount
	if promo.TipeBundling == "harga_tetap" {
		totalHargaNormal := 0
		for _, reqProduct := range requiredProducts {
			totalHargaNormal += reqProduct.HargaJual
		}

		if totalHargaNormal > promo.HargaBundling {
			return totalHargaNormal - promo.HargaBundling
		}
	} else if promo.TipeBundling == "diskon_persen" {
		totalHargaNormal := 0
		for _, reqProduct := range requiredProducts {
			totalHargaNormal += reqProduct.HargaJual
		}
		return (totalHargaNormal * promo.DiskonBundling) / 100
	}

	return 0
}

func (s *PromoService) calculateBuyXGetYDiscount(promo *models.Promo, items []models.TransaksiItemRequest) int {
	// Jika produkX belum diload, load dulu
	if promo.ProdukX == nil && promo.ProdukXID > 0 {
		produkX, err := s.produkRepo.GetByID(promo.ProdukXID)
		if err != nil || produkX == nil {
			return 0
		}
		promo.ProdukX = produkX
	}

	if promo.ProdukX == nil {
		return 0
	}

	// Find product X in cart
	var productXQuantity int
	for _, item := range items {
		if item.ProdukID == promo.ProdukX.ID {
			productXQuantity = item.Jumlah
			break
		}
	}

	if productXQuantity == 0 {
		return 0
	}

	// Calculate discount amount based on promo type
	if promo.TipeBuyGet == "sama" {
		// Same product: User memasukkan X+Y unit ke keranjang
		// Contoh: Buy 1 Get 1 -> user masukkan 2 unit, gratis 1 unit
		setSize := promo.BuyQuantity + promo.GetQuantity
		kelipatan := productXQuantity / setSize
		if kelipatan == 0 {
			return 0
		}

		totalGratis := kelipatan * promo.GetQuantity
		return totalGratis * promo.ProdukX.HargaJual
	} else {
		// Different product: User memasukkan X produk A, gratis Y produk B
		// Hitung berapa set berdasarkan produk X
		kelipatan := productXQuantity / promo.BuyQuantity
		if kelipatan == 0 {
			return 0
		}

		// Jika produkY belum diload, load dulu
		if promo.ProdukY == nil && promo.ProdukYID > 0 {
			produkY, err := s.produkRepo.GetByID(promo.ProdukYID)
			if err != nil || produkY == nil {
				return 0
			}
			promo.ProdukY = produkY
		}

		if promo.ProdukY == nil {
			return 0
		}

		// Cari produk Y di cart untuk batasi gratis
		var productYQuantity int
		for _, item := range items {
			if item.ProdukID == promo.ProdukY.ID {
				productYQuantity = item.Jumlah
				break
			}
		}

		// Hitung total gratis, tapi batasi dengan quantity di cart
		totalGratis := kelipatan * promo.GetQuantity
		if productYQuantity > 0 && totalGratis > productYQuantity {
			totalGratis = productYQuantity
		}

		return totalGratis * promo.ProdukY.HargaJual
	}
}

// Fungsi baru untuk menghitung total yang harus dibayar setelah promo Buy X Get Y - VERSI DIPERBAIKI
// Fungsi untuk menghitung total yang harus dibayar setelah promo Buy X Get Y - DENGAN LOGGING
func (s *PromoService) CalculateBuyXGetYTotal(promo *models.Promo, items []models.TransaksiItemRequest) (int, int) {
	fmt.Printf("=== CALCULATE BUY X GET Y TOTAL ===\n")

	if promo.ProdukX == nil && promo.ProdukXID > 0 {
		produkX, err := s.produkRepo.GetByID(promo.ProdukXID)
		if err != nil || produkX == nil {
			fmt.Printf("ERROR: Cannot load product X\n")
			return 0, 0
		}
		promo.ProdukX = produkX
	}

	if promo.ProdukX == nil {
		fmt.Printf("ERROR: Product X is nil\n")
		return 0, 0
	}

	fmt.Printf("Product X: %s (ID: %d)\n", promo.ProdukX.Nama, promo.ProdukX.ID)

	// Helper function for checking bulk unit (Robust)
	isCurah := func(p *models.Produk) bool {
		if p == nil {
			return false
		}
		if strings.ToLower(p.JenisProduk) == "curah" {
			return true
		}
		s := strings.ToLower(strings.TrimSpace(p.Satuan))
		return s == "kg" || s == "gram" || s == "g" || s == "kilogram"
	}

	// Find product X in cart
	var productXQuantity int
	var productXHarga int
	var usedWeightForX bool

	for _, item := range items {
		if item.ProdukID == promo.ProdukX.ID {
			productXHarga = item.HargaSatuan
			// CHECK: Use BeratGram if available (User input weight), OR if product is Curah
			if item.BeratGram > 0 {
				productXQuantity = int(item.BeratGram)
				usedWeightForX = true
				fmt.Printf("Found in cart (Detected Curah via Weight) - Weight: %d g, Price/kg: %d\n", productXQuantity, productXHarga)
			} else if isCurah(promo.ProdukX) {
				productXQuantity = int(item.BeratGram)
				usedWeightForX = true
				fmt.Printf("Found in cart (Detected Curah via Product Type) - Weight: %d g, Price/kg: %d\n", productXQuantity, productXHarga)
			} else {
				productXQuantity = item.Jumlah
				usedWeightForX = false
				fmt.Printf("Found in cart (Satuan) - Quantity: %d, Price: %d\n", productXQuantity, productXHarga)
			}
			break
		}
	}

	if productXQuantity == 0 {
		fmt.Printf("ERROR: Product X not found in cart\n")
		return 0, 0
	}

	fmt.Printf("Buy Quantity: %d, Get Quantity: %d\n", promo.BuyQuantity, promo.GetQuantity)

	if promo.TipeBuyGet == "sama" {
		fmt.Printf("=== SAME PRODUCT CALCULATION ===\n")
		// Untuk produk sama: Beli X dapat Y (produk sama)
		// Logika: User memasukkan X+Y unit ke keranjang
		// Contoh: Buy 1 Get 1 -> user masukkan 2 unit, bayar 1 unit, gratis 1 unit
		// Contoh: Buy 2 Get 1 -> user masukkan 3 unit, bayar 2 unit, gratis 1 unit

		// Hitung berapa set lengkap (1 set = X + Y unit)
		setSize := promo.BuyQuantity + promo.GetQuantity
		kelipatan := productXQuantity / setSize
		fmt.Printf("Set size: %d (Buy %d + Get %d)\n", setSize, promo.BuyQuantity, promo.GetQuantity)
		fmt.Printf("Complete sets (kelipatan): %d\n", kelipatan)

		if kelipatan == 0 {
			fmt.Printf("ERROR: Not enough quantity for promo. Need %d, have %d\n", setSize, productXQuantity)
			return 0, 0
		}

		// Hitung total item gratis
		// Untuk curah, diskon adalah berat gratis * harga per kg / 1000
		totalGratis := kelipatan * promo.GetQuantity
		fmt.Printf("Total free quantity (units/grams): %d\n", totalGratis)

		// Hitung diskon (nilai dari item gratis)
		var diskon int
		if usedWeightForX {
			// Curah: (gram * harga_per_kg) / 1000
			diskon = int((float64(totalGratis) * float64(productXHarga)) / 1000.0)
		} else {
			// Satuan: qty * harga
			diskon = totalGratis * productXHarga
		}

		// Hitung harga normal total
		var totalHargaNormal int
		if usedWeightForX {
			totalHargaNormal = int((float64(productXQuantity) * float64(productXHarga)) / 1000.0)
		} else {
			totalHargaNormal = productXQuantity * productXHarga
		}

		totalHargaSetelahPromo := totalHargaNormal - diskon

		fmt.Printf("Normal price: %d\n", totalHargaNormal)
		fmt.Printf("Discount: %d\n", diskon)
		fmt.Printf("Price after promo: %d\n", totalHargaSetelahPromo)

		unitType := "unit"
		if usedWeightForX {
			unitType = "gram"
		}
		fmt.Printf("Keterangan: Total %d %s, bayar %d %s, gratis %d %s\n",
			productXQuantity, unitType, productXQuantity-totalGratis, unitType, totalGratis, unitType)

		return totalHargaSetelahPromo, diskon
	} else {
		fmt.Printf("=== DIFFERENT PRODUCT CALCULATION ===\n")
		// Untuk produk berbeda: Beli X dapat Y (produk berbeda)
		// Logika: User memasukkan X produk A dan Y produk B ke keranjang
		// Contoh: Buy 2 Get 1 (beda) -> user masukkan 2 Produk A dan 1 Produk B
		// User bayar semua Produk A, gratis Produk B

		if promo.ProdukY == nil && promo.ProdukYID > 0 {
			produkY, err := s.produkRepo.GetByID(promo.ProdukYID)
			if err != nil || produkY == nil {
				fmt.Printf("ERROR: Cannot load product Y\n")
				return 0, 0
			}
			promo.ProdukY = produkY
		}

		if promo.ProdukY == nil {
			fmt.Printf("ERROR: Product Y is nil\n")
			return 0, 0
		}

		fmt.Printf("Product Y: %s (ID: %d)\n", promo.ProdukY.Nama, promo.ProdukY.ID)

		// Cari produk Y di cart
		var productYQuantity int
		var productYHarga int
		var usedWeightForY bool

		for _, item := range items {
			if item.ProdukID == promo.ProdukY.ID {
				productYHarga = item.HargaSatuan
				// CHECK Y: Use BeratGram if available, OR if product is Curah
				if item.BeratGram > 0 {
					productYQuantity = int(item.BeratGram)
					usedWeightForY = true
					fmt.Printf("Product Y in cart (Detected Curah via Weight) - Weight: %d g, Price/kg: %d\n", productYQuantity, productYHarga)
				} else if isCurah(promo.ProdukY) {
					productYQuantity = int(item.BeratGram)
					usedWeightForY = true
					fmt.Printf("Product Y in cart (Detected Curah detection) - Weight: %d g, Price/kg: %d\n", productYQuantity, productYHarga)
				} else {
					productYQuantity = item.Jumlah
					usedWeightForY = false
					fmt.Printf("Product Y in cart (Satuan) - Quantity: %d, Price: %d\n", productYQuantity, productYHarga)
				}
				break
			}
		}

		if productYQuantity == 0 {
			fmt.Printf("ERROR: Product Y not found in cart\n")
			return 0, 0
		}

		// Hitung berapa set berdasarkan produk X
		kelipatan := productXQuantity / promo.BuyQuantity
		fmt.Printf("Complete sets based on Product X: %d\n", kelipatan)

		if kelipatan == 0 {
			fmt.Printf("ERROR: Not enough Product X for promo. Need %d, have %d\n", promo.BuyQuantity, productXQuantity)
			return 0, 0
		}

		// Hitung berapa banyak produk Y yang gratis
		totalGratisY := kelipatan * promo.GetQuantity
		fmt.Printf("Total free Product Y: %d\n", totalGratisY)

		// Batasi gratis dengan quantity yang ada di cart
		gratisY := totalGratisY
		if gratisY > productYQuantity {
			gratisY = productYQuantity
			fmt.Printf("Adjusted free items (limited by cart): %d\n", gratisY)
		}

		// Hitung diskon (nilai dari produk Y yang gratis)
		var diskon int
		if usedWeightForY {
			diskon = int((float64(gratisY) * float64(productYHarga)) / 1000.0)
		} else {
			diskon = gratisY * productYHarga
		}

		// Hitung total harga normal untuk kedua produk
		var totalHargaNormal int
		if usedWeightForX {
			totalHargaNormal = int((float64(productXQuantity) * float64(productXHarga)) / 1000.0)
		} else {
			totalHargaNormal = productXQuantity * productXHarga
		}

		if usedWeightForY {
			totalHargaNormal += int((float64(productYQuantity) * float64(productYHarga)) / 1000.0)
		} else {
			totalHargaNormal += productYQuantity * productYHarga
		}

		totalHargaSetelahPromo := totalHargaNormal - diskon

		fmt.Printf("Normal price: %d\n", totalHargaNormal)
		fmt.Printf("Discount: %d\n", diskon)
		fmt.Printf("Price after promo: %d\n", totalHargaSetelahPromo)

		unitTypeX := "unit"
		if usedWeightForX {
			unitTypeX = "gram"
		}
		unitTypeY := "unit"
		if usedWeightForY {
			unitTypeY = "gram"
		}

		fmt.Printf("Keterangan: Beli %d %s %s, gratis %d %s %s\n",
			productXQuantity, unitTypeX, promo.ProdukX.Nama, gratisY, unitTypeY, promo.ProdukY.Nama)

		return totalHargaSetelahPromo, diskon
	}
}

// GetPromoForProduct gets active promos for a specific product
func (s *PromoService) GetPromoForProduct(produkID int) ([]*models.Promo, error) {
	return s.promoRepo.GetPromoForProduct(produkID)
}

func (s *PromoService) GetPromoProducts(promoID int) ([]*models.Produk, error) {
	// First get the promo to ensure it exists and get its type
	promo, err := s.promoRepo.GetByID(promoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}
	if promo == nil {
		return nil, fmt.Errorf("promo not found")
	}

	// For buy_x_get_y, we need to ensure produk_x and produk_y are loaded
	if promo.TipePromo == "buy_x_get_y" {
		// If produk_x is not loaded, get it
		if promo.ProdukX == nil && promo.ProdukXID > 0 {
			produkX, err := s.produkRepo.GetByID(promo.ProdukXID)
			if err != nil {
				return nil, fmt.Errorf("failed to get product X: %w", err)
			}
			promo.ProdukX = produkX
		}

		// If produk_y is not loaded and needed, get it
		if promo.TipeBuyGet == "beda" && promo.ProdukY == nil && promo.ProdukYID > 0 {
			produkY, err := s.produkRepo.GetByID(promo.ProdukYID)
			if err != nil {
				return nil, fmt.Errorf("failed to get product Y: %w", err)
			}
			promo.ProdukY = produkY
		}
	}

	return s.promoRepo.GetPromoProducts(promoID)
}

// Tambahkan function untuk debugging
func (s *PromoService) DebugPromoValidation(promoKode string, items []models.TransaksiItemRequest) (string, error) {
	promo, err := s.promoRepo.GetByKode(promoKode)
	if err != nil {
		return "", err
	}

	if promo == nil {
		return "Promo tidak ditemukan", nil
	}

	result := fmt.Sprintf("Promo: %s, Tipe: %s, MinQuantity: %d\n", promo.Nama, promo.TipePromo, promo.MinQuantity)
	result += fmt.Sprintf("Items in cart: %d\n", len(items))

	totalQuantity := 0
	for _, item := range items {
		totalQuantity += item.Jumlah
		result += fmt.Sprintf(" - ProdukID: %d, Quantity: %d\n", item.ProdukID, item.Jumlah)
	}

	result += fmt.Sprintf("Total Quantity: %d\n", totalQuantity)
	result += fmt.Sprintf("Min Quantity Required: %d\n", promo.MinQuantity)

	if promo.MinQuantity > 0 && totalQuantity < promo.MinQuantity {
		result += "❌ FAIL: Minimum quantity not met\n"
	} else {
		result += "✅ PASS: Minimum quantity met\n"
	}

	// Validasi produk
	err = s.validatePromoProducts(promo, items)
	if err != nil {
		result += fmt.Sprintf("❌ FAIL Product Validation: %s\n", err.Error())
	} else {
		result += "✅ PASS: Product validation\n"
	}

	// Hitung diskon
	subtotal := 0
	for _, item := range items {
		subtotal += item.HargaSatuan * item.Jumlah
	}
	diskon := s.CalculateDiscount(promo, subtotal, items)
	result += fmt.Sprintf("Discount Amount: %d\n", diskon)

	return result, nil
}
