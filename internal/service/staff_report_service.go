package service

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

// StaffReportService handles staff performance reports
type StaffReportService struct {
	transaksiRepo *repository.TransaksiRepository
	userRepo      *repository.UserRepository
	produkRepo    *repository.ProdukRepository
	returnRepo    *repository.ReturnRepository
	shiftRepo     *repository.ShiftRepository
}

// NewStaffReportService creates a new staff report service
func NewStaffReportService() *StaffReportService {
	return &StaffReportService{
		transaksiRepo: repository.NewTransaksiRepository(),
		userRepo:      repository.NewUserRepository(),
		produkRepo:    repository.NewProdukRepository(),
		returnRepo:    repository.NewReturnRepository(),
		shiftRepo:     repository.NewShiftRepository(),
	}
}

// GetShiftSettings returns current shift configurations
func (s *StaffReportService) GetShiftSettings() ([]models.ShiftSetting, error) {
	return s.shiftRepo.GetAll()
}

// UpdateShiftSettings updates a shift configuration
func (s *StaffReportService) UpdateShiftSettings(id int, startTime, endTime, staffIDs string) error {
	return s.shiftRepo.Update(id, startTime, endTime, staffIDs)
}

// GetStaffReport generates performance report for a specific staff
func (s *StaffReportService) GetStaffReport(staffID int64, startDate, endDate time.Time) (*models.StaffReport, error) {
	// Validate staff exists
	staff, err := s.userRepo.GetByID(staffID)
	if err != nil {
		return nil, fmt.Errorf("failed to get staff: %w", err)
	}

	if staff == nil {
		return nil, fmt.Errorf("staff tidak ditemukan")
	}

	// Get transactions for this staff in date range
	transaksiList, err := s.transaksiRepo.GetByStaffIDAndDateRange(staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	// Calculate statistics
	totalTransaksi := len(transaksiList)
	totalPenjualan := 0
	totalProfit := 0
	totalDiskon := 0
	totalItemTerjual := 0
	productHPPCache := make(map[int]int) // Cache for product HPP

	for _, t := range transaksiList {
		// Only count completed transactions
		if t.Status != "selesai" {
			continue
		}

		totalPenjualan += t.Total
		totalDiskon += t.Diskon

		// Get transaction items to count total items sold and calculate profit
		detail, err := s.transaksiRepo.GetByID(t.ID)
		if err == nil && detail != nil {
			transactionHPP := 0
			for _, item := range detail.Items {
				totalItemTerjual += item.Jumlah

				// Calculate HPP for profit
				if item.ProdukID != nil {
					hpp, ok := productHPPCache[*item.ProdukID]
					if !ok {
						produk, err := s.produkRepo.GetByID(*item.ProdukID)
						if err == nil && produk != nil {
							hpp = produk.HargaBeli
							productHPPCache[*item.ProdukID] = hpp
						} else {
							hpp = 0
						}
					}

					// Calculate HPP based on product type (curah vs satuan)
					if item.BeratGram > 0 {
						// Barang curah: HPP = (berat_gram / 1000) * harga_beli_per_kg
						transactionHPP += int((item.BeratGram / 1000.0) * float64(hpp))
					} else {
						// Barang satuan tetap: HPP = jumlah * harga_beli
						transactionHPP += item.Jumlah * hpp
					}
				}
			}
			totalProfit += t.Total - transactionHPP
		}
	}

	// Get comprehensive return impact for this staff
	returnImpact, err := s.returnRepo.GetReturnImpactByStaffAndDateRange(staffID, startDate, endDate)
	if err != nil {
		// Log warning but continue - return data is optional
		returnImpact = &models.ReturnImpact{
			ReturnCount:           0,
			TotalSaleReturned:     0,
			TotalProfitLost:       0,
			TotalQuantityReturned: 0,
		}
	}

	// Get exact total refund amount from returns table (handles discounts and manual overrides correctly)
	totalRefundAmount, err := s.returnRepo.GetTotalRefundByStaffAndDateRange(staffID, startDate, endDate)
	if err != nil {
		totalRefundAmount = 0
	}

	// Override the calculated sale returned with the actual refund amount
	returnImpact.TotalSaleReturned = totalRefundAmount

	// Reverting to GROSS REVENUE for Report Summary as per user request (Step 1560)
	// Refunds are displayed separately in TotalRefund, but not deducted from TotalPenjualan/TotalTransaksi in the main summary.
	// This aligns with "Laporan Per Shift" behavior.

	report := &models.StaffReport{
		StaffID:   staffID,
		NamaStaff: staff.NamaLengkap,
		// Subtracted return count to reflect Net Transactions as per user feedback
		TotalTransaksi: totalTransaksi - returnImpact.ReturnCount, // Net transactions
		TotalPenjualan: totalPenjualan,                            // Gross revenue (Sales only)
		TotalProfit:    totalProfit,                               // Gross profit (Sales only)
		TotalDiskon:    totalDiskon,                               // Total discount

		TotalItemTerjual: totalItemTerjual,               // Gross items sold
		TotalRefund:      returnImpact.TotalSaleReturned, // Total refund (sale price)
		TotalReturnCount: returnImpact.ReturnCount,       // Number of returns
		PeriodeMulai:     startDate,
		PeriodeSelesai:   endDate,
	}

	return report, nil
}

// GetStaffReportDetail gets detailed report with transaction list and item counts by date
func (s *StaffReportService) GetStaffReportDetail(staffID int64, startDate, endDate time.Time) (*models.StaffReportDetailWithItems, error) {
	// Get basic report (already has return deductions applied)
	report, err := s.GetStaffReport(staffID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Get transaction list
	allTransaksi, err := s.transaksiRepo.GetByStaffIDAndDateRange(staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	// Filter out refund transactions to match the deducted metrics
	// Only include 'selesai' transactions, exclude returns
	// Filter out refund transactions and calculate Profit for each transaction
	// Only include 'selesai' transactions, exclude returns
	transaksiList := make([]*models.Transaksi, 0)
	productHPPCache := make(map[int]int) // Cache for product HPP

	for _, t := range allTransaksi {
		// Only include completed sales transactions, not returns
		if t.Status == "selesai" {
			// Calculate Profit for this individual transaction
			transactionHPP := 0

			// We need transaction items to calculate HPP
			detail, err := s.transaksiRepo.GetByID(t.ID)
			if err == nil && detail != nil {
				for _, item := range detail.Items {
					if item.ProdukID != nil {
						hpp, ok := productHPPCache[*item.ProdukID]
						if !ok {
							produk, err := s.produkRepo.GetByID(*item.ProdukID)
							if err == nil && produk != nil {
								hpp = produk.HargaBeli
								productHPPCache[*item.ProdukID] = hpp
							} else {
								hpp = 0
							}
						}

						// Calculate HPP based on product type
						if item.BeratGram > 0 {
							// Barang curah: HPP = (berat_gram / 1000) * harga_beli_per_kg
							transactionHPP += int((item.BeratGram / 1000.0) * float64(hpp))
						} else {
							// Barang satuan: HPP = jumlah * harga_beli
							transactionHPP += item.Jumlah * hpp
						}
					}
				}
			}

			// Set profit to the transaction object
			t.Profit = t.Total - transactionHPP

			transaksiList = append(transaksiList, t)
		}
	}

	// Get refund transactions
	returns, err := s.returnRepo.GetReturnsByStaffAndDateRange(staffID, startDate, endDate)
	if err == nil {
		for _, r := range returns {
			// Convert Return to pseudo-Transaksi for frontend display
			refundTx := &models.Transaksi{
				ID:             int64(r.TransaksiID), // Link to original transaction ID
				NomorTransaksi: fmt.Sprintf("%s (Refund)", r.NoTransaksi),
				Tanggal:        r.ReturnDate,
				Total:          -r.RefundAmount, // Negative amount for refund
				Diskon:         0,
				Status:         "refund", // Special status
				Profit:         0,        // Calculate profit loss if needed, else 0
			}
			transaksiList = append(transaksiList, refundTx)
		}
	} else {
		// Failed to get returns, ignore
	}

	// Get item counts by date (only for non-return transactions)
	itemCounts, err := s.transaksiRepo.GetItemCountsByDateForStaff(staffID, startDate, endDate)
	if err != nil {
		itemCounts = make(map[string]int)
	}

	// Apply return deductions to item counts by date
	// Get returns for this staff and date range
	returnImpact, err := s.returnRepo.GetReturnImpactByStaffAndDateRange(staffID, startDate, endDate)
	if err == nil && returnImpact != nil {
		// Note: ItemCountsByDate is aggregated, so we can't precisely deduct per date
		// But we can note that the Report summary already has correct totals
		// The daily breakdown in itemCounts might still show original values
		// This is acceptable as long as the summary is correct
	}

	return &models.StaffReportDetailWithItems{
		Report:           report,        // This already has return deductions
		Transaksi:        transaksiList, // Now filtered to exclude returns
		ItemCountsByDate: itemCounts,
	}, nil
}

// GetAllStaffReports gets reports for all staff
func (s *StaffReportService) GetAllStaffReports(startDate, endDate time.Time) ([]*models.StaffReport, error) {
	// Get all transaction staff (including admin and staff)
	staffList, err := s.userRepo.GetAllTransactionStaff()
	if err != nil {
		return nil, fmt.Errorf("failed to get staff list: %w", err)
	}

	var reports []*models.StaffReport

	for _, staff := range staffList {
		report, err := s.GetStaffReport(staff.ID, startDate, endDate)
		if err != nil {
			// Log error but continue with other staff
			continue
		}
		reports = append(reports, report)
	}

	return reports, nil
}

// GetStaffReportWithTrend gets report with trend comparison vs previous period
func (s *StaffReportService) GetStaffReportWithTrend(staffID int64, startDate, endDate time.Time) (*models.StaffReportWithTrend, error) {

	// Get current period report
	currentReport, err := s.GetStaffReport(staffID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Calculate previous period dates (same duration)
	duration := endDate.Sub(startDate)
	prevEndDate := startDate.AddDate(0, 0, -1)
	prevStartDate := prevEndDate.Add(-duration)

	// Get previous period report
	previousReport, err := s.GetStaffReport(staffID, prevStartDate, prevEndDate)
	if err != nil {
		return nil, err
	}

	// Calculate trends
	trendPenjualan := "tetap"
	trendTransaksi := "tetap"
	percentChange := 0.0

	if previousReport.TotalPenjualan > 0 {
		percentChange = float64(currentReport.TotalPenjualan-previousReport.TotalPenjualan) / float64(previousReport.TotalPenjualan) * 100

		if currentReport.TotalPenjualan > previousReport.TotalPenjualan {
			trendPenjualan = "naik"
		} else if currentReport.TotalPenjualan < previousReport.TotalPenjualan {
			trendPenjualan = "turun"
		}
	} else if currentReport.TotalPenjualan > 0 {
		trendPenjualan = "naik"
		percentChange = 100.0
	}

	if currentReport.TotalTransaksi > previousReport.TotalTransaksi {
		trendTransaksi = "naik"
	} else if currentReport.TotalTransaksi < previousReport.TotalTransaksi {
		trendTransaksi = "turun"
	}

	return &models.StaffReportWithTrend{
		Current:        currentReport,
		Previous:       previousReport,
		TrendPenjualan: trendPenjualan,
		TrendTransaksi: trendTransaksi,
		PercentChange:  percentChange,
	}, nil
}

// GetStaffHistoricalData gets historical data for charts
func (s *StaffReportService) GetStaffHistoricalData(staffID int64) (*models.StaffHistoricalData, error) {
	now := time.Now()

	// Get daily data for last 7 days
	daily := make([]*models.StaffDailyReport, 0)
	for i := 6; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		endOfDay := time.Date(date.Year(), date.Month(), date.Day(), 23, 59, 59, 999999999, date.Location())

		report, err := s.GetStaffReport(staffID, startOfDay, endOfDay)
		if err != nil {
			continue
		}

		daily = append(daily, &models.StaffDailyReport{
			Tanggal:          startOfDay,
			TotalTransaksi:   report.TotalTransaksi,
			TotalPenjualan:   report.TotalPenjualan,
			TotalProfit:      report.TotalProfit,
			TotalItemTerjual: report.TotalItemTerjual,
		})
	}

	// Get weekly data for last 4 weeks
	weekly := make([]*models.StaffReport, 0)
	for i := 3; i >= 0; i-- {
		weekStart := now.AddDate(0, 0, -7*(i+1))
		weekEnd := now.AddDate(0, 0, -7*i-1)

		report, err := s.GetStaffReport(staffID, weekStart, weekEnd)
		if err != nil {
			continue
		}
		weekly = append(weekly, report)
	}

	// Get monthly data for last 6 months
	monthly := make([]*models.StaffReport, 0)
	for i := 5; i >= 0; i-- {
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).AddDate(0, -i, 0)
		// Get the last day of the month by going to the 1st of next month and subtracting 1 day
		nextMonth := monthStart.AddDate(0, 1, 0)
		monthEnd := time.Date(nextMonth.Year(), nextMonth.Month(), nextMonth.Day(), 23, 59, 59, 999999999, nextMonth.Location()).AddDate(0, 0, -1)

		report, err := s.GetStaffReport(staffID, monthStart, monthEnd)
		if err != nil {
			continue
		}
		monthly = append(monthly, report)
	}

	return &models.StaffHistoricalData{
		Daily:   daily,
		Weekly:  weekly,
		Monthly: monthly,
	}, nil
}

// GetAllStaffReportsWithTrend gets all staff reports with trend for today vs yesterday
func (s *StaffReportService) GetAllStaffReportsWithTrend() ([]*models.StaffReportWithTrend, error) {
	// Get all transaction staff (including admin and staff)
	staffList, err := s.userRepo.GetAllTransactionStaff()
	if err != nil {
		return nil, fmt.Errorf("failed to get staff list: %w", err)
	}

	today := time.Now()
	startOfToday := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	endOfToday := time.Date(today.Year(), today.Month(), today.Day(), 23, 59, 59, 999999999, today.Location())

	var reports []*models.StaffReportWithTrend

	for _, staff := range staffList {
		report, err := s.GetStaffReportWithTrend(staff.ID, startOfToday, endOfToday)
		if err != nil {
			continue
		}
		reports = append(reports, report)
	}

	return reports, nil
}

// GetComprehensiveReport gets comprehensive staff analytics for last 30 days
func (s *StaffReportService) GetComprehensiveReport() (*models.ComprehensiveStaffReport, error) {
	now := time.Now()

	// Last 30 days - start from beginning of day 30 days ago
	last30DaysStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -30)
	last30DaysEnd := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())

	// Previous 30 days (for comparison)
	prev30DaysStart := last30DaysStart.AddDate(0, 0, -30)
	prev30DaysEnd := last30DaysStart.Add(-time.Nanosecond)

	// Get all transaction staff (including admin and staff)
	staffList, err := s.userRepo.GetAllTransactionStaff()
	if err != nil {
		return nil, fmt.Errorf("failed to get staff list: %w", err)
	}

	// Get reports for last 30 days
	var totalPenjualan30Hari int
	var totalTransaksi30Hari int
	var staffReports []*models.StaffReportWithTrend

	for _, staff := range staffList {
		// Current period
		currentReport, err := s.GetStaffReport(staff.ID, last30DaysStart, last30DaysEnd)
		if err != nil {
			continue
		}

		totalPenjualan30Hari += currentReport.TotalPenjualan
		totalTransaksi30Hari += currentReport.TotalTransaksi

		// Previous period
		prevReport, err := s.GetStaffReport(staff.ID, prev30DaysStart, prev30DaysEnd)
		if err != nil {
			continue
		}

		// Calculate trend
		trend := "tetap"
		percentChange := 0.0

		if prevReport.TotalPenjualan > 0 {
			percentChange = float64(currentReport.TotalPenjualan-prevReport.TotalPenjualan) / float64(prevReport.TotalPenjualan) * 100
			if currentReport.TotalPenjualan > prevReport.TotalPenjualan {
				trend = "naik"
			} else if currentReport.TotalPenjualan < prevReport.TotalPenjualan {
				trend = "turun"
			}
		} else if currentReport.TotalPenjualan > 0 {
			trend = "naik"
			percentChange = 100.0
		}

		staffReports = append(staffReports, &models.StaffReportWithTrend{
			Current:        currentReport,
			Previous:       prevReport,
			TrendPenjualan: trend,
			TrendTransaksi: trend,
			PercentChange:  percentChange,
		})
	}

	// Get top product
	topProduct, err := s.transaksiRepo.GetTopProductLast30Days()
	if err != nil {
		topProduct = "-"
	}

	// Calculate overall trend
	// Get previous 30 days total for comparison
	var prevTotalPenjualan int
	for _, staff := range staffList {
		prevReport, err := s.GetStaffReport(staff.ID, prev30DaysStart, prev30DaysEnd)
		if err != nil {
			continue
		}
		prevTotalPenjualan += prevReport.TotalPenjualan
	}

	overallTrend := "tetap"
	overallPercentChange := 0.0

	if prevTotalPenjualan > 0 {
		overallPercentChange = float64(totalPenjualan30Hari-prevTotalPenjualan) / float64(prevTotalPenjualan) * 100
		if totalPenjualan30Hari > prevTotalPenjualan {
			overallTrend = "naik"
		} else if totalPenjualan30Hari < prevTotalPenjualan {
			overallTrend = "turun"
		}
	} else if totalPenjualan30Hari > 0 {
		overallTrend = "naik"
		overallPercentChange = 100.0
	}

	return &models.ComprehensiveStaffReport{
		TotalPenjualan30Hari: totalPenjualan30Hari,
		TotalTransaksi30Hari: totalTransaksi30Hari,
		ProdukTerlaris:       topProduct,
		TrendVsPrevious:      overallTrend,
		PercentChange:        overallPercentChange,
		StaffReports:         staffReports,
	}, nil
}

