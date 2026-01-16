package service

import (
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"ritel-app/internal/models"
	"ritel-app/internal/repository"
	"runtime"
	"strings"
	"time"
)

type PrinterService struct {
	repo             *repository.PrinterRepository
	transaksiService *TransaksiService
}

func NewPrinterService() *PrinterService {
	return &PrinterService{
		repo:             repository.NewPrinterRepository(),
		transaksiService: NewTransaksiService(),
	}
}

// EnsurePrintSettingsSchema makes sure the print_settings table has all required columns
func (s *PrinterService) EnsurePrintSettingsSchema() error {
	return s.repo.InitPrintSettingsTable()
}

// SetDefaultPrinter updates only the default printer name in settings
func (s *PrinterService) SetDefaultPrinter(printerName string) error {
	return s.repo.SetDefaultPrinter(printerName)
}

// ===============================
// ZONA WTIME HELPER FUNCTIONS
// ===============================

// getTimeInWIB mengembalikan waktu saat ini dalam zona waktu WIB (UTC+7)
func getTimeInWIB() time.Time {
	// Dapatkan waktu UTC
	utcTime := time.Now().UTC()

	// Tambahkan 7 jam untuk WIB (UTC+7)
	wibTime := utcTime.Add(7 * time.Hour)

	return wibTime
}

// formatTimeInWIB memformat waktu ke zona waktu WIB
func formatTimeInWIB(t time.Time) string {
	// Konversi waktu ke UTC lalu tambahkan 7 jam untuk WIB
	wibTime := t.UTC().Add(7 * time.Hour)

	return wibTime.Format("02/01/2006 15:04")
}

// ===============================
// ESC/POS Helper Functions
// ===============================

// ESC/POS Command Constants
const (
	ESC = 0x1B
	GS  = 0x1D
)

// Text alignment
const (
	ALIGN_LEFT   = 0
	ALIGN_CENTER = 1
	ALIGN_RIGHT  = 2
)

// Initialize printer
func initPrinter() string {
	return string([]byte{ESC, '@'})
}

// Set text alignment
func setAlignment(align int) string {
	return string([]byte{ESC, 0x61, byte(align)})
}

// Set text size
func setTextSize(width, height int) string {
	if width < 1 || width > 8 || height < 1 || height > 8 {
		width, height = 1, 1
	}
	size := byte((width-1)<<4 | (height - 1))
	return string([]byte{GS, 0x21, size})
}

// Set character width (compress mode)
func setCharacterWidth(width int) string {
	// ESC ! n
	// Untuk font A (12x24): normal width
	// Untuk compressed: width 1
	if width == 1 {
		// Font A compressed (lebih banyak karakter per baris)
		return string([]byte{ESC, 0x21, 1})
	}
	// Font A normal
	return string([]byte{ESC, 0x21, 0})
}

// Enable/disable emphasized mode (bold)
func setEmphasized(enabled bool) string {
	if enabled {
		return string([]byte{ESC, 0x45, 1})
	}
	return string([]byte{ESC, 0x45, 0})
}

// Cut paper
func cutPaper() string {
	// GS V m n
	// m = 65 for full cut, 66 for partial cut
	// n = 0 for no feed before cut
	return string([]byte{GS, 0x56, 65, 0})
}

// getAlignmentCode converts alignment string to ESC/POS alignment code
func getAlignmentCode(alignment string) int {
	switch strings.ToLower(alignment) {
	case "left":
		return ALIGN_LEFT
	case "right":
		return ALIGN_RIGHT
	case "center", "centre":
		return ALIGN_CENTER
	default:
		return ALIGN_CENTER // Default to center if unknown
	}
}

// Helper function untuk memotong string
func truncateString(s string, maxLength int) string {
	if len(s) <= maxLength {
		return s
	}
	return s[:maxLength]
}

