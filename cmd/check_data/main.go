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

	fmt.Println("=== TRANSACTION COUNT CHECK (LAST 60 DAYS) ===")

	rows, _ := db.Query(`
		SELECT DATE(tanggal) as tgl, COUNT(*) 
		FROM transaksi 
		WHERE DATE(tanggal) >= DATE('now', '-60 days')
		GROUP BY DATE(tanggal)
		ORDER BY tgl DESC
	`)

	total := 0
	for rows.Next() {
		var tgl string
		var count int
		rows.Scan(&tgl, &count)
		fmt.Printf("  %s: %d\n", tgl, count)
		total += count
	}
	rows.Close()

	fmt.Printf("\nTotal in last 60 days: %d\n", total)
	fmt.Println("=== END CHECK ===")
}
