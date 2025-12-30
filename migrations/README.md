# Database Migrations

## Migration 001: Update transaksi_item to preserve transaction history

### What Changed?

Produk yang sudah dihapus sekarang akan tetap terlihat di history transaksi. Perubahan ini membuat:
- Kolom `produk_id` di tabel `transaksi_item` menjadi nullable
- Foreign key constraint berubah dari `ON DELETE RESTRICT` ke `ON DELETE SET NULL`
- Ketika produk dihapus, `produk_id` akan di-set NULL tetapi data produk lainnya (SKU, Nama, Kategori, Harga) tetap tersimpan

### For New Database

Jika Anda memulai database baru, tidak perlu menjalankan migration. Schema terbaru sudah termasuk perubahan ini.

### For Existing Database

**PENTING: Backup database Anda terlebih dahulu sebelum menjalankan migration!**

#### Option 1: Manual Migration (Recommended)

1. Backup database Anda:
   ```bash
   copy ritel.db ritel.db.backup
   ```

2. Jalankan migration SQL menggunakan SQLite CLI:
   ```bash
   sqlite3 ritel.db < migrations/001_update_transaksi_item_produk_id_nullable.sql
   ```

#### Option 2: Recreate Database (Untuk Development)

Jika data Anda tidak penting (development), Anda bisa hapus database dan buat baru:
1. Hapus file `ritel.db`
2. Jalankan aplikasi, database baru akan dibuat otomatis dengan schema terbaru

### Verification

Setelah migration, verifikasi bahwa:
1. Semua transaksi lama masih bisa dilihat
2. Anda bisa menghapus produk tanpa error "foreign key constraint failed"
3. History transaksi untuk produk yang dihapus masih menampilkan nama produk, SKU, dan harga

### Rollback

Jika ada masalah, restore dari backup:
```bash
copy ritel.db.backup ritel.db
```
