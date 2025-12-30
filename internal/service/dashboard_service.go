package service

import (
	"fmt"
	"log"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"strings"
	"time"
)

// DashboardService handles dashboard data operations
type DashboardService struct {
	transaksiRepo *repository.TransaksiRepository
	produkRepo    *repository.ProdukRepository
	batchRepo     *repository.BatchRepository
	promoRepo     *repository.PromoRepository
	returnRepo    *repository.ReturnRepository
}

// NewDashboardService creates a new dashboard service
func NewDashboardService() *DashboardService {
	return &DashboardService{
		transaksiRepo: repository.NewTransaksiRepository(),
		produkRepo:    repository.NewProdukRepository(),
		batchRepo:     repository.NewBatchRepository(),
		promoRepo:     repository.NewPromoRepository(),
		returnRepo:    repository.NewReturnRepository(),
	}
}

// GetDashboardData returns all dashboard data
func (s *DashboardService) GetDashboardData() (*models.DashboardData, error) {
	// Get statistik bulanan
	statistikBulanan, err := s.GetStatistikBulanan()
	if err != nil {
		return nil, err
	}

	// Get notifikasi
	notifikasi, err := s.GetNotifikasi()
	if err != nil {
		// Continue with empty notifications
		notifikasi = []models.DashboardNotifikasi{}
	}

	// Get performa hari ini
	performaHariIni, err := s.GetPerformaHariIni()
	if err != nil {
		return nil, err
	}

	// Get produk terlaris
	produkTerlaris, err := s.GetProdukTerlaris(8)
	if err != nil {
		// Continue with empty list
		produkTerlaris = []models.DashboardProdukTerlaris{}
	}

	// Get aktivitas terakhir
	aktivitasTerakhir, err := s.GetAktivitasTerakhir(6)
	if err != nil {
		// Continue with empty list
		aktivitasTerakhir = []models.DashboardAktivitas{}
	}

	return &models.DashboardData{
		StatistikBulanan:  *statistikBulanan,
		Notifikasi:        notifikasi,
		PerformaHariIni:   performaHariIni,
		ProdukTerlaris:    produkTerlaris,
		AktivitasTerakhir: aktivitasTerakhir,
	}, nil
}

// GetStatistikBulanan returns monthly statistics
func (s *DashboardService) GetStatistikBulanan() (*models.DashboardStatistikBulanan, error) {
	now := time.Now()

	// Current month start and end
	currentMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	currentMonthEnd := now

	// Previous month start and end
	previousMonthStart := currentMonthStart.AddDate(0, -1, 0)
	previousMonthEnd := currentMonthStart.Add(-time.Second)

	// Get current month data
	currentMonthTransactions, err := s.transaksiRepo.GetByDateRange(currentMonthStart, currentMonthEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to get current month transactions: %w", err)
	}

	// Get previous month data
	previousMonthTransactions, err := s.transaksiRepo.GetByDateRange(previousMonthStart, previousMonthEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to get previous month transactions: %w", err)
	}

	// Calculate current month totals
	var currentTotalPendapatan float64
	var currentTotalTransaksi int
	var currentProdukTerjual int
	var currentTotalHargaBeli float64

	productHPPCache := make(map[int]int) // Cache for product HPP

	for _, t := range currentMonthTransactions {
		currentTotalPendapatan += float64(t.Total)
		currentTotalTransaksi++

		// Get transaction details for product count and HPP
		details, err := s.transaksiRepo.GetByID(t.ID)
		if err == nil && details != nil {
			for _, d := range details.Items {
				currentProdukTerjual += d.Jumlah

				// Get produk for harga beli (ProdukID might be nil if product was deleted)
				if d.ProdukID != nil {
					var hpp int
					// Use cache to avoid repeated DB calls
					if cachedHPP, ok := productHPPCache[*d.ProdukID]; ok {
						hpp = cachedHPP
					} else {
						produk, err := s.produkRepo.GetByID(*d.ProdukID)
						if err == nil {
							hpp = produk.HargaBeli
							productHPPCache[*d.ProdukID] = hpp
						}
					}

					// For curah products, calculate based on weight (grams)
					if d.BeratGram > 0 {
						// Curah product: HPP = (berat_gram / 1000) * harga_beli_per_kg
						currentTotalHargaBeli += (d.BeratGram / 1000.0) * float64(hpp)
					} else {
						// Regular product: HPP = jumlah * harga_beli
						currentTotalHargaBeli += float64(d.Jumlah) * float64(hpp)
					}
				}
			}
		}
	}

	// Deduct return amount from current month
	currentReturnAmount, err := s.returnRepo.GetTotalRefundByDateRange(currentMonthStart, currentMonthEnd)
	if err == nil {
		currentTotalPendapatan -= float64(currentReturnAmount)
	}

	currentKeuntunganBersih := currentTotalPendapatan - currentTotalHargaBeli

	// Calculate previous month totals for comparison
	var previousTotalPendapatan float64
	for _, t := range previousMonthTransactions {
		previousTotalPendapatan += float64(t.Total)
	}

	// Deduct return amount from previous month
	prevReturnAmount, err := s.returnRepo.GetTotalRefundByDateRange(previousMonthStart, previousMonthEnd)
	if err == nil {
		previousTotalPendapatan -= float64(prevReturnAmount)
	}

	// Calculate percentage change
	var vsBulanLalu float64
	if previousTotalPendapatan > 0 {
		vsBulanLalu = ((currentTotalPendapatan - previousTotalPendapatan) / previousTotalPendapatan) * 100
	} else if currentTotalPendapatan > 0 {
		vsBulanLalu = 100
	}

	// Pastikan Total Pendapatan dan Keuntungan Bersih tidak negatif (minimum 0)
	if currentTotalPendapatan < 0 {
		currentTotalPendapatan = 0
	}
	if currentKeuntunganBersih < 0 {
		currentKeuntunganBersih = 0
	}

	return &models.DashboardStatistikBulanan{
		TotalPendapatan:  currentTotalPendapatan,
		TotalTransaksi:   currentTotalTransaksi,
		ProdukTerjual:    currentProdukTerjual,
		KeuntunganBersih: currentKeuntunganBersih,
		VsBulanLalu:      vsBulanLalu,
	}, nil
}

