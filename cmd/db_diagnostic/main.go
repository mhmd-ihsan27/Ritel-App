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

	fmt.Println("=== DATABASE DIAGNOSTIC ===")
	fmt.Printf("Database: %s\n\n", dbPath)

	// 1. Show users with full IDs
	fmt.Println("👥 USERS:")
	rows, _ := db.Query("SELECT id, nama_lengkap, username, role FROM users")
	for rows.Next() {
		var id int64
		var nama, username, role string
		rows.Scan(&id, &nama, &username, &role)
		fmt.Printf("  ID: %d | Name: %s | Role: %s\n", id, nama, role)
	}
	rows.Close()

	// 2. Show transaksi with staff_id
	fmt.Println("\n📦 TRANSAKSI (last 10):")
	rows, _ = db.Query(`
		SELECT id, nomor_transaksi, DATE(tanggal) as tgl, kasir, staff_id, staff_nama 
		FROM transaksi 
		ORDER BY tanggal DESC 
		LIMIT 10
	`)
	for rows.Next() {
		var id int64
		var nomor, tgl, kasir string
		var staffID sql.NullInt64
		var staffNama sql.NullString
		rows.Scan(&id, &nomor, &tgl, &kasir, &staffID, &staffNama)

		sidStr := "NULL"
		if staffID.Valid {
			sidStr = fmt.Sprintf("%d", staffID.Int64)
		}
		snStr := "NULL"
		if staffNama.Valid {
			snStr = staffNama.String
		}
		fmt.Printf("  ID: %d | Date: %s | Kasir: %s | staff_id: %s | staff_nama: %s\n",
			id, tgl, kasir, sidStr, snStr)
	}
	rows.Close()

	// 3. Count by date range
	fmt.Println("\n📊 TRANSAKSI BY DATE:")
	rows, _ = db.Query(`
		SELECT DATE(tanggal) as tgl, COUNT(*) as cnt 
		FROM transaksi 
		GROUP BY DATE(tanggal) 
		ORDER BY tgl DESC
		LIMIT 10
	`)
	for rows.Next() {
		var tgl string
		var cnt int
		rows.Scan(&tgl, &cnt)
		fmt.Printf("  %s: %d transaksi\n", tgl, cnt)
	}
	rows.Close()

	// 4. Check query match
	fmt.Println("\n🔍 QUERY TEST - Find transactions for staff ID 781014365031673229:")
	var count int
	db.QueryRow(`
		SELECT COUNT(*) FROM transaksi 
		WHERE staff_id = 781014365031673229 
		   OR (staff_id IS NULL AND LOWER(kasir) = LOWER('Administrator'))
	`).Scan(&count)
	fmt.Printf("  Found: %d transactions\n", count)

	// 5. Check today's transactions
	fmt.Println("\n📅 TODAY CHECK:")
	db.QueryRow(`SELECT COUNT(*) FROM transaksi WHERE DATE(tanggal) = DATE('now')`).Scan(&count)
	fmt.Printf("  Transactions today (UTC): %d\n", count)

	db.QueryRow(`SELECT COUNT(*) FROM transaksi WHERE DATE(tanggal) = DATE('now', 'localtime')`).Scan(&count)
	fmt.Printf("  Transactions today (local): %d\n", count)

	db.QueryRow(`SELECT COUNT(*) FROM transaksi WHERE DATE(tanggal) >= '2026-01-01'`).Scan(&count)
	fmt.Printf("  Transactions since Jan 1, 2026: %d\n", count)

	fmt.Println("\n=== END DIAGNOSTIC ===")
}
