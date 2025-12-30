package repository

import (
	"database/sql"
	"fmt"
	"log"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
	"time"
)

// ProdukRepository handles database operations for products
type ProdukRepository struct{}

// NewProdukRepository creates a new instance
func NewProdukRepository() *ProdukRepository {
	return &ProdukRepository{}
}

// Create inserts a new product
func (r *ProdukRepository) Create(produk *models.Produk) error {
	query := `
		INSERT INTO produk (
			sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
			stok, satuan, jenis_produk, kadaluarsa, tanggal_masuk, deskripsi, gambar,
			hari_pemberitahuan_kadaluarsa, masa_simpan_hari
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
	`

	var id int64
	err := database.QueryRow(
		query,
		produk.SKU,
		produk.Barcode,
		produk.Nama,
		produk.Kategori,
		produk.Berat,
		produk.HargaBeli,
		produk.HargaJual,
		produk.Stok,
		produk.Satuan,
		produk.JenisProduk,
		produk.Kadaluarsa,
		produk.TanggalMasuk,
		produk.Deskripsi,
		produk.Gambar,
		produk.HariPemberitahuanKadaluarsa,
		produk.MasaSimpanHari,
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("failed to insert product: %w", err)
	}

	produk.ID = int(id)
	produk.CreatedAt = time.Now()
	produk.UpdatedAt = time.Now()

	return nil
}

// GetByBarcode retrieves a product by barcode (excluding soft-deleted)
func (r *ProdukRepository) GetByBarcode(barcode string) (*models.Produk, error) {
	query := `
		SELECT id, sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
		       stok, satuan, jenis_produk, kadaluarsa, tanggal_masuk, deskripsi, gambar,
		       hari_pemberitahuan_kadaluarsa, masa_simpan_hari,
		       created_at, updated_at
		FROM produk
		WHERE barcode = ? AND deleted_at IS NULL
	`

	produk := &models.Produk{}
	var barcodeNull, kadaluarsa, tanggalMasuk, gambar, jenisProduk sql.NullString

	err := database.QueryRow(query, barcode).Scan(
		&produk.ID,
		&produk.SKU,
		&barcodeNull,
		&produk.Nama,
		&produk.Kategori,
		&produk.Berat,
		&produk.HargaBeli,
		&produk.HargaJual,
		&produk.Stok,
		&produk.Satuan,
		&jenisProduk,
		&kadaluarsa,
		&tanggalMasuk,
		&produk.Deskripsi,
		&gambar,
		&produk.HariPemberitahuanKadaluarsa,
		&produk.MasaSimpanHari,
		&produk.CreatedAt,
		&produk.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product by barcode: %w", err)
	}

	if barcodeNull.Valid {
		produk.Barcode = barcodeNull.String
	}
	if jenisProduk.Valid {
		produk.JenisProduk = jenisProduk.String
	} else {
		produk.JenisProduk = "curah" // Default untuk backward compatibility
	}
	if kadaluarsa.Valid {
		produk.Kadaluarsa = kadaluarsa.String
	}
	if tanggalMasuk.Valid {
		produk.TanggalMasuk = tanggalMasuk.String
	}
	if gambar.Valid {
		produk.Gambar = gambar.String
	}

	return produk, nil
}