// GetNotifikasi returns important notifications
func (s *DashboardService) GetNotifikasi() ([]models.DashboardNotifikasi, error) {
	notifikasi := []models.DashboardNotifikasi{}
	notifID := 1

	// Check for low stock products
	allProducts, err := s.produkRepo.GetAll()
	if err == nil {
		lowStockCount := 0
		for _, p := range allProducts {
			if p.Stok < 10 {
				lowStockCount++
			}
		}
		if lowStockCount > 0 {
			notifikasi = append(notifikasi, models.DashboardNotifikasi{
				ID:       notifID,
				Type:     "low-stock",
				Title:    "Stok Menipis",
				Message:  fmt.Sprintf("%d produk dengan stok kurang dari 10 item", lowStockCount),
				Priority: "high",
				Time:     time.Now().Format("15:04"),
			})
			notifID++
		}
	}

	// Check for expiring promos
	allPromos, err := s.promoRepo.GetAll()
	if err == nil {
		expiringPromos := 0
		twoDaysLater := time.Now().AddDate(0, 0, 2)
		for _, promo := range allPromos {
			if promo.TanggalMulai.Before(time.Now()) && promo.TanggalSelesai.After(time.Now()) &&
				promo.TanggalSelesai.Before(twoDaysLater) {
				expiringPromos++
			}
		}
		if expiringPromos > 0 {
			notifikasi = append(notifikasi, models.DashboardNotifikasi{
				ID:       notifID,
				Type:     "promo",
				Title:    "Promo Akan Berakhir",
				Message:  fmt.Sprintf("%d promo akan berakhir dalam 2 hari", expiringPromos),
				Priority: "medium",
				Time:     time.Now().Add(-time.Hour).Format("15:04"),
			})
			notifID++
		}
	}

	// Check for newly added products (last 24 hours)
	if len(allProducts) > 0 {
		oneDayAgo := time.Now().Add(-24 * time.Hour)
		newProductCount := 0
		for _, p := range allProducts {
			if p.CreatedAt.After(oneDayAgo) {
				newProductCount++
			}
		}
		if newProductCount > 0 {
			notifikasi = append(notifikasi, models.DashboardNotifikasi{
				ID:       notifID,
				Type:     "new-product",
				Title:    "Produk Baru Masuk",
				Message:  fmt.Sprintf("%d produk baru telah ditambahkan ke inventory", newProductCount),
				Priority: "low",
				Time:     time.Now().Add(-2 * time.Hour).Format("15:04"),
			})
			notifID++
		}
	}

	return notifikasi, nil
}

