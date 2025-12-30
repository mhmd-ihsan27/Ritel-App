package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS creates a CORS middleware with specified configuration
func CORS(allowedOrigins []string, allowCredentials bool) gin.HandlerFunc {
	// Check if wildcard is in allowed origins
	allowAllOrigins := false
	for _, origin := range allowedOrigins {
		if origin == "*" {
			allowAllOrigins = true
			break
		}
	}

	config := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Window"},
		AllowCredentials: allowCredentials,
		MaxAge:           12 * time.Hour,
	}

	if allowAllOrigins {
		// When using "*", we need AllowOriginFunc to echo back the origin
		// because AllowCredentials=true doesn't work with AllowOrigins=["*"]
		config.AllowOriginFunc = func(origin string) bool {
			return true // Allow all origins
		}
	} else {
		config.AllowOrigins = allowedOrigins
	}

	return cors.New(config)
}
