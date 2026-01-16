package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"log"

	"github.com/joho/godotenv"
)

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Driver string // "sqlite3", "postgres", or "dual"
	DSN    string // Data Source Name
}

// DualDatabaseConfig holds configuration for both databases when running in dual mode
type DualDatabaseConfig struct {
	UseDualMode bool
	PostgreSQL  DatabaseConfig
	SQLite      DatabaseConfig
}

// SyncModeConfig holds configuration for offline-first sync mode
type SyncModeConfig struct {
	Enabled     bool
	SQLiteDSN   string // Local SQLite database
	PostgresDSN string // Remote PostgreSQL server
}

var (
	// EnvFileLoaded indicates whether .env file was successfully loaded
	EnvFileLoaded bool
	// EnvFilePath stores the path of the loaded .env file
	EnvFilePath string
)

// init loads .env file if it exists
func init() {
	webOnly := false
	for _, arg := range os.Args[1:] {
		if arg == "--web" || arg == "-web" || arg == "web" {
			webOnly = true
			break
		}
	}
	if os.Getenv("WEB_ONLY") == "true" || os.Getenv("WEB_ONLY") == "1" {
		webOnly = true
	}

	var candidates []string
	if webOnly {
		candidates = []string{".env.web", ".env"}
		if os.Getenv("APP_MODE") == "" {
			_ = os.Setenv("APP_MODE", "web")
		}
	} else {
		candidates = []string{".env.desktop", ".env"}
		if os.Getenv("APP_MODE") == "" {
			_ = os.Setenv("APP_MODE", "desktop")
		}
	}

	tryLoad := func(dir string) bool {
		for _, name := range candidates {
			path := filepath.Join(dir, name)
			if err := godotenv.Load(path); err == nil {
				EnvFileLoaded = true
				EnvFilePath = path
				log.Printf("[CONFIG] ✓ File %s berhasil dimuat: %s\n", name, path)
				return true
			}
		}
		return false
	}

	currentDir, _ := os.Getwd()
	if tryLoad(currentDir) {
		return
	}

	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		if tryLoad(exeDir) {
			return
		}
		log.Printf("[CONFIG] ⚠ Env file tidak ditemukan di exe dir: %s\n", exeDir)
	}

	EnvFileLoaded = false
	EnvFilePath = ""
	log.Println("[CONFIG] ⚠ Env file tidak ditemukan, menggunakan konfigurasi default")
}

// GetDatabaseConfig returns database configuration from environment variables or .env file
// Falls back to SQLite defaults for development
func GetDatabaseConfig() DatabaseConfig {
	appMode := os.Getenv("APP_MODE")
	if appMode == "web" {
		driver := os.Getenv("WEB_DB_DRIVER")
		if driver == "" {
			driver = os.Getenv("DB_DRIVER")
		}
		if driver == "" {
			driver = "sqlite3"
		}

		dsn := os.Getenv("WEB_DB_DSN")
		if dsn == "" {
			dsn = os.Getenv("DB_DSN")
		}
		if dsn == "" {
			if driver == "sqlite3" {
				dsn = "./ritel.db"
			} else if driver == "postgres" || driver == "pgx" {
				driver = "pgx"
				dsn = "postgres://postgres:postgres@localhost:5432/ritel_db?sslmode=disable"
			}
		}

		if driver == "postgres" || driver == "pgx" {
			if driver == "postgres" {
				dsn = ensureBinaryParameters(dsn)
			}
		}

		PrintDatabaseConfigInfo(driver, dsn)
		return DatabaseConfig{Driver: driver, DSN: dsn}
	}

	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		if appMode == "desktop" {
			driver = "sqlite3"
		} else {
			driver = "sqlite3"
		}
	}

	var dsn string
	// Try specific desktop env vars first if in desktop mode
	if appMode == "desktop" {
		if driver == "sqlite3" {
			dsn = os.Getenv("DESKTOP_DB_SQLITE_DSN")
		} else if driver == "postgres" || driver == "pgx" {
			dsn = os.Getenv("DESKTOP_DB_POSTGRES_DSN")
		}
	}

	if dsn == "" {
		dsn = os.Getenv("DB_DSN")
	}

	if dsn == "" {
		// Default DSN based on driver
		if driver == "sqlite3" {
			dsn = "./ritel.db"
		} else if driver == "postgres" || driver == "pgx" {
			// Use pgx driver for better compatibility with Transaction Pooling
			driver = "pgx"
			// Default PostgreSQL connection string in URI format (better for pgx)
			dsn = "postgres://postgres:postgres@localhost:5432/ritel_db?sslmode=disable"
		}
	}

	// Apply fix for transaction pooling if using Postgres/pgx
	if driver == "postgres" || driver == "pgx" {
		// Only apply binary_parameters for legacy lib/pq driver
		// pgx v5 handles this automatically and binary_parameters can cause issues
		// DON'T apply binary_parameters for pgx driver
		if driver == "postgres" {
			dsn = ensureBinaryParameters(dsn)
		}
	}
	// Note: pgx v5 driver doesn't need binary_parameters fix

	// Print configuration info
	PrintDatabaseConfigInfo(driver, dsn)

	return DatabaseConfig{
		Driver: driver,
		DSN:    dsn,
	}
}

