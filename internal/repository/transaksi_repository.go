package repository

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

type TransaksiRepository struct {
	db        *sql.DB
	batchRepo *BatchRepository
}

func NewTransaksiRepository() *TransaksiRepository {
	return &TransaksiRepository{
		db:        database.DB,
		batchRepo: NewBatchRepository(),
	}
}

// GenerateNomorTransaksi generates a unique transaction number with random digits
func (r *TransaksiRepository) GenerateNomorTransaksi() (string, error) {
	// Check if database connection is nil
	if r.db == nil {
		return "", fmt.Errorf("database connection is not initialized")
	}

	// Try to generate a unique number (max 10 attempts)
	for attempt := 0; attempt < 10; attempt++ {
		// Generate random 8-digit number using crypto/rand for better randomness
		randomBig, err := rand.Int(rand.Reader, big.NewInt(90000000))
		if err != nil {
			return "", fmt.Errorf("failed to generate random number: %w", err)
		}
		randomNum := randomBig.Int64() + 10000000 // Generates 10000000-99999999
		nomorTransaksi := fmt.Sprintf("TRX-%d", randomNum)

		// Check if this number already exists
		var exists int
		query := `SELECT COUNT(*) FROM transaksi WHERE nomor_transaksi = ?`
		err = database.QueryRow(query, nomorTransaksi).Scan(&exists)
		if err != nil {
			return "", fmt.Errorf("failed to check transaction number uniqueness: %w", err)
		}

		// If number doesn't exist, use it
		if exists == 0 {
			return nomorTransaksi, nil
		}
	}

	// If we couldn't generate a unique number after 10 attempts, return error
	return "", fmt.Errorf("failed to generate unique transaction number after 10 attempts")
}

