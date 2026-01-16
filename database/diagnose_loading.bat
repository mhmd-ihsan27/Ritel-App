@echo off
REM ============================================
REM Database Loading Diagnostic Tool
REM ============================================
REM Cek kenapa manajemen stok loading terus
REM ============================================

setlocal enabledelayedexpansion

echo ================================================
echo Database Loading Diagnostic Tool
echo ================================================
echo.

set "DB_PATH=%USERPROFILE%\ritel-app\ritel.db"

REM Cek apakah database ada
if not exist "%DB_PATH%" (
    echo ERROR: Database tidak ditemukan di: %DB_PATH%
    echo.
    echo Database belum dibuat. Silakan jalankan aplikasi sekali.
    pause
    exit /b 1
)

echo [1] Database ditemukan: %DB_PATH%
echo.

REM Cek ukuran file
for %%A in ("%DB_PATH%") do set "FILE_SIZE=%%~zA"
echo [2] Ukuran database: %FILE_SIZE% bytes
echo.

if %FILE_SIZE% LEQ 0 (
    echo ERROR: Database kosong atau corrupt (0 bytes^)
    echo.
    echo Solusi: Hapus file dan jalankan aplikasi untuk membuat database baru
    pause
    exit /b 1
)

REM Cek apakah SQLite3 tersedia
set "SQLITE_EXE="
if exist "C:\Program Files\SQLite\sqlite3.exe" set "SQLITE_EXE=C:\Program Files\SQLite\sqlite3.exe"
if exist "C:\sqlite\sqlite3.exe" set "SQLITE_EXE=C:\sqlite\sqlite3.exe"
if exist "%USERPROFILE%\sqlite3.exe" set "SQLITE_EXE=%USERPROFILE%\sqlite3.exe"
if exist "%CD%\sqlite3.exe" set "SQLITE_EXE=%CD%\sqlite3.exe"

if "%SQLITE_EXE%"=="" (
    echo [3] sqlite3.exe tidak ditemukan
    echo.
    echo Menggunakan metode alternatif...
    echo.
    goto :app_diagnostic
)

echo [3] SQLite3 ditemukan: %SQLITE_EXE%
echo.

REM Cek integrity database
echo [4] Memeriksa integritas database...
echo.
"%SQLITE_EXE%" "%DB_PATH%" "PRAGMA integrity_check;" > "%TEMP%\db_check.txt" 2>&1
type "%TEMP%\db_check.txt"

findstr /i "ok" "%TEMP%\db_check.txt" >nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ WARNING: Database mungkin corrupt!
    echo.
    goto :app_diagnostic
)

echo.
echo ✓ Database integrity: OK
echo.

REM Cek jumlah data
echo [5] Statistik database:
echo.
"%SQLITE_EXE%" "%DB_PATH%" "SELECT 'Transaksi: ' || COUNT(*) FROM transaksi; SELECT 'Batch: ' || COUNT(*) FROM batch; SELECT 'Produk: ' || COUNT(*) FROM produk;" 2>&1

echo.
echo [6] Sample data batch (cek timezone):
echo.
"%SQLITE_EXE%" "%DB_PATH%" "SELECT id, produk_id, tanggal_restok, tanggal_kadaluarsa, created_at FROM batch ORDER BY created_at DESC LIMIT 3;" 2>&1

echo.
echo [7] Sample data transaksi (cek timezone):
echo.
"%SQLITE_EXE%" "%DB_PATH%" "SELECT id, nomor_transaksi, tanggal, created_at FROM transaksi ORDER BY created_at DESC LIMIT 3;" 2>&1

echo.
echo ================================================
echo DIAGNOSTIC SELESAI
echo ================================================
echo.
echo Jika semua terlihat OK tapi masih loading:
echo 1. Masalahnya bukan di database
echo 2. Buka aplikasi dan tekan F12
echo 3. Cek tab Console untuk error JavaScript
echo 4. Screenshot dan kirim error-nya
echo.
goto :end

:app_diagnostic
echo ================================================
echo Diagnostic via Aplikasi
echo ================================================
echo.
echo Karena sqlite3.exe tidak tersedia, lakukan ini:
echo.
echo 1. Jalankan aplikasi Ritel-App
echo 2. Buka DevTools (tekan F12)
echo 3. Pilih tab "Console"
echo 4. Buka menu "Manajemen Stok"
echo 5. Lihat pesan log yang muncul:
echo    - [BATCH SERVICE] GetAllBatches called
echo    - [BATCH REPO] Executing query...
echo    - [BATCH REPO] ✅ success atau ❌ ERROR
echo.
echo 6. Screenshot error yang muncul (jika ada)
echo 7. Kirim screenshot tersebut untuk analisa
echo.

:end
echo ================================================
del "%TEMP%\db_check.txt" >nul 2>&1
pause
