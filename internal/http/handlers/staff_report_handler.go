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
	staffID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
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
	staffID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
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
	staffID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
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
	staffID, _ := strconv.ParseInt(c.Param("id"), 10, 64)

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
	staffID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
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
	staffID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
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

// GetShiftReports returns aggregated shift reports for a specific date
func (h *StaffReportHandler) GetShiftReports(c *gin.Context) {
	dateStr := c.Query("date")

	report, err := h.services.StaffReportService.GetShiftReports(dateStr)
	if err != nil {
		response.InternalServerError(c, "Failed to get shift reports", err)
		return
	}
	response.Success(c, report, "Shift reports retrieved successfully")
}

// GetShiftSettings returns header/footer configuration for print
func (h *StaffReportHandler) GetShiftSettings(c *gin.Context) {
	settings, err := h.services.StaffReportService.GetShiftSettings()
	if err != nil {
		response.InternalServerError(c, "Failed to get shift settings", err)
		return
	}
	response.Success(c, settings, "Shift settings retrieved successfully")
}

// GetShiftCashiers returns active staff for a specific shift
func (h *StaffReportHandler) GetShiftCashiers(c *gin.Context) {
	shift := c.Param("shift")

	cashiers, err := h.services.StaffReportService.GetShiftCashiers(shift)
	if err != nil {
		response.InternalServerError(c, "Failed to get shift cashiers", err)
		return
	}
	response.Success(c, cashiers, "Shift cashiers retrieved successfully")
}

// GetShiftDetail returns detailed breakdown for a specific shift
// GetShiftDetail returns detailed breakdown for a specific shift
func (h *StaffReportHandler) GetShiftDetail(c *gin.Context) {
	shift := c.Param("shift")
	dateStr := c.Query("date")

	detail, err := h.services.StaffReportService.GetShiftDetail(shift, dateStr)
	if err != nil {
		response.InternalServerError(c, "Failed to get shift detail", err)
		return
	}
	response.Success(c, detail, "Shift detail retrieved successfully")
}

// UpdateShiftSettings updates shift configuration
func (h *StaffReportHandler) UpdateShiftSettings(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var req struct {
		StartTime string `json:"startTime"`
		EndTime   string `json:"endTime"`
		StaffIDs  string `json:"staffIDs"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	err := h.services.StaffReportService.UpdateShiftSettings(id, req.StartTime, req.EndTime, req.StaffIDs)
	if err != nil {
		response.InternalServerError(c, "Failed to update shift settings", err)
		return
	}

	response.Success(c, nil, "Shift settings updated successfully")
}
