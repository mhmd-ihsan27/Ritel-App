-- ============================================
-- Seed Data for Ritel App
-- ============================================
-- This file contains initial data to get started
--
-- Usage:
--   psql -U ritel -d ritel_db -f database/seed_data.sql
-- ============================================

-- ============================================
-- Default Admin User
-- ============================================
-- Username: admin
-- Password: admin123 (bcrypt hashed)
-- IMPORTANT: Change this password after first login!

INSERT INTO users (username, password, nama_lengkap, role, status)
VALUES (
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'Administrator',
    'admin',
    'active'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Print Settings (Default thermal printer config)
-- ============================================

INSERT INTO print_settings (
    id,
    printer_name,
    paper_size,
    font_size,
    line_spacing,
    header_text,
    header_address,
    header_phone,
    footer_text,
    show_logo,
    auto_print,
    copies_count
) VALUES (
    1,
    '',
    '80mm',
    'medium',
    1,
    'TOKO RITEL',
    'Jl. Contoh No. 123, Kota',
    '0812-3456-7890',
    'Terima kasih atas kunjungan Anda!',
    0,
    0,
    1
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Poin Settings (Loyalty points configuration)
-- ============================================

INSERT INTO poin_settings (
    id,
    point_value,
    min_exchange,
    min_transaction_for_points,
    level2_min_points,
    level3_min_points,
    level2_min_spending,
    level3_min_spending
) VALUES (
    1,
    500,        -- 1 point = Rp 500
    100,        -- Minimum 100 points to redeem
    25000,      -- Minimum Rp 25,000 transaction to earn points
    500,        -- Level 2 requires 500 points
    1000,       -- Level 3 requires 1000 points
    5000000,    -- Level 2 requires Rp 5,000,000 total spending
    10000000    -- Level 3 requires Rp 10,000,000 total spending
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Sample Product Categories
-- ============================================

INSERT INTO kategori (nama, deskripsi, icon) VALUES
    ('Sembako', 'Bahan makanan pokok', '🌾'),
    ('Minuman', 'Minuman kemasan dan segar', '🥤'),
    ('Snack', 'Makanan ringan dan cemilan', '🍿'),
    ('Peralatan', 'Peralatan rumah tangga', '🔧'),
    ('Kebersihan', 'Produk kebersihan dan sanitasi', '🧹')
ON CONFLICT (nama) DO NOTHING;

-- ============================================
-- Sample Products (Curah - by weight)
-- ============================================

INSERT INTO produk (
    sku, nama, kategori, harga_beli, harga_jual, stok, satuan, jenis_produk, masa_simpan_hari, deskripsi
) VALUES
    ('BRS-001', 'Beras Premium', 'Sembako', 12000, 15000, 50.0, 'kg', 'curah', 180, 'Beras premium kualitas terbaik'),
    ('GLP-001', 'Gula Pasir', 'Sembako', 11000, 13000, 30.0, 'kg', 'curah', 365, 'Gula pasir putih'),
    ('TPG-001', 'Tepung Terigu', 'Sembako', 8000, 10000, 25.0, 'kg', 'curah', 180, 'Tepung terigu serbaguna'),
    ('MNK-001', 'Minyak Goreng', 'Sembako', 14000, 16000, 40.0, 'kg', 'curah', 365, 'Minyak goreng curah')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- Sample Products (Satuan - by unit)
-- ============================================

INSERT INTO produk (
    sku, nama, kategori, harga_beli, harga_jual, stok, satuan, jenis_produk, masa_simpan_hari, deskripsi
) VALUES
    ('AIR-001', 'Air Mineral 600ml', 'Minuman', 2500, 3000, 100, 'botol', 'satuan', 180, 'Air mineral kemasan 600ml'),
    ('TEH-001', 'Teh Botol Sosro', 'Minuman', 3500, 5000, 50, 'botol', 'satuan', 90, 'Teh botol kemasan 500ml'),
    ('IND-001', 'Indomie Goreng', 'Snack', 2500, 3500, 200, 'bungkus', 'satuan', 365, 'Mie instan goreng'),
    ('CHT-001', 'Chitato Rasa Sapi Panggang', 'Snack', 8000, 10000, 30, 'bungkus', 'satuan', 180, 'Keripik kentang 68g'),
    ('SBN-001', 'Sabun Mandi Lifebuoy', 'Kebersihan', 3000, 4500, 50, 'batang', 'satuan', 730, 'Sabun mandi batangan 110g')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- Sample Customer (for testing)
-- ============================================

INSERT INTO pelanggan (
    nama, telepon, email, tipe, level, poin, diskon_persen, total_transaksi, total_belanja
) VALUES
    ('Pelanggan Umum', '0000000000', 'umum@example.com', 'reguler', 1, 0, 0, 0, 0),
    ('Customer VIP', '08123456789', 'vip@example.com', 'member', 2, 500, 5, 10, 5000000)
ON CONFLICT (telepon) DO NOTHING;

-- ============================================
-- Sample Promo (for testing)
-- ============================================

-- Promo diskon persen untuk semua produk
INSERT INTO promo (
    nama,
    kode,
    tipe,
    tipe_promo,
    tipe_produk_berlaku,
    nilai,
    min_quantity,
    max_diskon,
    tanggal_mulai,
    tanggal_selesai,
    status,
    deskripsi
) VALUES (
    'Diskon Akhir Tahun',
    'TAHUNBARU2025',
    'persen',
    'diskon_transaksi',
    'semua',
    10,
    0,
    50000,
    NOW(),
    NOW() + INTERVAL '30 days',
    'aktif',
    'Diskon 10% untuk semua produk, maksimal Rp 50.000'
)
ON CONFLICT (kode) DO NOTHING;

-- Promo khusus produk curah
INSERT INTO promo (
    nama,
    kode,
    tipe,
    tipe_promo,
    tipe_produk_berlaku,
    nilai,
    min_quantity,
    tanggal_mulai,
    tanggal_selesai,
    status,
    deskripsi
) VALUES (
    'Promo Sembako',
    'SEMBAKO50',
    'nominal',
    'diskon_produk',
    'curah',
    5000,
    5,
    NOW(),
    NOW() + INTERVAL '30 days',
    'aktif',
    'Diskon Rp 5.000 untuk pembelian sembako min 5kg'
)
ON CONFLICT (kode) DO NOTHING;

-- ============================================
-- Completion Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Default Admin Login:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Change the admin password!';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- Verification Queries (optional - run to verify)
-- ============================================

-- Uncomment to see inserted data:

-- SELECT COUNT(*) as total_products FROM produk;
-- SELECT COUNT(*) as total_categories FROM kategori;
-- SELECT COUNT(*) as total_customers FROM pelanggan;
-- SELECT COUNT(*) as total_promos FROM promo;
-- SELECT COUNT(*) as total_users FROM users;
