package handlers

import (
	"fmt"
	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	services *container.ServiceContainer
}

func NewSettingsHandler(services *container.ServiceContainer) *SettingsHandler {
	return &SettingsHandler{services: services}
}

func (h *SettingsHandler) GetPoinSettings(c *gin.Context) {
	settings, err := h.services.SettingsService.GetPoinSettings()
	if err != nil {
		response.InternalServerError(c, "Failed to get point settings", err)
		return
	}
	response.Success(c, settings, "Point settings retrieved successfully")
}

func (h *SettingsHandler) UpdatePoinSettings(c *gin.Context) {
	var req models.UpdatePoinSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	fmt.Printf("[HTTP HANDLER] UpdatePoinSettings Request: %+v\n", req)

	settings, err := h.services.SettingsService.UpdatePoinSettings(&req)
	if err != nil {
		response.BadRequest(c, "Failed to update point settings", err)
		return
	}
	response.Success(c, settings, "Point settings updated successfully")
}
