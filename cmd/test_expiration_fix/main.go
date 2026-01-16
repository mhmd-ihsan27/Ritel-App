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

	fmt.Println("=== TESTING EXPIRATION ALERT FIX ===")
	fmt.Println()

	// Test the FIXED query with DATE() normalization
	fixedQuery := `
		SELECT
			b.id, b.produk_id, p.nama,
			b.tanggal_kadaluarsa,
			p.hari_pemberitahuan_kadaluarsa,
			CAST(julianday(DATE(b.tanggal_kadaluarsa)) - julianday(DATE('now')) AS INTEGER) as days_diff
		FROM batch b
		INNER JOIN produk p ON b.produk_id = p.id
		WHERE b.qty_tersisa > 0
		  AND julianday(DATE(b.tanggal_kadaluarsa)) - julianday(DATE('now')) <= p.hari_pemberitahuan_kadaluarsa
		ORDER BY b.tanggal_kadaluarsa ASC
	`

	rows, err := db.Query(fixedQuery)
	if err != nil {
		fmt.Printf("Error in query: %v\n", err)
		return
	}

	count := 0
	fmt.Println("Batches matching expiration alert criteria:")
	fmt.Println("--------------------------------------------")
	for rows.Next() {
		var bid string
		var pid int
		var nama string
		var kadaluarsa time.Time
		var alertDays int
		var daysDiff int

		rows.Scan(&bid, &pid, &nama, &kadaluarsa, &alertDays, &daysDiff)
		fmt.Printf("✓ %s (Batch: %s...)\n", nama, bid[:8])
		fmt.Printf("  Kadaluarsa: %s | Alert Threshold: %d days | Days Left: %d\n",
			kadaluarsa.Format("2006-01-02"), alertDays, daysDiff)
		fmt.Println()
		count++
	}
	rows.Close()

	if count == 0 {
		fmt.Println("❌ No batches found - this might indicate an issue")
	} else {
		fmt.Printf("✅ Total batches found: %d\n", count)
	}
}
