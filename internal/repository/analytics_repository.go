package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

// AnalyticsRepository handles database operations for analytics
type AnalyticsRepository struct {
	db *sql.DB
}

// NewAnalyticsRepository creates a new repository instance
func NewAnalyticsRepository() *AnalyticsRepository {
	return &AnalyticsRepository{
		db: database.DB,
	}
}

// GetTopProducts retrieves top selling products within date range
func (r *AnalyticsRepository) GetTopProducts(startDate, endDate string, limit int) ([]*models.TopProductsResponse, error) {
	if r.db == nil {
		return []*models.TopProductsResponse{}, nil
	}

	query := `
		SELECT
			ti.produk_id,
			ti.produk_sku,
			ti.produk_nama,
			COALESCE(ti.produk_kategori, 'Uncategorized') as category,
			SUM(ti.jumlah) as total_qty,
			SUM(ti.subtotal) as total_revenue,
			COUNT(DISTINCT ti.transaksi_id) as times_sold,
			AVG(ti.harga_satuan) as average_price
		FROM transaksi_item ti
		JOIN transaksi t ON ti.transaksi_id = t.id
		WHERE DATE(t.tanggal) BETWEEN DATE(?) AND DATE(?)
		  AND t.status IN ('selesai', 'partial_return')
		GROUP BY ti.produk_id, ti.produk_sku, ti.produk_nama, ti.produk_kategori
		ORDER BY total_qty DESC
		LIMIT ?
	`

	rows, err := r.db.Query(query, startDate, endDate, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get top products: %w", err)
	}
	defer rows.Close()

	var products []*models.TopProductsResponse
	for rows.Next() {
		var p models.TopProductsResponse
		err := rows.Scan(
			&p.ProductID,
			&p.ProductSKU,
			&p.ProductName,
			&p.Category,
			&p.TotalQty,
			&p.TotalRevenue,
			&p.TimesSold,
			&p.AveragePrice,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, &p)
	}

	if products == nil {
		return []*models.TopProductsResponse{}, nil
	}

	return products, nil
}

// GetPaymentMethodBreakdown retrieves payment method statistics
func (r *AnalyticsRepository) GetPaymentMethodBreakdown(startDate, endDate string) ([]*models.PaymentBreakdownResponse, error) {
	if r.db == nil {
		return []*models.PaymentBreakdownResponse{}, nil
	}

	query := `
		SELECT
			p.metode as method,
			SUM(p.jumlah) as total_amount,
			COUNT(*) as count,
			AVG(p.jumlah) as average_value
		FROM pembayaran p
		JOIN transaksi t ON p.transaksi_id = t.id
		WHERE DATE(t.tanggal) BETWEEN DATE(?) AND DATE(?)
		  AND t.status IN ('selesai', 'partial_return')
		GROUP BY p.metode
		ORDER BY total_amount DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment breakdown: %w", err)
	}
	defer rows.Close()

	// First pass: collect data and calculate total
	var payments []*models.PaymentBreakdownResponse
	var totalAmount int
	for rows.Next() {
		var p models.PaymentBreakdownResponse
		err := rows.Scan(
			&p.Method,
			&p.TotalAmount,
			&p.Count,
			&p.AverageValue,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan payment: %w", err)
		}
		totalAmount += p.TotalAmount
		payments = append(payments, &p)
	}

	// Second pass: calculate percentages
	for _, p := range payments {
		if totalAmount > 0 {
			p.Percentage = float64(p.TotalAmount) / float64(totalAmount) * 100
		}
	}

	if payments == nil {
		return []*models.PaymentBreakdownResponse{}, nil
	}

	return payments, nil
}

// GetSalesTrend retrieves sales trend grouped by date
func (r *AnalyticsRepository) GetSalesTrend(startDate, endDate string) ([]*models.SalesTrendResponse, error) {
	if r.db == nil {
		return []*models.SalesTrendResponse{}, nil
	}

	query := `
		SELECT
			DATE(t.tanggal) as date,
			SUM(t.total) as total_sales,
			COUNT(t.id) as trans_count,
			AVG(t.total) as average_trans,
			COALESCE(SUM(
				(SELECT SUM(jumlah) FROM transaksi_item WHERE transaksi_id = t.id)
			), 0) as total_items
		FROM transaksi t
		WHERE DATE(t.tanggal) BETWEEN DATE(?) AND DATE(?)
		  AND t.status IN ('selesai', 'partial_return')
		GROUP BY DATE(t.tanggal)
		ORDER BY date ASC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get sales trend: %w", err)
	}
	defer rows.Close()

	var trends []*models.SalesTrendResponse
	for rows.Next() {
		var t models.SalesTrendResponse
		err := rows.Scan(
			&t.Date,
			&t.TotalSales,
			&t.TransCount,
			&t.AverageTrans,
			&t.TotalItems,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan trend: %w", err)
		}
		trends = append(trends, &t)
	}

	if trends == nil {
		return []*models.SalesTrendResponse{}, nil
	}

	return trends, nil
}

