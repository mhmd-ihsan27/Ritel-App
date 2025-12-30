# Panduan Fitur Offline-First Auto-Sync

## Gambaran Umum

Ritel-App dilengkapi dengan **fitur Offline-First Auto-Sync** yang memungkinkan aplikasi desktop tetap berfungsi penuh meskipun koneksi internet terputus. Semua perubahan data yang dilakukan saat offline akan **otomatis di-sync ke server** ketika koneksi internet kembali.

## Fitur Utama

### ✅ **Apa yang Bisa Dilakukan Saat Offline?**

Semua operasi berikut tetap berfungsi 100% meskipun offline:

1. **Transaksi POS**
   - Proses penjualan normal
   - Scan barcode
   - Multiple payment methods
   - Cetak struk (jika printer terhubung lokal)

2. **Manajemen Produk**
   - Tambah produk baru
   - Update harga, stok, kategori
   - Hapus produk
   - Update batch inventory

3. **Manajemen Stok**
   - Tambah stok (create batch baru)
   - Kurangi stok (dengan alasan: rusak, hilang, kadaluarsa)
   - Lihat riwayat stok (dari cache lokal)
   - Update masa simpan

4. **Manajemen Customer**
   - Tambah customer baru
   - Update data customer
   - Tambah/kurangi poin loyalty
   - Lihat riwayat transaksi customer

5. **Manajemen Promo**
   - Buat promo baru
   - Edit/hapus promo
   - Apply promo ke transaksi

6. **Return & Exchange**
   - Proses return barang
   - Exchange produk

### 🔄 **Cara Kerja Auto-Sync**

#### **Saat Offline:**
1. Semua operasi disimpan ke database lokal (SQLite)
2. Operasi ditambahkan ke **sync queue**
3. User mendapat notifikasi: _"Data akan di-sync otomatis ketika online"_
4. Aplikasi tetap responsif dan cepat

#### **Saat Online Kembali:**
1. Aplikasi otomatis detect koneksi kembali (dalam 2 detik)
2. Sync engine mulai bekerja otomatis
3. Semua operasi pending di-sync ke server (PostgreSQL)
4. Sync status ditampilkan di header
5. User bisa force sync manual jika diperlukan

#### **Mekanisme Sync:**
```
[Offline Mode]
├─ User: Tambah produk "Apel Fuji"
├─ Local DB: ✅ Data tersimpan langsung
├─ Sync Queue: Added to queue (pending)
└─ UI: Show success + offline notice

[Connection Restored]
├─ Network: Detect online (2 sec delay)
├─ Auto Sync: Start syncing pending operations
├─ Retry: Max 5 attempts if failed
├─ Server: ✅ Data replicated to PostgreSQL
└─ UI: Show sync success
```

---

## Konfigurasi Sync Mode

### **1. Enable Sync Mode di `.env`**

```env
# ========================================
# SYNC MODE CONFIGURATION (Offline-First)
# ========================================
SYNC_MODE=enabled

# Local SQLite database (always fast, works offline)
SYNC_SQLITE_DSN=./data/ritel_local.db

# Remote PostgreSQL database (cloud server)
SYNC_POSTGRES_DSN=host=your-server.com port=5432 user=ritel password=YOUR_PASSWORD dbname=ritel_db sslmode=require

# Sync interval (how often to check for pending syncs)
SYNC_INTERVAL=10s

# Health check interval (how often to ping server)
HEALTH_CHECK_INTERVAL=30s
```

### **2. Database Modes**

Aplikasi mendukung beberapa mode database:

| Mode | Use Case | Offline Support |
|------|----------|-----------------|
| **SQLite Only** | Single store, no internet | ❌ No sync |
| **PostgreSQL Only** | Multi-store, always online | ❌ Requires internet |
| **Dual Mode** | Redundancy, backup | ⚡ Limited |
| **Sync Mode** | **Offline-first + cloud backup** | ✅ **Full support** |

**Recommended:** Sync Mode untuk reliability maksimal!

---

## User Interface

### **1. Sync Status Indicator (Header)**

Di header aplikasi, Anda akan melihat:

