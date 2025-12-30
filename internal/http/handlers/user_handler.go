package handlers

import (
	"strconv"

	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	services *container.ServiceContainer
}

func NewUserHandler(services *container.ServiceContainer) *UserHandler {
	return &UserHandler{services: services}
}

func (h *UserHandler) GetAll(c *gin.Context) {
	users, err := h.services.UserService.GetAllUsers()
	if err != nil {
		response.InternalServerError(c, "Failed to get users", err)
		return
	}
	response.Success(c, users, "Users retrieved successfully")
}

func (h *UserHandler) GetAllStaff(c *gin.Context) {
	staff, err := h.services.UserService.GetAllStaff()
	if err != nil {
		response.InternalServerError(c, "Failed to get staff", err)
		return
	}
	response.Success(c, staff, "Staff retrieved successfully")
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid user ID", err)
		return
	}
	user, err := h.services.UserService.GetUserByID(id)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}
	response.Success(c, user, "User retrieved successfully")
}

func (h *UserHandler) Create(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	if err := h.services.UserService.CreateUser(&req); err != nil {
		response.BadRequest(c, "Failed to create user", err)
		return
	}
	response.Success(c, nil, "User created successfully")
}

func (h *UserHandler) Update(c *gin.Context) {
	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}
	if err := h.services.UserService.UpdateUser(&req); err != nil {
		response.BadRequest(c, "Failed to update user", err)
		return
	}
	response.Success(c, nil, "User updated successfully")
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "Invalid user ID", err)
		return
	}
	if err := h.services.UserService.DeleteUser(id); err != nil {
		response.BadRequest(c, "Failed to delete user", err)
		return
	}
	response.Success(c, nil, "User deleted successfully")
}
