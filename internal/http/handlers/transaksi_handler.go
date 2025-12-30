package handlers

import (
	"strconv"
	"time"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

// TransaksiHandler handles transaction-related HTTP requests
type TransaksiHandler struct {
	services *container.ServiceContainer
}

// NewTransaksiHandler creates a new TransaksiHandler instance
func NewTransaksiHandler(services *container.ServiceContainer) *TransaksiHandler {
	return &TransaksiHandler{services: services}
}

// Create creates a new transaction
func (h *TransaksiHandler) Create(c *gin.Context) {
	var req models.CreateTransaksiRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	result, err := h.services.TransaksiService.CreateTransaksi(&req)
	if err != nil {
		response.InternalServerError(c, "Failed to create transaction", err)
		return
	}

	response.Success(c, result, "Transaction created successfully")
}

// GetAll retrieves all transactions with pagination
func (h *TransaksiHandler) GetAll(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	transaksi, err := h.services.TransaksiService.GetAllTransaksi(limit, offset)
	if err != nil {
		response.InternalServerError(c, "Failed to get transactions", err)
		return
	}

	response.Success(c, transaksi, "Transactions retrieved successfully")
}

// GetByID retrieves a transaction by ID
func (h *TransaksiHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid transaction ID", err)
		return
	}

	transaksi, err := h.services.TransaksiService.GetTransaksiByID(id)
	if err != nil {
		response.NotFound(c, "Transaction not found")
		return
	}

	response.Success(c, transaksi, "Transaction retrieved successfully")
}

// GetByNoTransaksi retrieves a transaction by transaction number
func (h *TransaksiHandler) GetByNoTransaksi(c *gin.Context) {
	noTransaksi := c.Param("nomor")

	transaksi, err := h.services.TransaksiService.GetTransaksiByNoTransaksi(noTransaksi)
	if err != nil {
		response.NotFound(c, "Transaction not found")
		return
	}

	response.Success(c, transaksi, "Transaction retrieved successfully")
}

// GetByDateRange retrieves transactions within a date range
func (h *TransaksiHandler) GetByDateRange(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		response.BadRequest(c, "start_date and end_date are required", nil)
		return
	}

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

	transaksi, err := h.services.TransaksiService.GetTransaksiByDateRange(startDate, endDate)
	if err != nil {
		response.InternalServerError(c, "Failed to get transactions", err)
		return
	}

	response.Success(c, transaksi, "Transactions retrieved successfully")
}

// GetTodayStats retrieves today's transaction statistics
func (h *TransaksiHandler) GetTodayStats(c *gin.Context) {
	stats, err := h.services.TransaksiService.GetTodayStats()
	if err != nil {
		response.InternalServerError(c, "Failed to get today's stats", err)
		return
	}

	response.Success(c, stats, "Today's stats retrieved successfully")
}

// GetByPelanggan retrieves transactions for a specific customer
func (h *TransaksiHandler) GetByPelanggan(c *gin.Context) {
	pelangganID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid customer ID", err)
		return
	}

	transaksi, err := h.services.TransaksiService.GetTransaksiByPelangganID(pelangganID)
	if err != nil {
		response.InternalServerError(c, "Failed to get transactions", err)
		return
	}

	response.Success(c, transaksi, "Customer transactions retrieved successfully")
}