// GetPerformaHariIni returns today's performance metrics
func (s *DashboardService) GetPerformaHariIni() ([]models.DashboardPerforma, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	yesterdayStart := todayStart.Add(-24 * time.Hour)

	// Get today's transactions
	todayTransactions, err := s.transaksiRepo.GetByDateRange(todayStart, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get today transactions: %w", err)
	}

	// Get yesterday's transactions for comparison
	yesterdayTransactions, err := s.transaksiRepo.GetByDateRange(yesterdayStart, todayStart)
	if err != nil {
		return nil, fmt.Errorf("failed to get yesterday transactions: %w", err)
	}

	// Calculate today's metrics
	var todayOmzet float64
	var todayTransaksiCount int
	var todayProdukTerjual int

	for _, t := range todayTransactions {
		todayOmzet += float64(t.Total)
		todayTransaksiCount++

		details, err := s.transaksiRepo.GetByID(t.ID)
		if err == nil && details != nil {
			for _, d := range details.Items {
				todayProdukTerjual += d.Jumlah
			}
		}
	}

	// Deduct today's returns from omset
	todayReturnAmount, err := s.returnRepo.GetTotalRefundByDateRange(todayStart, now)
	if err == nil {
		todayOmzet -= float64(todayReturnAmount)
	}

	// Calculate yesterday's metrics for trend
	var yesterdayOmzet float64
	var yesterdayTransaksiCount int
	var yesterdayProdukTerjual int

	for _, t := range yesterdayTransactions {
		yesterdayOmzet += float64(t.Total)
		yesterdayTransaksiCount++

		details, err := s.transaksiRepo.GetByID(t.ID)
		if err == nil && details != nil {
			for _, d := range details.Items {
				yesterdayProdukTerjual += d.Jumlah
			}
		}
	}

	// Deduct yesterday's returns from omset
	yesterdayReturnAmount, err := s.returnRepo.GetTotalRefundByDateRange(yesterdayStart, todayStart)
	if err == nil {
		yesterdayOmzet -= float64(yesterdayReturnAmount)
	}

	// Calculate trends
	omzetTrend := calculateTrend(todayOmzet, yesterdayOmzet)
	transaksiTrend := calculateTrend(float64(todayTransaksiCount), float64(yesterdayTransaksiCount))
	produkTrend := calculateTrend(float64(todayProdukTerjual), float64(yesterdayProdukTerjual))

	// Count unique customers today (if pelangganID is not 0)
	uniqueCustomers := 0
	customerMap := make(map[int]bool)
	for _, t := range todayTransactions {
		if t.PelangganID > 0 {
			if !customerMap[t.PelangganID] {
				customerMap[t.PelangganID] = true
				uniqueCustomers++
			}
		}
	}

	// Yesterday unique customers
	yesterdayCustomers := 0
	yesterdayCustomerMap := make(map[int]bool)
	for _, t := range yesterdayTransactions {
		if t.PelangganID > 0 {
			if !yesterdayCustomerMap[t.PelangganID] {
				yesterdayCustomerMap[t.PelangganID] = true
				yesterdayCustomers++
			}
		}
	}

	customerTrend := calculateTrend(float64(uniqueCustomers), float64(yesterdayCustomers))

	performa := []models.DashboardPerforma{
		{
			ID:     1,
			Title:  "Omzet Hari Ini",
			Value:  todayOmzet,
			Target: 3000000, // Default target
			Trend:  omzetTrend,
			Icon:   "faMoneyBillWave",
			Color:  "green",
		},
		{
			ID:     2,
			Title:  "Transaksi Hari Ini",
			Value:  float64(todayTransaksiCount),
			Target: 100, // Default target
			Trend:  transaksiTrend,
			Icon:   "faReceipt",
			Color:  "blue",
		},
		{
			ID:     3,
			Title:  "Produk Terjual",
			Value:  float64(todayProdukTerjual),
			Target: 300, // Default target
			Trend:  produkTrend,
			Icon:   "faShoppingBasket",
			Color:  "purple",
		},
		{
			ID:     4,
			Title:  "Pelanggan Baru",
			Value:  float64(uniqueCustomers),
			Target: 15, // Default target
			Trend:  customerTrend,
			Icon:   "faUsers",
			Color:  "red",
		},
	}

	return performa, nil
}

