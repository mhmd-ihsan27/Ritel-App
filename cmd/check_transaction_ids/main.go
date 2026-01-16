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

	fmt.Println("=== CHECKING TRANSACTION IDs ===")

	// Get recent transactions
	query := `SELECT id, nomor_transaksi, tanggal, total FROM transaksi ORDER BY tanggal DESC LIMIT 20`
	rows, err := db.Query(query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("\nRecent transactions:")
	fmt.Println("--------------------")
	for rows.Next() {
		var id int64
		var nomorTransaksi string
		var tanggal string
		var total int

		rows.Scan(&id, &nomorTransaksi, &tanggal, &total)
		fmt.Printf("ID: %d, No: %s, Date: %s, Total: %d\n", id, nomorTransaksi, tanggal, total)
	}

	fmt.Println("\n=== ID TYPE CHECK ===")
	var maxID int64
	db.QueryRow("SELECT MAX(id) FROM transaksi").Scan(&maxID)
	fmt.Printf("Max transaction ID: %d\n", maxID)
	fmt.Printf("Max int32 value: %d\n", int32(2147483647))

	if maxID > 2147483647 {
		fmt.Println("⚠️  WARNING: Transaction IDs exceed int32 max value!")
	} else {
		fmt.Println("✓ Transaction IDs are within int32 range")
	}
}
