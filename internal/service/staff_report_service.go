package service

import (
	"fmt"
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
}

// NewStaffReportService creates a new staff report service
func NewStaffReportService() *StaffReportService {
	return &StaffReportService{
		transaksiRepo: repository.NewTransaksiRepository(),
		userRepo:      repository.NewUserRepository(),
		produkRepo:    repository.NewProdukRepository(),
		returnRepo:    repository.NewReturnRepository(),
	}
}

// GetStaffReport generates performance report for a specific staff
func (s *StaffReportService) GetStaffReport(staffID int, startDate, endDate time.Time) (*models.StaffReport, error) {
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
	totalItemTerjual := 0
	productHPPCache := make(map[int]int) // Cache for product HPP

	for _, t := range transaksiList {
		totalPenjualan += t.Total

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

	// Get refund/return data for this staff
	totalRefund, err := s.returnRepo.GetTotalRefundByStaffAndDateRange(staffID, startDate, endDate)
	if err != nil {
		// Log warning but continue - refund data is optional
		fmt.Printf("Warning: Failed to get refund data for staff %d: %v\n", staffID, err)
		totalRefund = 0
	}

	returnCount, err := s.returnRepo.GetReturnCountByStaffAndDateRange(staffID, startDate, endDate)
	if err != nil {
		// Log warning but continue - return count is optional
		fmt.Printf("Warning: Failed to get return count for staff %d: %v\n", staffID, err)
		returnCount = 0
	}

	report := &models.StaffReport{
		StaffID:          staffID,
		NamaStaff:        staff.NamaLengkap,
		TotalTransaksi:   totalTransaksi,
		TotalPenjualan:   totalPenjualan,
		TotalProfit:      totalProfit,
		TotalItemTerjual: totalItemTerjual,
		TotalRefund:      totalRefund,      // Total refund amount (based on harga_beli)
		TotalReturnCount: returnCount,      // Total number of return transactions
		PeriodeMulai:     startDate,
		PeriodeSelesai:   endDate,
	}

	return report, nil
}

// GetStaffReportDetail gets detailed report with transaction list and item counts by date
func (s *StaffReportService) GetStaffReportDetail(staffID int, startDate, endDate time.Time) (*models.StaffReportDetailWithItems, error) {
	// Get basic report
	report, err := s.GetStaffReport(staffID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Get transaction list
	transaksiList, err := s.transaksiRepo.GetByStaffIDAndDateRange(staffID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	// Get item counts by date
	itemCounts, err := s.transaksiRepo.GetItemCountsByDateForStaff(staffID, startDate, endDate)
	if err != nil {
		fmt.Printf("Warning: Failed to get item counts: %v\n", err)
		itemCounts = make(map[string]int)
	}

	return &models.StaffReportDetailWithItems{
		Report:          report,
		Transaksi:       transaksiList,
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
			fmt.Printf("Warning: Failed to get report for staff %s: %v\n", staff.NamaLengkap, err)
			continue
		}
		reports = append(reports, report)
	}

	return reports, nil
}

// GetStaffReportWithTrend gets report with trend comparison vs previous period
func (s *StaffReportService) GetStaffReportWithTrend(staffID int, startDate, endDate time.Time) (*models.StaffReportWithTrend, error) {
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
func (s *StaffReportService) GetStaffHistoricalData(staffID int) (*models.StaffHistoricalData, error) {
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
		monthEnd := monthStart.AddDate(0, 1, -1)

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

	fmt.Printf("[STAFF REPORT] Found %d transaction staff (admin + staff)\n", len(staffList))

	today := time.Now()
	startOfToday := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	endOfToday := time.Date(today.Year(), today.Month(), today.Day(), 23, 59, 59, 999999999, today.Location())

	var reports []*models.StaffReportWithTrend

	for _, staff := range staffList {
		fmt.Printf("[STAFF REPORT] Processing staff: %s (ID: %d, Role: %s)\n", staff.NamaLengkap, staff.ID, staff.Role)
		report, err := s.GetStaffReportWithTrend(staff.ID, startOfToday, endOfToday)
		if err != nil {
			fmt.Printf("Warning: Failed to get trend report for staff %s: %v\n", staff.NamaLengkap, err)
			continue
		}
		reports = append(reports, report)
	}

	fmt.Printf("[STAFF REPORT] Completed processing %d staff reports\n", len(reports))
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
func (s *StaffReportService) GetStaffReportWithMonthlyTrend(staffID int, startDate, endDate time.Time) (*models.StaffReportWithTrend, error) {
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
func (s *StaffReportService) GetStaffShiftData(staffID int, startDate, endDate time.Time) (map[string]map[string]interface{}, error) {
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

	// Aggregate current totals
	currentTotals := struct {
		TotalPenjualan   int
		TotalTransaksi   int
		TotalItemTerjual int
	}{}

	for _, report := range currentReports {
		currentTotals.TotalPenjualan += report.TotalPenjualan
		currentTotals.TotalTransaksi += report.TotalTransaksi
		currentTotals.TotalItemTerjual += report.TotalItemTerjual
	}

	// Aggregate previous totals
	prevTotals := struct {
		TotalPenjualan   int
		TotalTransaksi   int
		TotalItemTerjual int
	}{}

	for _, report := range prevReports {
		prevTotals.TotalPenjualan += report.TotalPenjualan
		prevTotals.TotalTransaksi += report.TotalTransaksi
		prevTotals.TotalItemTerjual += report.TotalItemTerjual
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
