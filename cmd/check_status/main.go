package main

import (
	"fmt"
	"log"
	"ritel-app/internal/database"
	"time"
)

func main() {
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to init database:", err)
	}

	fmt.Println("========================================")
	fmt.Println("  CHECK TRANSACTION STATUS")
	fmt.Println("========================================")

	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	monthEnd := now

	fmt.Printf("\nPeriode: %s sampai %s\n\n", monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02"))

	query := `
		SELECT 
			nomor_transaksi,
			DATE(tanggal) as tx_date,
			total,
			status,
			staff_nama
		FROM transaksi
		WHERE DATE(tanggal) >= ? AND DATE(tanggal) <= ?
		ORDER BY tanggal
	`

	rows, err := database.Query(query, monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02"))
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("SEMUA TRANSAKSI:")
	fmt.Println("------------------------------------------------------------")
	fmt.Printf("%-20s | %-12s | %-10s | %-20s | %s\n", "Nomor", "Tanggal", "Total", "Status", "Staff")
	fmt.Println("------------------------------------------------------------")

	statusCount := make(map[string]int)
	totalByStatus := make(map[string]int)
	total := 0

	for rows.Next() {
		var nomor, txDate, status, staff string
		var amount int
		rows.Scan(&nomor, &txDate, &amount, &status, &staff)

		fmt.Printf("%-20s | %-12s | Rp %-7d | %-20s | %s\n", nomor, txDate, amount, status, staff)

		statusCount[status]++
		totalByStatus[status] += amount
		total++
	}

	fmt.Println("------------------------------------------------------------")
	fmt.Printf("Total: %d transaksi\n", total)

	fmt.Println("\n📊 RINGKASAN PER STATUS:")
	fmt.Println("------------------------------------------------------------")
	for status, count := range statusCount {
		fmt.Printf("   %-20s : %d transaksi, Rp %d\n", status, count, totalByStatus[status])
	}

	fmt.Println("\n🔍 ANALISA:")
	fmt.Println("------------------------------------------------------------")

	validCount := statusCount["selesai"]
	fullyReturnedCount := statusCount["fully_returned"]

	if validCount == 0 {
		fmt.Println("   ⚠️  TIDAK ADA transaksi dengan status 'selesai'!")
		fmt.Println("   Ini sebabnya dashboard menampilkan Rp 0")
	} else {
		fmt.Printf("   ✅ Ada %d transaksi valid (status='selesai')\n", validCount)
	}

	if fullyReturnedCount > 0 {
		fmt.Printf("   ℹ️  Ada %d transaksi fully_returned (diabaikan)\n", fullyReturnedCount)
	}

	// Check kemungkinan status berbeda
	fmt.Println("\n💡 KEMUNGKINAN MASALAH:")
	for status := range statusCount {
		if status != "selesai" && status != "fully_returned" {
			fmt.Printf("   ⚠️  Ditemukan status lain: '%s'\n", status)
		}
	}

	fmt.Println("\n========================================")
}
