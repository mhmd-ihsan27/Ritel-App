package database

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
)

// Migration represents a database schema change
type Migration struct {
	Version int
	Name    string
	SQL     string
}

// migrations contains all database migrations in order
// Each migration will only run once (tracked in schema_migrations table)
var migrations = []Migration{
	{
		Version: 1,
		Name:    "add_promo_tipeproduk_v1",
		SQL: `
-- Add new columns for promo product type selection
ALTER TABLE promo ADD COLUMN tipe_produk VARCHAR(20) DEFAULT 'satuan';
ALTER TABLE promo ADD COLUMN min_gramasi INT DEFAULT 0;

-- Migrate existing diskon_produk promos
UPDATE promo
SET tipe_produk = (
    SELECT CASE 
        WHEN prod.satuan = 'kg' THEN 'curah' 
        ELSE 'satuan' 
    END
    FROM promo_produk pp
    INNER JOIN produk prod ON pp.produk_id = prod.id
    WHERE pp.promo_id = promo.id
    LIMIT 1
)
WHERE tipe_promo = 'diskon_produk'
  AND (tipe_produk IS NULL OR tipe_produk = '');

-- Set default values
UPDATE promo SET tipe_produk = 'satuan' WHERE tipe_produk IS NULL OR tipe_produk = '';
UPDATE promo SET min_gramasi = 100 WHERE tipe_promo = 'diskon_produk' AND tipe_produk = 'curah' AND (min_gramasi IS NULL OR min_gramasi = 0);
UPDATE promo SET min_quantity = 1 WHERE tipe_promo = 'diskon_produk' AND tipe_produk = 'satuan' AND (min_quantity IS NULL OR min_quantity = 0);
`,
	},
	{
		Version: 2,
		Name:    "fix_postgres_bigint_ids",
		SQL: `
-- Ensure IDs are BIGINT for PostgreSQL to support 18-digit Snowflake IDs from offline mode
-- This is naturally handled by SQLite (INTEGER is 64-bit), but Postgres INT is 32-bit.

-- Users table
ALTER TABLE IF EXISTS users ALTER COLUMN id TYPE BIGINT;

-- Transaksi Batch table
ALTER TABLE IF EXISTS transaksi_batch ALTER COLUMN id TYPE BIGINT;
ALTER TABLE IF EXISTS transaksi_batch ALTER COLUMN transaksi_id TYPE BIGINT;

-- Schema Migrations (should be robust enough, but good practice)
ALTER TABLE IF EXISTS schema_migrations ALTER COLUMN version TYPE BIGINT;

-- Shift tables (if they exist and use offline IDs)
ALTER TABLE IF EXISTS shift_settings ALTER COLUMN id TYPE BIGINT;
ALTER TABLE IF EXISTS shift_cashier ALTER COLUMN id TYPE BIGINT;

-- Sync Queue (meta table)
ALTER TABLE IF EXISTS sync_queue ALTER COLUMN id TYPE BIGINT;
`,
	},
	{
		Version: 3,
		Name:    "force_fix_postgres_bigint_ids_v2",
		SQL: `
-- Force IDs to BIGINT for PostgreSQL again (in case V2 was skipped or failed silently)
-- Users table
ALTER TABLE IF EXISTS users ALTER COLUMN id TYPE BIGINT;

-- Transaksi Batch
ALTER TABLE IF EXISTS transaksi_batch ALTER COLUMN id TYPE BIGINT;
ALTER TABLE IF EXISTS transaksi_batch ALTER COLUMN transaksi_id TYPE BIGINT;

-- Shift tables
ALTER TABLE IF EXISTS shift_settings ALTER COLUMN id TYPE BIGINT;
ALTER TABLE IF EXISTS shift_cashier ALTER COLUMN id TYPE BIGINT;
`,
	},
}

