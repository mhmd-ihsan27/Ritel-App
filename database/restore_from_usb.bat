@echo off
REM ============================================
REM Script untuk restore database SQLite dari USB
REM ============================================
REM Pastikan aplikasi ditutup sebelum menjalankan script ini!
REM ============================================

setlocal

echo ========================================
echo Restore Database Ritel-App dari USB
echo ========================================
echo.

REM Lokasi database di PC
set "DB_DEST=%USERPROFILE%\ritel-app\ritel.db"
set "DB_DIR=%USERPROFILE%\ritel-app"
set "BACKUP_DIR=%USERPROFILE%\ritel-app\backups"

REM Buat folder jika belum ada
if not exist "%DB_DIR%" mkdir "%DB_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Minta lokasi file backup di USB
echo Contoh path file: E:\ritel-app-backup\ritel_20260110_120000.db
set /p "BACKUP_FILE=Masukkan path lengkap file backup di USB: "

REM Validasi file backup
if not exist "%BACKUP_FILE%" (
    echo Error: File backup tidak ditemukan: %BACKUP_FILE%
    pause
    exit /b 1
)

REM Check ukuran file backup
for %%A in ("%BACKUP_FILE%") do set "BACKUP_SIZE=%%~zA"
echo.
echo File backup ditemukan: %BACKUP_FILE%
echo Ukuran: %BACKUP_SIZE% bytes
echo.

REM Validasi bahwa file adalah SQLite database
REM SQLite database harus dimulai dengan "SQLite format 3"
echo Memvalidasi file database SQLite...

REM Baca 16 byte pertama (header SQLite)
powershell -Command "$bytes = Get-Content -Path '%BACKUP_FILE%' -Encoding Byte -TotalCount 16; $header = [System.Text.Encoding]::ASCII.GetString($bytes); if ($header.StartsWith('SQLite format 3')) { exit 0 } else { exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: FILE BUKAN DATABASE SQLITE!
    echo ========================================
    echo.
    echo File yang Anda pilih bukan database SQLite yang valid.
    echo.
    echo Kemungkinan penyebab:
    echo 1. File corrupt saat transfer
    echo 2. File yang salah
    echo 3. File terkompresi/terenkripsi
    echo.
    echo Solusi:
    echo - Copy ulang file dari device sumber
    echo - Pastikan menggunakan "Safely Remove USB" saat copy
    echo - Jangan menggunakan file yang di-zip/compress
    echo.
    pause
    exit /b 1
)

echo ✓ File adalah database SQLite yang valid
echo.

REM Backup database lama jika ada
if exist "%DB_DEST%" (
    echo Database lama ditemukan. Membuat safety backup...
    
    for /f "tokens=2 delims==." %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
    set "SAFETY_BACKUP=%BACKUP_DIR%\ritel_before_restore_%TIMESTAMP%.db"
    
    copy /Y "%DB_DEST%" "%SAFETY_BACKUP%"
    
    if %ERRORLEVEL% EQU 0 (
        echo ✓ Safety backup dibuat: %SAFETY_BACKUP%
    ) else (
        echo ⚠ Warning: Gagal membuat safety backup
        set /p "CONTINUE=Lanjutkan tanpa backup? (YES/no): "
        if /i not "%CONTINUE%"=="YES" (
            echo Restore dibatalkan
            pause
            exit /b 0
        )
    )
)

echo.
echo ========================================
echo WARNING!
echo ========================================
echo.
echo Database lama akan di-REPLACE dengan database dari USB
echo.

set /p "CONFIRM=Apakah Anda yakin? (YES/no): "
if /i not "%CONFIRM%"=="YES" (
    echo Restore dibatalkan
    pause
    exit /b 0
)

echo.
echo ========================================
echo Memulai restore...
echo ========================================
echo.

REM Copy file
copy /Y "%BACKUP_FILE%" "%DB_DEST%"

if %ERRORLEVEL% EQU 0 (
    echo ✓ File copied
    
    REM Verify copied file size
    for %%A in ("%DB_DEST%") do set "DEST_SIZE=%%~zA"
    
    echo.
    echo Verifikasi ukuran file:
    echo - Backup:  %BACKUP_SIZE% bytes
    echo - Restored: %DEST_SIZE% bytes
    
    if "%BACKUP_SIZE%"=="%DEST_SIZE%" (
        echo.
        echo ========================================
        echo ✓ RESTORE BERHASIL!
        echo ========================================
        echo.
        echo Database berhasil di-restore ke: %DB_DEST%
        echo.
        echo Silakan jalankan aplikasi Ritel-App
    ) else (
        echo.
        echo ========================================
        echo ⚠ WARNING: Ukuran file tidak sama!
        echo ========================================
        echo.
        echo File mungkin corrupt. Restore gagal.
        echo.
        echo Mengembalikan database lama...
        
        if exist "%SAFETY_BACKUP%" (
            copy /Y "%SAFETY_BACKUP%" "%DB_DEST%"
            echo Database lama dikembalikan
        )
    )
) else (
    echo.
    echo ========================================
    echo ERROR: Restore gagal!
    echo ========================================
)

echo.
pause
