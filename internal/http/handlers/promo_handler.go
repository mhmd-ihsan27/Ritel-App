package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type PromoHandler struct {
	services *container.ServiceContainer
}

func NewPromoHandler(services *container.ServiceContainer) *PromoHandler {
	return &PromoHandler{services: services}
}

func (h *PromoHandler) GetAll(c *gin.Context) {
	promos, err := h.services.PromoService.GetAllPromo()
	if err != nil {
		response.InternalServerError(c, "Failed to get promos", err)
		return
	}
	response.Success(c, promos, "Promos retrieved successfully")
}

func (h *PromoHandler) GetActive(c *gin.Context) {
	promos, err := h.services.PromoService.GetActivePromos()
	if err != nil {
		response.InternalServerError(c, "Failed to get active promos", err)
		return
	}
	response.Success(c, promos, "Active promos retrieved successfully")
}

func (h *PromoHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid promo ID", err)
		return
	}
	promo, err := h.services.PromoService.GetPromoByID(id)
	if err != nil {
		response.NotFound(c, "Promo not found")
		return
	}
	response.Success(c, promo, "Promo retrieved successfully")
}

func (h *PromoHandler) GetByKode(c *gin.Context) {
	kode := c.Param("kode")
	promo, err := h.services.PromoService.GetPromoByKode(kode)
	if err != nil {
		response.NotFound(c, "Promo not found")
		return
	}
	response.Success(c, promo, "Promo retrieved successfully")
}

func (h *PromoHandler) Create(c *gin.Context) {
	var req models.CreatePromoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	promo, err := h.services.PromoService.CreatePromo(&req)
	if err != nil {
		response.BadRequest(c, "Failed to create promo", err)
		return
	}
	response.Success(c, promo, "Promo created successfully")
}

func (h *PromoHandler) Update(c *gin.Context) {
	var req models.UpdatePromoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	promo, err := h.services.PromoService.UpdatePromo(&req)
	if err != nil {
		response.BadRequest(c, "Failed to update promo", err)
		return
	}
	response.Success(c, promo, "Promo updated successfully")
}

func (h *PromoHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid promo ID", err)
		return
	}
	if err := h.services.PromoService.DeletePromo(id); err != nil {
		response.BadRequest(c, "Failed to delete promo", err)
		return
	}
	response.Success(c, nil, "Promo deleted successfully")
}

func (h *PromoHandler) Apply(c *gin.Context) {
	var req models.ApplyPromoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	result, err := h.services.PromoService.ApplyPromo(&req)
	if err != nil {
		response.BadRequest(c, "Failed to apply promo", err)
		return
	}
	response.Success(c, result, "Promo applied successfully")
}

func (h *PromoHandler) GetForProduct(c *gin.Context) {
	produkID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid product ID", err)
		return
	}
	promos, err := h.services.PromoService.GetPromoForProduct(produkID)
	if err != nil {
		response.InternalServerError(c, "Failed to get promos", err)
		return
	}
	response.Success(c, promos, "Product promos retrieved successfully")
}

func (h *PromoHandler) GetProducts(c *gin.Context) {
	promoID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid promo ID", err)
		return
	}
	products, err := h.services.PromoService.GetPromoProducts(promoID)
	if err != nil {
		response.InternalServerError(c, "Failed to get promo products", err)
		return
	}
	response.Success(c, products, "Promo products retrieved successfully")
}
