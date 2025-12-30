package service

import (
	"fmt"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

type SettingsService struct {
	settingsRepo *repository.SettingsRepository
}

func NewSettingsService() *SettingsService {
	return &SettingsService{
		settingsRepo: repository.NewSettingsRepository(),
	}
}

// GetPoinSettings retrieves point system settings
func (s *SettingsService) GetPoinSettings() (*models.PoinSettings, error) {
	settings, err := s.settingsRepo.GetPoinSettings()
	if err != nil {
		return nil, fmt.Errorf("failed to get poin settings: %w", err)
	}
	return settings, nil
}

// UpdatePoinSettings updates point system settings dengan validasi lengkap
func (s *SettingsService) UpdatePoinSettings(req *models.UpdatePoinSettingsRequest) (*models.PoinSettings, error) {
	// VALIDASI LENGKAP
	if req.PointValue <= 0 {
		return nil, fmt.Errorf("nilai poin harus lebih besar dari 0")
	}
	if req.MinExchange <= 0 {
		return nil, fmt.Errorf("minimum penukaran poin harus lebih besar dari 0")
	}
	if req.MinTransactionForPoints <= 0 {
		return nil, fmt.Errorf("minimum transaksi untuk poin harus lebih besar dari 0")
	}
	if req.Level2MinPoints <= 0 {
		return nil, fmt.Errorf("minimum poin untuk level 2 harus lebih besar dari 0")
	}
	if req.Level3MinPoints <= req.Level2MinPoints {
		return nil, fmt.Errorf("minimum poin untuk level 3 harus lebih besar dari level 2")
	}

	// Buat settings object
	settings := &models.PoinSettings{
		ID:                      1,
		PointValue:              req.PointValue,
		MinExchange:             req.MinExchange,
		MinTransactionForPoints: req.MinTransactionForPoints,
		Level2MinPoints:         req.Level2MinPoints,
		Level3MinPoints:         req.Level3MinPoints,
		Level2MinSpending:       req.Level2MinSpending, // Legacy, tetap disimpan
		Level3MinSpending:       req.Level3MinSpending, // Legacy, tetap disimpan
	}

	// Update ke database
	err := s.settingsRepo.UpdatePoinSettings(settings)
	if err != nil {
		return nil, fmt.Errorf("gagal update pengaturan poin: %w", err)
	}

	return settings, nil
}
