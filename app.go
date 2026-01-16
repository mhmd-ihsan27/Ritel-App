package main

import (
	"context"
	"fmt"
	"log"
	"ritel-app/internal/container"
	"ritel-app/internal/models"
	"ritel-app/internal/sync"
	"strconv"
	"time"
)

// App struct - now uses ServiceContainer for shared services
type App struct {
	ctx      context.Context
	services *container.ServiceContainer
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// SetServices injects the service container
func (a *App) SetServices(services *container.ServiceContainer) {
	a.services = services
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize printer debug log
	if err := InitPrinterLog(); err != nil {
		log.Printf("Warning: Failed to initialize printer log: %v", err)
	}

	log.Println("[WAILS] App startup complete")
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	log.Println("[WAILS] App shutting down")
	ClosePrinterLog()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ==================== PRODUK API ====================

// CreateProduk creates a new product
func (a *App) CreateProduk(produk models.Produk) error {
	return a.services.ProdukService.CreateProduk(&produk)
}

// GetAllProduk retrieves all products
func (a *App) GetAllProduk() ([]*models.Produk, error) {
	return a.services.ProdukService.GetAllProduk()
}

// ==================== STOK MANAGEMENT API ====================

// UpdateStok updates product stock
func (a *App) UpdateStok(req models.UpdateStokRequest) error {
	return a.services.ProdukService.UpdateStok(&req)
}

// UpdateStokIncrement updates stock by increment/decrement
func (a *App) UpdateStokIncrement(req models.UpdateStokRequest) error {
	return a.services.ProdukService.UpdateStokIncrement(&req)
}

// GetStokHistory retrieves stock history for a product
func (a *App) GetStokHistory(produkID int) ([]*models.StokHistory, error) {
	log.Printf("Getting stock history for product ID: %d", produkID)
	history, err := a.services.ProdukService.GetStokHistory(produkID)
	if err != nil {
		log.Printf("❌ Error getting stock history for product %d: %v", produkID, err)
		return nil, fmt.Errorf("failed to get stock history: %w", err)
	}
	log.Printf("✅ Stock history retrieved: %d records for product %d", len(history), produkID)
	return history, nil
}

// ==================== BATCH API ENDPOINTS ====================

// GetBatchesByProduk retrieves all batches for a product (FIFO order)
func (a *App) GetBatchesByProduk(produkID int) ([]*models.Batch, error) {
	log.Printf("Getting batches for product ID: %d", produkID)
	return a.services.BatchService.GetBatchesByProduk(produkID)
}

// GetBatchByID retrieves a specific batch by ID
func (a *App) GetBatchByID(batchID string) (*models.Batch, error) {
	log.Printf("Getting batch by ID: %s", batchID)
	return a.services.BatchService.GetBatchByID(batchID)
}

// GetAllBatches retrieves all batches
func (a *App) GetAllBatches() ([]*models.Batch, error) {
	log.Println("Getting all batches")
	return a.services.BatchService.GetAllBatches()
}

// GetExpiringBatches retrieves batches expiring within threshold days
func (a *App) GetExpiringBatches(daysThreshold int) ([]*models.Batch, error) {
	log.Printf("Getting expiring batches within %d days", daysThreshold)
	return a.services.BatchService.GetExpiringBatches(daysThreshold)
}

// DeleteExpiredBatch marks a batch as expired and sets qty to 0
func (a *App) DeleteExpiredBatch(batchID string) error {
	log.Printf("Deleting expired batch: %s", batchID)
	return a.services.BatchService.DeleteExpiredBatch(batchID)
}

// GetBatchSummary returns summary of batches for a product
func (a *App) GetBatchSummary(produkID int) (map[string]interface{}, error) {
	log.Printf("Getting batch summary for product ID: %d", produkID)
	return a.services.BatchService.GetBatchSummaryByProduk(produkID)
}

// UpdateBatchStatuses updates status for all batches based on current date
func (a *App) UpdateBatchStatuses() error {
	log.Println("Updating batch statuses")
	return a.services.BatchService.UpdateBatchStatuses()
}

func (a *App) UpdateProduk(produk models.Produk) error {
	return a.services.ProdukService.UpdateProduk(&produk)
}

// ScanBarcode scans a barcode and adds product to cart
func (a *App) ScanBarcode(barcode string, jumlah int) (*models.ScanBarcodeResponse, error) {
	log.Printf("Scanning barcode: %s, quantity: %d", barcode, jumlah)
	return a.services.ProdukService.ScanBarcode(barcode, jumlah)
}

// ==================== KERANJANG API ====================

// GetKeranjang retrieves all cart items
func (a *App) GetKeranjang() ([]*models.KeranjangItem, error) {
	return a.services.ProdukService.GetKeranjang()
}

// ProcessKeranjang processes cart and updates stock
func (a *App) ProcessKeranjang() error {
	log.Println("Processing cart items...")
	return a.services.ProdukService.ProcessKeranjang()
}

// ClearKeranjang clears the cart
func (a *App) ClearKeranjang() error {
	return a.services.ProdukService.ClearKeranjang()
}

// RemoveFromKeranjang removes an item from cart
func (a *App) RemoveFromKeranjang(id int) error {
	return a.services.ProdukService.RemoveFromKeranjang(id)
}

// UpdateKeranjangJumlah updates quantity in cart
func (a *App) UpdateKeranjangJumlah(id int, jumlah int) error {
	return a.services.ProdukService.UpdateKeranjangJumlah(id, jumlah)
}

// ==================== KATEGORI API ====================

// CreateKategori creates a new category
func (a *App) CreateKategori(kategori models.Kategori) error {
	return a.services.KategoriService.CreateKategori(&kategori)
}

// GetAllKategori retrieves all categories
func (a *App) GetAllKategori() ([]*models.Kategori, error) {
	return a.services.KategoriService.GetAllKategori()
}

// GetKategoriByID retrieves a category by ID
func (a *App) GetKategoriByID(id int) (*models.Kategori, error) {
	return a.services.KategoriService.GetKategoriByID(id)
}

// UpdateKategori updates a category
func (a *App) UpdateKategori(kategori models.Kategori) error {
	return a.services.KategoriService.UpdateKategori(&kategori)
}

// DeleteKategori deletes a category
func (a *App) DeleteKategori(id int) error {
	return a.services.KategoriService.DeleteKategori(id)
}

func (a *App) DeleteProduk(id int) error {
	return a.services.ProdukService.DeleteProduk(id)
}

// ==================== TRANSAKSI API ====================

// CreateTransaksi creates a new transaction
func (a *App) CreateTransaksi(req models.CreateTransaksiRequest) (*models.TransaksiResponse, error) {
	log.Printf("Creating transaction with %d items", len(req.Items))
	return a.services.TransaksiService.CreateTransaksi(&req)
}

// GetTransaksiByID retrieves a transaction by ID
func (a *App) GetTransaksiByID(idStr string) (*models.TransaksiDetail, error) {
	// Parse string ID to int64
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		log.Printf("[APP] GetTransaksiByID error parsing ID: %v", err)
		return nil, fmt.Errorf("invalid transaction ID: %s", idStr)
	}

	log.Printf("[APP] GetTransaksiByID called with id: %d", id)
	result, err := a.services.TransaksiService.GetTransaksiByID(id)
	if err != nil {
		log.Printf("[APP] GetTransaksiByID error: %v", err)
		return nil, err
	}
	log.Printf("[APP] GetTransaksiByID success: transaction %s with %d items", result.Transaksi.NomorTransaksi, len(result.Items))
	return result, nil
}

// GetTransaksiByNoTransaksi retrieves a transaction by transaction number
func (a *App) GetTransaksiByNoTransaksi(nomorTransaksi string) (*models.TransaksiDetail, error) {
	return a.services.TransaksiService.GetTransaksiByNoTransaksi(nomorTransaksi)
}

// GetAllTransaksi retrieves all transactions with pagination
func (a *App) GetAllTransaksi(limit, offset int) ([]*models.Transaksi, error) {
	log.Printf("[APP] GetAllTransaksi called with limit: %d, offset: %d", limit, offset)
	result, err := a.services.TransaksiService.GetAllTransaksi(limit, offset)
	if err != nil {
		log.Printf("[APP] GetAllTransaksi error: %v", err)
		return nil, err
	}
	log.Printf("[APP] GetAllTransaksi success: returned %d transactions", len(result))
	return result, nil
}

// GetTransaksiByDateRange retrieves transactions within a date range
func (a *App) GetTransaksiByDateRange(startDateStr, endDateStr string) ([]*models.Transaksi, error) {
	start, err := a.parseDate(startDateStr)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDateStr)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}
	return a.services.TransaksiService.GetTransaksiByDateRange(start, end)
}

