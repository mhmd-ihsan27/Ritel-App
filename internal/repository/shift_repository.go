package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"ritel-app/internal/database"
	"ritel-app/internal/models"
)

type ShiftRepository struct {
	db *sql.DB
}

func NewShiftRepository() *ShiftRepository {
	repo := &ShiftRepository{
		db: database.DB,
	}
	repo.Init()
	return repo
}

// Init creates the table and default values if not exists
func (r *ShiftRepository) Init() error {
	var query string
	if database.IsPostgreSQL() {
		query = `
		CREATE TABLE IF NOT EXISTS shift_settings (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			start_time TEXT NOT NULL,
			end_time TEXT NOT NULL,
			staff_ids TEXT DEFAULT ''
		);`
	} else {
		query = `
		CREATE TABLE IF NOT EXISTS shift_settings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			start_time TEXT NOT NULL,
			end_time TEXT NOT NULL,
			staff_ids TEXT DEFAULT ''
		);`
	}

	_, err := r.db.Exec(query)
	if err != nil {
		return err
	}

	// Check if staff_ids column exists (migration for existing db)
	var columnExists int
	if database.IsPostgreSQL() {
		checkColQuery := `SELECT COUNT(*) FROM information_schema.columns WHERE table_name='shift_settings' AND column_name='staff_ids'`
		r.db.QueryRow(checkColQuery).Scan(&columnExists)
	} else {
		checkColQuery := `SELECT COUNT(*) FROM pragma_table_info('shift_settings') WHERE name='staff_ids'`
		r.db.QueryRow(checkColQuery).Scan(&columnExists)
	}

	if columnExists == 0 {
		_, err = r.db.Exec(`ALTER TABLE shift_settings ADD COLUMN staff_ids TEXT DEFAULT ''`)
		if err != nil {
			return err
		}
	}

	// Check if empty, if so seed defaults
	var count int
	r.db.QueryRow("SELECT COUNT(*) FROM shift_settings").Scan(&count)
	if count == 0 {
		r.Create(&models.ShiftSetting{Name: "Shift 1", StartTime: "06:00", EndTime: "14:00", StaffIDs: ""})
		r.Create(&models.ShiftSetting{Name: "Shift 2", StartTime: "14:00", EndTime: "22:00", StaffIDs: ""})
	}

	return nil
}

func (r *ShiftRepository) replacePlaceholders(query string) string {
	if !database.IsPostgreSQL() {
		return query
	}
	n := 1
	for strings.Contains(query, "?") {
		query = strings.Replace(query, "?", fmt.Sprintf("$%d", n), 1)
		n++
	}
	return query
}

func (r *ShiftRepository) Create(shift *models.ShiftSetting) error {
	query := `INSERT INTO shift_settings (name, start_time, end_time, staff_ids) VALUES (?, ?, ?, ?)`
	query = r.replacePlaceholders(query)
	_, err := r.db.Exec(query, shift.Name, shift.StartTime, shift.EndTime, shift.StaffIDs)
	return err
}

func (r *ShiftRepository) GetAll() ([]models.ShiftSetting, error) {
	query := `SELECT id, name, start_time, end_time, staff_ids FROM shift_settings ORDER BY id ASC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shifts []models.ShiftSetting
	for rows.Next() {
		var s models.ShiftSetting
		// Handle NULL for staff_ids if any
		var staffIDs sql.NullString
		if err := rows.Scan(&s.ID, &s.Name, &s.StartTime, &s.EndTime, &staffIDs); err != nil {
			return nil, err
		}
		if staffIDs.Valid {
			s.StaffIDs = staffIDs.String
		} else {
			s.StaffIDs = ""
		}
		shifts = append(shifts, s)
	}
	return shifts, nil
}

func (r *ShiftRepository) Update(id int, startTime, endTime, staffIDs string) error {
	query := `UPDATE shift_settings SET start_time = ?, end_time = ?, staff_ids = ? WHERE id = ?`
	query = r.replacePlaceholders(query)
	res, err := r.db.Exec(query, startTime, endTime, staffIDs, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("shift setting with id %d not found", id)
	}
	return nil
}

// Helper to parse time string "HH:MM"
func parseTime(tStr string) (int, int) {
	t, _ := time.Parse("15:04", tStr)
	return t.Hour(), t.Minute()
}

// GetActiveShiftName returns the active shift name (e.g. "shift1", "shift2") based on time
// It mimics the old logic but uses DB values
func (r *ShiftRepository) DetermineShift(t time.Time) string {
	shifts, err := r.GetAll()
	if err != nil {
		// Fallback to defaults if DB fails
		hour := t.Hour()
		if hour >= 6 && hour < 14 {
			return "shift1"
		} else if hour >= 14 {
			return "shift2"
		}
		return ""
	}

	// Simple check based on hours for now, can be more complex if needed
	// Assuming shifts don't cross midnight for this MVP as per existing logic structure
	// FORCE LOCAL TIME: Database might return UTC, so we must convert to Local (WIB)
	// to match the shift settings which are in local wall-clock time.
	localT := t.Local()
	checkTime := localT.Format("15:04")

	for _, s := range shifts {
		// Basic string comparison works for HH:MM format
		if checkTime >= s.StartTime && checkTime < s.EndTime {
			if s.Name == "Shift 1" {
				return "shift1"
			} else if s.Name == "Shift 2" {
				return "shift2"
			}
		}
	}

	return ""
}
