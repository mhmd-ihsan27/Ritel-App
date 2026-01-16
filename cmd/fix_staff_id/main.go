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
	homeDir, _ := os.UserHomeDir()
	dbPath := filepath.Join(homeDir, "ritel-app", "ritel.db")

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fmt.Println("🔧 Fixing staff_id precision loss...")
	fmt.Printf("📁 Database: %s\n\n", dbPath)

	// Get unique staff_ids from transaksi that don't match any user
	fmt.Println("📊 Finding mismatched staff_ids...")

	rows, _ := db.Query(`
		SELECT DISTINCT t.staff_id, t.kasir 
		FROM transaksi t
		WHERE t.staff_id IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = t.staff_id)
	`)

	type Mismatch struct {
		StaffID int64
		Kasir   string
	}
	var mismatches []Mismatch

	for rows.Next() {
		var m Mismatch
		rows.Scan(&m.StaffID, &m.Kasir)
		mismatches = append(mismatches, m)
		fmt.Printf("  Mismatched: staff_id=%d, kasir=%s\n", m.StaffID, m.Kasir)
	}
	rows.Close()

	if len(mismatches) == 0 {
		fmt.Println("✅ No mismatched staff_ids found!")
		return
	}

	// For each mismatch, find the correct user ID and update
	fmt.Println("\n🔄 Fixing mismatches...")
	for _, m := range mismatches {
		var correctID int64
		err := db.QueryRow(`
			SELECT id FROM users 
			WHERE LOWER(nama_lengkap) = LOWER(?)
			AND role IN ('admin', 'staff')
			LIMIT 1
		`, m.Kasir).Scan(&correctID)

		if err != nil {
			fmt.Printf("  ⚠️ Could not find user for kasir '%s': %v\n", m.Kasir, err)
			continue
		}

		result, err := db.Exec(`
			UPDATE transaksi 
			SET staff_id = ? 
			WHERE staff_id = ? AND kasir = ?
		`, correctID, m.StaffID, m.Kasir)

		if err != nil {
			fmt.Printf("  ❌ Failed to update: %v\n", err)
			continue
		}

		rowsAffected, _ := result.RowsAffected()
		fmt.Printf("  ✅ Fixed %d transactions: staff_id %d → %d (kasir: %s)\n",
			rowsAffected, m.StaffID, correctID, m.Kasir)
	}

	// Verify fix
	fmt.Println("\n📊 Verifying fix...")
	var count int
	db.QueryRow(`
		SELECT COUNT(*) FROM transaksi t
		WHERE t.staff_id IS NOT NULL
		AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = t.staff_id)
	`).Scan(&count)

	if count == 0 {
		fmt.Println("✅ All staff_ids now match valid users!")
	} else {
		fmt.Printf("⚠️ Still %d transactions with invalid staff_id\n", count)
	}

	// Show updated transactions
	fmt.Println("\n📋 Updated transactions:")
	rows, _ = db.Query(`
		SELECT t.id, t.kasir, t.staff_id, u.nama_lengkap as user_name
		FROM transaksi t
		LEFT JOIN users u ON t.staff_id = u.id
		ORDER BY t.tanggal DESC
		LIMIT 5
	`)
	for rows.Next() {
		var id, staffID int64
		var kasir string
		var userName sql.NullString
		rows.Scan(&id, &kasir, &staffID, &userName)

		userStr := "NULL"
		if userName.Valid {
			userStr = userName.String
		}
		fmt.Printf("  ID: %d, Kasir: %s, staff_id: %d, Matched User: %s\n",
			id, kasir, staffID, userStr)
	}
	rows.Close()

	fmt.Println("\n🎉 Done! Now restart wails dev and test staff reports.")
}
