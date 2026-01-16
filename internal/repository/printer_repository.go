package repository

import (
	"log"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
	"time"
)

type PrinterRepository struct{}

func NewPrinterRepository() *PrinterRepository {
	return &PrinterRepository{}
}

// GetPrintSettings retrieves the current print settings
func (r *PrinterRepository) GetPrintSettings() (*models.PrintSettings, error) {
	var settings models.PrintSettings
	query := `SELECT id, printer_name, paper_size, paper_width, font_size, line_spacing, left_margin,
	          dash_line_char, double_line_char, header_alignment, title_alignment, footer_alignment,
	          header_text, header_address, header_phone, footer_text,
	          show_logo, auto_print, copies_count, created_at, updated_at
	          FROM print_settings WHERE id = 1 LIMIT 1`

	err := database.QueryRow(query).Scan(
		&settings.ID, &settings.PrinterName, &settings.PaperSize, &settings.PaperWidth, &settings.FontSize,
		&settings.LineSpacing, &settings.LeftMargin, &settings.DashLineChar, &settings.DoubleLineChar,
		&settings.HeaderAlignment, &settings.TitleAlignment, &settings.FooterAlignment,
		&settings.HeaderText, &settings.HeaderAddress, &settings.HeaderPhone, &settings.FooterText,
		&settings.ShowLogo, &settings.AutoPrint, &settings.CopiesCount, &settings.CreatedAt, &settings.UpdatedAt,
	)
	if err != nil {
		// Return default settings if not found
		return r.GetDefaultSettings(), nil
	}

	// NOTE: Validation and auto-fix is now ONLY done on Save, not on Load
	// This ensures user's settings are respected exactly as stored in database
	log.Printf("[PRINTER SETTINGS] Loaded from DB: paperWidth=%d, paperSize=%s", settings.PaperWidth, settings.PaperSize)

	return &settings, nil
}

