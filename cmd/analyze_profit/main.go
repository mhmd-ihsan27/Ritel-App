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
	fmt.Println("  DASHBOARD KEUNTUNGAN BERSIH ANALYSIS")
	fmt.Println("========================================")

	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	monthEnd := now

	fmt.Printf("\n📅 Periode: %s sampai %s\n", monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02"))

	// 1. Hitung Total Penjualan
	query := `SELECT COUNT(*), COALESCE(SUM(total), 0) FROM transaksi WHERE DATE(tanggal) >= ? AND DATE(tanggal) <= ?`
	var txCount, totalPenjualan int
	database.QueryRow(query, monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02")).Scan(&txCount, &totalPenjualan)

	fmt.Printf("\n1️⃣ PENJUALAN KOTOR:\n")
	fmt.Printf("   Jumlah Transaksi: %d\n", txCount)
	fmt.Printf("   Total Penjualan: Rp %d\n", totalPenjualan)

	// 2. Hitung HPP (Cost)
	query2 := `
		SELECT 
			SUM(CASE 
				WHEN ti.berat_gram > 0 THEN (ti.berat_gram / 1000.0) * COALESCE(p.harga_beli, 0)
				ELSE ti.jumlah * COALESCE(p.harga_beli, 0)
			END) as total_hpp
		FROM transaksi_item ti
		JOIN transaksi t ON t.id = ti.transaksi_id
		LEFT JOIN produk p ON p.id = ti.produk_id
		WHERE DATE(t.tanggal) >= ? AND DATE(t.tanggal) <= ?
	`

	var totalHPP float64
	database.QueryRow(query2, monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02")).Scan(&totalHPP)

	fmt.Printf("\n2️⃣ HARGA POKOK PENJUALAN (HPP):\n")
	fmt.Printf("   Total HPP: Rp %.0f\n", totalHPP)

	// 3. Hitung Return Impact
	query3 := `
		SELECT 
			COUNT(*),
			COALESCE(SUM(refund_amount), 0)
		FROM returns
		WHERE DATE(return_date) >= ? AND DATE(return_date) <= ?
	`

	var returnCount, totalRefund int
	database.QueryRow(query3, monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02")).Scan(&returnCount, &totalRefund)

	fmt.Printf("\n3️⃣ RETUR/RETURN:\n")
	fmt.Printf("   Jumlah Return: %d\n", returnCount)
	fmt.Printf("   Total Refund: Rp %d\n", totalRefund)

	// 4. Hitung Profit Lost dari Return
	query4 := `
		SELECT COALESCE(SUM(profit_lost), 0)
		FROM returns
		WHERE DATE(return_date) >= ? AND DATE(return_date) <= ?
	`

	var profitLost int
	database.QueryRow(query4, monthStart.Format("2006-01-02"), monthEnd.Format("2006-01-02")).Scan(&profitLost)

	fmt.Printf("   Profit Lost dari Return: Rp %d\n", profitLost)

	// 5. Kalkulasi Final
	fmt.Printf("\n💰 KALKULASI KEUNTUNGAN BERSIH:\n")
	fmt.Println("   ────────────────────────────────────────")

	netRevenue := totalPenjualan - totalRefund
	fmt.Printf("   Penjualan Bersih = %d - %d = Rp %d\n", totalPenjualan, totalRefund, netRevenue)

	grossProfit := float64(netRevenue) - totalHPP
	fmt.Printf("   Gross Profit = %.0f - %.0f = Rp %.0f\n", float64(netRevenue), totalHPP, grossProfit)

	netProfit := grossProfit - float64(profitLost)
	fmt.Printf("   Net Profit = %.0f - %d = Rp %.0f\n", grossProfit, profitLost, netProfit)

	fmt.Println("   ────────────────────────────────────────")

	if netProfit < 0 {
		fmt.Printf("   ⚠️  Profit negatif (Rp %.0f), akan ditampilkan sebagai Rp 0\n", netProfit)
		netProfit = 0
	}

	fmt.Printf("\n✅ KEUNTUNGAN BERSIH FINAL: Rp %.0f\n", netProfit)

	// Penjelasan jika 0
	if netProfit == 0 {
		fmt.Println("\n📝 KENAPA Rp 0?")
		if float64(totalRefund) > float64(totalPenjualan)*0.5 {
			fmt.Printf("   • Return terlalu banyak: Rp %d (%.0f%% dari penjualan)\n",
				totalRefund, float64(totalRefund)/float64(totalPenjualan)*100)
		}
		if totalHPP > float64(netRevenue) {
			fmt.Printf("   • HPP lebih besar dari penjualan bersih\n")
			fmt.Printf("     HPP: Rp %.0f vs Revenue: Rp %d\n", totalHPP, netRevenue)
		}
	}

	fmt.Println("\n========================================")
}
