package main

import (
	"fmt"
	"log"
	"os"
	"ritel-app/internal/database"
)

func main() {
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to init database:", err)
	}

	fmt.Println("========================================")
	fmt.Println("  CREATE TRANSAKSI_BATCH TABLE")
	fmt.Println("========================================")

	// Read migration file
	migrationSQL, err := os.ReadFile("database/migrations/001_add_transaksi_batch.sql")
	if err != nil {
		log.Fatalf("Failed to read migration file: %v", err)
	}

	fmt.Println("\n📄 Executing migration...")

	// Execute migration
	_, err = database.Exec(string(migrationSQL))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("✅ Table transaksi_batch created successfully!")

	// Verify table exists
	var tableName string
	err = database.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='transaksi_batch'").Scan(&tableName)
	if err != nil {
		log.Fatalf("Failed to verify table: %v", err)
	}

	fmt.Printf("\n✅ Verified: Table '%s' exists\n", tableName)

	// Check table structure
	fmt.Println("\n📋 Table Structure:")
	fmt.Println("------------------------------------")

	rows, err := database.Query("PRAGMA table_info(transaksi_batch)")
	if err != nil {
		log.Fatalf("Failed to get table info: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name, colType string
		var notNull, pk int
		var dfltValue interface{}
		rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk)
		fmt.Printf("   %s (%s)\n", name, colType)
	}

	fmt.Println("\n========================================")
	fmt.Println("  MIGRATION COMPLETE!")
	fmt.Println("========================================")
}
