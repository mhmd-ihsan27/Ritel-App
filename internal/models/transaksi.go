package models

import "time"

// Transaksi represents a transaction header
type Transaksi struct {
	ID              int       `json:"id"`
	NomorTransaksi  string    `json:"nomorTransaksi"`
	Tanggal         time.Time `json:"tanggal"`
	PelangganID     int       `json:"pelangganId"`
	PelangganNama   string    `json:"pelangganNama"`
	PelangganTelp   string    `json:"pelangganTelp"`
	Subtotal        int       `json:"subtotal"`
	DiskonPromo     int       `json:"diskonPromo"`
	DiskonPelanggan int       `json:"diskonPelanggan"`
	PoinDitukar     int       `json:"poinDitukar"` // Jumlah poin yang ditukar
	DiskonPoin      int       `json:"diskonPoin"`  // Nilai rupiah dari poin yang ditukar
	Diskon          int       `json:"diskon"`
	Total           int       `json:"total"`
	TotalBayar      int       `json:"totalBayar"`
	Kembalian       int       `json:"kembalian"`
	Status          string    `json:"status"`
	Catatan         string    `json:"catatan"`
	Kasir           string    `json:"kasir"`     // Legacy field - nama kasir
	StaffID         *int      `json:"staffId"`   // ID staff yang melakukan transaksi (nullable untuk backward compatibility)
	StaffNama       string    `json:"staffNama"` // Nama staff (denormalized untuk performa)
	CreatedAt       time.Time `json:"createdAt"`
}

// TransaksiItem represents a line item in a transaction
type TransaksiItem struct {
	ID             int       `json:"id"`
	TransaksiID    int       `json:"transaksiId"`
	ProdukID       *int      `json:"produkId"` // Nullable - bisa NULL jika produk sudah dihapus
	ProdukSKU      string    `json:"produkSku"`
	ProdukNama     string    `json:"produkNama"`
	ProdukKategori string    `json:"produkKategori"`
	HargaSatuan    int       `json:"hargaSatuan"` // Harga per 1000 gram
	Jumlah         int       `json:"jumlah"`      // Quantity (untuk backward compatibility)
	BeratGram      float64   `json:"beratGram"`   // Berat dalam gram (0 jika dijual per quantity)
	Subtotal       int       `json:"subtotal"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Pembayaran represents a payment method used in a transaction
type Pembayaran struct {
	ID          int       `json:"id"`
	TransaksiID int       `json:"transaksiId"`
	Metode      string    `json:"metode"` // "tunai", "qris", "transfer", "debit", "kredit"
	Jumlah      int       `json:"jumlah"`
	Referensi   string    `json:"referensi"` // Reference number for non-cash payments
	CreatedAt   time.Time `json:"createdAt"`
}

// TransaksiDetail represents complete transaction with items and payments
type TransaksiDetail struct {
	Transaksi  *Transaksi       `json:"transaksi"`
	Items      []*TransaksiItem `json:"items"`
	Pembayaran []*Pembayaran    `json:"pembayaran"`
}

// CreateTransaksiRequest represents request to create a new transaction
type CreateTransaksiRequest struct {
	PelangganID     int                    `json:"pelangganId"`
	PelangganNama   string                 `json:"pelangganNama"`
	PelangganTelp   string                 `json:"pelangganTelp"`
	Items           []TransaksiItemRequest `json:"items"`
	Pembayaran      []PembayaranRequest    `json:"pembayaran"`
	PromoKode       string                 `json:"promoKode"`
	PoinDitukar     int                    `json:"poinDitukar"`     // Jumlah poin yang ingin ditukar
	Diskon          int                    `json:"diskon"`          // Total diskon
	DiskonPromo     int                    `json:"diskonPromo"`     // Diskon dari promo
	DiskonPelanggan int                    `json:"diskonPelanggan"` // Diskon dari level pelanggan
	Catatan         string                 `json:"catatan"`
	Kasir           string                 `json:"kasir"`
	StaffID         int                    `json:"staffId"`   // ID staff yang melakukan transaksi
	StaffNama       string                 `json:"staffNama"` // Nama staff
	CreatedAt       time.Time              `json:"createdAt"`
}

// TransaksiItemRequest represents item in create transaction request
type TransaksiItemRequest struct {
	ProdukID    int     `json:"produkId"`
	Jumlah      int     `json:"jumlah"`      // Untuk backward compatibility (default 1)
	HargaSatuan int     `json:"hargaSatuan"` // Harga per 1000 gram
	BeratGram   float64 `json:"beratGram"`   // Berat yang dibeli dalam gram
}

// PembayaranRequest represents payment in create transaction request
type PembayaranRequest struct {
	Metode    string `json:"metode"`
	Jumlah    int    `json:"jumlah"`
	Referensi string `json:"referensi"`
}

// TransaksiResponse represents response after creating transaction
type TransaksiResponse struct {
	Success   bool             `json:"success"`
	Message   string           `json:"message"`
	Transaksi *TransaksiDetail `json:"transaksi,omitempty"`
}

type StokHistory struct {
	ID             int       `json:"id"`
	ProdukID       int       `json:"produkId"`
	StokSebelum    float64   `json:"stokSebelum"`
	StokSesudah    float64   `json:"stokSesudah"`
	Perubahan      float64   `json:"perubahan"`
	JenisPerubahan string    `json:"jenisPerubahan"` // "manual", "penjualan", "pembelian", "adjustment"
	Keterangan     string    `json:"keterangan"`
	TipeKerugian   string    `json:"tipeKerugian"`  // "kadaluarsa", "rusak", "hilang", "other" (only for pengurangan)
	NilaiKerugian  int       `json:"nilaiKerugian"` // Loss value in rupiah
	CreatedAt      time.Time `json:"createdAt"`
}

type TransaksiHistoryItem struct {
	ID             string    `json:"id"`
	NomorTransaksi string    `json:"nomorTransaksi"`
	Tanggal        time.Time `json:"tanggal"`
	Total          int       `json:"total"`
	JumlahItem     int       `json:"jumlahItem"`
	Status         string    `json:"status"`
	Kasir          string    `json:"kasir"`
}
