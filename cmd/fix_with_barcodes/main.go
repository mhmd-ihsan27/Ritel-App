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

	fmt.Println("=== FIXING BARCODE CONSTRAINT ===\n")

	// Delete all products first
	fmt.Println("Clearing all products...")
	_, err = db.Exec("DELETE FROM produk")
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec("DELETE FROM sqlite_sequence WHERE name='produk'")
	if err != nil {
		fmt.Printf("Warning: %v\n", err)
	}
	fmt.Println("✓ Cleared\n")

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

	fmt.Println("Creating products with unique barcodes...")
	for _, p := range products {
		_, err := db.Exec(`
			INSERT INTO produk (
				id, nama, kategori, harga_jual, harga_beli, stok, satuan,
				jenis_produk, sku, barcode, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 0, 'kg', 'curah', ?, ?, ?, ?)
		`, p.id, p.nama, p.kategori, p.hargaJual, p.hargaBeli,
			fmt.Sprintf("SKU-%d", p.id), p.barcode, now, now)

		if err != nil {
			fmt.Printf("❌ %s: %v\n", p.nama, err)
		} else {
			fmt.Printf("✓ %s (ID: %d, Barcode: %s)\n", p.nama, p.id, p.barcode)
		}
	}

	// Verify
	fmt.Println("\n=== VERIFICATION ===")
	rows, _ := db.Query("SELECT id, nama, barcode FROM produk ORDER BY id")
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id int
		var nama, barcode string
		rows.Scan(&id, &nama, &barcode)
		fmt.Printf("ID %d: %s (Barcode: %s)\n", id, nama, barcode)
		count++
	}

	if count == 3 {
		fmt.Println("\n✅ SUCCESS! All 3 products created with:")
		fmt.Println("   - Simple IDs (1, 2, 3)")
		fmt.Println("   - Unique barcodes")
		fmt.Println("\n🎯 Next: Restart 'wails dev' and test transactions/stock!")
	} else {
		fmt.Printf("\n❌ Only %d products created\n", count)
	}
}
