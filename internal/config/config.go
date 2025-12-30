package config

import (
	"fmt"
	"os"
	"path/filepath"

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
	// Try to load .env file from current directory
	currentDir, _ := os.Getwd()
	envPathCurrent := filepath.Join(currentDir, ".env")

	if err := godotenv.Load(envPathCurrent); err == nil {
		EnvFileLoaded = true
		EnvFilePath = envPathCurrent
		fmt.Printf("✓ File .env berhasil dimuat dari: %s\n", envPathCurrent)
		return
	}

	// Try to load from executable directory
	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		envPathExe := filepath.Join(exeDir, ".env")

		if err := godotenv.Load(envPathExe); err == nil {
			EnvFileLoaded = true
			EnvFilePath = envPathExe
			fmt.Printf("✓ File .env berhasil dimuat dari: %s\n", envPathExe)
			return
		}
	}

	// No .env file found
	EnvFileLoaded = false
	EnvFilePath = ""
	fmt.Println("⚠ File .env tidak ditemukan, menggunakan konfigurasi default")
}

// GetDatabaseConfig returns database configuration from environment variables or .env file
// Falls back to SQLite defaults for development
func GetDatabaseConfig() DatabaseConfig {
	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		driver = "sqlite3" // Default to SQLite for development
	}

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
	// Default DSN based on driver
		if driver == "sqlite3" {
			dsn = "./ritel.db"
		} else if driver == "postgres" {
			// Default PostgreSQL connection string
			dsn = "host=localhost port=5432 user=postgres password=postgres dbname=ritel_db sslmode=disable"
		}
	}

	// Print configuration info
	PrintDatabaseConfigInfo(driver, dsn)

	return DatabaseConfig{
		Driver: driver,
		DSN:    dsn,
	}
}

// PrintDatabaseConfigInfo prints database configuration information
func PrintDatabaseConfigInfo(driver, dsn string) {
	fmt.Println("")
	fmt.Println("📋 KONFIGURASI DATABASE")
	fmt.Println("========================================")

	if EnvFileLoaded {
		fmt.Printf("✓ Sumber: File .env\n")
		fmt.Printf("  Lokasi: %s\n", EnvFilePath)
	} else {
		fmt.Printf("⚠ Sumber: Konfigurasi Default\n")
		fmt.Printf("  (File .env tidak ditemukan)\n")
	}

	fmt.Printf("🔧 Driver: %s\n", driver)

	// Mask password in DSN for security
	maskedDSN := MaskPassword(dsn)
	fmt.Printf("🔗 DSN: %s\n", maskedDSN)
	fmt.Println("========================================")
	fmt.Println("")
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

// GetSyncModeConfig returns configuration for sync mode (offline-first with auto-sync)
func GetSyncModeConfig() SyncModeConfig {
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
			Driver: "postgres",
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
