package dialect

import (
	"fmt"
	"regexp"
	"strings"
)

// Dialect defines the interface for database-specific SQL dialects
type Dialect interface {
	// Name returns the name of the dialect
	Name() string

	// TranslatePlaceholders converts query placeholders to the dialect-specific format
	// SQLite uses ? while PostgreSQL uses $1, $2, etc.
	TranslatePlaceholders(query string) string

	// TranslateDateTimeNow converts datetime('now') to the dialect-specific function
	TranslateDateTimeNow(query string) string

	// TranslateAutoIncrement converts AUTOINCREMENT to the dialect-specific syntax
	TranslateAutoIncrement(query string) string
}

// TranslateQuery applies all dialect-specific translations to a query
func TranslateQuery(query string, d Dialect) string {
	query = d.TranslatePlaceholders(query)
	query = d.TranslateDateTimeNow(query)
	query = d.TranslateAutoIncrement(query)
	return query
}

// Helper function to convert ? placeholders to $1, $2, etc.
func convertPlaceholdersToNumbered(query string) string {
	count := 0
	result := strings.Builder{}
	inString := false
	escape := false

	for i := 0; i < len(query); i++ {
		ch := query[i]

		if escape {
			result.WriteByte(ch)
			escape = false
			continue
		}

		if ch == '\\' {
			escape = true
			result.WriteByte(ch)
			continue
		}

		if ch == '\'' {
			inString = !inString
			result.WriteByte(ch)
			continue
		}

		if ch == '?' && !inString {
			count++
			result.WriteString(fmt.Sprintf("$%d", count))
		} else {
			result.WriteByte(ch)
		}
	}

	return result.String()
}

// Helper function to replace datetime functions
func replaceDateTimeFunctions(query string, pattern string, replacement string) string {
	re := regexp.MustCompile(pattern)
	return re.ReplaceAllString(query, replacement)
}
