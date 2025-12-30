package models

// Di models/poin_settings.go - PERBAIKI struktur
type PoinSettings struct {
	ID                      int `json:"id"`
	PointValue              int `json:"pointValue"`              // Nilai 1 poin dalam Rupiah
	MinExchange             int `json:"minExchange"`             // Minimum poin untuk penukaran
	MinTransactionForPoints int `json:"minTransactionForPoints"` // Minimum transaksi untuk dapat poin
	Level2MinPoints         int `json:"level2MinPoints"`         // Minimum poin untuk level 2
	Level3MinPoints         int `json:"level3MinPoints"`         // Minimum poin untuk level 3
	Level2MinSpending       int `json:"level2MinSpending"`       // Legacy - tidak dipakai
	Level3MinSpending       int `json:"level3MinSpending"`       // Legacy - tidak dipakai
}

type UpdatePoinSettingsRequest struct {
	PointValue              int `json:"pointValue"`
	MinExchange             int `json:"minExchange"` 
	MinTransactionForPoints int `json:"minTransactionForPoints"`
	Level2MinPoints         int `json:"level2MinPoints"`
	Level3MinPoints         int `json:"level3MinPoints"`
	Level2MinSpending       int `json:"level2MinSpending"` // Legacy
	Level3MinSpending       int `json:"level3MinSpending"` // Legacy
}