package repository

import (
	"database/sql"
	"fmt"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/models"

	"golang.org/x/crypto/bcrypt"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository() *UserRepository {
	return &UserRepository{
		db: database.DB,
	}
}

// Create creates a new user with hashed password
func (r *UserRepository) Create(user *models.User) error {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		INSERT INTO users (username, password, nama_lengkap, role, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
	`

	now := time.Now()
	var id int64
	err = database.QueryRow(
		query,
		user.Username,
		string(hashedPassword),
		user.NamaLengkap,
		user.Role,
		user.Status,
		now,
		now,
	).Scan(&id)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	user.ID = int(id)
	user.CreatedAt = now
	user.UpdatedAt = now

	return nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(id int) (*models.User, error) {
	query := `
		SELECT id, username, password, nama_lengkap, role, status, created_at, updated_at, deleted_at
		FROM users
		WHERE id = ? AND deleted_at IS NULL
	`

	user := &models.User{}
	err := database.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Password,
		&user.NamaLengkap,
		&user.Role,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetByUsername retrieves a user by username
func (r *UserRepository) GetByUsername(username string) (*models.User, error) {
	query := `
		SELECT id, username, password, nama_lengkap, role, status, created_at, updated_at, deleted_at
		FROM users
		WHERE username = ? AND deleted_at IS NULL
	`

	user := &models.User{}
	err := database.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Password,
		&user.NamaLengkap,
		&user.Role,
		&user.Status,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetAll retrieves all active users
func (r *UserRepository) GetAll() ([]*models.User, error) {
	query := `
		SELECT id, username, password, nama_lengkap, role, status, created_at, updated_at, deleted_at
		FROM users
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Password,
			&user.NamaLengkap,
			&user.Role,
			&user.Status,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

// GetAllStaff retrieves all staff users (non-admin)
func (r *UserRepository) GetAllStaff() ([]*models.User, error) {
	query := `
		SELECT id, username, password, nama_lengkap, role, status, created_at, updated_at, deleted_at
		FROM users
		WHERE role = 'staff' AND deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query staff: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Password,
			&user.NamaLengkap,
			&user.Role,
			&user.Status,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan staff: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

// GetAllTransactionStaff retrieves all users who can process transactions (both admin and staff)
// This is used for staff reports to include all users who handle sales/returns
func (r *UserRepository) GetAllTransactionStaff() ([]*models.User, error) {
	query := `
		SELECT id, username, password, nama_lengkap, role, status, created_at, updated_at, deleted_at
		FROM users
		WHERE (role = 'staff' OR role = 'admin') AND deleted_at IS NULL AND status = 'active'
		ORDER BY created_at DESC
	`

	rows, err := database.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query transaction staff: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Password,
			&user.NamaLengkap,
			&user.Role,
			&user.Status,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction staff: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

// Update updates a user
func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users
		SET username = ?, nama_lengkap = ?, role = ?, status = ?, updated_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	result, err := database.Exec(
		query,
		user.Username,
		user.NamaLengkap,
		user.Role,
		user.Status,
		time.Now(),
		user.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UpdatePassword updates user password
func (r *UserRepository) UpdatePassword(userID int, newPassword string) error {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	query := `
		UPDATE users
		SET password = ?, updated_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	result, err := database.Exec(query, string(hashedPassword), time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// Delete soft deletes a user
func (r *UserRepository) Delete(id int) error {
	query := `
		UPDATE users
		SET deleted_at = ?, updated_at = ?
		WHERE id = ? AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := database.Exec(query, now, now, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// VerifyPassword checks if password matches
func (r *UserRepository) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// CountAdmins returns the number of admin users
func (r *UserRepository) CountAdmins() (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE role = 'admin' AND deleted_at IS NULL`

	var count int
	err := database.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count admins: %w", err)
	}

	return count, nil
}
