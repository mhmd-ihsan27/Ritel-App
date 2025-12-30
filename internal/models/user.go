package models

import "time"

// User represents a system user (admin or staff)
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Password     string    `json:"-"` // Never include in JSON responses
	NamaLengkap  string    `json:"namaLengkap"`
	Role         string    `json:"role"`   // "admin" or "staff"
	Status       string    `json:"status"` // "active" or "inactive"
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty"` // Soft delete
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents login result
type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	User    *User  `json:"user,omitempty"`
	Token   string `json:"token,omitempty"` // For session management
}

// CreateUserRequest represents request to create new user
type CreateUserRequest struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	NamaLengkap string `json:"namaLengkap"`
	Role        string `json:"role"` // "admin" or "staff"
}

// UpdateUserRequest represents request to update user
type UpdateUserRequest struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	Password    string `json:"password,omitempty"` // Optional - only if changing password
	NamaLengkap string `json:"namaLengkap"`
	Role        string `json:"role"`
	Status      string `json:"status"`
}

// ChangePasswordRequest represents request to change password
type ChangePasswordRequest struct {
	UserID      int    `json:"userId"`
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

// StaffReport represents staff performance report
type StaffReport struct {
	StaffID           int       `json:"staffId"`
	NamaStaff         string    `json:"namaStaff"`
	TotalTransaksi    int       `json:"totalTransaksi"`
	TotalPenjualan    int       `json:"totalPenjualan"`    // Total rupiah
	TotalProfit       int       `json:"totalProfit"`       // Total profit (penjualan - HPP)
	TotalItemTerjual  int       `json:"totalItemTerjual"`  // Total qty produk
	TotalRefund       int       `json:"totalRefund"`       // Total refund/retur (menggunakan harga beli)
	TotalReturnCount  int       `json:"totalReturnCount"`  // Total jumlah transaksi retur
	PeriodeMulai      time.Time `json:"periodeMulai"`
	PeriodeSelesai    time.Time `json:"periodeSelesai"`
}

// StaffReportDetail represents detailed staff report with transactions
type StaffReportDetail struct {
	Report      *StaffReport `json:"report"`
	Transaksi   []*Transaksi `json:"transaksi"`
}

// StaffReportDetailWithItems represents detailed staff report with transactions and item counts
type StaffReportDetailWithItems struct {
	Report           *StaffReport    `json:"report"`
	Transaksi        []*Transaksi    `json:"transaksi"`
	ItemCountsByDate map[string]int  `json:"itemCountsByDate"` // Date -> total items
}

// StaffDailyReport represents daily breakdown for a staff
type StaffDailyReport struct {
	Tanggal          time.Time `json:"tanggal"`
	TotalTransaksi   int       `json:"totalTransaksi"`
	TotalPenjualan   int       `json:"totalPenjualan"`
	TotalProfit      int       `json:"totalProfit"`
	TotalItemTerjual int       `json:"totalItemTerjual"`
}

// StaffReportWithTrend represents report with trend comparison
type StaffReportWithTrend struct {
	Current         *StaffReport `json:"current"`
	Previous        *StaffReport `json:"previous"`
	TrendPenjualan  string       `json:"trendPenjualan"`  // "naik", "turun", "tetap"
	TrendTransaksi  string       `json:"trendTransaksi"`
	PercentChange   float64      `json:"percentChange"`   // Percentage change in revenue
}

// StaffHistoricalData represents historical data for charts
type StaffHistoricalData struct {
	Daily   []*StaffDailyReport `json:"daily"`   // Last 7 days
	Weekly  []*StaffReport      `json:"weekly"`  // Last 4 weeks
	Monthly []*StaffReport      `json:"monthly"` // Last 6 months
}

// ComprehensiveStaffReport represents complete staff analytics
type ComprehensiveStaffReport struct {
	TotalPenjualan30Hari int    `json:"totalPenjualan30Hari"`
	TotalTransaksi30Hari int    `json:"totalTransaksi30Hari"`
	ProdukTerlaris       string `json:"produkTerlaris"`
	TrendVsPrevious      string `json:"trendVsPrevious"` // "naik", "turun", "tetap"
	PercentChange        float64 `json:"percentChange"`
	StaffReports         []*StaffReportWithTrend `json:"staffReports"`
}