// Format line with left and right text, properly spaced
func formatLine(left, right string, paperWidth int) string {
	availableWidth := paperWidth - 1 // Beri 1 spasi minimum
	totalLength := len(left) + len(right)

	// Jika teks terlalu panjang untuk lebar kertas
	if totalLength >= availableWidth {
		// Jika terlalu panjang, potong bagian kiri
		maxLeft := availableWidth - len(right) - 3 // sisakan untuk "..." dan spasi
		if maxLeft < 3 {
			// Jika tidak cukup, potong bagian kanan
			maxRight := availableWidth - len(left) - 3
			if maxRight < 3 {
				// Jika masih tidak cukup, potong keduanya
				half := (availableWidth - 6) / 2
				left = truncateString(left, half) + "..."
				right = "..." + truncateString(right, half)
			} else {
				right = "..." + truncateString(right, maxRight)
			}
		} else {
			left = truncateString(left, maxLeft) + "..."
		}
	}

	space := paperWidth - len(left) - len(right)
	if space < 1 {
		space = 1
	}

	spaces := strings.Repeat(" ", space)
	return left + spaces + right + "\n"
}

// applyLeftMargin adds left margin (spaces) to a line of text
// This is for single lines or content that needs margin
func applyLeftMargin(text string, marginSpaces int) string {
	if marginSpaces <= 0 {
		return text
	}
	margin := strings.Repeat(" ", marginSpaces)
	return margin + text
}

// applyLeftMarginToSection adds left margin to multi-line section
// Skip empty lines and preserve formatting
func applyLeftMarginToSection(text string, marginSpaces int) string {
	if marginSpaces <= 0 {
		return text
	}
	margin := strings.Repeat(" ", marginSpaces)

	lines := strings.Split(text, "\n")
	for i, line := range lines {
		// Only add margin to non-empty lines
		if strings.TrimSpace(line) != "" {
			lines[i] = margin + line
		}
	}
	return strings.Join(lines, "\n")
}

// ===============================
// Printer Service Methods
// ===============================
// Note: printRaw function is defined in platform-specific files:
// - printer_service_windows.go (for Windows)
// - printer_service_other.go (for Linux/macOS)

// GetInstalledPrinters returns a list of installed printers on the system
func (s *PrinterService) GetInstalledPrinters() (printers []*models.PrinterInfo, err error) {
	// Panic Recovery
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PRINTER] 💥 PANIC in GetInstalledPrinters: %v", r)
			err = fmt.Errorf("printer system error: %v", r)
		}
	}()

	switch runtime.GOOS {
	case "windows":
		printers = s.getWindowsPrinters()
	case "linux":
		printers = s.getLinuxPrinters()
	case "darwin": // macOS
		printers = s.getMacOSPrinters()
	default:
		return nil, fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}

	return printers, nil
}

// getWindowsPrinters retrieves printers on Windows
func (s *PrinterService) getWindowsPrinters() []*models.PrinterInfo {
	var printers []*models.PrinterInfo

	// PowerShell command to get printers (robust JSON output)
	cmd := exec.Command("powershell", "-NoProfile", "-Command",
		"Get-Printer | Select-Object Name, Type, PortName, PrinterStatus | ConvertTo-Json -Depth 3")
	output, err := cmd.Output()
	if err != nil {
		// Fallback to wmic
		return s.getWindowsPrintersWMIC()
	}

	// Proper JSON parsing: handle array or single object
	type psPrinter struct {
		Name          string `json:"Name"`
		Type          string `json:"Type"`
		PortName      string `json:"PortName"`
		PrinterStatus string `json:"PrinterStatus"`
	}

	var arr []psPrinter
	var one psPrinter
	data := strings.TrimSpace(string(output))
	if data == "" {
		return printers
	}

	// Try unmarshal as array first
	if err := json.Unmarshal([]byte(data), &arr); err == nil {
		for _, p := range arr {
			status := "Online"
			if strings.TrimSpace(strings.ToUpper(p.PrinterStatus)) != "OK" && p.PrinterStatus != "" {
				status = p.PrinterStatus
			}
			printers = append(printers, &models.PrinterInfo{
				Name:        p.Name,
				DisplayName: p.Name,
				Type:        s.detectPrinterType(p.Type + " " + p.PortName + " " + p.Name),
				Port:        p.PortName,
				IsDefault:   false,
				Status:      status,
			})
		}
		return printers
	}

	// If not array, try single object
	if err := json.Unmarshal([]byte(data), &one); err == nil {
		status := "Online"
		if strings.TrimSpace(strings.ToUpper(one.PrinterStatus)) != "OK" && one.PrinterStatus != "" {
			status = one.PrinterStatus
		}
		printers = append(printers, &models.PrinterInfo{
			Name:        one.Name,
			DisplayName: one.Name,
			Type:        s.detectPrinterType(one.Type + " " + one.PortName + " " + one.Name),
			Port:        one.PortName,
			IsDefault:   false,
			Status:      status,
		})
		return printers
	}

	// If JSON parsing fails, fallback to WMIC
	return s.getWindowsPrintersWMIC()

	return printers
}

