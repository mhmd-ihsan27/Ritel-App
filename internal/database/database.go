package database

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"ritel-app/internal/config"
	"ritel-app/internal/database/dialect"
	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB
var CurrentDialect dialect.Dialect
var CurrentDriver string // Store the current database driver name ("postgres" or "sqlite3")

// Dual database mode variables
var UseDualMode bool
var DBPostgres *sql.DB
var DBSQLite *sql.DB
var PostgresDialect dialect.Dialect
var SQLiteDialect dialect.Dialect

// IsPostgreSQL returns true if the current database is PostgreSQL
// This is a more reliable check than CurrentDialect which might be nil
func IsPostgreSQL() bool {
	return CurrentDriver == "postgres"
}

// IsSQLite returns true if the current database is SQLite
func IsSQLite() bool {
	return CurrentDriver == "sqlite3"
}

// Database paths and directories
const (
	AppDirName    = "ritel-app"
	DatabaseName  = "ritel.db"
	BackupDirName = "backups"
	OldAppDirName = ".ritel-app"
)

// InitDB initializes the database (SQLite or PostgreSQL) based on configuration.
func InitDB() error {
	// Check if dual mode is enabled
	dualConfig := config.GetDualDatabaseConfig()
	if dualConfig.UseDualMode {
		return initDualDatabase(dualConfig)
	}

	// Single database mode
	dbConfig := config.GetDatabaseConfig()

	fmt.Println("========================================")
	if dbConfig.Driver == "sqlite3" {
		fmt.Println("💾 SQLITE MODE")
	} else if dbConfig.Driver == "postgres" {
		fmt.Println("📊 POSTGRESQL MODE")
	}
	fmt.Println("========================================")

	// Initialize the appropriate dialect and store driver name
	CurrentDriver = dbConfig.Driver // Store for reliable detection
	switch dbConfig.Driver {
	case "postgres":
		fmt.Print("📊 Menghubungkan ke PostgreSQL... ")
		CurrentDialect = &dialect.PostgreSQLDialect{}
	case "sqlite3":
		fmt.Print("💾 Menghubungkan ke SQLite... ")
		CurrentDialect = &dialect.SQLiteDialect{}
	default:
		return fmt.Errorf("unsupported database driver: %s", dbConfig.Driver)
	}

	// For SQLite, handle file-based initialization
	var dbPath string
	var dsn string
	if dbConfig.Driver == "sqlite3" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("failed to get home directory: %w", err)
		}

		newAppDir := filepath.Join(homeDir, AppDirName)
		oldAppDir := filepath.Join(homeDir, OldAppDirName)

		// Ensure the new application directory exists
		if err := ensureAppDirectory(newAppDir); err != nil {
			return err
		}

		// Safely migrate data from the old hidden directory if it exists
		if err := performDirectoryMigration(oldAppDir, newAppDir); err != nil {
			log.Printf("Warning: Failed to migrate from old directory: %v", err)
			log.Println("Please manually move your data from ~/.ritel-app to ~/ritel-app if needed")
		}

		dbPath = filepath.Join(newAppDir, DatabaseName)
		dsn = dbPath

		// Create a backup of the existing database before making any changes
		if err := createFileBackup(dbPath); err != nil {
			log.Printf("Warning: Failed to create initial backup: %v", err)
		}
	} else {
		// For PostgreSQL, use the DSN from config
		dsn = dbConfig.DSN
	}

	// Open database connection and configure it for safety and performance
	db, err := openAndConfigureDB(dbConfig.Driver, dsn)
	if err != nil {
		fmt.Println("❌ GAGAL")
		return err
	}
	DB = db
	fmt.Println("✓ BERHASIL")

	if dbConfig.Driver == "sqlite3" {
		fmt.Printf("📁 Lokasi database: %s\n", dbPath)
	}

	// Validate integrity, create tables, run migrations, and fix schema issues
	fmt.Println("⚙️  Menyiapkan schema database...")
	if err := setupAndValidateDatabaseSchema(); err != nil {
		return fmt.Errorf("failed to setup database schema: %w", err)
	}

	fmt.Println("✓ Database siap digunakan!")
	fmt.Println("========================================")
	return nil
}

// initDualDatabase initializes both PostgreSQL and SQLite databases for dual-write mode
func initDualDatabase(dualConfig config.DualDatabaseConfig) error {
	UseDualMode = true

	fmt.Println("========================================")
	fmt.Println("🔄 DUAL DATABASE MODE")
	fmt.Println("========================================")

	// Initialize PostgreSQL
	fmt.Print("📊 Menghubungkan ke PostgreSQL... ")
	PostgresDialect = &dialect.PostgreSQLDialect{}
	postgresDB, err := openAndConfigureDB(dualConfig.PostgreSQL.Driver, dualConfig.PostgreSQL.DSN)
	if err != nil {
		fmt.Println("❌ GAGAL")
		return fmt.Errorf("failed to initialize PostgreSQL: %w", err)
	}
	DBPostgres = postgresDB
	fmt.Println("✓ BERHASIL")

	// Initialize SQLite
	fmt.Print("💾 Menghubungkan ke SQLite... ")
	SQLiteDialect = &dialect.SQLiteDialect{}
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	newAppDir := filepath.Join(homeDir, AppDirName)
	if err := ensureAppDirectory(newAppDir); err != nil {
		return fmt.Errorf("failed to create app directory: %w", err)
	}

	oldAppDir := filepath.Join(homeDir, OldAppDirName)
	if err := performDirectoryMigration(oldAppDir, newAppDir); err != nil {
		log.Printf("Warning: Failed to migrate from old directory: %v", err)
	}

	dbPath := filepath.Join(newAppDir, DatabaseName)
	if err := createFileBackup(dbPath); err != nil {
		log.Printf("Warning: Failed to create initial backup: %v", err)
	}

	sqliteDB, err := openAndConfigureDB(dualConfig.SQLite.Driver, dbPath)
	if err != nil {
		fmt.Println("❌ GAGAL")
		return fmt.Errorf("failed to initialize SQLite: %w", err)
	}
	DBSQLite = sqliteDB
	fmt.Println("✓ BERHASIL")

	// Set DB to PostgreSQL as primary for read operations
	DB = DBPostgres
	CurrentDialect = PostgresDialect
	CurrentDriver = "postgres" // Set for reliable database detection

	fmt.Println("----------------------------------------")
	fmt.Println("📍 PostgreSQL: Primary (Read/Write)")
	fmt.Println("📍 SQLite: Backup (Write)")
	fmt.Println("----------------------------------------")

	// Setup schema on both databases
	fmt.Println("⚙️  Menyiapkan schema database...")
	if err := setupDualDatabaseSchema(); err != nil {
		return fmt.Errorf("failed to setup dual database schema: %w", err)
	}

	fmt.Println("✓ Dual database mode aktif!")
	fmt.Println("========================================")
	return nil
}

// setupDualDatabaseSchema sets up schema on both databases
func setupDualDatabaseSchema() error {
	// Setup PostgreSQL schema
	CurrentDialect = PostgresDialect
	originalDB := DB
	DB = DBPostgres

	if err := setupAndValidateDatabaseSchema(); err != nil {
		DB = originalDB
		return fmt.Errorf("failed to setup PostgreSQL schema: %w", err)
	}

	// Setup SQLite schema
	CurrentDialect = SQLiteDialect
	DB = DBSQLite

	if err := setupAndValidateDatabaseSchema(); err != nil {
		DB = originalDB
		CurrentDialect = PostgresDialect
		return fmt.Errorf("failed to setup SQLite schema: %w", err)
	}

	// Restore to PostgreSQL as primary
	DB = originalDB
	CurrentDialect = PostgresDialect

	return nil
}

