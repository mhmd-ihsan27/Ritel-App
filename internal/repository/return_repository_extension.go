package repository

import (
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

func (r *ReturnRepository) GetReturnItems(returnID int) ([]*models.ReturnItem, error) {
	query := `
		SELECT id, return_id, product_id, quantity, created_at 
		FROM return_items 
		WHERE return_id = ?
	`

	// Debug log

	rows, err := database.Query(query, returnID)
	if err != nil {
		return nil, fmt.Errorf("failed to get return items: %w", err)
	}
	defer rows.Close()

	var items []*models.ReturnItem
	for rows.Next() {
		var item models.ReturnItem
		var createdAtStr string
		err := rows.Scan(
			&item.ID,
			&item.ReturnID,
			&item.ProductID,
			&item.Quantity,
			&createdAtStr,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan return item: %w", err)
		}

		// Parse timestamp if needed, but for now just basic scan

		items = append(items, &item)
	}

	return items, nil
}