// GetTodayStats gets statistics for today's transactions
func (a *App) GetTodayStats() (map[string]interface{}, error) {
	return a.services.TransaksiService.GetTodayStats()
}

// ==================== PELANGGAN API ====================

// CreatePelanggan creates a new customer
func (a *App) CreatePelanggan(req models.CreatePelangganRequest) (*models.Pelanggan, error) {
	pelanggan, err := a.services.PelangganService.CreatePelanggan(&req)
	if err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	return pelanggan, nil
}

// GetAllPelanggan retrieves all customers
func (a *App) GetAllPelanggan() ([]*models.Pelanggan, error) {
	return a.services.PelangganService.GetAllPelanggan()
}

// GetPelangganByID retrieves a customer by ID
func (a *App) GetPelangganByID(id int64) (*models.Pelanggan, error) {
	return a.services.PelangganService.GetPelangganByID(id)
}

// GetPelangganByTelepon retrieves a customer by phone number
func (a *App) GetPelangganByTelepon(telepon string) (*models.Pelanggan, error) {
	return a.services.PelangganService.GetPelangganByTelepon(telepon)
}

// UpdatePelanggan updates a customer
func (a *App) UpdatePelanggan(req models.UpdatePelangganRequest) (*models.Pelanggan, error) {
	log.Printf("Updating pelanggan ID: %d", req.ID)
	return a.services.PelangganService.UpdatePelanggan(&req)
}

