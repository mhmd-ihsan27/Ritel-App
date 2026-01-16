@echo off
REM ============================================
REM Script untuk copy database SQLite ke USB
REM ============================================
REM Pastikan aplikasi ditutup sebelum menjalankan script ini!
REM ============================================

setlocal

echo ========================================
echo Copy Database Ritel-App ke USB
echo ========================================
echo.

REM Lokasi database di PC
set "DB_SOURCE=%USERPROFILE%\ritel-app\ritel.db"

REM Cek apakah database ada
if not exist "%DB_SOURCE%" (
    echo Error: Database tidak ditemukan di: %DB_SOURCE%
    echo.
    echo Pastikan aplikasi sudah pernah dijalankan minimal 1x
    pause
    exit /b 1
)

REM Minta lokasi USB
echo Database ditemukan di: %DB_SOURCE%
echo.
echo Contoh path USB: E:\ atau F:\
set /p "USB_PATH=Masukkan path USB drive (contoh: E:\): "

REM Validasi path USB
if not exist "%USB_PATH%" (
    echo Error: Path USB tidak valid: %USB_PATH%
    pause
    exit /b 1
)

REM Buat folder di USB
set "BACKUP_FOLDER=%USB_PATH%ritel-app-backup"
if not exist "%BACKUP_FOLDER%" mkdir "%BACKUP_FOLDER%"

REM Generate timestamp
for /f "tokens=2 delims==." %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "BACKUP_FILE=%BACKUP_FOLDER%\ritel_%TIMESTAMP%.db"

echo.
echo ========================================
echo Memulai copy database...
echo ========================================
echo.
echo Dari: %DB_SOURCE%
echo Ke:   %BACKUP_FILE%
echo.

REM Check ukuran file
for %%A in ("%DB_SOURCE%") do set "FILE_SIZE=%%~zA"
echo Ukuran database: %FILE_SIZE% bytes
echo.

REM Copy file
copy /Y "%DB_SOURCE%" "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BERHASIL!
    echo ========================================
    echo.
    
    REM Verify copied file size
    for %%A in ("%BACKUP_FILE%") do set "COPIED_SIZE=%%~zA"
    
    echo Verifikasi ukuran file:
    echo - Original: %FILE_SIZE% bytes
    echo - Copy:     %COPIED_SIZE% bytes
    
    if "%FILE_SIZE%"=="%COPIED_SIZE%" (
        echo.
        echo ✓ Ukuran file cocok - copy berhasil!
        echo.
        echo File backup tersimpan di: %BACKUP_FILE%
        echo.
        echo CATATAN: Jangan cabut USB sebelum "Safely Remove" dari Windows
    ) else (
        echo.
        echo ⚠ Warning: Ukuran file tidak sama!
        echo File mungkin corrupt. Coba copy ulang.
    )
) else (
    echo.
    echo ========================================
    echo GAGAL!
    echo ========================================
    echo Error saat copy file
)

echo.
pause
