package handlers

import (
	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	services *container.ServiceContainer
}

func NewDashboardHandler(services *container.ServiceContainer) *DashboardHandler {
	return &DashboardHandler{services: services}
}

func (h *DashboardHandler) GetDashboardData(c *gin.Context) {
	data, err := h.services.DashboardService.GetDashboardData()
	if err != nil {
		response.InternalServerError(c, "Failed to get dashboard data", err)
		return
	}
	response.Success(c, data, "Dashboard data retrieved successfully")
}

func (h *DashboardHandler) GetSalesChart(c *gin.Context) {
	data, err := h.services.DashboardService.GetSalesChartData()
	if err != nil {
		response.InternalServerError(c, "Failed to get sales chart", err)
		return
	}
	// Wrap response to match Wails structure
	wrappedResponse := &models.DashboardSalesChartResponse{
		SalesData: *data,
	}
	response.Success(c, wrappedResponse, "Sales chart retrieved successfully")
}

func (h *DashboardHandler) GetCompositionChart(c *gin.Context) {
	data, err := h.services.DashboardService.GetCompositionChartData()
	if err != nil {
		response.InternalServerError(c, "Failed to get composition chart", err)
		return
	}
	// Wrap response to match Wails structure
	wrappedResponse := map[string]interface{}{
		"compositionData": data,
	}
	response.Success(c, wrappedResponse, "Composition chart retrieved successfully")
}

func (h *DashboardHandler) GetCategoryChart(c *gin.Context) {
	data, err := h.services.DashboardService.GetCategoryChartData()
	if err != nil {
		response.InternalServerError(c, "Failed to get category chart", err)
		return
	}
	// Wrap response to match Wails structure
	wrappedResponse := map[string]interface{}{
		"categoryData": data,
	}
	response.Success(c, wrappedResponse, "Category chart retrieved successfully")
}

func (h *DashboardHandler) GetSalesByPeriod(c *gin.Context) {
	_ = c.Query("filter_type")
	// This method might not exist in service, removing for now
	response.Success(c, nil, "Method not implemented yet")
}
