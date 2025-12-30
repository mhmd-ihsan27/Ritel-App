package service

import (
	"fmt"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

// AnalyticsService handles business logic for analytics
type AnalyticsService struct {
	analyticsRepo *repository.AnalyticsRepository
	transaksiRepo *repository.TransaksiRepository
}

// NewAnalyticsService creates a new instance
func NewAnalyticsService() *AnalyticsService {
	return &AnalyticsService{
		analyticsRepo: repository.NewAnalyticsRepository(),
		transaksiRepo: repository.NewTransaksiRepository(),
	}
}

// GetTopProducts retrieves top selling products
func (s *AnalyticsService) GetTopProducts(startDate, endDate string, limit int) ([]*models.TopProductsResponse, error) {
	if limit <= 0 {
		limit = 10
	}
	return s.analyticsRepo.GetTopProducts(startDate, endDate, limit)
}

// GetPaymentMethodBreakdown retrieves payment method statistics
func (s *AnalyticsService) GetPaymentMethodBreakdown(startDate, endDate string) ([]*models.PaymentBreakdownResponse, error) {
	return s.analyticsRepo.GetPaymentMethodBreakdown(startDate, endDate)
}

// GetSalesTrend retrieves sales trend over time
func (s *AnalyticsService) GetSalesTrend(startDate, endDate string) ([]*models.SalesTrendResponse, error) {
	return s.analyticsRepo.GetSalesTrend(startDate, endDate)
}

// GetCategoryBreakdown retrieves sales by category
func (s *AnalyticsService) GetCategoryBreakdown(startDate, endDate string) ([]*models.CategoryBreakdownResponse, error) {
	return s.analyticsRepo.GetCategoryBreakdown(startDate, endDate)
}

// GetHourlySales retrieves sales grouped by hour and day
func (s *AnalyticsService) GetHourlySales(startDate, endDate string) ([]*models.HourlySalesResponse, error) {
	return s.analyticsRepo.GetHourlySales(startDate, endDate)
}

// GetSalesInsights retrieves comprehensive sales insights
func (s *AnalyticsService) GetSalesInsights(startDate, endDate string) (*models.SalesInsightsResponse, error) {
	insights := &models.SalesInsightsResponse{}

	// Get top products
	topProducts, err := s.analyticsRepo.GetTopProducts(startDate, endDate, 10)
	if err != nil {
		return nil, fmt.Errorf("failed to get top products: %w", err)
	}
	insights.TopProducts = topProducts

	// Get payment breakdown
	paymentBreakdown, err := s.analyticsRepo.GetPaymentMethodBreakdown(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get payment breakdown: %w", err)
	}
	insights.PaymentBreakdown = paymentBreakdown

	// Get category breakdown
	categoryBreakdown, err := s.analyticsRepo.GetCategoryBreakdown(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get category breakdown: %w", err)
	}
	insights.CategoryBreakdown = categoryBreakdown

	// Get sales trend
	salesTrend, err := s.analyticsRepo.GetSalesTrend(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get sales trend: %w", err)
	}
	insights.SalesTrend = salesTrend

	// Get hourly sales for peak detection
	hourlySales, err := s.analyticsRepo.GetHourlySales(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get hourly sales: %w", err)
	}

	// Find peak hour and day
	maxTrans := 0
	for _, h := range hourlySales {
		if h.TransCount > maxTrans {
			maxTrans = h.TransCount
			insights.PeakHour = h.Hour
			insights.PeakDay = h.DayOfWeek
		}
	}

	// Get total discount
	totalDiscount, err := s.analyticsRepo.GetTotalDiscount(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get total discount: %w", err)
	}
	insights.TotalDiscount = totalDiscount

	// Get total refund
	totalRefund, err := s.analyticsRepo.GetTotalRefund(startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get total refund: %w", err)
	}
	insights.TotalRefund = totalRefund

	// Calculate total revenue and transactions
	totalRevenue := 0
	totalTransactions := 0
	for _, trend := range salesTrend {
		totalRevenue += trend.TotalSales
		totalTransactions += trend.TransCount
	}
	insights.TotalRevenue = totalRevenue
	insights.TotalTransactions = totalTransactions

	// Calculate average transaction
	if totalTransactions > 0 {
		insights.AverageTransaction = totalRevenue / totalTransactions
	}

	return insights, nil
}
