package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// ServerConfig holds web server configuration
type ServerConfig struct {
	Enabled         bool
	Port            string
	Host            string
	JWTSecret       []byte
	JWTExpiry       time.Duration
	CORSOrigins     []string
	CORSCredentials bool

	// Rate Limiting Configuration
	RateLimitEnabled      bool
	RateLimitGlobal       int           // Global rate limit (requests per window)
	RateLimitAPI          int           // API rate limit (requests per window)
	RateLimitLogin        int           // Login rate limit (requests per window)
	RateLimitWindowGlobal time.Duration // Global window duration
	RateLimitWindowAPI    time.Duration // API window duration
	RateLimitWindowLogin  time.Duration // Login window duration
}

// GetServerConfig loads server configuration from environment variables
func GetServerConfig() ServerConfig {
	// Web server enabled flag
	enabled, _ := strconv.ParseBool(os.Getenv("WEB_ENABLED"))
	if os.Getenv("WEB_ENABLED") == "" {
		enabled = false // Default to disabled
	}

	// Web server port
	port := os.Getenv("WEB_PORT")
	if port == "" {
		port = "8080" // Default port
	}

	// Web server host
	host := os.Getenv("WEB_HOST")
	if host == "" {
		host = "0.0.0.0" // Default to all interfaces
	}

	// JWT secret key
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default-secret-change-this-in-production"
	}

	// JWT expiry duration
	expiryHours, _ := strconv.Atoi(os.Getenv("JWT_EXPIRY_HOURS"))
	if expiryHours == 0 {
		expiryHours = 24 // Default to 24 hours
	}

	// CORS allowed origins
	originsStr := os.Getenv("CORS_ALLOWED_ORIGINS")
	var origins []string
	if originsStr != "" {
		// Split by comma and trim spaces
		parts := strings.Split(originsStr, ",")
		for _, origin := range parts {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}
	if len(origins) == 0 {
		origins = []string{"*"} // Default to allow all (not recommended for production)
	}

	// CORS allow credentials
	credentials, _ := strconv.ParseBool(os.Getenv("CORS_ALLOW_CREDENTIALS"))

	// Rate Limiting Configuration
	rateLimitEnabled, _ := strconv.ParseBool(os.Getenv("RATE_LIMIT_ENABLED"))
	if os.Getenv("RATE_LIMIT_ENABLED") == "" {
		rateLimitEnabled = true // Default to enabled for security
	}

	// Rate limit values
	rateLimitGlobal, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_GLOBAL"))
	if rateLimitGlobal == 0 {
		rateLimitGlobal = 200 // Default: 200 requests per minute
	}

	rateLimitAPI, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_API"))
	if rateLimitAPI == 0 {
		rateLimitAPI = 100 // Default: 100 requests per minute
	}

	rateLimitLogin, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_LOGIN"))
	if rateLimitLogin == 0 {
		rateLimitLogin = 5 // Default: 5 requests per minute (strict for login)
	}

	// Rate limit windows
	rateLimitWindowGlobal := parseDuration(os.Getenv("RATE_LIMIT_WINDOW_GLOBAL"), time.Minute)
	rateLimitWindowAPI := parseDuration(os.Getenv("RATE_LIMIT_WINDOW_API"), time.Minute)
	rateLimitWindowLogin := parseDuration(os.Getenv("RATE_LIMIT_WINDOW_LOGIN"), time.Minute)

	return ServerConfig{
		Enabled:         enabled,
		Port:            port,
		Host:            host,
		JWTSecret:       []byte(secret),
		JWTExpiry:       time.Duration(expiryHours) * time.Hour,
		CORSOrigins:     origins,
		CORSCredentials: credentials,

		// Rate Limiting
		RateLimitEnabled:      rateLimitEnabled,
		RateLimitGlobal:       rateLimitGlobal,
		RateLimitAPI:          rateLimitAPI,
		RateLimitLogin:        rateLimitLogin,
		RateLimitWindowGlobal: rateLimitWindowGlobal,
		RateLimitWindowAPI:    rateLimitWindowAPI,
		RateLimitWindowLogin:  rateLimitWindowLogin,
	}
}

// parseDuration parses a duration string or returns default
func parseDuration(s string, defaultDuration time.Duration) time.Duration {
	if s == "" {
		return defaultDuration
	}
	d, err := time.ParseDuration(s)
	if err != nil {
		return defaultDuration
	}
	return d
}
