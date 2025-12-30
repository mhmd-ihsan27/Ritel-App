package models

import "time"

// SalesSummaryResponse represents overall sales summary
type SalesSummaryResponse struct {
	TotalOmset         int     `json:"totalOmset"`
	TotalProfit        int     `json:"totalProfit"`
	TotalTransaksi     int     `json:"totalTransaksi"`
	TotalProdukTerjual int     `json:"totalProdukTerjual"`
	RataRataTransaksi  int     `json:"rataRataTransaksi"`
	TrendOmset         float64 `json:"trendOmset"`         // Percentage change
	TrendProfit        float64 `json:"trendProfit"`        // Percentage change
	TrendTransaksi     float64 `json:"trendTransaksi"`     // Percentage change
	TrendProdukTerjual float64 `json:"trendProdukTerjual"` // Percentage change
	TrendRataRata      float64 `json:"trendRataRata"`      // Percentage change
}

// MonthlySalesData represents monthly sales trend
type MonthlySalesData struct {
	Month      string `json:"month"`      // e.g. "Jan 2024"
	MonthIndex int    `json:"monthIndex"` // 1-12
	Year       int    `json:"year"`
	Omset      int    `json:"omset"`
	Profit     int    `json:"profit"` // Total profit for the month
	HPP        int    `json:"hpp"`    // Total HPP for the month
	Transaksi  int    `json:"transaksi"`
	Diskon     int    `json:"diskon"` // Total discount for the month
	Loss       int    `json:"loss"`   // Total loss for the month
}

// HourlySalesData represents sales performance by hour
type HourlySalesData struct {
	Hour      int `json:"hour"` // 0-23
	Omset     int `json:"omset"`
	Transaksi int `json:"transaksi"`
}

// TopProductData represents top selling products
type TopProductData struct {
	Rank         int     `json:"rank"`
	NamaProduk   string  `json:"namaProduk"`
	Kategori     string  `json:"kategori"`
	TotalTerjual int     `json:"totalTerjual"`
	TotalOmset   int     `json:"totalOmset"`
	Persentase   float64 `json:"persentase"` // Percentage of total sales
}

// DiscountAnalysis represents discount impact analysis
type DiscountAnalysis struct {
	TotalDiskon          int     `json:"totalDiskon"`
	TotalTransaksiDiskon int     `json:"totalTransaksiDiskon"`
	PersentaseTransaksi  float64 `json:"persentaseTransaksi"` // % transactions with discount
	RataRataDiskon       int     `json:"rataRataDiskon"`
	DiskonTerbesar       int     `json:"diskonTerbesar"`
	OmsetDenganDiskon    int     `json:"omsetDenganDiskon"`
	OmsetTanpaDiskon     int     `json:"omsetTanpaDiskon"`
}

// DiscountTypeBreakdown represents breakdown by discount type (promo/manual)
type DiscountTypeBreakdown struct {
	Type        string  `json:"type"` // "promo" or "manual"
	TotalDiskon int     `json:"totalDiskon"`
	Jumlah      int     `json:"jumlah"`     // Count of transactions
	Persentase  float64 `json:"persentase"` // Percentage of total discount
}

// PaymentMethodBreakdown represents breakdown by payment method
type PaymentMethodBreakdown struct {
	Method     string  `json:"method"` // "tunai", "qris", "debit", "kredit"
	Jumlah     int     `json:"jumlah"` // Count of transactions
	TotalOmset int     `json:"totalOmset"`
	Persentase float64 `json:"persentase"` // Percentage of total transactions
}

// LossBreakdownItem represents loss breakdown by type
type LossBreakdownItem struct {
	Type       string  `json:"type"`       // "expired", "damaged", "lost", "other"
	Label      string  `json:"label"`      // Display label: "Barang Kadaluarsa", "Barang Rusak", etc
	TotalLoss  int     `json:"totalLoss"`  // Total loss value in rupiah
	Count      int     `json:"count"`      // Number of incidents
	Persentase float64 `json:"persentase"` // Percentage of total loss
}

// LossAnalysisData represents comprehensive loss analysis
type LossAnalysisData struct {
	TotalLoss     int                  `json:"totalLoss"`     // Total kerugian dalam rupiah
	LossBreakdown []*LossBreakdownItem `json:"lossBreakdown"` // Breakdown by type
	Labels        []string             `json:"labels"`        // For chart labels
	Data          []float64            `json:"data"`          // For chart data (percentages)
	Colors        []string             `json:"colors"`        // For chart colors
}

// ComprehensiveSalesReport represents complete sales report
type ComprehensiveSalesReport struct {
	Summary                *SalesSummaryResponse                    `json:"summary"`
	SalesTrendData         map[string]SalesReportPeriodData         `json:"salesTrendData"`
	DiscountTrendData      map[string]SalesReportDiscountPeriodData `json:"discountTrendData"`
	MonthlySales           []*MonthlySalesData                      `json:"monthlySales"` // Keep for detail table
	HourlySales            []*HourlySalesData                       `json:"hourlySales"`
	HourlySalesTrendData   map[string]SalesReportPeriodData         `json:"hourlySalesTrendData"` // New field for dynamic hourly trends
	TopProducts            []*TopProductData                        `json:"topProducts"`
	DiscountAnalysis       *DiscountAnalysis                        `json:"discountAnalysis"`
	DiscountTypeBreakdown  []*DiscountTypeBreakdown                 `json:"discountTypeBreakdown"`
	PaymentMethodBreakdown []*PaymentMethodBreakdown                `json:"paymentMethodBreakdown"`
	LossAnalysis           *LossAnalysisData                        `json:"lossAnalysis"`
	StartDate              time.Time                                `json:"startDate"`
	EndDate                time.Time                                `json:"endDate"`
	GeneratedAt            time.Time                                `json:"generatedAt"`
}

// SalesReportPeriodData represents sales data for a specific period (hari/minggu/bulan)
type SalesReportPeriodData struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

// SalesReportDiscountPeriodData represents discount trend data for a specific period
type SalesReportDiscountPeriodData struct {
	Labels            []string  `json:"labels"`
	SalesWithDiscount []float64 `json:"salesWithDiscount"`
	DiscountValue     []float64 `json:"discountValue"`
}

// SalesReportFilter represents filter options for sales report
type SalesReportFilter struct {
	StartDate string `json:"startDate"` // Format: YYYY-MM-DD
	EndDate   string `json:"endDate"`   // Format: YYYY-MM-DD
	Year      int    `json:"year"`      // Optional: for yearly reports
	Month     int    `json:"month"`     // Optional: for monthly reports (1-12)
}
