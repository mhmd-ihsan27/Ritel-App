package service

import (
	"fmt"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"strings"
	"time"
)

// PelangganService handles business logic for customers
type PelangganService struct {
	pelangganRepo *repository.PelangganRepository
	settingsRepo  *repository.SettingsRepository
	transaksiRepo *repository.TransaksiRepository
}

// NewPelangganService creates a new instance
func NewPelangganService() *PelangganService {
	return &PelangganService{
		pelangganRepo: repository.NewPelangganRepository(),
		settingsRepo:  repository.NewSettingsRepository(),
		transaksiRepo: repository.NewTransaksiRepository(),
	}
}

// getLevelInfo returns tipe and diskon based on level
// Semua level tidak ada diskon (diskon hanya dari poin)
func getLevelInfo(level int) (string, int) {
	switch level {
	case 3:
		return "gold", 0
	case 2:
		return "premium", 0
	default:
		return "reguler", 0
	}
}

// CreatePelanggan creates a new customer with validation
func (s *PelangganService) CreatePelanggan(req *models.CreatePelangganRequest) (*models.Pelanggan, error) {
	// Validate required fields
	if strings.TrimSpace(req.Nama) == "" {
		return nil, fmt.Errorf("customer name is required")
	}
	if strings.TrimSpace(req.Telepon) == "" {
		return nil, fmt.Errorf("customer phone is required")
	}

	// Check if phone number already exists
	existing, err := s.pelangganRepo.GetByTelepon(req.Telepon)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing customer: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("customer with phone '%s' already exists", req.Telepon)
	}

	// Set default level if not provided
	level := req.Level
	if level < 1 || level > 3 {
		level = 1 // default to level 1
	}

	// Get tipe and diskon based on level
	tipe, diskonPersen := getLevelInfo(level)

	// Create pelanggan model
	pelanggan := &models.Pelanggan{
		Nama:           req.Nama,
		Telepon:        req.Telepon,
		Email:          req.Email,
		Alamat:         req.Alamat,
		Level:          level,
		Tipe:           tipe,
		Poin:           req.Poin,
		DiskonPersen:   diskonPersen,
		TotalTransaksi: 0,
		TotalBelanja:   0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Create customer
	if err := s.pelangganRepo.Create(pelanggan); err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	return pelanggan, nil
}

// GetAllPelanggan retrieves all customers
func (s *PelangganService) GetAllPelanggan() ([]*models.Pelanggan, error) {
	return s.pelangganRepo.GetAll()
}

// GetPelangganByID retrieves a customer by ID
func (s *PelangganService) GetPelangganByID(id int) (*models.Pelanggan, error) {
	pelanggan, err := s.pelangganRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}
	if pelanggan == nil {
		return nil, fmt.Errorf("customer not found")
	}
	return pelanggan, nil
}

func (s *PelangganService) GetPelangganByTelepon(telepon string) (*models.Pelanggan, error) {
	pelanggan, err := s.pelangganRepo.GetByTelepon(telepon)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}
	if pelanggan == nil {
		return nil, fmt.Errorf("customer not found")
	}
	return pelanggan, nil
}

func (s *PelangganService) UpdatePelanggan(req *models.UpdatePelangganRequest) (*models.Pelanggan, error) {
	// Validate required fields
	if strings.TrimSpace(req.Nama) == "" {
		return nil, fmt.Errorf("customer name is required")
	}
	if strings.TrimSpace(req.Telepon) == "" {
		return nil, fmt.Errorf("customer phone is required")
	}

	// Check if customer exists
	existing, err := s.pelangganRepo.GetByID(req.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing customer: %w", err)
	}
	if existing == nil {
		return nil, fmt.Errorf("customer not found")
	}

	// Check if new phone conflicts with another customer
	if existing.Telepon != req.Telepon {
		phoneCheck, err := s.pelangganRepo.GetByTelepon(req.Telepon)
		if err != nil {
			return nil, fmt.Errorf("failed to check customer phone: %w", err)
		}
		if phoneCheck != nil {
			return nil, fmt.Errorf("customer with phone '%s' already exists", req.Telepon)
		}
	}

	// Update customer model - HANYA field yang diizinkan
	pelanggan := &models.Pelanggan{
		ID:      req.ID,
		Nama:    req.Nama,
		Telepon: req.Telepon,
		Email:   req.Email,
		Alamat:  req.Alamat,
		// Level dan Tipe TIDAK diupdate - tetap pakai yang existing
		Level: existing.Level,
		Tipe:  existing.Tipe,
	}

	// Update customer
	if err := s.pelangganRepo.Update(pelanggan); err != nil {
		return nil, fmt.Errorf("failed to update customer: %w", err)
	}

	// Get updated customer
	return s.pelangganRepo.GetByID(req.ID)
}