// RunMigrations executes all pending database migrations
// This should be called during application startup
func RunMigrations(db *sql.DB) error {
	log.Println("[MIGRATIONS] Starting database migration check...")

	// Create schema_migrations table if it doesn't exist
	if err := ensureMigrationsTable(db); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get current database version
	currentVersion, err := getCurrentVersion(db)
	if err != nil {
		return fmt.Errorf("failed to get current version: %w", err)
	}

	log.Printf("[MIGRATIONS] Current database version: %d", currentVersion)

	// Run pending migrations
	migrationsRun := 0
	for _, migration := range migrations {
		if migration.Version <= currentVersion {
			continue
		}

		log.Printf("[MIGRATIONS] Running migration %d: %s", migration.Version, migration.Name)

		// Start transaction for this migration
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction for migration %d: %w", migration.Version, err)
		}

		// Execute migration SQL
		// SKIP logic for Postgres-specific migrations on SQLite
		if !IsPostgreSQL() && (migration.Name == "fix_postgres_bigint_ids" || migration.Name == "force_fix_postgres_bigint_ids_v2") {
			log.Printf("[MIGRATIONS] Check skipped for migration %d: %s (Postgres specific)", migration.Version, migration.Name)
		} else {
			if err := executeMigration(tx, migration); err != nil {
				tx.Rollback()
				return fmt.Errorf("migration %d (%s) failed: %w", migration.Version, migration.Name, err)
			}
		}

		// Record migration in schema_migrations
		if err := recordMigration(tx, migration); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %d: %w", migration.Version, err)
		}

		// Commit transaction
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %d: %w", migration.Version, err)
		}

		log.Printf("[MIGRATIONS] ✓ Completed migration %d: %s", migration.Version, migration.Name)
		migrationsRun++
	}

	if migrationsRun == 0 {
		log.Println("[MIGRATIONS] ✓ Database is up to date")
	} else {
		log.Printf("[MIGRATIONS] ✓ Successfully ran %d migration(s)", migrationsRun)
	}

	return nil
}

// ensureMigrationsTable creates the schema_migrations table if it doesn't exist
func ensureMigrationsTable(db *sql.DB) error {
	var query string

	if IsPostgreSQL() {
		query = `
			CREATE TABLE IF NOT EXISTS schema_migrations (
				version INT PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`
	} else {
		// SQLite
		query = `
			CREATE TABLE IF NOT EXISTS schema_migrations (
				version INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`
	}

	_, err := db.Exec(query)
	return err
}

// getCurrentVersion returns the highest migration version that has been applied
func getCurrentVersion(db *sql.DB) (int, error) {
	var version int
	query := `SELECT COALESCE(MAX(version), 0) FROM schema_migrations`

	err := db.QueryRow(query).Scan(&version)
	if err != nil {
		return 0, err
	}

	return version, nil
}

// executeMigration executes a migration's SQL statements
func executeMigration(tx *sql.Tx, migration Migration) error {
	// Split SQL into individual statements (simple split by semicolon)
	statements := strings.Split(migration.SQL, ";")

	for i, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}

		// Translate query for dialect compatibility
		stmt = TranslateQuery(stmt)

		// Wrap in SAVEPOINT for PostgreSQL to allow recovery from errors
		var savepointName string
		if IsPostgreSQL() {
			savepointName = fmt.Sprintf("sp_%d", i)
			if _, err := tx.Exec("SAVEPOINT " + savepointName); err != nil {
				return fmt.Errorf("failed to create savepoint: %w", err)
			}
		}

		log.Printf("[MIGRATIONS] Executing: %s", truncateSQL(stmt))
		if _, err := tx.Exec(stmt); err != nil {
			// Check if error is "column already exists" - ignore for idempotency
			if isColumnExistsError(err) {
				log.Printf("[MIGRATIONS] ⚠ Column already exists, skipping...")

				// Rollback to savepoint in PostgreSQL to restore transaction state
				if IsPostgreSQL() {
					if _, err := tx.Exec("ROLLBACK TO SAVEPOINT " + savepointName); err != nil {
						return fmt.Errorf("failed to rollback to savepoint: %w", err)
					}
				}
				continue
			}
			return fmt.Errorf("failed to execute statement: %w\nSQL: %s", err, stmt)
		}

		// Release savepoint on success
		if IsPostgreSQL() {
			if _, err := tx.Exec("RELEASE SAVEPOINT " + savepointName); err != nil {
				return fmt.Errorf("failed to release savepoint: %w", err)
			}
		}
	}

	return nil
}

// recordMigration records a completed migration in schema_migrations
func recordMigration(tx *sql.Tx, migration Migration) error {
	query := `INSERT INTO schema_migrations (version, name) VALUES (?, ?)`
	query = TranslateQuery(query)

	_, err := tx.Exec(query, migration.Version, migration.Name)
	return err
}

// truncateSQL truncates a SQL statement for logging (max 100 chars)
func truncateSQL(sql string) string {
	sql = strings.TrimSpace(sql)
	if len(sql) > 100 {
		return sql[:100] + "..."
	}
	return sql
}

// isColumnExistsError checks if error is due to column already existing
func isColumnExistsError(err error) bool {
	if err == nil {
		return false
	}
	errMsg := strings.ToLower(err.Error())
	return strings.Contains(errMsg, "duplicate column") ||
		strings.Contains(errMsg, "already exists") ||
		strings.Contains(errMsg, "column already exists")
}
