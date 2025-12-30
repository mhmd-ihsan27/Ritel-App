package handlers

import (
	"ritel-app/internal/container"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

type HardwareHandler struct {
	services *container.ServiceContainer
}

func NewHardwareHandler(services *container.ServiceContainer) *HardwareHandler {
	return &HardwareHandler{services: services}
}

func (h *HardwareHandler) DetectHardware(c *gin.Context) {
	hardware, err := h.services.HardwareService.DetectHardware()
	if err != nil {
		response.InternalServerError(c, "Failed to detect hardware", err)
		return
	}
	response.Success(c, hardware, "Hardware detected successfully")
}

func (h *HardwareHandler) TestScanner(c *gin.Context) {
	var req struct {
		Port string `json:"port" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	result, err := h.services.HardwareService.TestScanner(req.Port)
	if err != nil {
		response.InternalServerError(c, "Scanner test failed", err)
		return
	}
	response.Success(c, result, "Scanner test successful")
}

func (h *HardwareHandler) TestPrinter(c *gin.Context) {
	var req struct {
		Port string `json:"port" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	result, err := h.services.HardwareService.TestPrinter(req.Port)
	if err != nil {
		response.InternalServerError(c, "Printer test failed", err)
		return
	}
	response.Success(c, result, "Printer test successful")
}

func (h *HardwareHandler) TestCashDrawer(c *gin.Context) {
	var req struct {
		Port string `json:"port" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	result, err := h.services.HardwareService.TestCashDrawer(req.Port)
	if err != nil {
		response.InternalServerError(c, "Cash drawer test failed", err)
		return
	}
	response.Success(c, result, "Cash drawer test successful")
}
