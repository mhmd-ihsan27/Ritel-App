package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

// KategoriRepository handles database operations for kategori
type KategoriRepository struct{}

// NewKategoriRepository creates a new repository instance
func NewKategoriRepository() *KategoriRepository {
	return &KategoriRepository{}
}

// Create creates a new kategori
func (r *KategoriRepository) Create(kategori *models.Kategori) error {
	query := `
		INSERT INTO kategori (nama, deskripsi, icon, created_at, updated_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id
	`

	var id int64
	err := database.QueryRow(query,
		kategori.Nama,
		kategori.Deskripsi,
		kategori.Icon,
	).Scan(&id)
	if err != nil {
		return fmt.Errorf("failed to create kategori: %w", err)
	}

	kategori.ID = int(id)
	return nil
}

// GetAll retrieves all kategori with product count
func (r *KategoriRepository) GetAll() ([]*models.Kategori, error) {
	query := `
		SELECT
			k.id,
			k.nama,
			k.deskripsi,
			k.icon,
			COUNT(p.id) as jumlah_produk,
			k.created_at,
			k.updated_at
		FROM kategori k
		LEFT JOIN produk p ON p.kategori = k.nama
		GROUP BY k.id
		ORDER BY k.nama ASC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query kategori: %w", err)
	}
	defer rows.Close()

	var kategoris []*models.Kategori
	for rows.Next() {
		var k models.Kategori
		err := rows.Scan(
			&k.ID,
			&k.Nama,
			&k.Deskripsi,
			&k.Icon,
			&k.JumlahProduk,
			&k.CreatedAt,
			&k.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan kategori: %w", err)
		}
		kategoris = append(kategoris, &k)
	}

	return kategoris, nil
}

// GetByID retrieves a kategori by ID
func (r *KategoriRepository) GetByID(id int) (*models.Kategori, error) {
	query := `
		SELECT
			k.id,
			k.nama,
			k.deskripsi,
			k.icon,
			COUNT(p.id) as jumlah_produk,
			k.created_at,
			k.updated_at
		FROM kategori k
		LEFT JOIN produk p ON p.kategori = k.nama
		WHERE k.id = ?
		GROUP BY k.id
	`

	var k models.Kategori
	err := database.QueryRow(query, id).Scan(
		&k.ID,
		&k.Nama,
		&k.Deskripsi,
		&k.Icon,
		&k.JumlahProduk,
		&k.CreatedAt,
		&k.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get kategori: %w", err)
	}

	return &k, nil
}

// GetByNama retrieves a kategori by name
func (r *KategoriRepository) GetByNama(nama string) (*models.Kategori, error) {
	query := `
		SELECT
			k.id,
			k.nama,
			k.deskripsi,
			k.icon,
			COUNT(p.id) as jumlah_produk,
			k.created_at,
			k.updated_at
		FROM kategori k
		LEFT JOIN produk p ON p.kategori = k.nama
		WHERE k.nama = ?
		GROUP BY k.id
	`

	var k models.Kategori
	err := database.QueryRow(query, nama).Scan(
		&k.ID,
		&k.Nama,
		&k.Deskripsi,
		&k.Icon,
		&k.JumlahProduk,
		&k.CreatedAt,
		&k.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get kategori: %w", err)
	}

	return &k, nil
}

// Update updates a kategori
func (r *KategoriRepository) Update(kategori *models.Kategori) error {
	query := `
		UPDATE kategori
		SET nama = ?, deskripsi = ?, icon = ?
		WHERE id = ?
	`

	result, err := database.Exec(query,
		kategori.Nama,
		kategori.Deskripsi,
		kategori.Icon,
		kategori.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update kategori: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("kategori not found")
	}

	return nil
}

// Delete deletes a kategori
func (r *KategoriRepository) Delete(id int) error {
	query := `DELETE FROM kategori WHERE id = ?`

	result, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete kategori: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("kategori not found")
	}

	return nil
}
