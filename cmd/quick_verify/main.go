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

	fmt.Println("=== QUICK VERIFICATION ===\n")

	// Check products
	rows, err := db.Query("SELECT id, nama, harga_jual FROM produk ORDER BY id")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id int
		var nama string
		var hargaJual int
		rows.Scan(&id, &nama, &hargaJual)
		fmt.Printf("✓ ID %d: %s (Rp %d)\n", id, nama, hargaJual)
		count++
	}

	if count == 3 {
		fmt.Println("\n✅ All 3 products ready with simple IDs!")
		fmt.Println("Restart 'wails dev' - transactions and stock updates should work!")
	} else {
		fmt.Printf("\n⚠️  Only %d products found\n", count)
	}
}
