package handlers

import (
	"ritel-app/internal/auth"
	"ritel-app/internal/container"
	"ritel-app/internal/http/response"
	"ritel-app/internal/models"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	services   *container.ServiceContainer
	jwtManager *auth.JWTManager
}

// NewAuthHandler creates a new AuthHandler instance
func NewAuthHandler(services *container.ServiceContainer, jwtManager *auth.JWTManager) *AuthHandler {
	return &AuthHandler{
		services:   services,
		jwtManager: jwtManager,
	}
}

// Login authenticates user and returns JWT token
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	// Call the same service method as Wails
	loginResponse, err := h.services.UserService.Login(&req)
	if err != nil {
		response.InternalServerError(c, "Login failed", err)
		return
	}

	if !loginResponse.Success {
		response.Unauthorized(c, loginResponse.Message)
		return
	}

	// Generate JWT token
	token, err := h.jwtManager.GenerateToken(loginResponse.User)
	if err != nil {
		response.InternalServerError(c, "Failed to generate token", err)
		return
	}

	// Add token to response
	loginResponse.Token = token

	response.Success(c, loginResponse, "Login successful")
}

// RefreshToken generates a new JWT token with extended expiry
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get current token from header
	authHeader := c.GetHeader("Authorization")
	if len(authHeader) < 7 {
		response.Unauthorized(c, "Invalid authorization header")
		return
	}
	tokenString := authHeader[7:] // Remove "Bearer " prefix

	newToken, err := h.jwtManager.RefreshToken(tokenString)
	if err != nil {
		response.Unauthorized(c, "Failed to refresh token")
		return
	}

	response.Success(c, gin.H{"token": newToken}, "Token refreshed")
}

// Me returns the current authenticated user's information
func (h *AuthHandler) Me(c *gin.Context) {
	claimsInterface, _ := c.Get("claims")
	claims := claimsInterface.(*auth.Claims)

	user, err := h.services.UserService.GetUserByID(claims.UserID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, user, "User info retrieved")
}

// ChangePassword changes the password for the authenticated user
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req models.ChangePasswordRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request body", err)
		return
	}

	// Get user from context
	claimsInterface, _ := c.Get("claims")
	claims := claimsInterface.(*auth.Claims)
	req.UserID = claims.UserID

	if err := h.services.UserService.ChangePassword(&req); err != nil {
		response.BadRequest(c, "Failed to change password", err)
		return
	}

	response.Success(c, nil, "Password changed successfully")
}