// DeletePelanggan deletes a customer
func (a *App) DeletePelanggan(id int64) error {
	log.Printf("Deleting pelanggan ID: %d", id)
	return a.services.PelangganService.DeletePelanggan(id)
}

// AddPoin adds points to a customer
func (a *App) AddPoin(req models.AddPoinRequest) (*models.Pelanggan, error) {
	log.Printf("Adding %d points to pelanggan ID: %d", req.Poin, req.PelangganID)
	return a.services.PelangganService.AddPoin(&req)
}

// GetPelangganByTipe retrieves customers by type
func (a *App) GetPelangganByTipe(tipe string) ([]*models.Pelanggan, error) {
	return a.services.PelangganService.GetPelangganByTipe(tipe)
}

// ==================== SETTINGS API ====================

// GetPoinSettings retrieves point system settings
func (a *App) GetPoinSettings() (*models.PoinSettings, error) {
	log.Println("Getting poin settings")
	return a.services.SettingsService.GetPoinSettings()
}

// UpdatePoinSettings updates point system settings
func (a *App) UpdatePoinSettings(req models.UpdatePoinSettingsRequest) (*models.PoinSettings, error) {
	log.Printf("[APP] Updating poin settings. Request: %+v", req)
	return a.services.SettingsService.UpdatePoinSettings(&req)
}

// ==================== HARDWARE API ====================

// DetectHardware detects all connected hardware devices
func (a *App) DetectHardware() (*models.HardwareListResponse, error) {
	log.Println("Detecting hardware devices")
	return a.services.HardwareService.DetectHardware()
}

// TestScanner tests barcode scanner connection
func (a *App) TestScanner(port string) (*models.TestHardwareResponse, error) {
	log.Printf("Testing scanner on port: %s", port)
	return a.services.HardwareService.TestScanner(port)
}

// TestPrinter tests printer connection
func (a *App) TestPrinter(port string) (*models.TestHardwareResponse, error) {
	log.Printf("Testing printer on port: %s", port)
	return a.services.HardwareService.TestPrinter(port)
}

// TestCashDrawer tests cash drawer connection
func (a *App) TestCashDrawer(port string) (*models.TestHardwareResponse, error) {
	log.Printf("Testing cash drawer on port: %s", port)
	return a.services.HardwareService.TestCashDrawer(port)
}

// ==================== PROMO API ====================

// CreatePromo creates a new promo
func (a *App) CreatePromo(req models.CreatePromoRequest) (*models.Promo, error) {
	log.Printf("Creating promo: %s", req.Nama)
	return a.services.PromoService.CreatePromo(&req)
}

// GetAllPromo retrieves all promos
func (a *App) GetAllPromo() ([]*models.Promo, error) {
	return a.services.PromoService.GetAllPromo()
}

// GetActivePromos retrieves all active promos
func (a *App) GetActivePromos() ([]*models.Promo, error) {
	return a.services.PromoService.GetActivePromos()
}

// GetPromoByID retrieves a promo by ID
func (a *App) GetPromoByID(idStr string) (*models.Promo, error) {
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return nil, fmt.Errorf("invalid ID: %s", idStr)
	}
	return a.services.PromoService.GetPromoByID(id)
}