// DeletePelanggan deletes a customer with validation
func (s *PelangganService) DeletePelanggan(id int) error {

	// 1. VALIDASI INPUT
	if id <= 0 {
		return fmt.Errorf("ID pelanggan tidak valid")
	}

	// 2. CEK APAKAH PELANGGAN ADA
	pelanggan, err := s.pelangganRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("gagal memeriksa data pelanggan: %w", err)
	}
	if pelanggan == nil {
		return fmt.Errorf("pelanggan dengan ID %d tidak ditemukan", id)
	}

	// 3. CEK APAKAH PELANGGAN MEMILIKI TRANSAKSI
	// (Opsional: jika ingin mencegah delete pelanggan yang punya transaksi)
	transaksi, err := s.transaksiRepo.GetByPelangganID(id)
	if err != nil {
		// Log error tapi lanjutkan delete
		fmt.Printf("[WARNING] Failed to check transaction history: %v\n", err)
	}

	if len(transaksi) > 0 {
		return fmt.Errorf("tidak dapat menghapus pelanggan yang memiliki riwayat transaksi (%d transaksi)", len(transaksi))
	}

	// 4. HAPUS PELANGGAN
	if err := s.pelangganRepo.Delete(id); err != nil {
		return fmt.Errorf("gagal menghapus pelanggan: %w", err)
	}

	return nil
}

// AddPoin adds points to a customer
func (s *PelangganService) AddPoin(req *models.AddPoinRequest) (*models.Pelanggan, error) {
	// Get customer
	pelanggan, err := s.pelangganRepo.GetByID(req.PelangganID)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}
	if pelanggan == nil {
		return nil, fmt.Errorf("customer not found")
	}

	// Add points
	if err := s.pelangganRepo.AddPoin(req.PelangganID, req.Poin); err != nil {
		return nil, fmt.Errorf("failed to add points: %w", err)
	}

	// Get updated customer to get new points total
	updatedPelanggan, err := s.pelangganRepo.GetByID(req.PelangganID)
	if err != nil {
		return nil, fmt.Errorf("failed to get updated customer: %w", err)
	}

	// Check if customer should be upgraded/downgraded based on new points
	if err := s.CheckAndUpdateLevel(req.PelangganID, updatedPelanggan.Poin); err != nil {
		// Log error but don't fail the operation
		fmt.Printf("[WARNING] Failed to update level after adding points: %v\n", err)
		// Get customer again after level update attempt
		updatedPelanggan, _ = s.pelangganRepo.GetByID(req.PelangganID)
	}

	return updatedPelanggan, nil
}

// CheckAndUpgradeLevel checks and upgrades/downgrades customer level based on points
// This function supports both upgrade and downgrade based on current points
// NOTE: This function is deprecated, use CheckAndUpdateLevel instead
func (s *PelangganService) CheckAndUpgradeLevel(pelangganID int, poin int, totalBelanja int) error {
	// Delegate to CheckAndUpdateLevel for consistency
	return s.CheckAndUpdateLevel(pelangganID, poin)
}

