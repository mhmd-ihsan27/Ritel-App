package dialect

// SQLiteDialect implements the Dialect interface for SQLite database
type SQLiteDialect struct{}

// Name returns the name of the dialect
func (d *SQLiteDialect) Name() string {
	return "sqlite3"
}

// TranslatePlaceholders returns the query as-is since SQLite uses ?
func (d *SQLiteDialect) TranslatePlaceholders(query string) string {
	// SQLite uses ? placeholders, so no translation needed
	return query
}

// TranslateDateTimeNow returns the query as-is since it already uses SQLite syntax
func (d *SQLiteDialect) TranslateDateTimeNow(query string) string {
	// SQLite uses datetime('now'), date('now', 'localtime'), etc.
	// No translation needed
	return query
}

// TranslateAutoIncrement returns the query as-is since it already uses SQLite syntax
func (d *SQLiteDialect) TranslateAutoIncrement(query string) string {
	// SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT
	// No translation needed
	return query
}
