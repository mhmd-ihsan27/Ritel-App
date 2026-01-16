package main

import (
	"fmt"
	"log"
	"ritel-app/internal/database"
	"ritel-app/internal/service"
)

func main() {
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to init database:", err)
	}

	fmt.Println("========================================")
	fmt.Println("  DASHBOARD SERVICE TEST")
	fmt.Println("========================================")

	// Call the actual dashboard service
	dashboardService := service.NewDashboardService()

	stats, err := dashboardService.GetStatistikBulanan()
	if err != nil {
		log.Fatalf("Error: %v\n", err)
	}

	fmt.Println("\n✅ HASIL DARI DASHBOARD SERVICE:")
	fmt.Println("------------------------------------------------------------")
	fmt.Printf("   Total Pendapatan    : Rp %.0f\n", stats.TotalPendapatan)
	fmt.Printf("   Total Transaksi     : %d\n", stats.TotalTransaksi)
	fmt.Printf("   Produk Terjual      : %d\n", stats.ProdukTerjual)
	fmt.Printf("   KEUNTUNGAN BERSIH   : Rp %.0f\n", stats.KeuntunganBersih)
	fmt.Printf("   vs Bulan Lalu       : %.2f%%\n", stats.VsBulanLalu)
	fmt.Println("------------------------------------------------------------")

	if stats.KeuntunganBersih == 0 {
		fmt.Println("\n❌ MASALAH: Keuntungan Bersih = Rp 0")
		fmt.Println("   Target seharusnya: Rp 11,500")
	} else if stats.KeuntunganBersih == 11500 {
		fmt.Println("\n✅ BENAR! Keuntungan Bersih = Rp 11,500")
	} else {
		fmt.Printf("\n⚠️  Keuntungan Bersih = Rp %.0f (bukan Rp 11,500)\n", stats.KeuntunganBersih)
		fmt.Printf("   Selisih: Rp %.0f\n", stats.KeuntunganBersih-11500)
	}

	fmt.Println("\n========================================")
}