// ProcessTransaction updates customer stats after a transaction
func (s *PelangganService) ProcessTransaction(pelangganID int, totalBelanja int) error {
	if pelangganID == 0 {
		return nil // Not a registered customer
	}

	// Increment stats
	if err := s.pelangganRepo.IncrementStats(pelangganID, totalBelanja); err != nil {
		return fmt.Errorf("failed to update stats: %w", err)
	}

	// Get point settings
	settings, err := s.settingsRepo.GetPoinSettings()
	if err != nil {
		return fmt.Errorf("failed to get point settings: %w", err)
	}

	// Calculate points based on transaction amount
	// Formula: points = total_transaction / min_transaction_for_points
	// Example: If minTransactionForPoints = 5000
	//   - Transaction Rp 5.000 → 1 point
	//   - Transaction Rp 10.000 → 2 points
	//   - Transaction Rp 50.000 → 10 points
	pointsToAdd := totalBelanja / settings.MinTransactionForPoints
	if pointsToAdd > 0 {
		if err := s.pelangganRepo.AddPoin(pelangganID, pointsToAdd); err != nil {
			return fmt.Errorf("failed to add points: %w", err)
		}

		// Get current customer to check total points
		pelanggan, err := s.pelangganRepo.GetByID(pelangganID)
		if err != nil {
			fmt.Printf("[WARNING] Failed to get customer for level check: %v\n", err)
		} else {
			// Check and update level based on new points total
			if err := s.CheckAndUpdateLevel(pelangganID, pelanggan.Poin); err != nil {
				fmt.Printf("[WARNING] Failed to update level after transaction: %v\n", err)
			}
		}
	}

	return nil
}

// GetPelangganByTipe retrieves customers by type
func (s *PelangganService) GetPelangganByTipe(tipe string) ([]*models.Pelanggan, error) {
	return s.pelangganRepo.GetByTipe(tipe)
}

// UpdatePoin updates customer points with validation and automatic level adjustment
func (s *PelangganService) UpdatePoin(pelangganID int, newPoin int) error {

	// 1. VALIDASI INPUT
	if pelangganID <= 0 {
		return fmt.Errorf("ID pelanggan tidak valid")
	}

	if newPoin < 0 {
		return fmt.Errorf("poin tidak boleh negatif")
	}

	// 2. GET PELANGGAN DATA
	pelanggan, err := s.pelangganRepo.GetByID(pelangganID)
	if err != nil {
		return fmt.Errorf("gagal mengambil data pelanggan: %w", err)
	}
	if pelanggan == nil {
		return fmt.Errorf("pelanggan dengan ID %d tidak ditemukan", pelangganID)
	}

	// 3. VALIDASI PERUBAHAN POIN
	poinSebelum := pelanggan.Poin
	perubahanPoin := newPoin - poinSebelum

	if perubahanPoin == 0 {
		fmt.Printf("[PELANGGAN SERVICE] No points change needed\n")
		return nil
	}

	// 4. UPDATE POIN DI DATABASE
	if err := s.pelangganRepo.UpdatePoin(pelangganID, newPoin); err != nil {
		return fmt.Errorf("gagal update poin di database: %w", err)
	}

	// 5. CHECK AND UPDATE LEVEL OTOMATIS
	if err := s.CheckAndUpdateLevel(pelangganID, newPoin); err != nil {
		// Log error but don't fail the operation
		fmt.Printf("[WARNING] Failed to update level: %v\n", err)
	}

	return nil
}

// CheckAndUpdateLevel checks and updates customer level based on points (supports both upgrade and downgrade)
func (s *PelangganService) CheckAndUpdateLevel(pelangganID int, currentPoin int) error {
	fmt.Printf("[PELANGGAN SERVICE] CheckAndUpdateLevel called - ID: %d, Points: %d\n", pelangganID, currentPoin)

	// 1. GET PELANGGAN DATA
	pelanggan, err := s.pelangganRepo.GetByID(pelangganID)
	if err != nil {
		return fmt.Errorf("gagal mengambil data pelanggan: %w", err)
	}
	if pelanggan == nil {
		return fmt.Errorf("pelanggan tidak ditemukan")
	}

	// 2. GET POINT SETTINGS
	settings, err := s.settingsRepo.GetPoinSettings()
	if err != nil {
		return fmt.Errorf("gagal mengambil pengaturan poin: %w", err)
	}

	// 3. TENTUKAN LEVEL BARU BERDASARKAN POIN
	newLevel := s.calculateLevel(currentPoin, settings)
	oldLevel := pelanggan.Level

	fmt.Printf("[PELANGGAN SERVICE] Level calculation - Points: %d, Old Level: %d, New Level: %d\n",
		currentPoin, oldLevel, newLevel)

	// 4. UPDATE JIKA ADA PERUBAHAN LEVEL
	if newLevel != oldLevel {
		// Get tipe dan diskon berdasarkan level
		tipe, diskonPersen := getLevelInfo(newLevel)

		// Update pelanggan dengan level baru dan diskon baru
		pelanggan.Level = newLevel
		pelanggan.Tipe = tipe
		pelanggan.DiskonPersen = diskonPersen

		if err := s.pelangganRepo.Update(pelanggan); err != nil {
			return fmt.Errorf("gagal update level pelanggan: %w", err)
		}

		// Log level change
		levelNames := map[int]string{1: "Regular", 2: "Premium", 3: "Gold"}
		if newLevel > oldLevel {
			fmt.Printf("[PELANGGAN SERVICE] ✅ Customer %s UPGRADED from %s to %s (points: %d, diskon: %d%%)\n",
				pelanggan.Nama, levelNames[oldLevel], levelNames[newLevel], currentPoin, diskonPersen)
		} else {
			fmt.Printf("[PELANGGAN SERVICE] 🔄 Customer %s DOWNGRADED from %s to %s (points: %d, diskon: %d%%)\n",
				pelanggan.Nama, levelNames[oldLevel], levelNames[newLevel], currentPoin, diskonPersen)
		}
	} else {
		fmt.Printf("[PELANGGAN SERVICE] No level change needed - Level remains: %d\n", oldLevel)
	}

	return nil
}

