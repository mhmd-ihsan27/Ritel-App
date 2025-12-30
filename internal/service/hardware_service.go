package service

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"

	"ritel-app/internal/models"

	"go.bug.st/serial"
)

type HardwareService struct{}

func NewHardwareService() *HardwareService {
	return &HardwareService{}
}

// DetectHardware detects all connected hardware devices
func (s *HardwareService) DetectHardware() (*models.HardwareListResponse, error) {
	devices := []models.HardwareDevice{}

	// Detect serial ports (for barcode scanners, printers, cash drawers)
	serialDevices, err := s.detectSerialPorts()
	if err == nil {
		devices = append(devices, serialDevices...)
	}

	// Detect USB HID devices (for barcode scanners)
	if runtime.GOOS == "windows" {
		usbDevices, err := s.detectUSBDevicesWindows()
		if err == nil {
			devices = append(devices, usbDevices...)
		}
	}

	return &models.HardwareListResponse{
		Devices: devices,
		Count:   len(devices),
	}, nil
}

// detectSerialPorts detects all serial/COM ports
func (s *HardwareService) detectSerialPorts() ([]models.HardwareDevice, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}

	devices := []models.HardwareDevice{}

	for _, port := range ports {
		device := models.HardwareDevice{
			Name:        fmt.Sprintf("Serial Device on %s", port),
			Type:        "unknown", // Will be determined by testing
			Connection:  "Serial",
			Port:        port,
			Description: "Serial/COM Port Device",
			IsConnected: true,
		}

		// Try to identify device type by port name patterns
		portLower := strings.ToLower(port)
		if strings.Contains(portLower, "usb") {
			device.Connection = "USB"
		}

		devices = append(devices, device)
	}

	return devices, nil
}

// detectUSBDevicesWindows detects USB devices on Windows using WMI
func (s *HardwareService) detectUSBDevicesWindows() ([]models.HardwareDevice, error) {
	// Query multiple device classes for better detection
	cmd := exec.Command("powershell", "-Command",
		`Get-WmiObject Win32_PnPEntity | Where-Object {
			$_.PNPClass -eq 'USB' -or
			$_.PNPClass -eq 'Ports' -or
			$_.PNPClass -eq 'HIDClass' -or
			$_.PNPClass -eq 'Mouse' -or
			$_.PNPClass -eq 'Keyboard' -or
			$_.Name -like '*mouse*' -or
			$_.Name -like '*keyboard*' -or
			$_.Name -like '*pen*' -or
			$_.Name -like '*digitizer*' -or
			$_.Name -like '*scanner*' -or
			$_.Name -like '*barcode*' -or
			$_.Name -like '*printer*'
		} | Select-Object Name, DeviceID, Manufacturer, Status, PNPClass | ConvertTo-Json`)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to execute PowerShell command: %w", err)
	}

	devices := []models.HardwareDevice{}

	// Parse output
	outputStr := string(output)
	if strings.TrimSpace(outputStr) != "" && outputStr != "null" {
		lines := strings.Split(outputStr, "\n")
		deviceName := ""
		deviceClass := ""

		for _, line := range lines {
			if strings.Contains(line, "Name") {
				deviceName = extractValue(line)
			}
			if strings.Contains(line, "PNPClass") {
				deviceClass = extractValue(line)
			}

			// Create device when we have complete info
			if deviceName != "" && (strings.Contains(line, "}") || strings.Contains(line, "Status")) {
				deviceType := s.identifyDeviceType(deviceName + " " + deviceClass)

				// Only add devices we're interested in
				if deviceType != "unknown" {
					device := models.HardwareDevice{
						Name:        deviceName,
						Type:        deviceType,
						Connection:  "USB/HID",
						Description: fmt.Sprintf("%s - %s", deviceClass, deviceName),
						IsConnected: true,
					}
					devices = append(devices, device)
				}

				deviceName = ""
				deviceClass = ""
			}
		}
	}

	return devices, nil
}

