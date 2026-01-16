package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Get user home directory (same as main app)
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("Failed to get home directory:", err)
	}

	// Database path - same as in internal/database/database.go
	appDir := filepath.Join(homeDir, "ritel-app")
	dbPath := filepath.Join(appDir, "ritel.db")

	fmt.Println("🔧 Starting Staff ID Migration...")
	fmt.Println("===================================== ")
	fmt.Printf("📁 Database path: %s\n\n", dbPath)

	// Open database
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	// Test connection
	err = db.Ping()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	fmt.Println("✅ Connected to database successfully\n")

	// Step 1: Count NULL staff_id before migration
	var nullCountBefore int
	err = db.QueryRow("SELECT COUNT(*) FROM transaksi WHERE staff_id IS NULL").Scan(&nullCountBefore)
	if err != nil {
		log.Fatal("Failed to count NULL staff_id:", err)
	}
	fmt.Printf("📊 Transaksi with NULL staff_id: %d\n", nullCountBefore)

	// Step 2: Show sample of NULL transactions
	fmt.Println("\n📋 Sample of NULL staff_id transactions:")
	rows, err := db.Query("SELECT id, nomor_transaksi, tanggal, kasir FROM transaksi WHERE staff_id IS NULL LIMIT 5")
	if err != nil {
		log.Fatal("Failed to query sample:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var nomor, tanggal, kasir sql.NullString
		rows.Scan(&id, &nomor, &tanggal, &kasir)
		fmt.Printf("  ID: %d, Nomor: %s, Tanggal: %s, Kasir: %s\n",
			id, nomor.String, tanggal.String, kasir.String)
	}

	// Step 3: Show available users
	fmt.Println("\n👥 Available users (admin/staff):")
	rows, err = db.Query("SELECT id, nama_lengkap, username, role FROM users WHERE role IN ('admin', 'staff')")
	if err != nil {
		log.Fatal("Failed to query users:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var nama, username, role string
		rows.Scan(&id, &nama, &username, &role)
		fmt.Printf("  ID: %d, Name: %s, Username: %s, Role: %s\n", id, nama, username, role)
	}

	// Step 4: Run the migration
	fmt.Println("\n🔄 Running migration...")
	updateSQL := `
		UPDATE transaksi 
		SET 
			staff_id = (
				SELECT id 
				FROM users 
				WHERE LOWER(nama_lengkap) = LOWER(transaksi.kasir)
				  AND role IN ('admin', 'staff')
				LIMIT 1
			),
			staff_nama = (
				SELECT nama_lengkap 
				FROM users 
				WHERE LOWER(nama_lengkap) = LOWER(transaksi.kasir)
				  AND role IN ('admin', 'staff')
				LIMIT 1
			)
		WHERE staff_id IS NULL 
		  AND kasir IS NOT NULL 
		  AND kasir != ''
		  AND EXISTS (
			  SELECT 1 FROM users 
			  WHERE LOWER(nama_lengkap) = LOWER(transaksi.kasir)
				AND role IN ('admin', 'staff')
		  )
	`

	result, err := db.Exec(updateSQL)
	if err != nil {
		log.Fatal("Failed to run migration:", err)
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("✅ Updated %d transactions\n", rowsAffected)

	// Step 5: Count NULL staff_id after migration
	var nullCountAfter int
	err = db.QueryRow("SELECT COUNT(*) FROM transaksi WHERE staff_id IS NULL").Scan(&nullCountAfter)
	if err != nil {
		log.Fatal("Failed to count NULL staff_id after:", err)
	}

	var hasStaffID int
	err = db.QueryRow("SELECT COUNT(*) FROM transaksi WHERE staff_id IS NOT NULL").Scan(&hasStaffID)
	if err != nil {
		log.Fatal("Failed to count staff_id:", err)
	}

	fmt.Println("\n📊 Migration Results:")
	fmt.Println("=====================================")
	fmt.Printf("Before: %d transactions with NULL staff_id\n", nullCountBefore)
	fmt.Printf("After:  %d transactions with NULL staff_id\n", nullCountAfter)
	fmt.Printf("Fixed:  %d transactions\n", nullCountBefore-nullCountAfter)
	fmt.Printf("Total with staff_id: %d\n", hasStaffID)

	// Step 6: Show sample of updated transactions
	fmt.Println("\n✅ Sample of updated transactions:")
	rows, err = db.Query(`
		SELECT id, nomor_transaksi, tanggal, kasir, staff_id, staff_nama 
		FROM transaksi 
		WHERE staff_id IS NOT NULL 
		ORDER BY id DESC 
		LIMIT 5
	`)
	if err != nil {
		log.Fatal("Failed to query updated sample:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var nomor, tanggal, kasir string
		var staffID sql.NullInt64
		var staffNama sql.NullString
		rows.Scan(&id, &nomor, &tanggal, &kasir, &staffID, &staffNama)

		staffIDStr := "NULL"
		if staffID.Valid {
			staffIDStr = fmt.Sprintf("%d", staffID.Int64)
		}

		staffNamaStr := "NULL"
		if staffNama.Valid {
			staffNamaStr = staffNama.String
		}

		fmt.Printf("  ID: %d, Kasir: %s, StaffID: %s, StaffNama: %s\n",
			id, kasir, staffIDStr, staffNamaStr)
	}

	fmt.Println("\n🎉 Migration completed successfully!")
	fmt.Println("You can now restart wails dev and check staff reports.")
}
