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
	fmt.Println("  DETAILED PROFIT CALCULATION")
	fmt.Println("========================================")

	now := time.Now()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	monthEnd := now
	monthStartStr := monthStart.Format("2006-01-02")
	monthEndStr := monthEnd.Format("2006-01-02")

	fmt.Printf("\n📅 Periode: %s sampai %s\n", monthStartStr, monthEndStr)

	// 1. Detail setiap transaksi
	fmt.Println("\n1️⃣ DETAIL TRANSAKSI:")
	fmt.Println("------------------------------------------------------------")

	query := `
		SELECT 
			t.nomor_transaksi,
			t.tanggal,
			t.total,
			t.staff_nama
		FROM transaksi t
		WHERE DATE(t.tanggal) >= ? AND DATE(t.tanggal) <= ?
		ORDER BY t.tanggal
	`

	rows, _ := database.Query(query, monthStartStr, monthEndStr)
	defer rows.Close()

	totalPenjualan := 0
	txCount := 0

	for rows.Next() {
		var nomor, tanggal, staff string
		var total int
		rows.Scan(&nomor, &tanggal, &total, &staff)
		fmt.Printf("   %s | %s | Rp %d | %s\n", nomor, tanggal[:10], total, staff)
		totalPenjualan += total
		txCount++
	}

	fmt.Println("   ────────────────────────────────────────────────────────")
	fmt.Printf("   TOTAL: %d transaksi, Rp %d\n", txCount, totalPenjualan)

	// 2. Detail return
	fmt.Println("\n2️⃣ DETAIL RETURN:")
	fmt.Println("------------------------------------------------------------")

	query2 := `
		SELECT 
			r.return_number,
			r.return_date,
			r.refund_amount,
			r.profit_lost,
			r.return_reason
		FROM returns r
		WHERE DATE(r.return_date) >= ? AND DATE(r.return_date) <= ?
		ORDER BY r.return_date
	`

	rows2, _ := database.Query(query2, monthStartStr, monthEndStr)
	defer rows2.Close()

	totalRefund := 0
	totalProfitLost := 0
	returnCount := 0

	for rows2.Next() {
		var returnNum, returnDate, reason string
		var refund, profitLost int
		rows2.Scan(&returnNum, &returnDate, &refund, &profitLost, &reason)
		fmt.Printf("   %s | %s | Refund: Rp %d | Profit Lost: Rp %d | %s\n",
			returnNum, returnDate[:10], refund, profitLost, reason)
		totalRefund += refund
		totalProfitLost += profitLost
		returnCount++
	}

	fmt.Println("   ────────────────────────────────────────────────────────")
	fmt.Printf("   TOTAL: %d return, Refund: Rp %d, Profit Lost: Rp %d\n",
		returnCount, totalRefund, totalProfitLost)

	// 3. Perhitungan HPP Detail
	fmt.Println("\n3️⃣ PERHITUNGAN HPP PER ITEM:")
	fmt.Println("------------------------------------------------------------")

	query3 := `
		SELECT 
			t.nomor_transaksi,
			ti.nama,
			ti.jumlah,
			ti.berat_gram,
			ti.subtotal,
			COALESCE(p.harga_beli, 0) as harga_beli
		FROM transaksi_item ti
		JOIN transaksi t ON t.id = ti.transaksi_id
		LEFT JOIN produk p ON p.id = ti.produk_id
		WHERE DATE(t.tanggal) >= ? AND DATE(t.tanggal) <= ?
		ORDER BY t.tanggal, ti.id
	`

	rows3, _ := database.Query(query3, monthStartStr, monthEndStr)
	defer rows3.Close()

	totalHPP := 0.0
	totalItemSales := 0

	for rows3.Next() {
		var txNum, nama string
		var jumlah, subtotal, hargaBeli int
		var beratGram float64
		rows3.Scan(&txNum, &nama, &jumlah, &beratGram, &subtotal, &hargaBeli)

		var hpp float64
		var typeStr string

		if beratGram > 0 {
			hpp = (beratGram / 1000.0) * float64(hargaBeli)
			typeStr = "Curah"
		} else {
			hpp = float64(jumlah) * float64(hargaBeli)
			typeStr = "Satuan"
		}

		profit := float64(subtotal) - hpp

		fmt.Printf("   %s | %-15s | %s | Sale: Rp %d | HPP: Rp %.0f | Profit: Rp %.0f\n",
			txNum, nama, typeStr, subtotal, hpp, profit)

		totalHPP += hpp
		totalItemSales += subtotal
	}

	fmt.Println("   ────────────────────────────────────────────────────────")
	fmt.Printf("   TOTAL Sales: Rp %d, HPP: Rp %.0f\n", totalItemSales, totalHPP)

	// 4. PERHITUNGAN FINAL
	fmt.Println("\n💰 PERHITUNGAN KEUNTUNGAN BERSIH:")
	fmt.Println("============================================================")

	fmt.Printf("\n   A. Penjualan Kotor        : Rp %d\n", totalPenjualan)
	fmt.Printf("   B. Return (Refund)        : Rp %d\n", totalRefund)
	fmt.Printf("   C. Penjualan Bersih (A-B) : Rp %d\n", totalPenjualan-totalRefund)

	fmt.Printf("\n   D. HPP (Cost)             : Rp %.0f\n", totalHPP)
	fmt.Printf("   E. Gross Profit (C-D)     : Rp %.0f\n", float64(totalPenjualan-totalRefund)-totalHPP)

	fmt.Printf("\n   F. Profit Lost (Return)   : Rp %d\n", totalProfitLost)
	fmt.Printf("   G. NET PROFIT (E-F)       : Rp %.0f\n",
		float64(totalPenjualan-totalRefund)-totalHPP-float64(totalProfitLost))

	netProfit := float64(totalPenjualan-totalRefund) - totalHPP - float64(totalProfitLost)

	if netProfit < 0 {
		netProfit = 0
	}

	fmt.Println("\n============================================================")
	fmt.Printf("   ✅ KEUNTUNGAN BERSIH FINAL: Rp %.0f\n", netProfit)
	fmt.Println("============================================================")

	if netProfit != 11500 {
		fmt.Printf("\n   ⚠️  Hasil (Rp %.0f) tidak sama dengan target (Rp 11,500)\n", netProfit)
		fmt.Printf("   Selisih: Rp %.0f\n", netProfit-11500)
	} else {
		fmt.Println("\n   ✅ Hasil sudah benar!")
	}

	fmt.Println("\n========================================")
}
