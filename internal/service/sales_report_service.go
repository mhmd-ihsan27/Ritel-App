package service

import (
	"fmt"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

// SalesReportService handles comprehensive sales reporting
type SalesReportService struct {
	transaksiRepo *repository.TransaksiRepository
	produkRepo    *repository.ProdukRepository
	returnRepo    *repository.ReturnRepository
}

// NewSalesReportService creates a new sales report service
func NewSalesReportService() *SalesReportService {
	return &SalesReportService{
		transaksiRepo: repository.NewTransaksiRepository(),
		produkRepo:    repository.NewProdukRepository(),
		returnRepo:    repository.NewReturnRepository(),
	}
}

// GetComprehensiveSalesReport generates a complete sales report for a date range
func (s *SalesReportService) GetComprehensiveSalesReport(startDate, endDate time.Time) (*models.ComprehensiveSalesReport, error) {
	// Get all transactions in the date range
	transaksiList, err := s.transaksiRepo.GetByDateRange(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	// Get detailed transactions for current period
	currentDetailedTransactions := make([]*models.TransaksiDetail, len(transaksiList))
	for i, t := range transaksiList {
		details, err := s.transaksiRepo.GetByID(t.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get details for transaction %d: %w", t.ID, err)
		}
		currentDetailedTransactions[i] = details
	}

	// Calculate previous period for comparison
	duration := endDate.Sub(startDate)
	prevStartDate := startDate.Add(-duration)
	prevEndDate := startDate.AddDate(0, 0, -1)

	prevTransaksiList, err := s.transaksiRepo.GetByDateRange(prevStartDate, prevEndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get previous transactions: %w", err)
	}

	// Get detailed transactions for previous period
	prevDetailedTransactions := make([]*models.TransaksiDetail, len(prevTransaksiList))
	for i, t := range prevTransaksiList {
		details, err := s.transaksiRepo.GetByID(t.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to get details for previous transaction %d: %w", t.ID, err)
		}
		prevDetailedTransactions[i] = details
	}

	// Get total products sold
	totalProductsSold, err := s.transaksiRepo.GetTotalProductsSoldByDateRange(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get total products sold: %w", err)
	}

	prevTotalProductsSold, err := s.transaksiRepo.GetTotalProductsSoldByDateRange(prevStartDate, prevEndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get previous total products sold: %w", err)
	}

	// Get total return amount for current period
	totalReturnAmount, err := s.returnRepo.GetTotalRefundByDateRange(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get total return amount: %w", err)
	}

	// Get total return amount for previous period
	prevTotalReturnAmount, err := s.returnRepo.GetTotalRefundByDateRange(prevStartDate, prevEndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get previous total return amount: %w", err)
	}

	// Generate summary with return deductions
	summary := s.calculateSummary(currentDetailedTransactions, prevDetailedTransactions, totalProductsSold, prevTotalProductsSold, totalReturnAmount, prevTotalReturnAmount)

	// Generate sales trend data for different periods
	salesTrendData := map[string]models.SalesReportPeriodData{
		"hari":   s.calculateSalesTrendData(transaksiList, "hari"),
		"minggu": s.calculateSalesTrendData(transaksiList, "minggu"),
		"bulan":  s.calculateSalesTrendData(transaksiList, "bulan"),
	}

	// Generate discount trend data for different periods
	discountTrendData := map[string]models.SalesReportDiscountPeriodData{
		"hari":   s.calculateDiscountTrendData(transaksiList, "hari"),
		"minggu": s.calculateDiscountTrendData(transaksiList, "minggu"),
		"bulan":  s.calculateDiscountTrendData(transaksiList, "bulan"),
	}

	// Generate monthly sales trend (kept for detail table and other aggregations)
	monthlySales := s.calculateMonthlySales(currentDetailedTransactions)

	// Generate hourly sales (old approach, will be replaced by hourlySalesTrendData)
	hourlySales := s.calculateHourlySales(transaksiList)

	// Generate hourly sales trend data for different periods
	hourlySalesTrendData := map[string]models.SalesReportPeriodData{
		"hari":   s.calculateHourlyTrendData(transaksiList, "hari"),
		"minggu": s.calculateHourlyTrendData(transaksiList, "minggu"),
		"bulan":  s.calculateHourlyTrendData(transaksiList, "bulan"),
	}

	// Generate top products
	topProducts := s.calculateTopProducts(transaksiList)

	// Generate discount analysis
	discountAnalysis := s.calculateDiscountAnalysis(transaksiList)

	// Generate discount type breakdown
	discountTypeBreakdown := s.calculateDiscountTypeBreakdown(transaksiList)

	// Generate payment method breakdown
	paymentMethodBreakdown := s.calculatePaymentMethodBreakdown(startDate, endDate)

	// Generate loss analysis
	lossAnalysis := s.calculateLossAnalysis(startDate, endDate)

	return &models.ComprehensiveSalesReport{
		Summary:                summary,
		SalesTrendData:         salesTrendData,
		DiscountTrendData:      discountTrendData,
		MonthlySales:           monthlySales,
		HourlySales:            hourlySales,
		HourlySalesTrendData:   hourlySalesTrendData,
		TopProducts:            topProducts,
		DiscountAnalysis:       discountAnalysis,
		DiscountTypeBreakdown:  discountTypeBreakdown,
		PaymentMethodBreakdown: paymentMethodBreakdown,
		LossAnalysis:           lossAnalysis,
		StartDate:              startDate,
		EndDate:                endDate,
		GeneratedAt:            time.Now(),
	}, nil
}

// calculateSummary calculates overall sales summary with trends
func (s *SalesReportService) calculateSummary(currentDetailed, previousDetailed []*models.TransaksiDetail, currentProductsSold, prevProductsSold int, currentReturnAmount, prevReturnAmount int) *models.SalesSummaryResponse {
	// Current period totals
	totalOmset := 0
	totalProfit := 0
	totalTransaksi := len(currentDetailed)
	totalProdukTerjual := currentProductsSold

	productHPPCache := make(map[int]int)

	for _, tDetail := range currentDetailed {
		totalOmset += tDetail.Transaksi.Total

		transactionHPP := 0
		for _, item := range tDetail.Items {
			if item.ProdukID != nil {
				// Check cache first
				hpp, ok := productHPPCache[*item.ProdukID]
				if !ok {
					// Fetch from repo if not in cache
					produk, err := s.produkRepo.GetByID(*item.ProdukID)
					if err == nil && produk != nil {
						hpp = produk.HargaBeli
						productHPPCache[*item.ProdukID] = hpp
					} else {
						// Log error or handle missing product HPP
						hpp = 0 // Assume 0 HPP if not found
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
		totalProfit += tDetail.Transaksi.Total - transactionHPP
	}

	// Deduct return amount from omset and profit
	totalOmset -= currentReturnAmount
	totalProfit -= currentReturnAmount

	rataRataTransaksi := 0
	if totalTransaksi > 0 {
		rataRataTransaksi = totalOmset / totalTransaksi
	}

	// Previous period totals
	prevTotalOmset := 0
	prevTotalProfit := 0
	prevTotalTransaksi := len(previousDetailed)
	prevTotalProdukTerjual := prevProductsSold
	prevRataRata := 0

	for _, tDetail := range previousDetailed {
		prevTotalOmset += tDetail.Transaksi.Total

		prevTransactionHPP := 0
		for _, item := range tDetail.Items {
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
					prevTransactionHPP += int((item.BeratGram / 1000.0) * float64(hpp))
				} else {
					// Barang satuan tetap: HPP = jumlah * harga_beli
					prevTransactionHPP += item.Jumlah * hpp
				}
			}
		}
		prevTotalProfit += tDetail.Transaksi.Total - prevTransactionHPP
	}

	// Deduct return amount from previous period omset and profit
	prevTotalOmset -= prevReturnAmount
	prevTotalProfit -= prevReturnAmount

	if prevTotalTransaksi > 0 {
		prevRataRata = prevTotalOmset / prevTotalTransaksi
	}

	// Calculate trends (percentage change)
	calculateTrend := func(current, previous int) float64 {
		if previous == 0 {
			if current > 0 {
				return 100.0
			}
			return 0.0
		}
		return float64(current-previous) / float64(previous) * 100.0
	}

	return &models.SalesSummaryResponse{
		TotalOmset:         totalOmset,
		TotalProfit:        totalProfit,
		TotalTransaksi:     totalTransaksi,
		TotalProdukTerjual: totalProdukTerjual,
		RataRataTransaksi:  rataRataTransaksi,
		TrendOmset:         calculateTrend(totalOmset, prevTotalOmset),
		TrendProfit:        calculateTrend(totalProfit, prevTotalProfit),
		TrendTransaksi:     calculateTrend(totalTransaksi, prevTotalTransaksi),
		TrendProdukTerjual: calculateTrend(totalProdukTerjual, prevTotalProdukTerjual),
		TrendRataRata:      calculateTrend(rataRataTransaksi, prevRataRata),
	}
}

// calculateMonthlySales calculates monthly sales trend with discount, HPP, and profit
func (s *SalesReportService) calculateMonthlySales(detailedTransactions []*models.TransaksiDetail) []*models.MonthlySalesData {
	monthlyMap := make(map[string]*models.MonthlySalesData)

	productHPPCache := make(map[int]int) // Cache for product HargaBeli

	for _, tDetail := range detailedTransactions {
		monthKey := fmt.Sprintf("%d-%02d", tDetail.Transaksi.Tanggal.Year(), tDetail.Transaksi.Tanggal.Month())

		if _, exists := monthlyMap[monthKey]; !exists {
			monthlyMap[monthKey] = &models.MonthlySalesData{
				Month:      tDetail.Transaksi.Tanggal.Format("Jan 2006"),
				MonthIndex: int(tDetail.Transaksi.Tanggal.Month()),
				Year:       tDetail.Transaksi.Tanggal.Year(),
				Omset:      0,
				Profit:     0,
				HPP:        0,
				Transaksi:  0,
				Diskon:     0,
				Loss:       0,
			}

		}

		monthlyMap[monthKey].Omset += tDetail.Transaksi.Total
		monthlyMap[monthKey].Transaksi++
		monthlyMap[monthKey].Diskon += tDetail.Transaksi.Diskon

		// Calculate HPP for this transaction
		transactionHPP := 0
		for _, item := range tDetail.Items {
			if item.ProdukID != nil {
				hpp, ok := productHPPCache[*item.ProdukID]
				if !ok {
					produk, err := s.produkRepo.GetByID(*item.ProdukID)
					if err != nil {

						hpp = 0 // Assume 0 HPP if not found
					} else if produk != nil {
						hpp = produk.HargaBeli
						productHPPCache[*item.ProdukID] = hpp

					} else {
						hpp = 0 // Assume 0 HPP if not found

					}
				} else {
					fmt.Printf("[DEBUG] Using cached HPP for ProdukID %d: %d\n", *item.ProdukID, hpp)
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

		monthlyMap[monthKey].HPP += transactionHPP
		monthlyMap[monthKey].Profit += (tDetail.Transaksi.Total - transactionHPP)
		 
	}

	// Add loss data from stok_history table
	for monthKey, data := range monthlyMap {
		// Parse month key to get year and month
		var year, month int
		fmt.Sscanf(monthKey, "%d-%d", &year, &month)

		// Get loss for this month from stok_history
		startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.Local)
		endDate := startDate.AddDate(0, 1, 0) // First day of next month

		// Query loss from stok_history
		lossQuery := `
			SELECT COALESCE(SUM(nilai_kerugian), 0) as total_loss
			FROM stok_history
			WHERE jenis_perubahan = 'pengurangan'
				AND tipe_kerugian IS NOT NULL
				AND created_at >= ? AND created_at < ?
		`
		var monthLoss int
		err := database.DB.QueryRow(lossQuery, startDate, endDate).Scan(&monthLoss)
		if err == nil {
			data.Loss += monthLoss
		}

		// Also add expired items from batch table
		expiredQuery := `
			SELECT COALESCE(SUM(b.qty_tersisa * p.harga_beli), 0) as expired_loss
			FROM batch b
			INNER JOIN produk p ON b.produk_id = p.id
			WHERE b.status = 'expired'
				AND b.tanggal_kadaluarsa >= ? AND b.tanggal_kadaluarsa < ?
		`
		var expiredLoss int
		err = database.DB.QueryRow(expiredQuery, startDate, endDate).Scan(&expiredLoss)
		if err == nil {
			data.Loss += expiredLoss
		}
	}

	// Convert map to slice and sort by date
	result := make([]*models.MonthlySalesData, 0, len(monthlyMap))
	for _, data := range monthlyMap {
		result = append(result, data)
	}

	// Sort the result by year and month
	for i := 0; i < len(result)-1; i++ {
		for j := i + 1; j < len(result); j++ {
			if result[j].Year < result[i].Year || (result[j].Year == result[i].Year && result[j].MonthIndex < result[i].MonthIndex) {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result
}

// calculateHourlySales calculates sales performance by hour
func (s *SalesReportService) calculateHourlySales(transaksiList []*models.Transaksi) []*models.HourlySalesData {
	hourlyMap := make(map[int]*models.HourlySalesData)

	// Initialize all hours
	for i := 0; i < 24; i++ {
		hourlyMap[i] = &models.HourlySalesData{
			Hour:      i,
			Omset:     0,
			Transaksi: 0,
		}
	}

	for _, t := range transaksiList {
		hour := t.Tanggal.In(time.Local).Hour()
		hourlyMap[hour].Omset += t.Total
		hourlyMap[hour].Transaksi++
	}

	// Convert to slice
	result := make([]*models.HourlySalesData, 24)
	for i := 0; i < 24; i++ {
		result[i] = hourlyMap[i]
	}

	return result
}

// calculateTopProducts calculates top selling products
func (s *SalesReportService) calculateTopProducts(transaksiList []*models.Transaksi) []*models.TopProductData {
	totalOmset := 0

	// Get transaction IDs and total omset
	for _, t := range transaksiList {
		totalOmset += t.Total
	}

	if len(transaksiList) == 0 {
		return []*models.TopProductData{}
	}

	// Query to get product sales from transaksi_item
	query := `
		SELECT
			ti.produk_nama,
			ti.produk_kategori,
			SUM(ti.jumlah) as total_terjual,
			SUM(ti.subtotal) as total_omset
		FROM transaksi_item ti
		INNER JOIN transaksi t ON ti.transaksi_id = t.id
		WHERE t.status = 'selesai'
		GROUP BY ti.produk_nama, ti.produk_kategori
		ORDER BY total_omset DESC
		LIMIT 10
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		fmt.Printf("Error querying top products: %v\n", err)
		return []*models.TopProductData{}
	}
	defer rows.Close()

	result := make([]*models.TopProductData, 0)
	rank := 1

	for rows.Next() {
		var namaProduk, kategori string
		var totalTerjual, totalOmsetProduk int

		if err := rows.Scan(&namaProduk, &kategori, &totalTerjual, &totalOmsetProduk); err != nil {
			fmt.Printf("Error scanning top product row: %v\n", err)
			continue
		}

		persentase := 0.0
		if totalOmset > 0 {
			persentase = float64(totalOmsetProduk) / float64(totalOmset) * 100.0
		}

		result = append(result, &models.TopProductData{
			Rank:         rank,
			NamaProduk:   namaProduk,
			Kategori:     kategori,
			TotalTerjual: totalTerjual,
			TotalOmset:   totalOmsetProduk,
			Persentase:   persentase,
		})
		rank++
	}

	return result
}

// calculateDiscountAnalysis calculates discount impact analysis
func (s *SalesReportService) calculateDiscountAnalysis(transaksiList []*models.Transaksi) *models.DiscountAnalysis {
	totalDiskon := 0
	totalTransaksiDiskon := 0
	diskonTerbesar := 0
	omsetDenganDiskon := 0
	omsetTanpaDiskon := 0
	totalTransaksi := len(transaksiList)

	for _, t := range transaksiList {
		if t.Diskon > 0 {
			totalDiskon += t.Diskon
			totalTransaksiDiskon++
			omsetDenganDiskon += t.Total
			if t.Diskon > diskonTerbesar {
				diskonTerbesar = t.Diskon
			}
		} else {
			omsetTanpaDiskon += t.Total
		}
	}

	rataRataDiskon := 0
	if totalTransaksiDiskon > 0 {
		rataRataDiskon = totalDiskon / totalTransaksiDiskon
	}

	persentaseTransaksi := 0.0
	if totalTransaksi > 0 {
		persentaseTransaksi = float64(totalTransaksiDiskon) / float64(totalTransaksi) * 100.0
	}

	return &models.DiscountAnalysis{
		TotalDiskon:          totalDiskon,
		TotalTransaksiDiskon: totalTransaksiDiskon,
		PersentaseTransaksi:  persentaseTransaksi,
		RataRataDiskon:       rataRataDiskon,
		DiskonTerbesar:       diskonTerbesar,
		OmsetDenganDiskon:    omsetDenganDiskon,
		OmsetTanpaDiskon:     omsetTanpaDiskon,
	}
}

// calculateDiscountTypeBreakdown calculates breakdown by discount type
func (s *SalesReportService) calculateDiscountTypeBreakdown(transaksiList []*models.Transaksi) []*models.DiscountTypeBreakdown {
	totalDiskon := 0
	promoDiskon := 0
	promoCount := 0
	manualDiskon := 0
	manualCount := 0

	for _, t := range transaksiList {
		if t.Diskon > 0 {
			totalDiskon += t.Diskon
			// Determine if it's promo or manual based on DiskonPromo field
			if t.DiskonPromo > 0 {
				promoDiskon += t.DiskonPromo
				promoCount++
			}
			// Manual discount or customer discount
			if t.DiskonPelanggan > 0 || (t.Diskon > t.DiskonPromo) {
				manualDiskon += (t.Diskon - t.DiskonPromo)
				manualCount++
			}
		}
	}

	result := make([]*models.DiscountTypeBreakdown, 0)

	if promoDiskon > 0 {
		persentase := 0.0
		if totalDiskon > 0 {
			persentase = float64(promoDiskon) / float64(totalDiskon) * 100.0
		}
		result = append(result, &models.DiscountTypeBreakdown{
			Type:        "Promo",
			TotalDiskon: promoDiskon,
			Jumlah:      promoCount,
			Persentase:  persentase,
		})
	}

	if manualDiskon > 0 {
		persentase := 0.0
		if totalDiskon > 0 {
			persentase = float64(manualDiskon) / float64(totalDiskon) * 100.0
		}
		result = append(result, &models.DiscountTypeBreakdown{
			Type:        "Manual",
			TotalDiskon: manualDiskon,
			Jumlah:      manualCount,
			Persentase:  persentase,
		})
	}

	return result
}

// calculatePaymentMethodBreakdown calculates breakdown by payment method
func (s *SalesReportService) calculatePaymentMethodBreakdown(startDate, endDate time.Time) []*models.PaymentMethodBreakdown {
	// Get payment method breakdown from repository
	methodCounts, err := s.transaksiRepo.GetPaymentMethodBreakdownByDateRange(startDate, endDate)
	if err != nil {
		// Return empty array on error
		return []*models.PaymentMethodBreakdown{}
	}

	// Get omset by payment method
	methodOmset, err := s.transaksiRepo.GetTransactionOmsetByPaymentMethod(startDate, endDate)
	if err != nil {
		// Return empty array on error
		return []*models.PaymentMethodBreakdown{}
	}

	// Calculate total transactions for percentage
	totalTransactions := 0
	for _, count := range methodCounts {
		totalTransactions += count
	}

	// Build result
	result := make([]*models.PaymentMethodBreakdown, 0)
	for method, count := range methodCounts {
		persentase := 0.0
		if totalTransactions > 0 {
			persentase = float64(count) / float64(totalTransactions) * 100.0
		}

		result = append(result, &models.PaymentMethodBreakdown{
			Method:     method,
			Jumlah:     count,
			TotalOmset: methodOmset[method],
			Persentase: persentase,
		})
	}

	return result
}

// calculateLossAnalysis calculates comprehensive loss analysis from stock history and batch data
func (s *SalesReportService) calculateLossAnalysis(startDate, endDate time.Time) *models.LossAnalysisData {
	// Query to get loss data from stock history with type categorization
	query := `
		SELECT
			COALESCE(sh.tipe_kerugian, 'other') as tipe,
			SUM(sh.nilai_kerugian) as total_loss,
			COUNT(*) as count
		FROM stok_history sh
		WHERE sh.jenis_perubahan = 'pengurangan'
			AND sh.tipe_kerugian IS NOT NULL
			AND created_at BETWEEN ? AND ?
		GROUP BY sh.tipe_kerugian
	`

	// Use database.Query() wrapper for proper placeholder translation (? -> $1, $2 for PostgreSQL)
	rows, err := database.Query(query, startDate, endDate)
	if err != nil {
		fmt.Printf("[ERROR] Failed to query loss data: %v\n", err)
		return &models.LossAnalysisData{
			TotalLoss:     0,
			LossBreakdown: []*models.LossBreakdownItem{},
			Labels:        []string{},
			Data:          []float64{},
			Colors:        []string{},
		}
	}
	defer rows.Close()

	lossMap := make(map[string]*models.LossBreakdownItem)
	totalLoss := 0

	// Define label mapping and colors
	typeLabels := map[string]string{
		"kadaluarsa": "Barang Kadaluarsa",
		"rusak":      "Barang Rusak",
		"hilang":     "Kehilangan",
		"other":      "Lainnya",
	}

	typeColors := map[string]string{
		"kadaluarsa": "#ef4444", // red
		"rusak":      "#f97316", // orange
		"hilang":     "#eab308", // yellow
		"other":      "#6b7280", // gray
	}

	// Process loss data from stock history
	for rows.Next() {
		var tipe string
		var loss, count int

		if err := rows.Scan(&tipe, &loss, &count); err != nil {
			fmt.Printf("[ERROR] Failed to scan loss row: %v\n", err)
			continue
		}

		label, exists := typeLabels[tipe]
		if !exists {
			label = "Lainnya"
			tipe = "other"
		}

		lossMap[tipe] = &models.LossBreakdownItem{
			Type:       tipe,
			Label:      label,
			TotalLoss:  loss,
			Count:      count,
			Persentase: 0, // Will be calculated later
		}

		totalLoss += loss
	}

	// Also check for expired items from batch table
	expiredQuery := `
		SELECT
			COUNT(*) as count,
			SUM(b.qty_tersisa * p.harga_beli) as total_loss
		FROM batch b
		INNER JOIN produk p ON b.produk_id = p.id
		WHERE b.tanggal_kadaluarsa BETWEEN ? AND ?
			AND b.status = 'expired'
	`

	var expiredCount, expiredLoss int
	err = database.DB.QueryRow(expiredQuery, startDate, endDate).Scan(&expiredCount, &expiredLoss)
	if err == nil && expiredLoss > 0 {
		if existing, exists := lossMap["kadaluarsa"]; exists {
			existing.TotalLoss += expiredLoss
			existing.Count += expiredCount
		} else {
			lossMap["kadaluarsa"] = &models.LossBreakdownItem{
				Type:       "kadaluarsa",
				Label:      "Barang Kadaluarsa",
				TotalLoss:  expiredLoss,
				Count:      expiredCount,
				Persentase: 0,
			}
		}
		totalLoss += expiredLoss
	}

	// Calculate percentages and build arrays for chart
	labels := []string{}
	data := []float64{}
	colors := []string{}
	breakdown := []*models.LossBreakdownItem{}

	// Sort order: kadaluarsa, rusak, hilang, other
	sortOrder := []string{"kadaluarsa", "rusak", "hilang", "other"}

	for _, tipe := range sortOrder {
		if item, exists := lossMap[tipe]; exists {
			if totalLoss > 0 {
				item.Persentase = float64(item.TotalLoss) / float64(totalLoss) * 100.0
			}

			labels = append(labels, item.Label)
			data = append(data, float64(item.TotalLoss)) // Changed: Send actual loss value in Rupiah, not percentage
			colors = append(colors, typeColors[tipe])
			breakdown = append(breakdown, item)
		}
	}

	return &models.LossAnalysisData{
		TotalLoss:     totalLoss,
		LossBreakdown: breakdown,
		Labels:        labels,
		Data:          data,
		Colors:        colors,
	}
}

// toLocalTime interprets a timestamp as local time (for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)
func toLocalTime(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), t.Nanosecond(), time.Local)
}

// calculateSalesTrendData calculates sales trend for a given period type
func (s *SalesReportService) calculateSalesTrendData(transaksiList []*models.Transaksi, periodType string) models.SalesReportPeriodData {
	now := time.Now().In(time.Local) // Normalize now to local start of day
	now = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var labels []string
	var data []float64

	salesMap := make(map[string]float64)

	switch periodType {
	case "hari": // Today: last 8 x 3-hour slots
		for i := 7; i >= 0; i-- {
			hour := i * 3
			labels = append(labels, fmt.Sprintf("%02d:00", hour))

			slotStart := time.Date(now.Year(), now.Month(), now.Day(), hour, 0, 0, 0, now.Location())
			slotEnd := slotStart.Add(3 * time.Hour)

			var currentSlotTotal float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(slotStart) || tLocal.Equal(slotStart)) && tLocal.Before(slotEnd) {
					currentSlotTotal += float64(t.Total)
				}
			}
			salesMap[fmt.Sprintf("%02d", hour)] = currentSlotTotal
		}

		// Populate data in correct order
		for i := 7; i >= 0; i-- {
			hour := i * 3
			data = append([]float64{salesMap[fmt.Sprintf("%02d", hour)]}, data...)
		}
		// Reverse labels to be chronological
		for i, j := 0, len(labels)-1; i < j; i, j = i+1, j-1 {
			labels[i], labels[j] = labels[j], labels[i]
		}

	case "minggu": // Last 7 days
		for i := 6; i >= 0; i-- {
			date := now.AddDate(0, 0, -i)
			labels = append(labels, date.Format("Mon"))

			dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, now.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			var currentDayTotal float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(dayStart) || tLocal.Equal(dayStart)) && tLocal.Before(dayEnd) {
					currentDayTotal += float64(t.Total)
				}
			}
			salesMap[date.Format("2006-01-02")] = currentDayTotal
		}

		// Populate data in correct order
		for i := 6; i >= 0; i-- {
			date := now.AddDate(0, 0, -i)
			data = append([]float64{salesMap[date.Format("2006-01-02")]}, data...)
		}
		// Reverse labels to be chronological
		for i, j := 0, len(labels)-1; i < j; i, j = i+1, j-1 {
			labels[i], labels[j] = labels[j], labels[i]
		}

	case "bulan": // Last 30 days
		for i := 0; i < 30; i++ { // Iterate from 0 to 29 for 30 days
			date := now.AddDate(0, 0, -(29 - i)) // Calculate date chronologically: 29 days ago -> today
			labels = append(labels, date.Format("2 Jan"))

			dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, now.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			var currentDayTotal float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(dayStart) || tLocal.Equal(dayStart)) && tLocal.Before(dayEnd) {
					currentDayTotal += float64(t.Total)
				}
			}
			data = append(data, currentDayTotal) // Append directly
		}
	}

	return models.SalesReportPeriodData{Labels: labels, Data: data}
}

// calculateDiscountTrendData calculates discount trend for a given period type
func (s *SalesReportService) calculateDiscountTrendData(transaksiList []*models.Transaksi, periodType string) models.SalesReportDiscountPeriodData {
	now := time.Now().In(time.Local) // Normalize now to local start of day
	now = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var labels []string
	var salesWithDiscount []float64
	var discountValue []float64

	salesMap := make(map[string]float64)
	discountMap := make(map[string]float64)

	switch periodType {
	case "hari": // Today: last 8 x 3-hour slots
		for i := 7; i >= 0; i-- {
			hour := i * 3
			labels = append(labels, fmt.Sprintf("%02d:00", hour))

			slotStart := time.Date(now.Year(), now.Month(), now.Day(), hour, 0, 0, 0, now.Location())
			slotEnd := slotStart.Add(3 * time.Hour)

			var currentSlotSales float64
			var currentSlotDiscount float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(slotStart) || tLocal.Equal(slotStart)) && tLocal.Before(slotEnd) {
					currentSlotSales += float64(t.Total)
					currentSlotDiscount += float64(t.Diskon)
				}
			}
			salesMap[fmt.Sprintf("%02d", hour)] = currentSlotSales
			discountMap[fmt.Sprintf("%02d", hour)] = currentSlotDiscount
		}

		// Populate data in correct order
		for i := 7; i >= 0; i-- {
			hour := i * 3
			salesWithDiscount = append([]float64{salesMap[fmt.Sprintf("%02d", hour)]}, salesWithDiscount...)
			discountValue = append([]float64{discountMap[fmt.Sprintf("%02d", hour)]}, discountValue...)
		}
		// Reverse labels to be chronological
		for i, j := 0, len(labels)-1; i < j; i, j = i+1, j-1 {
			labels[i], labels[j] = labels[j], labels[i]
		}

	case "minggu": // Last 7 days
		for i := 6; i >= 0; i-- {
			date := now.AddDate(0, 0, -i)
			labels = append(labels, date.Format("Mon"))

			dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, now.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			var currentDaySales float64
			var currentDayDiscount float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(dayStart) || tLocal.Equal(dayStart)) && tLocal.Before(dayEnd) {
					currentDaySales += float64(t.Total)
					currentDayDiscount += float64(t.Diskon)
				}
			}
			salesMap[date.Format("2006-01-02")] = currentDaySales
			discountMap[date.Format("2006-01-02")] = currentDayDiscount
		}

		// Populate data in correct order
		for i := 6; i >= 0; i-- {
			date := now.AddDate(0, 0, -i)
			salesWithDiscount = append([]float64{salesMap[date.Format("2006-01-02")]}, salesWithDiscount...)
			discountValue = append([]float64{discountMap[date.Format("2006-01-02")]}, discountValue...)
		}
		// Reverse labels to be chronological
		for i, j := 0, len(labels)-1; i < j; i, j = i+1, j-1 {
			labels[i], labels[j] = labels[j], labels[i]
		}

	case "bulan": // Last 30 days
		for i := 0; i < 30; i++ { // Iterate from 0 to 29 for 30 days
			date := now.AddDate(0, 0, -(29 - i)) // Calculate date chronologically: 29 days ago -> today
			labels = append(labels, date.Format("2 Jan"))

			dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, now.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			var currentDaySales float64
			var currentDayDiscount float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(dayStart) || tLocal.Equal(dayStart)) && tLocal.Before(dayEnd) {
					currentDaySales += float64(t.Total)
					currentDayDiscount += float64(t.Diskon)
				}
			}
			salesWithDiscount = append(salesWithDiscount, currentDaySales)
			discountValue = append(discountValue, currentDayDiscount)
		}
	}

	return models.SalesReportDiscountPeriodData{Labels: labels, SalesWithDiscount: salesWithDiscount, DiscountValue: discountValue}
}

// calculateHourlyTrendData calculates hourly sales trend for a given period type
func (s *SalesReportService) calculateHourlyTrendData(transaksiList []*models.Transaksi, periodType string) models.SalesReportPeriodData {
	now := time.Now().In(time.Local) // Normalize now to local start of day
	now = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var labels []string
	var data []float64

	hourlyMap := make(map[string]float64)

	switch periodType {
	case "hari": // Today: last 8 x 3-hour slots
		for i := 0; i < 24; i += 3 { // Iterate 00:00, 03:00, ..., 21:00
			labels = append(labels, fmt.Sprintf("%02d:00", i))

			slotStart := time.Date(now.Year(), now.Month(), now.Day(), i, 0, 0, 0, now.Location())
			slotEnd := slotStart.Add(3 * time.Hour)

			var currentSlotTotal float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(slotStart) || tLocal.Equal(slotStart)) && tLocal.Before(slotEnd) {
					currentSlotTotal += float64(t.Total)
				}
			}
			hourlyMap[fmt.Sprintf("%02d", i)] = currentSlotTotal
		}
		// Populate data in correct chronological order
		for i := 0; i < 24; i += 3 {
			data = append(data, hourlyMap[fmt.Sprintf("%02d", i)])
		}

	case "minggu": // Last 7 days
		for i := 0; i < 7; i++ { // Iterate from 6 days ago (i=0) to today (i=6)
			date := now.AddDate(0, 0, -(6 - i)) // Calculate date chronologically
			labels = append(labels, date.Format("Mon"))

			dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, now.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			var currentDayTotal float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(dayStart) || tLocal.Equal(dayStart)) && tLocal.Before(dayEnd) {
					currentDayTotal += float64(t.Total)
				}
			}
			hourlyMap[date.Format("2006-01-02")] = currentDayTotal
		}
		// Populate data in correct chronological order
		for i := 0; i < 7; i++ {
			date := now.AddDate(0, 0, -(6 - i))
			data = append(data, hourlyMap[date.Format("2006-01-02")])
		}

	case "bulan": // Last 30 days
		for i := 0; i < 30; i++ { // Iterate from 29 days ago (i=0) to today (i=29)
			date := now.AddDate(0, 0, -(29 - i)) // Calculate date chronologically
			labels = append(labels, date.Format("2 Jan"))

			dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, now.Location())
			dayEnd := dayStart.Add(24 * time.Hour)

			var currentDayTotal float64
			for _, t := range transaksiList {
				tLocal := toLocalTime(t.CreatedAt)
				if (tLocal.After(dayStart) || tLocal.Equal(dayStart)) && tLocal.Before(dayEnd) {
					currentDayTotal += float64(t.Total)
				}
			}
			hourlyMap[date.Format("2006-01-02")] = currentDayTotal
		}
		// Populate data in correct chronological order
		for i := 0; i < 30; i++ {
			date := now.AddDate(0, 0, -(29 - i))
			data = append(data, hourlyMap[date.Format("2006-01-02")])
		}
	}

	return models.SalesReportPeriodData{Labels: labels, Data: data}
}

func (s *SalesReportService) GetSalesByPeriod(filterType string) (map[string]interface{}, error) {
    // Determine the actual date range based on the filter type
    now := time.Now()
    var start, end time.Time

    switch filterType {
    case "hari":
        // Data untuk hari ini
        start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
        end = time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())
    case "minggu":
        // Data untuk 7 hari terakhir
        start = now.AddDate(0, 0, -7).Truncate(24 * time.Hour)
        end = now
    case "bulan":
        // Data untuk 30 hari terakhir
        start = now.AddDate(0, 0, -30).Truncate(24 * time.Hour)
        end = now
    default:
        // Default to today if filter is unrecognized
        start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
        end = time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())
    }

    // Get raw data from repository
    // We map 'hari' -> 'day', 'minggu' -> 'week', 'bulan' -> 'month' for the DB query
    groupBy := "hour" // Default grouping
    if filterType == "hari" {
        groupBy = "day"
    } else if filterType == "minggu" {
        groupBy = "week"
    } else if filterType == "bulan" {
        groupBy = "month"
    }

    rawData, err := s.transaksiRepo.GetSalesGroupedByPeriod(start, end, groupBy)
    if err != nil {
        return nil, fmt.Errorf("failed to get sales data from repository: %w", err)
    }

    // Transform the raw data into the format expected by the frontend
    labels := make([]string, len(rawData))
    revenue := make([]int, len(rawData))
    transactions := make([]int, len(rawData))

    for i, data := range rawData {
        labels[i] = data["label"].(string)
        revenue[i] = data["revenue"].(int)
        transactions[i] = data["transactions"].(int)
    }

    return map[string]interface{}{
        "labels":       labels,
        "revenue":      revenue,
        "transactions": transactions,
    }, nil
}
