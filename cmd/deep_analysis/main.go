package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

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

	fmt.Println("=== COMPREHENSIVE DATABASE ANALYSIS ===\n")

	// 1. Check products
	fmt.Println("1. PRODUCTS:")
	rows, _ := db.Query("SELECT id, nama, harga_jual, harga_beli, stok, satuan FROM produk ORDER BY id LIMIT 10")
	productCount := 0
	for rows.Next() {
		var id int
		var nama string
		var hargaJual, hargaBeli int
		var stok float64
		var satuan string
		rows.Scan(&id, &nama, &hargaJual, &hargaBeli, &stok, &satuan)
		fmt.Printf("   ID %d: %s | Jual: Rp %d | Beli: Rp %d | Stok: %.2f %s\n",
			id, nama, hargaJual, hargaBeli, stok, satuan)
		productCount++
	}
	rows.Close()

	if productCount == 0 {
		fmt.Println("   ❌ NO PRODUCTS FOUND!")
	}

	// 2. Check categories
	fmt.Println("\n2. CATEGORIES:")
	rows, _ = db.Query("SELECT id, nama, deskripsi FROM kategori")
	for rows.Next() {
		var id int
		var nama string
		var deskripsi sql.NullString
		rows.Scan(&id, &nama, &deskripsi)
		desc := "NULL"
		if deskripsi.Valid {
			desc = deskripsi.String
		}
		fmt.Printf("   ID %d: %s (deskripsi: %s)\n", id, nama, desc)
	}
	rows.Close()

	// 3. Check users
	fmt.Println("\n3. USERS:")
	var userCount int
	db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	fmt.Printf("   Total users: %d\n", userCount)

	// 4. Check batches
	fmt.Println("\n4. BATCHES:")
	var batchCount int
	db.QueryRow("SELECT COUNT(*) FROM batch").Scan(&batchCount)
	fmt.Printf("   Total batches: %d\n", batchCount)

	if batchCount > 0 {
		rows, _ = db.Query("SELECT id, produk_id, stok_tersedia FROM batch LIMIT 5")
		for rows.Next() {
			var id string
			var produkID int
			var stok float64
			rows.Scan(&id, &produkID, &stok)

			// Check if product exists
			var exists bool
			db.QueryRow("SELECT EXISTS(SELECT 1 FROM produk WHERE id = ?)", produkID).Scan(&exists)
			status := "✓"
			if !exists {
				status = "❌ ORPHANED"
			}
			fmt.Printf("   %s Batch %s → Product %d (stok: %.2f)\n", status, id, produkID, stok)
		}
		rows.Close()
	}

	// 5. Check transactions
	fmt.Println("\n5. TRANSACTIONS:")
	var txCount int
	db.QueryRow("SELECT COUNT(*) FROM transaksi").Scan(&txCount)
	fmt.Printf("   Total transactions: %d\n", txCount)

	// 6. Check returns
	fmt.Println("\n6. RETURNS:")
	var returnCount int
	db.QueryRow("SELECT COUNT(*) FROM returns").Scan(&returnCount)
	fmt.Printf("   Total returns: %d\n", returnCount)

	// 7. Check for NULL deskripsi
	fmt.Println("\n7. NULL CHECKS:")
	var nullDescCount int
	db.QueryRow("SELECT COUNT(*) FROM kategori WHERE deskripsi IS NULL").Scan(&nullDescCount)
	if nullDescCount > 0 {
		fmt.Printf("   ❌ %d categories with NULL deskripsi\n", nullDescCount)
	} else {
		fmt.Println("   ✓ No NULL deskripsi")
	}

	// 8. Check produk schema
	fmt.Println("\n8. PRODUK TABLE COLUMNS:")
	rows, _ = db.Query("PRAGMA table_info(produk)")
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull, pk int
		var dfltValue sql.NullString
		rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk)
		fmt.Printf("   - %s (%s)\n", name, ctype)
	}
	rows.Close()

	fmt.Println("\n=== SUMMARY ===")
	if productCount == 0 {
		fmt.Println("❌ CRITICAL: No products in database")
		fmt.Println("   → Cannot create transactions or update stock")
	} else if productCount > 0 {
		fmt.Println("✓ Products exist")
		fmt.Println("   → Check if IDs are simple (1,2,3) or large/negative")
	}

	if nullDescCount > 0 {
		fmt.Println("❌ NULL deskripsi issue exists")
	}
}