#### **Saat Online:**
```
🟢 Online  |  0 pending
```

#### **Saat Offline:**
```
🔴 Offline  |  12 pending  |  [🔄 Sync]
```

- **🟢 Online**: Terhubung ke server
- **🔴 Offline**: Tidak ada koneksi
- **Angka pending**: Jumlah operasi menunggu sync
- **🔄 Sync button**: Tombol manual sync (hanya muncul jika online)

### **2. Sync Status Detail**

Akses dari menu **Pengaturan > Sinkronisasi** untuk melihat:

- **Status koneksi**: Online/Offline
- **Pending operations**: Operasi yang menunggu sync
- **Synced count**: Jumlah operasi berhasil sync
- **Failed count**: Operasi gagal sync (akan auto-retry)
- **Last sync time**: Waktu sync terakhir
- **Operation details**: Detail setiap operasi pending

### **3. Notifikasi**

Aplikasi akan menampilkan toast notification:

#### **Saat Offline:**
```
ℹ️ Mode Offline
Data disimpan lokal dan akan di-sync otomatis saat online.
```

#### **Saat Online Kembali:**
```
✅ Koneksi Kembali!
Auto-sync 12 operasi pending...
```

#### **Sync Success:**
```
✅ Sync Berhasil!
12 operasi berhasil di-sync ke server.
```

#### **Sync Failed:**
```
⚠️ Sync Gagal
Beberapa operasi gagal sync. Akan retry otomatis.
```

---

## Cara Menggunakan

### **Scenario 1: Transaksi Saat Offline**

1. User melakukan transaksi POS seperti biasa
2. Aplikasi save ke SQLite lokal (instant)
3. Toast muncul: _"Transaksi tersimpan. Akan di-sync otomatis saat online."_
4. Transaksi tercatat, struk bisa dicetak
5. Ketika online, data otomatis ter-sync ke server

### **Scenario 2: Update Stok Saat Offline**

1. Buka **Produk > Update Stok**
2. Pilih produk, tambah/kurangi stok
3. Data tersimpan lokal instantly
4. Sync queue bertambah (lihat di header)
5. Auto-sync saat online kembali

### **Scenario 3: Manual Force Sync**

Jika ingin sync manual:

1. Pastikan koneksi internet aktif
2. Klik tombol **🔄 Sync** di header, ATAU
3. Buka **Pengaturan > Sinkronisasi**
4. Klik **Sync Sekarang**
5. Wait hingga semua pending operations ter-sync

### **Scenario 4: Monitoring Sync**

1. Buka **Pengaturan > Sinkronisasi**
2. Lihat status real-time:
   - Pending: Operasi menunggu sync
   - Synced: Operasi berhasil sync
   - Failed: Operasi gagal sync (auto-retry max 5x)
3. Klik **Sync Sekarang** jika perlu force sync
4. Klik **Clear Synced** untuk hapus history sync > 7 hari

---

## Troubleshooting

### **❓ Pending operations tidak berkurang?**

**Penyebab:**
- Koneksi internet tidak stabil
- Server PostgreSQL down
- Firewall blocking connection

**Solusi:**
1. Cek koneksi internet
2. Ping server PostgreSQL
3. Force sync manual dari menu Sinkronisasi
4. Cek logs di `app.log`

---

### **❓ Sync failed terus-menerus?**

**Penyebab:**
- Database server down
- Invalid credentials
- Network firewall

**Solusi:**
1. Cek `SYNC_POSTGRES_DSN` di `.env`
2. Test connection: `psql -h host -U user -d dbname`
3. Cek server logs
4. Hubungi admin server

---

### **❓ Data tidak muncul di server setelah sync?**

**Penyebab:**
- Sync belum selesai
- Connection timeout mid-sync

**Solusi:**
1. Tunggu hingga semua pending = 0
2. Check sync status di menu Sinkronisasi
3. Verify di server database
4. Check `app.log` untuk error details

---

### **❓ Aplikasi lambat saat offline?**

**Jawaban:**
Aplikasi TIDAK akan lambat saat offline! Justru lebih cepat karena:
- All operations ke SQLite lokal
- No network latency
- Direct disk I/O