// ensureAppDirectory creates the application data directory if it doesn't exist.
func ensureAppDirectory(appDir string) error {
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return fmt.Errorf("failed to create app directory: %w", err)
	}
	return nil
}

// performDirectoryMigration safely moves data from an old directory to a new one.
// It uses a copy-verify-delete strategy instead of a direct rename to prevent data loss
// if the application crashes during the operation.
func performDirectoryMigration(oldDir, newDir string) error {
	if _, err := os.Stat(oldDir); os.IsNotExist(err) {
		log.Println("No old data directory found, starting fresh.")
		return nil
	}

	log.Printf("================================================")
	log.Printf("[MIGRATION] Found old data at %s", oldDir)
	log.Printf("[MIGRATION] Starting safe migration to %s", newDir)
	log.Printf("================================================")

	// Ensure the new directory exists before copying
	if err := ensureAppDirectory(newDir); err != nil {
		return fmt.Errorf("gagal membuat direktori baru: %w", err)
	}

	// Copy and verify the main database file
	oldDbPath := filepath.Join(oldDir, DatabaseName)
	newDbPath := filepath.Join(newDir, DatabaseName)
	if _, err := os.Stat(oldDbPath); err == nil {
		if _, err := os.Stat(newDbPath); os.IsNotExist(err) {
			log.Printf("[MIGRATION] Copying database file...")
			if err := copyAndVerifyFile(oldDbPath, newDbPath); err != nil {
				return fmt.Errorf("failed to copy and verify database file: %w", err)
			}
			log.Printf("[MIGRATION] ✓ Database file copied and verified")
		} else {
			log.Printf("[MIGRATION] Database file already exists in new location, skipping copy.")
		}
	}

	// Copy and verify the backup directory
	oldBackupDir := filepath.Join(oldDir, BackupDirName)
	newBackupDir := filepath.Join(newDir, BackupDirName)
	if _, err := os.Stat(oldBackupDir); err == nil {
		log.Printf("[MIGRATION] Copying backup directory...")
		if err := copyDir(oldBackupDir, newBackupDir); err != nil {
			return fmt.Errorf("failed to copy backup directory: %w", err)
		}
		log.Printf("[MIGRATION] ✓ Backup directory copied")
	}

	// After successful copy, attempt to remove the old directory
	// It's okay if this fails, as the data is already safe in the new location.
	if err := os.RemoveAll(oldDir); err != nil {
		log.Printf("[MIGRATION] Note: Could not remove old directory (may not be empty): %v", err)
	}

	// Create a README file in the old location to inform the user
	createReadmeFile(oldDir, newDir)

	log.Printf("================================================")
	log.Printf("[MIGRATION] Migration complete. Data is now at %s", newDir)
	log.Printf("================================================")
	return nil
}

// copyAndVerifyFile copies a file from src to dst and then verifies that the
// destination file size matches the source. This is safer than a direct rename.
func copyAndVerifyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file: %w", err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer destFile.Close()

	bytesWritten, err := io.Copy(destFile, sourceFile)
	if err != nil {
		return fmt.Errorf("failed to copy file content: %w", err)
	}

	// Verify file size
	sourceInfo, err := os.Stat(src)
	if err != nil {
		return fmt.Errorf("failed to stat source file for verification: %w", err)
	}

	if bytesWritten != sourceInfo.Size() {
		return fmt.Errorf("verification failed: copied size (%d) does not match source size (%d)", bytesWritten, sourceInfo.Size())
	}

	return nil
}

// copyDir recursively copies a directory tree.
func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		destPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(destPath, info.Mode())
		}

		return copyAndVerifyFile(path, destPath)
	})
}

// openAndConfigureDB opens the database, sets connection pool, and applies dialect-specific settings.
func openAndConfigureDB(driver, dsn string) (*sql.DB, error) {
	// For SQLite, add connection parameters
	if driver == "sqlite3" {
		dsn = dsn + "?_foreign_keys=on&_journal_mode=WAL"
	}

	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	configureConnectionPool(db)

	if err := testConnectionAndSetPragmas(db, driver); err != nil {
		return nil, fmt.Errorf("database connection test failed: %w", err)
	}

	return db, nil
}

// configureConnectionPool sets optimal and safer connection pool parameters.
func configureConnectionPool(db *sql.DB) {
	// Increased from 5 minutes to 30 to reduce chances of a connection closing during a long operation.
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetMaxIdleConns(10)
	db.SetMaxOpenConns(25)
}

// testConnectionAndSetPragmas pings the DB and sets database-specific settings.
func testConnectionAndSetPragmas(db *sql.DB, driver string) error {
	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	// Apply SQLite-specific PRAGMA statements
	if driver == "sqlite3" {
		_, err := db.Exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")
		if err != nil {
			return fmt.Errorf("failed to set database pragmas: %w", err)
		}
	}

	return nil
}

// TranslateQuery translates a SQL query to the current database dialect
func TranslateQuery(query string) string {
	if CurrentDialect == nil {
		return query
	}
	return dialect.TranslateQuery(query, CurrentDialect)
}

// QueryRow is a wrapper around DB.QueryRow that translates the query
// In dual mode, queries are executed on PostgreSQL (primary)
func QueryRow(query string, args ...interface{}) *sql.Row {
	translatedQuery := TranslateQuery(query)
	return DB.QueryRow(translatedQuery, args...)
}

// Query is a wrapper around DB.Query that translates the query
// In dual mode, queries are executed on PostgreSQL (primary)
func Query(query string, args ...interface{}) (*sql.Rows, error) {
	translatedQuery := TranslateQuery(query)
	return DB.Query(translatedQuery, args...)
}

// Exec is a wrapper around DB.Exec that translates the query
// In dual mode, executes on both PostgreSQL and SQLite
func Exec(query string, args ...interface{}) (sql.Result, error) {
	if !UseDualMode {
		translatedQuery := TranslateQuery(query)
		return DB.Exec(translatedQuery, args...)
	}

	// Dual mode: write to both databases
	return execDual(query, args...)
}

// execDual executes a query on both PostgreSQL and SQLite databases
func execDual(query string, args ...interface{}) (sql.Result, error) {
	// Execute on PostgreSQL
	postgresQuery := dialect.TranslateQuery(query, PostgresDialect)
	resultPostgres, err := DBPostgres.Exec(postgresQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("PostgreSQL exec failed: %w", err)
	}

	// Execute on SQLite
	sqliteQuery := dialect.TranslateQuery(query, SQLiteDialect)
	_, err = DBSQLite.Exec(sqliteQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("SQLite exec failed: %w", err)
	}

	// Return PostgreSQL result as primary
	return resultPostgres, nil
}

// Prepare is a wrapper around DB.Prepare that translates the query
func Prepare(query string) (*sql.Stmt, error) {
	translatedQuery := TranslateQuery(query)
	return DB.Prepare(translatedQuery)
}

