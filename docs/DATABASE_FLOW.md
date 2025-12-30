# 🗄️ Database Flow - Ritel-App

Penjelasan lengkap tentang database mana yang digunakan dan kemana data disimpan.

---

## 📊 Database Architecture

Ritel-App mendukung **3 mode database** yang bisa dipilih via konfigurasi `.env`:

```
Mode 1: SQLite Only    (Desktop standalone)
Mode 2: PostgreSQL Only (Web multi-user)
Mode 3: Dual Mode      (Keduanya, auto-sync)
```

---

## 🔍 **Konfigurasi Saat Ini (Berdasarkan .env)**

**File: `.env` (line 4-5)**
```env
DB_DRIVER=sqlite3      ← Mode yang aktif sekarang
DB_DSN=./ritel.db      ← Lokasi database SQLite
WEB_ENABLED=true       ← Web server diaktifkan
```

### **Kesimpulan Konfigurasi Saat Ini:**
- ✅ **Database yang dipakai:** SQLite
- ✅ **Lokasi database:** `C:\Users\Hp\ritel-app\ritel.db`
- ✅ **Mode website:** Aktif (port 8080)
- ✅ **Data masuk kemana:** Semua data tersimpan di SQLite lokal

---

## 💾 Flow Data - Mode SQLite (Konfigurasi Saat Ini)

```
┌─────────────────────────────────────────────────┐
│          CLIENT LAYER                           │
├─────────────────────────────────────────────────┤
│  Desktop App (Wails)  │  Web Browser           │
│  Windows Native       │  http://localhost:8080 │
└─────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────┐
│          APPLICATION LAYER                      │
├─────────────────────────────────────────────────┤
│              Ritel-App Backend (Go)             │
│  - Wails IPC (desktop)                          │
│  - HTTP REST API (web)                          │
│  - Service Container (shared logic)             │
└─────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────┐
│          DATABASE LAYER                         │
├─────────────────────────────────────────────────┤
│           SQLite Database                       │
│  📁 C:\Users\Hp\ritel-app\ritel.db             │
│                                                 │
│  ✅ Desktop app → SQLite                        │
│  ✅ Website     → SQLite (SAMA!)                │
└─────────────────────────────────────────────────┘
```

### **Penjelasan:**
- Desktop app dan website **MENGGUNAKAN DATABASE YANG SAMA**
- Semua input data (dari desktop atau web) tersimpan di **satu file SQLite**
- Database location: `C:\Users\Hp\ritel-app\ritel.db`

---

## 🌐 Flow Data - Mode PostgreSQL (Untuk Production)

**Untuk menggunakan PostgreSQL, ubah `.env`:**
```env
DB_DRIVER=postgres
DB_DSN=host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable
WEB_ENABLED=true
```

```
┌─────────────────────────────────────────────────┐
│          CLIENT LAYER                           │
├─────────────────────────────────────────────────┤
│  Desktop App (Wails)  │  Web Browser           │
│  Windows Native       │  https://yourdomain.com│
└─────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────┐
│          APPLICATION LAYER                      │
├─────────────────────────────────────────────────┤
│              Ritel-App Backend (Go)             │
│  - Wails IPC (desktop)                          │
│  - HTTP REST API (web)                          │
│  - Service Container (shared logic)             │
└─────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────┐
│          DATABASE LAYER                         │
├─────────────────────────────────────────────────┤
│         PostgreSQL Database                     │
│  🗄️ Server: localhost:5432                     │
│  📊 Database: ritel_db                          │
│                                                 │
│  ✅ Desktop app → PostgreSQL                    │
│  ✅ Website     → PostgreSQL (SAMA!)            │
└─────────────────────────────────────────────────┘
```

### **Penjelasan:**
- Desktop app dan website **MENGGUNAKAN PostgreSQL YANG SAMA**
- Cocok untuk **multi-user** dan **remote access**
- Data tersimpan di PostgreSQL server

---

## 🔄 Flow Data - Dual Mode (Best of Both Worlds)

