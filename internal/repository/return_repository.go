package repository

import (
	"database/sql"
	"fmt"
	"ritel-app/internal/database"
	"ritel-app/internal/models"
	"time"
)

// ReturnRepository handles database operations for returns
type ReturnRepository struct{}

// NewReturnRepository creates a new repository instance
func NewReturnRepository() *ReturnRepository {
	return &ReturnRepository{}
}

// Create creates a new return transaction
func (r *ReturnRepository) Create(returnData *models.Return) error {
	query := `
		INSERT INTO returns (
			transaksi_id, no_transaksi, return_date, reason, type,
			replacement_product_id, refund_amount, refund_method, refund_status, notes,
			created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id
	`

	var replacementProductID interface{}
	if returnData.ReplacementProductID > 0 {
		replacementProductID = returnData.ReplacementProductID
	} else {
		replacementProductID = nil
	}

	var id int64
	err := database.QueryRow(query,
		returnData.TransaksiID,
		returnData.NoTransaksi,
		returnData.ReturnDate,
		returnData.Reason,
		returnData.Type,
		replacementProductID,
		returnData.RefundAmount,
		returnData.RefundMethod,
		returnData.RefundStatus,
		returnData.Notes,
	).Scan(&id)
	if err != nil {
		return fmt.Errorf("failed to create return: %w", err)
	}

	returnData.ID = int(id)
	return nil
}

// CreateReturnItem creates a return item
func (r *ReturnRepository) CreateReturnItem(item *models.ReturnItem) error {
	query := `
		INSERT INTO return_items (return_id, product_id, quantity, created_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP) RETURNING id
	`

	var id int64
	err := database.QueryRow(query,
		item.ReturnID,
		item.ProductID,
		item.Quantity,
	).Scan(&id)
	if err != nil {
		return fmt.Errorf("failed to create return item: %w", err)
	}

	item.ID = int(id)
	return nil
}

// GetReturnedQuantity gets the total quantity already returned for a product in a transaction
func (r *ReturnRepository) GetReturnedQuantity(transaksiID int, productID int) (int, error) {
	query := `
		SELECT COALESCE(SUM(ri.quantity), 0)
		FROM return_items ri
		INNER JOIN returns r ON ri.return_id = r.id
		WHERE r.transaksi_id = ? AND ri.product_id = ?
	`

	var totalReturned int
	err := database.QueryRow(query, transaksiID, productID).Scan(&totalReturned)
	if err != nil {
		return 0, fmt.Errorf("failed to get returned quantity: %w", err)
	}

	return totalReturned, nil
}

// UpdateTransactionStatus updates the status of a transaction
func (r *ReturnRepository) UpdateTransactionStatus(transaksiID int, status string) error {
	query := `UPDATE transaksi SET status = ? WHERE id = ?`
	_, err := database.Exec(query, status, transaksiID)
	if err != nil {
		return fmt.Errorf("failed to update transaction status: %w", err)
	}
	return nil
}

// UpdateRefundStatus updates the refund status of a return
func (r *ReturnRepository) UpdateRefundStatus(returnID int, status string) error {
	query := `UPDATE returns SET refund_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := database.Exec(query, status, returnID)
	if err != nil {
		return fmt.Errorf("failed to update refund status: %w", err)
	}
	return nil
}

// GetAllReturnedItemsByTransaksi gets all returned items for a transaction (for status calculation)
func (r *ReturnRepository) GetAllReturnedItemsByTransaksi(transaksiID int) ([]*models.ReturnItem, error) {
	query := `
		SELECT ri.id, ri.return_id, ri.product_id, ri.quantity, ri.created_at
		FROM return_items ri
		INNER JOIN returns r ON ri.return_id = r.id
		WHERE r.transaksi_id = ?
	`

	rows, err := database.Query(query, transaksiID)
	if err != nil {
		return nil, fmt.Errorf("failed to query returned items: %w", err)
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

		if createdAtStr != "" {
			item.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		}

		items = append(items, &item)
	}

	return items, nil
}

// GetAll retrieves all returns
func (r *ReturnRepository) GetAll() ([]*models.Return, error) {
	query := `
		SELECT
			id, transaksi_id, no_transaksi, return_date, reason, type,
			COALESCE(replacement_product_id, 0),
			COALESCE(refund_amount, 0), COALESCE(refund_method, ''),
			COALESCE(refund_status, 'pending'), COALESCE(notes, ''),
			created_at, updated_at
		FROM returns
		ORDER BY return_date DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query returns: %w", err)
	}
	defer rows.Close()

	var returns []*models.Return
	for rows.Next() {
		var ret models.Return
		var returnDateStr string
		var createdAtStr, updatedAtStr string

		err := rows.Scan(
			&ret.ID,
			&ret.TransaksiID,
			&ret.NoTransaksi,
			&returnDateStr,
			&ret.Reason,
			&ret.Type,
			&ret.ReplacementProductID,
			&ret.RefundAmount,
			&ret.RefundMethod,
			&ret.RefundStatus,
			&ret.Notes,
			&createdAtStr,
			&updatedAtStr,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan return: %w", err)
		}

		// Parse dates
		if returnDateStr != "" {
			ret.ReturnDate, _ = time.Parse("2006-01-02T15:04:05Z07:00", returnDateStr)
		}
		if createdAtStr != "" {
			ret.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		}
		if updatedAtStr != "" {
			ret.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
		}

		returns = append(returns, &ret)
	}

	return returns, nil
}