// GetProdukTerlaris returns best-selling products
func (s *DashboardService) GetProdukTerlaris(limit int) ([]models.DashboardProdukTerlaris, error) {
	// Get transactions from last 30 days
	now := time.Now()
	thirtyDaysAgo := now.AddDate(0, 0, -30)

	transactions, err := s.transaksiRepo.GetByDateRange(thirtyDaysAgo, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	// Count products sold
	productSales := make(map[int]int) // produkID -> total terjual

	for _, t := range transactions {
		details, err := s.transaksiRepo.GetByID(t.ID)
		if err != nil || details == nil {
			continue
		}

		for _, d := range details.Items {
			if d.ProdukID != nil {
				productSales[*d.ProdukID] += d.Jumlah
			}
		}
	}

	// Get product details and create list
	type productWithSales struct {
		produk  *models.Produk
		terjual int
	}

	var productList []productWithSales
	for produkID, terjual := range productSales {
		produk, err := s.produkRepo.GetByID(produkID)
		if err != nil {
			continue
		}
		productList = append(productList, productWithSales{
			produk:  produk,
			terjual: terjual,
		})
	}

	// Sort by terjual descending
	for i := 0; i < len(productList)-1; i++ {
		for j := i + 1; j < len(productList); j++ {
			if productList[j].terjual > productList[i].terjual {
				productList[i], productList[j] = productList[j], productList[i]
			}
		}
	}

	// Take top N and format response
	result := []models.DashboardProdukTerlaris{}
	for i := 0; i < len(productList) && i < limit; i++ {
		p := productList[i]
		color := getColorByCategory(p.produk.Kategori)

		result = append(result, models.DashboardProdukTerlaris{
			ID:       p.produk.ID,
			Nama:     p.produk.Nama,
			Kategori: p.produk.Kategori,
			Harga:    float64(p.produk.HargaJual),
			Terjual:  p.terjual,
			Satuan:   p.produk.Satuan,
			Color:    color,
		})
	}

	return result, nil
}

// GetAktivitasTerakhir returns recent activities
func (s *DashboardService) GetAktivitasTerakhir(limit int) ([]models.DashboardAktivitas, error) {
	aktivitas := []models.DashboardAktivitasWithTime{}

	now := time.Now()
	oneDayAgo := now.AddDate(0, 0, -1)

	// Get recent transactions
	recentTransactions, err := s.transaksiRepo.GetByDateRange(oneDayAgo, now)
	if err == nil && len(recentTransactions) > 0 {
		for _, tx := range recentTransactions {
			aktivitas = append(aktivitas, models.DashboardAktivitasWithTime{
				Title:     "Transaksi Baru",
				CreatedAt: tx.CreatedAt,
				Icon:      "faReceipt",
				Color:     "blue",
			})
		}
	}

	// Get recent product additions
	allProducts, err := s.produkRepo.GetAll()
	if err == nil {
		for _, p := range allProducts {
			if p.CreatedAt.After(oneDayAgo) {
				aktivitas = append(aktivitas, models.DashboardAktivitasWithTime{
					Title:     "Produk Masuk",
					CreatedAt: p.CreatedAt,
					Icon:      "faBoxOpen",
					Color:     "green",
				})
			}
		}
	}

	// Get recent promo creations
	allPromos, err := s.promoRepo.GetAll()
	if err == nil {
		for _, promo := range allPromos {
			if promo.CreatedAt.After(oneDayAgo) {
				aktivitas = append(aktivitas, models.DashboardAktivitasWithTime{
					Title:     "Promo Dibuat",
					CreatedAt: promo.CreatedAt,
					Icon:      "faTags",
					Color:     "purple",
				})
			}
		}
	}

	// Check for low stock products (as an activity)
	if err == nil {
		lowStockCount := 0
		var latestLowStock time.Time
		for _, p := range allProducts {
			if p.Stok < 10 {
				lowStockCount++
				if latestLowStock.IsZero() || p.UpdatedAt.After(latestLowStock) {
					latestLowStock = p.UpdatedAt
				}
			}
		}
		if lowStockCount > 0 && !latestLowStock.IsZero() {
			aktivitas = append(aktivitas, models.DashboardAktivitasWithTime{
				Title:     fmt.Sprintf("Stok Menipis (%d produk)", lowStockCount),
				CreatedAt: latestLowStock, // Use latest update time for low stock
				Icon:      "faExclamationTriangle",
				Color:     "yellow",
			})
		}
	}

	// Sort all activities by CreatedAt descending
	for i := 0; i < len(aktivitas)-1; i++ {
		for j := i + 1; j < len(aktivitas); j++ {
			if aktivitas[j].CreatedAt.After(aktivitas[i].CreatedAt) {
				aktivitas[i], aktivitas[j] = aktivitas[j], aktivitas[i]
			}
		}
	}

	// Limit to requested number and format final response
	result := make([]models.DashboardAktivitas, 0, limit)
	for i, act := range aktivitas {
		if i >= limit {
			break
		}
		result = append(result, models.DashboardAktivitas{
			ID:    i + 1,
			Title: act.Title,
			Time:  formatTimeAgo(act.CreatedAt),
			Icon:  act.Icon,
			Color: act.Color,
		})
	}

	return result, nil
}

// Helper functions

func calculateTrend(current, previous float64) float64 {
	if previous == 0 {
		if current > 0 {
			return 100
		}
		return 0
	}
	return ((current - previous) / previous) * 100
}

func getColorByCategory(kategori string) string {
	switch kategori {
	case "Sayur":
		return "green"
	case "Buah":
		return "orange"
	case "Bumbu":
		return "red"
	case "Organik":
		return "yellow"
	default:
		return "gray"
	}
}

func formatTimeAgo(t time.Time) string {
	duration := time.Since(t)
	if duration < time.Minute {
		return "Baru saja"
	} else if duration < time.Hour {
		minutes := int(duration.Minutes())
		return fmt.Sprintf("%d menit yang lalu", minutes)
	} else if duration < 24*time.Hour {
		hours := int(duration.Hours())
		return fmt.Sprintf("%d jam yang lalu", hours)
	} else {
		days := int(duration.Hours() / 24)
		return fmt.Sprintf("%d hari yang lalu", days)
	}
}

// GetSalesChartData returns sales data for charts (hari/minggu/bulan)
func (s *DashboardService) GetSalesChartData() (*models.DashboardSalesData, error) {
	now := time.Now()
	// Normalize 'now' to the start of today for consistent date calculations
	now = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// HARI: Last 8 time slots for today (3-hour intervals)
	hariLabels := []string{}
	hariData := []float64{}

	for i := 7; i >= 0; i-- {
		hour := i * 3
		hariLabels = append(hariLabels, fmt.Sprintf("%02d:00", hour))

		// Calculate time range for this slot
		slotStart := time.Date(now.Year(), now.Month(), now.Day(), hour, 0, 0, 0, now.Location())
		slotEnd := slotStart.Add(3 * time.Hour)

		// Get transactions in this slot
		transactions, err := s.transaksiRepo.GetByDateRange(slotStart, slotEnd)
		if err != nil {
			hariData = append(hariData, 0)
			continue
		}

		var total float64
		for _, t := range transactions {
			total += float64(t.Total)
		}
		// Deduct returns for this slot
		returnAmount, err := s.returnRepo.GetTotalRefundByDateRange(slotStart, slotEnd)
		if err == nil {
			total -= float64(returnAmount)
		}
		hariData = append(hariData, total)
	}

	// MINGGU: Last 7 days
	mingguLabels := []string{}
	mingguData := []float64{}

	// Iterate from 6 days ago (j=0) to today (j=6)
	for j := 0; j < 7; j++ {
		date := now.AddDate(0, 0, -(6 - j))
		mingguLabels = append(mingguLabels, date.Format("Mon"))

		dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		dayEnd := dayStart.Add(24 * time.Hour)

		transactions, err := s.transaksiRepo.GetByDateRange(dayStart, dayEnd)
		if err != nil {
			mingguData = append(mingguData, 0)
			continue
		}

		var total float64
		for _, t := range transactions {
			total += float64(t.Total)
		}
		// Deduct returns for this day
		returnAmount, err := s.returnRepo.GetTotalRefundByDateRange(dayStart, dayEnd)
		if err == nil {
			total -= float64(returnAmount)
		}
		mingguData = append(mingguData, total)
	}

	// BULAN: Last 30 days
	bulanLabels := []string{}
	bulanData := []float64{}

	for i := 29; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		bulanLabels = append(bulanLabels, date.Format("2 Jan"))

		dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
		dayEnd := dayStart.Add(24 * time.Hour)

		transactions, err := s.transaksiRepo.GetByDateRange(dayStart, dayEnd)
		if err != nil {
			bulanData = append(bulanData, 0)
			continue
		}

		var total float64
		for _, t := range transactions {
			total += float64(t.Total)
		}
		// Deduct returns for this day
		returnAmount, err := s.returnRepo.GetTotalRefundByDateRange(dayStart, dayEnd)
		if err == nil {
			total -= float64(returnAmount)
		}
		bulanData = append(bulanData, total)
	}

	return &models.DashboardSalesData{
		Hari: models.DashboardPeriodData{
			Labels: hariLabels,
			Data:   hariData,
		},
		Minggu: models.DashboardPeriodData{
			Labels: mingguLabels,
			Data:   mingguData,
		},
		Bulan: models.DashboardPeriodData{
			Labels: bulanLabels,
			Data:   bulanData,
		},
	}, nil
}

