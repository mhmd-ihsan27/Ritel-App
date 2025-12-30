package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"ritel-app/internal/http/response"
)

// RateLimiter manages rate limiting for different endpoints
type RateLimiter struct {
	visitors map[string]*Visitor
	mu       sync.RWMutex

	// Default rate limit configuration
	defaultLimit    int           // requests
	defaultWindow   time.Duration // time window

	// Cleanup interval
	cleanupInterval time.Duration
}

// Visitor represents a client visitor with their request timestamps
type Visitor struct {
	timestamps []time.Time
	mu         sync.Mutex
}

// NewRateLimiter creates a new rate limiter instance
func NewRateLimiter(defaultLimit int, defaultWindow time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors:        make(map[string]*Visitor),
		defaultLimit:    defaultLimit,
		defaultWindow:   defaultWindow,
		cleanupInterval: 5 * time.Minute,
	}

	// Start cleanup goroutine to remove old visitors
	go rl.cleanupVisitors()

	return rl
}

// getVisitor retrieves or creates a visitor record for an IP
func (rl *RateLimiter) getVisitor(ip string) *Visitor {
	rl.mu.RLock()
	visitor, exists := rl.visitors[ip]
	rl.mu.RUnlock()

	if exists {
		return visitor
	}

	// Create new visitor
	rl.mu.Lock()
	visitor = &Visitor{
		timestamps: make([]time.Time, 0),
	}
	rl.visitors[ip] = visitor
	rl.mu.Unlock()

	return visitor
}

// isAllowed checks if a request from an IP is allowed based on rate limit
func (rl *RateLimiter) isAllowed(ip string, limit int, window time.Duration) (bool, int, time.Duration) {
	visitor := rl.getVisitor(ip)

	visitor.mu.Lock()
	defer visitor.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-window)

	// Remove timestamps older than the window
	validTimestamps := make([]time.Time, 0)
	for _, ts := range visitor.timestamps {
		if ts.After(cutoff) {
			validTimestamps = append(validTimestamps, ts)
		}
	}
	visitor.timestamps = validTimestamps

	// Check if limit exceeded
	requestCount := len(visitor.timestamps)
	remaining := limit - requestCount

	if requestCount >= limit {
		// Calculate retry after duration
		oldestTimestamp := visitor.timestamps[0]
		retryAfter := window - now.Sub(oldestTimestamp)
		return false, 0, retryAfter
	}

	// Add current timestamp
	visitor.timestamps = append(visitor.timestamps, now)

	return true, remaining - 1, 0
}

// cleanupVisitors periodically removes inactive visitors to prevent memory leak
func (rl *RateLimiter) cleanupVisitors() {
	ticker := time.NewTicker(rl.cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()

		for ip, visitor := range rl.visitors {
			visitor.mu.Lock()

			// Remove visitor if no recent requests
			if len(visitor.timestamps) == 0 ||
			   now.Sub(visitor.timestamps[len(visitor.timestamps)-1]) > rl.defaultWindow*2 {
				delete(rl.visitors, ip)
			}

			visitor.mu.Unlock()
		}

		rl.mu.Unlock()
	}
}

// RateLimit creates a rate limiting middleware with custom limits
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)

	return func(c *gin.Context) {
		// Get client IP
		clientIP := getClientIP(c)

		// Check if request is allowed
		allowed, remaining, retryAfter := limiter.isAllowed(clientIP, limit, window)

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", formatInt(limit))
		c.Header("X-RateLimit-Remaining", formatInt(remaining))
		c.Header("X-RateLimit-Window", window.String())

		if !allowed {
			// Set Retry-After header
			c.Header("Retry-After", formatInt(int(retryAfter.Seconds())))

			response.Error(c, http.StatusTooManyRequests,
				"Rate limit exceeded. Please try again later.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitWithConfig creates a rate limiting middleware with custom configuration per route
type RateLimitConfig struct {
	// Route pattern to match
	PathPrefix string

	// Rate limit settings
	Limit  int
	Window time.Duration

	// Skip rate limiting for certain conditions
	SkipFunc func(*gin.Context) bool
}

// Global rate limiters for different endpoint groups
var (
	globalLimiter *RateLimiter
	loginLimiter  *RateLimiter
	apiLimiter    *RateLimiter
)

// InitRateLimiters initializes global rate limiters
func InitRateLimiters(globalLimit, loginLimit, apiLimit int, globalWindow, loginWindow, apiWindow time.Duration) {
	globalLimiter = NewRateLimiter(globalLimit, globalWindow)
	loginLimiter = NewRateLimiter(loginLimit, loginWindow)
	apiLimiter = NewRateLimiter(apiLimit, apiWindow)
}

// SmartRateLimit applies different rate limits based on the endpoint
func SmartRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		clientIP := getClientIP(c)

		var allowed bool
		var remaining int
		var retryAfter time.Duration
		var limit int
		var window time.Duration

		// Apply stricter limits for authentication endpoints
		if path == "/api/auth/login" || path == "/api/auth/register" {
			if loginLimiter == nil {
				// Default: 5 requests per minute for login
				loginLimiter = NewRateLimiter(5, time.Minute)
			}
			limit = 5
			window = time.Minute
			allowed, remaining, retryAfter = loginLimiter.isAllowed(clientIP, limit, window)
		} else if len(path) >= 4 && path[:4] == "/api" {
			// API endpoints: 100 requests per minute
			if apiLimiter == nil {
				apiLimiter = NewRateLimiter(100, time.Minute)
			}
			limit = 100
			window = time.Minute
			allowed, remaining, retryAfter = apiLimiter.isAllowed(clientIP, limit, window)
		} else {
			// Global endpoints: 200 requests per minute
			if globalLimiter == nil {
				globalLimiter = NewRateLimiter(200, time.Minute)
			}
			limit = 200
			window = time.Minute
			allowed, remaining, retryAfter = globalLimiter.isAllowed(clientIP, limit, window)
		}

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", formatInt(limit))
		c.Header("X-RateLimit-Remaining", formatInt(remaining))
		c.Header("X-RateLimit-Window", window.String())

		if !allowed {
			c.Header("Retry-After", formatInt(int(retryAfter.Seconds())))

			response.Error(c, http.StatusTooManyRequests,
				"Rate limit exceeded. Please try again later.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// getClientIP extracts the real client IP from the request
func getClientIP(c *gin.Context) string {
	// Try to get IP from X-Forwarded-For header (behind proxy/load balancer)
	forwarded := c.GetHeader("X-Forwarded-For")
	if forwarded != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		return forwarded
	}

	// Try X-Real-IP header
	realIP := c.GetHeader("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fallback to RemoteAddr
	return c.ClientIP()
}

// formatInt converts int to string for headers
func formatInt(n int) string {
	if n < 0 {
		return "0"
	}
	return strconv.Itoa(n)
}