// GetPromoByKode retrieves a promo by code
func (a *App) GetPromoByKode(kode string) (*models.Promo, error) {
	return a.services.PromoService.GetPromoByKode(kode)
}

// UpdatePromo updates a promo
func (a *App) UpdatePromo(req models.UpdatePromoRequest) (*models.Promo, error) {
	log.Printf("Updating promo ID: %d", req.ID)
	return a.services.PromoService.UpdatePromo(&req)
}

// DeletePromo deletes a promo
func (a *App) DeletePromo(idStr string) error {
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return fmt.Errorf("invalid ID: %s", idStr)
	}
	log.Printf("Deleting promo ID: %d", id)
	return a.services.PromoService.DeletePromo(id)
}

// ApplyPromo calculates discount for a promo code
func (a *App) ApplyPromo(req models.ApplyPromoRequest) (*models.ApplyPromoResponse, error) {
	log.Printf("Applying promo code: %s", req.Kode)
	return a.services.PromoService.ApplyPromo(&req)
}

// GetPromoForProduct gets active promos for a specific product
func (a *App) GetPromoForProduct(produkID int) ([]*models.Promo, error) {
	return a.services.PromoService.GetPromoForProduct(produkID)
}

// GetPromoProducts gets products associated with a promo
func (a *App) GetPromoProducts(promoIDStr string) ([]*models.Produk, error) {
	promoID, err := strconv.Atoi(promoIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid ID: %s", promoIDStr)
	}
	return a.services.PromoService.GetPromoProducts(promoID)
}

// ==================== RETURN API ====================

// CreateReturn creates a new return transaction
func (a *App) CreateReturn(req models.CreateReturnRequest) error {
	log.Printf("Creating return for transaction: %s", req.NoTransaksi)
	return a.services.ReturnService.CreateReturn(&req)
}

// GetAllReturn retrieves all returns
func (a *App) GetAllReturn() ([]*models.ReturnDetail, error) {
	return a.services.ReturnService.GetAllReturn()
}

// GetAllReturns is an alias for GetAllReturn (for consistency)
func (a *App) GetAllReturns() ([]*models.ReturnDetail, error) {
	return a.services.ReturnService.GetAllReturn()
}

// GetReturnByID retrieves a return by ID
func (a *App) GetReturnByID(id int) (*models.ReturnDetail, error) {
	return a.services.ReturnService.GetReturnByID(id)
}

// ==================== PRINTER API ====================

// GetInstalledPrinters retrieves all installed printers
func (a *App) GetInstalledPrinters() ([]*models.PrinterInfo, error) {
	log.Println("Getting installed printers...")
	return a.services.PrinterService.GetInstalledPrinters()
}

// TestPrint performs a test print
func (a *App) TestPrint(printerName string) error {
	log.Printf("Test printing to: %s", printerName)
	return a.services.PrinterService.TestPrint(printerName)
}

func (a *App) DebugPromoValidation(promoKode string, items []models.TransaksiItemRequest) (string, error) {
	return a.services.PromoService.DebugPromoValidation(promoKode, items)
}

// PrintReceipt prints a transaction receipt
func (a *App) PrintReceipt(req models.PrintReceiptRequest) error {
	log.Printf("Printing receipt: %s", req.TransactionNo)
	return a.services.PrinterService.PrintReceipt(&req)
}

// GetPrintSettings retrieves current print settings
func (a *App) GetPrintSettings() (*models.PrintSettings, error) {
	log.Println("[PRINTER SETTINGS] ========== GET SETTINGS ==========")
	settings, err := a.services.PrinterService.GetPrintSettings()

	if err != nil {
		log.Printf("[PRINTER SETTINGS] ERROR: Failed to get settings: %v", err)
		return nil, err
	}

	if settings == nil {
		log.Println("[PRINTER SETTINGS] WARNING: Settings returned nil")
		return nil, fmt.Errorf("settings not found")
	}

	log.Printf("[PRINTER SETTINGS] Retrieved: PrinterName=%s, PaperSize=%s",
		settings.PrinterName, settings.PaperSize)
	log.Println("[PRINTER SETTINGS] ========== GET COMPLETE ==========")

	return settings, nil
}