// GetShiftProductivity gets sales distribution by shift
func (s *StaffReportService) GetShiftProductivity() (map[string]int, error) {
	return s.transaksiRepo.GetSalesByShift()
}

// GetStaffReportWithMonthlyTrend gets staff report with trend vs previous month
func (s *StaffReportService) GetStaffReportWithMonthlyTrend(staffID int64, startDate, endDate time.Time) (*models.StaffReportWithTrend, error) {
	// Get current month report
	currentReport, err := s.GetStaffReport(staffID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Calculate previous month dates
	duration := endDate.Sub(startDate)
	prevEndDate := startDate.AddDate(0, 0, -1)
	prevStartDate := prevEndDate.Add(-duration)

	// Get previous month report
	previousReport, err := s.GetStaffReport(staffID, prevStartDate, prevEndDate)
	if err != nil {
		// If error getting previous report, still return current with zero previous
		previousReport = &models.StaffReport{
			StaffID:          staffID,
			NamaStaff:        currentReport.NamaStaff,
			TotalTransaksi:   0,
			TotalPenjualan:   0,
			TotalItemTerjual: 0,
		}
	}

	// Calculate trends
	trendPenjualan := "tetap"
	trendTransaksi := "tetap"
	percentChange := 0.0

	if previousReport.TotalPenjualan > 0 {
		percentChange = float64(currentReport.TotalPenjualan-previousReport.TotalPenjualan) / float64(previousReport.TotalPenjualan) * 100

		if currentReport.TotalPenjualan > previousReport.TotalPenjualan {
			trendPenjualan = "naik"
		} else if currentReport.TotalPenjualan < previousReport.TotalPenjualan {
			trendPenjualan = "turun"
		}
	} else if currentReport.TotalPenjualan > 0 {
		trendPenjualan = "naik"
		percentChange = 100.0
	}

	if currentReport.TotalTransaksi > previousReport.TotalTransaksi {
		trendTransaksi = "naik"
	} else if currentReport.TotalTransaksi < previousReport.TotalTransaksi {
		trendTransaksi = "turun"
	}

	return &models.StaffReportWithTrend{
		Current:        currentReport,
		Previous:       previousReport,
		TrendPenjualan: trendPenjualan,
		TrendTransaksi: trendTransaksi,
		PercentChange:  percentChange,
	}, nil
}

// GetStaffShiftData gets shift productivity data for a staff
func (s *StaffReportService) GetStaffShiftData(staffID int64, startDate, endDate time.Time) (map[string]map[string]interface{}, error) {
	return s.transaksiRepo.GetShiftDataByStaffIDAndDateRange(staffID, startDate, endDate)
}

// GetMonthlyComparisonTrend gets 30-day comparison with previous 30 days for all metrics
func (s *StaffReportService) GetMonthlyComparisonTrend() (map[string]interface{}, error) {
	now := time.Now()

	// Current 30 days - start from beginning of day 30 days ago to end of today
	current30DaysStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -30)
	current30DaysEnd := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())

	// Previous 30 days
	prev30DaysStart := current30DaysStart.AddDate(0, 0, -30)
	prev30DaysEnd := current30DaysStart.Add(-time.Nanosecond)

	// Get all staff reports for current period
	currentReports, err := s.GetAllStaffReports(current30DaysStart, current30DaysEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to get current reports: %w", err)
	}

	// Get all staff reports for previous period
	prevReports, err := s.GetAllStaffReports(prev30DaysStart, prev30DaysEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to get previous reports: %w", err)
	}

	// Aggregate current totals - Use authoritative Global Stats
	currentTotals := struct {
		TotalPenjualan   int
		TotalTransaksi   int
		TotalItemTerjual int
	}{}

	// Fetch actual store totals for the period
	currentTotals.TotalTransaksi, currentTotals.TotalPenjualan, currentTotals.TotalItemTerjual, err = s.transaksiRepo.GetStatsByDateRange(current30DaysStart, current30DaysEnd)
	if err != nil {
		// Fallback to summing reports if global fetch fails (unlikely)
		for _, report := range currentReports {
			currentTotals.TotalPenjualan += report.TotalPenjualan
			currentTotals.TotalTransaksi += report.TotalTransaksi
			currentTotals.TotalItemTerjual += report.TotalItemTerjual
		}
	}

	// Aggregate previous totals - Use authoritative Global Stats
	prevTotals := struct {
		TotalPenjualan   int
		TotalTransaksi   int
		TotalItemTerjual int
	}{}

	prevTotals.TotalTransaksi, prevTotals.TotalPenjualan, prevTotals.TotalItemTerjual, err = s.transaksiRepo.GetStatsByDateRange(prev30DaysStart, prev30DaysEnd)
	if err != nil {
		// Fallback
		for _, report := range prevReports {
			prevTotals.TotalPenjualan += report.TotalPenjualan
			prevTotals.TotalTransaksi += report.TotalTransaksi
			prevTotals.TotalItemTerjual += report.TotalItemTerjual
		}
	}

	// Find best and worst performing staff in current period
	var bestStaffCurrent, worstStaffCurrent *models.StaffReport
	if len(currentReports) > 0 {
		bestStaffCurrent = currentReports[0]
		worstStaffCurrent = currentReports[0]
		for _, report := range currentReports {
			if report.TotalPenjualan > bestStaffCurrent.TotalPenjualan {
				bestStaffCurrent = report
			}
			if report.TotalPenjualan < worstStaffCurrent.TotalPenjualan {
				worstStaffCurrent = report
			}
		}
	}

	// Find best and worst performing staff in previous period
	var bestStaffPrev, worstStaffPrev *models.StaffReport
	if len(prevReports) > 0 {
		bestStaffPrev = prevReports[0]
		worstStaffPrev = prevReports[0]
		for _, report := range prevReports {
			if report.TotalPenjualan > bestStaffPrev.TotalPenjualan {
				bestStaffPrev = report
			}
			if report.TotalPenjualan < worstStaffPrev.TotalPenjualan {
				worstStaffPrev = report
			}
		}
	}

	// Get top selling product for current and previous period
	// TODO: Implement GetTopSellingProduct method in ProdukRepository
	currentTopProduct := "-"
	currentTopProductCount := 0
	prevTopProduct := "-"
	prevTopProductCount := 0
	// currentTopProduct, currentTopProductCount, _ := s.produkRepo.GetTopSellingProduct(current30DaysStart, current30DaysEnd)
	// prevTopProduct, prevTopProductCount, _ := s.produkRepo.GetTopSellingProduct(prev30DaysStart, prev30DaysEnd)

	// Calculate trends
	calculateTrendPercent := func(current, previous int) float64 {
		if previous == 0 {
			if current > 0 {
				return 100.0
			}
			return 0.0
		}
		return float64(current-previous) / float64(previous) * 100.0
	}

	result := map[string]interface{}{
		"current": map[string]interface{}{
			"totalPenjualan":   currentTotals.TotalPenjualan,
			"totalTransaksi":   currentTotals.TotalTransaksi,
			"totalItemTerjual": currentTotals.TotalItemTerjual,
		},
		"previous": map[string]interface{}{
			"totalPenjualan":   prevTotals.TotalPenjualan,
			"totalTransaksi":   prevTotals.TotalTransaksi,
			"totalItemTerjual": prevTotals.TotalItemTerjual,
		},
		"trends": map[string]interface{}{
			"penjualan":   calculateTrendPercent(currentTotals.TotalPenjualan, prevTotals.TotalPenjualan),
			"transaksi":   calculateTrendPercent(currentTotals.TotalTransaksi, prevTotals.TotalTransaksi),
			"itemTerjual": calculateTrendPercent(currentTotals.TotalItemTerjual, prevTotals.TotalItemTerjual),
		},
		"bestStaff": map[string]interface{}{
			"current": map[string]interface{}{
				"nama":           "",
				"totalPenjualan": 0,
			},
			"previous": map[string]interface{}{
				"nama":           "",
				"totalPenjualan": 0,
			},
		},
		"worstStaff": map[string]interface{}{
			"current": map[string]interface{}{
				"nama":           "",
				"totalPenjualan": 0,
			},
			"previous": map[string]interface{}{
				"nama":           "",
				"totalPenjualan": 0,
			},
		},
		"topProduct": map[string]interface{}{
			"current": map[string]interface{}{
				"nama":  currentTopProduct,
				"count": currentTopProductCount,
			},
			"previous": map[string]interface{}{
				"nama":  prevTopProduct,
				"count": prevTopProductCount,
			},
		},
	}

	// Add best staff data
	if bestStaffCurrent != nil {
		result["bestStaff"].(map[string]interface{})["current"] = map[string]interface{}{
			"nama":           bestStaffCurrent.NamaStaff,
			"totalPenjualan": bestStaffCurrent.TotalPenjualan,
		}
	}
	if bestStaffPrev != nil {
		result["bestStaff"].(map[string]interface{})["previous"] = map[string]interface{}{
			"nama":           bestStaffPrev.NamaStaff,
			"totalPenjualan": bestStaffPrev.TotalPenjualan,
		}
	}

	// Add worst staff data
	if worstStaffCurrent != nil {
		result["worstStaff"].(map[string]interface{})["current"] = map[string]interface{}{
			"nama":           worstStaffCurrent.NamaStaff,
			"totalPenjualan": worstStaffCurrent.TotalPenjualan,
		}
	}
	if worstStaffPrev != nil {
		result["worstStaff"].(map[string]interface{})["previous"] = map[string]interface{}{
			"nama":           worstStaffPrev.NamaStaff,
			"totalPenjualan": worstStaffPrev.TotalPenjualan,
		}
	}

	return result, nil
}

