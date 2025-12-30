package main

import (
	"context"
	"embed"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	customlogger "ritel-app/internal/logger"
	"ritel-app/internal/config"
	"ritel-app/internal/container"
	"ritel-app/internal/database"
	httpserver "ritel-app/internal/http"
	"ritel-app/internal/sync"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

// Check if running in web-only mode (no Wails desktop)
func isWebOnlyMode() bool {
	// Check command line argument
	for _, arg := range os.Args[1:] {
		if arg == "--web" || arg == "-web" || arg == "web" {
			return true
		}
	}
	// Check environment variable
	return os.Getenv("WEB_ONLY") == "true" || os.Getenv("WEB_ONLY") == "1"
}

func main() {
	// Re-enable logging for initialization
	log.SetOutput(os.Stdout)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	webOnly := isWebOnlyMode()

	log.Println("========================================")
	if webOnly {
		log.Println("🌐 RITEL-APP STARTING (WEB-ONLY MODE)")
	} else {
		log.Println("🚀 RITEL-APP STARTING")
	}
	log.Println("========================================")

	// STEP 1: Initialize database FIRST
	log.Println("[INIT] Initializing database...")
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Println("[INIT] Database initialized successfully")

	// STEP 1.5: Initialize Sync Engine if enabled
	syncConfig := config.GetSyncModeConfig()
	if syncConfig.Enabled {
		log.Println("[INIT] Initializing Sync Engine...")
		if err := sync.InitSyncEngine(syncConfig.SQLiteDSN, syncConfig.PostgresDSN); err != nil {
			log.Printf("[INIT] ⚠ Warning: Failed to initialize Sync Engine: %v", err)
			log.Println("[INIT] Application will continue without sync capability")
		} else {
			log.Println("[INIT] ✓ Sync Engine initialized successfully")

			// Setup sync engine shutdown
			defer func() {
				if sync.Engine != nil {
					log.Println("[SHUTDOWN] Stopping Sync Engine...")
					sync.Engine.Stop()
					log.Println("[SHUTDOWN] ✓ Sync Engine stopped")
				}
			}()
		}
	} else {
		log.Println("[INIT] Sync Mode disabled (using standard database mode)")
	}

	// STEP 2: Create SERVICE CONTAINER (shared by both Wails & HTTP)
	log.Println("[INIT] Initializing service container...")
	services := container.NewServiceContainer()
	log.Println("[INIT] Service container initialized")

	// STEP 3: Create Wails app and inject services
	app := NewApp()
	app.SetServices(services)

	// STEP 4: Check if web server is enabled
	serverConfig := config.GetServerConfig()

	// In development mode (wails dev), always enable HTTP server
	// because the frontend runs in a browser that needs HTTP API
	if !serverConfig.Enabled {
		log.Println("[INFO] WEB_ENABLED=false, but checking if we should auto-enable for dev mode...")
		// Auto-enable if running in dev mode (check if frontend dev server might be running)
		serverConfig.Enabled = true
		log.Println("[INFO] Auto-enabling HTTP server for development compatibility")
	}

	var httpServer *httpserver.Server
	if serverConfig.Enabled {
		log.Println("========================================")
		log.Println("🌐 WEB SERVER ENABLED")
		log.Println("========================================")

		// Create HTTP server
		httpServer = httpserver.NewServer(services, serverConfig)

		// Start HTTP server in background
		if err := httpServer.Start(); err != nil {
			log.Fatalf("Failed to start HTTP server: %v", err)
		}

		// Setup graceful shutdown for HTTP server
		defer func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := httpServer.Shutdown(ctx); err != nil {
				log.Printf("HTTP server shutdown error: %v", err)
			}
		}()

		// Handle OS signals for graceful shutdown
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		go func() {
			<-sigChan
			log.Println("\n[SHUTDOWN] Received shutdown signal")
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if httpServer != nil {
				httpServer.Shutdown(ctx)
			}
			services.Shutdown()
			os.Exit(0)
		}()
	}

	// STEP 5: Run application
	if webOnly {
		// WEB-ONLY MODE: Just keep the HTTP server running
		log.Println("========================================")
		log.Println("🌐 RUNNING IN WEB-ONLY MODE")
		log.Println("========================================")
		log.Println("Frontend: http://localhost:5173 (run 'cd frontend && npm run dev')")
		log.Println("API: http://localhost:8080/api")
		log.Println("Health: http://localhost:8080/health")
		log.Println("")
		log.Println("Press Ctrl+C to stop the server...")

		// Block until signal received
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		log.Println("\n[SHUTDOWN] Received shutdown signal")
	} else {
		// DESKTOP MODE: Run Wails application (BLOCKING)
		log.Println("========================================")
		log.Println("🖥️  STARTING DESKTOP APP (WAILS)")
		log.Println("========================================")

		err := wails.Run(&options.App{
			Title:  "Ritel-App",
			Width:  1200,
			Height: 700,
			AssetServer: &assetserver.Options{
				Assets: assets,
			},
			BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
			OnStartup:        app.startup,
			OnShutdown: func(ctx context.Context) {
				app.shutdown(ctx)
				services.Shutdown()
			},
			Bind: []interface{}{
				app,
			},
			Logger: customlogger.NewSilentLogger(),
		})

		if err != nil {
			log.SetOutput(os.Stdout)
			log.Printf("Error: %v", err)
		}
	}

	log.SetOutput(os.Stdout)
	log.Println("========================================")
	log.Println("👋 APPLICATION SHUTDOWN COMPLETE")
	log.Println("========================================")
}