// getWindowsPrintersWMIC retrieves printers using WMIC (fallback)
func (s *PrinterService) getWindowsPrintersWMIC() []*models.PrinterInfo {
	var printers []*models.PrinterInfo

	cmd := exec.Command("wmic", "printer", "get", "name,portname,status", "/format:list")
	output, err := cmd.Output()
	if err != nil {
		return printers
	}

	lines := strings.Split(string(output), "\n")
	var currentPrinter *models.PrinterInfo

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			if currentPrinter != nil && currentPrinter.Name != "" {
				printers = append(printers, currentPrinter)
				currentPrinter = nil
			}
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		if currentPrinter == nil {
			currentPrinter = &models.PrinterInfo{}
		}

		switch key {
		case "Name":
			currentPrinter.Name = value
			currentPrinter.DisplayName = value
			currentPrinter.Type = s.detectPrinterType(value)
		case "PortName":
			currentPrinter.Port = value
		case "Status":
			if value == "OK" {
				currentPrinter.Status = "Online"
			} else {
				currentPrinter.Status = value
			}
		}
	}

	// Add last printer if exists
	if currentPrinter != nil && currentPrinter.Name != "" {
		printers = append(printers, currentPrinter)
	}

	return printers
}

// getLinuxPrinters retrieves printers on Linux
func (s *PrinterService) getLinuxPrinters() []*models.PrinterInfo {
	var printers []*models.PrinterInfo

	cmd := exec.Command("lpstat", "-p")
	output, err := cmd.Output()
	if err != nil {
		return printers
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "printer ") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				name := parts[1]
				status := "Online"
				if strings.Contains(line, "disabled") {
					status = "Offline"
				}

				printers = append(printers, &models.PrinterInfo{
					Name:        name,
					DisplayName: name,
					Type:        s.detectPrinterType(name),
					IsDefault:   false,
					Status:      status,
				})
			}
		}
	}

	return printers
}

// getMacOSPrinters retrieves printers on macOS
func (s *PrinterService) getMacOSPrinters() []*models.PrinterInfo {
	var printers []*models.PrinterInfo

	cmd := exec.Command("lpstat", "-p")
	output, err := cmd.Output()
	if err != nil {
		return printers
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "printer ") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				name := parts[1]
				status := "Online"
				if strings.Contains(line, "disabled") {
					status = "Offline"
				}

				printers = append(printers, &models.PrinterInfo{
					Name:        name,
					DisplayName: name,
					Type:        s.detectPrinterType(name),
					IsDefault:   false,
					Status:      status,
				})
			}
		}
	}

	return printers
}

