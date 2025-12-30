package middleware

import (
	"net/http"
	"strings"

	"ritel-app/internal/auth"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
	UserKey             = "user"
	ClaimsKey           = "claims"
)

// JWTAuth validates JWT tokens and extracts user information
func JWTAuth(jwtManager *auth.JWTManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header required")
			c.Abort()
			return
		}

		// Check Bearer prefix
		if !strings.HasPrefix(authHeader, BearerPrefix) {
			response.Unauthorized(c, "Invalid authorization format. Use: Bearer <token>")
			c.Abort()
			return
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, BearerPrefix)
		if tokenString == "" {
			response.Unauthorized(c, "Token is empty")
			c.Abort()
			return
		}

		// Validate token
		claims, err := jwtManager.ValidateToken(tokenString)
		if err != nil {
			response.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// Store claims in context
		c.Set(ClaimsKey, claims)
		c.Set(UserKey, claims.UserID)

		c.Next()
	}
}

// RequireRole ensures user has required role (admin or staff)
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claimsInterface, exists := c.Get(ClaimsKey)
		if !exists {
			response.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		claims, ok := claimsInterface.(*auth.Claims)
		if !ok {
			response.InternalServerError(c, "Invalid claims type", nil)
			c.Abort()
			return
		}

		// Check if user has required role
		hasRole := false
		for _, role := range roles {
			if claims.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			response.Forbidden(c, "Insufficient permissions")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAdmin ensures user is admin
func RequireAdmin() gin.HandlerFunc {
	return RequireRole("admin")
}

// GetUserClaims extracts claims from context
func GetUserClaims(c *gin.Context) (*auth.Claims, error) {
	claimsInterface, exists := c.Get(ClaimsKey)
	if !exists {
		return nil, http.ErrNoCookie
	}

	claims, ok := claimsInterface.(*auth.Claims)
	if !ok {
		return nil, http.ErrNoCookie
	}

	return claims, nil
}
