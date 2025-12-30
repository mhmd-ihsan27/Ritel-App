package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type KategoriHandler struct {
	services *container.ServiceContainer
}

func NewKategoriHandler(services *container.ServiceContainer) *KategoriHandler {
	return &KategoriHandler{services: services}
}

func (h *KategoriHandler) GetAll(c *gin.Context) {
	kategori, err := h.services.KategoriService.GetAllKategori()
	if err != nil {
		response.InternalServerError(c, "Failed to get categories", err)
		return
	}
	response.Success(c, kategori, "Categories retrieved successfully")
}

func (h *KategoriHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid category ID", err)
		return
	}
	kategori, err := h.services.KategoriService.GetKategoriByID(id)
	if err != nil {
		response.NotFound(c, "Category not found")
		return
	}
	response.Success(c, kategori, "Category retrieved successfully")
}

func (h *KategoriHandler) Create(c *gin.Context) {
	var kategori models.Kategori
	if err := c.ShouldBindJSON(&kategori); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	if err := h.services.KategoriService.CreateKategori(&kategori); err != nil {
		response.BadRequest(c, "Failed to create category", err)
		return
	}
	response.Success(c, kategori, "Category created successfully")
}

func (h *KategoriHandler) Update(c *gin.Context) {
	var kategori models.Kategori
	if err := c.ShouldBindJSON(&kategori); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	if err := h.services.KategoriService.UpdateKategori(&kategori); err != nil {
		response.BadRequest(c, "Failed to update category", err)
		return
	}
	response.Success(c, kategori, "Category updated successfully")
}

func (h *KategoriHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid category ID", err)
		return
	}
	if err := h.services.KategoriService.DeleteKategori(id); err != nil {
		response.BadRequest(c, "Failed to delete category", err)
		return
	}
	response.Success(c, nil, "Category deleted successfully")
}
