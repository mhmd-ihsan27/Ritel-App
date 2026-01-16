---
description: Panduan MENJALANKAN Aplikasi dengan Fitur Sinkronisasi Data (Desktop <-> Web)
---

# Panduan Menjalankan Ritel-App (Sync Mode)

Ikuti urutan ini untuk memastikan data lama ter-migrasi dan sinkronisasi berjalan lancar.

## 1. Persiapan Database (Opsional)
**Lakukan ini HANYA jika Anda ingin menggunakan data lama dari komputer lain/backup.**
1.  Pastikan aplikasi Desktop sedang **MATI/TUTUP**.
2.  Siapkan file `ritel.db` lama Anda.
3.  Copy dan Paste file tersebut ke folder project: `c:\Users\Hp\Videos\Ritel-App\ritel.db`.
    - *Timpa (Overwrite) jika diminta.*

## 2. Menjalankan Server Web (PostgreSQL)
Aplikasi Web harus nyala sebagai pusat data.
1.  Buka Terminal baru (Terminal 1).
2.  Jalankan perintah:
    ```powershell
    go run . --web
    ```
3.  Biarkan terminal ini terbuka. Jangan ditutup.

## 3. Menjalankan Server Frontend (Opsional/Dev Mode)
Jika Anda menggunakan mode Developer.
1.  Buka Terminal baru (Terminal 2).
2.  Masuk ke folder frontend: `cd frontend`
3.  Jalankan: `npm run dev`

## 4. Menjalankan Aplikasi Desktop (PENTING!)
Ini adalah langkah kunci untuk Sinkronisasi.
1.  Buka Terminal baru (Terminal 3).
2.  Jalankan perintah:
    ```powershell
    wails dev
    ```
3.  **Halaman Login/Dashboard Desktop akan muncul.**

## 5. Verifikasi Sinkronisasi (Otomatis)
Setelah Desktop menyala:
1.  **Tunggu 5-10 Detik.** Jangan langsung dimatikan.
2.  Aplikasi akan otomatis melakukan:
    -   **Initial Push:** Mengirim semua data dari `ritel.db` ke Web.
    -   **Sequence Sync:** Merapikan ID di Web.
3.  Cek Terminal 1 (Web Server), Anda akan melihat log seperti:
    -   `[SYNC] Initial Sync Queued...`
    -   `[SYNC] Synchronizing remote sequence IDs...`

**SELESAI.**
Sekarang data di Web dan Desktop sudah identik.
- Input data baru di Desktop -> Muncul di Web (3 detik).
- Input data baru di Web -> Muncul di Desktop (3 detik).
