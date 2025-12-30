package handlers

import (
	"strconv"
	"time"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

type StaffReportHandler struct {
	services *container.ServiceContainer
}

func NewStaffReportHandler(services *container.ServiceContainer) *StaffReportHandler {
	return &StaffReportHandler{services: services}
}

func (h *StaffReportHandler) GetStaffReport(c *gin.Context) {
	staffID, _ := strconv.Atoi(c.Param("id"))
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}

	report, err := h.services.StaffReportService.GetStaffReport(staffID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get staff report", err)
		return
	}
	response.Success(c, report, "Staff report retrieved successfully")
}

func (h *StaffReportHandler) GetStaffReportDetail(c *gin.Context) {
	staffID, _ := strconv.Atoi(c.Param("id"))
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}

	report, err := h.services.StaffReportService.GetStaffReportDetail(staffID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get staff report detail", err)
		return
	}
	response.Success(c, report, "Staff report detail retrieved successfully")
}

func (h *StaffReportHandler) GetAllStaffReports(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}

	reports, err := h.services.StaffReportService.GetAllStaffReports(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get all staff reports", err)
		return
	}
	response.Success(c, reports, "All staff reports retrieved successfully")
}

func (h *StaffReportHandler) GetAllWithTrend(c *gin.Context) {
	reports, err := h.services.StaffReportService.GetAllStaffReportsWithTrend()
	if err != nil {
		response.InternalServerError(c, "Failed to get staff reports with trend", err)
		return
	}
	response.Success(c, reports, "Staff reports with trend retrieved successfully")
}

func (h *StaffReportHandler) GetWithTrend(c *gin.Context) {
	staffID, _ := strconv.Atoi(c.Param("id"))
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}

	report, err := h.services.StaffReportService.GetStaffReportWithTrend(staffID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get staff report with trend", err)
		return
	}
	response.Success(c, report, "Staff report with trend retrieved successfully")
}

func (h *StaffReportHandler) GetHistoricalData(c *gin.Context) {
	staffID, _ := strconv.Atoi(c.Param("id"))

	data, err := h.services.StaffReportService.GetStaffHistoricalData(staffID)
	if err != nil {
		response.InternalServerError(c, "Failed to get historical data", err)
		return
	}
	response.Success(c, data, "Historical data retrieved successfully")
}

func (h *StaffReportHandler) GetComprehensive(c *gin.Context) {
	report, err := h.services.StaffReportService.GetComprehensiveReport()
	if err != nil {
		response.InternalServerError(c, "Failed to get comprehensive report", err)
		return
	}
	response.Success(c, report, "Comprehensive report retrieved successfully")
}

func (h *StaffReportHandler) GetShiftProductivity(c *gin.Context) {
	data, err := h.services.StaffReportService.GetShiftProductivity()
	if err != nil {
		response.InternalServerError(c, "Failed to get shift productivity", err)
		return
	}
	response.Success(c, data, "Shift productivity retrieved successfully")
}

func (h *StaffReportHandler) GetStaffShiftData(c *gin.Context) {
	staffID, _ := strconv.Atoi(c.Param("id"))
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}

	data, err := h.services.StaffReportService.GetStaffShiftData(staffID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get staff shift data", err)
		return
	}
	response.Success(c, data, "Staff shift data retrieved successfully")
}

func (h *StaffReportHandler) GetMonthlyTrend(c *gin.Context) {
	data, err := h.services.StaffReportService.GetMonthlyComparisonTrend()
	if err != nil {
		response.InternalServerError(c, "Failed to get monthly trend", err)
		return
	}
	response.Success(c, data, "Monthly trend retrieved successfully")
}

func (h *StaffReportHandler) GetWithMonthlyTrend(c *gin.Context) {
	staffID, _ := strconv.Atoi(c.Param("id"))
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid start date format", err)
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		response.BadRequest(c, "Invalid end date format", err)
		return
	}

	report, err := h.services.StaffReportService.GetStaffReportWithMonthlyTrend(staffID, startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get staff report with monthly trend", err)
		return
	}
	response.Success(c, report, "Staff report with monthly trend retrieved successfully")
}
