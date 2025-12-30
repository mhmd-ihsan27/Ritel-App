package service

import (
	"fmt"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"strings"
	"time"
)

// KategoriService handles business logic for categories
type KategoriService struct {
	kategoriRepo *repository.KategoriRepository
}

// NewKategoriService creates a new instance
func NewKategoriService() *KategoriService {
	return &KategoriService{
		kategoriRepo: repository.NewKategoriRepository(),
	}
}

// CreateKategori creates a new category with validation
func (s *KategoriService) CreateKategori(kategori *models.Kategori) error {
	// Validate required fields
	if strings.TrimSpace(kategori.Nama) == "" {
		return fmt.Errorf("category name is required")
	}

	// Check if name already exists
	existing, err := s.kategoriRepo.GetByNama(kategori.Nama)
	if err != nil {
		return fmt.Errorf("failed to check existing category: %w", err)
	}
	if existing != nil {
		return fmt.Errorf("category with name '%s' already exists", kategori.Nama)
	}

	// Set timestamps
	now := time.Now()
	kategori.CreatedAt = now
	kategori.UpdatedAt = now

	// Create category
	if err := s.kategoriRepo.Create(kategori); err != nil {
		return fmt.Errorf("failed to create category: %w", err)
	}

	return nil
}

// GetAllKategori retrieves all categories
func (s *KategoriService) GetAllKategori() ([]*models.Kategori, error) {
	return s.kategoriRepo.GetAll()
}

// GetKategoriByID retrieves a category by ID
func (s *KategoriService) GetKategoriByID(id int) (*models.Kategori, error) {
	kategori, err := s.kategoriRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	if kategori == nil {
		return nil, fmt.Errorf("category not found")
	}
	return kategori, nil
}

// UpdateKategori updates a category
func (s *KategoriService) UpdateKategori(kategori *models.Kategori) error {
	// Validate required fields
	if strings.TrimSpace(kategori.Nama) == "" {
		return fmt.Errorf("category name is required")
	}

	// Check if category exists
	existing, err := s.kategoriRepo.GetByID(kategori.ID)
	if err != nil {
		return fmt.Errorf("failed to check existing category: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("category not found")
	}

	// Check if new name conflicts with another category
	if existing.Nama != kategori.Nama {
		nameCheck, err := s.kategoriRepo.GetByNama(kategori.Nama)
		if err != nil {
			return fmt.Errorf("failed to check category name: %w", err)
		}
		if nameCheck != nil {
			return fmt.Errorf("category with name '%s' already exists", kategori.Nama)
		}
	}

	// Update category
	if err := s.kategoriRepo.Update(kategori); err != nil {
		return fmt.Errorf("failed to update category: %w", err)
	}

	return nil
}

// DeleteKategori deletes a category
func (s *KategoriService) DeleteKategori(id int) error {
	// Check if category exists
	kategori, err := s.kategoriRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("failed to check existing category: %w", err)
	}
	if kategori == nil {
		return fmt.Errorf("category not found")
	}

	// Check if category has products
	if kategori.JumlahProduk > 0 {
		return fmt.Errorf("cannot delete category with %d products", kategori.JumlahProduk)
	}

	// Delete category
	if err := s.kategoriRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	return nil
}
