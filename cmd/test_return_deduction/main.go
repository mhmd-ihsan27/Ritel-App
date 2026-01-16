package main

import (
	"fmt"
	"log"
	"ritel-app/internal/repository"
	"ritel-app/internal/service"
	"time"
)

func main() {
	fmt.Println("=== TESTING RETURN DEDUCTION IN REPORTS ===\n")

	// Test date range: last 7 days to include the returns from 2026-01-08
	now := time.Now()
	weekAgo := now.AddDate(0, 0, -7)

	fmt.Printf("Testing date range: %s to %s\n\n", weekAgo.Format("2006-01-02"), now.Format("2006-01-02"))

	// Test 1: Check return repository functions
	fmt.Println("=== TEST 1: Return Repository ===")
	returnRepo := repository.NewReturnRepository()

	totalRefund, err := returnRepo.GetTotalRefundByDateRange(weekAgo, now)
	if err != nil {
		log.Printf("Error getting total refund: %v\n", err)
	} else {
		fmt.Printf("✓ GetTotalRefundByDateRange: Rp %d\n", totalRefund)
	}

	// Test 2: Check dashboard service
	fmt.Println("\n=== TEST 2: Dashboard Service ===")
	dashboardService := service.NewDashboardService()

	stats, err := dashboardService.GetStatistikBulanan()
	if err != nil {
		log.Printf("Error getting dashboard stats: %v\n", err)
	} else {
		fmt.Printf("✓ Total Pendapatan (current month): Rp %.0f\n", stats.TotalPendapatan)
		fmt.Printf("✓ Keuntungan Bersih (current month): Rp %.0f\n", stats.KeuntunganBersih)
		fmt.Printf("✓ Total Transaksi: %d\n", stats.TotalTransaksi)
	}

	performa, err := dashboardService.GetPerformaHariIni()
	if err != nil {
		log.Printf("Error getting today's performance: %v\n", err)
	} else {
		for _, p := range performa {
			if p.Title == "Omzet Hari Ini" {
				fmt.Printf("✓ Omzet Hari Ini: Rp %.0f\n", p.Value)
			}
		}
	}

	// Test 3: Check staff report (use staff ID from database)
	fmt.Println("\n=== TEST 3: Staff Report Service ===")
	staffReportService := service.NewStaffReportService()

	// Get staff ID 781014365031673229 (Administrator)
	staffID := int64(781014365031673229)

	report, err := staffReportService.GetStaffReport(staffID, weekAgo, now)
	if err != nil {
		log.Printf("Error getting staff report: %v\n", err)
	} else {
		fmt.Printf("✓ Staff: %s\n", report.NamaStaff)
		fmt.Printf("✓ Total Transaksi: %d\n", report.TotalTransaksi)
		fmt.Printf("✓ Total Penjualan (net): Rp %d\n", report.TotalPenjualan)
		fmt.Printf("✓ Total Profit (net): Rp %d\n", report.TotalProfit)
		fmt.Printf("✓ Total Refund: Rp %d\n", report.TotalRefund)
		fmt.Printf("✓ Jumlah Return: %d\n", report.TotalReturnCount)
	}

	fmt.Println("\n=== EXPECTED VALUES ===")
	fmt.Println("Based on database query:")
	fmt.Println("  Gross Revenue: Rp 136,800")
	fmt.Println("  Total Refunds: Rp 20,000")
	fmt.Println("  Net Revenue: Rp 116,800")
	fmt.Println("  Transaction Count: 12")
	fmt.Println("  Return Count: 3")
	fmt.Println("  Net Transaction Count: 9 (12 - 3)")
}