Jika tetap lambat:
1. Check disk space
2. Optimize SQLite: `PRAGMA optimize;`
3. Restart aplikasi

---

## Best Practices

### **✅ DO:**
1. **Selalu enable Sync Mode** untuk toko retail
2. **Monitor sync status** secara berkala
3. **Clear synced queue** setiap minggu untuk performa optimal
4. **Backup SQLite database** secara regular
5. **Test offline mode** sebelum deploy production

### **❌ DON'T:**
1. **Jangan force quit** saat sedang sync
2. **Jangan delete** SQLite database tanpa backup
3. **Jangan ubah** `SYNC_SQLITE_DSN` setelah production
4. **Jangan abaikan** failed sync warnings
5. **Jangan lupa** test connectivity ke server PostgreSQL

---

## Technical Details

### **Sync Queue Table Structure**

```sql
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,           -- e.g., "produk", "transaksi"
    operation TEXT NOT NULL,            -- INSERT, UPDATE, DELETE
    record_id INTEGER NOT NULL,         -- ID of affected record
    data TEXT NOT NULL,                 -- JSON data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,      -- Max 5 retries
    last_error TEXT,
    status TEXT DEFAULT 'pending'       -- pending, synced, failed
);
```

### **Retry Logic**

```go
if retryCount >= 5 {
    status = 'failed'  // Give up after 5 attempts
    log.Error("Max retries exceeded")
} else {
    status = 'pending'  // Will retry on next sync cycle
    retryCount++
}
```

### **Sync Intervals**

| Operation | Interval |
|-----------|----------|
| Health Check | 30 seconds |
| Auto Sync | 10 seconds |
| Manual Sync | On demand |
| Retry Failed | Next sync cycle |

---

## API Endpoints

### **GET /api/sync/status**
Get current sync status

**Response:**
```json
{
  "online": true,
  "pending": 5,
  "synced": 120,
  "failed": 2,
  "status": "🟢 ONLINE"
}
```

### **POST /api/sync/force**
Force sync all pending operations

**Response:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "data": {
    "online": true,
    "pending": 0,
    "synced": 125,
    "failed": 0
  }
}
```

### **GET /api/sync/pending**
Get list of pending operations

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "table_name": "produk",
      "operation": "INSERT",
      "record_id": 456,
      "created_at": "2024-12-25T10:30:00Z",
      "retry_count": 0,
      "status": "pending"
    }
  ]
}
```

### **POST /api/sync/clear**
Clear successfully synced operations (> 7 days old)

**Response:**
```json
{
  "success": true,
  "data": {
    "cleared": 50
  },
  "message": "Synced queue cleared successfully"
}
```

---

## FAQ

### **Q: Apakah data aman saat offline?**
**A:** Ya! Data tersimpan di SQLite lokal dengan:
- ACID transactions
- WAL mode untuk concurrency
- Auto backup before migrations
- Encryption ready (bisa ditambahkan SQLCipher)

### **Q: Berapa lama data offline bisa bertahan?**
**A:** Unlimited! SQLite bisa store jutaan records. Tapi sync ASAP untuk data integrity.

### **Q: Apakah bisa multi-device offline?**
**A:** Tidak direkomendasikan! Offline-first dirancang untuk single device. Multi-device = potential conflicts.

### **Q: Bagaimana handle konflik data?**
**A:** Saat ini: Last-write-wins. PostgreSQL akan accept update terakhir. Future: Conflict resolution UI.

### **Q: Apakah perlu internet untuk desktop mode?**
**A:** TIDAK! Desktop mode pure offline dengan SQLite. Internet hanya perlu untuk sync ke cloud.

---

## Support

Jika ada masalah dengan fitur offline-first:

1. Check `app.log` untuk detailed errors
2. Verify `.env` configuration
3. Test PostgreSQL connection
4. Check sync_queue table di SQLite
5. Contact support dengan error logs

---

**Dokumentasi ini akan terus diupdate seiring development fitur baru.**

Last Updated: 2024-12-25
Version: 1.0.0
