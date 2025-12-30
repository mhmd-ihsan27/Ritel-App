package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

type BatchHandler struct {
	services *container.ServiceContainer
}

func NewBatchHandler(services *container.ServiceContainer) *BatchHandler {
	return &BatchHandler{services: services}
}

func (h *BatchHandler) GetAll(c *gin.Context) {
	batches, err := h.services.BatchService.GetAllBatches()
	if err != nil {
		response.InternalServerError(c, "Failed to get batches", err)
		return
	}
	response.Success(c, batches, "Batches retrieved successfully")
}

func (h *BatchHandler) GetByID(c *gin.Context) {
	batchID := c.Param("id")
	batch, err := h.services.BatchService.GetBatchByID(batchID)
	if err != nil {
		response.NotFound(c, "Batch not found")
		return
	}
	response.Success(c, batch, "Batch retrieved successfully")
}

func (h *BatchHandler) GetByProduk(c *gin.Context) {
	produkID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid product ID", err)
		return
	}
	batches, err := h.services.BatchService.GetBatchesByProduk(produkID)
	if err != nil {
		response.InternalServerError(c, "Failed to get batches", err)
		return
	}
	response.Success(c, batches, "Product batches retrieved successfully")
}

func (h *BatchHandler) GetExpiring(c *gin.Context) {
	days, err := strconv.Atoi(c.Param("days"))
	if err != nil {
		response.BadRequest(c, "Invalid days parameter", err)
		return
	}
	batches, err := h.services.BatchService.GetExpiringBatches(days)
	if err != nil {
		response.InternalServerError(c, "Failed to get expiring batches", err)
		return
	}
	response.Success(c, batches, "Expiring batches retrieved successfully")
}

func (h *BatchHandler) DeleteExpired(c *gin.Context) {
	batchID := c.Param("id")
	if err := h.services.BatchService.DeleteExpiredBatch(batchID); err != nil {
		response.BadRequest(c, "Failed to delete expired batch", err)
		return
	}
	response.Success(c, nil, "Expired batch deleted successfully")
}

func (h *BatchHandler) GetSummary(c *gin.Context) {
	produkID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid product ID", err)
		return
	}
	summary, err := h.services.BatchService.GetBatchSummaryByProduk(produkID)
	if err != nil {
		response.InternalServerError(c, "Failed to get batch summary", err)
		return
	}
	response.Success(c, summary, "Batch summary retrieved successfully")
}

func (h *BatchHandler) UpdateStatuses(c *gin.Context) {
	if err := h.services.BatchService.UpdateBatchStatuses(); err != nil {
		response.InternalServerError(c, "Failed to update batch statuses", err)
		return
	}
	response.Success(c, nil, "Batch statuses updated successfully")
}
