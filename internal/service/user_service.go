package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"ritel-app/internal/models"
	"ritel-app/internal/repository"
)

// UserService handles business logic for user management
type UserService struct {
	userRepo *repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService() *UserService {
	return &UserService{
		userRepo: repository.NewUserRepository(),
	}
}

// Login authenticates a user
func (s *UserService) Login(req *models.LoginRequest) (*models.LoginResponse, error) {
	// Validate input
	if strings.TrimSpace(req.Username) == "" {
		return &models.LoginResponse{
			Success: false,
			Message: "Username tidak boleh kosong",
		}, nil
	}

	if strings.TrimSpace(req.Password) == "" {
		return &models.LoginResponse{
			Success: false,
			Message: "Password tidak boleh kosong",
		}, nil
	}

	// Get user by username
	user, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return &models.LoginResponse{
			Success: false,
			Message: "Username atau password salah",
		}, nil
	}

	// Check if user is active
	if user.Status != "active" {
		return &models.LoginResponse{
			Success: false,
			Message: "Akun Anda tidak aktif. Hubungi administrator",
		}, nil
	}

	// Verify password
	if err := s.userRepo.VerifyPassword(user.Password, req.Password); err != nil {
		return &models.LoginResponse{
			Success: false,
			Message: "Username atau password salah",
		}, nil
	}

	// Don't send password in response
	user.Password = ""

	log.Printf("[LOGIN] User '%s' (%s) logged in successfully - ID: %d", user.NamaLengkap, user.Role, user.ID)
	log.Printf("[LOGIN DEBUG] Sending user object to frontend - ID: %d, Username: %s, NamaLengkap: %s, Role: %s",
		user.ID, user.Username, user.NamaLengkap, user.Role)

	response := &models.LoginResponse{
		Success: true,
		Message: "Login berhasil",
		User:    user,
	}

 

	return response, nil
}

// CreateUser creates a new user (staff or admin)
func (s *UserService) CreateUser(req *models.CreateUserRequest) error {
	// Validate input
	if strings.TrimSpace(req.Username) == "" {
		return fmt.Errorf("username tidak boleh kosong")
	}

	if strings.TrimSpace(req.Password) == "" {
		return fmt.Errorf("password tidak boleh kosong")
	}

	if len(req.Password) < 6 {
		return fmt.Errorf("password minimal 6 karakter")
	}

	if strings.TrimSpace(req.NamaLengkap) == "" {
		return fmt.Errorf("nama lengkap tidak boleh kosong")
	}

	if req.Role != "admin" && req.Role != "staff" {
		return fmt.Errorf("role harus 'admin' atau 'staff'")
	}

	// Check if username already exists
	existing, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		return fmt.Errorf("failed to check existing username: %w", err)
	}

	if existing != nil {
		return fmt.Errorf("username '%s' sudah digunakan", req.Username)
	}

	// Create user
	user := &models.User{
		Username:    req.Username,
		Password:    req.Password, // Will be hashed in repository
		NamaLengkap: req.NamaLengkap,
		Role:        req.Role,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.userRepo.Create(user); err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("[USER] Created new %s: %s (ID: %d)", user.Role, user.NamaLengkap, user.ID)
	return nil
}

