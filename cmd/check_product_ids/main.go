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

	fmt.Println("=== CHECKING CURRENT PRODUCT IDs ===\n")

	rows, err := db.Query("SELECT id, nama FROM produk WHERE deleted_at IS NULL ORDER BY id")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	hasLargeID := false
	for rows.Next() {
		var id int64
		var nama string
		rows.Scan(&id, &nama)

		if id > 1000 {
			fmt.Printf("❌ LARGE ID: %d - %s\n", id, nama)
			hasLargeID = true
		} else {
			fmt.Printf("✓ ID %d: %s\n", id, nama)
		}
	}

	if hasLargeID {
		fmt.Println("\n⚠️  Found products with large IDs!")
		fmt.Println("Solution: Delete all products and restart app to trigger auto-seed")
	} else {
		fmt.Println("\n✅ All products have simple IDs")
	}
}
