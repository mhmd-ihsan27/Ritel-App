package main

import (
	"fmt"
	"log"
	"ritel-app/internal/database"
)

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to init database:", err)
	}

	fmt.Println("========================================")
	fmt.Println("  TRANSACTION DATE ANALYSIS")
	fmt.Println("========================================")

	// Check all transactions with their exact timestamps
	query := `
		SELECT 
			id,
			nomor_transaksi,
			tanggal,
			DATE(tanggal) as date_only,
			TIME(tanggal) as time_only,
			total,
			staff_nama,
			created_at
		FROM transaksi
		WHERE DATE(tanggal) >= '2026-01-09'
		ORDER BY tanggal DESC
		LIMIT 20
	`

	rows, err := database.Query(query)
	if err != nil {
		log.Fatalf("Error querying transactions: %v\n", err)
	}
	defer rows.Close()

	fmt.Println("\n📊 TRANSACTION DETAILS (Last 20 from 2026-01-09):")
	fmt.Println("------------------------------------------------------------")
	fmt.Printf("%-20s | %-12s | %-10s | %-8s | %-10s | %-15s\n",
		"Nomor", "Date", "Time", "Total", "Staff", "Created At")
	fmt.Println("------------------------------------------------------------")

	count09 := 0
	count10 := 0

	for rows.Next() {
		var id int64
		var nomor, dateOnly, timeOnly, staffNama, createdAt string
		var tanggal string
		var total int

		err := rows.Scan(&id, &nomor, &tanggal, &dateOnly, &timeOnly, &total, &staffNama, &createdAt)
		if err != nil {
			log.Printf("Scan error: %v\n", err)
			continue
		}

		if dateOnly == "2026-01-09" {
			count09++
		} else if dateOnly == "2026-01-10" {
			count10++
		}

		fmt.Printf("%-20s | %-12s | %-8s | Rp%-7d | %-15s | %s\n",
			nomor, dateOnly, timeOnly, total, staffNama, createdAt[:19])
	}

	fmt.Println("------------------------------------------------------------")
	fmt.Printf("\nSUMMARY:\n")
	fmt.Printf("  2026-01-09: %d transactions\n", count09)
	fmt.Printf("  2026-01-10: %d transactions\n", count10)
	fmt.Println()

	// Check if there's timestamp manipulation
	fmt.Println("\n🔍 CHECKING FOR TIMESTAMP ISSUES:")
	fmt.Println("------------------------------------------------------------")

	query2 := `
		SELECT 
			COUNT(*) as count,
			DATE(tanggal) as tx_date,
			MIN(tanggal) as first_tx,
			MAX(tanggal) as last_tx,
			MIN(created_at) as first_created,
			MAX(created_at) as last_created
		FROM transaksi
		WHERE DATE(tanggal) IN ('2026-01-09', '2026-01-10')
		GROUP BY DATE(tanggal)
		ORDER BY tx_date DESC
	`

	rows2, err := database.Query(query2)
	if err != nil {
		log.Printf("Error: %v\n", err)
	} else {
		defer rows2.Close()
		for rows2.Next() {
			var count int
			var txDate, firstTx, lastTx, firstCreated, lastCreated string
			rows2.Scan(&count, &txDate, &firstTx, &lastTx, &firstCreated, &lastCreated)

			fmt.Printf("\nDate: %s (%d transactions)\n", txDate, count)
			fmt.Printf("  Transaction time range: %s to %s\n", firstTx[:19], lastTx[:19])
			fmt.Printf("  Created time range:     %s to %s\n", firstCreated[:19], lastCreated[:19])
		}
	}

	fmt.Println("\n========================================")
}
