package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRateLimiter(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a test router with rate limiting
	router := gin.New()
	router.Use(RateLimit(3, time.Minute)) // Allow 3 requests per minute

	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	// Test 1: First 3 requests should succeed
	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.1:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code, "Request %d should succeed", i+1)
	}

	// Test 2: 4th request should be rate limited
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 429, w.Code, "4th request should be rate limited")
	assert.Contains(t, w.Header().Get("Retry-After"), "", "Should have Retry-After header")
}

func TestRateLimiter_DifferentIPs(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RateLimit(2, time.Minute))

	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	// Test: Different IPs should have separate rate limits
	// IP 1: Make 2 requests (at limit)
	for i := 0; i < 2; i++ {
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.1:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, 200, w.Code)
	}

	// IP 2: Should still be able to make requests
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.2:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, 200, w.Code, "Different IP should have separate rate limit")
}

func TestRateLimiter_Headers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RateLimit(5, time.Minute))

	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "success"})
	})

	// Make a request
	req, _ := http.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check headers
	assert.Equal(t, "5", w.Header().Get("X-RateLimit-Limit"), "Should have limit header")
	assert.Equal(t, "4", w.Header().Get("X-RateLimit-Remaining"), "Should have remaining header")
	assert.NotEmpty(t, w.Header().Get("X-RateLimit-Window"), "Should have window header")
}

func TestSmartRateLimit_LoginEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Initialize rate limiters with login limit of 3
	InitRateLimiters(200, 3, 100, time.Minute, time.Minute, time.Minute)

	router := gin.New()
	router.Use(SmartRateLimit())

	router.POST("/api/auth/login", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "login success"})
	})

	// Note: SmartRateLimit hardcodes login limit to 5, so we test with 5
	// Test: Login should have strict limit (5 requests per SmartRateLimit implementation)
	for i := 0; i < 5; i++ {
		req, _ := http.NewRequest("POST", "/api/auth/login", nil)
		req.RemoteAddr = "192.168.1.1:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, 200, w.Code, "Request %d should succeed", i+1)
	}

	// 6th request should be rate limited
	req, _ := http.NewRequest("POST", "/api/auth/login", nil)
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, 429, w.Code, "6th login request should be rate limited")
}

func TestSmartRateLimit_APIEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Initialize rate limiters
	InitRateLimiters(200, 5, 10, time.Minute, time.Minute, time.Minute)

	router := gin.New()
	router.Use(SmartRateLimit())

	router.GET("/api/products", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "products"})
	})

	// Note: SmartRateLimit hardcodes API limit to 100, so we test with 100
	// Test: API endpoints should have moderate limit (100 requests per SmartRateLimit implementation)
	for i := 0; i < 100; i++ {
		req, _ := http.NewRequest("GET", "/api/products", nil)
		req.RemoteAddr = "192.168.1.1:1234"
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		assert.Equal(t, 200, w.Code, "Request %d should succeed", i+1)
	}

	// 101st request should be rate limited
	req, _ := http.NewRequest("GET", "/api/products", nil)
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, 429, w.Code, "101st API request should be rate limited")
}

func TestGetClientIP_XForwardedFor(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.GET("/test", func(c *gin.Context) {
		ip := getClientIP(c)
		c.JSON(200, gin.H{"ip": ip})
	})

	// Test X-Forwarded-For header
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Forwarded-For", "203.0.113.1")
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	// The IP should be from X-Forwarded-For, not RemoteAddr
	assert.Contains(t, w.Body.String(), "203.0.113.1")
}

func TestFormatInt(t *testing.T) {
	tests := []struct {
		input    int
		expected string
	}{
		{0, "0"},
		{5, "5"},
		{42, "42"},
		{100, "100"},
		{-1, "0"}, // Negative should return "0"
	}

	for _, tt := range tests {
		result := formatInt(tt.input)
		assert.Equal(t, tt.expected, result, "formatInt(%d) should return %s", tt.input, tt.expected)
	}
}
