package models

import "time"

// ShiftStats represents the statistics for a specific shift
type ShiftStats struct {
	TotalPenjualan   float64 `json:"totalPenjualan"`
	TotalProfit      float64 `json:"totalProfit"`
	TotalTransaksi   int     `json:"totalTransaksi"`
	TotalItemTerjual int     `json:"totalItemTerjual"`
	TotalRefund      float64 `json:"totalRefund"`
	TotalDiskon      float64 `json:"totalDiskon"`
	StaffCount       int     `json:"staffCount"`

	// Trends (percentage change from previous day)
	TrendPenjualan float64 `json:"trendPenjualan"`
	TrendProfit    float64 `json:"trendProfit"`
	TrendTransaksi float64 `json:"trendTransaksi"`
	TrendProduk    float64 `json:"trendProduk"`
	TrendRefund    float64 `json:"trendRefund"`
	TrendDiskon    float64 `json:"trendDiskon"`
}

// ShiftReportsResponse holds stats for both shifts
type ShiftReportsResponse struct {
	Shift1 *ShiftStats `json:"shift1"`
	Shift2 *ShiftStats `json:"shift2"`
}

// ShiftCashier represents a staff member active in a shift
type ShiftCashier struct {
	ID   int64  `json:"id"`
	Nama string `json:"nama"`
}

// ShiftDetailResponse contains detailed breakdown for a specific shift and date
type ShiftDetailResponse struct {
	Transactions     []ShiftTransaction `json:"transactions"`
	TopProducts      []ShiftProduct     `json:"topProducts"`
	HourlyData       []ShiftHourlyData  `json:"hourlyData"`
	StaffPerformance []ShiftStaffPerf   `json:"staffPerformance"`
}

// ShiftTransaction represents a simplified transaction view for the report
type ShiftTransaction struct {
	ID             int64     `json:"id"`
	NomorTransaksi string    `json:"nomorTransaksi"`
	Time           time.Time `json:"time"`
	Cashier        string    `json:"cashier"`
	Products       string    `json:"products"`
	Total          float64   `json:"total"`
	ItemCount      int       `json:"itemCount"`
}

// ShiftProduct represents a top-selling product in the shift
type ShiftProduct struct {
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Quantity int     `json:"quantity"`
	Revenue  float64 `json:"revenue"`
}

// ShiftHourlyData represents revenue and transaction count per hour
type ShiftHourlyData struct {
	Hour         string  `json:"hour"` // "06", "07", etc.
	Revenue      float64 `json:"revenue"`
	Transactions int     `json:"transactions"`
}

// ShiftStaffPerf represents staff performance within the shift
type ShiftStaffPerf struct {
	Name               string  `json:"name"`
	Transactions       int     `json:"transactions"`
	Revenue            float64 `json:"revenue"`
	ProductsSold       int     `json:"productsSold"`
	AverageTransaction float64 `json:"averageTransaction"`
}
