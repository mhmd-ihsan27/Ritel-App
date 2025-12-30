package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

type SettingsRepository struct{}

func NewSettingsRepository() *SettingsRepository {
	return &SettingsRepository{}
}

// GetPoinSettings retrieves point system settings
func (r *SettingsRepository) GetPoinSettings() (*models.PoinSettings, error) {
	query := `
		SELECT
			id, point_value, min_exchange,
			min_transaction_for_points, level2_min_points, level3_min_points,
			level2_min_spending, level3_min_spending
		FROM poin_settings
		WHERE id = 1
	`

	var settings models.PoinSettings
	err := database.QueryRow(query).Scan(
		&settings.ID,
		&settings.PointValue,
		&settings.MinExchange,
		&settings.MinTransactionForPoints,
		&settings.Level2MinPoints,
		&settings.Level3MinPoints,
		&settings.Level2MinSpending,
		&settings.Level3MinSpending,
	)

	if err == sql.ErrNoRows {
		// Return default settings if not found
		return r.createDefaultSettings()
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get poin settings: %w", err)
	}

	return &settings, nil
}

// UpdatePoinSettings updates point system settings
func (r *SettingsRepository) UpdatePoinSettings(settings *models.PoinSettings) error {
	query := `
		UPDATE poin_settings
		SET
			point_value = ?,
			min_exchange = ?,
			min_transaction_for_points = ?,
			level2_min_points = ?,
			level3_min_points = ?,
			level2_min_spending = ?,
			level3_min_spending = ?
		WHERE id = 1
	`

	result, err := database.Exec(query,
		settings.PointValue,
		settings.MinExchange,
		settings.MinTransactionForPoints,
		settings.Level2MinPoints,
		settings.Level3MinPoints,
		settings.Level2MinSpending,
		settings.Level3MinSpending,
	)

	if err != nil {
		return fmt.Errorf("failed to update poin settings: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		// If no rows were updated, create default settings
		_, err := r.createDefaultSettings()
		if err != nil {
			return fmt.Errorf("failed to create default settings: %w", err)
		}
		// Try update again
		return r.UpdatePoinSettings(settings)
	}

	return nil
}

// createDefaultSettings creates default point settings
func (r *SettingsRepository) createDefaultSettings() (*models.PoinSettings, error) {
	defaultSettings := &models.PoinSettings{
		ID:                      1,
		PointValue:              500,
		MinExchange:             100,
		MinTransactionForPoints: 25000,
		Level2MinPoints:         500,
		Level3MinPoints:         1000,
		Level2MinSpending:       5000000,
		Level3MinSpending:       10000000,
	}

	query := `
		INSERT INTO poin_settings (
			id, point_value, min_exchange,
			min_transaction_for_points, level2_min_points, level3_min_points,
			level2_min_spending, level3_min_spending
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := database.Exec(query,
		defaultSettings.ID,
		defaultSettings.PointValue,
		defaultSettings.MinExchange,
		defaultSettings.MinTransactionForPoints,
		defaultSettings.Level2MinPoints,
		defaultSettings.Level3MinPoints,
		defaultSettings.Level2MinSpending,
		defaultSettings.Level3MinSpending,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create default settings: %w", err)
	}

	return defaultSettings, nil
}