// GetBySKU retrieves a product by SKU (excluding soft-deleted)
func (r *ProdukRepository) GetBySKU(sku string) (*models.Produk, error) {
	query := `
		SELECT id, sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
		       stok, satuan, jenis_produk, kadaluarsa, tanggal_masuk, deskripsi, gambar,
		       hari_pemberitahuan_kadaluarsa, masa_simpan_hari,
		       created_at, updated_at
		FROM produk
		WHERE sku = ? AND deleted_at IS NULL
	`

	produk := &models.Produk{}
	var barcodeNull, kadaluarsa, tanggalMasuk, gambar, jenisProduk sql.NullString

	err := database.QueryRow(query, sku).Scan(
		&produk.ID,
		&produk.SKU,
		&barcodeNull,
		&produk.Nama,
		&produk.Kategori,
		&produk.Berat,
		&produk.HargaBeli,
		&produk.HargaJual,
		&produk.Stok,
		&produk.Satuan,
		&jenisProduk,
		&kadaluarsa,
		&tanggalMasuk,
		&produk.Deskripsi,
		&gambar,
		&produk.HariPemberitahuanKadaluarsa,
		&produk.MasaSimpanHari,
		&produk.CreatedAt,
		&produk.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product by SKU: %w", err)
	}

	if barcodeNull.Valid {
		produk.Barcode = barcodeNull.String
	}
	if jenisProduk.Valid {
		produk.JenisProduk = jenisProduk.String
	} else {
		produk.JenisProduk = "curah" // Default untuk backward compatibility
	}
	if kadaluarsa.Valid {
		produk.Kadaluarsa = kadaluarsa.String
	}
	if tanggalMasuk.Valid {
		produk.TanggalMasuk = tanggalMasuk.String
	}
	if gambar.Valid {
		produk.Gambar = gambar.String
	}

	return produk, nil
}

