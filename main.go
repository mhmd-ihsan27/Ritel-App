package main

import (
	"context"
	"embed"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime/debug"
	"syscall"
	"time"
	"unsafe"

	"ritel-app/internal/config"
	"ritel-app/internal/container"
	"ritel-app/internal/database"
	httpserver "ritel-app/internal/http"
	customlogger "ritel-app/internal/logger"
	"ritel-app/internal/repository"
	"ritel-app/internal/sync"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

const (
	logFileName = "startup_debug.log"
)

// showFatalError shows a native Windows Message Box for critical errors
func showFatalError(title, message string) {
	// Only show in GUI mode or if specifically needed
	messagePtr, _ := syscall.UTF16PtrFromString(message)
	titlePtr, _ := syscall.UTF16PtrFromString(title)

	// MB_OK (0x00000000) | MB_ICONERROR (0x00000010)
	const MB_OK = 0x00000000
	const MB_ICONERROR = 0x00000010

	user32 := syscall.NewLazyDLL("user32.dll")
	messageBox := user32.NewProc("MessageBoxW")
	messageBox.Call(0, uintptr(unsafe.Pointer(messagePtr)), uintptr(unsafe.Pointer(titlePtr)), uintptr(MB_OK|MB_ICONERROR))
}

// setupInitialLogging prepares a log file for diagnostic purposes
func setupInitialLogging() (func(), error) {
	exePath, err := os.Executable()
	if err != nil {
		return nil, err
	}
	exeDir := filepath.Dir(exePath)
	logPath := filepath.Join(exeDir, logFileName)

	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, err
	}

	// MultiWriter to both file and stdout
	mw := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(mw)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	return func() {
		logFile.Close()
	}, nil
}

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
	closeLog, err := setupInitialLogging()
	if err != nil {
		// If we can't even setup logging, fallback to stdout
		log.SetOutput(os.Stdout)
		log.Printf("Warning: Failed to setup log file: %v", err)
	} else {
		defer closeLog()
	}

	// Catch panics and log them
	defer func() {
		if r := recover(); r != nil {
			errStr := fmt.Sprintf("A fatal panic occurred: %v\n\nStack Trace:\n%s", r, debug.Stack())
			log.Println("[PANIC]", errStr)
			showFatalError("Ritel-App Fatal Error", fmt.Sprintf("A critical error occurred while starting the application.\n\nPlease check %s for details.\n\nError: %v", logFileName, r))
			os.Exit(1)
		}
	}()

	webOnly := isWebOnlyMode()
	if os.Getenv("APP_MODE") == "" {
		if webOnly {
			_ = os.Setenv("APP_MODE", "web")
		} else {
			_ = os.Setenv("APP_MODE", "desktop")
		}
	}

	// STEP 1: Initialize database FIRST
	if err := database.InitDB(); err != nil {
		errMsg := fmt.Sprintf("Failed to initialize database: %v", err)
		showFatalError("Database Initialization Error", errMsg+"\n\nTry running the application as administrator if this is the first run.")
		os.Exit(1)
	}

	// STEP 1.1: Seed database with default data if empty
	database.SeedDatabase(database.DB)

	// STEP 1.2: Run auto-migrations (will update database schema to latest version)
	if err := database.RunMigrations(database.DB); err != nil {
		errMsg := fmt.Sprintf("Failed to run database migrations: %v", err)
		showFatalError("Database Migration Error", errMsg+"\n\nThe application cannot continue without updating the database schema.")
		os.Exit(1)
	}

	// STEP 1.2a: Run migrations on Remote Postgres DB (if in Dual Mode)
	// STEP 1.2a: Force Fix Postgres Schema (Nuclear Option)
	if database.UseDualMode && database.DBPostgres != nil {
		log.Println("[MAIN] ☢️  Executing Critical Schema Fixes on Remote DB...")

		// 1. Fix Users ID (int4 -> int8)
		// Using 'USING id::bigint' to strictly force conversion
		if _, err := database.DBPostgres.Exec("ALTER TABLE IF EXISTS users ALTER COLUMN id TYPE BIGINT USING id::bigint"); err != nil {
			log.Printf("[MAIN] ⚠️  Failed to fix users ID: %v", err)
		} else {
			log.Println("[MAIN] ✅ Users table ID fixed to BIGINT.")
		}

		// 1a. VERIFY Fix
		var dataType string
		if err := database.DBPostgres.QueryRow("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'").Scan(&dataType); err == nil {
			log.Printf("[MAIN] 🧐 VERIFICATION: users.id type is now '%s'", dataType)
		}

		// 2. Fix Transaksi Batch IDs
		if _, err := database.DBPostgres.Exec("ALTER TABLE IF EXISTS transaksi_batch ALTER COLUMN id TYPE BIGINT USING id::bigint"); err != nil {
			log.Printf("[MAIN] ⚠️  Failed to fix transaksi_batch ID: %v", err)
		}
		if _, err := database.DBPostgres.Exec("ALTER TABLE IF EXISTS transaksi_batch ALTER COLUMN transaksi_id TYPE BIGINT USING transaksi_id::bigint"); err != nil {
			log.Printf("[MAIN] ⚠️  Failed to fix transaksi_batch transaksi_id: %v", err)
		}

		// 2.5 CLEANUP JUNK SYNC ITEMS (Backup tables)
		if _, err := database.DB.Exec("DELETE FROM sync_queue WHERE table_name LIKE 'transaksi_item_backup_%' OR table_name LIKE 'backup_%'"); err != nil {
			log.Printf("[MAIN] ⚠️  Failed to cleanup sync queue junk: %v", err)
		} else {
			log.Println("[MAIN] 🧹 Cleaned up junk backup items from sync queue.")
		}

		// 3. RESET FAILED SYNC ITEMS (Critical for resolving FK dependency jams)
		// If parents failed before, they block children. We must retry EVERYTHING now that schema is fixed.
		if _, err := database.DB.Exec("UPDATE sync_queue SET status = 'pending', retry_count = 0 WHERE status = 'failed'"); err != nil {
			log.Printf("[MAIN] ⚠️  Failed to reset sync queue: %v", err)
		} else {
			log.Println("[MAIN] 🔄 Reset 'failed' sync items to 'pending' for retry.")
		}
	}

	// STEP 1.3: Run printer settings migration (fix invalid paperWidth from old versions)
	printerRepo := repository.NewPrinterRepository()
	printerRepo.FixInvalidPaperWidth()

	// STEP 1.5: Initialize Sync Engine if enabled
	syncConfig := config.GetSyncModeConfig()
	if syncConfig.Enabled {
		if err := sync.InitSyncEngine(syncConfig.SQLiteDSN, syncConfig.PostgresDSN); err == nil {
			// Connect SmartManager to Sync Engine (if SmartManager exists)
			if database.SmartManager != nil && sync.Engine != nil {
				database.SmartManager.SetSyncQueueFunc(sync.Engine.QueueSync)
			}

			// Setup sync engine shutdown
			defer func() {
				if sync.Engine != nil {
					sync.Engine.Stop()
				}
			}()

			// Trigger Initial Sync if needed (Push Desktop -> Web)
			go func() {
				// Wait a bit for everything to settle
				time.Sleep(2 * time.Second)
				log.Println("[SYNC] 🔄 FORCING INITIAL SYNC RETRY...")

				// FORCE RESET: Clear the flag so it runs again
				if database.DB != nil {
					_, _ = database.DB.Exec("DELETE FROM sync_meta WHERE key = 'initial_sync_completed'")
				}

				if sync.Engine != nil {
					// Dump pending queue stats for diagnostics
					sync.Engine.DumpQueueStats()

					if err := sync.Engine.TriggerInitialSync(false); err != nil {
						log.Printf("[SYNC] Failed to trigger initial sync: %v", err)
					}
				}
			}()
		}
	}

	// STEP 2: Create SERVICE CONTAINER (shared by both Wails & HTTP)
	services := container.NewServiceContainer()
	// STEP 3: Create Wails app and inject services
	app := NewApp()
	app.SetServices(services)

	// STEP 4: Check if web server is enabled
	serverConfig := config.GetServerConfig()

	var httpServer *httpserver.Server
	if serverConfig.Enabled {

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
			httpServer.Shutdown(ctx)
		}()

		// Handle OS signals for graceful shutdown
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		go func() {
			<-sigChan
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
		// Block until signal received
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

	} else {
		os.Setenv("WEBVIEW2_USER_DATA_FOLDER", filepath.Join(os.TempDir(), "Ritel-App-v1.0.1"))
		err := wails.Run(&options.App{
			Title:  "Ritel-App v1.0.1",
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
		}
	}

	log.SetOutput(os.Stdout)
}
