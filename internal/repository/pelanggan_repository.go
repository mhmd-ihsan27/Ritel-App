package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

// PelangganRepository handles database operations for pelanggan
type PelangganRepository struct{}

// NewPelangganRepository creates a new repository instance
func NewPelangganRepository() *PelangganRepository {
	return &PelangganRepository{}
}

// Create creates a new pelanggan
func (r *PelangganRepository) Create(pelanggan *models.Pelanggan) error {
	query := `
        INSERT INTO pelanggan (
            nama, telepon, email, alamat, level, tipe, poin, diskon_persen,
            total_transaksi, total_belanja, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
    `

	var id int64
	err := database.QueryRow(query,
		pelanggan.Nama,
		pelanggan.Telepon,
		pelanggan.Email,
		pelanggan.Alamat,
		pelanggan.Level,
		pelanggan.Tipe,
		pelanggan.Poin,
		pelanggan.DiskonPersen,
		pelanggan.TotalTransaksi,
		pelanggan.TotalBelanja,
		pelanggan.CreatedAt,
		pelanggan.UpdatedAt,
	).Scan(&id)
	if err != nil {
		return fmt.Errorf("failed to create pelanggan: %w", err)
	}

	pelanggan.ID = int(id)
	return nil
}

// GetAll retrieves all pelanggan (excluding soft-deleted)
func (r *PelangganRepository) GetAll() ([]*models.Pelanggan, error) {
	query := `
		SELECT
			id, nama, telepon, email, alamat, level, tipe, poin, diskon_persen,
			total_transaksi, total_belanja, created_at, updated_at
		FROM pelanggan
		WHERE deleted_at IS NULL
		ORDER BY nama ASC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query pelanggan: %w", err)
	}
	defer rows.Close()

	var pelanggans []*models.Pelanggan
	for rows.Next() {
		var p models.Pelanggan
		var email, alamat sql.NullString
		var level, diskonPersen sql.NullInt64

		err := rows.Scan(
			&p.ID,
			&p.Nama,
			&p.Telepon,
			&email,
			&alamat,
			&level,
			&p.Tipe,
			&p.Poin,
			&diskonPersen,
			&p.TotalTransaksi,
			&p.TotalBelanja,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pelanggan: %w", err)
		}

		if email.Valid {
			p.Email = email.String
		}
		if alamat.Valid {
			p.Alamat = alamat.String
		}
		if level.Valid {
			p.Level = int(level.Int64)
		} else {
			p.Level = 1 // default
		}
		if diskonPersen.Valid {
			p.DiskonPersen = int(diskonPersen.Int64)
		}

		pelanggans = append(pelanggans, &p)
	}

	return pelanggans, nil
}

// GetByID retrieves a pelanggan by ID
func (r *PelangganRepository) GetByID(id int) (*models.Pelanggan, error) {
	query := `
		SELECT
			id, nama, telepon, email, alamat, level, tipe, poin, diskon_persen,
			total_transaksi, total_belanja, created_at, updated_at
		FROM pelanggan
		WHERE id = ? AND deleted_at IS NULL
	`

	var p models.Pelanggan
	var email, alamat sql.NullString
	var level, diskonPersen sql.NullInt64

	err := database.QueryRow(query, id).Scan(
		&p.ID,
		&p.Nama,
		&p.Telepon,
		&email,
		&alamat,
		&level,
		&p.Tipe,
		&p.Poin,
		&diskonPersen,
		&p.TotalTransaksi,
		&p.TotalBelanja,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get pelanggan: %w", err)
	}

	if email.Valid {
		p.Email = email.String
	}
	if alamat.Valid {
		p.Alamat = alamat.String
	}
	if level.Valid {
		p.Level = int(level.Int64)
	} else {
		p.Level = 1
	}
	if diskonPersen.Valid {
		p.DiskonPersen = int(diskonPersen.Int64)
	}

	return &p, nil
}

// GetByTelepon retrieves a pelanggan by phone number (excluding soft-deleted)
func (r *PelangganRepository) GetByTelepon(telepon string) (*models.Pelanggan, error) {
	query := `
		SELECT
			id, nama, telepon, email, alamat, level, tipe, poin, diskon_persen,
			total_transaksi, total_belanja, created_at, updated_at
		FROM pelanggan
		WHERE telepon = ? AND deleted_at IS NULL
	`

	var p models.Pelanggan
	var email, alamat sql.NullString
	var level, diskonPersen sql.NullInt64

	err := database.QueryRow(query, telepon).Scan(
		&p.ID,
		&p.Nama,
		&p.Telepon,
		&email,
		&alamat,
		&level,
		&p.Tipe,
		&p.Poin,
		&diskonPersen,
		&p.TotalTransaksi,
		&p.TotalBelanja,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get pelanggan: %w", err)
	}

	if email.Valid {
		p.Email = email.String
	}
	if alamat.Valid {
		p.Alamat = alamat.String
	}
	if level.Valid {
		p.Level = int(level.Int64)
	} else {
		p.Level = 1
	}
	if diskonPersen.Valid {
		p.DiskonPersen = int(diskonPersen.Int64)
	}

	return &p, nil
}

// Update updates a pelanggan
func (r *PelangganRepository) Update(pelanggan *models.Pelanggan) error {
	query := `
        UPDATE pelanggan
        SET
            nama = ?,
            telepon = ?,
            email = ?,
            alamat = ?,
            level = ?,
            tipe = ?,
            diskon_persen = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `

	result, err := database.Exec(query,
		pelanggan.Nama,
		pelanggan.Telepon,
		pelanggan.Email,
		pelanggan.Alamat,
		pelanggan.Level,
		pelanggan.Tipe,
		pelanggan.DiskonPersen,
		pelanggan.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update pelanggan: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found")
	}

	return nil
}

// UpdatePoin updates pelanggan points
func (r *PelangganRepository) UpdatePoin(id int, poin int) error {
	query := `
		UPDATE pelanggan
		SET poin = ?
		WHERE id = ?
	`

	result, err := database.Exec(query, poin, id)
	if err != nil {
		return fmt.Errorf("failed to update poin: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found")
	}

	return nil
}

// AddPoin adds points to pelanggan
func (r *PelangganRepository) AddPoin(id int, poin int) error {
	query := `
		UPDATE pelanggan
		SET poin = poin + ?
		WHERE id = ?
	`

	result, err := database.Exec(query, poin, id)
	if err != nil {
		return fmt.Errorf("failed to add poin: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found")
	}

	return nil
}

// UpdateStats updates pelanggan transaction statistics
func (r *PelangganRepository) UpdateStats(id int, totalTransaksi int, totalBelanja int) error {
	query := `
		UPDATE pelanggan
		SET total_transaksi = ?, total_belanja = ?
		WHERE id = ?
	`

	result, err := database.Exec(query, totalTransaksi, totalBelanja, id)
	if err != nil {
		return fmt.Errorf("failed to update stats: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found")
	}

	return nil
}

// IncrementStats increments pelanggan transaction statistics
func (r *PelangganRepository) IncrementStats(id int, totalBelanja int) error {
	query := `
		UPDATE pelanggan
		SET total_transaksi = total_transaksi + 1,
		    total_belanja = total_belanja + ?
		WHERE id = ?
	`

	result, err := database.Exec(query, totalBelanja, id)
	if err != nil {
		return fmt.Errorf("failed to increment stats: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found")
	}

	return nil
}

// Delete soft-deletes a pelanggan (sets deleted_at timestamp)
func (r *PelangganRepository) Delete(id int) error {
	query := `
		UPDATE pelanggan
		SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND deleted_at IS NULL
	`

	result, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete pelanggan: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found or already deleted")
	}

	return nil
}

// Restore restores a soft-deleted pelanggan
func (r *PelangganRepository) Restore(id int) error {
	query := `
		UPDATE pelanggan
		SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND deleted_at IS NOT NULL
	`

	result, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to restore pelanggan: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found or not deleted")
	}

	return nil
}

// GetDeleted retrieves all soft-deleted pelanggan (for admin/audit purposes)
func (r *PelangganRepository) GetDeleted() ([]*models.Pelanggan, error) {
	query := `
		SELECT
			id, nama, telepon, email, alamat, level, tipe, poin,
			total_transaksi, total_belanja, created_at, updated_at
		FROM pelanggan
		WHERE deleted_at IS NOT NULL
		ORDER BY deleted_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query deleted pelanggan: %w", err)
	}
	defer rows.Close()

	var pelanggans []*models.Pelanggan
	for rows.Next() {
		var p models.Pelanggan
		var email, alamat sql.NullString
		var level sql.NullInt64

		err := rows.Scan(
			&p.ID,
			&p.Nama,
			&p.Telepon,
			&email,
			&alamat,
			&level,
			&p.Tipe,
			&p.Poin,
			&p.TotalTransaksi,
			&p.TotalBelanja,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pelanggan: %w", err)
		}

		if email.Valid {
			p.Email = email.String
		}
		if alamat.Valid {
			p.Alamat = alamat.String
		}
		if level.Valid {
			p.Level = int(level.Int64)
		} else {
			p.Level = 1
		}

		pelanggans = append(pelanggans, &p)
	}

	return pelanggans, nil
}

