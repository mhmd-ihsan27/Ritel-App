package database

import (
	"log"
	"time"
)

// SeedData populates the database with sample data for testing
func SeedData() error {
	log.Println("Starting database seeding...")

	// Check if data already exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM produk").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("Database already has data, skipping seed")
		return nil
	}

	log.Println("Creating sample data...")

	// 1. Create Categories
	categories := []struct {
		nama      string
		deskripsi string
		icon      string
	}{
		{"Sayuran", "Sayuran segar", "🥬"},
		{"Buah-buahan", "Buah segar", "🍎"},
		{"Bumbu Dapur", "Bumbu dan rempah", "🧂"},
		{"Makanan Pokok", "Beras, mie, dll", "🍚"},
		{"Minuman", "Minuman kemasan", "🥤"},
	}

	for _, cat := range categories {
		_, err := DB.Exec(`
			INSERT INTO kategori (nama, deskripsi, icon, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
		`, cat.nama, cat.deskripsi, cat.icon, time.Now(), time.Now())
		if err != nil {
			log.Printf("Error creating category %s: %v", cat.nama, err)
			return err
		}
	}
	log.Println("✓ Categories created")

	// 2. Create Products
	products := []struct {
		sku          string
		barcode      string
		nama         string
		kategori     string
		berat        float64
		hargaBeli    int
		hargaJual    int
		stok         float64
		satuan       string
		jenisProduk  string
		masaSimpan   int
		tanggalMasuk string
		deskripsi    string
		hariNotif    int
	}{
		// Sayuran (Curah)
		{"SYR-001", "8991234567890", "Bayam", "Sayuran", 0.5, 3000, 5000, 15.5, "kg", "curah", 3, time.Now().Format("2006-01-02"), "Bayam segar hijau", 1},
		{"SYR-002", "8991234567891", "Kangkung", "Sayuran", 0.3, 2500, 4000, 20.0, "kg", "curah", 3, time.Now().Format("2006-01-02"), "Kangkung segar", 1},
		{"SYR-003", "8991234567892", "Wortel", "Sayuran", 0.2, 4000, 6500, 25.75, "kg", "curah", 7, time.Now().Format("2006-01-02"), "Wortel import", 2},
		{"SYR-004", "8991234567893", "Kentang", "Sayuran", 0.15, 5000, 8000, 30.0, "kg", "curah", 14, time.Now().Format("2006-01-02"), "Kentang granola", 3},
		{"SYR-005", "8991234567894", "Tomat", "Sayuran", 0.2, 3500, 6000, 18.25, "kg", "curah", 5, time.Now().Format("2006-01-02"), "Tomat merah segar", 2},

		// Buah (Curah)
		{"BUH-001", "8991234567895", "Apel Fuji", "Buah-buahan", 0.25, 15000, 22000, 12.5, "kg", "curah", 10, time.Now().Format("2006-01-02"), "Apel Fuji import", 3},
		{"BUH-002", "8991234567896", "Jeruk Pontianak", "Buah-buahan", 0.2, 8000, 12000, 20.0, "kg", "curah", 7, time.Now().Format("2006-01-02"), "Jeruk manis", 2},
		{"BUH-003", "8991234567897", "Pisang Cavendish", "Buah-buahan", 0.5, 10000, 15000, 25.0, "kg", "curah", 5, time.Now().Format("2006-01-02"), "Pisang premium", 2},

		// Bumbu (Curah)
		{"BMB-001", "8991234567898", "Bawang Merah", "Bumbu Dapur", 0.1, 25000, 35000, 10.5, "kg", "curah", 30, time.Now().Format("2006-01-02"), "Bawang merah lokal", 5},
		{"BMB-002", "8991234567899", "Bawang Putih", "Bumbu Dapur", 0.1, 30000, 40000, 8.75, "kg", "curah", 30, time.Now().Format("2006-01-02"), "Bawang putih kating", 5},
		{"BMB-003", "8991234567900", "Cabai Merah", "Bumbu Dapur", 0.1, 35000, 50000, 5.25, "kg", "curah", 7, time.Now().Format("2006-01-02"), "Cabai merah keriting", 2},

		// Makanan Pokok (Satuan)
		{"PKK-001", "8991234567901", "Beras Premium 5kg", "Makanan Pokok", 5.0, 55000, 70000, 50, "sak", "satuan", 365, time.Now().Format("2006-01-02"), "Beras premium kualitas terbaik", 30},
		{"PKK-002", "8991234567902", "Mie Instan Goreng", "Makanan Pokok", 0.085, 2500, 3500, 120, "pcs", "satuan", 180, time.Now().Format("2006-01-02"), "Mie goreng rasa ayam", 30},
		{"PKK-003", "8991234567903", "Mie Instan Kuah", "Makanan Pokok", 0.075, 2300, 3300, 100, "pcs", "satuan", 180, time.Now().Format("2006-01-02"), "Mie kuah rasa soto", 30},
		{"PKK-004", "8991234567904", "Gula Pasir 1kg", "Makanan Pokok", 1.0, 12000, 15000, 80, "pcs", "satuan", 365, time.Now().Format("2006-01-02"), "Gula pasir putih", 60},
		{"PKK-005", "8991234567905", "Minyak Goreng 2L", "Makanan Pokok", 2.0, 28000, 35000, 60, "pcs", "satuan", 365, time.Now().Format("2006-01-02"), "Minyak goreng kemasan", 60},

		// Minuman (Satuan)
		{"MNM-001", "8991234567906", "Air Mineral 600ml", "Minuman", 0.6, 2500, 3500, 200, "pcs", "satuan", 365, time.Now().Format("2006-01-02"), "Air mineral kemasan", 60},
		{"MNM-002", "8991234567907", "Teh Botol 500ml", "Minuman", 0.5, 3500, 5000, 150, "pcs", "satuan", 180, time.Now().Format("2006-01-02"), "Teh manis kemasan", 30},
		{"MNM-003", "8991234567908", "Susu UHT Kotak 1L", "Minuman", 1.0, 15000, 20000, 80, "pcs", "satuan", 180, time.Now().Format("2006-01-02"), "Susu UHT full cream", 30},
		{"MNM-004", "8991234567909", "Kopi Sachet", "Minuman", 0.02, 1000, 1500, 300, "pcs", "satuan", 365, time.Now().Format("2006-01-02"), "Kopi instan sachet", 60},
	}

	for _, p := range products {
		result, err := DB.Exec(`
			INSERT INTO produk (
				sku, barcode, nama, kategori, berat, harga_beli, harga_jual,
				stok, satuan, jenis_produk, masa_simpan_hari, tanggal_masuk,
				deskripsi, hari_pemberitahuan_kadaluarsa, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, p.sku, p.barcode, p.nama, p.kategori, p.berat, p.hargaBeli, p.hargaJual,
			p.stok, p.satuan, p.jenisProduk, p.masaSimpan, p.tanggalMasuk,
			p.deskripsi, p.hariNotif, time.Now(), time.Now())

		if err != nil {
			log.Printf("Error creating product %s: %v", p.nama, err)
			return err
		}

		// Create initial batch for products with stock
		if p.stok > 0 && p.masaSimpan > 0 {
			produkID, _ := result.LastInsertId()
			tanggalRestok := time.Now()
			tanggalKadaluarsa := tanggalRestok.AddDate(0, 0, p.masaSimpan)

			// Calculate status
			daysUntilExpiry := int(time.Until(tanggalKadaluarsa).Hours() / 24)
			status := "fresh"
			if daysUntilExpiry <= 0 {
				status = "expired"
			} else if daysUntilExpiry <= p.hariNotif {
				status = "hampir_expired"
			}

			batchID := time.Now().Format("20060102150405") + "-" + p.sku
			_, err = DB.Exec(`
				INSERT INTO batch (
					id, produk_id, qty, qty_tersisa, tanggal_restok, masa_simpan_hari,
					tanggal_kadaluarsa, status, supplier, keterangan, created_at, updated_at
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`, batchID, produkID, p.stok, p.stok, tanggalRestok, p.masaSimpan,
				tanggalKadaluarsa, status, "Supplier Default", "Initial stock", time.Now(), time.Now())

			if err != nil {
				log.Printf("Error creating batch for %s: %v", p.nama, err)
			}
		}
	}
	log.Println("✓ Products created with batches")

	// 3. Create sample customers
	customers := []struct {
		nama    string
		telepon string
		alamat  string
		email   string
		tipe    string
	}{
		{"Budi Santoso", "081234567890", "Jl. Merdeka No. 123", "budi@email.com", "umum"},
		{"Siti Nurhaliza", "081234567891", "Jl. Sudirman No. 45", "siti@email.com", "member"},
		{"Ahmad Fauzi", "081234567892", "Jl. Gatot Subroto No. 67", "ahmad@email.com", "umum"},
		{"Dewi Lestari", "081234567893", "Jl. Diponegoro No. 89", "dewi@email.com", "member"},
	}

	for _, c := range customers {
		poin := 0
		if c.tipe == "member" {
			poin = 100 // Give initial points to members
		}

		_, err := DB.Exec(`
			INSERT INTO pelanggan (nama, telepon, alamat, email, tipe, poin, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, c.nama, c.telepon, c.alamat, c.email, c.tipe, poin, time.Now(), time.Now())

		if err != nil {
			log.Printf("Error creating customer %s: %v", c.nama, err)
			return err
		}
	}
	log.Println("✓ Customers created")

	// 4. Create sample promo
	now := time.Now()
	startDate := now.Format("2006-01-02")
	endDate := now.AddDate(0, 1, 0).Format("2006-01-02") // 1 month from now

	_, err = DB.Exec(`
		INSERT INTO promo (
			kode, nama, deskripsi, tipe, nilai, minimal_transaksi,
			tanggal_mulai, tanggal_selesai, status, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, "DISKON10", "Diskon 10%", "Diskon 10% untuk transaksi minimal Rp 50.000",
		"persen", 10, 50000, startDate, endDate, "aktif", time.Now(), time.Now())

	if err != nil {
		log.Printf("Error creating promo: %v", err)
		return err
	}
	log.Println("✓ Promo created")

	log.Println("=====================================")
	log.Println("✓ Database seeding completed!")
	log.Println("=====================================")
	log.Println("Sample data created:")
	log.Println("- 5 Categories")
	log.Println("- 20 Products (with initial stock and batches)")
	log.Println("- 4 Customers")
	log.Println("- 1 Active Promo")
	log.Println("=====================================")

	return nil
}