**Untuk menggunakan Dual Mode, ubah `.env`:**
```env
DB_DRIVER=dual
DB_POSTGRES_DSN=host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable
DB_SQLITE_DSN=./ritel_backup.db
WEB_ENABLED=true
```

```
┌─────────────────────────────────────────────────┐
│          CLIENT LAYER                           │
├─────────────────────────────────────────────────┤
│  Desktop App (Wails)  │  Web Browser           │
└─────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────┐
│          APPLICATION LAYER                      │
├─────────────────────────────────────────────────┤
│              Ritel-App Backend (Go)             │
│           database.Exec() wrapper               │
└─────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────┐
│          DATABASE LAYER (DUAL WRITE)            │
├─────────────────────────────────────────────────┤
│  PostgreSQL (PRIMARY)  │  SQLite (BACKUP)       │
│  - Used for reads      │  - Auto backup         │
│  - Write #1            │  - Write #2            │
│  - ritel_db            │  - ritel_backup.db     │
│                                                 │
│  ✅ Desktop → PostgreSQL + SQLite               │
│  ✅ Website → PostgreSQL + SQLite               │
│  ✅ Auto-sync keduanya!                         │
└─────────────────────────────────────────────────┘
```

### **Penjelasan:**
- Setiap kali ada **INSERT, UPDATE, DELETE**:
  1. Data ditulis ke **PostgreSQL** (primary)
  2. Data ditulis ke **SQLite** (backup)
  3. Otomatis dalam satu transaksi!
- Pembacaan data dari **PostgreSQL**
- Jika PostgreSQL down, masih punya **SQLite backup**

---

## 📝 Kode Flow - Bagaimana Data Disimpan

### 1. **Inisialisasi Database (main.go)**

```go
// main.go line 37-40
log.Println("[INIT] Initializing database...")
if err := database.InitDB(); err != nil {
    log.Fatalf("Failed to initialize database: %v", err)
}
```

**Yang terjadi:**
1. Baca file `.env`
2. Lihat `DB_DRIVER` (sqlite3/postgres/dual)
3. Buka koneksi database
4. Set global variable `database.DB`

### 2. **Membaca Konfigurasi (database.go)**

```go
// database.go line 46
dbConfig := config.GetDatabaseConfig()

// config.go
func GetDatabaseConfig() DatabaseConfig {
    driver := getEnv("DB_DRIVER", "sqlite3")  // Default: sqlite3
    dsn := getEnv("DB_DSN", "./ritel.db")     // Default: ./ritel.db

    return DatabaseConfig{
        Driver: driver,  // "sqlite3" dari .env Anda
        DSN:    dsn,     // "./ritel.db" dari .env Anda
    }
}
```

### 3. **Koneksi Database**

**Mode SQLite (Konfigurasi Anda Saat Ini):**
```go
// database.go line 71-92
if dbConfig.Driver == "sqlite3" {
    homeDir, _ := os.UserHomeDir()
    // homeDir = C:\Users\Hp

    newAppDir := filepath.Join(homeDir, "ritel-app")
    // newAppDir = C:\Users\Hp\ritel-app

    dbPath := filepath.Join(newAppDir, "ritel.db")
    // dbPath = C:\Users\Hp\ritel-app\ritel.db

    dsn = dbPath
}

db, err := sql.Open("sqlite3", dsn)
database.DB = db  // ← Global database connection
```

**Lokasi file database:**
```
C:\Users\Hp\ritel-app\ritel.db
```

### 4. **Menyimpan Data (Contoh: Input Produk)**

**Frontend (Desktop atau Website) → API Call:**
```javascript
// frontend/src/api/produk.js
export const createProduk = async (data) => {
    if (isWebMode()) {
        // Website: HTTP POST
        const response = await client.post('/api/produk', data);
        return response.data;
    } else {
        // Desktop: Wails IPC
        const { CreateProduk } = await import('../../wailsjs/go/main/App');
        return await CreateProduk(data);
    }
}
```