// DualTx represents a transaction on both databases
type DualTx struct {
	PostgresTx *sql.Tx
	SQLiteTx   *sql.Tx
}

// Begin starts a transaction. In dual mode, starts transactions on both databases
// Note: For dual mode, use BeginDual() instead to get proper dual transaction handling
func Begin() (*sql.Tx, error) {
	return DB.Begin()
}

// BeginDual starts transactions on both databases and returns a DualTx
func BeginDual() (*DualTx, error) {
	if !UseDualMode {
		tx, err := DB.Begin()
		if err != nil {
			return nil, err
		}
		return &DualTx{PostgresTx: tx, SQLiteTx: nil}, nil
	}

	// Start transaction on PostgreSQL
	postgresTx, err := DBPostgres.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin PostgreSQL transaction: %w", err)
	}

	// Start transaction on SQLite
	sqliteTx, err := DBSQLite.Begin()
	if err != nil {
		postgresTx.Rollback()
		return nil, fmt.Errorf("failed to begin SQLite transaction: %w", err)
	}

	return &DualTx{
		PostgresTx: postgresTx,
		SQLiteTx:   sqliteTx,
	}, nil
}

// Exec executes a query in the dual transaction
func (dt *DualTx) Exec(query string, args ...interface{}) (sql.Result, error) {
	if !UseDualMode || dt.SQLiteTx == nil {
		translatedQuery := dialect.TranslateQuery(query, CurrentDialect)
		return dt.PostgresTx.Exec(translatedQuery, args...)
	}

	// Execute on PostgreSQL
	postgresQuery := dialect.TranslateQuery(query, PostgresDialect)
	result, err := dt.PostgresTx.Exec(postgresQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("PostgreSQL transaction exec failed: %w", err)
	}

	// Execute on SQLite
	sqliteQuery := dialect.TranslateQuery(query, SQLiteDialect)
	_, err = dt.SQLiteTx.Exec(sqliteQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("SQLite transaction exec failed: %w", err)
	}

	return result, nil
}

// Commit commits both transactions
func (dt *DualTx) Commit() error {
	if !UseDualMode || dt.SQLiteTx == nil {
		return dt.PostgresTx.Commit()
	}

	// Commit PostgreSQL first
	if err := dt.PostgresTx.Commit(); err != nil {
		dt.SQLiteTx.Rollback()
		return fmt.Errorf("failed to commit PostgreSQL transaction: %w", err)
	}

	// Commit SQLite
	if err := dt.SQLiteTx.Commit(); err != nil {
		return fmt.Errorf("failed to commit SQLite transaction (PostgreSQL already committed): %w", err)
	}

	return nil
}

// Rollback rolls back both transactions
func (dt *DualTx) Rollback() error {
	if !UseDualMode || dt.SQLiteTx == nil {
		return dt.PostgresTx.Rollback()
	}

	var postgresErr, sqliteErr error

	// Rollback both databases
	if dt.PostgresTx != nil {
		postgresErr = dt.PostgresTx.Rollback()
	}

	if dt.SQLiteTx != nil {
		sqliteErr = dt.SQLiteTx.Rollback()
	}

	// Return combined error if any
	if postgresErr != nil || sqliteErr != nil {
		return fmt.Errorf("rollback errors - PostgreSQL: %v, SQLite: %v", postgresErr, sqliteErr)
	}

	return nil
}

// QueryRow executes a query that returns a single row in transaction
func (dt *DualTx) QueryRow(query string, args ...interface{}) *sql.Row {
	translatedQuery := dialect.TranslateQuery(query, PostgresDialect)
	return dt.PostgresTx.QueryRow(translatedQuery, args...)
}

// Query executes a query that returns rows in transaction
func (dt *DualTx) Query(query string, args ...interface{}) (*sql.Rows, error) {
	translatedQuery := dialect.TranslateQuery(query, PostgresDialect)
	return dt.PostgresTx.Query(translatedQuery, args...)
}

// setupAndValidateDatabaseSchema runs integrity checks, creates tables, and applies migrations.
func setupAndValidateDatabaseSchema() error {
	if err := validateDatabase(); err != nil {
		return fmt.Errorf("database integrity check failed: %w", err)
	}

	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	if err := runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Fix any existing schema issues with safe methods
	fixSchemaIssues()

	return nil
}

// fixSchemaIssues runs functions to fix known schema problems safely.
func fixSchemaIssues() {
	if err := FixTransaksiItemSchema(); err != nil {
		log.Printf("Warning: Failed to fix transaksi_item schema: %v", err)
	}

	if err := FixOrphanedTransactionItems(); err != nil {
		log.Printf("Warning: Failed to fix orphaned transaction items: %v", err)
	}
}

// createFileBackup creates a full file-level backup of the database.
func createFileBackup(dbPath string) error {
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		return nil // No database to backup yet
	}

	backupDir := filepath.Join(filepath.Dir(dbPath), BackupDirName)
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return fmt.Errorf("failed to create backup directory: %w", err)
	}

	timestamp := time.Now().Format("20060102_150405")
	backupPath := filepath.Join(backupDir, fmt.Sprintf("ritel_backup_%s.db", timestamp))

	if err := copyAndVerifyFile(dbPath, backupPath); err != nil {
		return fmt.Errorf("failed to create backup file: %w", err)
	}

	log.Printf("Database backup created and verified: %s", backupPath)
	return nil
}

