package models

import "time"

// PrinterInfo represents information about an installed printer
type PrinterInfo struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Type        string `json:"type"` // USB, Bluetooth, Network, Virtual, Thermal
	IsDefault   bool   `json:"isDefault"`
	Status      string `json:"status"` // Online, Offline, Error
	Port        string `json:"port,omitempty"`
}

// PrintSettings represents printer configuration
type PrintSettings struct {
	ID              int       `json:"id" db:"id"`
	PrinterName     string    `json:"printerName" db:"printer_name"`
	PaperSize       string    `json:"paperSize" db:"paper_size"` // 58mm, 80mm
	PaperWidth      int       `json:"paperWidth" db:"paper_width"` // Custom width in characters (32-48)
	FontSize        string    `json:"fontSize" db:"font_size"`   // small, medium, large
	LineSpacing     int       `json:"lineSpacing" db:"line_spacing"`
	LeftMargin      int       `json:"leftMargin" db:"left_margin"` // Left margin in spaces (0-10)
	DashLineChar    string    `json:"dashLineChar" db:"dash_line_char"` // Character for dash line (default "-")
	DoubleLineChar  string    `json:"doubleLineChar" db:"double_line_char"` // Character for double line (default "=")
	HeaderAlignment string    `json:"headerAlignment" db:"header_alignment"` // left, center, right
	TitleAlignment  string    `json:"titleAlignment" db:"title_alignment"` // left, center, right
	FooterAlignment string    `json:"footerAlignment" db:"footer_alignment"` // left, center, right
	HeaderText      string    `json:"headerText" db:"header_text"`
	HeaderAddress   string    `json:"headerAddress" db:"header_address"`
	HeaderPhone     string    `json:"headerPhone" db:"header_phone"`
	FooterText      string    `json:"footerText" db:"footer_text"`
	ShowLogo        bool      `json:"showLogo" db:"show_logo"`
	AutoPrint       bool      `json:"autoPrint" db:"auto_print"`
	CopiesCount     int       `json:"copiesCount" db:"copies_count"`
	CreatedAt       time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time `json:"updatedAt" db:"updated_at"`
}

// TestPrintRequest represents a test print request
type TestPrintRequest struct {
	PrinterName string `json:"printerName"`
}

// PrintReceiptRequest represents a receipt print request
type PrintReceiptRequest struct {
	PrinterName   string             `json:"printerName"`
	TransactionID int                `json:"transactionId,omitempty"`
	TransactionNo string             `json:"transactionNo,omitempty"`
	UseCustomData bool               `json:"useCustomData,omitempty"`
	CustomData    *CustomReceiptData `json:"customData,omitempty"`
}

// CustomReceiptData for custom print data
type CustomReceiptData struct {
	StoreName     string              `json:"storeName"`
	Address       string              `json:"address"`
	Phone         string              `json:"phone"`
	TransactionNo string              `json:"transactionNo"`
	Date          time.Time           `json:"date"`
	Cashier       string              `json:"cashier"`
	CustomerName  string              `json:"customerName"`
	Items         []CustomReceiptItem `json:"items"`
	Subtotal      float64             `json:"subtotal"`
	Discount      float64             `json:"discount"`
	Total         float64             `json:"total"`
	Payment       float64             `json:"payment"`
	Change        float64             `json:"change"`
	PaymentMethod string              `json:"paymentMethod"`
	FooterText    string              `json:"footerText"`
}

// CustomReceiptItem for custom print item
type CustomReceiptItem struct {
	Name     string  `json:"name"`
	Quantity int     `json:"quantity"`
	Price    float64 `json:"price"`
	Subtotal float64 `json:"subtotal"`
}