// PrintDatabaseConfigInfo prints database configuration information
func PrintDatabaseConfigInfo(driver, dsn string) {
	log.Println("")
	log.Println("📋 KONFIGURASI DATABASE")
	log.Println("========================================")

	if EnvFileLoaded {
		log.Printf("✓ Sumber: File .env\n")
		log.Printf("  Lokasi: %s\n", EnvFilePath)
	} else {
		log.Printf("⚠ Sumber: Konfigurasi Default\n")
		log.Printf("  (File .env tidak ditemukan)\n")
	}

	log.Printf("🔧 Driver: %s\n", driver)

	// Mask password in DSN for security
	maskedDSN := MaskPassword(dsn)
	log.Printf("🔗 DSN: %s\n", maskedDSN)
	log.Println("========================================")
	log.Println("")
}

// MaskPassword masks the password in database DSN for display
func MaskPassword(dsn string) string {
	// For PostgreSQL DSN, mask the password
	if len(dsn) > 20 && (dsn[:4] == "host" || dsn[:4] == "post") {
		// Simple masking for PostgreSQL DSN
		import_start := 0
		for i := 0; i < len(dsn)-8; i++ {
			if dsn[i:i+9] == "password=" {
				import_start = i + 9
				break
			}
		}
		if import_start > 0 {
			// Find the end of password (space or end of string)
			end := len(dsn)
			for i := import_start; i < len(dsn); i++ {
				if dsn[i] == ' ' {
					end = i
					break
				}
			}
			return dsn[:import_start] + "****" + dsn[end:]
		}
	}
	return dsn
}

// ensureBinaryParameters adds binary_parameters=yes to Postgres DSN if missing
// This fixes "pq: unexpected Parse response 'C'" error with PgBouncer/Supabase
func ensureBinaryParameters(dsn string) string {
	if strings.Contains(dsn, "binary_parameters=yes") {
		return dsn
	}

	// Check if it's a URI
	if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
		if strings.Contains(dsn, "?") {
			return dsn + "&binary_parameters=yes"
		}
		return dsn + "?binary_parameters=yes"
	}

	// Assume Key-Value format
	return dsn + " binary_parameters=yes"
}

// GetSyncModeConfig returns configuration for sync mode (offline-first with auto-sync)
func GetSyncModeConfig() SyncModeConfig {
	appMode := os.Getenv("APP_MODE")

	if appMode == "desktop" {
		mode := os.Getenv("DESKTOP_SYNC_MODE")
		if mode == "" {
			mode = os.Getenv("SYNC_MODE")
		}

		enabled := mode == "enabled" || mode == "true" || mode == "1" || mode == ""
		if !enabled {
			return SyncModeConfig{Enabled: false}
		}

		sqliteDSN := os.Getenv("DESKTOP_SYNC_SQLITE_DSN")
		if sqliteDSN == "" {
			sqliteDSN = os.Getenv("SYNC_SQLITE_DSN")
		}
		if sqliteDSN == "" {
			sqliteDSN = "./ritel.db"
		}

		postgresDSN := os.Getenv("DESKTOP_SYNC_POSTGRES_DSN")
		if postgresDSN == "" {
			postgresDSN = os.Getenv("SYNC_POSTGRES_DSN")
		}
		if postgresDSN == "" {
			postgresDSN = os.Getenv("DESKTOP_DB_POSTGRES_DSN")
		}
		if postgresDSN == "" {
			postgresDSN = os.Getenv("DB_POSTGRES_DSN")
		}
		if postgresDSN == "" {
			postgresDSN = "host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable"
		}

		return SyncModeConfig{
			Enabled:     true,
			SQLiteDSN:   sqliteDSN,
			PostgresDSN: postgresDSN,
		}
	}

	mode := os.Getenv("SYNC_MODE")

	if mode != "enabled" && mode != "true" {
		return SyncModeConfig{
			Enabled: false,
		}
	}

	// Get SQLite DSN for local storage
	sqliteDSN := os.Getenv("SYNC_SQLITE_DSN")
	if sqliteDSN == "" {
		sqliteDSN = "./ritel.db"
	}

	// Get PostgreSQL DSN for remote server
	postgresDSN := os.Getenv("SYNC_POSTGRES_DSN")
	if postgresDSN == "" {
		postgresDSN = "host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable"
	}

	return SyncModeConfig{
		Enabled:     true,
		SQLiteDSN:   sqliteDSN,
		PostgresDSN: postgresDSN,
	}
}