**Backend → Repository → Database:**
```go
// internal/repository/produk_repository.go line 21-63
func (r *ProdukRepository) Create(produk *models.Produk) error {
    query := `
        INSERT INTO produk (
            sku, barcode, nama, kategori, harga_jual, stok, ...
        ) VALUES (?, ?, ?, ?, ?, ?, ...)
    `

    // Eksekusi query ke database
    result, err := database.DB.Exec(query,
        produk.SKU,
        produk.Barcode,
        produk.Nama,
        // ...
    )

    // database.DB → SQLite Connection
    // Data tersimpan di: C:\Users\Hp\ritel-app\ritel.db
}
```

**Dual Mode (Jika diaktifkan):**
```go
// database.go line 417-445
func Exec(query string, args ...interface{}) (sql.Result, error) {
    if !UseDualMode {
        // Single mode: hanya 1 database
        return DB.Exec(query, args...)
    }

    // Dual mode: tulis ke 2 database!
    return execDual(query, args...)
}

func execDual(query string, args ...interface{}) (sql.Result, error) {
    // 1. Tulis ke PostgreSQL
    resultPostgres, err := DBPostgres.Exec(query, args...)
    if err != nil {
        return nil, fmt.Errorf("PostgreSQL exec failed: %w", err)
    }

    // 2. Tulis ke SQLite
    _, err = DBSQLite.Exec(query, args...)
    if err != nil {
        return nil, fmt.Errorf("SQLite exec failed: %w", err)
    }

    // Return PostgreSQL result
    return resultPostgres, nil
}
```

---

## 🎯 Kesimpulan - Jawaban Langsung

### **Q: Website mengambil database yang mana?**
**A:** Tergantung konfigurasi `.env`:

| DB_DRIVER | Database yang Digunakan Website |
|-----------|----------------------------------|
| `sqlite3` | **SQLite** di `C:\Users\Hp\ritel-app\ritel.db` |
| `postgres` | **PostgreSQL** di server (localhost:5432) |
| `dual` | **PostgreSQL** (primary) + **SQLite** (backup) |

**Konfigurasi Anda saat ini:** `DB_DRIVER=sqlite3`
- ✅ Website pakai: **SQLite**
- ✅ Lokasi: `C:\Users\Hp\ritel-app\ritel.db`

### **Q: Ketika ada input data, ke database mana datanya?**
**A:** Ke database yang sama dengan yang digunakan website!

**Mode SQLite (Konfigurasi Anda):**
```
Input Data (Desktop/Website) → Backend → SQLite
                                        ↓
                              C:\Users\Hp\ritel-app\ritel.db
```

**Mode PostgreSQL:**
```
Input Data (Desktop/Website) → Backend → PostgreSQL
                                        ↓
                              localhost:5432 → ritel_db
```

**Mode Dual:**
```
Input Data (Desktop/Website) → Backend → PostgreSQL + SQLite
                                        ↓
                              1. PostgreSQL (localhost:5432/ritel_db)
                              2. SQLite (C:\Users\Hp\ritel-app\ritel_backup.db)
```

---

## 🔍 Cara Cek Database Anda

### **1. Cek Mode Database Aktif**
```bash
# Lihat file .env
cat .env | grep DB_DRIVER

# Output saat ini:
# DB_DRIVER=sqlite3
```

### **2. Cek Lokasi Database SQLite**
```bash
# Windows
dir C:\Users\Hp\ritel-app\

# Output:
# ritel.db          ← Database utama
# backups\          ← Folder backup
```

### **3. Lihat Data di Database**
```bash
# Install SQLite tools
# Download: https://www.sqlite.org/download.html

# Buka database
sqlite3 C:\Users\Hp\ritel-app\ritel.db

# Lihat tabel
.tables

# Lihat data produk
SELECT COUNT(*) FROM produk;
SELECT * FROM produk LIMIT 5;

# Lihat data transaksi
SELECT COUNT(*) FROM transaksi;

# Exit
.quit
```

### **4. Monitoring Database Real-time**
```bash
# Watch database file size
# Windows PowerShell
Get-ChildItem C:\Users\Hp\ritel-app\ritel.db | Select-Object Name, Length, LastWriteTime

# Linux/Mac
watch -n 1 'ls -lh ~/ritel-app/ritel.db'
```