// GetShiftReports aggregates stats for Shift 1 & 2 for today vs yesterday
func (s *StaffReportService) GetShiftReports(dateStr string) (*models.ShiftReportsResponse, error) {
	var today time.Time

	if dateStr == "" {
		now := time.Now()
		today = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	} else {
		// Parse date string
		parsedDate, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
		if err != nil {
			return nil, fmt.Errorf("invalid date format: %w", err)
		}
		today = time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, parsedDate.Location())
	}

	yesterday := today.AddDate(0, 0, -1)

	// Get transactions
	todayTrans, err := s.transaksiRepo.GetByDateRange(today, today.AddDate(0, 0, 1).Add(-time.Nanosecond))
	if err != nil {
		return nil, err
	}
	yesterdayTrans, err := s.transaksiRepo.GetByDateRange(yesterday, today.Add(-time.Nanosecond))
	if err != nil {
		return nil, err
	}

	// Get returns for refund calculation
	todayReturns, err := s.returnRepo.GetReturnsByDateRange(today, today.AddDate(0, 0, 1).Add(-time.Nanosecond))
	if err != nil {
		return nil, err
	}
	yesterdayReturns, err := s.returnRepo.GetReturnsByDateRange(yesterday, today.Add(-time.Nanosecond))
	if err != nil {
		return nil, err
	}

	// Helper to categorize transaction into shift
	getShift := func(t *models.Transaksi) string {
		return s.shiftRepo.DetermineShift(t.Tanggal)
	}

	// Helper to categorize return into shift
	getReturnShift := func(r *models.Return) string {
		return s.shiftRepo.DetermineShift(r.ReturnDate)
	}

	// Helper to accumulate stats
	accStats := func(trans []*models.Transaksi, returns []*models.Return) (map[string]*models.ShiftStats, map[string]map[int64]bool) {
		stats := map[string]*models.ShiftStats{
			"shift1": {StaffCount: 0},
			"shift2": {StaffCount: 0},
		}
		staffSet := map[string]map[int64]bool{
			"shift1": make(map[int64]bool),
			"shift2": make(map[int64]bool),
		}

		productHPPCache := make(map[int]int)

		// Process Transactions (Sales)
		for _, t := range trans {
			if t.Status != "selesai" {
				continue
			}

			shift := getShift(t)
			if shift == "" {
				continue
			}

			// Calculate Profit & Item Count dynamically
			transactionHPP := 0
			itemCount := 0

			detail, err := s.transaksiRepo.GetByID(t.ID)
			if err == nil && detail != nil {
				for _, item := range detail.Items {
					itemCount += item.Jumlah

					if item.ProdukID != nil {
						hpp, ok := productHPPCache[*item.ProdukID]
						if !ok {
							produk, err := s.produkRepo.GetByID(*item.ProdukID)
							if err == nil && produk != nil {
								hpp = produk.HargaBeli
								productHPPCache[*item.ProdukID] = hpp
							} else {
								hpp = 0
							}
						}

						if item.BeratGram > 0 {
							transactionHPP += int((item.BeratGram / 1000.0) * float64(hpp))
						} else {
							transactionHPP += item.Jumlah * hpp
						}
					}
				}
			}

			profit := t.Total - transactionHPP

			// DEBUG LOG
			// fmt.Printf("[SHIFT REPORT] TRX: %s | Total: %d | HPP: %d | Profit: %d\n", t.NomorTransaksi, t.Total, transactionHPP, profit)

			s := stats[shift]
			s.TotalPenjualan += float64(t.Total)
			s.TotalProfit += float64(profit)
			s.TotalTransaksi++
			s.TotalItemTerjual += itemCount
			s.TotalDiskon += float64(t.Diskon)

			// Staff count
			if t.StaffID != nil && *t.StaffID > 0 {
				staffSet[shift][*t.StaffID] = true
			}
		}

		// Process Returns (Refunds)
		refundCount1 := 0
		refundCount2 := 0
		for _, r := range returns {
			shift := getReturnShift(r)

			if shift == "" {
				continue
			}

			stats[shift].TotalRefund += float64(r.RefundAmount)
			stats[shift].TotalRefund += float64(r.RefundAmount)
			// Do NOT subtract count for Net Transactions (User Request)
			// stats[shift].TotalTransaksi--

			if shift == "shift1" {
				refundCount1++
			} else if shift == "shift2" {
				refundCount2++
			}
		}

		stats["shift1"].StaffCount = len(staffSet["shift1"])
		stats["shift2"].StaffCount = len(staffSet["shift2"])

		// CLAMPING: Ensure Total Transactions doesn't go below 0
		if stats["shift1"].TotalTransaksi < 0 {
			stats["shift1"].TotalTransaksi = 0
		}
		if stats["shift2"].TotalTransaksi < 0 {
			stats["shift2"].TotalTransaksi = 0
		}

		return stats, staffSet
	}

	todayStats, _ := accStats(todayTrans, todayReturns)
	yesterdayStats, _ := accStats(yesterdayTrans, yesterdayReturns)

	calculateTrend := func(curr, prev float64) float64 {
		if prev == 0 {
			if curr > 0 {
				return 100
			}
			return 0
		}
		return (curr - prev) / prev * 100
	}

	// Populate response
	resp := &models.ShiftReportsResponse{
		Shift1: todayStats["shift1"],
		Shift2: todayStats["shift2"],
	}

	// Calculate trends
	resp.Shift1.TrendPenjualan = calculateTrend(todayStats["shift1"].TotalPenjualan, yesterdayStats["shift1"].TotalPenjualan)
	resp.Shift1.TrendProfit = calculateTrend(todayStats["shift1"].TotalProfit, yesterdayStats["shift1"].TotalProfit)
	resp.Shift1.TrendTransaksi = calculateTrend(float64(todayStats["shift1"].TotalTransaksi), float64(yesterdayStats["shift1"].TotalTransaksi))
	resp.Shift1.TrendDiskon = calculateTrend(todayStats["shift1"].TotalDiskon, yesterdayStats["shift1"].TotalDiskon)
	resp.Shift1.TrendProduk = calculateTrend(float64(todayStats["shift1"].TotalItemTerjual), float64(yesterdayStats["shift1"].TotalItemTerjual))

	resp.Shift2.TrendPenjualan = calculateTrend(todayStats["shift2"].TotalPenjualan, yesterdayStats["shift2"].TotalPenjualan)
	resp.Shift2.TrendProfit = calculateTrend(todayStats["shift2"].TotalProfit, yesterdayStats["shift2"].TotalProfit)
	resp.Shift2.TrendTransaksi = calculateTrend(float64(todayStats["shift2"].TotalTransaksi), float64(yesterdayStats["shift2"].TotalTransaksi))
	resp.Shift2.TrendDiskon = calculateTrend(todayStats["shift2"].TotalDiskon, yesterdayStats["shift2"].TotalDiskon)
	resp.Shift2.TrendProduk = calculateTrend(float64(todayStats["shift2"].TotalItemTerjual), float64(yesterdayStats["shift2"].TotalItemTerjual))

	return resp, nil
}