// SavePrintSettings saves print settings
func (a *App) SavePrintSettings(settings models.PrintSettings) error {
	log.Println("[PRINTER SETTINGS] ========== SAVE ATTEMPT ==========")
	log.Printf("[PRINTER SETTINGS] Received settings: PrinterName=%s, PaperSize=%s, AutoPrint=%v",
		settings.PrinterName, settings.PaperSize, settings.AutoPrint)

	// Log to file
	logToPrinterFile("========== SET DEFAULT PRINTER ==========")
	logToPrinterFile(fmt.Sprintf("Printer Name: %s", settings.PrinterName))

	// Validate settings
	if settings.PrinterName == "" {
		log.Println("[PRINTER SETTINGS] ERROR: Printer name is empty!")
		logToPrinterFile("ERROR: Printer name is empty!")
		return fmt.Errorf("printer name cannot be empty")
	}

	log.Println("[PRINTER SETTINGS] Calling service.SavePrintSettings...")
	err := a.services.PrinterService.SavePrintSettings(&settings)

	if err != nil {
		log.Printf("[PRINTER SETTINGS] ERROR: Save failed: %v", err)
		logToPrinterFile(fmt.Sprintf("ERROR: Save failed - %v", err))
		return err
	}

	log.Println("[PRINTER SETTINGS] SUCCESS: Settings saved to database")
	logToPrinterFile(fmt.Sprintf("SUCCESS: Printer '%s' berhasil di set sebagai default", settings.PrinterName))
	logToPrinterFile(fmt.Sprintf("Paper Size: %s, Auto Print: %v", settings.PaperSize, settings.AutoPrint))

	// Verify save by reading back
	log.Println("[PRINTER SETTINGS] Verifying saved settings...")
	savedSettings, verifyErr := a.services.PrinterService.GetPrintSettings()
	if verifyErr != nil {
		log.Printf("[PRINTER SETTINGS] WARNING: Could not verify settings: %v", verifyErr)
		logToPrinterFile(fmt.Sprintf("WARNING: Could not verify settings - %v", verifyErr))
	} else {
		log.Printf("[PRINTER SETTINGS] Verified: PrinterName=%s", savedSettings.PrinterName)
		if savedSettings.PrinterName != settings.PrinterName {
			log.Printf("[PRINTER SETTINGS] WARNING: Saved name mismatch! Expected=%s, Got=%s",
				settings.PrinterName, savedSettings.PrinterName)
			logToPrinterFile(fmt.Sprintf("WARNING: Mismatch! Expected=%s, Got=%s", settings.PrinterName, savedSettings.PrinterName))
		} else {
			logToPrinterFile("Verification: OK")
		}
	}

	logToPrinterFile("========================================")
	log.Println("[PRINTER SETTINGS] ========== SAVE COMPLETE ==========")
	return nil
}

// TestPrintByName sends a test print to the specified printer by name
func (a *App) TestPrintByName(printerName string) error {
	log.Println("[TEST PRINT] ========== TEST PRINT START ==========")
	log.Printf("[TEST PRINT] Printer: %s", printerName)

	// Log to file
	logToPrinterFile("========== TEST PRINT ==========")
	logToPrinterFile(fmt.Sprintf("Printer: %s", printerName))

	if printerName == "" {
		log.Println("[TEST PRINT] ERROR: Printer name is empty!")
		logToPrinterFile("ERROR: Printer name is empty!")
		return fmt.Errorf("printer name cannot be empty")
	}

	err := a.services.PrinterService.TestPrint(printerName)

	if err != nil {
		log.Printf("[TEST PRINT] ERROR: Test print failed: %v", err)
		logToPrinterFile(fmt.Sprintf("ERROR: Test print failed - %v", err))
		return err
	}

	log.Println("[TEST PRINT] SUCCESS: Test print sent successfully")
	logToPrinterFile(fmt.Sprintf("SUCCESS: Test print ke '%s' berhasil dikirim", printerName))
	logToPrinterFile("========================================")

	log.Println("[TEST PRINT] ========== TEST PRINT COMPLETE ==========")
	return nil
}

// ==================== ANALYTICS API ====================

// GetTopProducts retrieves top selling products within date range
func (a *App) GetTopProducts(startDate, endDate string, limit int) ([]*models.TopProductsResponse, error) {
	log.Printf("Getting top products from %s to %s (limit: %d)", startDate, endDate, limit)
	return a.services.AnalyticsService.GetTopProducts(startDate, endDate, limit)
}

// GetPaymentMethodBreakdown retrieves payment method statistics
func (a *App) GetPaymentMethodBreakdown(startDate, endDate string) ([]*models.PaymentBreakdownResponse, error) {
	log.Printf("Getting payment breakdown from %s to %s", startDate, endDate)
	return a.services.AnalyticsService.GetPaymentMethodBreakdown(startDate, endDate)
}

