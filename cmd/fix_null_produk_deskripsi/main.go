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

	fmt.Println("=== FIXING NULL DESKRIPSI IN PRODUK ===\n")

	// Update NULL deskripsi to empty string
	result, err := db.Exec("UPDATE produk SET deskripsi = '' WHERE deskripsi IS NULL")
	if err != nil {
		log.Fatalf("Failed to update: %v", err)
	}

	affected, _ := result.RowsAffected()
	fmt.Printf("✓ Updated %d produk records (deskripsi)\n", affected)

	// Also update other potentially NULL text fields
	fields := []string{"gambar", "kadaluarsa", "tanggal_masuk"}
	for _, field := range fields {
		result, err = db.Exec(fmt.Sprintf("UPDATE produk SET %s = '' WHERE %s IS NULL", field, field))
		if err != nil {
			fmt.Printf("Warning: Could not update %s: %v\n", field, err)
		} else {
			affected, _ = result.RowsAffected()
			if affected > 0 {
				fmt.Printf("✓ Updated %d produk records (%s)\n", affected, field)
			}
		}
	}

	// Verify
	var count int
	db.QueryRow("SELECT COUNT(*) FROM produk WHERE deskripsi IS NULL").Scan(&count)

	if count == 0 {
		fmt.Println("\n✅ All produk records have non-NULL deskripsi")
	} else {
		fmt.Printf("\n⚠️  Still have %d NULL deskripsi records\n", count)
	}

	fmt.Println("\nDone! Restart wails dev and try again.")
}