// detectPrinterType detects the type of printer based on name/port
func (s *PrinterService) detectPrinterType(nameOrPort string) string {
	lowerName := strings.ToLower(nameOrPort)

	if strings.Contains(lowerName, "usb") {
		return "USB"
	}
	if strings.Contains(lowerName, "bluetooth") || strings.Contains(lowerName, "bt") {
		return "Bluetooth"
	}
	if strings.Contains(lowerName, "network") || strings.Contains(lowerName, "ip") ||
		strings.Contains(lowerName, "tcp") || strings.Contains(lowerName, "192.") ||
		strings.Contains(lowerName, "10.") {
		return "Network"
	}
	if strings.Contains(lowerName, "thermal") || strings.Contains(lowerName, "pos") ||
		strings.Contains(lowerName, "receipt") {
		return "Thermal"
	}
	if strings.Contains(lowerName, "pdf") || strings.Contains(lowerName, "xps") ||
		strings.Contains(lowerName, "onenote") {
		return "Virtual"
	}

	return "Unknown"
}

// TestPrint performs a test print to the specified printer
func (s *PrinterService) TestPrint(printerName string) error {
	// Get current settings for header info
	settings, _ := s.repo.GetPrintSettings()
	if settings == nil {
		settings = s.repo.GetDefaultSettings()
	}

	// Create test print content with ESC/POS commands
	content := s.generateTestPrintContent(settings)

	// Print using RAW method for Windows
	if runtime.GOOS == "windows" {
		return printRaw(printerName, content)
	}

	// Fallback for other OS
	return s.printContentFallback(printerName, content)
}

// generateTestPrintContent creates content for test print with ESC/POS
func (s *PrinterService) generateTestPrintContent(settings *models.PrintSettings) string {
	var content string

	content += initPrinter()
	content += setCodePage(16) // Windows Latin-1

	// Determine paper width based on settings (same logic as receipt)
	paperWidth := settings.PaperWidth
	if paperWidth == 0 {
		// Fallback to default if not set
		paperWidth = 40 // Default 40 untuk 58mm
		if settings.PaperSize == "80mm" {
			paperWidth = 48 // Default 48 untuk 80mm
		}
	}

	// Reduce paper width by left margin to accommodate margin spaces
	effectiveWidth := paperWidth - settings.LeftMargin
	if effectiveWidth < 10 {
		effectiveWidth = 10 // Minimum width
	}

	// Simple dash line using effectiveWidth
	dashLine := strings.Repeat(settings.DashLineChar, effectiveWidth)

	// === HEADER ===
	content += setAlignment(ALIGN_CENTER)
	content += setTextSize(1, 1)
	content += settings.HeaderText + "\n"
	content += "\n"

	// === TITLE ===
	content += setTextSize(2, 2)
	content += "TEST PRINT\n"
	content += setTextSize(1, 1)
	content += "\n"

	// === INFO (WITH MARGIN) ===
	var bodyContent string
	bodyContent += setAlignment(ALIGN_LEFT)
	bodyContent += dashLine + "\n"
	bodyContent += formatLine("Tanggal:", getTimeInWIB().Format("02/01/2006 15:04"), effectiveWidth)
	bodyContent += formatLine("Printer:", settings.PrinterName, effectiveWidth)
	bodyContent += formatLine("Lebar Kertas:", fmt.Sprintf("%d karakter", paperWidth), effectiveWidth)
	bodyContent += formatLine("Lebar Efektif:", fmt.Sprintf("%d karakter", effectiveWidth), effectiveWidth)
	bodyContent += dashLine + "\n"

	// Apply margin to body
	content += applyLeftMarginToSection(bodyContent, settings.LeftMargin)
	content += "\n"

	// === FOOTER ===
	content += setAlignment(ALIGN_CENTER)
	content += "TEST BERHASIL\n"
	content += "Terima kasih\n"
	content += "\n\n"

	// Cut paper
	content += cutPaper()

	return content
}