// FixTransaksiItemSchema safely migrates the transaksi_item table to allow produk_id to be NULL.
// This uses a CREATE-COPY-DROP-RENAME strategy within a transaction to prevent data loss.
// NOTE: This migration is SQLite-specific. PostgreSQL schema is already correct from table creation.
func FixTransaksiItemSchema() error {
	// Skip this migration for PostgreSQL - the schema is already correct from table creation
	if IsPostgreSQL() {
		log.Println("[SCHEMA FIX] Skipping SQLite-specific migration for PostgreSQL")
		return nil
	}

	migrationName := "make_transaksi_item_produk_id_nullable"
	applied, err := isMigrationApplied(migrationName)
	if err != nil {
		return fmt.Errorf("failed to check migration status: %w", err)
	}
	if applied {
		log.Printf("[SCHEMA FIX] Migration '%s' already applied, skipping.", migrationName)
		return nil
	}

	log.Println("========================================")
	log.Printf("[SCHEMA FIX] Starting migration: %s", migrationName)
	log.Println("========================================")

	// 1. Create a full file backup before any schema changes
	homeDir, _ := os.UserHomeDir()
	appDir := filepath.Join(homeDir, AppDirName)
	dbPath := filepath.Join(appDir, DatabaseName)
	if err := createFileBackup(dbPath); err != nil {
		log.Printf("[SCHEMA FIX] Warning: Could not create pre-migration file backup: %v", err)
	}

	// 2. Perform the migration within a single, robust transaction
	tx, err := DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction for schema fix: %w", err)
	}
	// Use a named defer to ensure rollback happens if any error occurs
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p) // Re-throw panic after rollback
		} else if err != nil {
			tx.Rollback()
		}
	}()

	// 3. Create new table with the corrected schema
	log.Println("[SCHEMA FIX] Creating new table 'transaksi_item_new' with nullable produk_id...")
	createTableSQL := `
    CREATE TABLE transaksi_item_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaksi_id INTEGER NOT NULL,
        produk_id INTEGER NULL,
        produk_sku TEXT NOT NULL,
        produk_nama TEXT NOT NULL,
        produk_kategori TEXT,
        harga_satuan INTEGER NOT NULL,
        jumlah INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT,
        FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE SET NULL
    );`
	if _, err = tx.Exec(createTableSQL); err != nil {
		return fmt.Errorf("failed to create new table: %w", err)
	}

	// 4. Copy data from the old table to the new one
	log.Println("[SCHEMA FIX] Copying data to 'transaksi_item_new'...")
	copySQL := `
    INSERT INTO transaksi_item_new (
        id, transaksi_id, produk_id, produk_sku, produk_nama,
        produk_kategori, harga_satuan, jumlah, subtotal, created_at
    )
    SELECT
        id, transaksi_id, produk_id, produk_sku, produk_nama,
        produk_kategori, harga_satuan, jumlah, subtotal, created_at
    FROM transaksi_item;`
	result, err := tx.Exec(copySQL)
	if err != nil {
		return fmt.Errorf("failed to copy data to new table: %w", err)
	}
	rowsCopied, _ := result.RowsAffected()
	log.Printf("[SCHEMA FIX] Copied %d rows.", rowsCopied)

	// 5. Drop the old table
	log.Println("[SCHEMA FIX] Dropping old table 'transaksi_item'...")
	if _, err = tx.Exec("DROP TABLE transaksi_item;"); err != nil {
		return fmt.Errorf("failed to drop old table: %w", err)
	}

	// 6. Rename the new table to the original name
	log.Println("[SCHEMA FIX] Renaming 'transaksi_item_new' to 'transaksi_item'...")
	if _, err = tx.Exec("ALTER TABLE transaksi_item_new RENAME TO transaksi_item;"); err != nil {
		return fmt.Errorf("failed to rename new table: %w", err)
	}

	// 7. Record the successful migration
	if _, err = tx.Exec("INSERT INTO migrations (name) VALUES (?)", migrationName); err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	// 8. Commit the transaction
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit schema fix transaction: %w", err)
	}

	// Clear the defer function's error since commit was successful
	err = nil

	log.Println("[SCHEMA FIX] ✓ Schema fixed successfully!")
	log.Println("========================================")
	return nil
}