// SavePrintSettings saves or updates print settings
func (r *PrinterRepository) SavePrintSettings(settings *models.PrintSettings) error {
	log.Printf("[PRINTER SETTINGS] SavePrintSettings called with paperWidth: %d", settings.PaperWidth)
	// Validate and fix paperWidth if it's out of range
	if settings.PaperWidth > 60 {
		log.Printf("[PRINTER SETTINGS] Invalid paperWidth detected: %d. Attempting to fix...", settings.PaperWidth)

		// Common pixel values that should be converted to characters
		if settings.PaperWidth == 384 {
			settings.PaperWidth = 48 // 384 pixels / 8 = 48 characters (80mm standard)
			log.Printf("[PRINTER SETTINGS] Converted 384 pixels to 48 characters")
		} else if settings.PaperWidth == 320 {
			settings.PaperWidth = 40 // 320 pixels / 8 = 40 characters (58mm)
			log.Printf("[PRINTER SETTINGS] Converted 320 pixels to 40 characters")
		} else {
			// For any other large value, reset to safe default
			settings.PaperWidth = 48
			log.Printf("[PRINTER SETTINGS] Reset to default 48 characters")
		}
	}

	// Ensure paperWidth is within valid range (20-60 characters)
	if settings.PaperWidth < 20 {
		log.Printf("[PRINTER SETTINGS] paperWidth %d is below minimum. Setting to 20", settings.PaperWidth)
		settings.PaperWidth = 20
	} else if settings.PaperWidth > 60 {
		log.Printf("[PRINTER SETTINGS] paperWidth %d is above maximum. Setting to 60", settings.PaperWidth)
		settings.PaperWidth = 60
	}

	log.Printf("[PRINTER SETTINGS] Saving settings with paperWidth: %d", settings.PaperWidth)

	// Check if settings exist
	existing, _ := r.GetPrintSettings()

	now := time.Now()
	settings.UpdatedAt = now

	if existing.ID == 0 {
		// Insert new settings
		settings.ID = 1
		settings.CreatedAt = now

		query := `
			INSERT INTO print_settings (
				id, printer_name, paper_size, paper_width, font_size, line_spacing, left_margin,
				dash_line_char, double_line_char, header_alignment, title_alignment, footer_alignment,
				header_text, header_address, header_phone, footer_text,
				show_logo, auto_print, copies_count, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		_, err := database.Exec(query,
			settings.ID, settings.PrinterName, settings.PaperSize, settings.PaperWidth, settings.FontSize,
			settings.LineSpacing, settings.LeftMargin, settings.DashLineChar, settings.DoubleLineChar,
			settings.HeaderAlignment, settings.TitleAlignment, settings.FooterAlignment,
			settings.HeaderText, settings.HeaderAddress, settings.HeaderPhone, settings.FooterText,
			btoi(settings.ShowLogo), btoi(settings.AutoPrint), settings.CopiesCount, settings.CreatedAt, settings.UpdatedAt,
		)
		return err
	}

	// Update existing settings
	query := `
		UPDATE print_settings SET
			printer_name = ?, paper_size = ?, paper_width = ?, font_size = ?, line_spacing = ?, left_margin = ?,
			dash_line_char = ?, double_line_char = ?, header_alignment = ?, title_alignment = ?, footer_alignment = ?,
			header_text = ?, header_address = ?, header_phone = ?,
			footer_text = ?, show_logo = ?, auto_print = ?, copies_count = ?, updated_at = ?
		WHERE id = 1
	`

	_, err := database.Exec(query,
		settings.PrinterName, settings.PaperSize, settings.PaperWidth, settings.FontSize, settings.LineSpacing,
		settings.LeftMargin, settings.DashLineChar, settings.DoubleLineChar, settings.HeaderAlignment,
		settings.TitleAlignment, settings.FooterAlignment, settings.HeaderText,
		settings.HeaderAddress, settings.HeaderPhone, settings.FooterText, btoi(settings.ShowLogo),
		btoi(settings.AutoPrint), settings.CopiesCount, settings.UpdatedAt,
	)

	return err
}

// SetDefaultPrinter updates only the printer_name; inserts a minimal row if absent
func (r *PrinterRepository) SetDefaultPrinter(printerName string) error {
	updateQuery := `UPDATE print_settings SET printer_name = ?, updated_at = ? WHERE id = 1`
	now := time.Now()
	result, err := database.Exec(updateQuery, printerName, now)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		insertQuery := `INSERT INTO print_settings (id, printer_name, created_at, updated_at) VALUES (1, ?, ?, ?)`
		_, err := database.Exec(insertQuery, printerName, now, now)
		return err
	}
	return nil
}

// GetDefaultSettings returns default print settings
func (r *PrinterRepository) GetDefaultSettings() *models.PrintSettings {
	return &models.PrintSettings{
		ID:              0,
		PrinterName:     "",
		PaperSize:       "80mm",
		PaperWidth:      48, // Default for 80mm with compressed mode
		FontSize:        "medium",
		LineSpacing:     1,
		LeftMargin:      0,
		DashLineChar:    "-",
		DoubleLineChar:  "=",
		HeaderAlignment: "center",
		TitleAlignment:  "center",
		FooterAlignment: "center",
		HeaderText:      "TOKO RITEL",
		HeaderAddress:   "Jl. Contoh No. 123",
		HeaderPhone:     "0812-3456-7890",
		FooterText:      "Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar",
		ShowLogo:        false,
		AutoPrint:       false,
		CopiesCount:     1,
	}
}

// InitPrintSettingsTable creates the print_settings table if it doesn't exist
func (r *PrinterRepository) InitPrintSettingsTable() error {
	query := `
        CREATE TABLE IF NOT EXISTS print_settings (
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
        )
    `

	_, err := database.Exec(query)
	return err
}

// btoi converts a boolean to integer (for databases storing booleans as integers)
func btoi(b bool) int {
	if b {
		return 1
	}
	return 0
}

// FixInvalidPaperWidth one-time migration to fix invalid paperWidth values in existing databases
// This should be called on application startup to fix databases from older versions
func (r *PrinterRepository) FixInvalidPaperWidth() error {
	settings, err := r.GetPrintSettings()
	if err != nil || settings.ID == 0 {
		// No settings yet or error loading, skip migration
		return nil
	}

	originalWidth := settings.PaperWidth
	needsFix := false

	// Check if paperWidth needs fixing or is zero/missing
	if settings.PaperWidth == 0 {
		log.Printf("[MIGRATION] paperWidth is 0. Setting default to 48")
		settings.PaperWidth = 48
		needsFix = true
	} else if settings.PaperWidth > 60 {
		log.Printf("[MIGRATION] Found invalid paperWidth: %d. Fixing...", settings.PaperWidth)

		if settings.PaperWidth == 384 {
			settings.PaperWidth = 48 // 80mm standard
		} else if settings.PaperWidth == 320 {
			settings.PaperWidth = 40 // 58mm
		} else {
			settings.PaperWidth = 48 // Default
		}
		needsFix = true
	} else if settings.PaperWidth < 20 {
		log.Printf("[MIGRATION] Found paperWidth below minimum: %d. Setting to 20", settings.PaperWidth)
		settings.PaperWidth = 20
		needsFix = true
	}

	if needsFix {
		query := `UPDATE print_settings SET paper_width = ?, updated_at = ? WHERE id = 1`
		_, err := database.Exec(query, settings.PaperWidth, time.Now())
		if err != nil {
			log.Printf("[MIGRATION] ⚠ Warning: Failed to fix paperWidth: %v", err)
			return err
		}
		log.Printf("[MIGRATION] ✓ Successfully fixed paperWidth from %d to %d", originalWidth, settings.PaperWidth)
	} else {
		log.Printf("[MIGRATION] PaperWidth (%d) is valid, no fix needed", settings.PaperWidth)
	}

	return nil
}
