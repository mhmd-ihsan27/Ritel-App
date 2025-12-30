package container

import (
	"log"
	"ritel-app/internal/database"
	"ritel-app/internal/service"
)

// ServiceContainer holds all business logic services
// This ensures both Wails and HTTP handlers use the SAME service instances
type ServiceContainer struct {
	ProdukService      *service.ProdukService
	KategoriService    *service.KategoriService
	TransaksiService   *service.TransaksiService
	PelangganService   *service.PelangganService
	PromoService       *service.PromoService
	ReturnService      *service.ReturnService
	PrinterService     *service.PrinterService
	SettingsService    *service.SettingsService
	HardwareService    *service.HardwareService
	AnalyticsService   *service.AnalyticsService
	BatchService       *service.BatchService
	UserService        *service.UserService
	StaffReportService *service.StaffReportService
	SalesReportService *service.SalesReportService
	DashboardService   *service.DashboardService
}

// NewServiceContainer initializes all services
func NewServiceContainer() *ServiceContainer {
	log.Println("[CONTAINER] Initializing service container...")

	container := &ServiceContainer{
		ProdukService:      service.NewProdukService(),
		KategoriService:    service.NewKategoriService(),
		TransaksiService:   service.NewTransaksiService(),
		PelangganService:   service.NewPelangganService(),
		PromoService:       service.NewPromoService(),
		ReturnService:      service.NewReturnService(),
		PrinterService:     service.NewPrinterService(),
		SettingsService:    service.NewSettingsService(),
		HardwareService:    service.NewHardwareService(),
		AnalyticsService:   service.NewAnalyticsService(),
		BatchService:       service.NewBatchService(),
		UserService:        service.NewUserService(),
		StaffReportService: service.NewStaffReportService(),
		SalesReportService: service.NewSalesReportService(),
		DashboardService:   service.NewDashboardService(),
	}

	// Ensure default admin exists
	container.UserService.EnsureDefaultAdmin()

	log.Println("[CONTAINER] All services initialized successfully")
	return container
}

// Shutdown performs cleanup for all services
func (c *ServiceContainer) Shutdown() {
	log.Println("[CONTAINER] Shutting down services...")
	database.Close()
	log.Println("[CONTAINER] Services shutdown complete")
}
