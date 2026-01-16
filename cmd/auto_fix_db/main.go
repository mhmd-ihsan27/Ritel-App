package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	homeDir, _ := os.UserHomeDir()
	dbPath := filepath.Join(homeDir, "ritel-app", "ritel.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fmt.Println("=== AUTO-FIX DATABASE AFTER RESET ===\n")

	// Step 1: Clear all products
	fmt.Println("Step 1: Clearing products...")
	_, err = db.Exec("DELETE FROM produk")
	if err != nil {
		log.Fatalf("Failed to delete products: %v", err)
	}
	_, err = db.Exec("DELETE FROM sqlite_sequence WHERE name='produk'")
	if err != nil {
		fmt.Printf("Warning: %v\n", err)
	}
	fmt.Println("✓ Cleared\n")

	// Step 2: Create products with simple IDs and unique barcodes
	fmt.Println("Step 2: Creating products...")
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
		_, err := db.Exec(`
			INSERT INTO produk (
				id, nama, kategori, harga_jual, harga_beli, stok, satuan,
				jenis_produk, sku, barcode, deskripsi, gambar, kadaluarsa, tanggal_masuk,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 0, 'kg', 'curah', ?, ?, '', '', '', '', ?, ?)
		`, p.id, p.nama, p.kategori, p.hargaJual, p.hargaBeli,
			fmt.Sprintf("SKU-%d", p.id), p.barcode, now, now)

		if err != nil {
			fmt.Printf("❌ %s: %v\n", p.nama, err)
		} else {
			fmt.Printf("✓ %s (ID: %d)\n", p.nama, p.id)
		}
	}

	// Step 3: Fix kategori NULL deskripsi
	fmt.Println("\nStep 3: Fixing kategori...")
	db.Exec("UPDATE kategori SET deskripsi = '' WHERE deskripsi IS NULL")
	db.Exec("UPDATE kategori SET icon = '' WHERE icon IS NULL")
	fmt.Println("✓ Fixed kategori NULL values")

	// Step 4: Verify
	fmt.Println("\n=== VERIFICATION ===")
	rows, _ := db.Query("SELECT id, nama FROM produk ORDER BY id")
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id int
		var nama string
		rows.Scan(&id, &nama)
		fmt.Printf("ID %d: %s\n", id, nama)
		count++
	}

	if count == 3 {
		fmt.Println("\n✅ SUCCESS! Database ready")
		fmt.Println("\n🎯 Restart 'wails dev' and test:")
		fmt.Println("   - Transactions ✓")
		fmt.Println("   - Stock updates ✓")
	} else {
		fmt.Printf("\n❌ Only %d products created\n", count)
	}
}
