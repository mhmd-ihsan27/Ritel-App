package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type ReturnHandler struct {
	services *container.ServiceContainer
}

func NewReturnHandler(services *container.ServiceContainer) *ReturnHandler {
	return &ReturnHandler{services: services}
}

func (h *ReturnHandler) GetAll(c *gin.Context) {
	returns, err := h.services.ReturnService.GetAllReturn()
	if err != nil {
		response.InternalServerError(c, "Failed to get returns", err)
		return
	}
	response.Success(c, returns, "Returns retrieved successfully")
}

func (h *ReturnHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid return ID", err)
		return
	}
	returnData, err := h.services.ReturnService.GetReturnByID(id)
	if err != nil {
		response.NotFound(c, "Return not found")
		return
	}
	response.Success(c, returnData, "Return retrieved successfully")
}

func (h *ReturnHandler) Create(c *gin.Context) {
	var req models.CreateReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	if err := h.services.ReturnService.CreateReturn(&req); err != nil {
		response.BadRequest(c, "Failed to create return", err)
		return
	}
	response.Success(c, nil, "Return created successfully")
}
