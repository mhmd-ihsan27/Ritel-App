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

	fmt.Println("=== CHECKING RETURN DATA WITH BROADER DATE RANGE ===\n")

	// Check last 7 days
	now := time.Now()
	weekAgo := now.AddDate(0, 0, -7)

	var returnCount int
	var totalRefund int
	query := `SELECT COUNT(*), COALESCE(SUM(refund_amount), 0) FROM returns WHERE return_date >= ? AND return_date <= ? AND type = 'refund'`
	db.QueryRow(query, weekAgo, now).Scan(&returnCount, &totalRefund)

	fmt.Printf("Last 7 days refunds:\n")
	fmt.Printf("  Count: %d\n", returnCount)
	fmt.Printf("  Total: Rp %d\n\n", totalRefund)

	// Check transaction totals for same period
	var txCount int
	var txTotal int
	query2 := `SELECT COUNT(*), COALESCE(SUM(total), 0) FROM transaksi WHERE tanggal >= ? AND tanggal <= ?`
	db.QueryRow(query2, weekAgo, now).Scan(&txCount, &txTotal)

	fmt.Printf("Last 7 days transactions:\n")
	fmt.Printf("  Count: %d\n", txCount)
	fmt.Printf("  Gross Total: Rp %d\n", txTotal)
	fmt.Printf("  Net Total (after refunds): Rp %d\n\n", txTotal-totalRefund)

	// Show individual returns with transaction details
	fmt.Println("=== RETURN DETAILS ===")
	query3 := `
		SELECT 
			r.id, 
			r.transaksi_id, 
			r.return_date, 
			r.refund_amount,
			t.nomor_transaksi,
			t.tanggal as tx_date,
			t.total as tx_total
		FROM returns r
		LEFT JOIN transaksi t ON r.transaksi_id = t.id
		WHERE r.return_date >= ?
		ORDER BY r.return_date DESC
	`

	rows, err := db.Query(query3, weekAgo)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var returnID int64
		var transaksiID int64
		var returnDate time.Time
		var refundAmount int
		var nomorTransaksi sql.NullString
		var txDate sql.NullTime
		var txTotal sql.NullInt64

		rows.Scan(&returnID, &transaksiID, &returnDate, &refundAmount, &nomorTransaksi, &txDate, &txTotal)

		fmt.Printf("\nReturn ID: %d\n", returnID)
		fmt.Printf("  Transaction: %s (ID: %d)\n", nomorTransaksi.String, transaksiID)
		fmt.Printf("  Return Date: %s\n", returnDate.Format("2006-01-02 15:04:05"))
		if txDate.Valid {
			fmt.Printf("  Original Tx Date: %s\n", txDate.Time.Format("2006-01-02 15:04:05"))
		}
		fmt.Printf("  Refund Amount: Rp %d\n", refundAmount)
		if txTotal.Valid {
			fmt.Printf("  Original Tx Total: Rp %d\n", txTotal.Int64)
		}
	}
}
