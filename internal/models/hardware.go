package models

// HardwareDevice represents a detected hardware device
type HardwareDevice struct {
	Name         string `json:"name"`         // Device name
	Type         string `json:"type"`         // Device type: "scanner", "printer", "cash_drawer", "unknown"
	Connection   string `json:"connection"`   // Connection type: "USB", "Serial", "HID", "Bluetooth"
	Port         string `json:"port"`         // Port name (e.g., "COM3", "/dev/ttyUSB0")
	VendorID     string `json:"vendorId"`     // USB Vendor ID
	ProductID    string `json:"productId"`    // USB Product ID
	Manufacturer string `json:"manufacturer"` // Manufacturer name
	Description  string `json:"description"`  // Device description
	IsConnected  bool   `json:"isConnected"`  // Connection status
}

// HardwareListResponse represents response for hardware list
type HardwareListResponse struct {
	Devices []HardwareDevice `json:"devices"`
	Count   int              `json:"count"`
}

// TestHardwareRequest represents request to test hardware
type TestHardwareRequest struct {
	DeviceType string `json:"deviceType"` // "scanner", "printer", "cash_drawer"
	Port       string `json:"port"`       // Port to test
}

// TestHardwareResponse represents response for hardware test
type TestHardwareResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    string `json:"data,omitempty"` // Test result data
}
