package service

import (
	"fmt"
	"time"

	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

type TransaksiService struct {
	repo             *repository.TransaksiRepository
	pelangganService *PelangganService
	promoService     *PromoService
	settingsService  *SettingsService
}

func NewTransaksiService() *TransaksiService {
	return &TransaksiService{
		repo:             repository.NewTransaksiRepository(),
		pelangganService: NewPelangganService(),
		promoService:     NewPromoService(),
		settingsService:  NewSettingsService(),
	}
}

func (s *TransaksiService) CreateTransaksi(req *models.CreateTransaksiRequest) (*models.TransaksiResponse, error) {
	fmt.Printf("[TRANSACTION SERVICE] Starting transaction creation\n")

	// 1. VALIDASI DASAR
	if err := s.validateCreateRequest(req); err != nil {
		return &models.TransaksiResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	// 2. HITUNG SUBTOTAL (support berat or quantity)
	subtotal := 0
	for _, item := range req.Items {
		var itemSubtotal int
		if item.BeratGram > 0 {
			// Perhitungan berdasarkan berat: (berat_gram / 1000) * harga_per_1000g
			itemSubtotal = int((item.BeratGram / 1000.0) * float64(item.HargaSatuan))
		} else {
			// Perhitungan biasa untuk backward compatibility
			itemSubtotal = item.HargaSatuan * item.Jumlah
		}
		subtotal += itemSubtotal
	}
	fmt.Printf("[TRANSACTION SERVICE] Subtotal: %d\n", subtotal)

	// 3. PROSES PELANGGAN & POIN (JIKA ADA)
	var pelanggan *models.Pelanggan
	poinDipakai := 0
	diskonPoin := 0

	if req.PelangganID > 0 {
		fmt.Printf("[TRANSACTION SERVICE] Processing registered customer ID: %d\n", req.PelangganID)
		var err error
		pelanggan, err = s.pelangganService.GetPelangganByID(req.PelangganID)
		if err != nil {
			return &models.TransaksiResponse{
				Success: false,
				Message: fmt.Sprintf("Pelanggan tidak ditemukan: %v", err),
			}, nil
		}

		// Auto-fill customer details
		req.PelangganNama = pelanggan.Nama
		req.PelangganTelp = pelanggan.Telepon
		fmt.Printf("[TRANSACTION SERVICE] Customer: %s, Current Points: %d\n", pelanggan.Nama, pelanggan.Poin)

		// 3a. PROSES PENUKARAN POIN (JIKA ADA)
		if req.PoinDitukar > 0 {
			fmt.Printf("[TRANSACTION SERVICE] Processing point redemption request: %d points\n", req.PoinDitukar)

			// Get point settings
			settings, err := s.settingsService.GetPoinSettings()
			if err != nil {
				return &models.TransaksiResponse{
					Success: false,
					Message: fmt.Sprintf("Gagal mengambil pengaturan sistem poin: %v", err),
				}, nil
			}

			// VALIDASI DAN PENYESUAIAN POIN OTOMATIS
			poinDipakai, diskonPoin = s.CalculatePointsDiscount(
				subtotal,
				req.PoinDitukar,
				pelanggan.Poin,
				settings.PointValue,
			)

			fmt.Printf("[TRANSACTION SERVICE] Point adjustment - Requested: %d, Actual: %d, Discount: %d\n",
				req.PoinDitukar, poinDipakai, diskonPoin)

			// Validasi minimum exchange
			if poinDipakai > 0 && poinDipakai < settings.MinExchange {
				return &models.TransaksiResponse{
					Success: false,
					Message: fmt.Sprintf("Poin yang dapat ditukarkan (%d) kurang dari minimum (%d). Poin tersedia: %d",
						poinDipakai, settings.MinExchange, pelanggan.Poin),
				}, nil
			}
		}
	} else {
		// Guest transaction - tidak boleh pakai poin
		req.PelangganNama = ""
		req.PelangganTelp = ""
		if req.PoinDitukar > 0 {
			return &models.TransaksiResponse{
				Success: false,
				Message: "Penukaran poin hanya tersedia untuk pelanggan terdaftar",
			}, nil
		}
		fmt.Printf("[TRANSACTION SERVICE] Guest transaction (no customer)\n")
	}

	// 4. HITUNG TOTAL DISKON (PROMO + POIN)
	// Diskon hanya dari promo dan poin, tidak ada diskon berdasarkan level pelanggan
	totalDiskon := req.Diskon
	diskonPelanggan := 0 // Tidak ada diskon level, hanya dari poin

	fmt.Printf("[TRANSACTION SERVICE] Total discount: %d (promo + points)\n", totalDiskon)

	// 5. HITUNG TOTAL AKHIR & VALIDASI
	totalAkhir := subtotal - totalDiskon

	// Validasi total tidak negatif (seharusnya sudah di-handle oleh CalculatePointsDiscount)
	if totalAkhir < 0 {
		return &models.TransaksiResponse{
			Success: false,
			Message: "Total transaksi tidak valid setelah diskon poin",
		}, nil
	}

	// Validasi pembayaran
	totalPembayaran := 0
	for _, payment := range req.Pembayaran {
		totalPembayaran += payment.Jumlah
	}
	kembalian := totalPembayaran - totalAkhir

	if kembalian < 0 {
		return &models.TransaksiResponse{
			Success: false,
			Message: fmt.Sprintf("Pembayaran tidak mencukupi. Kurang: Rp %d", -kembalian),
		}, nil
	}

	fmt.Printf("[TRANSACTION SERVICE] Final calculation - Subtotal: %d, Discount: %d, Total: %d, Payment: %d, Change: %d\n",
		subtotal, totalDiskon, totalAkhir, totalPembayaran, kembalian)

	// 6. CREATE TRANSACTION DI DATABASE
	repoRequest := &models.CreateTransaksiRequest{
		PelangganID:     req.PelangganID,
		PelangganNama:   req.PelangganNama,
		PelangganTelp:   req.PelangganTelp,
		Items:           req.Items,
		Pembayaran:      req.Pembayaran,
		PoinDitukar:     poinDipakai, // Gunakan poin yang sudah disesuaikan
		Diskon:          totalDiskon,
		DiskonPromo:     req.Diskon,       // Diskon promo dari frontend
		DiskonPelanggan: diskonPelanggan,  // Diskon level pelanggan dari backend
		Catatan:         req.Catatan,
		Kasir:           req.Kasir,
		StaffID:         req.StaffID,
		StaffNama:       req.StaffNama,
	}

	fmt.Printf("[TRANSACTION SERVICE] Creating transaction with StaffID: %d, StaffNama: %s\n", req.StaffID, req.StaffNama)

	transaksiDetail, err := s.repo.Create(repoRequest)
	if err != nil {
		return &models.TransaksiResponse{
			Success: false,
			Message: fmt.Sprintf("Gagal membuat transaksi: %v", err),
		}, nil
	}

	fmt.Printf("[TRANSACTION SERVICE] Transaction created successfully: %s\n",
		transaksiDetail.Transaksi.NomorTransaksi)

	// 7. UPDATE POIN PELANGGAN (JIKA REGISTERED CUSTOMER)
	if req.PelangganID > 0 {
		fmt.Printf("[TRANSACTION SERVICE] Updating customer points for ID: %d\n", req.PelangganID)

		// Get current settings
		settings, err := s.settingsService.GetPoinSettings()
		if err != nil {
			fmt.Printf("[WARNING] Failed to get point settings for update: %v\n", err)
			// Continue without points reward
		} else {
			// 7a. KURANGI poin yang dipakai
			poinSetelahPengurangan := pelanggan.Poin - poinDipakai
			if poinSetelahPengurangan < 0 {
				poinSetelahPengurangan = 0
			}

			// 7b. TAMBAH poin reward dari transaksi
			poinReward := 0
			if totalAkhir >= settings.MinTransactionForPoints {
				poinReward = totalAkhir / settings.MinTransactionForPoints
			}

			poinAkhir := poinSetelahPengurangan + poinReward

			// Update poin pelanggan
			if err := s.pelangganService.UpdatePoin(req.PelangganID, poinAkhir); err != nil {
				fmt.Printf("[WARNING] Failed to update customer points: %v\n", err)
			}

			fmt.Printf("[TRANSACTION SERVICE] Points update - Start: %d, Used: %d, Reward: %d, Final: %d\n",
				pelanggan.Poin, poinDipakai, poinReward, poinAkhir)
		}
	}

	// 8. RETURN SUCCESS RESPONSE
	message := fmt.Sprintf("Transaksi %s berhasil dibuat", transaksiDetail.Transaksi.NomorTransaksi)
	if poinDipakai > 0 {
		message += fmt.Sprintf(". Poin digunakan: %d (Rp %d)", poinDipakai, diskonPoin)
	}
	if req.PelangganID > 0 {
		// Info poin reward jika ada
		settings, _ := s.settingsService.GetPoinSettings()
		if settings != nil && totalAkhir >= settings.MinTransactionForPoints {
			poinReward := totalAkhir / settings.MinTransactionForPoints
			message += fmt.Sprintf(". Mendapat %d poin reward", poinReward)
		}
	}

	return &models.TransaksiResponse{
		Success:   true,
		Message:   message,
		Transaksi: transaksiDetail,
	}, nil
}

func (s *TransaksiService) CalculatePointsDiscount(subtotal int, poinDitukar int, saldoPoin int, pointValue int) (int, int) {
	// ATURAN 1: Tidak boleh lebih dari saldo poin
	poinMaksimumBerdasarSaldo := poinDitukar
	if poinMaksimumBerdasarSaldo > saldoPoin {
		poinMaksimumBerdasarSaldo = saldoPoin
	}

	// ATURAN 2: Tidak boleh membuat total transaksi negatif
	// Hitung maksimum poin berdasarkan harga
	nilaiPoinMaksimum := subtotal / pointValue
	if nilaiPoinMaksimum < poinMaksimumBerdasarSaldo {
		poinMaksimumBerdasarSaldo = nilaiPoinMaksimum
	}

	// Hitung diskon dari poin yang disesuaikan
	diskonPoin := poinMaksimumBerdasarSaldo * pointValue

	return poinMaksimumBerdasarSaldo, diskonPoin
}

// validateCreateRequest validates the create transaction request
func (s *TransaksiService) validateCreateRequest(req *models.CreateTransaksiRequest) error {
	// Validasi items
	if len(req.Items) == 0 {
		return fmt.Errorf("transaksi harus memiliki minimal 1 item")
	}

	for i, item := range req.Items {
		if item.ProdukID <= 0 {
			return fmt.Errorf("item %d: produk ID tidak valid", i+1)
		}
		if item.Jumlah <= 0 {
			return fmt.Errorf("item %d: jumlah harus lebih dari 0", i+1)
		}
		if item.HargaSatuan <= 0 {
			return fmt.Errorf("item %d: harga satuan harus lebih dari 0", i+1)
		}
	}

	// Validasi payments
	if len(req.Pembayaran) == 0 {
		return fmt.Errorf("transaksi harus memiliki minimal 1 metode pembayaran")
	}

	// Validasi poin
	if req.PoinDitukar < 0 {
		return fmt.Errorf("poin yang ditukarkan tidak boleh negatif")
	}

	// Jika ada pelanggan, validasi poin vs pelanggan
	if req.PelangganID > 0 && req.PoinDitukar > 0 {
		// Note: Validasi detail akan dilakukan di proses utama
		// Di sini hanya validasi dasar
		if req.PoinDitukar > 0 && req.PelangganID == 0 {
			return fmt.Errorf("penukaran poin hanya untuk pelanggan terdaftar")
		}
	}

	// Validasi pembayaran
	totalPembayaran := 0
	for i, payment := range req.Pembayaran {
		if payment.Metode == "" {
			return fmt.Errorf("pembayaran %d: metode pembayaran harus diisi", i+1)
		}
		if payment.Jumlah <= 0 {
			return fmt.Errorf("pembayaran %d: jumlah pembayaran harus lebih dari 0", i+1)
		}
		totalPembayaran += payment.Jumlah
	}

	return nil
}

// GetTransaksiByID retrieves a transaction by ID
func (s *TransaksiService) GetTransaksiByID(id int) (*models.TransaksiDetail, error) {
	fmt.Printf("[SERVICE] GetTransaksiByID called with id: %d\n", id)
	result, err := s.repo.GetByID(id)
	if err != nil {
		fmt.Printf("[SERVICE] GetTransaksiByID error: %v\n", err)
		return nil, err
	}
	fmt.Printf("[SERVICE] GetTransaksiByID success\n")
	return result, nil
}

// GetTransaksiByNoTransaksi retrieves a transaction by transaction number
func (s *TransaksiService) GetTransaksiByNoTransaksi(nomorTransaksi string) (*models.TransaksiDetail, error) {
	return s.repo.GetByNomorTransaksi(nomorTransaksi)
}

// GetAllTransaksi retrieves all transactions with pagination
func (s *TransaksiService) GetAllTransaksi(limit, offset int) ([]*models.Transaksi, error) {
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.GetAll(limit, offset)
}

// GetTransaksiByDateRange retrieves transactions within a date range
func (s *TransaksiService) GetTransaksiByDateRange(startDate, endDate time.Time) ([]*models.Transaksi, error) {
	return s.repo.GetByDateRange(startDate, endDate)
}

// GetTodayStats gets statistics for today's transactions
func (s *TransaksiService) GetTodayStats() (map[string]interface{}, error) {
	totalTransaksi, totalPendapatan, totalItem, err := s.repo.GetTodayStats()
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"totalTransaksi":  totalTransaksi,
		"totalPendapatan": totalPendapatan,
		"totalItem":       totalItem,
	}, nil
}

func (s *TransaksiService) GetTransaksiByPelangganID(pelangganID int) ([]*models.Transaksi, error) {
	if pelangganID <= 0 {
		return nil, fmt.Errorf("pelanggan ID tidak valid")
	}
	return s.repo.GetByPelangganID(pelangganID)
}

// GetPelangganStats retrieves transaction statistics for a customer
func (s *TransaksiService) GetPelangganStats(pelangganID int) (*models.PelangganStats, error) {
	if pelangganID <= 0 {
		return nil, fmt.Errorf("pelanggan ID tidak valid")
	}
	return s.repo.GetStatsByPelangganID(pelangganID)
}
