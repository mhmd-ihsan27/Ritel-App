package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
	"time"
)

// PromoRepository handles database operations for promo
type PromoRepository struct{}

// NewPromoRepository creates a new repository instance
func NewPromoRepository() *PromoRepository {
	return &PromoRepository{}
}

func (r *PromoRepository) Create(promo *models.Promo) error {
	query := `
        INSERT INTO promo (
            nama, kode, tipe, tipe_promo, tipe_produk_berlaku, nilai, min_quantity, max_diskon,
            tanggal_mulai, tanggal_selesai, status, deskripsi,
            buy_quantity, get_quantity, tipe_buy_get,
            harga_bundling, tipe_bundling, diskon_bundling,
            produk_x, produk_y,
            created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id
    `

	var produkX, produkY interface{}
	if promo.ProdukXID > 0 {
		produkX = promo.ProdukXID
	} else {
		produkX = nil
	}
	if promo.ProdukYID > 0 {
		produkY = promo.ProdukYID
	} else {
		produkY = nil
	}

	var id int64
	err := database.QueryRow(query,
		promo.Nama,
		promo.Kode,
		promo.Tipe,
		promo.TipePromo,
		promo.TipeProdukBerlaku,
		promo.Nilai,
		promo.MinQuantity, // PASTIKAN INI
		promo.MaxDiskon,
		promo.TanggalMulai,
		promo.TanggalSelesai,
		promo.Status,
		promo.Deskripsi,
		promo.BuyQuantity,
		promo.GetQuantity,
		promo.TipeBuyGet,
		promo.HargaBundling,
		promo.TipeBundling,
		promo.DiskonBundling,
		produkX,
		produkY,
	).Scan(&id)
	if err != nil {
		return fmt.Errorf("failed to create promo: %w", err)
	}

	promo.ID = int(id)
	return nil
}

