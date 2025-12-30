package handlers

import (
	"time"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

type SalesReportHandler struct {
	services *container.ServiceContainer
}

func NewSalesReportHandler(services *container.ServiceContainer) *SalesReportHandler {
	return &SalesReportHandler{services: services}
}

func (h *SalesReportHandler) GetComprehensive(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	// Parse dates in local timezone to match trend calculation functions
	startDate, err := time.ParseInLocation("2006-01-02", startDateStr, time.Local)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.ParseInLocation("2006-01-02", endDateStr, time.Local)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}
	// Adjust endDate to include the entire last day (end of day)
	endDate = endDate.Add(24*time.Hour - time.Nanosecond)

	report, err := h.services.SalesReportService.GetComprehensiveSalesReport(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get comprehensive sales report", err)
		return
	}
	response.Success(c, report, "Comprehensive sales report retrieved successfully")
}