// Create creates a new transaction with items and payments
func (r *TransaksiRepository) Create(req *models.CreateTransaksiRequest) (*models.TransaksiDetail, error) {
	// Check if database connection is nil
	if r.db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	// Start transaction
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Generate transaction number
	nomorTransaksi, err := r.GenerateNomorTransaksi()
	if err != nil {
		return nil, fmt.Errorf("failed to generate transaction number: %w", err)
	}

	// Calculate totals (support berat or quantity)
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

	total := subtotal - req.Diskon

	// Calculate total payment
	totalBayar := 0
	for _, payment := range req.Pembayaran {
		totalBayar += payment.Jumlah
	}

	kembalian := totalBayar - total
	if kembalian < 0 {
		return nil, fmt.Errorf("pembayaran tidak mencukupi")
	}

	// Use discount breakdown from service layer
	diskonPromo := req.DiskonPromo
	diskonPelanggan := req.DiskonPelanggan

	// Insert transaksi header
	query := `INSERT INTO transaksi (
		nomor_transaksi, pelanggan_id, pelanggan_nama, pelanggan_telp,
		subtotal, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin, diskon, total, total_bayar, kembalian,
		status, catatan, kasir, staff_id, staff_nama, created_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
	query = database.TranslateQuery(query)

	// Calculate diskon_poin from poin_ditukar (will be set in service layer)
	poinDitukar := req.PoinDitukar
	diskonPoin := 0 // Will be calculated in service layer

	now := time.Now()

	var transaksiID int64
	err = tx.QueryRow(query,
		nomorTransaksi, req.PelangganID, req.PelangganNama, req.PelangganTelp,
		subtotal, diskonPromo, diskonPelanggan, poinDitukar, diskonPoin, req.Diskon, total, totalBayar, kembalian,
		"selesai", req.Catatan, req.Kasir, req.StaffID, req.StaffNama, now,
	).Scan(&transaksiID)
	if err != nil {
		return nil, fmt.Errorf("failed to insert transaction: %w", err)
	}

	// Insert transaction items
	itemQuery := `INSERT INTO transaksi_item (
		transaksi_id, produk_id, produk_sku, produk_nama,
		produk_kategori, harga_satuan, jumlah, beratgram, subtotal, created_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	itemQuery = database.TranslateQuery(itemQuery)

	for _, item := range req.Items {
		// Get product details
		var produk models.Produk
		productQuery := database.TranslateQuery(`SELECT sku, nama, kategori, stok FROM produk WHERE id = ?`)
		err := tx.QueryRow(productQuery, item.ProdukID).
			Scan(&produk.SKU, &produk.Nama, &produk.Kategori, &produk.Stok)
		if err != nil {
			return nil, fmt.Errorf("failed to get product: %w", err)
		}

		// Calculate stock to deduct FIRST (support berat or quantity)
		var stockToDeduct float64
		if item.BeratGram > 0 {
			// Presisi: stok berkurang sesuai berat dalam kg
			stockToDeduct = item.BeratGram / 1000.0
			fmt.Printf("[DEBUG STOCK] Produk: %s, BeratGram: %.2f, StockToDeduct: %.3f kg, Stok Sekarang: %.2f kg\n",
				produk.Nama, item.BeratGram, stockToDeduct, produk.Stok)
		} else {
			// Quantity biasa untuk backward compatibility
			stockToDeduct = float64(item.Jumlah)
			fmt.Printf("[DEBUG STOCK] Produk: %s, Quantity: %d, StockToDeduct: %.3f, Stok Sekarang: %.2f kg\n",
				produk.Nama, item.Jumlah, stockToDeduct, produk.Stok)
		}

		// Check stock availability with correct value
		if produk.Stok < stockToDeduct {
			return nil, fmt.Errorf("stok %s tidak mencukupi (tersedia: %.2f kg, diminta: %.2f kg)",
				produk.Nama, produk.Stok, stockToDeduct)
		}

		// Calculate item subtotal (support berat or quantity)
		var itemSubtotal int
		if item.BeratGram > 0 {
			// Perhitungan berdasarkan berat: (berat_gram / 1000) * harga_per_1000g
			itemSubtotal = int((item.BeratGram / 1000.0) * float64(item.HargaSatuan))
		} else {
			// Perhitungan biasa untuk backward compatibility
			itemSubtotal = item.HargaSatuan * item.Jumlah
		}

		// Insert item
		_, err = tx.Exec(itemQuery,
			transaksiID, item.ProdukID, produk.SKU, produk.Nama,
			produk.Kategori, item.HargaSatuan, item.Jumlah, item.BeratGram, itemSubtotal,
			now,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert transaction item: %w", err)
		}

		// Update product stock
		updateStockQuery := database.TranslateQuery(`UPDATE produk SET stok = stok - ? WHERE id = ?`)
		_, err = tx.Exec(updateStockQuery, stockToDeduct, item.ProdukID)
		if err != nil {
			return nil, fmt.Errorf("failed to update product stock: %w", err)
		}

		// Update batch quantities using FIFO (deduct from oldest batches first)
		// Get all available batches for this product (ordered by FIFO)
		batchQuery := `
			SELECT id, qty_tersisa FROM batch
			WHERE produk_id = ? AND qty_tersisa > 0
			ORDER BY tanggal_restok ASC, created_at ASC
		`
		batchQuery = database.TranslateQuery(batchQuery)
		rows, err := tx.Query(batchQuery, item.ProdukID)
		if err != nil {
			return nil, fmt.Errorf("failed to get batches: %w", err)
		}
		defer rows.Close()

		remainingQty := stockToDeduct
		for rows.Next() && remainingQty > 0 {
			var batchID string
			var qtyTersisa float64
			if err := rows.Scan(&batchID, &qtyTersisa); err != nil {
				return nil, fmt.Errorf("failed to scan batch: %w", err)
			}

			// Determine how much to take from this batch
			qtyFromThisBatch := remainingQty
			if qtyFromThisBatch > qtyTersisa {
				qtyFromThisBatch = qtyTersisa
			}

			// Update batch quantity
			updateBatchQuery := database.TranslateQuery(`UPDATE batch SET qty_tersisa = qty_tersisa - ? WHERE id = ?`)
			_, err = tx.Exec(updateBatchQuery, qtyFromThisBatch, batchID)
			if err != nil {
				return nil, fmt.Errorf("failed to update batch %s: %w", batchID, err)
			}

			remainingQty -= qtyFromThisBatch
		}
		rows.Close()
	}

	// Insert payments
	paymentQuery := `INSERT INTO pembayaran (transaksi_id, metode, jumlah, referensi, created_at) VALUES (?, ?, ?, ?, ?)`
	paymentQuery = database.TranslateQuery(paymentQuery)
	for _, payment := range req.Pembayaran {
		_, err = tx.Exec(paymentQuery, transaksiID, payment.Metode, payment.Jumlah, payment.Referensi, now)
		if err != nil {
			return nil, fmt.Errorf("failed to insert payment: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Get complete transaction details
	return r.GetByID(int(transaksiID))
}

// GetByID retrieves a complete transaction by ID
func (r *TransaksiRepository) GetByNomorTransaksi(nomorTransaksi string) (*models.TransaksiDetail, error) {
	// Check if database connection is nil
	if r.db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	// Get transaction header
	query := `SELECT
		id, nomor_transaksi, tanggal, pelanggan_id, pelanggan_nama, pelanggan_telp,
		subtotal, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin, diskon, total, total_bayar, kembalian,
		status, catatan, kasir, created_at
	FROM transaksi WHERE nomor_transaksi = ?`

	transaksi := &models.Transaksi{}
	err := database.QueryRow(query, nomorTransaksi).Scan(
		&transaksi.ID, &transaksi.NomorTransaksi, &transaksi.Tanggal,
		&transaksi.PelangganID, &transaksi.PelangganNama, &transaksi.PelangganTelp,
		&transaksi.Subtotal, &transaksi.DiskonPromo, &transaksi.DiskonPelanggan, &transaksi.PoinDitukar, &transaksi.DiskonPoin, &transaksi.Diskon, &transaksi.Total,
		&transaksi.TotalBayar, &transaksi.Kembalian,
		&transaksi.Status, &transaksi.Catatan, &transaksi.Kasir,
		&transaksi.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	// Get transaction items
	itemQuery := `SELECT
		id, transaksi_id, produk_id, produk_sku, produk_nama,
		produk_kategori, harga_satuan, jumlah, beratgram, subtotal, created_at
	FROM transaksi_item WHERE transaksi_id = ?`

	rows, err := database.Query(itemQuery, transaksi.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction items: %w", err)
	}
	defer rows.Close()

	var items []*models.TransaksiItem
	for rows.Next() {
		item := &models.TransaksiItem{}
		var produkID sql.NullInt64
		err := rows.Scan(
			&item.ID, &item.TransaksiID, &produkID, &item.ProdukSKU,
			&item.ProdukNama, &item.ProdukKategori, &item.HargaSatuan,
			&item.Jumlah, &item.BeratGram, &item.Subtotal, &item.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction item: %w", err)
		}

		// Convert sql.NullInt64 to *int
		if produkID.Valid {
			id := int(produkID.Int64)
			item.ProdukID = &id
		} else {
			item.ProdukID = nil
		}

		items = append(items, item)
	}

	// Get payments
	paymentQuery := `SELECT id, transaksi_id, metode, jumlah, referensi, created_at
		FROM pembayaran WHERE transaksi_id = ?`

	paymentRows, err := database.Query(paymentQuery, transaksi.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payments: %w", err)
	}
	defer paymentRows.Close()

	var pembayaran []*models.Pembayaran
	for paymentRows.Next() {
		payment := &models.Pembayaran{}
		err := paymentRows.Scan(
			&payment.ID, &payment.TransaksiID, &payment.Metode,
			&payment.Jumlah, &payment.Referensi, &payment.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}
		pembayaran = append(pembayaran, payment)
	}

	return &models.TransaksiDetail{
		Transaksi:  transaksi,
		Items:      items,
		Pembayaran: pembayaran,
	}, nil
}

func (r *TransaksiRepository) GetByID(id int) (*models.TransaksiDetail, error) {

	// Check if database connection is nil
	if r.db == nil {
		fmt.Println("[ERROR] Database connection is not initialized")
		return nil, fmt.Errorf("database connection is not initialized")
	}

	// Get transaction header
	query := `SELECT
		id, nomor_transaksi, tanggal, pelanggan_id, pelanggan_nama, pelanggan_telp,
		subtotal, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin, diskon, total, total_bayar, kembalian,
		status, catatan, kasir, created_at
	FROM transaksi WHERE id = ?`

	transaksi := &models.Transaksi{}
	err := database.QueryRow(query, id).Scan(
		&transaksi.ID, &transaksi.NomorTransaksi, &transaksi.Tanggal,
		&transaksi.PelangganID, &transaksi.PelangganNama, &transaksi.PelangganTelp,
		&transaksi.Subtotal, &transaksi.DiskonPromo, &transaksi.DiskonPelanggan, &transaksi.PoinDitukar, &transaksi.DiskonPoin, &transaksi.Diskon, &transaksi.Total,
		&transaksi.TotalBayar, &transaksi.Kembalian,
		&transaksi.Status, &transaksi.Catatan, &transaksi.Kasir,
		&transaksi.CreatedAt,
	)
	if err != nil {
		fmt.Printf("[ERROR] Failed to get transaction header: %v\n", err)
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	// Get transaction items
	itemQuery := `SELECT
		id, transaksi_id, produk_id, produk_sku, produk_nama,
		produk_kategori, harga_satuan, jumlah, beratgram, subtotal, created_at
	FROM transaksi_item WHERE transaksi_id = ?`

	rows, err := database.Query(itemQuery, id)
	if err != nil {
		fmt.Printf("[ERROR] Failed to query transaction items: %v\n", err)
		return nil, fmt.Errorf("failed to get transaction items: %w", err)
	}
	defer rows.Close()

	var items []*models.TransaksiItem
	itemCount := 0
	for rows.Next() {
		item := &models.TransaksiItem{}
		var produkID sql.NullInt64
		err := rows.Scan(
			&item.ID, &item.TransaksiID, &produkID, &item.ProdukSKU,
			&item.ProdukNama, &item.ProdukKategori, &item.HargaSatuan,
			&item.Jumlah, &item.BeratGram, &item.Subtotal, &item.CreatedAt,
		)
		if err != nil {
			fmt.Printf("[ERROR] Failed to scan transaction item: %v\n", err)
			return nil, fmt.Errorf("failed to scan transaction item: %w", err)
		}

		// Convert sql.NullInt64 to *int
		if produkID.Valid {
			id := int(produkID.Int64)
			item.ProdukID = &id

		} else {
			item.ProdukID = nil

		}

		items = append(items, item)
		itemCount++
	}

	// Get payments
	paymentQuery := `SELECT id, transaksi_id, metode, jumlah, referensi, created_at
		FROM pembayaran WHERE transaksi_id = ?`

	paymentRows, err := database.Query(paymentQuery, id)
	if err != nil {
		fmt.Printf("[ERROR] Failed to query payments: %v\n", err)
		return nil, fmt.Errorf("failed to get payments: %w", err)
	}
	defer paymentRows.Close()

	var pembayaran []*models.Pembayaran
	paymentCount := 0
	for paymentRows.Next() {
		payment := &models.Pembayaran{}
		err := paymentRows.Scan(
			&payment.ID, &payment.TransaksiID, &payment.Metode,
			&payment.Jumlah, &payment.Referensi, &payment.CreatedAt,
		)
		if err != nil {
			fmt.Printf("[ERROR] Failed to scan payment: %v\n", err)
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}
		pembayaran = append(pembayaran, payment)
		paymentCount++

	}

	result := &models.TransaksiDetail{
		Transaksi:  transaksi,
		Items:      items,
		Pembayaran: pembayaran,
	}

	return result, nil
}

// GetAll retrieves all transactions with pagination
func (r *TransaksiRepository) GetAll(limit, offset int) ([]*models.Transaksi, error) {
	// Check if database connection is nil
	if r.db == nil {
		return []*models.Transaksi{}, nil // Return empty array instead of error
	}

	query := `SELECT
		id, nomor_transaksi, tanggal, pelanggan_id, pelanggan_nama, pelanggan_telp,
		subtotal, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin, diskon, total, total_bayar, kembalian,
		status, catatan, kasir, created_at
	FROM transaksi
	ORDER BY tanggal DESC
	LIMIT ? OFFSET ?`

	rows, err := database.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}
	defer rows.Close()

	var transaksis []*models.Transaksi
	for rows.Next() {
		t := &models.Transaksi{}
		var pelangganTelp, catatan, kasir sql.NullString
		err := rows.Scan(
			&t.ID, &t.NomorTransaksi, &t.Tanggal,
			&t.PelangganID, &t.PelangganNama, &pelangganTelp,
			&t.Subtotal, &t.DiskonPromo, &t.DiskonPelanggan, &t.PoinDitukar, &t.DiskonPoin, &t.Diskon, &t.Total,
			&t.TotalBayar, &t.Kembalian,
			&t.Status, &catatan, &kasir,
			&t.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		// Handle NULL values
		if pelangganTelp.Valid {
			t.PelangganTelp = pelangganTelp.String
		}
		if catatan.Valid {
			t.Catatan = catatan.String
		}
		if kasir.Valid {
			t.Kasir = kasir.String
		}

		transaksis = append(transaksis, t)
	}

	// Return empty array if no transactions found
	if transaksis == nil {
		return []*models.Transaksi{}, nil
	}

	return transaksis, nil
}

// GetByDateRange retrieves transactions within a date range
func (r *TransaksiRepository) GetByDateRange(startDate, endDate time.Time) ([]*models.Transaksi, error) {
	// Check if database connection is nil
	if r.db == nil {
		return []*models.Transaksi{}, nil
	}

	// Use the 'created_at' column for time-based filtering
	query := `SELECT
		id, nomor_transaksi, tanggal, pelanggan_id, pelanggan_nama, pelanggan_telp,
		subtotal, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin, diskon, total, total_bayar, kembalian,
		status, catatan, kasir, created_at
	FROM transaksi
	WHERE created_at >= ? AND created_at < ?
	ORDER BY created_at DESC`

	rows, err := database.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions by date range: %w", err)
	}
	defer rows.Close()

	var transaksis []*models.Transaksi
	for rows.Next() {
		t := &models.Transaksi{}
		var pelangganTelp, catatan, kasir sql.NullString
		err := rows.Scan(
			&t.ID, &t.NomorTransaksi, &t.Tanggal,
			&t.PelangganID, &t.PelangganNama, &pelangganTelp,
			&t.Subtotal, &t.DiskonPromo, &t.DiskonPelanggan, &t.PoinDitukar, &t.DiskonPoin, &t.Diskon, &t.Total,
			&t.TotalBayar, &t.Kembalian,
			&t.Status, &catatan, &kasir,
			&t.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		// Handle NULL values
		if pelangganTelp.Valid {
			t.PelangganTelp = pelangganTelp.String
		}
		if catatan.Valid {
			t.Catatan = catatan.String
		}
		if kasir.Valid {
			t.Kasir = kasir.String
		}

		transaksis = append(transaksis, t)
	}

	// Return empty array if no transactions found
	if transaksis == nil {
		return []*models.Transaksi{}, nil
	}

	return transaksis, nil
}

// GetTodayStats gets statistics for today's transactions
func (r *TransaksiRepository) GetTodayStats() (totalTransaksi int, totalPendapatan int, totalItem int, err error) {
	// Check if database connection is nil
	if r.db == nil {
		return 0, 0, 0, nil
	}

	query := `SELECT
		COUNT(*) as total_transaksi,
		COALESCE(SUM(total), 0) as total_pendapatan,
		COALESCE(SUM((SELECT SUM(jumlah) FROM transaksi_item WHERE transaksi_id = transaksi.id)), 0) as total_item
	FROM transaksi
	WHERE DATE(tanggal) = CURRENT_DATE`

	err = database.QueryRow(query).Scan(&totalTransaksi, &totalPendapatan, &totalItem)
	return
}

func (r *TransaksiRepository) GetByPelangganID(pelangganID int) ([]*models.Transaksi, error) {
	// Check if database connection is nil
	if r.db == nil {
		return []*models.Transaksi{}, nil
	}

	query := `SELECT
        id, nomor_transaksi, tanggal, pelanggan_id, pelanggan_nama, pelanggan_telp,
        subtotal, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin, diskon, total, total_bayar, kembalian,
        status, catatan, kasir, created_at
    FROM transaksi
    WHERE pelanggan_id = ?
    ORDER BY tanggal DESC`

	rows, err := database.Query(query, pelangganID)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions by pelanggan: %w", err)
	}
	defer rows.Close()

	var transaksis []*models.Transaksi
	for rows.Next() {
		t := &models.Transaksi{}
		var pelangganTelp, catatan, kasir sql.NullString
		err := rows.Scan(
			&t.ID, &t.NomorTransaksi, &t.Tanggal,
			&t.PelangganID, &t.PelangganNama, &pelangganTelp,
			&t.Subtotal, &t.DiskonPromo, &t.DiskonPelanggan, &t.PoinDitukar, &t.DiskonPoin, &t.Diskon, &t.Total,
			&t.TotalBayar, &t.Kembalian,
			&t.Status, &catatan, &kasir,
			&t.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		// Handle NULL values
		if pelangganTelp.Valid {
			t.PelangganTelp = pelangganTelp.String
		}
		if catatan.Valid {
			t.Catatan = catatan.String
		}
		if kasir.Valid {
			t.Kasir = kasir.String
		}

		transaksis = append(transaksis, t)
	}

	// Return empty array if no transactions found
	if transaksis == nil {
		return []*models.Transaksi{}, nil
	}

	return transaksis, nil
}

func (r *TransaksiRepository) GetStatsByPelangganID(pelangganID int) (*models.PelangganStats, error) {
	// Check if database connection is nil
	if r.db == nil {
		return &models.PelangganStats{
			TotalTransaksi:  0,
			TotalBelanja:    0,
			RataRataBelanja: 0,
		}, nil
	}

	query := `SELECT
        COUNT(*) as total_transaksi,
        COALESCE(SUM(total), 0) as total_belanja,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*)
            ELSE 0 
        END as rata_rata_belanja
    FROM transaksi 
    WHERE pelanggan_id = ? AND status = 'selesai'`

	var stats models.PelangganStats
	err := database.QueryRow(query, pelangganID).Scan(
		&stats.TotalTransaksi,
		&stats.TotalBelanja,
		&stats.RataRataBelanja,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer stats: %w", err)
	}

	return &stats, nil
}

// GetByStaffIDAndDateRange retrieves transactions by staff ID within date range
func (r *TransaksiRepository) GetByStaffIDAndDateRange(staffID int, startDate, endDate time.Time) ([]*models.Transaksi, error) {

	query := `
		SELECT id, nomor_transaksi, tanggal, pelanggan_nama, pelanggan_telp, pelanggan_id,
		       subtotal, diskon, diskon_promo, diskon_pelanggan, poin_ditukar, diskon_poin,
		       total, total_bayar, kembalian, status, catatan, kasir,
		       staff_id, staff_nama, created_at
		FROM transaksi
		WHERE staff_id = ? AND DATE(tanggal) >= DATE(?) AND DATE(tanggal) <= DATE(?)
		ORDER BY tanggal DESC
	`

	rows, err := database.Query(query, staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query transactions: %w", err)
	}
	defer rows.Close()

	var transaksiList []*models.Transaksi
	for rows.Next() {
		t := &models.Transaksi{}
		var pelangganTelp, catatan, kasir sql.NullString
		var staffID sql.NullInt64
		err := rows.Scan(
			&t.ID,
			&t.NomorTransaksi,
			&t.Tanggal,
			&t.PelangganNama,
			&pelangganTelp,
			&t.PelangganID,
			&t.Subtotal,
			&t.Diskon,
			&t.DiskonPromo,
			&t.DiskonPelanggan,
			&t.PoinDitukar,
			&t.DiskonPoin,
			&t.Total,
			&t.TotalBayar,
			&t.Kembalian,
			&t.Status,
			&catatan,
			&kasir,
			&staffID,
			&t.StaffNama,
			&t.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		// Handle NULL values
		if pelangganTelp.Valid {
			t.PelangganTelp = pelangganTelp.String
		}
		if catatan.Valid {
			t.Catatan = catatan.String
		}
		if kasir.Valid {
			t.Kasir = kasir.String
		}
		if staffID.Valid {
			staffIDInt := int(staffID.Int64)
			t.StaffID = &staffIDInt
		}

		transaksiList = append(transaksiList, t)
	}

	return transaksiList, nil
}

// GetDailyBreakdownByStaffID gets daily aggregated data for a staff
func (r *TransaksiRepository) GetDailyBreakdownByStaffID(staffID int, startDate, endDate time.Time) (map[string]*models.StaffDailyReport, error) {
	query := `
		SELECT DATE(tanggal) as tanggal,
		       COUNT(*) as total_transaksi,
		       SUM(total) as total_penjualan
		FROM transaksi
		WHERE staff_id = ? AND DATE(tanggal) >= DATE(?) AND DATE(tanggal) <= DATE(?)
		GROUP BY DATE(tanggal)
		ORDER BY DATE(tanggal) ASC
	`

	rows, err := database.Query(query, staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query daily breakdown: %w", err)
	}
	defer rows.Close()

	dailyMap := make(map[string]*models.StaffDailyReport)

	for rows.Next() {
		var tanggalStr string
		var totalTransaksi int
		var totalPenjualan int

		err := rows.Scan(&tanggalStr, &totalTransaksi, &totalPenjualan)
		if err != nil {
			return nil, fmt.Errorf("failed to scan daily data: %w", err)
		}

		tanggal, _ := time.Parse("2006-01-02", tanggalStr)

		dailyMap[tanggalStr] = &models.StaffDailyReport{
			Tanggal:          tanggal,
			TotalTransaksi:   totalTransaksi,
			TotalPenjualan:   totalPenjualan,
			TotalItemTerjual: 0, // Will be filled separately if needed
		}
	}

	return dailyMap, nil
}

// GetTopProductLast30Days gets the most sold product in the last 30 days
func (r *TransaksiRepository) GetTopProductLast30Days() (string, error) {
	query := `
		SELECT ti.produk_nama, SUM(ti.jumlah) as total_terjual
		FROM transaksi_item ti
		JOIN transaksi t ON ti.transaksi_id = t.id
		WHERE t.tanggal >= CURRENT_DATE - INTERVAL '30 days'
		GROUP BY ti.produk_nama
		ORDER BY total_terjual DESC
		LIMIT 1
	`

	var produkNama string
	var totalTerjual int

	err := database.QueryRow(query).Scan(&produkNama, &totalTerjual)
	if err != nil {
		// If no product found, return dash
		return "-", nil
	}

	return produkNama, nil
}

// GetItemCountsByDateForStaff gets total item counts grouped by date for a staff
func (r *TransaksiRepository) GetItemCountsByDateForStaff(staffID int, startDate, endDate time.Time) (map[string]int, error) {
	query := `
		SELECT DATE(t.tanggal) as tanggal, SUM(ti.jumlah) as total_items
		FROM transaksi t
		JOIN transaksi_item ti ON t.id = ti.transaksi_id
		WHERE t.staff_id = ? AND DATE(t.tanggal) >= DATE(?) AND DATE(t.tanggal) <= DATE(?)
		GROUP BY DATE(t.tanggal)
	`

	rows, err := database.Query(query, staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query item counts: %w", err)
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var dateStr string
		var totalItems int
		if err := rows.Scan(&dateStr, &totalItems); err != nil {
			return nil, fmt.Errorf("failed to scan item count: %w", err)
		}
		result[dateStr] = totalItems
	}

	return result, nil
}

// GetSalesByShift gets total sales grouped by shift (morning, afternoon, night)
// Morning: 06:00-14:00, Afternoon: 14:00-22:00, Night: 22:00-06:00
func (r *TransaksiRepository) GetSalesByShift() (map[string]int, error) {
	// Get all transactions for the last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	// Get all transactions in the date range
	transaksiList, err := r.GetByDateRange(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions for shift analysis: %w", err)
	}

	result := map[string]int{
		"Pagi":  0,
		"Sore":  0,
		"Malam": 0,
	}

	for _, t := range transaksiList {
		hour := t.Tanggal.In(time.Local).Hour()

		if hour >= 6 && hour < 14 {
			result["Pagi"] += t.Total
		} else if hour >= 14 && hour < 22 {
			result["Sore"] += t.Total
		} else {
			result["Malam"] += t.Total
		}
	}

	return result, nil
}

// GetShiftDataByStaffIDAndDateRange gets detailed shift data for a staff within date range
// Pagi: 06:00-14:00, Sore: 14:00-22:00, Malam: 22:00-06:00
func (r *TransaksiRepository) GetShiftDataByStaffIDAndDateRange(staffID int, startDate, endDate time.Time) (map[string]map[string]interface{}, error) {
	// Get all transactions for the specified staff and date range
	transaksiList, err := r.GetByStaffIDAndDateRange(staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions for staff shift analysis: %w", err)
	}

	result := map[string]map[string]interface{}{
		"Pagi": {
			"jumlahTransaksi": 0,
			"totalPenjualan":  0,
		},
		"Sore": {
			"jumlahTransaksi": 0,
			"totalPenjualan":  0,
		},
		"Malam": {
			"jumlahTransaksi": 0,
			"totalPenjualan":  0,
		},
	}

	for _, t := range transaksiList {
		hour := t.Tanggal.In(time.Local).Hour()

		var shift string
		if hour >= 6 && hour < 14 {
			shift = "Pagi"
		} else if hour >= 14 && hour < 22 {
			shift = "Sore"
		} else {
			shift = "Malam"
		}

		shiftData := result[shift]
		shiftData["jumlahTransaksi"] = shiftData["jumlahTransaksi"].(int) + 1
		shiftData["totalPenjualan"] = shiftData["totalPenjualan"].(int) + t.Total
	}

	return result, nil
}

// GetTransactionCountsByDateForStaff gets transaction counts grouped by date for a staff
func (r *TransaksiRepository) GetTransactionCountsByDateForStaff(staffID int, startDate, endDate time.Time) (map[string]int, error) {
	query := `
		SELECT DATE(tanggal) as tanggal, COUNT(*) as total_transaksi
		FROM transaksi
		WHERE staff_id = ? AND DATE(tanggal) >= DATE(?) AND DATE(tanggal) <= DATE(?)
		GROUP BY DATE(tanggal)
	`

	rows, err := database.Query(query, staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query transaction counts: %w", err)
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var dateStr string
		var count int
		if err := rows.Scan(&dateStr, &count); err != nil {
			return nil, fmt.Errorf("failed to scan transaction count: %w", err)
		}
		result[dateStr] = count
	}

	return result, nil
}

// GetTotalProductsSoldByDateRange retrieves total products sold within a date range
func (r *TransaksiRepository) GetTotalProductsSoldByDateRange(startDate, endDate time.Time) (int, error) {
	if r.db == nil {
		return 0, nil
	}

	query := `SELECT COALESCE(SUM(ti.jumlah), 0) as total_products
	FROM transaksi t
	INNER JOIN transaksi_item ti ON t.id = ti.transaksi_id
	WHERE t.created_at BETWEEN ? AND ?`

	var totalProducts int
	err := database.QueryRow(query, startDate, endDate).Scan(&totalProducts)
	if err != nil {
		return 0, fmt.Errorf("failed to get total products sold: %w", err)
	}

	return totalProducts, nil
}

func (r *TransaksiRepository) GetPaymentMethodBreakdownByDateRange(startDate, endDate time.Time) (map[string]int, error) {
	if r.db == nil {
		return make(map[string]int), nil
	}

	query := `SELECT p.metode, COUNT(DISTINCT p.transaksi_id) as jumlah
	FROM pembayaran p
	INNER JOIN transaksi t ON p.transaksi_id = t.id
	WHERE t.created_at BETWEEN ? AND ?
	GROUP BY p.metode`

	rows, err := database.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment method breakdown: %w", err)
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var metode string
		var jumlah int
		if err := rows.Scan(&metode, &jumlah); err != nil {
			return nil, fmt.Errorf("failed to scan payment method breakdown: %w", err)
		}
		result[metode] = jumlah
	}

	return result, nil
}

func (r *TransaksiRepository) GetTransactionOmsetByPaymentMethod(startDate, endDate time.Time) (map[string]int, error) {
	if r.db == nil {
		return make(map[string]int), nil
	}

	query := `SELECT p.metode, SUM(t.total) as total_omset
	FROM pembayaran p
	INNER JOIN transaksi t ON p.transaksi_id = t.id
	WHERE t.created_at BETWEEN ? AND ?
	GROUP BY p.metode`

	rows, err := database.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction omset by payment method: %w", err)
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var metode string
		var totalOmset int
		if err := rows.Scan(&metode, &totalOmset); err != nil {
			return nil, fmt.Errorf("failed to scan transaction omset: %w", err)
		}
		result[metode] = totalOmset
	}

	return result, nil
}

func (r *TransaksiRepository) GetSalesGroupedByPeriod(startDate, endDate time.Time, groupBy string) ([]map[string]interface{}, error) {
	// Check if database connection is nil
	if r.db == nil {
		return nil, fmt.Errorf("database connection is not initialized")
	}

	var query string
	var args []interface{}

	// Use 'created_at' for time-based filtering as it's more reliable for real-time data
	switch groupBy {
	case "hari":
		// Group by day of the week for the last 7 days
		query = `
            SELECT
                EXTRACT(DOW FROM created_at)::text as day_key,
                CASE EXTRACT(DOW FROM created_at)
                    WHEN 0 THEN 'Minggu'
                    WHEN 1 THEN 'Senin'
                    WHEN 2 THEN 'Selasa'
                    WHEN 3 THEN 'Rabu'
                    WHEN 4 THEN 'Kamis'
                    WHEN 5 THEN 'Jumat'
                    WHEN 6 THEN 'Sabtu'
                END as label,
                SUM(total) as revenue,
                COUNT(*) as transactions
            FROM transaksi
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY day_key, label
            ORDER BY day_key;
        `
	case "minggu":
		// Group by week number for the last 4 weeks
		query = `
            SELECT
                'Minggu ' || EXTRACT(WEEK FROM created_at)::text as label,
                SUM(total) as revenue,
                COUNT(*) as transactions
            FROM transaksi
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY label
            ORDER BY label;
        `
	case "bulan":
		// Group by month for the last 6 months
		query = `
            SELECT
                TO_CHAR(created_at, 'YYYY-MM') as label,
                SUM(total) as revenue,
                COUNT(*) as transactions
            FROM transaksi
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY label
            ORDER BY label;
        `
	default: // Default to hourly
		// Group by hour of the day (0-23)
		query = `
            SELECT
                TO_CHAR(created_at, 'HH24') as label,
                SUM(total) as revenue,
                COUNT(*) as transactions
            FROM transaksi
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY label
            ORDER BY label;
        `
	}

	args = []interface{}{startDate, endDate}

	rows, err := database.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var label string
		var revenue int
		var transactions int
		if err := rows.Scan(&label, &revenue, &transactions); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}
		results = append(results, map[string]interface{}{
			"label":        label,
			"revenue":      revenue,
			"transactions": transactions,
		})
	}

	return results, nil
}