// GetCategoryBreakdown retrieves sales by category
func (r *AnalyticsRepository) GetCategoryBreakdown(startDate, endDate string) ([]*models.CategoryBreakdownResponse, error) {
	if r.db == nil {
		return []*models.CategoryBreakdownResponse{}, nil
	}

	query := `
		SELECT
			COALESCE(ti.produk_kategori, 'Uncategorized') as category,
			SUM(ti.jumlah) as total_qty,
			SUM(ti.subtotal) as total_revenue,
			COUNT(DISTINCT ti.transaksi_id) as trans_count
		FROM transaksi_item ti
		JOIN transaksi t ON ti.transaksi_id = t.id
		WHERE DATE(t.tanggal) BETWEEN DATE(?) AND DATE(?)
		  AND t.status IN ('selesai', 'partial_return')
		GROUP BY ti.produk_kategori
		ORDER BY total_revenue DESC
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get category breakdown: %w", err)
	}
	defer rows.Close()

	// First pass: collect data and calculate total
	var categories []*models.CategoryBreakdownResponse
	var totalRevenue int
	for rows.Next() {
		var c models.CategoryBreakdownResponse
		err := rows.Scan(
			&c.Category,
			&c.TotalQty,
			&c.TotalRevenue,
			&c.TransCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		totalRevenue += c.TotalRevenue
		categories = append(categories, &c)
	}

	// Second pass: calculate percentages
	for _, c := range categories {
		if totalRevenue > 0 {
			c.Percentage = float64(c.TotalRevenue) / float64(totalRevenue) * 100
		}
	}

	if categories == nil {
		return []*models.CategoryBreakdownResponse{}, nil
	}

	return categories, nil
}

// GetHourlySales retrieves sales grouped by hour and day of week
func (r *AnalyticsRepository) GetHourlySales(startDate, endDate string) ([]*models.HourlySalesResponse, error) {
	if r.db == nil {
		return []*models.HourlySalesResponse{}, nil
	}

	query := `
		SELECT
			CAST(strftime('%H', tanggal) AS INTEGER) as hour,
			CAST(strftime('%w', tanggal) AS INTEGER) as day_of_week,
			COUNT(id) as trans_count,
			SUM(total) as total_sales
		FROM transaksi
		WHERE DATE(tanggal) BETWEEN DATE(?) AND DATE(?)
		  AND status IN ('selesai', 'partial_return')
		GROUP BY hour, day_of_week
		ORDER BY hour, day_of_week
	`

	rows, err := r.db.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get hourly sales: %w", err)
	}
	defer rows.Close()

	var hourlySales []*models.HourlySalesResponse
	for rows.Next() {
		var h models.HourlySalesResponse
		err := rows.Scan(
			&h.Hour,
			&h.DayOfWeek,
			&h.TransCount,
			&h.TotalSales,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan hourly sales: %w", err)
		}
		hourlySales = append(hourlySales, &h)
	}

	if hourlySales == nil {
		return []*models.HourlySalesResponse{}, nil
	}

	return hourlySales, nil
}

// GetTotalDiscount retrieves total discount within date range
func (r *AnalyticsRepository) GetTotalDiscount(startDate, endDate string) (int, error) {
	if r.db == nil {
		return 0, nil
	}

	query := `
		SELECT COALESCE(SUM(diskon), 0)
		FROM transaksi
		WHERE DATE(tanggal) BETWEEN DATE(?) AND DATE(?)
		  AND status IN ('selesai', 'partial_return')
	`

	var totalDiscount int
	err := r.db.QueryRow(query, startDate, endDate).Scan(&totalDiscount)
	if err != nil {
		return 0, fmt.Errorf("failed to get total discount: %w", err)
	}

	return totalDiscount, nil
}

// GetTotalRefund retrieves total refund within date range
func (r *AnalyticsRepository) GetTotalRefund(startDate, endDate string) (int, error) {
	if r.db == nil {
		return 0, nil
	}

	query := `
		SELECT COALESCE(SUM(refund_amount), 0)
		FROM returns
		WHERE DATE(return_date) BETWEEN DATE(?) AND DATE(?)
		  AND refund_status = 'completed'
	`

	var totalRefund int
	err := r.db.QueryRow(query, startDate, endDate).Scan(&totalRefund)
	if err != nil {
		return 0, fmt.Errorf("failed to get total refund: %w", err)
	}

	return totalRefund, nil
}