// UpdateUser updates user information
func (s *UserService) UpdateUser(req *models.UpdateUserRequest) error {
	// Validate input
	if req.ID <= 0 {
		return fmt.Errorf("ID user tidak valid")
	}

	if strings.TrimSpace(req.Username) == "" {
		return fmt.Errorf("username tidak boleh kosong")
	}

	if strings.TrimSpace(req.NamaLengkap) == "" {
		return fmt.Errorf("nama lengkap tidak boleh kosong")
	}

	if req.Role != "admin" && req.Role != "staff" {
		return fmt.Errorf("role harus 'admin' atau 'staff'")
	}

	if req.Status != "active" && req.Status != "inactive" {
		return fmt.Errorf("status harus 'active' atau 'inactive'")
	}

	// Check if user exists
	existing, err := s.userRepo.GetByID(req.ID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if existing == nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	// Check if username is taken by another user
	if req.Username != existing.Username {
		userWithSameUsername, err := s.userRepo.GetByUsername(req.Username)
		if err != nil {
			return fmt.Errorf("failed to check username: %w", err)
		}

		if userWithSameUsername != nil && userWithSameUsername.ID != req.ID {
			return fmt.Errorf("username '%s' sudah digunakan", req.Username)
		}
	}

	// Update user
	user := &models.User{
		ID:          req.ID,
		Username:    req.Username,
		NamaLengkap: req.NamaLengkap,
		Role:        req.Role,
		Status:      req.Status,
	}

	if err := s.userRepo.Update(user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Update password if provided
	if strings.TrimSpace(req.Password) != "" {
		if len(req.Password) < 6 {
			return fmt.Errorf("password minimal 6 karakter")
		}

		if err := s.userRepo.UpdatePassword(req.ID, req.Password); err != nil {
			return fmt.Errorf("failed to update password: %w", err)
		}

		log.Printf("[USER] Password updated for user ID: %d", req.ID)
	}

	log.Printf("[USER] Updated user: %s (ID: %d)", user.NamaLengkap, user.ID)
	return nil
}

// DeleteUser soft deletes a user
func (s *UserService) DeleteUser(id int) error {
	if id <= 0 {
		return fmt.Errorf("ID user tidak valid")
	}

	// Check if user exists
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	// Prevent deleting the last admin
	if user.Role == "admin" {
		adminCount, err := s.userRepo.CountAdmins()
		if err != nil {
			return fmt.Errorf("failed to count admins: %w", err)
		}

		if adminCount <= 1 {
			return fmt.Errorf("tidak dapat menghapus admin terakhir")
		}
	}

	// Soft delete user
	if err := s.userRepo.Delete(id); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	log.Printf("[USER] Deleted user: %s (ID: %d)", user.NamaLengkap, user.ID)
	return nil
}

// GetAllUsers retrieves all users
func (s *UserService) GetAllUsers() ([]*models.User, error) {
	users, err := s.userRepo.GetAll()
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	// Don't send passwords
	for _, user := range users {
		user.Password = ""
	}

	return users, nil
}

// GetAllStaff retrieves all staff users
func (s *UserService) GetAllStaff() ([]*models.User, error) {
	users, err := s.userRepo.GetAllStaff()
	if err != nil {
		return nil, fmt.Errorf("failed to get staff: %w", err)
	}

	// Don't send passwords
	for _, user := range users {
		user.Password = ""
	}

	return users, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id int) (*models.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return nil, fmt.Errorf("user tidak ditemukan")
	}

	// Don't send password
	user.Password = ""

	return user, nil
}

// ChangePassword changes user password
func (s *UserService) ChangePassword(req *models.ChangePasswordRequest) error {
	// Validate input
	if req.UserID <= 0 {
		return fmt.Errorf("ID user tidak valid")
	}

	if strings.TrimSpace(req.OldPassword) == "" {
		return fmt.Errorf("password lama tidak boleh kosong")
	}

	if strings.TrimSpace(req.NewPassword) == "" {
		return fmt.Errorf("password baru tidak boleh kosong")
	}

	if len(req.NewPassword) < 6 {
		return fmt.Errorf("password baru minimal 6 karakter")
	}

	// Get user
	user, err := s.userRepo.GetByID(req.UserID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if user == nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	// Verify old password
	if err := s.userRepo.VerifyPassword(user.Password, req.OldPassword); err != nil {
		return fmt.Errorf("password lama salah")
	}

	// Update password
	if err := s.userRepo.UpdatePassword(req.UserID, req.NewPassword); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	log.Printf("[USER] Password changed for user ID: %d", req.UserID)
	return nil
}

// EnsureDefaultAdmin creates default admin if no admin exists
func (s *UserService) EnsureDefaultAdmin() error {
	adminCount, err := s.userRepo.CountAdmins()
	if err != nil {
		return fmt.Errorf("failed to count admins: %w", err)
	}

	if adminCount > 0 {
		log.Println("[USER] Admin user already exists")
		return nil
	}

	// Create default admin
	defaultAdmin := &models.User{
		Username:    "admin",
		Password:    "admin123", // Will be hashed in repository
		NamaLengkap: "Administrator",
		Role:        "admin",
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.userRepo.Create(defaultAdmin); err != nil {
		return fmt.Errorf("failed to create default admin: %w", err)
	}

	log.Printf("[USER] Default admin created - Username: admin, Password: admin123")
	log.Printf("[USER] ⚠️  IMPORTANT: Change default password immediately!")
	return nil
}