// Di file service/dashboard.go

// GetCompositionChartData returns sales composition by category
func (s *DashboardService) GetCompositionChartData() (map[string]interface{}, error) {
	now := time.Now()

	// HARI: Gunakan data kemarin agar lebih relevan saat dibuka pagi hari
	yesterdayStart := time.Date(now.Year(), now.Month(), now.Day()-1, 0, 0, 0, 0, now.Location())
	yesterdayEnd := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	hariComp := s.calculateCategoryComposition(yesterdayStart, yesterdayEnd)

	// MINGGU: Last 7 days
	weekStart := now.AddDate(0, 0, -7)
	mingguComp := s.calculateCategoryComposition(weekStart, now)

	// BULAN: Last 30 days
	monthStart := now.AddDate(0, 0, -30)
	bulanComp := s.calculateCategoryComposition(monthStart, now)

	// Return data without wrapping - handler will wrap it
	return map[string]interface{}{
		"hari":   hariComp,
		"minggu": mingguComp,
		"bulan":  bulanComp,
	}, nil
}

// calculateCategoryComposition calculates percentage composition by category for a donut chart
func (s *DashboardService) calculateCategoryComposition(start, end time.Time) models.DashboardCompositionPeriod {

	log.Printf("calculateCategoryComposition: Mencari data dari %s hingga %s", start.Format(time.RFC3339), end.Format(time.RFC3339))

	transactions, err := s.transaksiRepo.GetByDateRange(start, end)
	if err != nil {
		return models.DashboardCompositionPeriod{Labels: []string{}, Data: []float64{}}
	}

	log.Printf("calculateCategoryComposition: Menemukan %d transaksi dalam periode tersebut.", len(transactions))
	if len(transactions) == 0 {
		log.Println("calculateCategoryComposition: Tidak ada transaksi, mengembalikan data kosong.")
		return models.DashboardCompositionPeriod{Labels: []string{}, Data: []float64{}}
	}

	categoryTotals := make(map[string]float64)
	var grandTotal float64

	for _, t := range transactions {
		details, err := s.transaksiRepo.GetByID(t.ID)
		if err != nil || details == nil {
			continue
		}

		for _, d := range details.Items {
			if d.ProdukID != nil {
				produk, err := s.produkRepo.GetByID(*d.ProdukID)
				if err != nil {
					continue
				}
				// --- TAMBAHKAN BERSIHAN SPASI ---
				cleanCategory := strings.TrimSpace(produk.Kategori)
				categoryTotals[cleanCategory] += float64(d.Subtotal)
				grandTotal += float64(d.Subtotal)
			}
		}
	}

	// Sort categories by total sales
	var sortedCategories []struct {
		Name  string
		Total float64
	}
	for name, total := range categoryTotals {
		sortedCategories = append(sortedCategories, struct {
			Name  string
			Total float64
		}{Name: name, Total: total})
	}
	// Using simple bubble sort for now, can be replaced with sort.Slice for better performance
	for i := 0; i < len(sortedCategories)-1; i++ {
		for j := i + 1; j < len(sortedCategories); j++ {
			if sortedCategories[j].Total > sortedCategories[i].Total {
				sortedCategories[i], sortedCategories[j] = sortedCategories[j], sortedCategories[i]
			}
		}
	}

	maxTopCategories := 3 // Top N categories to display, others grouped into 'Lainnya'
	var finalLabels []string
	var finalData []float64

	otherTotal := float64(0)
	for i, cat := range sortedCategories {
		if i < maxTopCategories {
			finalLabels = append(finalLabels, cat.Name)
			finalData = append(finalData, cat.Total)
		} else {
			otherTotal += cat.Total
		}
	}

	if otherTotal > 0 || (len(sortedCategories) > maxTopCategories && maxTopCategories > 0) {
		finalLabels = append(finalLabels, "Lainnya")
		finalData = append(finalData, otherTotal)
	}

	// Calculate percentages
	if grandTotal == 0 {
		if len(finalLabels) == 0 {
			return models.DashboardCompositionPeriod{Labels: []string{}, Data: []float64{}}
		}
		equalShare := 100.0 / float64(len(finalLabels))
		percentageData := make([]float64, len(finalLabels))
		for i := range percentageData {
			percentageData[i] = equalShare
		}
		return models.DashboardCompositionPeriod{Labels: finalLabels, Data: percentageData}
	}

	for i := range finalData {
		finalData[i] = (finalData[i] / grandTotal) * 100
	}

	result := models.DashboardCompositionPeriod{
		Labels: finalLabels,
		Data:   finalData,
	}
	return result
}

