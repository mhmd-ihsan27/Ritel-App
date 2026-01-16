package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

// SeedDatabase checks if database is empty and seeds it with default data
func SeedDatabase(db *sql.DB) error {
	log.Println("[SEED] Checking if database needs seeding...")

	// Check if products exist
	var productCount int
	err := db.QueryRow("SELECT COUNT(*) FROM produk").Scan(&productCount)
	if err != nil {
		return fmt.Errorf("failed to check product count: %w", err)
	}

	if productCount > 0 {
		log.Printf("[SEED] Database already has %d products, skipping seed\n", productCount)

		// Still fix NULL values if any
		fixNullValues(db)
		return nil
	}

	log.Println("[SEED] Database is empty, seeding with default data...")

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	// Reset sequences
	tx.Exec("DELETE FROM sqlite_sequence WHERE name='produk'")
	tx.Exec("DELETE FROM sqlite_sequence WHERE name='kategori'")

	// Create default category
	_, err = tx.Exec(`
		INSERT INTO kategori (id, nama, deskripsi, icon) 
		VALUES (1, 'Umum', '', '')
		ON CONFLICT(id) DO NOTHING
	`)
	if err != nil {
		return fmt.Errorf("failed to create default category: %w", err)
	}
	log.Println("[SEED] ✓ Created default category")

	// Create default products with simple IDs
	now := time.Now()
	products := []struct {
		id        int
		nama      string
		kategori  string
		hargaJual int
		hargaBeli int
		barcode   string
	}{
		{1, "Bayam", "Sayur", 15000, 10000, "BAYAM001"},
		{2, "Jeruk", "Buah", 30000, 20000, "JERUK002"},
		{3, "Tomat", "Sayur", 12000, 8000, "TOMAT003"},
	}

	for _, p := range products {
		_, err := tx.Exec(`
			INSERT INTO produk (
				id, nama, kategori, harga_jual, harga_beli, stok, satuan,
				jenis_produk, sku, barcode, deskripsi, gambar, kadaluarsa, tanggal_masuk,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 0, 'kg', 'curah', ?, ?, '', '', '', '', ?, ?)
		`, p.id, p.nama, p.kategori, p.hargaJual, p.hargaBeli,
			fmt.Sprintf("SKU-%d", p.id), p.barcode, now, now)

		if err != nil {
			return fmt.Errorf("failed to create product %s: %w", p.nama, err)
		}
		log.Printf("[SEED] ✓ Created product: %s (ID: %d)\n", p.nama, p.id)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit seed transaction: %w", err)
	}

	log.Println("[SEED] ✅ Database seeding completed successfully")
	return nil
}

// fixNullValues fixes any NULL values in text columns
func fixNullValues(db *sql.DB) {
	// Fix produk NULL values
	db.Exec("UPDATE produk SET deskripsi = '' WHERE deskripsi IS NULL")
	db.Exec("UPDATE produk SET gambar = '' WHERE gambar IS NULL")
	db.Exec("UPDATE produk SET kadaluarsa = '' WHERE kadaluarsa IS NULL")
	db.Exec("UPDATE produk SET tanggal_masuk = '' WHERE tanggal_masuk IS NULL")

	// Fix kategori NULL values
	db.Exec("UPDATE kategori SET deskripsi = '' WHERE deskripsi IS NULL")
	db.Exec("UPDATE kategori SET icon = '' WHERE icon IS NULL")
}