// identifyDeviceType tries to identify device type from device name
func (s *HardwareService) identifyDeviceType(deviceInfo string) string {
	deviceLower := strings.ToLower(deviceInfo)

	// Mouse keywords - check first as it's most common
	if strings.Contains(deviceLower, "mouse") || strings.Contains(deviceLower, "pointing") {
		return "mouse"
	}

	// Keyboard keywords
	if strings.Contains(deviceLower, "keyboard") || strings.Contains(deviceLower, "kbd") {
		return "keyboard"
	}

	// Pen/Digitizer keywords
	if strings.Contains(deviceLower, "pen") || strings.Contains(deviceLower, "digitizer") ||
		strings.Contains(deviceLower, "stylus") || strings.Contains(deviceLower, "wacom") {
		return "pen"
	}

	// Barcode scanner keywords
	if strings.Contains(deviceLower, "scanner") || strings.Contains(deviceLower, "barcode") ||
		strings.Contains(deviceLower, "symbol") || strings.Contains(deviceLower, "honeywell") ||
		strings.Contains(deviceLower, "datalogic") || strings.Contains(deviceLower, "zebra") ||
		strings.Contains(deviceLower, "hid keyboard device") {
		// Note: Many USB barcode scanners appear as "HID Keyboard Device"
		return "scanner"
	}

	// Printer keywords
	if strings.Contains(deviceLower, "printer") || strings.Contains(deviceLower, "pos") ||
		strings.Contains(deviceLower, "thermal") || strings.Contains(deviceLower, "epson") ||
		strings.Contains(deviceLower, "star") || strings.Contains(deviceLower, "xprinter") {
		return "printer"
	}

	// Cash drawer keywords
	if strings.Contains(deviceLower, "drawer") || strings.Contains(deviceLower, "cash") {
		return "cash_drawer"
	}

	return "unknown"
}

// extractValue extracts value from PowerShell output line
func extractValue(line string) string {
	parts := strings.Split(line, ":")
	if len(parts) >= 2 {
		value := strings.TrimSpace(parts[1])
		value = strings.Trim(value, `",`)
		return value
	}
	return ""
}

// TestScanner tests barcode scanner by trying to read from it
func (s *HardwareService) TestScanner(port string) (*models.TestHardwareResponse, error) {
	if port == "" {
		return &models.TestHardwareResponse{
			Success: false,
			Message: "Port not specified",
		}, nil
	}

	// Try to open the port
	mode := &serial.Mode{
		BaudRate: 9600,
		Parity:   serial.NoParity,
		DataBits: 8,
		StopBits: serial.OneStopBit,
	}

	port_handle, err := serial.Open(port, mode)
	if err != nil {
		return &models.TestHardwareResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to open port: %v", err),
		}, nil
	}
	defer port_handle.Close()

	return &models.TestHardwareResponse{
		Success: true,
		Message: "Scanner port opened successfully. Please scan a barcode to test.",
		Data:    port,
	}, nil
}

// TestPrinter tests printer by sending test print
func (s *HardwareService) TestPrinter(port string) (*models.TestHardwareResponse, error) {
	if port == "" {
		return &models.TestHardwareResponse{
			Success: false,
			Message: "Port not specified",
		}, nil
	}

	// Try to open the port
	mode := &serial.Mode{
		BaudRate: 9600,
		Parity:   serial.NoParity,
		DataBits: 8,
		StopBits: serial.OneStopBit,
	}

	port_handle, err := serial.Open(port, mode)
	if err != nil {
		return &models.TestHardwareResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to open port: %v", err),
		}, nil
	}
	defer port_handle.Close()

	// Send test print (ESC/POS command)
	testData := []byte("\x1B\x40") // Initialize printer
	testData = append(testData, []byte("TEST PRINT - Ritel-App\n\n")...)
	testData = append(testData, []byte("Printer berhasil terhubung!\n")...)
	testData = append(testData, []byte("\x1D\x56\x00")...) // Cut paper

	_, err = port_handle.Write(testData)
	if err != nil {
		return &models.TestHardwareResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to send test print: %v", err),
		}, nil
	}

	return &models.TestHardwareResponse{
		Success: true,
		Message: "Test print sent successfully",
		Data:    port,
	}, nil
}

// TestCashDrawer tests cash drawer by sending open command
func (s *HardwareService) TestCashDrawer(port string) (*models.TestHardwareResponse, error) {
	if port == "" {
		return &models.TestHardwareResponse{
			Success: false,
			Message: "Port not specified",
		}, nil
	}

	// Try to open the port
	mode := &serial.Mode{
		BaudRate: 9600,
		Parity:   serial.NoParity,
		DataBits: 8,
		StopBits: serial.OneStopBit,
	}

	port_handle, err := serial.Open(port, mode)
	if err != nil {
		return &models.TestHardwareResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to open port: %v", err),
		}, nil
	}
	defer port_handle.Close()

	// Send cash drawer open command (ESC/POS)
	openCommand := []byte{0x1B, 0x70, 0x00, 0x19, 0xFA}

	_, err = port_handle.Write(openCommand)
	if err != nil {
		return &models.TestHardwareResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to send open command: %v", err),
		}, nil
	}

	return &models.TestHardwareResponse{
		Success: true,
		Message: "Cash drawer open command sent successfully",
		Data:    port,
	}, nil
}
