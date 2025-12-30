package handlers

import (
	"net/http"
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

// ProdukHandler handles product-related HTTP requests
type ProdukHandler struct {
	services *container.ServiceContainer
}

// NewProdukHandler creates a new ProdukHandler instance
func NewProdukHandler(services *container.ServiceContainer) *ProdukHandler {
	return &ProdukHandler{services: services}
}

// GetAll retrieves all products
func (h *ProdukHandler) GetAll(c *gin.Context) {
	produk, err := h.services.ProdukService.GetAllProduk()
	if err != nil {
		response.InternalServerError(c, "Failed to get products", err)
		return
	}
	response.Success(c, produk, "Products retrieved successfully")
}

// Create creates a new product
func (h *ProdukHandler) Create(c *gin.Context) {
	var produk models.Produk
	if err := c.ShouldBindJSON(&produk); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.ProdukService.CreateProduk(&produk); err != nil {
		response.BadRequest(c, "Failed to create product", err)
		return
	}

	response.SuccessWithStatus(c, http.StatusCreated, produk, "Product created successfully")
}

// Update updates an existing product
func (h *ProdukHandler) Update(c *gin.Context) {
	var produk models.Produk
	if err := c.ShouldBindJSON(&produk); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.ProdukService.UpdateProduk(&produk); err != nil {
		response.BadRequest(c, "Failed to update product", err)
		return
	}

	response.Success(c, produk, "Product updated successfully")
}

// Delete deletes a product by ID
func (h *ProdukHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid product ID", err)
		return
	}

	if err := h.services.ProdukService.DeleteProduk(id); err != nil {
		response.BadRequest(c, "Failed to delete product", err)
		return
	}

	response.Success(c, nil, "Product deleted successfully")
}

// ScanBarcode scans a product barcode
func (h *ProdukHandler) ScanBarcode(c *gin.Context) {
	var req struct {
		Barcode string `json:"barcode" binding:"required"`
		Jumlah  int    `json:"jumlah" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	result, err := h.services.ProdukService.ScanBarcode(req.Barcode, req.Jumlah)
	if err != nil {
		response.BadRequest(c, "Failed to scan barcode", err)
		return
	}

	response.Success(c, result, "Barcode scanned successfully")
}

// UpdateStok updates product stock
func (h *ProdukHandler) UpdateStok(c *gin.Context) {
	var req models.UpdateStokRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.ProdukService.UpdateStok(&req); err != nil {
		response.BadRequest(c, "Failed to update stock", err)
		return
	}

	response.Success(c, nil, "Stock updated successfully")
}

// UpdateStokIncrement increments or decrements product stock
func (h *ProdukHandler) UpdateStokIncrement(c *gin.Context) {
	var req models.UpdateStokRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.ProdukService.UpdateStokIncrement(&req); err != nil {
		response.BadRequest(c, "Failed to update stock increment", err)
		return
	}

	response.Success(c, nil, "Stock updated successfully")
}

// GetStokHistory retrieves stock history for a product
func (h *ProdukHandler) GetStokHistory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid product ID", err)
		return
	}

	history, err := h.services.ProdukService.GetStokHistory(id)
	if err != nil {
		response.InternalServerError(c, "Failed to get stock history", err)
		return
	}

	response.Success(c, history, "Stock history retrieved")
}

// GetKeranjang retrieves all items in the cart
func (h *ProdukHandler) GetKeranjang(c *gin.Context) {
	keranjang, err := h.services.ProdukService.GetKeranjang()
	if err != nil {
		response.InternalServerError(c, "Failed to get cart", err)
		return
	}

	response.Success(c, keranjang, "Cart retrieved successfully")
}

// ClearKeranjang clears all items from the cart
func (h *ProdukHandler) ClearKeranjang(c *gin.Context) {
	if err := h.services.ProdukService.ClearKeranjang(); err != nil {
		response.InternalServerError(c, "Failed to clear cart", err)
		return
	}

	response.Success(c, nil, "Cart cleared successfully")
}

// ProcessKeranjang processes the cart (confirms purchase and updates stock)
func (h *ProdukHandler) ProcessKeranjang(c *gin.Context) {
	err := h.services.ProdukService.ProcessKeranjang()
	if err != nil {
		response.BadRequest(c, "Failed to process cart", err)
		return
	}

	response.Success(c, nil, "Cart processed successfully")
}

// RemoveFromKeranjang removes an item from the cart
func (h *ProdukHandler) RemoveFromKeranjang(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid item ID", err)
		return
	}

	if err := h.services.ProdukService.RemoveFromKeranjang(id); err != nil {
		response.BadRequest(c, "Failed to remove from cart", err)
		return
	}

	response.Success(c, nil, "Item removed from cart")
}

// UpdateKeranjangJumlah updates the quantity of an item in the cart
func (h *ProdukHandler) UpdateKeranjangJumlah(c *gin.Context) {
	var req struct {
		ID     int `json:"id" binding:"required"`
		Jumlah int `json:"jumlah" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	if err := h.services.ProdukService.UpdateKeranjangJumlah(req.ID, req.Jumlah); err != nil {
		response.BadRequest(c, "Failed to update cart quantity", err)
		return
	}

	response.Success(c, nil, "Cart quantity updated")
}