func (s *DashboardService) GetCategoryChartData() (map[string]interface{}, error) {
	now := time.Now()

	// HARI: Last 7 days daily data
	hariPeriod := s.calculateCategoryTrends(now, 7, "daily")

	// MINGGU: Last 7 weeks weekly data
	mingguPeriod := s.calculateCategoryTrends(now, 7, "weekly")

	// BULAN: Last 7 months monthly data
	bulanPeriod := s.calculateCategoryTrends(now, 7, "monthly")

	// Return data without wrapping - handler will wrap it
	return map[string]interface{}{
		"hari":   hariPeriod,
		"minggu": mingguPeriod,
		"bulan":  bulanPeriod,
	}, nil
}

// calculateCategoryTrends calculates category sales trends
func (s *DashboardService) calculateCategoryTrends(endTime time.Time, periods int, periodType string) models.DashboardCategoryPeriod {

	var periodLabels []string

	switch periodType {
	case "daily":
		periodLabels = []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}
	case "weekly":
		// For weekly, labels could be "Minggu 1", "Minggu 2", etc. or just dates
		for i := 0; i < periods; i++ {
			date := endTime.AddDate(0, 0, -i*7)
			periodLabels = append([]string{fmt.Sprintf("%d %s", date.Day(), date.Format("Jan"))}, periodLabels...)
		}
	case "monthly":
		for i := 0; i < periods; i++ {
			date := endTime.AddDate(0, -i, 0)
			periodLabels = append([]string{date.Format("Jan")}, periodLabels...)
		}
	}

	// Reverse daily labels to be chronological
	if periodType == "daily" {
		for i, j := 0, len(periodLabels)-1; i < j; i, j = i+1, j-1 {
			periodLabels[i], periodLabels[j] = periodLabels[j], periodLabels[i]
		}
	}

	// Step 1: Get all transactions for the entire period to determine top categories
	var overallStart, overallEnd time.Time

	switch periodType {
	case "daily":
		overallStart = time.Date(endTime.Year(), endTime.Month(), endTime.Day(), 0, 0, 0, 0, endTime.Location()).AddDate(0, 0, -(periods - 1))
		overallEnd = endTime
	case "weekly":
		overallEnd = endTime
		overallStart = overallEnd.AddDate(0, 0, -periods*7)
	case "monthly":
		overallEnd = endTime
		overallStart = overallEnd.AddDate(0, -periods, 0)
	}

	log.Printf("calculateCategoryTrends (%s): Mencari data dari %s hingga %s", periodType, overallStart.Format(time.RFC3339), overallEnd.Format(time.RFC3339))

	// Fetch all transactions in the overall range
	overallTransactions, err := s.transaksiRepo.GetByDateRange(overallStart, overallEnd)
	if err != nil {
		return models.DashboardCategoryPeriod{Labels: periodLabels, Datasets: []models.CategoryChartDataset{}}
	}

	log.Printf("calculateCategoryTrends (%s): Menemukan %d transaksi keseluruhan.", periodType, len(overallTransactions))
	if len(overallTransactions) == 0 {
		log.Printf("calculateCategoryTrends (%s): Tidak ada transaksi keseluruhan, mengembalikan data kosong.", periodType)
		return models.DashboardCategoryPeriod{Labels: periodLabels, Datasets: []models.CategoryChartDataset{}}
	}

	// Step 2: Identify top N categories based on overall sales
	categoryOverallTotals := make(map[string]float64)

	for _, t := range overallTransactions {
		details, err := s.transaksiRepo.GetByID(t.ID)
		if err != nil || details == nil {
			continue
		}

		for _, d := range details.Items {
			if d.ProdukID != nil {
				produk, err := s.produkRepo.GetByID(*d.ProdukID)
				if err != nil {
					continue
				}
				categoryOverallTotals[produk.Kategori] += float64(d.Subtotal)
			}
		}
	}

	// Sort categories by total sales
	var sortedCategories []struct {
		Name  string
		Total float64
	}
	for name, total := range categoryOverallTotals {
		sortedCategories = append(sortedCategories, struct {
			Name  string
			Total float64
		}{Name: name, Total: total})
	}

	// Simple bubble sort (can be replaced with sort.Slice for better performance)
	for i := 0; i < len(sortedCategories)-1; i++ {
		for j := i + 1; j < len(sortedCategories); j++ {
			if sortedCategories[j].Total > sortedCategories[i].Total {
				sortedCategories[i], sortedCategories[j] = sortedCategories[j], sortedCategories[i]
			}
		}
	}

	maxTopCategories := 3 // Or any number you prefer for top categories
	var topCategoryNames []string
	categoryDatasets := make(map[string][]float64)

	for i, cat := range sortedCategories {
		if i < maxTopCategories {
			topCategoryNames = append(topCategoryNames, cat.Name)
			categoryDatasets[cat.Name] = make([]float64, periods)
		} else {
			// Initialize "Lainnya" if it hasn't been yet
			if _, ok := categoryDatasets["Lainnya"]; !ok {
				categoryDatasets["Lainnya"] = make([]float64, periods)
			}
		}
	}

	if len(sortedCategories) > maxTopCategories {
		topCategoryNames = append(topCategoryNames, "Lainnya")
	}

	// Step 3: Populate datasets for each sub-period
	for i := periods - 1; i >= 0; i-- {
		var periodStart, periodEnd time.Time

		switch periodType {
		case "daily":
			date := endTime.AddDate(0, 0, -i)
			periodStart = time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
			periodEnd = periodStart.Add(24 * time.Hour)

		case "weekly":
			periodEnd = endTime.AddDate(0, 0, -i*7)
			periodStart = periodEnd.AddDate(0, 0, -7)

		case "monthly":
			periodEnd = endTime.AddDate(0, -i, 0)
			periodStart = periodEnd.AddDate(0, -1, 0)
		}

		transactions, err := s.transaksiRepo.GetByDateRange(periodStart, periodEnd)
		if err != nil {
			continue // Skip this period if error
		}

		currentPeriodCategoryTotals := make(map[string]float64)
		for _, t := range transactions {
			details, err := s.transaksiRepo.GetByID(t.ID)
			if err != nil || details == nil {
				continue
			}
			for _, d := range details.Items {
				if d.ProdukID != nil {
					produk, err := s.produkRepo.GetByID(*d.ProdukID)
					if err != nil {
						continue
					}
					currentPeriodCategoryTotals[produk.Kategori] += float64(d.Subtotal)
				}
			}
		}

		idx := periods - 1 - i // Calculate index for current period

		otherTotal := float64(0)
		for categoryName, total := range currentPeriodCategoryTotals {
			isTopCategory := false
			for _, topCat := range topCategoryNames {
				if categoryName == topCat && categoryName != "Lainnya" {
					isTopCategory = true
					break
				}
			}

			if isTopCategory {
				categoryDatasets[categoryName][idx] = total
			} else {
				otherTotal += total
			}
		}
		if _, ok := categoryDatasets["Lainnya"]; ok {
			categoryDatasets["Lainnya"][idx] = otherTotal
		}
	}

	// Convert map to slice of DashboardCategoryPeriod
	var datasets []models.CategoryChartDataset
	for _, catName := range topCategoryNames {
		if data, ok := categoryDatasets[catName]; ok {
			datasets = append(datasets, models.CategoryChartDataset{
				Label: catName,
				Data:  data,
			})
		}
	}

	finalResult := models.DashboardCategoryPeriod{
		Labels:   periodLabels,
		Datasets: datasets,
	}
	return finalResult
}