---

## 🔄 Cara Ganti Mode Database

### **Scenario 1: Ganti ke PostgreSQL (Production)**

**1. Setup PostgreSQL:**
```bash
# Install PostgreSQL
# Download: https://www.postgresql.org/download/

# Create database
psql -U postgres
CREATE DATABASE ritel_db;
CREATE USER ritel WITH PASSWORD 'ritel123';
GRANT ALL PRIVILEGES ON DATABASE ritel_db TO ritel;
\q

# Import schema
psql -U ritel -d ritel_db -f database/schema_postgres.sql
```

**2. Update .env:**
```env
DB_DRIVER=postgres
DB_DSN=host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable
WEB_ENABLED=true
```

**3. Restart aplikasi:**
```bash
# Stop current app
# Start app lagi
./ritel-app.exe
```

**4. Data sekarang di PostgreSQL!**

### **Scenario 2: Ganti ke Dual Mode (Best Practice)**

**1. Setup PostgreSQL (sama seperti di atas)**

**2. Update .env:**
```env
DB_DRIVER=dual
DB_POSTGRES_DSN=host=localhost port=5432 user=ritel password=ritel123 dbname=ritel_db sslmode=disable
DB_SQLITE_DSN=./ritel_backup.db
WEB_ENABLED=true
```

**3. Restart aplikasi**

**4. Sekarang data otomatis tersimpan di:**
- ✅ PostgreSQL (primary)
- ✅ SQLite backup (auto-sync)

---

## 📊 Perbandingan Mode Database

| Fitur | SQLite | PostgreSQL | Dual Mode |
|-------|--------|------------|-----------|
| **Setup** | ⭐⭐⭐⭐⭐ Mudah | ⭐⭐⭐ Sedang | ⭐⭐⭐ Sedang |
| **Performance** | ⭐⭐⭐⭐ Bagus | ⭐⭐⭐⭐⭐ Sangat Bagus | ⭐⭐⭐⭐ Bagus |
| **Multi-User** | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent |
| **Remote Access** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Backup** | Manual | Manual | ✅ Otomatis |
| **Data Redundancy** | ❌ Tidak | ❌ Tidak | ✅ Ya (2 copy) |
| **Cocok Untuk** | Desktop standalone | Web multi-user | Production terbaik |

---

## 🆘 Troubleshooting

### **Issue: Data tidak muncul di website**

**Penyebab:**
- Desktop dan website pakai database berbeda

**Solusi:**
```bash
# 1. Cek mode database
cat .env | grep DB_DRIVER

# 2. Pastikan WEB_ENABLED=true
cat .env | grep WEB_ENABLED

# 3. Cek lokasi database
# Desktop: Check wails logs
# Website: Check file yang digunakan
```

### **Issue: Database file tidak ditemukan**

**Solusi:**
```bash
# Create directory manually
mkdir -p C:\Users\Hp\ritel-app

# Restart app, it will auto-create database
```

### **Issue: Want to migrate SQLite → PostgreSQL**

**Solusi:**
```bash
# 1. Export SQLite data
sqlite3 C:\Users\Hp\ritel-app\ritel.db .dump > dump.sql

# 2. Convert to PostgreSQL format (manual editing)
# 3. Import to PostgreSQL
psql -U ritel -d ritel_db < dump_converted.sql

# 4. Update .env to use PostgreSQL
```

---

## 📞 Summary

**Konfigurasi Saat Ini:**
- ✅ Mode: **SQLite**
- ✅ Database: `C:\Users\Hp\ritel-app\ritel.db`
- ✅ Website & Desktop: **Pakai database yang sama**
- ✅ Input data: **Tersimpan di SQLite file**

**Untuk Production (Recommended):**
- ⭐ Gunakan **Dual Mode**
- ⭐ PostgreSQL (primary) + SQLite (backup)
- ⭐ Auto-sync 2 database
- ⭐ Data redundancy terjamin

---

*Semua mode database menggunakan codebase yang sama, hanya konfigurasi `.env` yang berbeda!* 🚀
