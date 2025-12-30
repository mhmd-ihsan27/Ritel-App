package http

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"ritel-app/internal/auth"
	"ritel-app/internal/config"
	"ritel-app/internal/container"

	"github.com/gin-gonic/gin"
)

// Server represents the HTTP server
type Server struct {
	httpServer *http.Server
	router     *gin.Engine
}

// NewServer creates a new HTTP server instance
func NewServer(services *container.ServiceContainer, cfg config.ServerConfig) *Server {
	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiry)

	// Setup router with all routes (pass full config for rate limiting)
	router := SetupRouter(services, jwtManager, cfg)

	// Create HTTP server
	httpServer := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return &Server{
		httpServer: httpServer,
		router:     router,
	}
}

// Start starts the HTTP server (non-blocking)
func (s *Server) Start() error {
	log.Printf("[HTTP] Starting web server on %s", s.httpServer.Addr)

	go func() {
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[HTTP] Failed to start server: %v", err)
		}
	}()

	log.Printf("[HTTP] Web server started successfully")
	log.Printf("[HTTP] API endpoints available at http://%s/api", s.httpServer.Addr)
	log.Printf("[HTTP] Health check at http://%s/health", s.httpServer.Addr)

	return nil
}

// Shutdown gracefully shuts down the HTTP server
func (s *Server) Shutdown(ctx context.Context) error {
	log.Println("[HTTP] Shutting down web server...")

	if err := s.httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("failed to shutdown HTTP server: %w", err)
	}

	log.Println("[HTTP] Web server shutdown complete")
	return nil
}
