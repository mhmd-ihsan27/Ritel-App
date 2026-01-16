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

	fmt.Println("=== QUERY TEST FOR STAFF REPORT ===")
	fmt.Printf("Database: %s\n\n", dbPath)

	// Test query exactly like repository does
	staffID := int64(781014365031673229)
	staffName := "Administrator"
	startDate := "2026-01-08"
	endDate := "2026-01-08"

	fmt.Printf("Testing with:\n")
	fmt.Printf("  staffID: %d\n", staffID)
	fmt.Printf("  staffName: '%s'\n", staffName)
	fmt.Printf("  startDate: %s\n", startDate)
	fmt.Printf("  endDate: %s\n\n", endDate)

	// Query 1: Exact staff_id match only
	var count1 int
	db.QueryRow(`
		SELECT COUNT(*) FROM transaksi 
		WHERE staff_id = ? 
		  AND DATE(tanggal) >= DATE(?) 
		  AND DATE(tanggal) <= DATE(?)
	`, staffID, startDate, endDate).Scan(&count1)
	fmt.Printf("Query 1 (staff_id only): %d transactions\n", count1)

	// Query 2: Kasir match only
	var count2 int
	db.QueryRow(`
		SELECT COUNT(*) FROM transaksi 
		WHERE LOWER(kasir) = LOWER(?)
		  AND DATE(tanggal) >= DATE(?) 
		  AND DATE(tanggal) <= DATE(?)
	`, staffName, startDate, endDate).Scan(&count2)
	fmt.Printf("Query 2 (kasir only): %d transactions\n", count2)

	// Query 3: Combined (new logic)
	var count3 int
	db.QueryRow(`
		SELECT COUNT(*) FROM transaksi 
		WHERE (staff_id = ? OR LOWER(kasir) = LOWER(?))
		  AND DATE(tanggal) >= DATE(?) 
		  AND DATE(tanggal) <= DATE(?)
	`, staffID, staffName, startDate, endDate).Scan(&count3)
	fmt.Printf("Query 3 (staff_id OR kasir): %d transactions\n", count3)

	// Show sample results from Query 3
	fmt.Println("\n📋 Sample transactions matching Query 3:")
	rows, _ := db.Query(`
		SELECT id, DATE(tanggal), kasir, staff_id, total
		FROM transaksi 
		WHERE (staff_id = ? OR LOWER(kasir) = LOWER(?))
		  AND DATE(tanggal) >= DATE(?) 
		  AND DATE(tanggal) <= DATE(?)
		LIMIT 5
	`, staffID, staffName, startDate, endDate)

	for rows.Next() {
		var id, staffIDVal int64
		var tgl, kasir string
		var total int
		rows.Scan(&id, &tgl, &kasir, &staffIDVal, &total)
		fmt.Printf("  ID: %d | Date: %s | Kasir: %s | staff_id: %d | Total: %d\n",
			id, tgl, kasir, staffIDVal, total)
	}
	rows.Close()

	fmt.Println("\n=== END TEST ===")
}
