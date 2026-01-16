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

	fmt.Println("=== Checking transaksi_batch table ===")

	// Check if table exists
	var tableName string
	err := database.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='transaksi_batch'").Scan(&tableName)
	if err != nil {
		fmt.Printf("❌ Table transaksi_batch NOT FOUND: %v\n", err)
		fmt.Println("\n⚠️ You need to run the migration!")
		fmt.Println("Run: sqlite3 ritel.db < database/migrations/001_add_transaksi_batch.sql")
		return
	}

	fmt.Println("✅ Table transaksi_batch EXISTS")

	// Check data count
	var count int
	database.QueryRow("SELECT COUNT(*) FROM transaksi_batch").Scan(&count)
	fmt.Printf("📊 Total records in transaksi_batch: %d\n", count)

	if count > 0 {
		// Show sample data
		fmt.Println("\n=== Sample Data ===")
		rows, _ := database.Query(`
			SELECT tb.id, tb.transaksi_id, tb.batch_id, tb.produk_id, tb.qty_diambil,
			       t.nomor_transaksi, p.nama
			FROM transaksi_batch tb
			JOIN transaksi t ON tb.transaksi_id = t.id
			JOIN produk p ON tb.produk_id = p.id
			ORDER BY tb.created_at DESC
			LIMIT 5
		`)
		defer rows.Close()

		for rows.Next() {
			var id, transaksiID, produkID int
			var batchID, noTransaksi, produkNama string
			var qty float64
			rows.Scan(&id, &transaksiID, &batchID, &produkID, &qty, &noTransaksi, &produkNama)
			fmt.Printf("  - Transaksi: %s | Batch: %s | Produk: %s | Qty: %.2f\n",
				noTransaksi, batchID[:8]+"...", produkNama, qty)
		}
	} else {
		fmt.Println("\n⚠️ No data in transaksi_batch")
		fmt.Println("This means no NEW transactions have been created since the implementation.")
		fmt.Println("Try creating a new transaction to test the batch tracking.")
	}

	// Check recent returns
	fmt.Println("\n=== Recent Returns ===")
	rows, _ := database.Query(`
		SELECT r.id, r.no_transaksi, r.return_date, ri.product_id, ri.quantity,
		       p.nama, p.stok
		FROM returns r
		JOIN return_items ri ON r.id = ri.return_id
		JOIN produk p ON ri.product_id = p.id
		ORDER BY r.return_date DESC
		LIMIT 3
	`)
	defer rows.Close()

	for rows.Next() {
		var returnID, produkID, qty int
		var noTransaksi, returnDate, produkNama string
		var stok float64
		rows.Scan(&returnID, &noTransaksi, &returnDate, &produkID, &qty, &produkNama, &stok)
		fmt.Printf("  - Return #%d: %s | Produk: %s | Qty: %d | Stok sekarang: %.2f\n",
			returnID, noTransaksi, produkNama, qty, stok)
	}
}
