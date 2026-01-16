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

	fmt.Println("=== ADDING MISSING PRODUCTS (ID 2 & 3) ===\n")

	now := time.Now()

	// Check current products
	var count int
	db.QueryRow("SELECT COUNT(*) FROM produk").Scan(&count)
	fmt.Printf("Current product count: %d\n\n", count)

	// Add product ID 2 (Jeruk)
	fmt.Println("Adding Jeruk (ID 2)...")
	_, err = db.Exec(`
		INSERT INTO produk (
			id, nama, kategori, harga_jual, harga_beli, stok, satuan,
			jenis_produk, sku, barcode, created_at, updated_at
		) VALUES (2, 'Jeruk', 'Buah', 30000, 20000, 0, 'kg', 'curah', 'SKU-2', '', ?, ?)
	`, now, now)

	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
	} else {
		fmt.Println("✓ Jeruk created")
	}

	// Add product ID 3 (Tomat)
	fmt.Println("\nAdding Tomat (ID 3)...")
	_, err = db.Exec(`
		INSERT INTO produk (
			id, nama, kategori, harga_jual, harga_beli, stok, satuan,
			jenis_produk, sku, barcode, created_at, updated_at
		) VALUES (3, 'Tomat', 'Sayur', 12000, 8000, 0, 'kg', 'curah', 'SKU-3', '', ?, ?)
	`, now, now)

	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
	} else {
		fmt.Println("✓ Tomat created")
	}

	// Verify
	fmt.Println("\n=== FINAL VERIFICATION ===")
	rows, _ := db.Query("SELECT id, nama, harga_jual FROM produk ORDER BY id")
	defer rows.Close()

	finalCount := 0
	for rows.Next() {
		var id int
		var nama string
		var hargaJual int
		rows.Scan(&id, &nama, &hargaJual)
		fmt.Printf("ID %d: %s (Rp %d)\n", id, nama, hargaJual)
		finalCount++
	}

	if finalCount == 3 {
		fmt.Println("\n✅ SUCCESS! All 3 products ready")
		fmt.Println("\nRestart 'wails dev' and test:")
		fmt.Println("- Create transaction ✓")
		fmt.Println("- Update stock ✓")
	} else {
		fmt.Printf("\n⚠️  Only %d products (expected 3)\n", finalCount)
	}
}