// GetSalesTrend retrieves sales trend over time
func (a *App) GetSalesTrend(startDate, endDate string) ([]*models.SalesTrendResponse, error) {
	log.Printf("Getting sales trend from %s to %s", startDate, endDate)
	return a.services.AnalyticsService.GetSalesTrend(startDate, endDate)
}

// GetCategoryBreakdown retrieves sales by category
func (a *App) GetCategoryBreakdown(startDate, endDate string) ([]*models.CategoryBreakdownResponse, error) {
	log.Printf("Getting category breakdown from %s to %s", startDate, endDate)
	return a.services.AnalyticsService.GetCategoryBreakdown(startDate, endDate)
}

// GetHourlySales retrieves sales grouped by hour and day
func (a *App) GetHourlySales(startDate, endDate string) ([]*models.HourlySalesResponse, error) {
	log.Printf("Getting hourly sales from %s to %s", startDate, endDate)
	return a.services.AnalyticsService.GetHourlySales(startDate, endDate)
}

// GetSalesInsights retrieves comprehensive sales insights
func (a *App) GetSalesInsights(startDate, endDate string) (*models.SalesInsightsResponse, error) {
	log.Printf("Getting sales insights from %s to %s", startDate, endDate)
	return a.services.AnalyticsService.GetSalesInsights(startDate, endDate)
}

// ==================== PELANGGAN STATS API ====================

func (a *App) GetPelangganWithStats(pelangganIDStr string) (*models.PelangganDetail, error) {
	// Convert string to int64
	pelangganID, err := strconv.ParseInt(pelangganIDStr, 10, 64)
	if err != nil {
		log.Printf("Error converting pelangganID to int64: %v", err)
		return nil, fmt.Errorf("ID pelanggan tidak valid: %s", pelangganIDStr)
	}

	log.Printf("Getting customer with stats for ID: %d", pelangganID)

	// Use pelangganService yang sudah memiliki transaksiRepo
	return a.services.PelangganService.GetPelangganWithStats(pelangganID)
}

// GetTransaksiByPelanggan retrieves all transactions for a customer
func (a *App) GetTransaksiByPelanggan(pelangganID int64) ([]*models.Transaksi, error) {
	log.Printf("Getting transactions for customer ID: %d", pelangganID)
	return a.services.TransaksiService.GetTransaksiByPelangganID(pelangganID)
}

// ==================== USER MANAGEMENT API ====================

// Login authenticates a user
func (a *App) Login(req models.LoginRequest) (*models.LoginResponse, error) {
	log.Printf("Login attempt for username: %s", req.Username)
	response, err := a.services.UserService.Login(&req)
	if err != nil {
		log.Printf("[APP LOGIN ERROR] %v", err)
		return nil, err
	}
	if response != nil && response.User != nil {
		log.Printf("[APP LOGIN] Returning response to frontend - User ID: %d, Username: %s, NamaLengkap: %s",
			response.User.ID, response.User.Username, response.User.NamaLengkap)
	}
	return response, nil
}

// CreateUser creates a new user (admin or staff)
func (a *App) CreateUser(req models.CreateUserRequest) error {
	log.Printf("Creating new user: %s (role: %s)", req.Username, req.Role)
	return a.services.UserService.CreateUser(&req)
}

// UpdateUser updates user information
func (a *App) UpdateUser(req models.UpdateUserRequest) error {
	log.Printf("Updating user ID: %d", req.ID)
	return a.services.UserService.UpdateUser(&req)
}

// DeleteUser soft deletes a user
func (a *App) DeleteUser(idStr string) error {
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid user ID: %s", idStr)
	}
	log.Printf("Deleting user ID: %d", id)
	return a.services.UserService.DeleteUser(id)
}

// GetAllUsers retrieves all users
func (a *App) GetAllUsers() ([]*models.User, error) {
	log.Println("Getting all users")
	return a.services.UserService.GetAllUsers()
}

// GetAllStaff retrieves all staff users
func (a *App) GetAllStaff() ([]*models.User, error) {
	log.Println("Getting all staff")
	return a.services.UserService.GetAllStaff()
}

// GetUserByID retrieves a user by ID
func (a *App) GetUserByID(idStr string) (*models.User, error) {
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %s", idStr)
	}
	log.Printf("Getting user by ID: %d", id)
	return a.services.UserService.GetUserByID(id)
}

