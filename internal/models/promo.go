package models

import "time"

type Promo struct {
	ID                 int       `json:"id"`
	Nama               string    `json:"nama"`
	ProdukXID          int       `json:"produkXId,omitempty"`
	ProdukYID          int       `json:"produkYId,omitempty"`
	Kode               string    `json:"kode"`
	Tipe               string    `json:"tipe"`
	TipePromo          string    `json:"tipe_promo"`
	TipeProdukBerlaku  string    `json:"tipeProdukBerlaku"`
	Nilai              int       `json:"nilai"`
	MinQuantity        int       `json:"minQuantity"`
	MaxDiskon          int       `json:"maxDiskon"`
	TanggalMulai       time.Time `json:"tanggalMulai"`
	TanggalSelesai     time.Time `json:"tanggalSelesai"`
	Status             string    `json:"status"`
	Deskripsi          string    `json:"deskripsi"`
	BuyQuantity        int       `json:"buyQuantity"`
	GetQuantity        int       `json:"getQuantity"`
	HargaBundling      int       `json:"hargaBundling"`
	TipeBundling       string    `json:"tipeBundling"`
	DiskonBundling     int       `json:"diskonBundling"`
	ProdukX            *Produk   `json:"produkX,omitempty"`
	ProdukY            *Produk   `json:"produkY,omitempty"`
	TipeBuyGet         string    `json:"tipeBuyGet"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type RealTimeValidationResponse struct {
	IsValid          bool   `json:"isValid"`
	Message          string `json:"message"`
	EligibleProducts []int  `json:"eligibleProducts"`
	Promo            *Promo `json:"promo,omitempty"`
}

type CalculateDiscountResponse struct {
	TotalDiskon      int   `json:"totalDiskon"`
	PromoDiskon      int   `json:"promoDiskon"`
	CustomerDiskon   int   `json:"customerDiskon"`
	EligibleProducts []int `json:"eligibleProducts"`
}

type PromoProduk struct {
	ID        int       `json:"id"`
	PromoID   int       `json:"promoId"`
	ProdukID  int       `json:"produkId"`
	CreatedAt time.Time `json:"createdAt"`
}

type PromoWithProducts struct {
	Promo    *Promo    `json:"promo"`
	Products []*Produk `json:"products"`
}

type CreatePromoRequest struct {
	Nama              string `json:"nama"`
	Kode              string `json:"kode"`
	Tipe              string `json:"tipe"`
	TipePromo         string `json:"tipe_promo"`
	TipeProdukBerlaku string `json:"tipeProdukBerlaku"`
	Nilai             int    `json:"nilai"`
	MinQuantity       int    `json:"minQuantity"`
	MaxDiskon         int    `json:"maxDiskon"`
	TanggalMulai      string `json:"tanggalMulai"`
	TanggalSelesai    string `json:"tanggalSelesai"`
	Status            string `json:"status"`
	Deskripsi         string `json:"deskripsi"`
	BuyQuantity       int    `json:"buyQuantity"`
	GetQuantity       int    `json:"getQuantity"`
	TipeBuyGet        string `json:"tipeBuyGet"`
	HargaBundling     int    `json:"hargaBundling"`
	TipeBundling      string `json:"tipeBundling"`
	DiskonBundling    int    `json:"diskonBundling"`
	ProdukIDs         []int  `json:"produkIds"`
	ProdukX           *int   `json:"produkX"`
	ProdukY           *int   `json:"produkY"`
}

type UpdatePromoRequest struct {
	ID                int    `json:"id"`
	Nama              string `json:"nama"`
	Kode              string `json:"kode"`
	Tipe              string `json:"tipe"`
	TipePromo         string `json:"tipe_promo"`
	TipeProdukBerlaku string `json:"tipeProdukBerlaku"`
	Nilai             int    `json:"nilai"`
	MinQuantity       int    `json:"minQuantity"`
	MaxDiskon         int    `json:"maxDiskon"`
	TanggalMulai      string `json:"tanggalMulai"`
	TanggalSelesai    string `json:"tanggalSelesai"`
	Status            string `json:"status"`
	Deskripsi         string `json:"deskripsi"`
	BuyQuantity       int    `json:"buyQuantity"`
	GetQuantity       int    `json:"getQuantity"`
	TipeBuyGet        string `json:"tipeBuyGet"`
	HargaBundling     int    `json:"hargaBundling"`
	TipeBundling      string `json:"tipeBundling"`
	DiskonBundling    int    `json:"diskonBundling"`
	ProdukIDs         []int  `json:"produkIds"`
	ProdukX           *int   `json:"produkX"`
	ProdukY           *int   `json:"produkY"`
}

type ApplyPromoRequest struct {
	Kode          string                 `json:"kode"`
	Subtotal      int                    `json:"subtotal"`
	TotalQuantity int                    `json:"totalQuantity"`
	PelangganID   int                    `json:"pelangganId"`
	Items         []TransaksiItemRequest `json:"items,omitempty"`
}

type PromoResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Promo   *Promo `json:"promo,omitempty"`
}

type PromoListResponse struct {
	Success bool     `json:"success"`
	Message string   `json:"message"`
	Promos  []*Promo `json:"promos,omitempty"`
}

type ApplyPromoResponse struct {
	Success        bool   `json:"success"`
	Message        string `json:"message"`
	Promo          *Promo `json:"promo,omitempty"`
	DiskonJumlah   int    `json:"diskonJumlah"`
	TotalSetelah   int    `json:"totalSetelah"`
	PromoProdukIds []int  `json:"promoProdukIds,omitempty"`
}