// GetAll retrieves all products (excluding soft-deleted)
func (r *ProdukRepository) GetAll() ([]*models.Produk, error) {
	query := `
		SELECT id, sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
		       stok, satuan, jenis_produk, kadaluarsa, tanggal_masuk, deskripsi, gambar,
		       hari_pemberitahuan_kadaluarsa, masa_simpan_hari,
		       created_at, updated_at
		FROM produk
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get all products: %w", err)
	}
	defer rows.Close()

	var products []*models.Produk

	for rows.Next() {
		produk := &models.Produk{}
		var barcodeNull, kadaluarsa, tanggalMasuk, gambar, jenisProduk sql.NullString

		err := rows.Scan(
			&produk.ID,
			&produk.SKU,
			&barcodeNull,
			&produk.Nama,
			&produk.Kategori,
			&produk.Berat,
			&produk.HargaBeli,
			&produk.HargaJual,
			&produk.Stok,
			&produk.Satuan,
			&jenisProduk,
			&kadaluarsa,
			&tanggalMasuk,
			&produk.Deskripsi,
			&gambar,
			&produk.HariPemberitahuanKadaluarsa,
			&produk.MasaSimpanHari,
			&produk.CreatedAt,
			&produk.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}

		if barcodeNull.Valid {
			produk.Barcode = barcodeNull.String
		}
		if jenisProduk.Valid {
			produk.JenisProduk = jenisProduk.String
		} else {
			produk.JenisProduk = "curah" // Default untuk backward compatibility
		}
		if kadaluarsa.Valid {
			produk.Kadaluarsa = kadaluarsa.String
		}
		if tanggalMasuk.Valid {
			produk.TanggalMasuk = tanggalMasuk.String
		}
		if gambar.Valid {
			produk.Gambar = gambar.String
		}

		products = append(products, produk)
	}

	return products, nil
}

func (r *ProdukRepository) CreateStokHistory(history *models.StokHistory) error {
	query := `
        INSERT INTO stok_history (
            produk_id, stok_sebelum, stok_sesudah, perubahan,
            jenis_perubahan, keterangan, tipe_kerugian, nilai_kerugian
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

	_, err := database.Exec(
		query,
		history.ProdukID,
		history.StokSebelum,
		history.StokSesudah,
		history.Perubahan,
		history.JenisPerubahan,
		history.Keterangan,
		history.TipeKerugian,
		history.NilaiKerugian,
	)

	if err != nil {
		return fmt.Errorf("failed to create stock history: %w", err)
	}

	return nil
}

// GetByID retrieves a product by ID (excluding soft-deleted)
func (r *ProdukRepository) GetByID(id int) (*models.Produk, error) {
	query := `
        SELECT id, sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
               stok, satuan, jenis_produk, kadaluarsa, tanggal_masuk, deskripsi, gambar,
               hari_pemberitahuan_kadaluarsa, masa_simpan_hari,
               created_at, updated_at
        FROM produk
        WHERE id = ? AND deleted_at IS NULL
    `

	produk := &models.Produk{}
	var barcodeNull, kadaluarsa, tanggalMasuk, gambar, jenisProduk sql.NullString

	err := database.QueryRow(query, id).Scan(
		&produk.ID,
		&produk.SKU,
		&barcodeNull,
		&produk.Nama,
		&produk.Kategori,
		&produk.Berat,
		&produk.HargaBeli,
		&produk.HargaJual,
		&produk.Stok,
		&produk.Satuan,
		&jenisProduk,
		&kadaluarsa,
		&tanggalMasuk,
		&produk.Deskripsi,
		&gambar,
		&produk.HariPemberitahuanKadaluarsa,
		&produk.MasaSimpanHari,
		&produk.CreatedAt,
		&produk.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product by ID: %w", err)
	}

	if barcodeNull.Valid {
		produk.Barcode = barcodeNull.String
	}
	if jenisProduk.Valid {
		produk.JenisProduk = jenisProduk.String
	} else {
		produk.JenisProduk = "curah" // Default untuk backward compatibility
	}
	if kadaluarsa.Valid {
		produk.Kadaluarsa = kadaluarsa.String
	}
	if tanggalMasuk.Valid {
		produk.TanggalMasuk = tanggalMasuk.String
	}
	if gambar.Valid {
		produk.Gambar = gambar.String
	}

	return produk, nil
}

func (r *ProdukRepository) GetStokHistory(produkID int) ([]*models.StokHistory, error) {
	log.Printf("[REPO] GetStokHistory called for produk_id=%d", produkID)

	query := `
        SELECT id, produk_id, stok_sebelum, stok_sesudah, perubahan,
               jenis_perubahan, keterangan, tipe_kerugian, nilai_kerugian, created_at
        FROM stok_history
        WHERE produk_id = ?
        ORDER BY created_at DESC
    `

	rows, err := database.Query(query, produkID)
	if err != nil {
		log.Printf("[REPO] ❌ Error querying stock history for produk_id=%d: %v", produkID, err)
		return nil, fmt.Errorf("failed to get stock history: %w", err)
	}
	defer rows.Close()

	var history []*models.StokHistory
	for rows.Next() {
		var h models.StokHistory
		var tipeKerugian sql.NullString
		var nilaiKerugianRaw interface{} // Use interface{} to handle both string and int

		err := rows.Scan(
			&h.ID,
			&h.ProdukID,
			&h.StokSebelum,
			&h.StokSesudah,
			&h.Perubahan,
			&h.JenisPerubahan,
			&h.Keterangan,
			&tipeKerugian,
			&nilaiKerugianRaw,
			&h.CreatedAt,
		)
		if err != nil {
			log.Printf("[REPO] ❌ Error scanning stock history row for produk_id=%d: %v", produkID, err)
			return nil, fmt.Errorf("failed to scan stock history: %w", err)
		}

		if tipeKerugian.Valid {
			h.TipeKerugian = tipeKerugian.String
		}

		// Handle nilai_kerugian which might be int, string, or NULL
		if nilaiKerugianRaw != nil {
			switch v := nilaiKerugianRaw.(type) {
			case int64:
				h.NilaiKerugian = int(v)
			case string:
				// If it's a string (invalid data), try to parse or default to 0
				log.Printf("[REPO] ⚠️ Invalid nilai_kerugian (string): '%s' for produk_id=%d, defaulting to 0", v, produkID)
				h.NilaiKerugian = 0
			case []byte:
				// SQLite might return as []byte
				log.Printf("[REPO] ⚠️ Invalid nilai_kerugian (bytes): '%s' for produk_id=%d, defaulting to 0", string(v), produkID)
				h.NilaiKerugian = 0
			default:
				h.NilaiKerugian = 0
			}
		}

		history = append(history, &h)
	}

	log.Printf("[REPO] ✅ GetStokHistory success: %d records found for produk_id=%d", len(history), produkID)
	return history, nil
}

func (r *ProdukRepository) Update(produk *models.Produk) error {
	query := `
		UPDATE produk SET
			sku = ?, barcode = ?, nama = ?, kategori = ?,
			berat = ?, harga_beli = ?, harga_jual = ?,
			stok = ?, satuan = ?, jenis_produk = ?, kadaluarsa = ?,
			tanggal_masuk = ?, deskripsi = ?, gambar = ?,
			hari_pemberitahuan_kadaluarsa = ?, masa_simpan_hari = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	result, err := database.Exec(
		query,
		produk.SKU,
		produk.Barcode,
		produk.Nama,
		produk.Kategori,
		produk.Berat,
		produk.HargaBeli,
		produk.HargaJual,
		produk.Stok,
		produk.Satuan,
		produk.JenisProduk,
		produk.Kadaluarsa,
		produk.TanggalMasuk,
		produk.Deskripsi,
		produk.Gambar,
		produk.HariPemberitahuanKadaluarsa,
		produk.MasaSimpanHari,
		produk.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// Delete deletes a product
// Delete soft-deletes a product (sets deleted_at timestamp)
// This preserves all related data: batches, stock history, transactions, etc.
func (r *ProdukRepository) Delete(id int) error {
	// Validate ID
	if id <= 0 {
		return fmt.Errorf("ID produk tidak valid")
	}

	query := `
		UPDATE produk
		SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND deleted_at IS NULL
	`

	result, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("gagal menghapus produk: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("gagal memeriksa hasil penghapusan: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("produk dengan ID %d tidak ditemukan atau sudah dihapus", id)
	}

	log.Printf("Successfully soft-deleted product ID %d. All related data (batches, history, etc.) preserved.", id)

	return nil
}

// Restore restores a soft-deleted product
func (r *ProdukRepository) Restore(id int) error {
	query := `
		UPDATE produk
		SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND deleted_at IS NOT NULL
	`

	result, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("gagal me-restore produk: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("gagal memeriksa hasil restore: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("produk dengan ID %d tidak ditemukan atau tidak dihapus", id)
	}

	log.Printf("Successfully restored product ID %d", id)

	return nil
}

// GetDeleted retrieves all soft-deleted products (for admin/audit purposes)
func (r *ProdukRepository) GetDeleted() ([]*models.Produk, error) {
	query := `
		SELECT id, sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
		       stok, satuan, jenis_produk, kadaluarsa, tanggal_masuk, deskripsi, gambar,
		       hari_pemberitahuan_kadaluarsa, masa_simpan_hari,
		       created_at, updated_at
		FROM produk
		WHERE deleted_at IS NOT NULL
		ORDER BY deleted_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query deleted products: %w", err)
	}
	defer rows.Close()

	var produks []*models.Produk
	for rows.Next() {
		produk := &models.Produk{}
		var barcodeNull, kadaluarsa, tanggalMasuk, gambar, jenisProduk sql.NullString

		err := rows.Scan(
			&produk.ID,
			&produk.SKU,
			&barcodeNull,
			&produk.Nama,
			&produk.Kategori,
			&produk.Berat,
			&produk.HargaBeli,
			&produk.HargaJual,
			&produk.Stok,
			&produk.Satuan,
			&jenisProduk,
			&kadaluarsa,
			&tanggalMasuk,
			&produk.Deskripsi,
			&gambar,
			&produk.HariPemberitahuanKadaluarsa,
			&produk.MasaSimpanHari,
			&produk.CreatedAt,
			&produk.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}

		if barcodeNull.Valid {
			produk.Barcode = barcodeNull.String
		}
		if kadaluarsa.Valid {
			produk.Kadaluarsa = kadaluarsa.String
		}
		if tanggalMasuk.Valid {
			produk.TanggalMasuk = tanggalMasuk.String
		}
		if gambar.Valid {
			produk.Gambar = gambar.String
		}
		if jenisProduk.Valid {
			produk.JenisProduk = jenisProduk.String
		}

		produks = append(produks, produk)
	}

	return produks, nil
}

func (r *ProdukRepository) UpdateStok(id int, stok float64) error {
	query := `UPDATE produk SET stok = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

	_, err := database.Exec(query, stok, id)
	if err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}

	return nil
}

// UpdateStokIncrement updates stock by increment/decrement
func (r *ProdukRepository) UpdateStokIncrement(id int, perubahan float64) error {
	query := `UPDATE produk SET stok = stok + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`

	_, err := database.Exec(query, perubahan, id)
	if err != nil {
		return fmt.Errorf("failed to update stock increment: %w", err)
	}

	return nil
}