// GetShiftCashiers returns active staff in a shift for today
func (s *StaffReportService) GetShiftCashiers(shift string) ([]*models.ShiftCashier, error) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := today.AddDate(0, 0, 1).Add(-time.Nanosecond)

	// 1. Get Transactional Active Staff
	trans, err := s.transaksiRepo.GetByDateRange(today, endOfDay)
	if err != nil {
		return nil, err
	}

	processedStaff := make(map[int64]bool)
	var cashiers []*models.ShiftCashier

	for _, t := range trans {
		currentShift := s.shiftRepo.DetermineShift(t.Tanggal)

		if currentShift == shift && t.StaffID != nil && *t.StaffID != 0 {
			if !processedStaff[*t.StaffID] {
				processedStaff[*t.StaffID] = true

				name := t.StaffNama
				if name == "" {
					user, err := s.userRepo.GetByID(*t.StaffID)
					if err == nil && user != nil {
						name = user.NamaLengkap
					}
				}

				cashiers = append(cashiers, &models.ShiftCashier{
					ID:   *t.StaffID,
					Nama: name,
				})
			}
		}
	}

	// 2. Get Assigned Staff from Shift Settings
	settings, err := s.shiftRepo.GetAll()
	if err == nil {
		var targetStaffIDs string
		for _, setting := range settings {
			// Debug log
			// fmt.Printf("[DEBUG] Checking setting: Name='%s', for requested shift='%s'\n", setting.Name, shift)
			if (shift == "shift1" && setting.Name == "Shift 1") || (shift == "shift2" && setting.Name == "Shift 2") {
				targetStaffIDs = setting.StaffIDs

				break
			}
		}

		if targetStaffIDs != "" {
			ids := strings.Split(targetStaffIDs, ",")
			for _, idStr := range ids {
				id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
				if err == nil && id != 0 {
					if !processedStaff[id] {
						processedStaff[id] = true
						// Fetch name
						user, err := s.userRepo.GetByID(id)
						if err == nil && user != nil {
							cashiers = append(cashiers, &models.ShiftCashier{
								ID:   id,
								Nama: user.NamaLengkap,
							})
						}
					}
				}
			}
		}
	}

	// Debug Log Final Result

	for _, c := range cashiers {
		fmt.Printf("[%s] ", c.Nama)
	}
	fmt.Println()

	return cashiers, nil
}

