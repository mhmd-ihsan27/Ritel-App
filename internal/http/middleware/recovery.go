package middleware

import (
	"log"

	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

// Recovery creates a panic recovery middleware
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC RECOVERY] %v", err)
				response.InternalServerError(c, "Internal server error", nil)
				c.Abort()
			}
		}()
		c.Next()
	}
}
