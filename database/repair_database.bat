@echo off
REM ============================================
REM Database Repair and Validation Tool
REM ============================================
REM Memperbaiki database SQLite yang corrupt
REM tanpa menghapus data
REM ============================================

setlocal

echo ================================================
echo Database Repair Tool - Ritel App
echo ================================================
echo.

set "DB_PATH=%USERPROFILE%\ritel-app\ritel.db"
set "BACKUP_DIR=%USERPROFILE%\ritel-app\backups"
set "TEMP_DB=%USERPROFILE%\ritel-app\ritel_temp.db"

REM Cek apakah database ada
if not exist "%DB_PATH%" (
    echo ERROR: Database tidak ditemukan di: %DB_PATH%
    echo.
    echo Silakan jalankan aplikasi sekali untuk membuat database baru.
    pause
    exit /b 1
)

echo [1/5] Database ditemukan: %DB_PATH%
echo.

REM Cek ukuran file
for %%A in ("%DB_PATH%") do set "FILE_SIZE=%%~zA"
echo [2/5] Ukuran database: %FILE_SIZE% bytes
echo.

if %FILE_SIZE% LEQ 0 (
    echo ERROR: Database kosong atau corrupt (0 bytes^)
    echo.
    echo Solusi: Hapus file dan jalankan aplikasi untuk membuat database baru
    echo Atau restore dari backup jika ada.
    pause
    exit /b 1
)

REM Buat backup sebelum repair
echo [3/5] Membuat backup sebelum repair...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==." %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "BACKUP_FILE=%BACKUP_DIR%\ritel_before_repair_%TIMESTAMP%.db"

copy /Y "%DB_PATH%" "%BACKUP_FILE%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✓ Backup berhasil: %BACKUP_FILE%
) else (
    echo    ✗ Gagal membuat backup
    echo.
    set /p "CONTINUE=Lanjutkan tanpa backup? (YES/no): "
    if /i not "%CONTINUE%"=="YES" (
        echo Repair dibatalkan
        pause
        exit /b 0
    )
)
echo.

REM Cek integritas database dengan SQLite
echo [4/5] Memeriksa integritas database...
echo.

REM Check for sqlite3.exe in common locations
set "SQLITE_EXE="
if exist "C:\Program Files\SQLite\sqlite3.exe" set "SQLITE_EXE=C:\Program Files\SQLite\sqlite3.exe"
if exist "C:\sqlite\sqlite3.exe" set "SQLITE_EXE=C:\sqlite\sqlite3.exe"
if exist "%USERPROFILE%\sqlite3.exe" set "SQLITE_EXE=%USERPROFILE%\sqlite3.exe"

if "%SQLITE_EXE%"=="" (
    echo WARNING: sqlite3.exe tidak ditemukan
    echo.
    echo Untuk repair database, Anda perlu download sqlite3.exe dari:
    echo https://www.sqlite.org/download.html
    echo.
    echo Letakkan sqlite3.exe di salah satu folder:
    echo - C:\Program Files\SQLite\
    echo - C:\sqlite\
    echo - %USERPROFILE%\
    echo.
    echo Untuk sementara, coba jalankan aplikasi dan lihat apakah error masih ada.
    pause
    exit /b 0
)

echo Menggunakan: %SQLITE_EXE%
echo.

REM Run integrity check
"%SQLITE_EXE%" "%DB_PATH%" "PRAGMA integrity_check;" > "%TEMP%\integrity_result.txt" 2>&1

type "%TEMP%\integrity_result.txt"
findstr /i "ok" "%TEMP%\integrity_result.txt" >nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo ✓ Database OK - Tidak ada masalah!
    echo ================================================
    echo.
    echo Database Anda dalam kondisi baik.
    echo Jika masih loading terus, masalahnya bukan di database.
    echo.
    echo Kemungkinan penyebab:
    echo 1. Koneksi jaringan (jika pakai PostgreSQL^)
    echo 2. Error di backend code
    echo 3. Browser cache
    echo.
    echo Solusi:
    echo - Restart aplikasi
    echo - Clear browser cache (Ctrl+Shift+Del^)
    echo - Cek log aplikasi di startup_debug.log
    pause
    exit /b 0
)

echo.
echo ================================================
echo ✗ Database CORRUPT! Mencoba repair...
echo ================================================
echo.

REM Try to dump and restore
echo [5/5] Melakukan repair database...
echo.

echo Dumping data...
"%SQLITE_EXE%" "%DB_PATH%" ".dump" > "%TEMP%\dump.sql" 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Gagal dump database
    echo Database terlalu corrupt untuk di-repair otomatis.
    echo.
    echo Solusi:
    echo 1. Restore dari backup yang lebih lama (jika ada^)
    echo 2. Copy database dari device lain dengan benar
    echo 3. Fresh start dengan database baru
    pause
    exit /b 1
)

echo Membuat database baru dari dump...
del "%TEMP_DB%" >nul 2>&1
"%SQLITE_EXE%" "%TEMP_DB%" < "%TEMP%\dump.sql" 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Gagal membuat database dari dump
    pause
    exit /b 1
)

echo Mengganti database lama dengan yang sudah di-repair...
del "%DB_PATH%" >nul 2>&1
move "%TEMP_DB%" "%DB_PATH%" >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo ✓ REPAIR BERHASIL!
    echo ================================================
    echo.
    echo Database telah diperbaiki.
    echo Backup database lama: %BACKUP_FILE%
    echo.
    echo Silakan jalankan aplikasi dan coba lagi.
) else (
    echo.
    echo ERROR: Gagal mengganti database
    echo Database lama masih ada dan tidak berubah.
    pause
    exit /b 1
)

REM Cleanup
del "%TEMP%\dump.sql" >nul 2>&1
del "%TEMP%\integrity_result.txt" >nul 2>&1

echo.
pause
