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

	fmt.Println("=== FINAL FIX: CREATE PRODUCTS WITH SIMPLE IDS ===\n")

	// Step 1: Delete all products
	fmt.Println("Step 1: Clearing products...")
	_, err = db.Exec("DELETE FROM produk")
	if err != nil {
		log.Fatalf("Failed to delete products: %v", err)
	}
	fmt.Println("✓ Deleted all products")

	// Step 2: Reset auto-increment
	_, err = db.Exec("DELETE FROM sqlite_sequence WHERE name='produk'")
	if err != nil {
		fmt.Printf("Warning: %v\n", err)
	}
	fmt.Println("✓ Reset auto-increment\n")

	// Step 3: Insert products with CORRECT SCHEMA
	// Note: Using 'kategori' (TEXT) not 'kategori_id'
	//       Using 'jenis_produk' (TEXT) not 'is_curah'
	fmt.Println("Step 3: Creating products with IDs 1, 2, 3...")

	now := time.Now()
	products := []struct {
		id        int
		nama      string
		kategori  string
		hargaJual int
		hargaBeli int
	}{
		{1, "Bayam", "Sayur", 15000, 10000},
		{2, "Jeruk", "Buah", 30000, 20000},
		{3, "Tomat", "Sayur", 12000, 8000},
	}

	for _, p := range products {
		_, err := db.Exec(`
			INSERT INTO produk (
				id, nama, kategori, harga_jual, harga_beli, stok, satuan,
				jenis_produk, sku, barcode, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, 0, 'kg', 'curah', ?, '', ?, ?)
		`, p.id, p.nama, p.kategori, p.hargaJual, p.hargaBeli,
			fmt.Sprintf("SKU-%d", p.id), now, now)

		if err != nil {
			fmt.Printf("❌ Failed to create %s: %v\n", p.nama, err)
		} else {
			fmt.Printf("✓ Created %s (ID: %d)\n", p.nama, p.id)
		}
	}

	// Step 4: Verify
	fmt.Println("\n=== VERIFICATION ===")
	rows, _ := db.Query("SELECT id, nama, harga_jual, stok FROM produk ORDER BY id")
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id int
		var nama string
		var hargaJual int
		var stok float64
		rows.Scan(&id, &nama, &hargaJual, &stok)
		fmt.Printf("ID %d: %s (Rp %d, Stok: %.2f kg)\n", id, nama, hargaJual, stok)
		count++
	}

	if count == 3 {
		fmt.Println("\n✅ SUCCESS! All 3 products created with simple IDs")
		fmt.Println("\nNext steps:")
		fmt.Println("1. Restart 'wails dev'")
		fmt.Println("2. Try creating a transaction")
		fmt.Println("3. Try updating stock")
		fmt.Println("4. Both should work now!")
	} else {
		fmt.Printf("\n⚠️  Only %d products created (expected 3)\n", count)
	}
}
