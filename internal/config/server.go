package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"log"
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
	RateLimitGlobal       int
	RateLimitAPI          int
	RateLimitLogin        int
	RateLimitWindowGlobal time.Duration
	RateLimitWindowAPI    time.Duration
	RateLimitWindowLogin  time.Duration
}

// GetServerConfig loads server configuration from environment variables
func GetServerConfig() ServerConfig {
	log.Println("--- CONFIGURATION LOADING START ---")

	// 1. Web server enabled flag
	enabled, _ := strconv.ParseBool(os.Getenv("WEB_ENABLED"))
	if os.Getenv("WEB_ENABLED") == "" {
		enabled = false // Default to disabled
	}
	log.Printf("WEB_ENABLED: %v", enabled)

	// 2. Web server port
	port := os.Getenv("WEB_PORT")
	if port == "" {
		port = "8080" // Default port
	}
	log.Printf("WEB_PORT: %s", port)

	// 3. Web server host
	host := os.Getenv("WEB_HOST")
	if host == "" {
		host = "0.0.0.0" // Default to all interfaces
	}
	log.Printf("WEB_HOST: %s", host)

	// 4. JWT secret key
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Println("WARNING: JWT_SECRET is empty! Using default insecure secret.")
		secret = "default-secret-change-this-in-production"
	}
	log.Printf("JWT_SECRET: %s (Length: %d)", secret, len(secret))

	// 5. JWT expiry duration
	expiryHours, _ := strconv.Atoi(os.Getenv("JWT_EXPIRY_HOURS"))
	if expiryHours == 0 {
		expiryHours = 24 // Default to 24 hours
	}
	log.Printf("JWT_EXPIRY_HOURS: %d", expiryHours)

	// 6. CORS allowed origins (VALIDASI & LOG)
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

	// Validasi: Jika origins kosong setelah split, pakai default *
	if len(origins) == 0 {
		log.Println("WARNING: CORS_ALLOWED_ORIGINS is empty. Defaulting to '*'.")
		origins = []string{"*"}
	}
	log.Printf("CORS_ALLOWED_ORIGINS (Processed): %v", origins)

	// 7. CORS allow credentials
	credentials, _ := strconv.ParseBool(os.Getenv("CORS_ALLOW_CREDENTIALS"))
	log.Printf("CORS_ALLOW_CREDENTIALS: %v", credentials)

	// --- RATE LIMITING ---
	rateLimitEnabled, _ := strconv.ParseBool(os.Getenv("RATE_LIMIT_ENABLED"))
	if os.Getenv("RATE_LIMIT_ENABLED") == "" {
		rateLimitEnabled = true // Default to enabled for security
	}
	log.Printf("RATE_LIMIT_ENABLED: %v", rateLimitEnabled)

	rateLimitGlobal, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_GLOBAL"))
	if rateLimitGlobal == 0 {
		rateLimitGlobal = 200
	}
	log.Printf("RATE_LIMIT_GLOBAL: %d", rateLimitGlobal)

	rateLimitAPI, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_API"))
	if rateLimitAPI == 0 {
		rateLimitAPI = 100
	}
	log.Printf("RATE_LIMIT_API: %d", rateLimitAPI)

	rateLimitLogin, _ := strconv.Atoi(os.Getenv("RATE_LIMIT_LOGIN"))
	if rateLimitLogin == 0 {
		rateLimitLogin = 5
	}
	log.Printf("RATE_LIMIT_LOGIN: %d", rateLimitLogin)

	rateLimitWindowGlobal := parseDuration(os.Getenv("RATE_LIMIT_WINDOW_GLOBAL"), time.Minute)
	rateLimitWindowAPI := parseDuration(os.Getenv("RATE_LIMIT_WINDOW_API"), time.Minute)
	rateLimitWindowLogin := parseDuration(os.Getenv("RATE_LIMIT_WINDOW_LOGIN"), time.Minute)

	log.Printf("RATE_LIMIT_WINDOW_GLOBAL: %v", rateLimitWindowGlobal)
	log.Printf("RATE_LIMIT_WINDOW_API: %v", rateLimitWindowAPI)
	log.Printf("RATE_LIMIT_WINDOW_LOGIN: %v", rateLimitWindowLogin)

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
		log.Printf("Error parsing duration '%s': %v. Using default.", s, err)
		return defaultDuration
	}
	return d
}