// FixOrphanedTransactionItems safely updates transaction items that reference deleted products.
// It creates a table backup before making changes.
func FixOrphanedTransactionItems() error {
	log.Println("========================================")
	log.Println("[DATABASE FIX] Starting FixOrphanedTransactionItems")
	log.Println("========================================")

	// 1. Create a backup of the table before making changes
	backupTableName := "transaksi_item_backup_" + time.Now().Format("20060102_150405")
	log.Printf("[DATABASE FIX] Creating table backup: %s", backupTableName)
	_, err := DB.Exec(fmt.Sprintf("CREATE TABLE %s AS SELECT * FROM transaksi_item;", backupTableName))
	if err != nil {
		return fmt.Errorf("failed to create table backup: %w", err)
	}

	// 2. Count and log what will be changed
	var count int
	query := `
    SELECT COUNT(*) FROM transaksi_item
    WHERE produk_id IS NOT NULL AND produk_id NOT IN (SELECT id FROM produk)`
	err = DB.QueryRow(query).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to count orphaned items: %w", err)
	}

	if count == 0 {
		log.Println("[DATABASE FIX] ✓ No orphaned transaction items found.")
		// Optional: drop the empty backup table
		// DB.Exec(fmt.Sprintf("DROP TABLE %s;", backupTableName))
		return nil
	}

	log.Printf("[DATABASE FIX] ⚠ Found %d orphaned items. Setting produk_id to NULL.", count)

	// 3. Perform the update within a transaction
	tx, err := DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		}
	}()

	updateQuery := `
    UPDATE transaksi_item
    SET produk_id = NULL
    WHERE produk_id IS NOT NULL AND produk_id NOT IN (SELECT id FROM produk)`
	result, err := tx.Exec(updateQuery)
	if err != nil {
		return fmt.Errorf("failed to update orphaned items: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected != int64(count) {
		// This is a sanity check, should not happen
		return fmt.Errorf("row count mismatch: expected to update %d, but updated %d", count, rowsAffected)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	err = nil // Clear defer error

	log.Printf("[DATABASE FIX] ✓ Successfully fixed %d orphaned items. Backup table: %s", rowsAffected, backupTableName)
	log.Println("========================================")
	return nil
}

// createReadmeFile creates a README file in the old directory after migration.
func createReadmeFile(oldDir, newDir string) {
	readmePath := filepath.Join(oldDir, "DATA_MOVED.txt")
	readmeContent := fmt.Sprintf(`Data aplikasi Ritel telah dipindahkan ke lokasi baru yang lebih mudah diakses.

Lokasi Baru: %s

Folder ini (%s) sekarang sudah tidak digunakan lagi.
Anda dapat dengan aman menghapus folder ini setelah memastikan data Anda ada di lokasi baru.

Terima kasih!`, newDir, oldDir)

	if err := os.WriteFile(readmePath, []byte(readmeContent), 0644); err != nil {
		log.Printf("[MIGRATION] Gagal membuat file informasi di lokasi lama: %v", err)
	} else {
		log.Printf("[MIGRATION] ✓ File informasi telah dibuat di lokasi lama.")
	}
}

// validateDatabase checks the integrity of the database (SQLite only).
func validateDatabase() error {
	// Only run integrity check for SQLite
	if CurrentDialect != nil && CurrentDialect.Name() == "sqlite3" {
		var integrity string
		err := DB.QueryRow("PRAGMA integrity_check").Scan(&integrity)
		if err != nil {
			return fmt.Errorf("failed to run integrity check: %w", err)
		}

		if integrity != "ok" {
			return fmt.Errorf("database integrity check failed: %s", integrity)
		}
	}
	return nil
}

// createTables creates all necessary tables, indexes, and triggers.
func createTables() error {
	// Create migrations table first
	if err := createMigrationsTable(); err != nil {
		return err
	}

	// Create all application tables
	tableQueries := getTableCreationQueries()
	for i, query := range tableQueries {
		translatedQuery := TranslateQuery(query)
		if _, err := DB.Exec(translatedQuery); err != nil {
			return fmt.Errorf("failed to execute table creation query %d: %w\nOriginal Query: %s\nTranslated Query: %s", i, err, query, translatedQuery)
		}
	}

	// Create indexes
	indexQueries := getIndexCreationQueries()
	for i, query := range indexQueries {
		translatedQuery := TranslateQuery(query)
		if _, err := DB.Exec(translatedQuery); err != nil {
			return fmt.Errorf("failed to create index %d: %w\nQuery: %s", i, err, translatedQuery)
		}
	}

	// Create triggers
	triggerQueries := getTriggerCreationQueries()
	for i, query := range triggerQueries {
		// Triggers need special handling for PostgreSQL vs SQLite
		if CurrentDialect != nil && CurrentDialect.Name() == "postgres" {
			// Skip SQLite-specific triggers for PostgreSQL
			// PostgreSQL uses different trigger syntax
			continue
		}
		translatedQuery := TranslateQuery(query)
		if _, err := DB.Exec(translatedQuery); err != nil {
			return fmt.Errorf("failed to create trigger %d: %w\nQuery: %s", i, err, translatedQuery)
		}
	}

	log.Println("All tables, indexes, and triggers created successfully")
	return nil
}

// createMigrationsTable creates the migrations tracking table.
func createMigrationsTable() error {
	var migrationTableQuery string

	// Use dialect-specific syntax
	if CurrentDialect != nil && CurrentDialect.Name() == "postgres" {
		migrationTableQuery = `
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
	} else {
		migrationTableQuery = `
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
	}

	if _, err := DB.Exec(migrationTableQuery); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	return nil
}

// getTableCreationQueries returns all table creation queries.
func getTableCreationQueries() []string {
	return []string{
		// Kategori table
		`CREATE TABLE IF NOT EXISTS kategori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT UNIQUE NOT NULL,
            deskripsi TEXT,
            icon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

		// Produk table
		`CREATE TABLE IF NOT EXISTS produk (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            barcode TEXT UNIQUE,
            nama TEXT NOT NULL,
            kategori TEXT,
            berat REAL DEFAULT 0,
            harga_beli INTEGER DEFAULT 0,
            harga_jual INTEGER NOT NULL,
            stok INTEGER DEFAULT 0,
            satuan TEXT DEFAULT 'kg',
            kadaluarsa TEXT,
            tanggal_masuk TEXT,
            deskripsi TEXT,
            gambar TEXT,
            masa_simpan_hari INTEGER DEFAULT 0,
            hari_pemberitahuan_kadaluarsa INTEGER DEFAULT 30,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

		// Keranjang table for scanned items
		`CREATE TABLE IF NOT EXISTS keranjang (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produk_id INTEGER NOT NULL,
            jumlah INTEGER DEFAULT 1,
            harga_beli INTEGER DEFAULT 0,
            subtotal INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE RESTRICT
        )`,

		// Transaksi table (Transaction header)
		`CREATE TABLE IF NOT EXISTS transaksi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nomor_transaksi TEXT UNIQUE NOT NULL,
            tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
            pelanggan_nama TEXT,
            pelanggan_telp TEXT,
            pelanggan_id INTEGER DEFAULT 0,
            staff_id INTEGER,
            staff_nama TEXT,
            subtotal INTEGER NOT NULL DEFAULT 0,
            diskon INTEGER DEFAULT 0,
            diskon_promo INTEGER DEFAULT 0,
            diskon_pelanggan INTEGER DEFAULT 0,
            poin_ditukar INTEGER DEFAULT 0,
            diskon_poin INTEGER DEFAULT 0,
            total INTEGER NOT NULL DEFAULT 0,
            total_bayar INTEGER NOT NULL DEFAULT 0,
            kembalian INTEGER DEFAULT 0,
            status TEXT DEFAULT 'selesai',
            catatan TEXT,
            kasir TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

		// Transaksi Item table (Transaction line items)
		`CREATE TABLE IF NOT EXISTS transaksi_item (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id INTEGER NOT NULL,
            produk_id INTEGER,
            produk_sku TEXT NOT NULL,
            produk_nama TEXT NOT NULL,
            produk_kategori TEXT,
            harga_satuan INTEGER NOT NULL,
            jumlah INTEGER NOT NULL,
            subtotal INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT,
            FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE SET NULL
        )`,

		// Pembayaran table (Payment methods)
		`CREATE TABLE IF NOT EXISTS pembayaran (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id INTEGER NOT NULL,
            metode TEXT NOT NULL,
            jumlah INTEGER NOT NULL,
            referensi TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT
        )`,

		// Pelanggan table (Customer management)
		`CREATE TABLE IF NOT EXISTS pelanggan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            telepon TEXT UNIQUE NOT NULL,
            email TEXT,
            tipe TEXT DEFAULT 'reguler',
            level INTEGER DEFAULT 1,
            poin INTEGER DEFAULT 0,
            diskon_persen INTEGER DEFAULT 0,
            total_transaksi INTEGER DEFAULT 0,
            total_belanja INTEGER DEFAULT 0,
            alamat TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

		// Promo table (Discount and promotion management)
		`CREATE TABLE IF NOT EXISTS promo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            kode TEXT UNIQUE,
            tipe TEXT NOT NULL,
            tipe_promo TEXT DEFAULT 'diskon_produk',
            nilai INTEGER NOT NULL,
            min_quantity INTEGER DEFAULT 0, 
            max_diskon INTEGER DEFAULT 0,
            buy_quantity INTEGER DEFAULT 0,
            get_quantity INTEGER DEFAULT 0,
            harga_bundling INTEGER DEFAULT 0,
            tipe_bundling TEXT DEFAULT 'harga_tetap',
            diskon_bundling INTEGER DEFAULT 0,
            produk_x INTEGER,
            produk_y INTEGER,
            tipe_buy_get TEXT DEFAULT 'sama',
            tanggal_mulai DATETIME,
            tanggal_selesai DATETIME,
            status TEXT DEFAULT 'aktif',
            deskripsi TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produk_x) REFERENCES produk(id) ON DELETE SET NULL,
            FOREIGN KEY (produk_y) REFERENCES produk(id) ON DELETE SET NULL
        )`,

		// Promo Produk table (Product-specific promotions)
		`CREATE TABLE IF NOT EXISTS promo_produk (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            promo_id INTEGER NOT NULL,
            produk_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (promo_id) REFERENCES promo(id) ON DELETE CASCADE,
            FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
        )`,

		// Returns table (Product return/exchange transactions)
		`CREATE TABLE IF NOT EXISTS returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id INTEGER NOT NULL,
            no_transaksi TEXT NOT NULL,
            return_date DATETIME NOT NULL,
            reason TEXT NOT NULL,
            type TEXT NOT NULL,
            replacement_product_id INTEGER,
            refund_amount INTEGER DEFAULT 0,
            refund_method TEXT,
            refund_status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaksi_id) REFERENCES transaksi(id) ON DELETE RESTRICT,
            FOREIGN KEY (replacement_product_id) REFERENCES produk(id) ON DELETE SET NULL
        )`,

		// Return Items table (Products in a return transaction)
		`CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES produk(id) ON DELETE RESTRICT
        )`,

		// Print Settings table (Printer configuration)
		`CREATE TABLE IF NOT EXISTS print_settings (
            id INTEGER PRIMARY KEY,
            printer_name TEXT DEFAULT '',
            paper_size TEXT DEFAULT '80mm',
            paper_width INTEGER DEFAULT 48,
            font_size TEXT DEFAULT 'medium',
            line_spacing INTEGER DEFAULT 1,
            left_margin INTEGER DEFAULT 0,
            dash_line_char TEXT DEFAULT '-',
            double_line_char TEXT DEFAULT '=',
            header_alignment TEXT DEFAULT 'center',
            title_alignment TEXT DEFAULT 'center',
            footer_alignment TEXT DEFAULT 'center',
            header_text TEXT DEFAULT 'TOKO RITEL',
            header_address TEXT DEFAULT 'Jl. Contoh No. 123',
            header_phone TEXT DEFAULT '0812-3456-7890',
            footer_text TEXT DEFAULT 'Terima kasih atas kunjungan Anda!',
            show_logo INTEGER DEFAULT 0,
            auto_print INTEGER DEFAULT 0,
            copies_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

		// Stok History table
		`CREATE TABLE IF NOT EXISTS stok_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produk_id INTEGER NOT NULL,
            stok_sebelum INTEGER NOT NULL,
            stok_sesudah INTEGER NOT NULL,
            perubahan INTEGER NOT NULL,
            jenis_perubahan TEXT NOT NULL,
            keterangan TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
        )`,

		// Batch table (for FIFO stock management with expiry)
		`CREATE TABLE IF NOT EXISTS batch (
            id TEXT PRIMARY KEY,
            produk_id INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 0,
            qty_tersisa INTEGER NOT NULL DEFAULT 0,
            tanggal_restok DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            masa_simpan_hari INTEGER NOT NULL,
            tanggal_kadaluarsa DATETIME NOT NULL,
            status TEXT DEFAULT 'fresh',
            supplier TEXT DEFAULT '',
            keterangan TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
        )`,

		// Users table (for admin and staff authentication)
		`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nama_lengkap TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'staff',
            status TEXT NOT NULL DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME
        )`,

		// Poin Settings table
		`CREATE TABLE IF NOT EXISTS poin_settings (
            id INTEGER PRIMARY KEY,
            point_value INTEGER DEFAULT 500,
            min_exchange INTEGER DEFAULT 100,
            min_transaction_for_points INTEGER DEFAULT 25000,
            level2_min_points INTEGER DEFAULT 500,
            level3_min_points INTEGER DEFAULT 1000,
            level2_min_spending INTEGER DEFAULT 5000000,
            level3_min_spending INTEGER DEFAULT 10000000,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
	}
}

// getIndexCreationQueries returns all index creation queries.
func getIndexCreationQueries() []string {
	return []string{
		`CREATE INDEX IF NOT EXISTS idx_produk_barcode ON produk(barcode)`,
		`CREATE INDEX IF NOT EXISTS idx_produk_sku ON produk(sku)`,
		`CREATE INDEX IF NOT EXISTS idx_kategori_nama ON kategori(nama)`,
		`CREATE INDEX IF NOT EXISTS idx_transaksi_nomor ON transaksi(nomor_transaksi)`,
		`CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal)`,
		`CREATE INDEX IF NOT EXISTS idx_transaksi_item_transaksi ON transaksi_item(transaksi_id)`,
		`CREATE INDEX IF NOT EXISTS idx_pelanggan_telepon ON pelanggan(telepon)`,
		`CREATE INDEX IF NOT EXISTS idx_pelanggan_tipe ON pelanggan(tipe)`,
		`CREATE INDEX IF NOT EXISTS idx_promo_kode ON promo(kode)`,
		`CREATE INDEX IF NOT EXISTS idx_promo_status ON promo(status)`,
		`CREATE INDEX IF NOT EXISTS idx_promo_produk_x ON promo(produk_x)`,
		`CREATE INDEX IF NOT EXISTS idx_promo_produk_y ON promo(produk_y)`,
		`CREATE INDEX IF NOT EXISTS idx_returns_transaksi ON returns(transaksi_id)`,
		`CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date)`,
		`CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id)`,
		`CREATE INDEX IF NOT EXISTS idx_stok_history_produk ON stok_history(produk_id)`,
		`CREATE INDEX IF NOT EXISTS idx_stok_history_tanggal ON stok_history(created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_batch_produk ON batch(produk_id)`,
		`CREATE INDEX IF NOT EXISTS idx_batch_status ON batch(status)`,
		`CREATE INDEX IF NOT EXISTS idx_batch_kadaluarsa ON batch(tanggal_kadaluarsa)`,
		`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
		`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
		`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`,
		`CREATE INDEX IF NOT EXISTS idx_pelanggan_deleted_at ON pelanggan(deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_produk_deleted_at ON produk(deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_promo_deleted_at ON promo(deleted_at)`,
		`CREATE INDEX IF NOT EXISTS idx_kategori_deleted_at ON kategori(deleted_at)`,
	}
}

// getTriggerCreationQueries returns all trigger creation queries.
func getTriggerCreationQueries() []string {
	return []string{
		// Triggers for updated_at
		`CREATE TRIGGER IF NOT EXISTS update_produk_timestamp
         AFTER UPDATE ON produk
         FOR EACH ROW
         BEGIN
             UPDATE produk SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_kategori_timestamp
         AFTER UPDATE ON kategori
         FOR EACH ROW
         BEGIN
             UPDATE kategori SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_pelanggan_timestamp
         AFTER UPDATE ON pelanggan
         FOR EACH ROW
         BEGIN
             UPDATE pelanggan SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_promo_timestamp
         AFTER UPDATE ON promo
         FOR EACH ROW
         BEGIN
             UPDATE promo SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_returns_timestamp
         AFTER UPDATE ON returns
         FOR EACH ROW
         BEGIN
             UPDATE returns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_poin_settings_timestamp
         AFTER UPDATE ON poin_settings
         FOR EACH ROW
         BEGIN
             UPDATE poin_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_batch_timestamp
         AFTER UPDATE ON batch
         FOR EACH ROW
         BEGIN
             UPDATE batch SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,

		`CREATE TRIGGER IF NOT EXISTS update_users_timestamp
         AFTER UPDATE ON users
         FOR EACH ROW
         BEGIN
             UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
         END`,
	}
}

// runMigrations runs database migrations with proper tracking.
func runMigrations() error {
	migrations := getMigrationList()

	for _, migration := range migrations {
		if err := runMigration(migration.name, migration.query); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	return nil
}

// getMigrationList returns all migrations to be applied.
func getMigrationList() []struct {
	name  string
	query string
} {
	return []struct {
		name  string
		query string
	}{
		{
			name:  "add_berat_column",
			query: `ALTER TABLE produk ADD COLUMN berat REAL DEFAULT 0`,
		},
		{
			name:  "add_gambar_column",
			query: `ALTER TABLE produk ADD COLUMN gambar TEXT`,
		},
		{
			name:  "add_pelanggan_id_column",
			query: `ALTER TABLE transaksi ADD COLUMN pelanggan_id INTEGER DEFAULT 0`,
		},
		{
			name:  "add_diskon_promo_column",
			query: `ALTER TABLE transaksi ADD COLUMN diskon_promo INTEGER DEFAULT 0`,
		},
		{
			name:  "add_diskon_pelanggan_column",
			query: `ALTER TABLE transaksi ADD COLUMN diskon_pelanggan INTEGER DEFAULT 0`,
		},
		{
			name:  "add_buy_quantity_column",
			query: `ALTER TABLE promo ADD COLUMN buy_quantity INTEGER DEFAULT 0`,
		},
		{
			name:  "add_get_quantity_column",
			query: `ALTER TABLE promo ADD COLUMN get_quantity INTEGER DEFAULT 0`,
		},
		{
			name:  "add_harga_bundling_column",
			query: `ALTER TABLE promo ADD COLUMN harga_bundling INTEGER DEFAULT 0`,
		},
		{
			name:  "add_tipe_promo_column",
			query: `ALTER TABLE promo ADD COLUMN tipe_promo TEXT DEFAULT 'diskon_produk'`,
		},
		{
			name:  "add_tipe_bundling_column",
			query: `ALTER TABLE promo ADD COLUMN tipe_bundling TEXT DEFAULT 'harga_tetap'`,
		},
		{
			name:  "add_diskon_bundling_column",
			query: `ALTER TABLE promo ADD COLUMN diskon_bundling INTEGER DEFAULT 0`,
		},
		{
			name:  "add_produk_x_column",
			query: `ALTER TABLE promo ADD COLUMN produk_x INTEGER`,
		},
		{
			name:  "add_produk_y_column",
			query: `ALTER TABLE promo ADD COLUMN produk_y INTEGER`,
		},
		{
			name:  "add_tipe_buy_get_column",
			query: `ALTER TABLE promo ADD COLUMN tipe_buy_get TEXT DEFAULT 'sama'`,
		},
		{
			name:  "add_pelanggan_alamat_column",
			query: `ALTER TABLE pelanggan ADD COLUMN alamat TEXT`,
		},
		{
			name:  "add_pelanggan_level_column",
			query: `ALTER TABLE pelanggan ADD COLUMN level INTEGER DEFAULT 1`,
		},
		{
			name:  "add_poin_ditukar_column",
			query: `ALTER TABLE transaksi ADD COLUMN poin_ditukar INTEGER DEFAULT 0`,
		},
		{
			name:  "add_diskon_poin_column",
			query: `ALTER TABLE transaksi ADD COLUMN diskon_poin INTEGER DEFAULT 0`,
		},
		{
			name:  "add_level2_min_points_column",
			query: `ALTER TABLE poin_settings ADD COLUMN level2_min_points INTEGER DEFAULT 500`,
		},
		{
			name:  "add_level3_min_points_column",
			query: `ALTER TABLE poin_settings ADD COLUMN level3_min_points INTEGER DEFAULT 1000`,
		},
		{
			name:  "add_returns_refund_amount_column",
			query: `ALTER TABLE returns ADD COLUMN refund_amount INTEGER DEFAULT 0`,
		},
		{
			name:  "add_returns_refund_method_column",
			query: `ALTER TABLE returns ADD COLUMN refund_method TEXT`,
		},
		{
			name:  "add_returns_refund_status_column",
			query: `ALTER TABLE returns ADD COLUMN refund_status TEXT DEFAULT 'pending'`,
		},
		{
			name:  "add_returns_notes_column",
			query: `ALTER TABLE returns ADD COLUMN notes TEXT`,
		},
		{
			name:  "add_masa_simpan_hari_column",
			query: `ALTER TABLE produk ADD COLUMN masa_simpan_hari INTEGER DEFAULT 0`,
		},
		{
			name:  "add_hari_pemberitahuan_kadaluarsa_column",
			query: `ALTER TABLE produk ADD COLUMN hari_pemberitahuan_kadaluarsa INTEGER DEFAULT 30`,
		},
		{
			name:  "add_transaksi_staff_id_column",
			query: `ALTER TABLE transaksi ADD COLUMN staff_id INTEGER`,
		},
		{
			name:  "add_transaksi_staff_nama_column",
			query: `ALTER TABLE transaksi ADD COLUMN staff_nama TEXT`,
		},
		{
			name:  "add_stok_history_tipe_kerugian_column",
			query: `ALTER TABLE stok_history ADD COLUMN tipe_kerugian TEXT`,
		},
		{
			name:  "add_stok_history_nilai_kerugian_column",
			query: `ALTER TABLE stok_history ADD COLUMN nilai_kerugian INTEGER DEFAULT 0`,
		},
		{
			name:  "add_transaksi_item_beratgram_column",
			query: `ALTER TABLE transaksi_item ADD COLUMN beratgram REAL DEFAULT 0`,
		},
		{
			name: "convert_stok_to_decimal",
			query: `
				-- Disable foreign key constraints temporarily
				PRAGMA foreign_keys = OFF;

				-- Drop temporary table if exists from previous failed migration
				DROP TABLE IF EXISTS produk_new;

				-- Create new table with REAL stok
				CREATE TABLE produk_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					sku TEXT UNIQUE NOT NULL,
					barcode TEXT UNIQUE,
					nama TEXT NOT NULL,
					kategori TEXT,
					berat REAL DEFAULT 0,
					harga_beli INTEGER DEFAULT 0,
					harga_jual INTEGER NOT NULL,
					stok REAL DEFAULT 0,
					satuan TEXT DEFAULT 'kg',
					kadaluarsa TEXT,
					tanggal_masuk TEXT,
					deskripsi TEXT,
					gambar TEXT,
					masa_simpan_hari INTEGER DEFAULT 0,
					hari_pemberitahuan_kadaluarsa INTEGER DEFAULT 30,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
				);

				-- Copy data from old table
				INSERT INTO produk_new SELECT * FROM produk;

				-- Drop old table
				DROP TABLE produk;

				-- Rename new table
				ALTER TABLE produk_new RENAME TO produk;

				-- Re-enable foreign key constraints
				PRAGMA foreign_keys = ON;
			`,
		},
		{
			name: "convert_batch_qty_to_decimal",
			query: `
				-- Disable foreign key constraints temporarily
				PRAGMA foreign_keys = OFF;

				-- Drop temporary table if exists from previous failed migration
				DROP TABLE IF EXISTS batch_new;

				-- Create new batch table with REAL qty
				CREATE TABLE batch_new (
					id TEXT PRIMARY KEY,
					produk_id INTEGER NOT NULL,
					qty REAL NOT NULL,
					qty_tersisa REAL NOT NULL,
					tanggal_restok DATETIME NOT NULL,
					masa_simpan_hari INTEGER NOT NULL,
					tanggal_kadaluarsa DATETIME NOT NULL,
					status TEXT DEFAULT 'fresh',
					supplier TEXT,
					keterangan TEXT,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
				);

				-- Copy data from old table
				INSERT INTO batch_new SELECT * FROM batch;

				-- Drop old table
				DROP TABLE batch;

				-- Rename new table
				ALTER TABLE batch_new RENAME TO batch;

				-- Re-enable foreign key constraints
				PRAGMA foreign_keys = ON;
			`,
		},
		{
			name: "convert_stok_history_to_decimal",
			query: `
				-- Disable foreign key constraints temporarily
				PRAGMA foreign_keys = OFF;

				-- Drop temporary table if exists from previous failed migration
				DROP TABLE IF EXISTS stok_history_new;

				-- Create new stok_history table with REAL fields
				CREATE TABLE stok_history_new (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					produk_id INTEGER NOT NULL,
					stok_sebelum REAL NOT NULL,
					stok_sesudah REAL NOT NULL,
					perubahan REAL NOT NULL,
					jenis_perubahan TEXT NOT NULL,
					keterangan TEXT,
					tipe_kerugian TEXT,
					nilai_kerugian INTEGER DEFAULT 0,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
				);

				-- Copy data from old table with explicit column mapping
				INSERT INTO stok_history_new (id, produk_id, stok_sebelum, stok_sesudah, perubahan, jenis_perubahan, keterangan, created_at)
				SELECT id, produk_id, stok_sebelum, stok_sesudah, perubahan, jenis_perubahan, keterangan, created_at
				FROM stok_history;

				-- Drop old table
				DROP TABLE stok_history;

				-- Rename new table
				ALTER TABLE stok_history_new RENAME TO stok_history;

				-- Re-enable foreign key constraints
				PRAGMA foreign_keys = ON;
			`,
		},
		{
			name:  "add_jenis_produk_column",
			query: `ALTER TABLE produk ADD COLUMN jenis_produk TEXT DEFAULT 'curah'`,
		},
		{
			name:  "add_promo_tipe_produk_berlaku_column",
			query: `ALTER TABLE promo ADD COLUMN tipe_produk_berlaku TEXT DEFAULT 'semua'`,
		},
		{
			name:  "add_print_settings_left_margin_column",
			query: `ALTER TABLE print_settings ADD COLUMN left_margin INTEGER DEFAULT 0`,
		},
		{
			name:  "add_pelanggan_deleted_at_column",
			query: `ALTER TABLE pelanggan ADD COLUMN deleted_at DATETIME`,
		},
		{
			name:  "add_produk_deleted_at_column",
			query: `ALTER TABLE produk ADD COLUMN deleted_at DATETIME`,
		},
		{
			name:  "add_promo_deleted_at_column",
			query: `ALTER TABLE promo ADD COLUMN deleted_at DATETIME`,
		},
		{
			name:  "add_kategori_deleted_at_column",
			query: `ALTER TABLE kategori ADD COLUMN deleted_at DATETIME`,
		},
		// PostgreSQL-specific migrations for decimal stock support
		{
			name:  "pg_convert_produk_stok_to_decimal",
			query: `ALTER TABLE produk ALTER COLUMN stok TYPE REAL`,
		},
		{
			name:  "pg_convert_batch_qty_to_decimal",
			query: `ALTER TABLE batch ALTER COLUMN qty TYPE REAL`,
		},
		{
			name:  "pg_convert_batch_qty_tersisa_to_decimal",
			query: `ALTER TABLE batch ALTER COLUMN qty_tersisa TYPE REAL`,
		},
		{
			name:  "pg_convert_stok_history_stok_sebelum_to_decimal",
			query: `ALTER TABLE stok_history ALTER COLUMN stok_sebelum TYPE REAL`,
		},
		{
			name:  "pg_convert_stok_history_stok_sesudah_to_decimal",
			query: `ALTER TABLE stok_history ALTER COLUMN stok_sesudah TYPE REAL`,
		},
		{
			name:  "pg_convert_stok_history_perubahan_to_decimal",
			query: `ALTER TABLE stok_history ALTER COLUMN perubahan TYPE REAL`,
		},
	}
}

// runMigration executes a single migration with proper error handling.
func runMigration(name, query string) error {
	// Skip PostgreSQL-specific migrations on SQLite
	if strings.HasPrefix(name, "pg_") && !IsPostgreSQL() {
		return nil
	}

	// Skip SQLite-specific migrations (using PRAGMA) on PostgreSQL
	if strings.Contains(query, "PRAGMA") && IsPostgreSQL() {
		return nil
	}

	// Check if migration has already been applied
	var count int
	checkQuery := TranslateQuery("SELECT COUNT(*) FROM migrations WHERE name = ?")
	err := DB.QueryRow(checkQuery, name).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check migration status for %s: %w", name, err)
	}

	if count > 0 {
		return nil
	}

	// Translate and execute migration
	translatedQuery := TranslateQuery(query)
	if _, err := DB.Exec(translatedQuery); err != nil {
		// Check if it's a duplicate column error (database specific)
		if !strings.Contains(err.Error(), "duplicate column") && !strings.Contains(err.Error(), "already exists") {
			return fmt.Errorf("failed to execute migration %s: %w", name, err)
		}
	}

	// Record migration
	insertQuery := TranslateQuery("INSERT INTO migrations (name) VALUES (?)")
	if _, err := DB.Exec(insertQuery, name); err != nil {
		return fmt.Errorf("failed to record migration %s: %w", name, err)
	}

	return nil
}

// isMigrationApplied checks if a migration has been applied.
func isMigrationApplied(name string) (bool, error) {
	var count int
	// Use QueryRow wrapper for proper placeholder translation (? -> $1 for PostgreSQL)
	err := QueryRow("SELECT COUNT(*) FROM migrations WHERE name = ?", name).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetMigrationHistory returns all applied migrations.
func GetMigrationHistory() ([]string, error) {
	rows, err := DB.Query("SELECT name, applied_at FROM migrations ORDER BY applied_at")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var migrations []string
	for rows.Next() {
		var name, appliedAt string
		if err := rows.Scan(&name, &appliedAt); err != nil {
			return nil, err
		}
		migrations = append(migrations, fmt.Sprintf("%s - %s", name, appliedAt))
	}

	return migrations, nil
}

// BackupDatabase creates a manual backup of the database.
func BackupDatabase() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	appDir := filepath.Join(homeDir, AppDirName)
	dbPath := filepath.Join(appDir, DatabaseName)
	return createFileBackup(dbPath)
}

// GetDatabaseInfo returns database statistics.
func GetDatabaseInfo() (map[string]interface{}, error) {
	info := make(map[string]interface{})

	// Table counts
	tables := []string{"produk", "kategori", "transaksi", "pelanggan", "promo"}
	for _, table := range tables {
		var count int
		err := DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&count)
		if err != nil {
			return nil, err
		}
		info[table+"_count"] = count
	}

	// Database size (dialect-specific)
	var err error
	if CurrentDialect != nil && CurrentDialect.Name() == "sqlite3" {
		var pageCount, pageSize int
		err = DB.QueryRow("PRAGMA page_count").Scan(&pageCount)
		if err != nil {
			return nil, err
		}
		err = DB.QueryRow("PRAGMA page_size").Scan(&pageSize)
		if err != nil {
			return nil, err
		}
		info["database_size_mb"] = (pageCount * pageSize) / (1024 * 1024)
	} else if CurrentDialect != nil && CurrentDialect.Name() == "postgres" {
		var sizeBytes int64
		err = DB.QueryRow("SELECT pg_database_size(current_database())").Scan(&sizeBytes)
		if err != nil {
			return nil, err
		}
		info["database_size_mb"] = sizeBytes / (1024 * 1024)
	} else {
		info["database_size_mb"] = 0
	}

	// Migration count
	var migrationCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM migrations").Scan(&migrationCount)
	if err != nil {
		return nil, err
	}
	info["migration_count"] = migrationCount

	return info, nil
}

// Close closes the database connection.
// In dual mode, closes both PostgreSQL and SQLite connections
func Close() error {
	if !UseDualMode {
		if DB != nil {
			// Run final integrity check before closing
			if err := validateDatabase(); err != nil {
				log.Printf("Warning: Database integrity check failed before closing: %v", err)
			}
			return DB.Close()
		}
		return nil
	}

	// Dual mode: close both databases
	var postgresErr, sqliteErr error

	if DBPostgres != nil {
		postgresErr = DBPostgres.Close()
	}

	if DBSQLite != nil {
		// Run integrity check on SQLite before closing
		originalDB := DB
		originalDialect := CurrentDialect
		DB = DBSQLite
		CurrentDialect = SQLiteDialect

		if err := validateDatabase(); err != nil {
			log.Printf("Warning: SQLite integrity check failed before closing: %v", err)
		}

		DB = originalDB
		CurrentDialect = originalDialect

		sqliteErr = DBSQLite.Close()
	}

	// Return combined error if any
	if postgresErr != nil || sqliteErr != nil {
		return fmt.Errorf("close errors - PostgreSQL: %v, SQLite: %v", postgresErr, sqliteErr)
	}

	return nil
}
