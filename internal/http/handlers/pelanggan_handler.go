package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type PelangganHandler struct {
	services *container.ServiceContainer
}

func NewPelangganHandler(services *container.ServiceContainer) *PelangganHandler {
	return &PelangganHandler{services: services}
}

func (h *PelangganHandler) GetAll(c *gin.Context) {
	pelanggan, err := h.services.PelangganService.GetAllPelanggan()
	if err != nil {
		response.InternalServerError(c, "Failed to get customers", err)
		return
	}
	response.Success(c, pelanggan, "Customers retrieved successfully")
}

func (h *PelangganHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid customer ID", err)
		return
	}
	pelanggan, err := h.services.PelangganService.GetPelangganByID(id)
	if err != nil {
		response.NotFound(c, "Customer not found")
		return
	}
	response.Success(c, pelanggan, "Customer retrieved successfully")
}

func (h *PelangganHandler) GetByTelepon(c *gin.Context) {
	telepon := c.Param("telepon")
	pelanggan, err := h.services.PelangganService.GetPelangganByTelepon(telepon)
	if err != nil {
		response.NotFound(c, "Customer not found")
		return
	}
	response.Success(c, pelanggan, "Customer retrieved successfully")
}

func (h *PelangganHandler) GetByTipe(c *gin.Context) {
	tipe := c.Param("tipe")
	pelanggan, err := h.services.PelangganService.GetPelangganByTipe(tipe)
	if err != nil {
		response.InternalServerError(c, "Failed to get customers", err)
		return
	}
	response.Success(c, pelanggan, "Customers retrieved successfully")
}

func (h *PelangganHandler) Create(c *gin.Context) {
	var req models.CreatePelangganRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	pelanggan, err := h.services.PelangganService.CreatePelanggan(&req)
	if err != nil {
		response.BadRequest(c, "Failed to create customer", err)
		return
	}
	response.Success(c, pelanggan, "Customer created successfully")
}

func (h *PelangganHandler) Update(c *gin.Context) {
	var req models.UpdatePelangganRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	pelanggan, err := h.services.PelangganService.UpdatePelanggan(&req)
	if err != nil {
		response.BadRequest(c, "Failed to update customer", err)
		return
	}
	response.Success(c, pelanggan, "Customer updated successfully")
}

func (h *PelangganHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid customer ID", err)
		return
	}
	if err := h.services.PelangganService.DeletePelanggan(id); err != nil {
		response.BadRequest(c, "Failed to delete customer", err)
		return
	}
	response.Success(c, nil, "Customer deleted successfully")
}

func (h *PelangganHandler) AddPoin(c *gin.Context) {
	var req models.AddPoinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	pelanggan, err := h.services.PelangganService.AddPoin(&req)
	if err != nil {
		response.BadRequest(c, "Failed to add points", err)
		return
	}
	response.Success(c, pelanggan, "Points added successfully")
}

func (h *PelangganHandler) GetWithStats(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid customer ID", err)
		return
	}
	stats, err := h.services.PelangganService.GetPelangganWithStats(id)
	if err != nil {
		response.InternalServerError(c, "Failed to get customer stats", err)
		return
	}
	response.Success(c, stats, "Customer stats retrieved successfully")
}
