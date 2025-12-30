package repository

import (
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

	return &settings, nil
}

// SavePrintSettings saves or updates print settings
func (r *PrinterRepository) SavePrintSettings(settings *models.PrintSettings) error {
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
			settings.ShowLogo, settings.AutoPrint, settings.CopiesCount, settings.CreatedAt, settings.UpdatedAt,
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
		settings.HeaderAddress, settings.HeaderPhone, settings.FooterText, settings.ShowLogo,
		settings.AutoPrint, settings.CopiesCount, settings.UpdatedAt,
	)

	return err
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
			font_size TEXT DEFAULT 'medium',
			line_spacing INTEGER DEFAULT 1,
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