// GetByID retrieves a return by ID
func (r *ReturnRepository) GetByID(id int) (*models.Return, error) {
	query := `
		SELECT
			id, transaksi_id, no_transaksi, return_date, reason, type,
			COALESCE(replacement_product_id, 0),
			COALESCE(refund_amount, 0), COALESCE(refund_method, ''),
			COALESCE(refund_status, 'pending'), COALESCE(notes, ''),
			created_at, updated_at
		FROM returns
		WHERE id = ?
	`

	var ret models.Return
	var returnDateStr string
	var createdAtStr, updatedAtStr string

	err := database.QueryRow(query, id).Scan(
		&ret.ID,
		&ret.TransaksiID,
		&ret.NoTransaksi,
		&returnDateStr,
		&ret.Reason,
		&ret.Type,
		&ret.ReplacementProductID,
		&ret.RefundAmount,
		&ret.RefundMethod,
		&ret.RefundStatus,
		&ret.Notes,
		&createdAtStr,
		&updatedAtStr,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get return: %w", err)
	}

	// Parse dates
	if returnDateStr != "" {
		ret.ReturnDate, _ = time.Parse("2006-01-02T15:04:05Z07:00", returnDateStr)
	}
	if createdAtStr != "" {
		ret.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	}
	if updatedAtStr != "" {
		ret.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
	}

	return &ret, nil
}

// GetReturnItemsByReturnID retrieves all items for a return
func (r *ReturnRepository) GetReturnItemsByReturnID(returnID int) ([]*models.ReturnProduct, error) {
	query := `
		SELECT
			ri.id,
			ri.product_id,
			p.nama,
			ri.quantity
		FROM return_items ri
		LEFT JOIN produk p ON ri.product_id = p.id
		WHERE ri.return_id = ?
	`

	rows, err := database.Query(query, returnID)
	if err != nil {
		return nil, fmt.Errorf("failed to query return items: %w", err)
	}
	defer rows.Close()

	var products []*models.ReturnProduct
	for rows.Next() {
		var product models.ReturnProduct
		err := rows.Scan(
			&product.ID,
			&product.ProductID,
			&product.Nama,
			&product.Quantity,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan return item: %w", err)
		}
		products = append(products, &product)
	}

	return products, nil
}

// GetTotalRefundByDateRange calculates total refund amount in a date range
func (r *ReturnRepository) GetTotalRefundByDateRange(startDate, endDate time.Time) (int, error) {
	query := `
		SELECT COALESCE(SUM(refund_amount), 0)
		FROM returns
		WHERE return_date >= ? AND return_date <= ?
	`

	var totalRefund int
	err := database.QueryRow(query, startDate, endDate).Scan(&totalRefund)
	if err != nil {
		return 0, fmt.Errorf("failed to get total refund: %w", err)
	}

	return totalRefund, nil
}

// GetReturnsByDateRange retrieves all returns in a date range
func (r *ReturnRepository) GetReturnsByDateRange(startDate, endDate time.Time) ([]*models.Return, error) {
	query := `
		SELECT
			id, transaksi_id, no_transaksi, return_date, reason, type,
			COALESCE(replacement_product_id, 0),
			COALESCE(refund_amount, 0), COALESCE(refund_method, ''),
			COALESCE(refund_status, 'pending'), COALESCE(notes, ''),
			created_at, updated_at
		FROM returns
		WHERE return_date >= ? AND return_date <= ?
		ORDER BY return_date DESC
	`

	rows, err := database.Query(query, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to query returns by date range: %w", err)
	}
	defer rows.Close()

	var returns []*models.Return
	for rows.Next() {
		var ret models.Return
		var returnDateStr string
		var createdAtStr, updatedAtStr string

		err := rows.Scan(
			&ret.ID,
			&ret.TransaksiID,
			&ret.NoTransaksi,
			&returnDateStr,
			&ret.Reason,
			&ret.Type,
			&ret.ReplacementProductID,
			&ret.RefundAmount,
			&ret.RefundMethod,
			&ret.RefundStatus,
			&ret.Notes,
			&createdAtStr,
			&updatedAtStr,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan return: %w", err)
		}

		// Parse dates
		if returnDateStr != "" {
			ret.ReturnDate, _ = time.Parse("2006-01-02T15:04:05Z07:00", returnDateStr)
			// Try alternative format if first parse fails
			if ret.ReturnDate.IsZero() {
				ret.ReturnDate, _ = time.Parse("2006-01-02 15:04:05", returnDateStr)
			}
		}
		if createdAtStr != "" {
			ret.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		}
		if updatedAtStr != "" {
			ret.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
		}

		returns = append(returns, &ret)
	}

	return returns, nil
}

