package models

import "time"

// DashboardStatistikBulanan represents monthly statistics
type DashboardStatistikBulanan struct {
	TotalPendapatan  float64 `json:"totalPendapatan"`
	TotalTransaksi   int     `json:"totalTransaksi"`
	ProdukTerjual    int     `json:"produkTerjual"`
	KeuntunganBersih float64 `json:"keuntunganBersih"`
	VsBulanLalu      float64 `json:"vsBulanLalu"` // Percentage change
}

// DashboardNotifikasi represents notification items
type DashboardNotifikasi struct {
	ID       int    `json:"id"`
	Type     string `json:"type"` // low-stock, promo, new-product
	Title    string `json:"title"`
	Message  string `json:"message"`
	Priority string `json:"priority"` // high, medium, low
	Time     string `json:"time"`
}

// DashboardPerforma represents today's performance metrics
type DashboardPerforma struct {
	ID     int     `json:"id"`
	Title  string  `json:"title"`
	Value  float64 `json:"value"`
	Target float64 `json:"target"`
	Trend  float64 `json:"trend"`
	Icon   string  `json:"icon"`
	Color  string  `json:"color"`
}

// DashboardProdukTerlaris represents best-selling products
type DashboardProdukTerlaris struct {
	ID       int     `json:"id"`
	Nama     string  `json:"nama"`
	Kategori string  `json:"kategori"`
	Harga    float64 `json:"harga"`
	Terjual  int     `json:"terjual"`
	Satuan   string  `json:"satuan"`
	Color    string  `json:"color"`
}

// DashboardAktivitas represents recent activities
type DashboardAktivitas struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Time  string `json:"time"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

// DashboardAktivitasWithTime is a helper struct for sorting activities by time
type DashboardAktivitasWithTime struct {
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"createdAt"`
	Icon      string    `json:"icon"`
	Color     string    `json:"color"`
}

// DashboardSalesData represents sales trend data for different periods
type DashboardSalesData struct {
	Hari   DashboardPeriodData `json:"hari"`
	Minggu DashboardPeriodData `json:"minggu"`
	Bulan  DashboardPeriodData `json:"bulan"`
}

// DashboardPeriodData represents data for a specific period
type DashboardPeriodData struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

// DashboardCompositionData represents composition data for different periods
type DashboardCompositionData struct {
	Hari   DashboardCompositionPeriod `json:"hari"`
	Minggu DashboardCompositionPeriod `json:"minggu"`
	Bulan  DashboardCompositionPeriod `json:"bulan"`
}

// DashboardCompositionPeriod represents composition data for a specific period
type DashboardCompositionPeriod struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

// DashboardCategoryData represents category-wise sales data
type DashboardCategoryData struct {
	Hari   DashboardCategoryPeriod `json:"hari"`
	Minggu DashboardCategoryPeriod `json:"minggu"`
	Bulan  DashboardCategoryPeriod `json:"bulan"`
}

// DashboardCategoryPeriod represents category sales for a period
type DashboardCategoryPeriod struct {
	Labels   []string               `json:"labels"`
	Datasets []CategoryChartDataset `json:"datasets"`
}

// CategoryChartDataset represents a single dataset for the category chart
type CategoryChartDataset struct {
	Label string    `json:"label"`
	Data  []float64 `json:"data"`
}

// DashboardData is the complete dashboard response
type DashboardData struct {
	StatistikBulanan  DashboardStatistikBulanan `json:"statistikBulanan"`
	Notifikasi        []DashboardNotifikasi     `json:"notifikasi"`
	PerformaHariIni   []DashboardPerforma       `json:"performaHariIni"`
	ProdukTerlaris    []DashboardProdukTerlaris `json:"produkTerlaris"`
	AktivitasTerakhir []DashboardAktivitas      `json:"aktivitasTerakhir"`
}

// Chart data responses
type DashboardSalesChartResponse struct {
	SalesData DashboardSalesData `json:"salesData"`
}

type DashboardCompositionChartResponse struct {
	CompositionData DashboardCompositionData `json:"compositionData"`
}

type DashboardCategoryChartResponse struct {
	CategoryData DashboardCategoryData `json:"categoryData"`
}

// Di file service/dashboard.go Anda, tambahkan struct ini di bagian bawah

// Helper structs untuk memastikan format JSON benar
type CompositionChartResponse struct {
	CompositionData map[string]CompositionPeriod `json:"compositionData"`
}

type CompositionPeriod struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

type CategoryChartResponse struct {
	CategoryData map[string]CategoryPeriod `json:"categoryData"`
}

type CategoryPeriod struct {
	Labels   []string               `json:"labels"`
	Datasets []CategoryChartDataset `json:"datasets"`
}

 