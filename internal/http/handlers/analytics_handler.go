package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	services *container.ServiceContainer
}

func NewAnalyticsHandler(services *container.ServiceContainer) *AnalyticsHandler {
	return &AnalyticsHandler{services: services}
}

func (h *AnalyticsHandler) GetTopProducts(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	products, err := h.services.AnalyticsService.GetTopProducts(startDate, endDate, limit)
	if err != nil {
		response.InternalServerError(c, "Failed to get top products", err)
		return
	}
	response.Success(c, products, "Top products retrieved successfully")
}

func (h *AnalyticsHandler) GetPaymentMethodBreakdown(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	breakdown, err := h.services.AnalyticsService.GetPaymentMethodBreakdown(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get payment breakdown", err)
		return
	}
	response.Success(c, breakdown, "Payment breakdown retrieved successfully")
}

func (h *AnalyticsHandler) GetSalesTrend(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	trend, err := h.services.AnalyticsService.GetSalesTrend(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get sales trend", err)
		return
	}
	response.Success(c, trend, "Sales trend retrieved successfully")
}

func (h *AnalyticsHandler) GetCategoryBreakdown(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	breakdown, err := h.services.AnalyticsService.GetCategoryBreakdown(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get category breakdown", err)
		return
	}
	response.Success(c, breakdown, "Category breakdown retrieved successfully")
}

func (h *AnalyticsHandler) GetHourlySales(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	sales, err := h.services.AnalyticsService.GetHourlySales(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get hourly sales", err)
		return
	}
	response.Success(c, sales, "Hourly sales retrieved successfully")
}

func (h *AnalyticsHandler) GetSalesInsights(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	insights, err := h.services.AnalyticsService.GetSalesInsights(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get sales insights", err)
		return
	}
	response.Success(c, insights, "Sales insights retrieved successfully")
}
