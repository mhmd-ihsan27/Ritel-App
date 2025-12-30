package handlers

import (
	"log"
	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type PrinterHandler struct {
	services *container.ServiceContainer
}

func NewPrinterHandler(services *container.ServiceContainer) *PrinterHandler {
	return &PrinterHandler{services: services}
}

func (h *PrinterHandler) GetInstalled(c *gin.Context) {
	printers, err := h.services.PrinterService.GetInstalledPrinters()
	if err != nil {
		response.InternalServerError(c, "Failed to get installed printers", err)
		return
	}
	response.Success(c, printers, "Installed printers retrieved successfully")
}

func (h *PrinterHandler) TestPrint(c *gin.Context) {
	var req struct {
		PrinterName string `json:"printer_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.PrinterService.TestPrint(req.PrinterName); err != nil {
		response.InternalServerError(c, "Test print failed", err)
		return
	}
	response.Success(c, nil, "Test print successful")
}

func (h *PrinterHandler) PrintReceipt(c *gin.Context) {
	var req models.PrintReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("ERROR: Invalid request body for PrintReceipt: %v", err)
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	log.Printf("PrintReceipt request: TransactionNo=%s, PrinterName=%s, UseCustomData=%v",
		req.TransactionNo, req.PrinterName, req.UseCustomData)

	if err := h.services.PrinterService.PrintReceipt(&req); err != nil {
		log.Printf("ERROR: Failed to print receipt: %v", err)
		response.InternalServerError(c, "Failed to print receipt: "+err.Error(), err)
		return
	}
	response.Success(c, nil, "Receipt printed successfully")
}

func (h *PrinterHandler) GetSettings(c *gin.Context) {
	settings, err := h.services.PrinterService.GetPrintSettings()
	if err != nil {
		response.InternalServerError(c, "Failed to get print settings", err)
		return
	}
	response.Success(c, settings, "Print settings retrieved successfully")
}

func (h *PrinterHandler) SaveSettings(c *gin.Context) {
	var settings models.PrintSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.PrinterService.SavePrintSettings(&settings); err != nil {
		response.InternalServerError(c, "Failed to save print settings", err)
		return
	}
	response.Success(c, nil, "Print settings saved successfully")
}
