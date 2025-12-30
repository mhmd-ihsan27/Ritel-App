package http

import (
	"ritel-app/internal/auth"
	"ritel-app/internal/config"
	"ritel-app/internal/container"
	"ritel-app/internal/http/handlers"
	"ritel-app/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRouter configures all routes for the HTTP server
func SetupRouter(services *container.ServiceContainer, jwtManager *auth.JWTManager, cfg config.ServerConfig) *gin.Engine {
	// Set Gin to release mode
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()

	// Global middleware
	router.Use(middleware.Recovery())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS(cfg.CORSOrigins, cfg.CORSCredentials))

	// Initialize rate limiters if enabled
	if cfg.RateLimitEnabled {
		middleware.InitRateLimiters(
			cfg.RateLimitGlobal, cfg.RateLimitLogin, cfg.RateLimitAPI,
			cfg.RateLimitWindowGlobal, cfg.RateLimitWindowLogin, cfg.RateLimitWindowAPI,
		)
		// Apply smart rate limiting globally
		router.Use(middleware.SmartRateLimit())
	}

	// Initialize all handlers
	authHandler := handlers.NewAuthHandler(services, jwtManager)
	produkHandler := handlers.NewProdukHandler(services)
	transaksiHandler := handlers.NewTransaksiHandler(services)
	pelangganHandler := handlers.NewPelangganHandler(services)
	kategoriHandler := handlers.NewKategoriHandler(services)
	promoHandler := handlers.NewPromoHandler(services)
	batchHandler := handlers.NewBatchHandler(services)
	returnHandler := handlers.NewReturnHandler(services)
	userHandler := handlers.NewUserHandler(services)
	analyticsHandler := handlers.NewAnalyticsHandler(services)
	dashboardHandler := handlers.NewDashboardHandler(services)
	staffReportHandler := handlers.NewStaffReportHandler(services)
	salesReportHandler := handlers.NewSalesReportHandler(services)
	printerHandler := handlers.NewPrinterHandler(services)
	hardwareHandler := handlers.NewHardwareHandler(services)
	settingsHandler := handlers.NewSettingsHandler(services)
	syncHandler := handlers.NewSyncHandler()

	// Health check endpoint (no auth required)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "ritel-app-api",
			"version": "1.0.0",
		})
	})

	// API v1 routes
	api := router.Group("/api")
	{
		// ==================== AUTH ROUTES (No authentication required) ====================
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// ==================== PROTECTED ROUTES (JWT required) ====================
		protected := api.Group("")
		protected.Use(middleware.JWTAuth(jwtManager))
		{
			// Auth (authenticated users only)
			authProtected := protected.Group("/auth")
			{
				authProtected.GET("/me", authHandler.Me)
				authProtected.POST("/refresh", authHandler.RefreshToken)
				authProtected.POST("/change-password", authHandler.ChangePassword)
			}

			// ==================== PRODUCTS ====================
			produk := protected.Group("/produk")
			{
				produk.GET("", produkHandler.GetAll)
				produk.POST("", produkHandler.Create)
				produk.PUT("", produkHandler.Update)
				produk.DELETE("/:id", produkHandler.Delete)
				produk.POST("/scan", produkHandler.ScanBarcode)
				produk.PUT("/stok", produkHandler.UpdateStok)
				produk.PUT("/stok/increment", produkHandler.UpdateStokIncrement)
				produk.GET("/:id/stok-history", produkHandler.GetStokHistory)

				// Cart operations
				produk.GET("/keranjang", produkHandler.GetKeranjang)
				produk.DELETE("/keranjang", produkHandler.ClearKeranjang)
				produk.POST("/keranjang/process", produkHandler.ProcessKeranjang)
				produk.DELETE("/keranjang/:id", produkHandler.RemoveFromKeranjang)
				produk.PUT("/keranjang/jumlah", produkHandler.UpdateKeranjangJumlah)
			}

			// ==================== CATEGORIES ====================
			kategori := protected.Group("/kategori")
			{
				kategori.GET("", kategoriHandler.GetAll)
				kategori.GET("/:id", kategoriHandler.GetByID)
				kategori.POST("", kategoriHandler.Create)
				kategori.PUT("", kategoriHandler.Update)
				kategori.DELETE("/:id", kategoriHandler.Delete)
			}

			// ==================== TRANSACTIONS ====================
			transaksi := protected.Group("/transaksi")
			{
				transaksi.GET("", transaksiHandler.GetAll)
				transaksi.POST("", transaksiHandler.Create)
				transaksi.GET("/:id", transaksiHandler.GetByID)
				transaksi.GET("/nomor/:nomor", transaksiHandler.GetByNoTransaksi)
				transaksi.GET("/date-range", transaksiHandler.GetByDateRange)
				transaksi.GET("/today-stats", transaksiHandler.GetTodayStats)
				transaksi.GET("/pelanggan/:id", transaksiHandler.GetByPelanggan)
			}

			// ==================== CUSTOMERS ====================
			pelanggan := protected.Group("/pelanggan")
			{
				pelanggan.GET("", pelangganHandler.GetAll)
				pelanggan.GET("/:id", pelangganHandler.GetByID)
				pelanggan.GET("/telepon/:telepon", pelangganHandler.GetByTelepon)
				pelanggan.GET("/tipe/:tipe", pelangganHandler.GetByTipe)
				pelanggan.POST("", pelangganHandler.Create)
				pelanggan.PUT("", pelangganHandler.Update)
				pelanggan.DELETE("/:id", pelangganHandler.Delete)
				pelanggan.POST("/poin", pelangganHandler.AddPoin)
				pelanggan.GET("/:id/stats", pelangganHandler.GetWithStats)
			}

			// ==================== PROMOTIONS ====================
			promo := protected.Group("/promo")
			{
				promo.GET("", promoHandler.GetAll)
				promo.GET("/active", promoHandler.GetActive)
				promo.GET("/:id", promoHandler.GetByID)
				promo.GET("/kode/:kode", promoHandler.GetByKode)
				promo.POST("", promoHandler.Create)
				promo.PUT("", promoHandler.Update)
				promo.DELETE("/:id", promoHandler.Delete)
				promo.POST("/apply", promoHandler.Apply)
				promo.GET("/produk/:id", promoHandler.GetForProduct)
				promo.GET("/:id/products", promoHandler.GetProducts)
			}

			// ==================== BATCHES ====================
			batch := protected.Group("/batch")
			{
				batch.GET("", batchHandler.GetAll)
				batch.GET("/:id", batchHandler.GetByID)
				batch.GET("/produk/:id", batchHandler.GetByProduk)
				batch.GET("/expiring/:days", batchHandler.GetExpiring)
				batch.DELETE("/:id/expired", batchHandler.DeleteExpired)
				batch.GET("/summary/:id", batchHandler.GetSummary)
				batch.PUT("/update-status", batchHandler.UpdateStatuses)
			}

			// ==================== RETURNS ====================
			returns := protected.Group("/return")
			{
				returns.GET("", returnHandler.GetAll)
				returns.GET("/:id", returnHandler.GetByID)
				returns.POST("", returnHandler.Create)
			}

			// ==================== ANALYTICS ====================
			analytics := protected.Group("/analytics")
			{
				analytics.GET("/top-products", analyticsHandler.GetTopProducts)
				analytics.GET("/payment-breakdown", analyticsHandler.GetPaymentMethodBreakdown)
				analytics.GET("/sales-trend", analyticsHandler.GetSalesTrend)
				analytics.GET("/category-breakdown", analyticsHandler.GetCategoryBreakdown)
				analytics.GET("/hourly-sales", analyticsHandler.GetHourlySales)
				analytics.GET("/sales-insights", analyticsHandler.GetSalesInsights)
			}

			// ==================== DASHBOARD ====================
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("", dashboardHandler.GetDashboardData)
				dashboard.GET("/sales-chart", dashboardHandler.GetSalesChart)
				dashboard.GET("/composition-chart", dashboardHandler.GetCompositionChart)
				dashboard.GET("/category-chart", dashboardHandler.GetCategoryChart)
				dashboard.GET("/sales-period", dashboardHandler.GetSalesByPeriod)
			}

			// ==================== STAFF REPORTS ====================
			staffReport := protected.Group("/staff-report")
			{
				// Static routes first (before dynamic :id routes)
				staffReport.GET("/all", staffReportHandler.GetAllStaffReports)
				staffReport.GET("/trend/all", staffReportHandler.GetAllWithTrend)
				staffReport.GET("/comprehensive", staffReportHandler.GetComprehensive)
				staffReport.GET("/shift-productivity", staffReportHandler.GetShiftProductivity)
				staffReport.GET("/monthly-trend", staffReportHandler.GetMonthlyTrend)

				// Dynamic :id routes
				staffReport.GET("/:id", staffReportHandler.GetStaffReport)
				staffReport.GET("/:id/detail", staffReportHandler.GetStaffReportDetail)
				staffReport.GET("/:id/trend", staffReportHandler.GetWithTrend)
				staffReport.GET("/:id/historical", staffReportHandler.GetHistoricalData)
				staffReport.GET("/:id/shift-data", staffReportHandler.GetStaffShiftData)
				staffReport.GET("/:id/monthly-trend", staffReportHandler.GetWithMonthlyTrend)
			}

			// ==================== SALES REPORTS ====================
			salesReport := protected.Group("/sales-report")
			{
				salesReport.GET("/comprehensive", salesReportHandler.GetComprehensive)
			}

			// ==================== PRINTERS ====================
			printer := protected.Group("/printer")
			{
				printer.GET("/list", printerHandler.GetInstalled)
				printer.POST("/test", printerHandler.TestPrint)
				printer.POST("/receipt", printerHandler.PrintReceipt)
				printer.GET("/settings", printerHandler.GetSettings)
				printer.POST("/settings", printerHandler.SaveSettings)
			}

			// ==================== HARDWARE ====================
			hardware := protected.Group("/hardware")
			{
				hardware.GET("/detect", hardwareHandler.DetectHardware)
				hardware.POST("/test-scanner", hardwareHandler.TestScanner)
				hardware.POST("/test-printer", hardwareHandler.TestPrinter)
				hardware.POST("/test-cash-drawer", hardwareHandler.TestCashDrawer)
			}

			// ==================== SETTINGS ====================
			settings := protected.Group("/settings")
			{
				settings.GET("/poin", settingsHandler.GetPoinSettings)
				settings.PUT("/poin", settingsHandler.UpdatePoinSettings)
			}

			// ==================== SYNC (Offline-First Mode) ====================
			// These endpoints are available when SYNC_MODE=enabled in .env
			sync := protected.Group("/sync")
			{
				sync.GET("/status", syncHandler.GetSyncStatus)
				sync.POST("/force", syncHandler.ForceSyncNow)
				sync.GET("/pending", syncHandler.GetPendingSyncs)
				sync.POST("/clear", syncHandler.ClearSyncedQueue)
			}

			// ==================== ADMIN-ONLY ROUTES ====================
			admin := protected.Group("")
			admin.Use(middleware.RequireAdmin())
			{
				// User management
				users := admin.Group("/users")
				{
					users.GET("", userHandler.GetAll)
					users.GET("/staff", userHandler.GetAllStaff)
					users.GET("/:id", userHandler.GetByID)
					users.POST("", userHandler.Create)
					users.PUT("", userHandler.Update)
					users.DELETE("/:id", userHandler.Delete)
				}
			}
		}
	}

	return router
}