// GetByTipe retrieves all pelanggan by type (excluding soft-deleted)
func (r *PelangganRepository) GetByTipe(tipe string) ([]*models.Pelanggan, error) {
	query := `
		SELECT
			id, nama, telepon, email, alamat, level, tipe, poin,
			total_transaksi, total_belanja, created_at, updated_at
		FROM pelanggan
		WHERE tipe = ? AND deleted_at IS NULL
		ORDER BY nama ASC
	`

	rows, err := database.Query(query, tipe)
	if err != nil {
		return nil, fmt.Errorf("failed to query pelanggan by tipe: %w", err)
	}
	defer rows.Close()

	var pelanggans []*models.Pelanggan
	for rows.Next() {
		var p models.Pelanggan
		var email, alamat sql.NullString
		var level sql.NullInt64

		err := rows.Scan(
			&p.ID,
			&p.Nama,
			&p.Telepon,
			&email,
			&alamat,
			&level,
			&p.Tipe,
			&p.Poin,
			&p.TotalTransaksi,
			&p.TotalBelanja,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pelanggan: %w", err)
		}

		if email.Valid {
			p.Email = email.String
		}
		if alamat.Valid {
			p.Alamat = alamat.String
		}
		if level.Valid {
			p.Level = int(level.Int64)
		} else {
			p.Level = 1
		}

		pelanggans = append(pelanggans, &p)
	}

	return pelanggans, nil
}

// UpdatePointsAndSpending updates customer points and total spending (for returns)
func (r *PelangganRepository) UpdatePointsAndSpending(pelangganID int, newPoints int, newTotalSpending int) error {
	query := `
		UPDATE pelanggan
		SET poin = ?, total_belanja = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	result, err := database.Exec(query, newPoints, newTotalSpending, pelangganID)
	if err != nil {
		return fmt.Errorf("failed to update customer points and spending: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("pelanggan not found")
	}

	return nil
}
