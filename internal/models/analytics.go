package models

// TopProductsResponse represents top selling products analytics
type TopProductsResponse struct {
	ProductID    int    `json:"product_id"`
	ProductSKU   string `json:"product_sku"`
	ProductName  string `json:"product_name"`
	Category     string `json:"category"`
	TotalQty     int    `json:"total_qty"`
	TotalRevenue int    `json:"total_revenue"`
	TimesSold    int    `json:"times_sold"`
	AveragePrice int    `json:"average_price"`
}

// PaymentBreakdownResponse represents payment method breakdown
type PaymentBreakdownResponse struct {
	Method       string  `json:"method"`
	TotalAmount  int     `json:"total_amount"`
	Count        int     `json:"count"`
	Percentage   float64 `json:"percentage"`
	AverageValue int     `json:"average_value"`
}

// SalesTrendResponse represents sales trend over time
type SalesTrendResponse struct {
	Date         string `json:"date"`
	TotalSales   int    `json:"total_sales"`
	TransCount   int    `json:"trans_count"`
	AverageTrans int    `json:"average_trans"`
	TotalItems   int    `json:"total_items"`
}

// CategoryBreakdownResponse represents sales by category
type CategoryBreakdownResponse struct {
	Category     string  `json:"category"`
	TotalQty     int     `json:"total_qty"`
	TotalRevenue int     `json:"total_revenue"`
	TransCount   int     `json:"trans_count"`
	Percentage   float64 `json:"percentage"`
}

// HourlySalesResponse represents sales by hour
type HourlySalesResponse struct {
	Hour       int `json:"hour"`
	DayOfWeek  int `json:"day_of_week"`
	TransCount int `json:"trans_count"`
	TotalSales int `json:"total_sales"`
}

// SalesInsightsResponse represents comprehensive sales insights
type SalesInsightsResponse struct {
	TopProducts         []*TopProductsResponse         `json:"top_products"`
	PaymentBreakdown    []*PaymentBreakdownResponse    `json:"payment_breakdown"`
	CategoryBreakdown   []*CategoryBreakdownResponse   `json:"category_breakdown"`
	SalesTrend          []*SalesTrendResponse          `json:"sales_trend"`
	PeakHour            int                            `json:"peak_hour"`
	PeakDay             int                            `json:"peak_day"`
	TotalDiscount       int                            `json:"total_discount"`
	TotalRefund         int                            `json:"total_refund"`
	AverageTransaction  int                            `json:"average_transaction"`
	TotalTransactions   int                            `json:"total_transactions"`
	TotalRevenue        int                            `json:"total_revenue"`
}