// calculateLevel determines customer level based on points
func (s *PelangganService) calculateLevel(poin int, settings *models.PoinSettings) int {
	if poin >= settings.Level3MinPoints {
		return 3 // Gold
	} else if poin >= settings.Level2MinPoints {
		return 2 // Premium
	} else {
		return 1 // Regular
	}
}

// UpdatePoinWithReason updates customer points with a specific reason (for audit trail)
func (s *PelangganService) UpdatePoinWithReason(pelangganID int, newPoin int, reason string) error {
	fmt.Printf("[PELANGGAN SERVICE] UpdatePoinWithReason - ID: %d, New Points: %d, Reason: %s\n",
		pelangganID, newPoin, reason)

	if err := s.UpdatePoin(pelangganID, newPoin); err != nil {
		return err
	}

	// Here you can add audit logging for point changes
	fmt.Printf("[AUDIT] Points updated for customer %d: %d points, Reason: %s\n",
		pelangganID, newPoin, reason)

	return nil
}

// ResetPoin resets customer points to zero (for admin purposes)
func (s *PelangganService) ResetPoin(pelangganID int) error {
	fmt.Printf("[PELANGGAN SERVICE] ResetPoin called for ID: %d\n", pelangganID)
	return s.UpdatePoinWithReason(pelangganID, 0, "Reset by admin")
}

// GetPoinHistory retrieves point change history (placeholder - implement based on your needs)
func (s *PelangganService) GetPoinHistory(pelangganID int) ([]map[string]interface{}, error) {
	// Implementasi history perubahan poin bisa ditambahkan di sini
	// Contoh: query ke tabel poin_history jika ada

	fmt.Printf("[PELANGGAN SERVICE] GetPoinHistory called for ID: %d\n", pelangganID)

	// Return empty array for now
	return []map[string]interface{}{}, nil
}

// GetPelangganWithStats retrieves customer with transaction statistics
func (s *PelangganService) GetPelangganWithStats(pelangganID int) (*models.PelangganDetail, error) {
	// Get basic customer info
	pelanggan, err := s.pelangganRepo.GetByID(pelangganID)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer: %w", err)
	}
	if pelanggan == nil {
		return nil, fmt.Errorf("customer not found")
	}

	// Get transaction statistics
	stats, err := s.transaksiRepo.GetStatsByPelangganID(pelangganID)
	if err != nil {
		// If stats not available, use basic info
		stats = &models.PelangganStats{
			TotalTransaksi:  pelanggan.TotalTransaksi,
			TotalBelanja:    pelanggan.TotalBelanja,
			RataRataBelanja: 0,
		}
	}

	// Get transaction history
	transaksiHistory, err := s.transaksiRepo.GetByPelangganID(pelangganID)
	if err != nil {
		// If history not available, use empty array
		transaksiHistory = []*models.Transaksi{}
	}

	return &models.PelangganDetail{
		Pelanggan:        pelanggan,
		Stats:            stats,
		TransaksiHistory: transaksiHistory,
	}, nil
}
