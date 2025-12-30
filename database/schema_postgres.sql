-- ============================================
-- PostgreSQL Database Schema for Ritel App
-- ============================================
-- This file contains the complete database schema for PostgreSQL
-- Run this after creating the database and user
--
-- Usage:
--   psql -U ritel -d ritel_db -f database/schema_postgres.sql
-- ============================================

-- Enable UUID extension (if needed in future)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Kategori table (Product categories)
CREATE TABLE IF NOT EXISTS kategori (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) UNIQUE NOT NULL,
    deskripsi TEXT,
    icon TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Produk table (Products)
CREATE TABLE IF NOT EXISTS produk (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    barcode VARCHAR(255) UNIQUE,
    nama VARCHAR(255) NOT NULL,
    kategori VARCHAR(255),
    berat REAL DEFAULT 0,
    harga_beli INTEGER DEFAULT 0,
    harga_jual INTEGER NOT NULL,
    stok REAL DEFAULT 0,
    satuan VARCHAR(50) DEFAULT 'kg',
    jenis_produk VARCHAR(50) DEFAULT 'curah',
    kadaluarsa TEXT,
    tanggal_masuk TEXT,
    deskripsi TEXT,
    gambar TEXT,
    masa_simpan_hari INTEGER DEFAULT 0,
    hari_pemberitahuan_kadaluarsa INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Keranjang table (Shopping cart for scanned items)
CREATE TABLE IF NOT EXISTS keranjang (
    id SERIAL PRIMARY KEY,
    produk_id INTEGER NOT NULL,
    jumlah INTEGER DEFAULT 1,
    harga_beli INTEGER DEFAULT 0,
    subtotal INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_keranjang_produk FOREIGN KEY (produk_id)
        REFERENCES produk(id) ON DELETE RESTRICT
);

-- Pelanggan table (Customer management)
CREATE TABLE IF NOT EXISTS pelanggan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    telepon VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    tipe VARCHAR(50) DEFAULT 'reguler',
    level INTEGER DEFAULT 1,
    poin INTEGER DEFAULT 0,
    diskon_persen INTEGER DEFAULT 0,
    total_transaksi INTEGER DEFAULT 0,
    total_belanja INTEGER DEFAULT 0,
    alamat TEXT,
    last_transaction_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Users table (Staff and admin authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Transaksi table (Transaction header)
CREATE TABLE IF NOT EXISTS transaksi (
    id SERIAL PRIMARY KEY,
    nomor_transaksi VARCHAR(100) UNIQUE NOT NULL,
    tanggal TIMESTAMP DEFAULT NOW(),
    pelanggan_nama VARCHAR(255),
    pelanggan_telp VARCHAR(50),
    pelanggan_id INTEGER DEFAULT 0,
    staff_id INTEGER,
    staff_nama VARCHAR(255),
    subtotal INTEGER NOT NULL DEFAULT 0,
    diskon INTEGER DEFAULT 0,
    diskon_promo INTEGER DEFAULT 0,
    diskon_pelanggan INTEGER DEFAULT 0,
    poin_ditukar INTEGER DEFAULT 0,
    diskon_poin INTEGER DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    total_bayar INTEGER NOT NULL DEFAULT 0,
    kembalian INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'selesai',
    catatan TEXT,
    kasir VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transaksi Item table (Transaction line items)
CREATE TABLE IF NOT EXISTS transaksi_item (
    id SERIAL PRIMARY KEY,
    transaksi_id INTEGER NOT NULL,
    produk_id INTEGER,
    produk_sku VARCHAR(255) NOT NULL,
    produk_nama VARCHAR(255) NOT NULL,
    produk_kategori VARCHAR(255),
    harga_satuan INTEGER NOT NULL,
    jumlah INTEGER NOT NULL,
    beratgram REAL DEFAULT 0,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_transaksi_item_transaksi FOREIGN KEY (transaksi_id)
        REFERENCES transaksi(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transaksi_item_produk FOREIGN KEY (produk_id)
        REFERENCES produk(id) ON DELETE SET NULL
);

-- Pembayaran table (Payment methods)
CREATE TABLE IF NOT EXISTS pembayaran (
    id SERIAL PRIMARY KEY,
    transaksi_id INTEGER NOT NULL,
    metode VARCHAR(50) NOT NULL,
    jumlah INTEGER NOT NULL,
    referensi TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_pembayaran_transaksi FOREIGN KEY (transaksi_id)
        REFERENCES transaksi(id) ON DELETE RESTRICT
);

-- Promo table (Discount and promotion management)
CREATE TABLE IF NOT EXISTS promo (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    kode VARCHAR(100) UNIQUE,
    tipe VARCHAR(50) NOT NULL,
    tipe_promo VARCHAR(50) DEFAULT 'diskon_produk',
    tipe_produk_berlaku VARCHAR(50) DEFAULT 'semua',
    nilai INTEGER NOT NULL,
    min_quantity INTEGER DEFAULT 0,
    max_diskon INTEGER DEFAULT 0,
    buy_quantity INTEGER DEFAULT 0,
    get_quantity INTEGER DEFAULT 0,
    tipe_buy_get VARCHAR(50) DEFAULT 'sama',
    harga_bundling INTEGER DEFAULT 0,
    tipe_bundling VARCHAR(50) DEFAULT 'harga_tetap',
    diskon_bundling INTEGER DEFAULT 0,
    produk_x INTEGER,
    produk_y INTEGER,
    tanggal_mulai TIMESTAMP,
    tanggal_selesai TIMESTAMP,
    status VARCHAR(50) DEFAULT 'aktif',
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL,
    CONSTRAINT fk_promo_produk_x FOREIGN KEY (produk_x)
        REFERENCES produk(id) ON DELETE SET NULL,
    CONSTRAINT fk_promo_produk_y FOREIGN KEY (produk_y)
        REFERENCES produk(id) ON DELETE SET NULL
);

-- Promo Produk table (Product-specific promotions)
CREATE TABLE IF NOT EXISTS promo_produk (
    id SERIAL PRIMARY KEY,
    promo_id INTEGER NOT NULL,
    produk_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_promo_produk_promo FOREIGN KEY (promo_id)
        REFERENCES promo(id) ON DELETE CASCADE,
    CONSTRAINT fk_promo_produk_produk FOREIGN KEY (produk_id)
        REFERENCES produk(id) ON DELETE CASCADE
);

-- Returns table (Product return/exchange transactions)
CREATE TABLE IF NOT EXISTS returns (
    id SERIAL PRIMARY KEY,
    transaksi_id INTEGER NOT NULL,
    no_transaksi VARCHAR(100) NOT NULL,
    return_date TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    replacement_product_id INTEGER,
    refund_amount INTEGER DEFAULT 0,
    refund_method VARCHAR(50),
    refund_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_returns_transaksi FOREIGN KEY (transaksi_id)
        REFERENCES transaksi(id) ON DELETE RESTRICT,
    CONSTRAINT fk_returns_replacement FOREIGN KEY (replacement_product_id)
        REFERENCES produk(id) ON DELETE SET NULL
);

-- Return Items table (Products in a return transaction)
CREATE TABLE IF NOT EXISTS return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_return_items_return FOREIGN KEY (return_id)
        REFERENCES returns(id) ON DELETE CASCADE,
    CONSTRAINT fk_return_items_product FOREIGN KEY (product_id)
        REFERENCES produk(id) ON DELETE RESTRICT
);

-- Print Settings table (Printer configuration)
CREATE TABLE IF NOT EXISTS print_settings (
    id INTEGER PRIMARY KEY,
    printer_name VARCHAR(255) DEFAULT '',
    paper_size VARCHAR(50) DEFAULT '80mm',
    paper_width INTEGER DEFAULT 48,
    font_size VARCHAR(50) DEFAULT 'medium',
    line_spacing INTEGER DEFAULT 1,
    left_margin INTEGER DEFAULT 0,
    dash_line_char VARCHAR(10) DEFAULT '-',
    double_line_char VARCHAR(10) DEFAULT '=',
    header_alignment VARCHAR(10) DEFAULT 'center',
    title_alignment VARCHAR(10) DEFAULT 'center',
    footer_alignment VARCHAR(10) DEFAULT 'center',
    header_text VARCHAR(255) DEFAULT 'TOKO RITEL',
    header_address TEXT DEFAULT 'Jl. Contoh No. 123',
    header_phone VARCHAR(50) DEFAULT '0812-3456-7890',
    footer_text TEXT DEFAULT 'Terima kasih atas kunjungan Anda!',
    show_logo INTEGER DEFAULT 0,
    auto_print INTEGER DEFAULT 0,
    copies_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stok History table (Stock movement tracking)
CREATE TABLE IF NOT EXISTS stok_history (
    id SERIAL PRIMARY KEY,
    produk_id INTEGER NOT NULL,
    stok_sebelum REAL NOT NULL,
    stok_sesudah REAL NOT NULL,
    perubahan REAL NOT NULL,
    jenis_perubahan VARCHAR(50) NOT NULL,
    tipe_kerugian VARCHAR(100),
    nilai_kerugian INTEGER DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_stok_history_produk FOREIGN KEY (produk_id)
        REFERENCES produk(id) ON DELETE CASCADE
);

-- Batch table (FIFO stock management with expiry tracking)
CREATE TABLE IF NOT EXISTS batch (
    id VARCHAR(255) PRIMARY KEY,
    produk_id INTEGER NOT NULL,
    qty REAL NOT NULL DEFAULT 0,
    qty_tersisa REAL NOT NULL DEFAULT 0,
    tanggal_restok TIMESTAMP NOT NULL DEFAULT NOW(),
    masa_simpan_hari INTEGER NOT NULL,
    tanggal_kadaluarsa TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'fresh',
    supplier VARCHAR(255) DEFAULT '',
    keterangan TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_batch_produk FOREIGN KEY (produk_id)
        REFERENCES produk(id) ON DELETE CASCADE
);

-- Poin Settings table (Loyalty points configuration)
CREATE TABLE IF NOT EXISTS poin_settings (
    id INTEGER PRIMARY KEY,
    point_value INTEGER DEFAULT 500,
    min_exchange INTEGER DEFAULT 100,
    min_transaction_for_points INTEGER DEFAULT 25000,
    level2_min_points INTEGER DEFAULT 500,
    level3_min_points INTEGER DEFAULT 1000,
    level2_min_spending INTEGER DEFAULT 5000000,
    level3_min_spending INTEGER DEFAULT 10000000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Produk indexes
CREATE INDEX IF NOT EXISTS idx_produk_barcode ON produk(barcode);
CREATE INDEX IF NOT EXISTS idx_produk_sku ON produk(sku);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori);
CREATE INDEX IF NOT EXISTS idx_produk_jenis ON produk(jenis_produk);

-- Kategori indexes
CREATE INDEX IF NOT EXISTS idx_kategori_nama ON kategori(nama);

-- Transaksi indexes
CREATE INDEX IF NOT EXISTS idx_transaksi_nomor ON transaksi(nomor_transaksi);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_pelanggan ON transaksi(pelanggan_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_staff ON transaksi(staff_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON transaksi(status);

-- Transaksi Item indexes
CREATE INDEX IF NOT EXISTS idx_transaksi_item_transaksi ON transaksi_item(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_item_produk ON transaksi_item(produk_id);

-- Pelanggan indexes
CREATE INDEX IF NOT EXISTS idx_pelanggan_telepon ON pelanggan(telepon);
CREATE INDEX IF NOT EXISTS idx_pelanggan_tipe ON pelanggan(tipe);
CREATE INDEX IF NOT EXISTS idx_pelanggan_level ON pelanggan(level);

-- Promo indexes
CREATE INDEX IF NOT EXISTS idx_promo_kode ON promo(kode);
CREATE INDEX IF NOT EXISTS idx_promo_status ON promo(status);
CREATE INDEX IF NOT EXISTS idx_promo_produk_x ON promo(produk_x);
CREATE INDEX IF NOT EXISTS idx_promo_produk_y ON promo(produk_y);
CREATE INDEX IF NOT EXISTS idx_promo_tanggal_mulai ON promo(tanggal_mulai);
CREATE INDEX IF NOT EXISTS idx_promo_tanggal_selesai ON promo(tanggal_selesai);

-- Returns indexes
CREATE INDEX IF NOT EXISTS idx_returns_transaksi ON returns(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_returns_date ON returns(return_date);

-- Return Items indexes
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);

-- Stok History indexes
CREATE INDEX IF NOT EXISTS idx_stok_history_produk ON stok_history(produk_id);
CREATE INDEX IF NOT EXISTS idx_stok_history_tanggal ON stok_history(created_at);

-- Batch indexes
CREATE INDEX IF NOT EXISTS idx_batch_produk ON batch(produk_id);
CREATE INDEX IF NOT EXISTS idx_batch_status ON batch(status);
CREATE INDEX IF NOT EXISTS idx_batch_kadaluarsa ON batch(tanggal_kadaluarsa);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for produk table
DROP TRIGGER IF EXISTS update_produk_timestamp ON produk;
CREATE TRIGGER update_produk_timestamp
    BEFORE UPDATE ON produk
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for kategori table
DROP TRIGGER IF EXISTS update_kategori_timestamp ON kategori;
CREATE TRIGGER update_kategori_timestamp
    BEFORE UPDATE ON kategori
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for pelanggan table
DROP TRIGGER IF EXISTS update_pelanggan_timestamp ON pelanggan;
CREATE TRIGGER update_pelanggan_timestamp
    BEFORE UPDATE ON pelanggan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for promo table
DROP TRIGGER IF EXISTS update_promo_timestamp ON promo;
CREATE TRIGGER update_promo_timestamp
    BEFORE UPDATE ON promo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for batch table
DROP TRIGGER IF EXISTS update_batch_timestamp ON batch;
CREATE TRIGGER update_batch_timestamp
    BEFORE UPDATE ON batch
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for returns table
DROP TRIGGER IF EXISTS update_returns_timestamp ON returns;
CREATE TRIGGER update_returns_timestamp
    BEFORE UPDATE ON returns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for print_settings table
DROP TRIGGER IF EXISTS update_print_settings_timestamp ON print_settings;
CREATE TRIGGER update_print_settings_timestamp
    BEFORE UPDATE ON print_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for poin_settings table
DROP TRIGGER IF EXISTS update_poin_settings_timestamp ON poin_settings;
CREATE TRIGGER update_poin_settings_timestamp
    BEFORE UPDATE ON poin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE migrations IS 'Tracks applied database migrations';
COMMENT ON TABLE kategori IS 'Product categories';
COMMENT ON TABLE produk IS 'Products and inventory';
COMMENT ON TABLE keranjang IS 'Temporary shopping cart for POS';
COMMENT ON TABLE pelanggan IS 'Customer information and loyalty data';
COMMENT ON TABLE users IS 'Staff and admin user accounts';
COMMENT ON TABLE transaksi IS 'Transaction headers (receipts)';
COMMENT ON TABLE transaksi_item IS 'Transaction line items (products sold)';
COMMENT ON TABLE pembayaran IS 'Payment methods used in transactions';
COMMENT ON TABLE promo IS 'Promotions and discounts';
COMMENT ON TABLE promo_produk IS 'Products included in specific promotions';
COMMENT ON TABLE returns IS 'Product return and exchange transactions';
COMMENT ON TABLE return_items IS 'Items being returned';
COMMENT ON TABLE print_settings IS 'Thermal printer configuration';
COMMENT ON TABLE stok_history IS 'Stock movement audit trail';
COMMENT ON TABLE batch IS 'FIFO inventory batches with expiry dates';
COMMENT ON TABLE poin_settings IS 'Customer loyalty points configuration';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schema created successfully!';
    RAISE NOTICE 'Database: ritel_db';
    RAISE NOTICE 'Total tables: 18';
    RAISE NOTICE '========================================';
END $$;
