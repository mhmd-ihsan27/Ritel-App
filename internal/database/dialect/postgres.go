package dialect

import (
	"strings"
)

// PostgreSQLDialect implements the Dialect interface for PostgreSQL database
type PostgreSQLDialect struct{}

// Name returns the name of the dialect
func (d *PostgreSQLDialect) Name() string {
	return "postgres"
}

// TranslatePlaceholders converts ? placeholders to $1, $2, etc.
func (d *PostgreSQLDialect) TranslatePlaceholders(query string) string {
	return convertPlaceholdersToNumbered(query)
}

// TranslateDateTimeNow converts SQLite datetime functions to PostgreSQL equivalents
func (d *PostgreSQLDialect) TranslateDateTimeNow(query string) string {
	// Remove PRAGMA statements (SQLite-specific, not needed for PostgreSQL)
	query = replaceDateTimeFunctions(query, `(?i)PRAGMA\s+[^;]+;?\s*`, "")

	// Replace datetime('now') with NOW()
	query = strings.ReplaceAll(query, "datetime('now', 'localtime')", "NOW()")
	query = strings.ReplaceAll(query, "datetime('now')", "NOW()")

	// Replace date('now', 'localtime') with CURRENT_DATE
	query = strings.ReplaceAll(query, "date('now', 'localtime')", "CURRENT_DATE")
	query = strings.ReplaceAll(query, "date('now')", "CURRENT_DATE")

	// Replace CURRENT_TIMESTAMP with NOW() for consistency
	query = strings.ReplaceAll(query, "CURRENT_TIMESTAMP", "NOW()")

	// Replace date(column) with column::date
	// This is a more complex replacement that needs to preserve the column name
	// For now, we'll handle the common cases
	query = replaceDateTimeFunctions(query, `date\(([^)]+)\)`, "$1::date")

	return query
}

// TranslateAutoIncrement converts SQLite AUTOINCREMENT to PostgreSQL SERIAL
func (d *PostgreSQLDialect) TranslateAutoIncrement(query string) string {
	// Replace INTEGER PRIMARY KEY AUTOINCREMENT with SERIAL PRIMARY KEY
	query = strings.ReplaceAll(query, "INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")

	// Also handle the case without PRIMARY KEY
	query = strings.ReplaceAll(query, "INTEGER AUTOINCREMENT", "SERIAL")

	return query
}