// PrintReceipt prints a transaction receipt using ESC/POS
func (s *PrinterService) PrintReceipt(req *models.PrintReceiptRequest) (err error) {
	// Panic Recovery
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PRINTER] 💥 PANIC in PrintReceipt: %v", r)
			err = fmt.Errorf("system print error: %v", r)
		}
	}()

	// Get print settings
	settings, err := s.repo.GetPrintSettings()
	if err != nil {
		settings = s.repo.GetDefaultSettings()
	}

	// Use specified printer or default from settings
	printerName := req.PrinterName
	if printerName == "" {
		printerName = settings.PrinterName
	}

	// If still no printer specified, try to auto-detect first available printer
	if printerName == "" {
		installedPrinters, err := s.GetInstalledPrinters()
		if err != nil {
			return fmt.Errorf("tidak ada printer yang dikonfigurasi. Silakan atur printer di menu Pengaturan > Pengaturan Struk")
		}
		if len(installedPrinters) == 0 {
			return fmt.Errorf("tidak ada printer yang terdeteksi di sistem. Silakan install printer terlebih dahulu")
		}
		// Use first available printer
		printerName = installedPrinters[0].Name
	}

	// Get transaction data and generate receipt
	var content string
	if req.UseCustomData && req.CustomData != nil {
		content = s.generateReceiptFromCustomData(req.CustomData, settings)
	} else {
		if req.TransactionNo == "" {
			return fmt.Errorf("nomor transaksi tidak boleh kosong")
		}
		transaksi, err := s.transaksiService.GetTransaksiByNoTransaksi(req.TransactionNo)
		if err != nil {
			return fmt.Errorf("gagal mengambil data transaksi: %v", err)
		}
		if transaksi == nil {
			return fmt.Errorf("transaksi '%s' tidak ditemukan", req.TransactionNo)
		}
		content = s.generateReceiptContent(transaksi, settings)
	}

	// Print multiple copies if specified
	finalContent := ""
	for i := 0; i < settings.CopiesCount; i++ {
		finalContent += content
	}

	// Print using RAW method for Windows
	if runtime.GOOS == "windows" {
		err := printRaw(printerName, finalContent)
		if err != nil {
			return fmt.Errorf("gagal mencetak ke printer '%s': %v", printerName, err)
		}
	} else {
		err := s.printContentFallback(printerName, finalContent)
		if err != nil {
			return fmt.Errorf("gagal mencetak ke printer '%s': %v", printerName, err)
		}
	}

	return nil
}

