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

	fmt.Println("=== Running Migration: Add transaksi_batch table ===")

	// Create transaksi_batch table
	_, err := database.Exec(`
		CREATE TABLE IF NOT EXISTS transaksi_batch (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			transaksi_id INTEGER NOT NULL,
			batch_id TEXT NOT NULL,
			produk_id INTEGER NOT NULL,
			qty_diambil REAL NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE CASCADE,
			FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE RESTRICT,
			FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT
		)
	`)

	if err != nil {
		log.Fatal("❌ Failed to create table:", err)
	}

	fmt.Println("✅ Table transaksi_batch created successfully!")

	// Create indexes
	fmt.Println("Creating indexes...")

	database.Exec(`CREATE INDEX IF NOT EXISTS idx_transaksi_batch_transaksi ON transaksi_batch(transaksi_id)`)
	database.Exec(`CREATE INDEX IF NOT EXISTS idx_transaksi_batch_batch ON transaksi_batch(batch_id)`)
	database.Exec(`CREATE INDEX IF NOT EXISTS idx_transaksi_batch_produk ON transaksi_batch(produk_id)`)

	fmt.Println("✅ Indexes created successfully!")

	// Verify
	var tableName string
	err = database.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='transaksi_batch'").Scan(&tableName)
	if err != nil {
		log.Fatal("❌ Verification failed:", err)
	}

	fmt.Println("✅ Migration completed successfully!")
	fmt.Println("\n📝 Next steps:")
	fmt.Println("1. Restart the application (wails dev)")
	fmt.Println("2. Create a NEW transaction")
	fmt.Println("3. Return that transaction")
	fmt.Println("4. Verify batch qty_tersisa increases")
}