// GetAll retrieves all promos with product information
func (r *PromoRepository) GetAll() ([]*models.Promo, error) {
	query := `
		SELECT
			p.id, p.nama, p.kode, p.tipe, p.tipe_promo, p.tipe_produk_berlaku, p.nilai, p.min_quantity, p.max_diskon,
			p.tanggal_mulai, p.tanggal_selesai, p.status, p.deskripsi,
			p.buy_quantity, p.get_quantity, p.tipe_buy_get,
			p.harga_bundling, p.tipe_bundling, p.diskon_bundling,
			p.produk_x, p.produk_y,
			p.created_at, p.updated_at,
			px.id as px_id, px.nama as px_nama, px.harga_jual as px_harga,
			py.id as py_id, py.nama as py_nama, py.harga_jual as py_harga
		FROM promo p
		LEFT JOIN produk px ON p.produk_x = px.id
		LEFT JOIN produk py ON p.produk_y = py.id
		ORDER BY p.created_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query promo: %w", err)
	}
	defer rows.Close()

	var promos []*models.Promo
	for rows.Next() {
		var p models.Promo
		var kode, deskripsi, tipePromo, tipeProdukBerlaku, tipeBuyGet, tipeBundling sql.NullString
		var tanggalMulai, tanggalSelesai sql.NullTime
		var produkXID, produkYID sql.NullInt64
		var produkXNama, produkXHarga, produkYNama, produkYHarga sql.NullString

		err := rows.Scan(
			&p.ID,
			&p.Nama,
			&kode,
			&p.Tipe,
			&tipePromo,
			&tipeProdukBerlaku,
			&p.Nilai,
			&p.MinQuantity,
			&p.MaxDiskon,
			&tanggalMulai,
			&tanggalSelesai,
			&p.Status,
			&deskripsi,
			&p.BuyQuantity,
			&p.GetQuantity,
			&tipeBuyGet,
			&p.HargaBundling,
			&tipeBundling,
			&p.DiskonBundling,
			&produkXID,
			&produkYID,
			&p.CreatedAt,
			&p.UpdatedAt,
			&produkXID,
			&produkXNama,
			&produkXHarga,
			&produkYID,
			&produkYNama,
			&produkYHarga,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan promo: %w", err)
		}

		if kode.Valid {
			p.Kode = kode.String
		}
		if deskripsi.Valid {
			p.Deskripsi = deskripsi.String
		}
		if tipePromo.Valid {
			p.TipePromo = tipePromo.String
		}
		if tipeProdukBerlaku.Valid {
			p.TipeProdukBerlaku = tipeProdukBerlaku.String
		}
		if tipeBuyGet.Valid {
			p.TipeBuyGet = tipeBuyGet.String
		}
		if tipeBundling.Valid {
			p.TipeBundling = tipeBundling.String
		}
		if tanggalMulai.Valid {
			p.TanggalMulai = tanggalMulai.Time
		}
		if tanggalSelesai.Valid {
			p.TanggalSelesai = tanggalSelesai.Time
		}

		// Set produk X jika ada
		if produkXID.Valid && produkXNama.Valid {
			p.ProdukX = &models.Produk{
				ID:        int(produkXID.Int64),
				Nama:      produkXNama.String,
				HargaJual: parseInt(produkXHarga.String),
			}
		}

		// Set produk Y jika ada
		if produkYID.Valid && produkYNama.Valid {
			p.ProdukY = &models.Produk{
				ID:        int(produkYID.Int64),
				Nama:      produkYNama.String,
				HargaJual: parseInt(produkYHarga.String),
			}
		}

		promos = append(promos, &p)
	}

	return promos, nil
}

func (r *PromoRepository) GetByID(id int) (*models.Promo, error) {
	query := `
        SELECT
            p.id, p.nama, p.kode, p.tipe, p.tipe_promo, p.tipe_produk_berlaku, p.nilai, p.min_quantity, p.max_diskon,
            p.tanggal_mulai, p.tanggal_selesai, p.status, p.deskripsi,
            p.buy_quantity, p.get_quantity, p.tipe_buy_get,
            p.harga_bundling, p.tipe_bundling, p.diskon_bundling,
            p.produk_x, p.produk_y,
            p.created_at, p.updated_at,
            px.id as px_id, px.nama as px_nama, px.harga_jual as px_harga,
            py.id as py_id, py.nama as py_nama, py.harga_jual as py_harga
        FROM promo p
        LEFT JOIN produk px ON p.produk_x = px.id
        LEFT JOIN produk py ON p.produk_y = py.id
        WHERE p.id = ?
    `

	var p models.Promo
	var kode, deskripsi, tipePromo, tipeProdukBerlaku, tipeBuyGet, tipeBundling sql.NullString
	var tanggalMulai, tanggalSelesai sql.NullTime
	var produkXID, produkYID sql.NullInt64
	var produkXNama, produkXHarga, produkYNama, produkYHarga sql.NullString
	var minQuantity sql.NullInt64 // TAMBAH INI

	err := database.QueryRow(query, id).Scan(
		&p.ID,
		&p.Nama,
		&kode,
		&p.Tipe,
		&tipePromo,
		&tipeProdukBerlaku,
		&p.Nilai,
		&minQuantity, // TAMBAH INI
		&p.MaxDiskon,
		&tanggalMulai,
		&tanggalSelesai,
		&p.Status,
		&deskripsi,
		&p.BuyQuantity,
		&p.GetQuantity,
		&tipeBuyGet,
		&p.HargaBundling,
		&tipeBundling,
		&p.DiskonBundling,
		&produkXID,
		&produkYID,
		&p.CreatedAt,
		&p.UpdatedAt,
		&produkXID, // Duplicate but needed for product data
		&produkXNama,
		&produkXHarga,
		&produkYID, // Duplicate but needed for product data
		&produkYNama,
		&produkYHarga,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}

	// Set nullable fields
	if kode.Valid {
		p.Kode = kode.String
	}
	if deskripsi.Valid {
		p.Deskripsi = deskripsi.String
	}
	if tipePromo.Valid {
		p.TipePromo = tipePromo.String
	}
	if tipeProdukBerlaku.Valid {
		p.TipeProdukBerlaku = tipeProdukBerlaku.String
	}
	if tipeBuyGet.Valid {
		p.TipeBuyGet = tipeBuyGet.String
	}
	if tipeBundling.Valid {
		p.TipeBundling = tipeBundling.String
	}
	if tanggalMulai.Valid {
		p.TanggalMulai = tanggalMulai.Time
	}
	if tanggalSelesai.Valid {
		p.TanggalSelesai = tanggalSelesai.Time
	}
	if minQuantity.Valid { // TAMBAH INI
		p.MinQuantity = int(minQuantity.Int64)
	}

	// Set produk X jika ada
	if produkXID.Valid && produkXNama.Valid {
		p.ProdukX = &models.Produk{
			ID:        int(produkXID.Int64),
			Nama:      produkXNama.String,
			HargaJual: parseInt(produkXHarga.String),
		}
		p.ProdukXID = int(produkXID.Int64)
	}

	// Set produk Y jika ada
	if produkYID.Valid && produkYNama.Valid {
		p.ProdukY = &models.Produk{
			ID:        int(produkYID.Int64),
			Nama:      produkYNama.String,
			HargaJual: parseInt(produkYHarga.String),
		}
		p.ProdukYID = int(produkYID.Int64)
	}

	return &p, nil
}

// GetByKode retrieves a promo by code
func (r *PromoRepository) GetByKode(kode string) (*models.Promo, error) {
	query := `
        SELECT
            p.id, p.nama, p.kode, p.tipe, p.tipe_promo, p.tipe_produk_berlaku, p.nilai, p.min_quantity, p.max_diskon,
            p.tanggal_mulai, p.tanggal_selesai, p.status, p.deskripsi,
            p.buy_quantity, p.get_quantity, p.harga_bundling, p.tipe_bundling, p.diskon_bundling,
            p.produk_x, p.produk_y, p.tipe_buy_get,
            p.created_at, p.updated_at,
            px.id as px_id, px.nama as px_nama, px.harga_jual as px_harga,
            py.id as py_id, py.nama as py_nama, py.harga_jual as py_harga
        FROM promo p
        LEFT JOIN produk px ON p.produk_x = px.id
        LEFT JOIN produk py ON p.produk_y = py.id
        WHERE p.kode = ?`

	var p models.Promo
	var kodeVal, deskripsi, tipePromo, tipeProdukBerlaku, tipeBundling, tipeBuyGet sql.NullString
	var tanggalMulai, tanggalSelesai sql.NullTime
	var produkXID, produkYID sql.NullInt64
	var produkXNama, produkXHarga, produkYNama, produkYHarga sql.NullString

	err := database.QueryRow(query, kode).Scan(
		&p.ID, &p.Nama, &kodeVal, &p.Tipe, &tipePromo, &tipeProdukBerlaku, &p.Nilai,
		&p.MinQuantity, &p.MaxDiskon, &tanggalMulai, &tanggalSelesai,
		&p.Status, &deskripsi, &p.BuyQuantity, &p.GetQuantity,
		&p.HargaBundling, &tipeBundling, &p.DiskonBundling,
		&produkXID, &produkYID, &tipeBuyGet,
		&p.CreatedAt, &p.UpdatedAt,
		&produkXID, &produkXNama, &produkXHarga,
		&produkYID, &produkYNama, &produkYHarga,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}

	// Set nullable fields
	if kodeVal.Valid {
		p.Kode = kodeVal.String
	}
	if deskripsi.Valid {
		p.Deskripsi = deskripsi.String
	}
	if tipePromo.Valid {
		p.TipePromo = tipePromo.String
	}
	if tipeProdukBerlaku.Valid {
		p.TipeProdukBerlaku = tipeProdukBerlaku.String
	}
	if tipeBundling.Valid {
		p.TipeBundling = tipeBundling.String
	}
	if tipeBuyGet.Valid {
		p.TipeBuyGet = tipeBuyGet.String
	}
	if tanggalMulai.Valid {
		p.TanggalMulai = tanggalMulai.Time
	}
	if tanggalSelesai.Valid {
		p.TanggalSelesai = tanggalSelesai.Time
	}

	// Set produk X jika ada
	if produkXID.Valid && produkXNama.Valid {
		p.ProdukX = &models.Produk{
			ID:        int(produkXID.Int64),
			Nama:      produkXNama.String,
			HargaJual: parseInt(produkXHarga.String),
		}
		p.ProdukXID = int(produkXID.Int64)
	}

	// Set produk Y jika ada
	if produkYID.Valid && produkYNama.Valid {
		p.ProdukY = &models.Produk{
			ID:        int(produkYID.Int64),
			Nama:      produkYNama.String,
			HargaJual: parseInt(produkYHarga.String),
		}
		p.ProdukYID = int(produkYID.Int64)
	}

	return &p, nil
}

func (r *PromoRepository) GetActivePromos() ([]*models.Promo, error) {
	query := `
        SELECT
            p.id, p.nama, p.kode, p.tipe, p.tipe_promo, p.tipe_produk_berlaku, p.nilai, p.min_quantity, p.max_diskon,
            p.tanggal_mulai, p.tanggal_selesai, p.status, p.deskripsi,
            p.buy_quantity, p.get_quantity, p.harga_bundling, p.tipe_bundling, p.diskon_bundling,
            p.produk_x, p.produk_y, p.tipe_buy_get,
            p.created_at, p.updated_at,
            px.id as px_id, px.nama as px_nama, px.harga_jual as px_harga,
            py.id as py_id, py.nama as py_nama, py.harga_jual as py_harga
        FROM promo p
        LEFT JOIN produk px ON p.produk_x = px.id
        LEFT JOIN produk py ON p.produk_y = py.id
        WHERE p.status = 'aktif'
          AND (p.tanggal_mulai IS NULL OR p.tanggal_mulai = '' OR date(p.tanggal_mulai) <= date('now', 'localtime'))
          AND (p.tanggal_selesai IS NULL OR p.tanggal_selesai = '' OR date(p.tanggal_selesai) >= date('now', 'localtime'))
        ORDER BY p.created_at DESC
    `

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active promos: %w", err)
	}
	defer rows.Close()

	var promos []*models.Promo
	for rows.Next() {
		var p models.Promo
		var kode, deskripsi, tipePromo, tipeProdukBerlaku, tipeBundling, tipeBuyGet sql.NullString
		var tanggalMulai, tanggalSelesai sql.NullTime
		var produkXID, produkYID sql.NullInt64
		var produkXNama, produkXHarga, produkYNama, produkYHarga sql.NullString

		err := rows.Scan(
			&p.ID,
			&p.Nama,
			&kode,
			&p.Tipe,
			&tipePromo,
			&tipeProdukBerlaku,
			&p.Nilai,
			&p.MinQuantity,
			&p.MaxDiskon,
			&tanggalMulai,
			&tanggalSelesai,
			&p.Status,
			&deskripsi,
			&p.BuyQuantity,
			&p.GetQuantity,
			&p.HargaBundling,
			&tipeBundling,
			&p.DiskonBundling,
			&produkXID,
			&produkYID,
			&tipeBuyGet,
			&p.CreatedAt,
			&p.UpdatedAt,
			&produkXID, // Duplicate for product data
			&produkXNama,
			&produkXHarga,
			&produkYID, // Duplicate for product data
			&produkYNama,
			&produkYHarga,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan promo: %w", err)
		}

		// Set nullable fields
		if kode.Valid {
			p.Kode = kode.String
		}
		if deskripsi.Valid {
			p.Deskripsi = deskripsi.String
		}
		if tipePromo.Valid {
			p.TipePromo = tipePromo.String
		}
		if tipeProdukBerlaku.Valid {
			p.TipeProdukBerlaku = tipeProdukBerlaku.String
		}
		if tipeBundling.Valid {
			p.TipeBundling = tipeBundling.String
		}
		if tipeBuyGet.Valid {
			p.TipeBuyGet = tipeBuyGet.String
		}
		if tanggalMulai.Valid {
			p.TanggalMulai = tanggalMulai.Time
		}
		if tanggalSelesai.Valid {
			p.TanggalSelesai = tanggalSelesai.Time
		}

		// Set produk X jika ada
		if produkXID.Valid && produkXNama.Valid {
			p.ProdukX = &models.Produk{
				ID:        int(produkXID.Int64),
				Nama:      produkXNama.String,
				HargaJual: parseInt(produkXHarga.String),
			}
			p.ProdukXID = int(produkXID.Int64)
		}

		// Set produk Y jika ada
		if produkYID.Valid && produkYNama.Valid {
			p.ProdukY = &models.Produk{
				ID:        int(produkYID.Int64),
				Nama:      produkYNama.String,
				HargaJual: parseInt(produkYHarga.String),
			}
			p.ProdukYID = int(produkYID.Int64)
		}

		promos = append(promos, &p)
	}

	return promos, nil
}

// Update updates a promo
func (r *PromoRepository) Update(promo *models.Promo) error {
	query := `
        UPDATE promo
        SET nama = ?, kode = ?, tipe = ?, tipe_promo = ?, tipe_produk_berlaku = ?, nilai = ?, min_quantity = ?,
            max_diskon = ?, tanggal_mulai = ?, tanggal_selesai = ?,
            status = ?, deskripsi = ?, buy_quantity = ?, get_quantity = ?, tipe_buy_get = ?,
            harga_bundling = ?, tipe_bundling = ?, diskon_bundling = ?,
            produk_x = ?, produk_y = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `

	var produkX, produkY interface{}
	if promo.ProdukXID > 0 {
		produkX = promo.ProdukXID
	} else {
		produkX = nil
	}
	if promo.ProdukYID > 0 {
		produkY = promo.ProdukYID
	} else {
		produkY = nil
	}

	result, err := database.Exec(query,
		promo.Nama,
		promo.Kode,
		promo.Tipe,
		promo.TipePromo,
		promo.TipeProdukBerlaku,
		promo.Nilai,
		promo.MinQuantity, // PASTIKAN INI
		promo.MaxDiskon,
		promo.TanggalMulai,
		promo.TanggalSelesai,
		promo.Status,
		promo.Deskripsi,
		promo.BuyQuantity,
		promo.GetQuantity,
		promo.TipeBuyGet,
		promo.HargaBundling,
		promo.TipeBundling,
		promo.DiskonBundling,
		produkX,
		produkY,
		promo.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update promo: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("promo not found")
	}

	return nil
}

func parseInt(s string) int {
	var result int
	fmt.Sscanf(s, "%d", &result)
	return result
}

// Delete deletes a promo
func (r *PromoRepository) Delete(id int) error {
	query := `DELETE FROM promo WHERE id = ?`

	result, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete promo: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("promo not found")
	}

	return nil
}

// AddPromoProduk adds a product to a promo
func (r *PromoRepository) AddPromoProduk(promoID, produkID int) error {
	query := `
		INSERT INTO promo_produk (promo_id, produk_id, created_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
	`

	_, err := database.Exec(query, promoID, produkID)
	if err != nil {
		return fmt.Errorf("failed to add promo produk: %w", err)
	}

	return nil
}

// RemovePromoProduk removes a product from a promo
func (r *PromoRepository) RemovePromoProduk(promoID, produkID int) error {
	query := `DELETE FROM promo_produk WHERE promo_id = ? AND produk_id = ?`

	result, err := database.Exec(query, promoID, produkID)
	if err != nil {
		return fmt.Errorf("failed to remove promo produk: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("promo produk not found")
	}

	return nil
}

func (r *PromoRepository) GetPromoProducts(promoID int) ([]*models.Produk, error) {
	// First, get the promo to check its type
	promo, err := r.GetByID(promoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get promo: %w", err)
	}
	if promo == nil {
		return nil, fmt.Errorf("promo not found")
	}

	var products []*models.Produk

	switch promo.TipePromo {
	case "diskon_produk", "bundling":
		// For diskon_produk and bundling, get products from promo_produk table
		query := `
            SELECT
                p.id, p.sku, p.barcode, p.nama, p.kategori, p.berat,
                p.harga_beli, p.harga_jual, p.stok, p.satuan,
                p.kadaluarsa, p.tanggal_masuk, p.deskripsi, p.gambar,
                p.created_at, p.updated_at
            FROM produk p
            INNER JOIN promo_produk pp ON pp.produk_id = p.id
            WHERE pp.promo_id = ?
            ORDER BY p.nama ASC
        `

		rows, err := database.Query(query, promoID)
		if err != nil {
			return nil, fmt.Errorf("failed to query promo products: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var p models.Produk
			var barcode, kadaluarsa, tanggalMasuk, deskripsi, gambar sql.NullString

			err := rows.Scan(
				&p.ID,
				&p.SKU,
				&barcode,
				&p.Nama,
				&p.Kategori,
				&p.Berat,
				&p.HargaBeli,
				&p.HargaJual,
				&p.Stok,
				&p.Satuan,
				&kadaluarsa,
				&tanggalMasuk,
				&deskripsi,
				&gambar,
				&p.CreatedAt,
				&p.UpdatedAt,
			)
			if err != nil {
				return nil, fmt.Errorf("failed to scan product: %w", err)
			}

			if barcode.Valid {
				p.Barcode = barcode.String
			}
			if kadaluarsa.Valid {
				p.Kadaluarsa = kadaluarsa.String
			}
			if tanggalMasuk.Valid {
				p.TanggalMasuk = tanggalMasuk.String
			}
			if deskripsi.Valid {
				p.Deskripsi = deskripsi.String
			}
			if gambar.Valid {
				p.Gambar = gambar.String
			}

			products = append(products, &p)
		}

	case "buy_x_get_y":
		// For buy_x_get_y, get products from produk_x and produk_y columns
		if promo.ProdukX != nil {
			products = append(products, promo.ProdukX)
		}
		if promo.ProdukY != nil && promo.TipeBuyGet == "beda" {
			products = append(products, promo.ProdukY)
		}

	default:
		return nil, fmt.Errorf("unknown promo type: %s", promo.TipePromo)
	}

	return products, nil
}

// GetPromoForProduct retrieves active promos for a specific product
func (r *PromoRepository) GetPromoForProduct(produkID int) ([]*models.Promo, error) {
	now := time.Now()
	query := `
        SELECT
            p.id, p.nama, p.kode, p.tipe, p.tipe_promo, p.tipe_produk_berlaku, p.nilai, p.min_quantity, p.max_diskon,
            p.tanggal_mulai, p.tanggal_selesai, p.status, p.deskripsi,
            p.buy_quantity, p.get_quantity, p.harga_bundling, p.tipe_bundling, p.diskon_bundling,
            p.produk_x, p.produk_y, p.tipe_buy_get,
            p.created_at, p.updated_at
        FROM promo p
        INNER JOIN promo_produk pp ON pp.promo_id = p.id
        WHERE pp.produk_id = ?
          AND p.status = 'aktif'
          AND (p.tanggal_mulai IS NULL OR p.tanggal_mulai <= ?)
          AND (p.tanggal_selesai IS NULL OR p.tanggal_selesai >= ?)
        ORDER BY p.nilai DESC
    `

	rows, err := database.Query(query, produkID, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to query product promos: %w", err)
	}
	defer rows.Close()

	var promos []*models.Promo
	for rows.Next() {
		var p models.Promo
		var kode, deskripsi, tipePromo, tipeProdukBerlaku, tipeBundling, tipeBuyGet sql.NullString
		var tanggalMulai, tanggalSelesai sql.NullTime
		var produkX, produkY sql.NullInt64

		err := rows.Scan(
			&p.ID,
			&p.Nama,
			&kode,
			&p.Tipe,
			&tipePromo,
			&tipeProdukBerlaku,
			&p.Nilai,
			&p.MinQuantity, // ✅ FIXED
			&p.MaxDiskon,
			&tanggalMulai,
			&tanggalSelesai,
			&p.Status,
			&deskripsi,
			&p.BuyQuantity,
			&p.GetQuantity,
			&p.HargaBundling,
			&tipeBundling,
			&p.DiskonBundling,
			&produkX,
			&produkY,
			&tipeBuyGet,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan promo: %w", err)
		}

		// Set nullable fields
		if kode.Valid {
			p.Kode = kode.String
		}
		if deskripsi.Valid {
			p.Deskripsi = deskripsi.String
		}
		if tipePromo.Valid {
			p.TipePromo = tipePromo.String
		}
		if tipeProdukBerlaku.Valid {
			p.TipeProdukBerlaku = tipeProdukBerlaku.String
		}
		if tipeBundling.Valid {
			p.TipeBundling = tipeBundling.String
		}
		if tipeBuyGet.Valid {
			p.TipeBuyGet = tipeBuyGet.String
		}
		if tanggalMulai.Valid {
			p.TanggalMulai = tanggalMulai.Time
		}
		if tanggalSelesai.Valid {
			p.TanggalSelesai = tanggalSelesai.Time
		}
		if produkX.Valid {
			p.ProdukXID = int(produkX.Int64)
		}
		if produkY.Valid {
			p.ProdukYID = int(produkY.Int64)
		}

		promos = append(promos, &p)
	}

	return promos, nil
}