// generateReceiptContent creates receipt content from transaction data with ESC/POS
func (s *PrinterService) generateReceiptContent(transaksi *models.TransaksiDetail, settings *models.PrintSettings) string {
	var content string

	content += initPrinter()
	// Set Windows Latin-1 codepage for better character compatibility on Windows printers
	content += setCodePage(16)

	// Enable compressed mode untuk lebih banyak karakter
	content += setCharacterWidth(1)

	// Determine paper width based on settings
	paperWidth := settings.PaperWidth
	if paperWidth == 0 {
		// Fallback to default if not set
		paperWidth = 40 // Default 40 untuk 58mm (dengan compressed mode)
		if settings.PaperSize == "80mm" {
			paperWidth = 48 // Default 48 untuk 80mm (dengan compressed mode)
		}
	}

	// Reduce paper width by left margin to accommodate margin spaces
	effectiveWidth := paperWidth - settings.LeftMargin

	// ========== SECTION 1: HEADER (Alignment based on setting - NO MARGIN) ==========
	content += setAlignment(getAlignmentCode(settings.HeaderAlignment))
	content += s.getTextSizeCommand(settings.FontSize, false) // No compression untuk header
	content += settings.HeaderText + "\n"
	content += setTextSize(1, 1)
	content += settings.HeaderAddress + "\n"
	content += settings.HeaderPhone + "\n"
	content += "\n"

	// ========== SECTION 2: BODY (Left - WITH MARGIN) ==========
	var bodyContent string

	dashLine := strings.Repeat(settings.DashLineChar, effectiveWidth)
	bodyContent += setAlignment(ALIGN_LEFT)
	bodyContent += dashLine + "\n"

	// Transaction info - Full justify (label di kiri, value di kanan)
	bodyContent += formatLine("No Transaksi:", transaksi.Transaksi.NomorTransaksi, effectiveWidth)
	bodyContent += formatLine("Tanggal:", formatTimeInWIB(transaksi.Transaksi.Tanggal), effectiveWidth)
	bodyContent += formatLine("Kasir:", transaksi.Transaksi.Kasir, effectiveWidth)
	if transaksi.Transaksi.PelangganNama != "" && transaksi.Transaksi.PelangganNama != "Umum" {
		bodyContent += formatLine("Pelanggan:", transaksi.Transaksi.PelangganNama, effectiveWidth)
	}
	bodyContent += dashLine + "\n\n"

	// Items header - alignment based on title setting
	bodyContent += setAlignment(getAlignmentCode(settings.TitleAlignment))
	bodyContent += "DAFTAR PRODUK\n"
	bodyContent += setAlignment(ALIGN_LEFT)
	bodyContent += dashLine + "\n"

	// Items list with better formatting
	for i, item := range transaksi.Items {
		itemNum := fmt.Sprintf("%d.", i+1)
		bodyContent += itemNum + " "

		// Lebar maksimum untuk nama produk (minimal 10 karakter agar tidak panic)
		maxNameLength := effectiveWidth
		if effectiveWidth > 25 {
			maxNameLength = effectiveWidth // Biarkan satu baris penuh jika ingin wrap
		}

		productName := item.ProdukNama
		if maxNameLength > 0 && len(productName) > maxNameLength {
			// Jika ingin membatasi produk hanya 1 baris (opsional)
			// productName = productName[:maxNameLength]
		}
		bodyContent += productName + "\n"

		// Format quantity/weight and subtotal
		var qtyPrice string
		if item.BeratGram > 0 {
			// Jika produk dijual per gram, tampilkan berat
			qtyPrice = fmt.Sprintf("  %.0fg", item.BeratGram)
		} else {
			// Jika produk dijual per quantity, tampilkan jumlah
			qtyPrice = fmt.Sprintf("  %d x %s", item.Jumlah, formatRupiah(float64(item.HargaSatuan)))
		}
		subtotal := formatRupiah(float64(item.Subtotal))
		bodyContent += formatLine(qtyPrice, subtotal, effectiveWidth)
		bodyContent += "\n"
	}

	bodyContent += dashLine + "\n"

	// Totals with better formatting
	bodyContent += formatLine("Subtotal:", formatRupiah(float64(transaksi.Transaksi.Subtotal)), effectiveWidth)
	if transaksi.Transaksi.Diskon > 0 {
		bodyContent += formatLine("Diskon:", formatRupiah(float64(transaksi.Transaksi.Diskon)), effectiveWidth)
	}

	doubleLine := strings.Repeat(settings.DoubleLineChar, effectiveWidth)
	bodyContent += doubleLine + "\n"
	bodyContent += setEmphasized(true)
	bodyContent += formatLine("TOTAL:", formatRupiah(float64(transaksi.Transaksi.Total)), effectiveWidth)
	bodyContent += setEmphasized(false)

	bodyContent += formatLine("Dibayar:", formatRupiah(float64(transaksi.Transaksi.TotalBayar)), effectiveWidth)
	bodyContent += formatLine("Kembalian:", formatRupiah(float64(transaksi.Transaksi.Kembalian)), effectiveWidth)
	bodyContent += "\n"

	// Payment methods
	if len(transaksi.Pembayaran) > 0 {
		bodyContent += doubleLine + "\n"
		bodyContent += setAlignment(getAlignmentCode(settings.TitleAlignment))
		bodyContent += "METODE PEMBAYARAN\n"
		bodyContent += setAlignment(ALIGN_LEFT)
		for _, p := range transaksi.Pembayaran {
			paymentMethod := strings.Title(p.Metode)
			bodyContent += formatLine(paymentMethod+":", formatRupiah(float64(p.Jumlah)), effectiveWidth)
		}
		bodyContent += "\n"
	}
	bodyContent += doubleLine + "\n\n"

	// Apply margin to body section
	content += applyLeftMarginToSection(bodyContent, settings.LeftMargin)

	// ========== SECTION 3: FOOTER (Alignment based on setting - NO MARGIN) ==========
	content += setAlignment(getAlignmentCode(settings.FooterAlignment))
	footerLines := strings.Split(settings.FooterText, "\\n")
	for _, line := range footerLines {
		content += line + "\n"
	}
	content += "\n\n"

	// Cut paper
	content += cutPaper()

	return content
}