// GetTotalRefundByStaffAndDateRange calculates total refund amount for a staff in date range
func (r *ReturnRepository) GetTotalRefundByStaffAndDateRange(staffID int, startDate, endDate time.Time) (int, error) {
	query := `
		SELECT COALESCE(SUM(r.refund_amount), 0)
		FROM returns r
		INNER JOIN transaksi t ON r.transaksi_id = t.id
		WHERE t.staff_id = ?
		AND r.return_date >= ?
		AND r.return_date <= ?
	`

	// Debug logging
	fmt.Printf("[REFUND QUERY] staffID: %d, startDate: %v, endDate: %v\n", staffID, startDate, endDate)

	var totalRefund int
	err := database.QueryRow(query, staffID, startDate, endDate).Scan(&totalRefund)
	if err != nil {
		fmt.Printf("[REFUND QUERY ERROR] %v\n", err)
		return 0, fmt.Errorf("failed to get total refund by staff: %w", err)
	}

	fmt.Printf("[REFUND QUERY RESULT] totalRefund: %d\n", totalRefund)
	return totalRefund, nil
}

// GetReturnCountByStaffAndDateRange counts total returns for a staff in date range
func (r *ReturnRepository) GetReturnCountByStaffAndDateRange(staffID int, startDate, endDate time.Time) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM returns r
		INNER JOIN transaksi t ON r.transaksi_id = t.id
		WHERE t.staff_id = ?
		AND r.return_date >= ?
		AND r.return_date <= ?
	`

	// Debug logging
	fmt.Printf("[RETURN COUNT QUERY] staffID: %d, startDate: %v, endDate: %v\n", staffID, startDate, endDate)

	var count int
	err := database.QueryRow(query, staffID, startDate, endDate).Scan(&count)
	if err != nil {
		fmt.Printf("[RETURN COUNT QUERY ERROR] %v\n", err)
		return 0, fmt.Errorf("failed to get return count by staff: %w", err)
	}

	fmt.Printf("[RETURN COUNT QUERY RESULT] count: %d\n", count)
	return count, nil
}

// GetTotalRefundAllStaff calculates total refund amount for ALL staff in date range
func (r *ReturnRepository) GetTotalRefundAllStaff(startDate, endDate time.Time) (int, error) {
	query := `
		SELECT COALESCE(SUM(refund_amount), 0)
		FROM returns
		WHERE return_date >= ?
		AND return_date <= ?
	`

	// Debug logging
	fmt.Printf("[ALL STAFF REFUND QUERY] startDate: %v, endDate: %v\n", startDate, endDate)

	var totalRefund int
	err := database.QueryRow(query, startDate, endDate).Scan(&totalRefund)
	if err != nil {
		fmt.Printf("[ALL STAFF REFUND QUERY ERROR] %v\n", err)
		return 0, fmt.Errorf("failed to get total refund for all staff: %w", err)
	}

	fmt.Printf("[ALL STAFF REFUND QUERY RESULT] totalRefund: %d\n", totalRefund)
	return totalRefund, nil
}

// GetReturnCountAllStaff counts total returns for ALL staff in date range
func (r *ReturnRepository) GetReturnCountAllStaff(startDate, endDate time.Time) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM returns
		WHERE return_date >= ?
		AND return_date <= ?
	`

	// Debug logging
	fmt.Printf("[ALL STAFF RETURN COUNT QUERY] startDate: %v, endDate: %v\n", startDate, endDate)

	var count int
	err := database.QueryRow(query, startDate, endDate).Scan(&count)
	if err != nil {
		fmt.Printf("[ALL STAFF RETURN COUNT QUERY ERROR] %v\n", err)
		return 0, fmt.Errorf("failed to get return count for all staff: %w", err)
	}

	fmt.Printf("[ALL STAFF RETURN COUNT QUERY RESULT] count: %d\n", count)
	return count, nil
}
