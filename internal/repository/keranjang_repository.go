package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

// KeranjangRepository handles database operations for cart
type KeranjangRepository struct{}

// NewKeranjangRepository creates a new instance
func NewKeranjangRepository() *KeranjangRepository {
	return &KeranjangRepository{}
}

// AddItem adds a product to the cart
func (r *KeranjangRepository) AddItem(produkID int, jumlah int, hargaBeli int) error {
	// Check if item already exists in cart
	existing, err := r.GetByProdukID(produkID)
	if err != nil {
		return err
	}

	if existing != nil {
		// Update quantity
		newJumlah := existing.Jumlah + jumlah
		return r.UpdateJumlah(existing.ID, newJumlah)
	}

	// Insert new item
	subtotal := jumlah * hargaBeli
	query := `
		INSERT INTO keranjang (produk_id, jumlah, harga_beli, subtotal)
		VALUES (?, ?, ?, ?)
	`

	_, err = database.Exec(query, produkID, jumlah, hargaBeli, subtotal)
	if err != nil {
		return fmt.Errorf("failed to add item to cart: %w", err)
	}

	return nil
}

// GetByProdukID retrieves a cart item by product ID
func (r *KeranjangRepository) GetByProdukID(produkID int) (*models.Keranjang, error) {
	query := `
		SELECT id, produk_id, jumlah, harga_beli, subtotal, created_at
		FROM keranjang
		WHERE produk_id = ?
	`

	item := &models.Keranjang{}
	err := database.QueryRow(query, produkID).Scan(
		&item.ID,
		&item.ProdukID,
		&item.Jumlah,
		&item.HargaBeli,
		&item.Subtotal,
		&item.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get cart item: %w", err)
	}

	return item, nil
}

// GetAll retrieves all items in cart with product details
func (r *KeranjangRepository) GetAll() ([]*models.KeranjangItem, error) {
	query := `
		SELECT
			k.id, k.jumlah, k.harga_beli, k.subtotal, k.created_at,
			p.id, p.sku, p.barcode, p.nama, p.kategori, p.harga_beli,
			p.harga_jual, p.stok, p.satuan, p.kadaluarsa, p.tanggal_masuk,
			p.deskripsi, p.created_at, p.updated_at
		FROM keranjang k
		JOIN produk p ON k.produk_id = p.id
		ORDER BY k.created_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get cart items: %w", err)
	}
	defer rows.Close()

	var items []*models.KeranjangItem

	for rows.Next() {
		item := &models.KeranjangItem{
			Produk: &models.Produk{},
		}
		var kadaluarsa, tanggalMasuk sql.NullString

		err := rows.Scan(
			&item.ID,
			&item.Jumlah,
			&item.HargaBeli,
			&item.Subtotal,
			&item.CreatedAt,
			&item.Produk.ID,
			&item.Produk.SKU,
			&item.Produk.Barcode,
			&item.Produk.Nama,
			&item.Produk.Kategori,
			&item.Produk.HargaBeli,
			&item.Produk.HargaJual,
			&item.Produk.Stok,
			&item.Produk.Satuan,
			&kadaluarsa,
			&tanggalMasuk,
			&item.Produk.Deskripsi,
			&item.Produk.CreatedAt,
			&item.Produk.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan cart item: %w", err)
		}

		if kadaluarsa.Valid {
			item.Produk.Kadaluarsa = kadaluarsa.String
		}
		if tanggalMasuk.Valid {
			item.Produk.TanggalMasuk = tanggalMasuk.String
		}

		items = append(items, item)
	}

	return items, nil
}

// UpdateJumlah updates item quantity
func (r *KeranjangRepository) UpdateJumlah(id int, jumlah int) error {
	// Get current item to recalculate subtotal
	var hargaBeli int
	err := database.QueryRow("SELECT harga_beli FROM keranjang WHERE id = ?", id).Scan(&hargaBeli)
	if err != nil {
		return fmt.Errorf("failed to get cart item: %w", err)
	}

	subtotal := jumlah * hargaBeli
	query := `UPDATE keranjang SET jumlah = ?, subtotal = ? WHERE id = ?`

	_, err = database.Exec(query, jumlah, subtotal, id)
	if err != nil {
		return fmt.Errorf("failed to update cart item: %w", err)
	}

	return nil
}

// DeleteItem removes an item from cart
func (r *KeranjangRepository) DeleteItem(id int) error {
	query := `DELETE FROM keranjang WHERE id = ?`

	_, err := database.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete cart item: %w", err)
	}

	return nil
}

// Clear empties the entire cart
func (r *KeranjangRepository) Clear() error {
	query := `DELETE FROM keranjang`

	_, err := database.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to clear cart: %w", err)
	}

	return nil
}

// GetTotal calculates total cart value
func (r *KeranjangRepository) GetTotal() (int, error) {
	query := `SELECT COALESCE(SUM(subtotal), 0) FROM keranjang`

	var total int
	err := database.QueryRow(query).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to get cart total: %w", err)
	}

	return total, nil
}