// generateReceiptFromCustomData creates receipt from custom data with ESC/POS
func (s *PrinterService) generateReceiptFromCustomData(data *models.CustomReceiptData, settings *models.PrintSettings) string {
	var content string

	content += initPrinter()
	// Set Windows Latin-1 codepage for better character compatibility on Windows printers
	content += setCodePage(16)

	// Enable compressed mode untuk lebih banyak karakter
	content += setCharacterWidth(1)

	// Determine paper width based on settings
	paperWidth := settings.PaperWidth
	if paperWidth == 0 {
		// Fallback to default if not set
		paperWidth = 40 // Default 40 untuk 58mm (dengan compressed mode)
		if settings.PaperSize == "80mm" {
			paperWidth = 48 // Default 48 untuk 80mm (dengan compressed mode)
		}
	}

	// Reduce paper width by left margin to accommodate margin spaces
	effectiveWidth := paperWidth - settings.LeftMargin

	// ========== SECTION 1: HEADER (Center - NO MARGIN) ==========
	content += setAlignment(ALIGN_CENTER)
	content += s.getTextSizeCommand(settings.FontSize, false) // No compression untuk header
	content += data.StoreName + "\n"
	content += setTextSize(1, 1)
	content += data.Address + "\n"
	content += data.Phone + "\n"
	content += "\n"

	// ========== SECTION 2: BODY (Left - WITH MARGIN) ==========
	var bodyContent string

	dashLine := strings.Repeat(settings.DashLineChar, effectiveWidth)
	bodyContent += setAlignment(ALIGN_LEFT)
	bodyContent += dashLine + "\n"

	// Transaction info - Full justify (label di kiri, value di kanan)
	bodyContent += formatLine("No Transaksi:", data.TransactionNo, effectiveWidth)
	bodyContent += formatLine("Tanggal:", formatTimeInWIB(data.Date), effectiveWidth)
	bodyContent += formatLine("Kasir:", data.Cashier, effectiveWidth)
	if data.CustomerName != "" && data.CustomerName != "Umum" {
		bodyContent += formatLine("Pelanggan:", data.CustomerName, effectiveWidth)
	}
	bodyContent += dashLine + "\n\n"

	// Items header
	bodyContent += setAlignment(getAlignmentCode(settings.TitleAlignment))
	bodyContent += "DAFTAR PRODUK\n"
	bodyContent += setAlignment(ALIGN_LEFT)
	bodyContent += dashLine + "\n"

	// Items list with better formatting
	for i, item := range data.Items {
		itemNum := fmt.Sprintf("%d.", i+1)
		bodyContent += itemNum + " "

		// Lebar maksimum untuk nama produk
		maxNameLength := effectiveWidth

		productName := item.Name
		if maxNameLength > 0 && len(productName) > maxNameLength {
			// productName = productName[:maxNameLength]
		}
		bodyContent += productName + "\n"

		// Format quantity, unit price and subtotal
		qtyPrice := fmt.Sprintf("  %d x %s", item.Quantity, formatRupiah(item.Price))
		subtotal := formatRupiah(item.Subtotal)
		bodyContent += formatLine(qtyPrice, subtotal, effectiveWidth)
		bodyContent += "\n"
	}

	bodyContent += dashLine + "\n"

	// Totals with better formatting
	bodyContent += formatLine("Subtotal:", formatRupiah(data.Subtotal), effectiveWidth)
	if data.Discount > 0 {
		bodyContent += formatLine("Diskon:", formatRupiah(data.Discount), effectiveWidth)
	}

	doubleLine := strings.Repeat(settings.DoubleLineChar, effectiveWidth)
	bodyContent += doubleLine + "\n"
	bodyContent += setEmphasized(true)
	bodyContent += formatLine("TOTAL:", formatRupiah(data.Total), effectiveWidth)
	bodyContent += setEmphasized(false)

	bodyContent += formatLine("Dibayar:", formatRupiah(data.Payment), effectiveWidth)
	bodyContent += formatLine("Kembalian:", formatRupiah(data.Change), effectiveWidth)
	bodyContent += "\n"

	// Payment methods
	if data.PaymentMethod != "" {
		bodyContent += doubleLine + "\n"
		bodyContent += setAlignment(getAlignmentCode(settings.TitleAlignment))
		bodyContent += "METODE PEMBAYARAN\n"
		bodyContent += setAlignment(ALIGN_LEFT)
		bodyContent += formatLine(data.PaymentMethod+":", formatRupiah(data.Payment), effectiveWidth)
		bodyContent += "\n"
	}
	bodyContent += doubleLine + "\n\n"

	// Apply margin to body section
	content += applyLeftMarginToSection(bodyContent, settings.LeftMargin)

	// ========== SECTION 3: FOOTER (Alignment based on setting - NO MARGIN) ==========
	content += setAlignment(getAlignmentCode(settings.FooterAlignment))
	footerLines := strings.Split(settings.FooterText, "\\n")
	for _, line := range footerLines {
		content += line + "\n"
	}
	content += "\n\n"

	// Cut paper
	content += cutPaper()

	return content
}

