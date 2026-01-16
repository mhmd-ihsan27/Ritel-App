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

	fmt.Println("=" + "==========================================================")
	fmt.Println("                 BATCH TRACKING DIAGNOSTIC")
	fmt.Println("=" + "==========================================================")

	// 1. Check if transaksi_batch table exists
	fmt.Println("\n📋 1. CHECK TABLE transaksi_batch")
	var tableName string
	err := database.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='transaksi_batch'").Scan(&tableName)
	if err != nil {
		fmt.Printf("   ❌ TABLE DOES NOT EXIST! Run migration first.\n")
		fmt.Println("\n   To create table, run:")
		fmt.Println("   go run cmd/migrate_batch_tracking/main.go")
		return
	}
	fmt.Println("   ✅ Table exists")

	// 2. Check transaksi_batch data
	fmt.Println("\n📊 2. CHECK transaksi_batch DATA")
	var count int
	database.QueryRow("SELECT COUNT(*) FROM transaksi_batch").Scan(&count)
	fmt.Printf("   Total records: %d\n", count)

	if count > 0 {
		fmt.Println("\n   Latest 5 records:")
		rows, _ := database.Query(`
			SELECT tb.id, tb.transaksi_id, tb.batch_id, tb.produk_id, tb.qty_diambil, p.nama
			FROM transaksi_batch tb
			LEFT JOIN produk p ON tb.produk_id = p.id
			ORDER BY tb.created_at DESC
			LIMIT 5
		`)
		defer rows.Close()

		for rows.Next() {
			var id, transaksiID, produkID int
			var batchID, produkNama string
			var qty float64
			rows.Scan(&id, &transaksiID, &batchID, &produkID, &qty, &produkNama)
			fmt.Printf("   - ID:%d | Transaksi:%d | Batch:%s | Produk:%s | Qty:%.2f\n",
				id, transaksiID, batchID[:8]+"...", produkNama, qty)
		}
	} else {
		fmt.Println("   ⚠️ NO DATA! This means no transactions have recorded batch usage.")
		fmt.Println("   Make sure to create a NEW transaction after the fix was deployed.")
	}

	// 3. Check recent transactions
	fmt.Println("\n📧 3. CHECK RECENT TRANSACTIONS (last 3)")
	rows2, _ := database.Query(`
		SELECT id, nomor_transaksi, tanggal, total
		FROM transaksi
		ORDER BY tanggal DESC
		LIMIT 3
	`)
	defer rows2.Close()

	for rows2.Next() {
		var id, total int
		var noTransaksi, tanggal string
		rows2.Scan(&id, &noTransaksi, &tanggal, &total)

		// Check if this transaction has batch tracking
		var batchCount int
		database.QueryRow("SELECT COUNT(*) FROM transaksi_batch WHERE transaksi_id = ?", id).Scan(&batchCount)

		status := "❌ NO TRACKING"
		if batchCount > 0 {
			status = fmt.Sprintf("✅ %d batches tracked", batchCount)
		}
		fmt.Printf("   - %s (ID:%d) | Total: Rp%d | %s\n", noTransaksi, id, total, status)
	}

	// 4. Check batch data
	fmt.Println("\n🗃️ 4. CHECK BATCH DATA (with qty_tersisa)")
	rows3, _ := database.Query(`
		SELECT b.id, b.produk_id, p.nama, b.qty, b.qty_tersisa, b.status
		FROM batch b
		JOIN produk p ON b.produk_id = p.id
		WHERE b.qty_tersisa > 0
		ORDER BY b.tanggal_kadaluarsa ASC
		LIMIT 5
	`)
	defer rows3.Close()

	for rows3.Next() {
		var batchID, produkNama, status string
		var produkID int
		var qty, qtyTersisa float64
		rows3.Scan(&batchID, &produkID, &produkNama, &qty, &qtyTersisa, &status)
		used := qty - qtyTersisa
		fmt.Printf("   - Batch:%s | %s | Awal:%.2f | Tersisa:%.2f | Terpakai:%.2f | %s\n",
			batchID[:8]+"...", produkNama, qty, qtyTersisa, used, status)
	}

	// 5. Check recent returns
	fmt.Println("\n🔄 5. CHECK RECENT RETURNS (last 3)")
	rows4, _ := database.Query(`
		SELECT r.id, r.transaksi_id, r.no_transaksi, r.return_date, r.refund_amount
		FROM returns r
		ORDER BY r.return_date DESC
		LIMIT 3
	`)
	defer rows4.Close()

	for rows4.Next() {
		var id, transaksiID, refundAmount int
		var noTransaksi, returnDate string
		rows4.Scan(&id, &transaksiID, &noTransaksi, &returnDate, &refundAmount)

		// Check if this return's transaction has batch tracking
		var batchCount int
		database.QueryRow("SELECT COUNT(*) FROM transaksi_batch WHERE transaksi_id = ?", transaksiID).Scan(&batchCount)

		status := "❌ NO BATCH DATA FOR ORIG TRANSAKSI"
		if batchCount > 0 {
			status = fmt.Sprintf("✅ %d batches available for restore", batchCount)
		}
		fmt.Printf("   - Return #%d | Transaksi:%s (ID:%d) | Refund:Rp%d | %s\n",
			id, noTransaksi, transaksiID, refundAmount, status)
	}

	fmt.Println("\n" + "==========================================================")
	fmt.Println("                      DIAGNOSIS")
	fmt.Println("=" + "==========================================================")

	if count == 0 {
		fmt.Println("\n⚠️ PROBLEM: transaksi_batch table is EMPTY")
		fmt.Println("\nPossible causes:")
		fmt.Println("1. All transactions were made BEFORE the fix was deployed")
		fmt.Println("2. The app wasn't restarted after the fix")
		fmt.Println("\nSOLUTION:")
		fmt.Println("1. Restart the app (wails dev)")
		fmt.Println("2. Create a NEW transaction")
		fmt.Println("3. Return that new transaction")
		fmt.Println("4. Check batch qty_tersisa")
	} else {
		fmt.Println("\n✅ transaksi_batch has data!")
		fmt.Println("Check if the return you tested was for a transaction WITH batch tracking.")
	}
}
