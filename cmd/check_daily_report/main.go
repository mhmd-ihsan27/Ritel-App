package main

import (
	"fmt"
	"log"
	"ritel-app/internal/database"
	"time"
)

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to init database:", err)
	}

	fmt.Println("========================================")
	fmt.Println("  DAILY REPORT DATA DIAGNOSTIC")
	fmt.Println("========================================")

	// Get today's date
	today := time.Now()
	startOfToday := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	endOfToday := time.Date(today.Year(), today.Month(), today.Day(), 23, 59, 59, 999999999, today.Location())

	fmt.Printf("\n📅 Today: %s\n", today.Format("2006-01-02 15:04:05"))
	fmt.Printf("   Start: %s\n", startOfToday.Format("2006-01-02 15:04:05"))
	fmt.Printf("   End:   %s\n", endOfToday.Format("2006-01-02 15:04:05"))

	// Check transactions for today
	fmt.Println("\n📊 TRANSACTIONS FOR TODAY:")
	fmt.Println("------------------------------------------------------------")

	query := `
		SELECT COUNT(*), COALESCE(SUM(total), 0), DATE(tanggal) as tx_date
		FROM transaksi
		WHERE DATE(tanggal) >= DATE(?)
		  AND DATE(tanggal) <= DATE(?)
		GROUP BY DATE(tanggal)
		ORDER BY tx_date DESC
	`

	rows, err := database.Query(query, startOfToday, endOfToday)
	if err != nil {
		log.Printf("Error querying transactions: %v\n", err)
	} else {
		defer rows.Close()
		hasData := false
		for rows.Next() {
			var count int
			var total int
			var txDate string
			rows.Scan(&count, &total, &txDate)
			fmt.Printf("   Date: %s | Transactions: %d | Total: Rp %d\n", txDate, count, total)
			hasData = true
		}
		if !hasData {
			fmt.Println("   ❌ NO TRANSACTIONS FOUND FOR TODAY")
		}
	}

	// Check last 3 days of transactions
	fmt.Println("\n📊 LAST 3 DAYS TRANSACTIONS:")
	fmt.Println("------------------------------------------------------------")

	query2 := `
		SELECT DATE(tanggal) as tx_date, COUNT(*) as count, COALESCE(SUM(total), 0) as total
		FROM transaksi
		GROUP BY DATE(tanggal)
		ORDER BY tx_date DESC
		LIMIT 3
	`

	rows2, err := database.Query(query2)
	if err != nil {
		log.Printf("Error querying last 3 days: %v\n", err)
	} else {
		defer rows2.Close()
		for rows2.Next() {
			var txDate string
			var count int
			var total int
			rows2.Scan(&txDate, &count, &total)
			indicator := ""
			if txDate == today.Format("2006-01-02") {
				indicator = " ⭐ (TODAY)"
			}
			fmt.Printf("   %s | Transactions: %d | Total: Rp %d%s\n", txDate, count, total, indicator)
		}
	}

	// Check returns for today
	fmt.Println("\n🔄 RETURNS FOR TODAY:")
	fmt.Println("------------------------------------------------------------")

	queryReturns := `
		SELECT COUNT(*), COALESCE(SUM(refund_amount), 0), DATE(return_date) as ret_date
		FROM returns
		WHERE DATE(return_date) >= DATE(?)
		  AND DATE(return_date) <= DATE(?)
		GROUP BY DATE(return_date)
		ORDER BY ret_date DESC
	`

	rows3, err := database.Query(queryReturns, startOfToday, endOfToday)
	if err != nil {
		log.Printf("Error querying returns: %v\n", err)
	} else {
		defer rows3.Close()
		hasReturns := false
		for rows3.Next() {
			var count int
			var total int
			var retDate string
			rows3.Scan(&count, &total, &retDate)
			fmt.Printf("   Date: %s | Returns: %d | Total Refund: Rp %d\n", retDate, count, total)
			hasReturns = true
		}
		if !hasReturns {
			fmt.Println("   ✅ NO RETURNS FOR TODAY")
		}
	}

	// Check if there's any data accumulation issue
	fmt.Println("\n🔍 CHECKING FOR DATA ACCUMULATION:")
	fmt.Println("------------------------------------------------------------")

	// Get distinct dates from transactions
	queryDates := `
		SELECT DISTINCT DATE(tanggal) as tx_date, COUNT(*) as count
		FROM transaksi
		GROUP BY DATE(tanggal)
		HAVING COUNT(*) > 0
		ORDER BY tx_date DESC
		LIMIT 5
	`

	rows4, err := database.Query(queryDates)
	if err != nil {
		log.Printf("Error checking dates: %v\n", err)
	} else {
		defer rows4.Close()
		fmt.Println("   Last 5 days with transactions:")
		for rows4.Next() {
			var txDate string
			var count int
			rows4.Scan(&txDate, &count)
			fmt.Printf("   - %s: %d transactions\n", txDate, count)
		}
	}

	fmt.Println("\n========================================")
	fmt.Println("  DIAGNOSTIC COMPLETE")
	fmt.Println("========================================")
}
