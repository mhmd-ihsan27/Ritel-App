package models

import "time"

// Produk represents a product in the system
type Produk struct {
	ID                          int       `json:"id"`
	SKU                         string    `json:"sku"`
	Barcode                     string    `json:"barcode"`
	Nama                        string    `json:"nama"`
	Kategori                    string    `json:"kategori"`
	Berat                       float64   `json:"berat"`
	HargaBeli                   int       `json:"hargaBeli"`
	HargaJual                   int       `json:"hargaJual"`
	Stok                        float64   `json:"stok"`
	Satuan                      string    `json:"satuan"`
	JenisProduk                 string    `json:"jenisProduk"`                 // "satuan" or "curah"
	Kadaluarsa                  string    `json:"kadaluarsa"`                  // Deprecated - untuk backward compatibility
	MasaSimpanHari              int       `json:"masaSimpanHari"`              // Default masa simpan dalam hari
	TanggalMasuk                string    `json:"tanggalMasuk"`
	Deskripsi                   string    `json:"deskripsi"`
	Gambar                      string    `json:"gambar"`
	HariPemberitahuanKadaluarsa int       `json:"hariPemberitahuanKadaluarsa"` // Existing field
	CreatedAt                   time.Time `json:"createdAt"`
	UpdatedAt                   time.Time `json:"updatedAt"`
}

// Batch represents a stock batch with expiry tracking
type Batch struct {
	ID                string    `json:"id"`                // Unique batch ID (UUID)
	ProdukID          int       `json:"produkId"`          // Foreign key to Produk
	Qty               float64   `json:"qty"`               // Quantity in this batch
	QtyTersisa        float64   `json:"qtyTersisa"`        // Remaining quantity
	TanggalRestok     time.Time `json:"tanggalRestok"`     // Restock date
	MasaSimpanHari    int       `json:"masaSimpanHari"`    // Shelf life in days
	TanggalKadaluarsa time.Time `json:"tanggalKadaluarsa"` // Calculated expiry date
	Status            string    `json:"status"`            // fresh, hampir_expired, expired
	Supplier          string    `json:"supplier"`          // Supplier name
	Keterangan        string    `json:"keterangan"`        // Notes
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// Keranjang represents items scanned to be added to inventory
type Keranjang struct {
	ID        int       `json:"id"`
	ProdukID  int       `json:"produkId"`
	Nama      string    `json:"nama"`
	Barcode   string    `json:"barcode"`
	SKU       string    `json:"sku"`
	Jumlah    int       `json:"jumlah"`
	HargaBeli int       `json:"hargaBeli"`
	Subtotal  int       `json:"subtotal"`
	CreatedAt time.Time `json:"createdAt"`
}

// KeranjangItem represents a detailed cart item with product info
type KeranjangItem struct {
	ID        int       `json:"id"`
	Produk    *Produk   `json:"produk"`
	Jumlah    int       `json:"jumlah"`
	HargaBeli int       `json:"hargaBeli"`
	Subtotal  int       `json:"subtotal"`
	CreatedAt time.Time `json:"createdAt"`
}

// ScanBarcodeRequest represents barcode scan request
type ScanBarcodeRequest struct {
	Barcode string `json:"barcode"`
	Jumlah  int    `json:"jumlah"`
}

// ScanBarcodeResponse represents barcode scan response
type ScanBarcodeResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Produk  *Produk         `json:"produk,omitempty"`
	Item    *KeranjangItem  `json:"item,omitempty"`
}

// Kategori represents a product category
type Kategori struct {
	ID           int       `json:"id"`
	Nama         string    `json:"nama"`
	Deskripsi    string    `json:"deskripsi"`
	Icon         string    `json:"icon"`
	JumlahProduk int       `json:"jumlahProduk"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}


// UpdateStokRequest represents stock update request
type UpdateStokRequest struct {
	ProdukID       int     `json:"produkId"`
	StokBaru       float64 `json:"stokBaru"`
	Perubahan      float64 `json:"perubahan"`
	Jenis          string  `json:"jenis"`          // "penambahan" or "pengurangan"
	Keterangan     string  `json:"keterangan"`
	TipeKerugian   string  `json:"tipeKerugian"`   // "kadaluarsa", "rusak", "hilang", "other" (only for pengurangan)
	NilaiKerugian  int     `json:"nilaiKerugian"`  // Loss value in rupiah (calculated from qty * harga_beli)
	MasaSimpanHari int     `json:"masaSimpanHari"` // For batch creation during restock
	Supplier       string  `json:"supplier"`       // Supplier for this batch
}
 