package models

import "time"

// Pelanggan represents a customer in the system
type Pelanggan struct {
	ID             int       `json:"id"`
	Nama           string    `json:"nama"`
	Telepon        string    `json:"telepon"`
	Email          string    `json:"email"`
	Alamat         string    `json:"alamat"`
	Level          int       `json:"level"`       // Level pelanggan: 1=reguler, 2=premium, 3=gold
	Tipe           string    `json:"tipe"`        // Tipe pelanggan berdasarkan level
	Poin           int       `json:"poin"`        // Jumlah poin pelanggan
	DiskonPersen   int       `json:"diskonPersen"` // Persentase diskon berdasarkan level
	TotalTransaksi int       `json:"totalTransaksi"`
	TotalBelanja   int       `json:"totalBelanja"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CreatePelangganRequest represents request to create a new customer
type CreatePelangganRequest struct {
	Nama    string `json:"nama"`
	Telepon string `json:"telepon"`
	Email   string `json:"email"`
	Alamat  string `json:"alamat"`
	Level   int    `json:"level"` // 1, 2, or 3
	Poin    int    `json:"poin"`  // Initial points
}

// UpdatePelangganRequest represents request to update a customer
type UpdatePelangganRequest struct {
	ID      int    `json:"id"`
	Nama    string `json:"nama"`
	Telepon string `json:"telepon"`
	Email   string `json:"email"`
	Alamat  string `json:"alamat"`
 }

// AddPoinRequest represents request to add points to customer
type AddPoinRequest struct {
	PelangganID int `json:"pelangganId"`
	Poin        int `json:"poin"`
}

// PelangganResponse represents response after customer operation
type PelangganResponse struct {
	Success   bool       `json:"success"`
	Message   string     `json:"message"`
	Pelanggan *Pelanggan `json:"pelanggan,omitempty"`
}

// PelangganListResponse represents list of customers
type PelangganListResponse struct {
	Success    bool         `json:"success"`
	Message    string       `json:"message"`
	Pelanggans []*Pelanggan `json:"pelanggans,omitempty"`
}

type PelangganStats struct {
	TotalTransaksi  int `json:"totalTransaksi"`
	TotalBelanja    int `json:"totalBelanja"`
	RataRataBelanja int `json:"rataRataBelanja"`
}

// PelangganDetail represents complete customer information with stats and history
type PelangganDetail struct {
	Pelanggan        *Pelanggan      `json:"pelanggan"`
	Stats            *PelangganStats `json:"stats"`
	TransaksiHistory []*Transaksi    `json:"transaksiHistory"`
}