// getTextSizeCommand returns ESC/POS command for text size based on settings
func (s *PrinterService) getTextSizeCommand(fontSize string, compressed bool) string {
	if compressed {
		// Mode compressed untuk lebih banyak karakter
		switch fontSize {
		case "small":
			return setTextSize(1, 1) + setCharacterWidth(1)
		case "large":
			return setTextSize(2, 2) + setCharacterWidth(1)
		default: // medium
			return setTextSize(1, 2) + setCharacterWidth(1)
		}
	} else {
		// Mode normal
		switch fontSize {
		case "small":
			return setTextSize(1, 1)
		case "large":
			return setTextSize(2, 2)
		default: // medium
			return setTextSize(1, 2)
		}
	}
}

// Fallback print method for non-Windows systems
func (s *PrinterService) printContentFallback(printerName, content string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "linux", "darwin":
		// Use lp command
		cmd = exec.Command("lp", "-d", printerName, "-")
		cmd.Stdin = strings.NewReader(content)
	default:
		return fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Print error: %v, output: %s", err, string(output))
		return fmt.Errorf("failed to print: %v", err)
	}

	log.Printf("Print successful to: %s", printerName)
	return nil
}

// Helper function for formatting currency
func formatRupiah(amount float64) string {
	// Format dengan thousand separator
	amountStr := fmt.Sprintf("%.0f", amount)

	// Add thousand separator
	var result []rune
	counter := 0
	for i := len(amountStr) - 1; i >= 0; i-- {
		if counter > 0 && counter%3 == 0 {
			result = append([]rune{'.'}, result...)
		}
		result = append([]rune{rune(amountStr[i])}, result...)
		counter++
	}

	return "Rp " + string(result)
}

// GetPrintSettings retrieves current print settings
func (s *PrinterService) GetPrintSettings() (*models.PrintSettings, error) {
	return s.repo.GetPrintSettings()
}

// SavePrintSettings saves print settings
func (s *PrinterService) SavePrintSettings(settings *models.PrintSettings) error {
	return s.repo.SavePrintSettings(settings)
}

// Set code page for character encoding
// Common values: 0=CP437 (USA), 16=CP1252 (Windows Latin-1)
func setCodePage(code byte) string {
	return string([]byte{ESC, 't', code})
}
