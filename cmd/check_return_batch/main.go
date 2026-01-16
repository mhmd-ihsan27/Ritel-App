package main

import (
	"fmt"
	"log"
	"ritel-app/internal/database"
)

func main() {
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to init database:", err)
	}

	fmt.Println("========================================")
	fmt.Println("  BATCH QUANTITY RESTORATION CHECK")
	fmt.Println("========================================")

	// Check recent transactions and their batch usage
	fmt.Println("\n1️⃣ RECENT TRANSACTIONS WITH BATCH USAGE:")
	fmt.Println("------------------------------------------------------------")

	query := `
		SELECT 
			t.nomor_transaksi,
			t.tanggal,
			t.total,
			t.status,
			COUNT(tb.id) as batch_count
		FROM transaksi t
		LEFT JOIN transaksi_batch tb ON t.id = tb.transaksi_id
		WHERE DATE(t.tanggal) >= DATE('now', '-7 days')
		GROUP BY t.id
		ORDER BY t.tanggal DESC
		LIMIT 10
	`

	rows, err := database.Query(query)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var nomor, tanggal, status string
		var total, batchCount int
		rows.Scan(&nomor, &tanggal, &total, &status, &batchCount)
		fmt.Printf("   %s | %s | Rp %d | %s | %d batches\n",
			nomor, tanggal[:16], total, status, batchCount)
	}

	// Check returns
	fmt.Println("\n2️⃣ RECENT RETURNS:")
	fmt.Println("------------------------------------------------------------")

	query2 := `
		SELECT 
			r.return_number,
			r.return_date,
			r.no_transaksi,
			r.reason,
			r.type,
			r.refund_amount,
			COUNT(ri.id) as item_count
		FROM returns r
		LEFT JOIN return_items ri ON r.id = ri.return_id
		WHERE DATE(r.return_date) >= DATE('now', '-7 days')
		GROUP BY r.id
		ORDER BY r.return_date DESC
		LIMIT 10
	`

	rows2, err := database.Query(query2)
	if err != nil {
		log.Fatal(err)
	}
	defer rows2.Close()

	var recentReturns []string

	for rows2.Next() {
		var returnNum, returnDate, noTransaksi, reason, returnType string
		var refundAmount, itemCount int
		rows2.Scan(&returnNum, &returnDate, &noTransaksi, &reason, &returnType, &refundAmount, &itemCount)
		fmt.Printf("   %s | %s | %s | %s | %s | Rp %d | %d items\n",
			returnNum, returnDate[:16], noTransaksi, reason, returnType, refundAmount, itemCount)
		recentReturns = append(recentReturns, noTransaksi)
	}

	// Check batch status before and after return
	if len(recentReturns) > 0 {
		fmt.Println("\n3️⃣ BATCH USAGE FOR RETURNED TRANSACTIONS:")
		fmt.Println("------------------------------------------------------------")

		for _, noTx := range recentReturns {
			fmt.Printf("\n   Transaction: %s\n", noTx)

			// Get transaction ID
			var txID int64
			err := database.QueryRow("SELECT id FROM transaksi WHERE nomor_transaksi = ?", noTx).Scan(&txID)
			if err != nil {
				fmt.Printf("   Error getting transaction ID: %v\n", err)
				continue
			}

			// Get batch usage
			query3 := `
				SELECT 
					tb.batch_id,
					tb.produk_id,
					tb.qty_diambil,
					b.qty_tersisa,
					p.nama
				FROM transaksi_batch tb
				JOIN batch b ON b.id = tb.batch_id
				JOIN produk p ON p.id = tb.produk_id
				WHERE tb.transaksi_id = ?
			`

			rows3, err := database.Query(query3, txID)
			if err != nil {
				fmt.Printf("   Error getting batch usage: %v\n", err)
				continue
			}

			for rows3.Next() {
				var batchID, produkNama string
				var produkID int
				var qtyDiambil, qtyTersisa float64
				rows3.Scan(&batchID, &produkID, &qtyDiambil, &qtyTersisa, &produkNama)
				fmt.Printf("     Batch: %s | %s | Diambil: %.2f | Tersisa: %.2f\n",
					batchID, produkNama, qtyDiambil, qtyTersisa)
			}
			rows3.Close()
		}
	}

	fmt.Println("\n========================================")
	fmt.Println("💡 ANALISA:")
	fmt.Println("============================================")
	fmt.Println("Cek apakah:")
	fmt.Println("1. Transaksi memiliki batch usage data (batch_count > 0)")
	fmt.Println("2. Return reason bukan 'damaged' (if damaged, stock tidak di-restore)")
	fmt.Println("3. Qty tersisa di batch bertambah setelah return")
	fmt.Println("========================================")
}