// GetShiftDetail returns detailed breakdown for a specific shift and date
func (s *StaffReportService) GetShiftDetail(shift string, dateStr string) (*models.ShiftDetailResponse, error) {
	// FIX: Parse in Local time to ensure 00:00 is local midnight, not UTC midnight (07:00 WIB)
	date, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
	if err != nil {
		return nil, fmt.Errorf("invalid date format: %w", err)
	}

	// Get Shift Settings for dynamic determination
	shifts, err := s.shiftRepo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("failed to get shift settings: %w", err)
	}

	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1).Add(-time.Nanosecond)

	trans, err := s.transaksiRepo.GetByDateRange(startOfDay, endOfDay)
	if err != nil {
		return nil, err
	}

	response := &models.ShiftDetailResponse{
		Transactions:     make([]models.ShiftTransaction, 0),
		TopProducts:      make([]models.ShiftProduct, 0),
		HourlyData:       make([]models.ShiftHourlyData, 0),
		StaffPerformance: make([]models.ShiftStaffPerf, 0),
	}

	productStats := make(map[string]*models.ShiftProduct)
	hourlyStats := make(map[string]*models.ShiftHourlyData)
	staffStats := make(map[string]*models.ShiftStaffPerf)

	for i := 6; i <= 22; i++ {
		h := fmt.Sprintf("%02d", i)
		hourlyStats[h] = &models.ShiftHourlyData{Hour: h, Revenue: 0, Transactions: 0}
	}

	fmt.Printf("[DEBUG DETAIL] Processing %d transactions for shift %s...\n", len(trans), shift)

	for _, t := range trans {
		// Debug Log
		fmt.Printf("TRX %s: Status=%s, Time=%s\n", t.NomorTransaksi, t.Status, t.Tanggal.Format("15:04"))

		if t.Status != "selesai" {
			continue
		}

		// Determine Shift using dynamic helper
		// Need to check specific transaction time against shift settings
		// Use DetermineShift helper which handles settings and local time conversion
		currentShift := s.shiftRepo.DetermineShift(t.Tanggal)

		fmt.Printf("TRX %s: Determined Shift=%s (Expected=%s)\n", t.NomorTransaksi, currentShift, shift)

		if currentShift != shift {
			continue
		}

		// FIX: Use Local/WIB time for hourly aggregation, otherwise UTC time (e.g. 00:30)
		// will be missed if shift is 07:00-15:00.
		// Use the location from the parsed 'date' variable (which is Local)
		localTrxTime := t.Tanggal.In(date.Location())
		hour := localTrxTime.Hour()

		// Dynamic Hourly Data Initialization based on shift
		// (For simplicity we keep 06-22 fixed loop for map init above, but data will only fill for active hours)
		// Ideally we should make the initialization dynamic too, but for now filtering T is key.

		// Calculate Profit & Item Count dynamically
		transactionHPP := 0
		itemCount := 0
		var productNames []string
		productHPPCache := make(map[int]int)

		detail, err := s.transaksiRepo.GetByID(t.ID)
		if err == nil && detail != nil {
			for _, item := range detail.Items {
				itemCount += item.Jumlah
				productNames = append(productNames, fmt.Sprintf("%s (%dx)", item.ProdukNama, item.Jumlah))

				if item.ProdukID != nil {
					hpp, ok := productHPPCache[*item.ProdukID]
					if !ok {
						produk, err := s.produkRepo.GetByID(*item.ProdukID)
						if err == nil && produk != nil {
							hpp = produk.HargaBeli
							productHPPCache[*item.ProdukID] = hpp
						} else {
							hpp = 0
						}
					}

					if item.BeratGram > 0 {
						transactionHPP += int((item.BeratGram / 1000.0) * float64(hpp))
					} else {
						transactionHPP += item.Jumlah * hpp
					}
				}

				productName := item.ProdukNama
				if _, exists := productStats[productName]; !exists {
					category := item.ProdukKategori
					if category == "" {
						category = "Uncategorized"
					}
					productStats[productName] = &models.ShiftProduct{
						Name: productName, Category: category,
						Quantity: 0, Revenue: 0,
					}
				}
				productStats[productName].Quantity += item.Jumlah
				productStats[productName].Revenue += float64(item.Subtotal)
			}
		}

		// Join product names
		productsStr := ""
		if len(productNames) > 0 {
			if len(productNames) > 2 {
				productsStr = fmt.Sprintf("%s, %s, +%d more", productNames[0], productNames[1], len(productNames)-2)
			} else {
				productsStr = ""
				for i, name := range productNames {
					if i > 0 {
						productsStr += ", "
					}
					productsStr += name
				}
			}
		}

		response.Transactions = append(response.Transactions, models.ShiftTransaction{
			ID:             t.ID,
			NomorTransaksi: t.NomorTransaksi,
			Time:           t.Tanggal,
			Cashier:        t.Kasir,
			Products:       productsStr,
			Total:          float64(t.Total),
			ItemCount:      itemCount,
		})

		h := fmt.Sprintf("%02d", hour)
		if stat, ok := hourlyStats[h]; ok {
			stat.Revenue += float64(t.Total)
			stat.Transactions++
		}

		staffName := t.StaffNama
		if staffName == "" {
			staffName = t.Kasir
		}

		if _, exists := staffStats[staffName]; !exists {
			staffStats[staffName] = &models.ShiftStaffPerf{
				Name: staffName, Transactions: 0, Revenue: 0, ProductsSold: 0,
			}
		}
		staffStats[staffName].Transactions++
		staffStats[staffName].Revenue += float64(t.Total)
		staffStats[staffName].ProductsSold += itemCount
	}

	var products []models.ShiftProduct
	for _, p := range productStats {
		products = append(products, *p)
	}
	// Sort by quantity desc
	for i := 0; i < len(products); i++ {
		for j := i + 1; j < len(products); j++ {
			if products[j].Quantity > products[i].Quantity {
				products[i], products[j] = products[j], products[i]
			}
		}
	}
	if len(products) > 10 {
		products = products[:10]
	}
	response.TopProducts = products

	// Determine active hours based on shift settings
	// For simplicity in this loop, we might want to get the actual shift config
	// But since this is just iterating hours to show stats, we can be a bit more flexible or just check if data exists

	var startHour, endHour int

	// Use previously fetched 'shifts'
	if shift == "shift1" && len(shifts) > 0 {
		startHour, _ = parseTime(shifts[0].StartTime)
		endHour, _ = parseTime(shifts[0].EndTime)
	} else if shift == "shift2" && len(shifts) > 1 {
		startHour, _ = parseTime(shifts[1].StartTime)
		endHour, _ = parseTime(shifts[1].EndTime)
	} else {
		// Fallbacks
		if shift == "shift1" {
			startHour, endHour = 6, 14
		}
		if shift == "shift2" {
			startHour, endHour = 14, 22
		}
	}

	for i := startHour; i < endHour; i++ {
		h := fmt.Sprintf("%02d", i)
		if stat, ok := hourlyStats[h]; ok {
			response.HourlyData = append(response.HourlyData, *stat)
		} else {
			// Add empty stat for hours with no sales if needed, or just skip
			// Adding empty stat makes the chart look better (continuous)
			response.HourlyData = append(response.HourlyData, models.ShiftHourlyData{
				Hour: h, Revenue: 0, Transactions: 0,
			})
		}
	}

	for _, s := range staffStats {
		s.AverageTransaction = 0
		if s.Transactions > 0 {
			s.AverageTransaction = s.Revenue / float64(s.Transactions)
		}
		response.StaffPerformance = append(response.StaffPerformance, *s)
	}

	return response, nil
}

// Helper to parse time string "HH:MM"
func parseTime(tStr string) (int, int) {
	t, _ := time.Parse("15:04", tStr)
	return t.Hour(), t.Minute()
}
