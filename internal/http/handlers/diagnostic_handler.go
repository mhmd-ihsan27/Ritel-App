package handlers

import (
	"fmt"
	"time"

	"ritel-app/internal/container"
	"ritel-app/internal/database"
	"ritel-app/internal/http/response"

	"github.com/gin-gonic/gin"
)

type DiagnosticHandler struct {
	services *container.ServiceContainer
}

func NewDiagnosticHandler(services *container.ServiceContainer) *DiagnosticHandler {
	return &DiagnosticHandler{services: services}
}

// GetDatabaseDiagnostics returns diagnostic information about database
func (h *DiagnosticHandler) GetDatabaseDiagnostics(c *gin.Context) {
	diagnostics := make(map[string]interface{})

	// Get current server time
	now := time.Now()
	diagnostics["server_time"] = now.Format("2006-01-02 15:04:05")
	diagnostics["server_timezone"] = now.Location().String()

	// Count total transactions
	var totalTransaksi int
	err := database.QueryRow("SELECT COUNT(*) FROM transaksi").Scan(&totalTransaksi)
	if err != nil {
		diagnostics["total_transaksi_error"] = err.Error()
	} else {
		diagnostics["total_transaksi"] = totalTransaksi
	}

	// Count transactions with staff_id
	var withStaffID int
	err = database.QueryRow("SELECT COUNT(*) FROM transaksi WHERE staff_id IS NOT NULL").Scan(&withStaffID)
	if err != nil {
		diagnostics["with_staff_id_error"] = err.Error()
	} else {
		diagnostics["with_staff_id"] = withStaffID
	}

	// Count transactions with NULL staff_id
	var withoutStaffID int
	err = database.QueryRow("SELECT COUNT(*) FROM transaksi WHERE staff_id IS NULL").Scan(&withoutStaffID)
	if err != nil {
		diagnostics["without_staff_id_error"] = err.Error()
	} else {
		diagnostics["without_staff_id"] = withoutStaffID
	}

	// Get date range of transactions
	var minDate, maxDate string
	err = database.QueryRow("SELECT MIN(DATE(tanggal)), MAX(DATE(tanggal)) FROM transaksi").Scan(&minDate, &maxDate)
	if err != nil {
		diagnostics["date_range_error"] = err.Error()
	} else {
		diagnostics["earliest_transaction"] = minDate
		diagnostics["latest_transaction"] = maxDate
	}

	// Get sample kasir values
	type KasirSample struct {
		Kasir   string
		Count   int
		StaffID *int64
	}
	rows, err := database.Query(`
		SELECT kasir, COUNT(*) as count, staff_id 
		FROM transaksi 
		GROUP BY kasir, staff_id 
		LIMIT 10
	`)
	if err != nil {
		diagnostics["kasir_samples_error"] = err.Error()
	} else {
		defer rows.Close()
		var kasirSamples []map[string]interface{}
		for rows.Next() {
			var sample KasirSample
			if err := rows.Scan(&sample.Kasir, &sample.Count, &sample.StaffID); err == nil {
				sampleMap := map[string]interface{}{
					"kasir": sample.Kasir,
					"count": sample.Count,
				}
				if sample.StaffID != nil {
					sampleMap["staff_id"] = *sample.StaffID
				} else {
					sampleMap["staff_id"] = nil
				}
				kasirSamples = append(kasirSamples, sampleMap)
			}
		}
		diagnostics["kasir_samples"] = kasirSamples
	}

	// Get users with role admin or staff
	rows, err = database.Query(`
		SELECT id, nama_lengkap, username, role 
		FROM users 
		WHERE role IN ('admin', 'staff')
		LIMIT 10
	`)
	if err != nil {
		diagnostics["users_error"] = err.Error()
	} else {
		defer rows.Close()
		var users []map[string]interface{}
		for rows.Next() {
			var id int64
			var namaLengkap, username, role string
			if err := rows.Scan(&id, &namaLengkap, &username, &role); err == nil {
				users = append(users, map[string]interface{}{
					"id":           id,
					"nama_lengkap": namaLengkap,
					"username":     username,
					"role":         role,
				})
			}
		}
		diagnostics["staff_users"] = users
	}

	// Get sample recent transactions
	rows, err = database.Query(`
		SELECT id, nomor_transaksi, DATE(tanggal) as tanggal, kasir, staff_id, staff_nama, total
		FROM transaksi 
		ORDER BY tanggal DESC 
		LIMIT 5
	`)
	if err != nil {
		diagnostics["recent_transactions_error"] = err.Error()
	} else {
		defer rows.Close()
		type TransaksiSample struct {
			ID              int
			NomorTransaksi  string
			Tanggal         string
			Kasir           *string
			StaffID         *int64
			StaffNama       *string
			Total           int
		}
		var recentTransactions []map[string]interface{}
		for rows.Next() {
			var t TransaksiSample
			if err := rows.Scan(&t.ID, &t.NomorTransaksi, &t.Tanggal, &t.Kasir, &t.StaffID, &t.StaffNama, &t.Total); err == nil {
				txMap := map[string]interface{}{
					"id":               t.ID,
					"nomor_transaksi":  t.NomorTransaksi,
					"tanggal":          t.Tanggal,
					"total":            t.Total,
				}
				if t.Kasir != nil {
					txMap["kasir"] = *t.Kasir
				}
				if t.StaffID != nil {
					txMap["staff_id"] = *t.StaffID
				}
				if t.StaffNama != nil {
					txMap["staff_nama"] = *t.StaffNama
				}
				recentTransactions = append(recentTransactions, txMap)
			}
		}
		diagnostics["recent_transactions"] = recentTransactions
	}

	// Get today's transactions count
	var todayCount int
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayEnd := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())
	err = database.QueryRow("SELECT COUNT(*) FROM transaksi WHERE tanggal >= ? AND tanggal <= ?", todayStart, todayEnd).Scan(&todayCount)
	if err != nil {
		diagnostics["today_count_error"] = err.Error()
	} else {
		diagnostics["today_count"] = todayCount
		diagnostics["today_start"] = todayStart.Format("2006-01-02 15:04:05")
		diagnostics["today_end"] = todayEnd.Format("2006-01-02 15:04:05")
	}

	fmt.Printf("[DIAGNOSTIC] Database diagnostics generated\n")
	response.Success(c, diagnostics, "Database diagnostics retrieved successfully")
}
