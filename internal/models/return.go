package models

import "time"

// Return represents a product return/exchange transaction
type Return struct {
	ID                    int       `json:"id"`
	TransaksiID           int       `json:"transaksi_id"`
	NoTransaksi           string    `json:"no_transaksi"`
	ReturnDate            time.Time `json:"return_date"`
	Reason                string    `json:"reason"` // "damaged", "wrong_item", "expired", "other"
	Type                  string    `json:"type"`   // "refund" or "exchange"
	ReplacementProductID  int       `json:"replacement_product_id,omitempty"`
	RefundAmount          int       `json:"refund_amount"`
	RefundMethod          string    `json:"refund_method,omitempty"` // "tunai", "transfer"
	RefundStatus          string    `json:"refund_status"`            // "pending", "completed", "cancelled"
	Notes                 string    `json:"notes,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// ReturnItem represents a product item in a return
type ReturnItem struct {
	ID        int       `json:"id"`
	ReturnID  int       `json:"return_id"`
	ProductID int       `json:"product_id"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"createdAt"`
}

// ReturnDetail represents complete return with items
type ReturnDetail struct {
	Return   *Return         `json:"return"`
	Products []*ReturnProduct `json:"products"`
}

// ReturnProduct represents product details in a return
type ReturnProduct struct {
	ID       int    `json:"id"`
	ProductID int   `json:"product_id"`
	Nama     string `json:"nama"`
	Quantity int    `json:"quantity"`
}

// CreateReturnRequest represents request to create a new return
type CreateReturnRequest struct {
	TransaksiID          int                    `json:"transaksi_id"`
	NoTransaksi          string                 `json:"no_transaksi"`
	Products             []ReturnProductRequest `json:"products"`
	Reason               string                 `json:"reason"`
	Type                 string                 `json:"type"`
	ReplacementProductID int                    `json:"replacement_product_id,omitempty"`
	ReturnDate           string                 `json:"return_date"`
	RefundMethod         string                 `json:"refund_method,omitempty"` // "tunai", "transfer"
	Notes                string                 `json:"notes,omitempty"`
}

// ReturnProductRequest represents product in create return request
type ReturnProductRequest struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}