// ChangePassword changes user password
func (a *App) ChangePassword(req models.ChangePasswordRequest) error {
	log.Printf("Changing password for user ID: %d", req.UserID)
	return a.services.UserService.ChangePassword(&req)
}

// AdminChangePassword allows admin to change password without old password
func (a *App) AdminChangePassword(req struct {
	UserID      int64  `json:"userId"`
	NewPassword string `json:"newPassword"`
}) error {
	log.Printf("Admin changing password for user ID: %d", req.UserID)
	return a.services.UserService.AdminChangePassword(req.UserID, req.NewPassword)
}

// ==================== STAFF REPORTS API ====================

// GetStaffReport generates performance report for a specific staff
func (a *App) GetStaffReport(staffIDStr string, startDate, endDate string) (*models.StaffReport, error) {
	staffID, err := strconv.ParseInt(staffIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid staff ID: %s", staffIDStr)
	}
	log.Printf("Getting staff report for staff ID: %d from %s to %s", staffID, startDate, endDate)

	// Parse dates
	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.StaffReportService.GetStaffReport(staffID, start, end)
}

// GetStaffReportDetail gets detailed report with transaction list
func (a *App) GetStaffReportDetail(staffIDStr string, startDate, endDate string) (*models.StaffReportDetailWithItems, error) {
	staffID, err := strconv.ParseInt(staffIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid staff ID: %s", staffIDStr)
	}
	log.Printf("Getting detailed staff report for staff ID: %d from %s to %s", staffID, startDate, endDate)

	// Parse dates
	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.StaffReportService.GetStaffReportDetail(staffID, start, end)
}

// GetAllStaffReports gets reports for all staff
func (a *App) GetAllStaffReports(startDate, endDate string) ([]*models.StaffReport, error) {
	log.Printf("Getting all staff reports from %s to %s", startDate, endDate)

	// Parse dates
	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.StaffReportService.GetAllStaffReports(start, end)
}

// GetAllStaffReportsWithTrend gets all staff reports with trend comparison
func (a *App) GetAllStaffReportsWithTrend() ([]*models.StaffReportWithTrend, error) {
	log.Println("Getting all staff reports with trend")
	return a.services.StaffReportService.GetAllStaffReportsWithTrend()
}

// GetStaffReportWithTrend gets staff report with trend for specific date range
func (a *App) GetStaffReportWithTrend(staffIDStr string, startDate, endDate string) (*models.StaffReportWithTrend, error) {
	staffID, err := strconv.ParseInt(staffIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid staff ID: %s", staffIDStr)
	}
	log.Printf("Getting staff report with trend for staff ID: %d from %s to %s", staffID, startDate, endDate)

	// Parse dates
	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.StaffReportService.GetStaffReportWithTrend(staffID, start, end)
}

// ==================== SYNC API ====================

// ForcePushSync triggers a manual sync from Desktop to Web (Push)
func (a *App) ForcePushSync() error {
	log.Println("[APP] 🚀 Manual Push Sync Triggered")
	if sync.Engine != nil {
		return sync.Engine.TriggerInitialSync(true) // Force = true
	}
	return fmt.Errorf("sync engine not initialized")
}

// ForcePullSync triggers a manual sync from Web to Desktop (Pull)
func (a *App) ForcePullSync() error {
	log.Println("[APP] 🚀 Manual Pull Sync Triggered")
	if sync.Engine != nil {
		return sync.Engine.TriggerForcePull()
	}
	return fmt.Errorf("sync engine not initialized")
}

// GetShiftSettings returns current shift configurations
func (a *App) GetShiftSettings() ([]models.ShiftSetting, error) {
	return a.services.StaffReportService.GetShiftSettings()
}

// UpdateShiftSettings updates a shift configuration
func (a *App) UpdateShiftSettings(id int, startTime, endTime, staffIDs string) error {
	return a.services.StaffReportService.UpdateShiftSettings(id, startTime, endTime, staffIDs)
}

// GetStaffHistoricalData gets historical data for charts
func (a *App) GetStaffHistoricalData(staffIDStr string) (*models.StaffHistoricalData, error) {
	staffID, err := strconv.ParseInt(staffIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid staff ID: %s", staffIDStr)
	}
	return a.services.StaffReportService.GetStaffHistoricalData(staffID)
}

// GetComprehensiveStaffReport gets comprehensive analytics for last 30 days
func (a *App) GetComprehensiveStaffReport() (*models.ComprehensiveStaffReport, error) {
	return a.services.StaffReportService.GetComprehensiveReport()
}