// GetDualDatabaseConfig returns configuration for dual database mode
// When DB_DRIVER=dual, both PostgreSQL and SQLite will be used simultaneously
func GetDualDatabaseConfig() DualDatabaseConfig {
	appMode := os.Getenv("APP_MODE")
	if appMode == "desktop" {
		postgresDSN := os.Getenv("DESKTOP_DB_POSTGRES_DSN")
		sqliteDSN := os.Getenv("DESKTOP_DB_SQLITE_DSN")
		if postgresDSN != "" || sqliteDSN != "" || os.Getenv("DESKTOP_USE_DUAL") == "true" || os.Getenv("DESKTOP_USE_DUAL") == "1" {
			if postgresDSN == "" {
				postgresDSN = os.Getenv("DB_POSTGRES_DSN")
			}
			if postgresDSN == "" {
				postgresDSN = "host=localhost port=5432 user=postgres password=postgres dbname=ritel_db sslmode=disable"
			}

			if sqliteDSN == "" {
				sqliteDSN = os.Getenv("DB_SQLITE_DSN")
			}
			if sqliteDSN == "" {
				sqliteDSN = "./ritel.db"
			}

			PrintDualDatabaseConfigInfo(postgresDSN, sqliteDSN)
			return DualDatabaseConfig{
				UseDualMode: true,
				PostgreSQL: DatabaseConfig{
					Driver: "pgx",
					DSN:    postgresDSN,
				},
				SQLite: DatabaseConfig{
					Driver: "sqlite3",
					DSN:    sqliteDSN,
				},
			}
		}
	}

	driver := os.Getenv("DB_DRIVER")

	// Check if dual mode is enabled
	if driver != "dual" {
		return DualDatabaseConfig{
			UseDualMode: false,
		}
	}

	// Get PostgreSQL DSN
	postgresDSN := os.Getenv("DB_POSTGRES_DSN")
	if postgresDSN == "" {
		postgresDSN = "host=localhost port=5432 user=postgres password=postgres dbname=ritel_db sslmode=disable"
	}

	// Get SQLite DSN
	sqliteDSN := os.Getenv("DB_SQLITE_DSN")
	if sqliteDSN == "" {
		sqliteDSN = "./ritel.db"
	}

	// Print dual configuration info
	PrintDualDatabaseConfigInfo(postgresDSN, sqliteDSN)

	return DualDatabaseConfig{
		UseDualMode: true,
		PostgreSQL: DatabaseConfig{
			Driver: "pgx", // Use pgx for better compatibility
			DSN:    postgresDSN,
		},
		SQLite: DatabaseConfig{
			Driver: "sqlite3",
			DSN:    sqliteDSN,
		},
	}
}

// PrintDualDatabaseConfigInfo prints dual database configuration information
func PrintDualDatabaseConfigInfo(postgresDSN, sqliteDSN string) {
	fmt.Println("")
	fmt.Println("📋 KONFIGURASI DUAL DATABASE")
	fmt.Println("========================================")

	if EnvFileLoaded {
		fmt.Printf("✓ Sumber: File .env\n")
		fmt.Printf("  Lokasi: %s\n", EnvFilePath)
	} else {
		fmt.Printf("⚠ Sumber: Konfigurasi Default\n")
		fmt.Printf("  (File .env tidak ditemukan)\n")
	}

	fmt.Println("----------------------------------------")
	fmt.Println("📊 PostgreSQL (Primary):")
	fmt.Printf("   %s\n", MaskPassword(postgresDSN))
	fmt.Println("----------------------------------------")
	fmt.Println("💾 SQLite (Backup):")
	fmt.Printf("   %s\n", sqliteDSN)
	fmt.Println("========================================")
	fmt.Println("")
}
