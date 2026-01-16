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

	fmt.Println("=== PRODUCTS WITH EXPIRATION SETTINGS ===")
	rows, err := db.Query("SELECT id, nama, hari_pemberitahuan_kadaluarsa, masa_simpan_hari FROM produk WHERE masa_simpan_hari > 0")
	if err != nil {
		log.Fatal(err)
	}
	for rows.Next() {
		var id int
		var nama string
		var alertDays, shelfLife int
		rows.Scan(&id, &nama, &alertDays, &shelfLife)
		fmt.Printf("ID: %d, Nama: %s, Alert: %d, ShelfLife: %d\n", id, nama, alertDays, shelfLife)

		// Check batches for this product
		batchRows, _ := db.Query("SELECT id, qty_tersisa, tanggal_restok, tanggal_kadaluarsa, status FROM batch WHERE produk_id = ? AND qty_tersisa > 0", id)
		for batchRows.Next() {
			var bid string
			var qty float64
			var restok, kadaluarsa time.Time
			var status string
			batchRows.Scan(&bid, &qty, &restok, &kadaluarsa, &status)

			daysDiff := kadaluarsa.Sub(time.Now()).Hours() / 24
			fmt.Printf("  - Batch: %s, Qty: %.2f, Restok: %s, Kadaluarsa: %s, Status: %s, DaysDiff: %.2f\n",
				bid, qty, restok.Format("2006-01-02"), kadaluarsa.Format("2006-01-02"), status, daysDiff)
		}
		batchRows.Close()
	}
	rows.Close()

	fmt.Println("\n=== QUERY SIMULATION ===")
	// Simulate the repository query
	simQuery := `
		SELECT
			b.id, b.produk_id, p.nama,
			b.tanggal_kadaluarsa,
			p.hari_pemberitahuan_kadaluarsa,
			julianday(b.tanggal_kadaluarsa) - julianday('now') as diff
		FROM batch b
		INNER JOIN produk p ON b.produk_id = p.id
		WHERE b.qty_tersisa > 0
		  AND julianday(b.tanggal_kadaluarsa) - julianday('now') <= p.hari_pemberitahuan_kadaluarsa
	`
	rows, err = db.Query(simQuery)
	if err != nil {
		fmt.Printf("Error in sim query: %v\n", err)
	} else {
		count := 0
		for rows.Next() {
			var bid string
			var pid int
			var nama string
			var kadaluarsa time.Time
			var alertDays int
			var diff float64
			rows.Scan(&bid, &pid, &nama, &kadaluarsa, &alertDays, &diff)
			fmt.Printf("Match: %s (%s), Kadaluarsa: %s, Alert: %d, Diff: %.2f\n", nama, bid, kadaluarsa.Format("2006-01-02"), alertDays, diff)
			count++
		}
		fmt.Printf("Total matches: %d\n", count)
	}
	rows.Close()
}