// GetShiftProductivity gets sales distribution by shift (morning, afternoon, night)
func (a *App) GetShiftProductivity() (map[string]int, error) {
	return a.services.StaffReportService.GetShiftProductivity()
}

// GetStaffReportWithMonthlyTrend gets staff report with trend vs previous month
func (a *App) GetStaffReportWithMonthlyTrend(staffIDStr string, startDate, endDate string) (*models.StaffReportWithTrend, error) {
	staffID, err := strconv.ParseInt(staffIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid staff ID: %s", staffIDStr)
	}

	// Parse dates
	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.StaffReportService.GetStaffReportWithMonthlyTrend(staffID, start, end)
}

// GetStaffShiftData gets shift productivity data for a specific staff
func (a *App) GetStaffShiftData(staffIDStr string, startDate, endDate string) (map[string]map[string]interface{}, error) {
	staffID, err := strconv.ParseInt(staffIDStr, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid staff ID: %s", staffIDStr)
	}

	// Parse dates
	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.StaffReportService.GetStaffShiftData(staffID, start, end)
}

// GetShiftReports gets overall shift reports for today
func (a *App) GetShiftReports(dateStr string) (*models.ShiftReportsResponse, error) {
	return a.services.StaffReportService.GetShiftReports(dateStr)
}

// GetShiftCashiers gets active cashiers for a shift
func (a *App) GetShiftCashiers(shift string) ([]*models.ShiftCashier, error) {
	return a.services.StaffReportService.GetShiftCashiers(shift)
}

// GetShiftDetail gets detailed report for a specific shift and date
func (a *App) GetShiftDetail(shift string, dateStr string) (*models.ShiftDetailResponse, error) {
	return a.services.StaffReportService.GetShiftDetail(shift, dateStr)
}

// GetMonthlyComparisonTrend gets 30-day comparison with previous 30 days
func (a *App) GetMonthlyComparisonTrend() (map[string]interface{}, error) {
	return a.services.StaffReportService.GetMonthlyComparisonTrend()
}

// ==================== SALES REPORT ENDPOINTS ====================

// GetComprehensiveSalesReport gets comprehensive sales report for a date range
func (a *App) GetComprehensiveSalesReport(startDate, endDate string) (*models.ComprehensiveSalesReport, error) {

	start, err := a.parseDate(startDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date: %w", err)
	}

	end, err := a.parseDate(endDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date: %w", err)
	}

	return a.services.SalesReportService.GetComprehensiveSalesReport(start, end)
}

// ==================== HELPER METHODS ====================

// parseDate parses date string in YYYY-MM-DD format
func (a *App) parseDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

// ==================== DASHBOARD API ====================

// GetDashboardData returns all main dashboard data (statistik, notifikasi, performa, produk terlaris, aktivitas)
func (a *App) GetDashboardData() (*models.DashboardData, error) {
	return a.services.DashboardService.GetDashboardData()
}

// GetDashboardSalesChart returns sales trend data for hari/minggu/bulan periods
func (a *App) GetDashboardSalesChart() (*models.DashboardSalesChartResponse, error) {
	salesData, err := a.services.DashboardService.GetSalesChartData()
	if err != nil {
		return nil, err
	}
	return &models.DashboardSalesChartResponse{
		SalesData: *salesData,
	}, nil
}

// Di file App.go Anda

func (a *App) GetDashboardCompositionChart() (map[string]interface{}, error) {
	data, err := a.services.DashboardService.GetCompositionChartData()
	if err != nil {
		return nil, err
	}

	// Wrap data to match frontend expectations
	return map[string]interface{}{
		"compositionData": data,
	}, nil
}

func (a *App) GetDashboardCategoryChart() (map[string]interface{}, error) {
	data, err := a.services.DashboardService.GetCategoryChartData()
	if err != nil {
		return nil, err
	}

	// Wrap data to match frontend expectations
	return map[string]interface{}{
		"categoryData": data,
	}, nil
}

// GetSalesByPeriodForChart gets sales data for the transaction chart based on a filter
func (a *App) GetSalesByPeriodForChart(filterType string) (map[string]interface{}, error) {

	// Pastikan salesReportService sudah diinisialisasi di struct App
	if a.services.SalesReportService == nil {
		return nil, fmt.Errorf("sales report service is not initialized")
	}

	return a.services.SalesReportService.GetSalesByPeriod(filterType)
}
