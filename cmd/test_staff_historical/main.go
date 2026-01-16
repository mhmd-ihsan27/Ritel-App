package main

import (
	"fmt"
	"log"

	"ritel-app/internal/database"
	"ritel-app/internal/service"
)

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal(err)
	}

	// Create service
	staffReportService := service.NewStaffReportService()

	// Test with Administrator ID (adjust if needed)
	staffID := int64(-3260318837290447256)

	fmt.Println("=== TESTING STAFF HISTORICAL DATA ===\n")

	// Get historical data
	historicalData, err := staffReportService.GetStaffHistoricalData(staffID)
	if err != nil {
		log.Fatalf("Error getting historical data: %v", err)
	}

	// Display Daily data
	fmt.Println("LAPORAN HARIAN (Last 7 days):")
	fmt.Println("Date\t\t\tTransaksi\tPenjualan\tProfit\t\tItem Terjual")
	fmt.Println("------------------------------------------------------------------------------------")
	for _, daily := range historicalData.Daily {
		fmt.Printf("%s\t%d\t\tRp %d\t\tRp %d\t\t%d\n",
			daily.Tanggal.Format("2006-01-02"),
			daily.TotalTransaksi,
			daily.TotalPenjualan,
			daily.TotalProfit,
			daily.TotalItemTerjual,
		)
	}

	// Display Monthly data
	fmt.Println("\nRINGKASAN BULANAN (Last 6 months):")
	fmt.Println("Period\t\t\t\tTransaksi\tPenjualan\tProfit\t\tItem Terjual")
	fmt.Println("------------------------------------------------------------------------------------")
	for _, monthly := range historicalData.Monthly {
		periodStr := fmt.Sprintf("%s to %s",
			monthly.PeriodeMulai.Format("2006-01-02"),
			monthly.PeriodeSelesai.Format("2006-01-02"))
		fmt.Printf("%s\t%d\t\tRp %d\t\tRp %d\t\t%d\n",
			periodStr,
			monthly.TotalTransaksi,
			monthly.TotalPenjualan,
			monthly.TotalProfit,
			monthly.TotalItemTerjual,
		)
	}

	fmt.Println("\n=== VERIFICATION ===")
	fmt.Println("✓ Data above should already have return deductions applied")
	fmt.Println("✓ Total Transaksi should exclude return count")
	fmt.Println("✓ Total Penjualan should exclude sale price returned")
	fmt.Println("✓ Total Profit should exclude profit lost")
	fmt.Println("✓ Total Item Terjual should exclude quantity returned")
}
