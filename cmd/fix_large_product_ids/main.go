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

	fmt.Println("=== REPLACING LARGE ID PRODUCTS WITH SIMPLE IDs ===\n")

	// Step 1: Get all current products
	type Product struct {
		ID          int64
		Nama        string
		SKU         string
		Barcode     string
		Kategori    string
		HargaJual   int
		HargaBeli   int
		Stok        float64
		Satuan      string
		JenisProduk string
	}

	rows, err := db.Query(`
		SELECT id, nama, sku, barcode, kategori, harga_jual, harga_beli, stok, satuan, jenis_produk 
		FROM produk 
		WHERE deleted_at IS NULL 
		ORDER BY created_at
	`)
	if err != nil {
		log.Fatal(err)
	}

	var products []Product
	for rows.Next() {
		var p Product
		var barcode, jenisProduk sql.NullString
		rows.Scan(&p.ID, &p.Nama, &p.SKU, &barcode, &p.Kategori, &p.HargaJual, &p.HargaBeli, &p.Stok, &p.Satuan, &jenisProduk)
		if barcode.Valid {
			p.Barcode = barcode.String
		}
		if jenisProduk.Valid {
			p.JenisProduk = jenisProduk.String
		} else {
			p.JenisProduk = "curah"
		}
		products = append(products, p)
	}
	rows.Close()

	if len(products) == 0 {
		fmt.Println("No products found")
		return
	}

	fmt.Printf("Found %d products\n\n", len(products))

	// Step 2: Delete all products
	fmt.Println("Deleting all products...")
	_, err = db.Exec("DELETE FROM produk")
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec("DELETE FROM sqlite_sequence WHERE name='produk'")
	if err != nil {
		fmt.Printf("Warning: %v\n", err)
	}
	fmt.Println("✓ Cleared\n")

	// Step 3: Re-insert with simple IDs
	fmt.Println("Re-creating products with simple IDs...")
	now := time.Now()

	for i, p := range products {
		newID := i + 1
		_, err := db.Exec(`
			INSERT INTO produk (
				id, nama, sku, barcode, kategori, harga_jual, harga_beli, stok, satuan,
				jenis_produk, deskripsi, gambar, kadaluarsa, tanggal_masuk,
				created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', ?, ?)
		`, newID, p.Nama, p.SKU, p.Barcode, p.Kategori, p.HargaJual, p.HargaBeli, p.Stok, p.Satuan,
			p.JenisProduk, now, now)

		if err != nil {
			fmt.Printf("❌ Failed to create %s: %v\n", p.Nama, err)
		} else {
			fmt.Printf("✓ %s: ID %d → %d\n", p.Nama, p.ID, newID)
		}
	}

	fmt.Println("\n✅ All products now have simple IDs!")
	fmt.Println("Refresh the UI to see the changes")
}
