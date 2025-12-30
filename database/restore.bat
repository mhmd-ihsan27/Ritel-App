@echo off
REM ============================================
REM PostgreSQL Database Restore Script (Windows)
REM ============================================
REM Restores database from a backup file
REM
REM Usage:
REM   database\restore.bat <backup_file>
REM
REM Example:
REM   database\restore.bat database\backups\ritel_db_20250101_120000.sql
REM ============================================

setlocal

REM Configuration
set DB_NAME=ritel_db
set DB_USER=ritel
set DB_HOST=localhost
set DB_PORT=5432
set PGPASSWORD=ritel

REM Check if backup file is provided
if "%~1"=="" (
    echo Error: No backup file specified
    echo.
    echo Usage: %0 ^<backup_file^>
    echo.
    echo Available backups:
    dir /b /o-d "database\backups\*.sql" 2>nul
    echo.
    pause
    exit /b 1
)

set BACKUP_FILE=%~1

REM Check if file exists
if not exist "%BACKUP_FILE%" (
    echo Error: Backup file not found: %BACKUP_FILE%
    pause
    exit /b 1
)

echo ========================================
echo WARNING: Database Restore
echo ========================================
echo.
echo This will DROP and recreate the database!
echo All current data will be LOST!
echo.
echo Database: %DB_NAME%
echo User:     %DB_USER%
echo Host:     %DB_HOST%
echo Port:     %DB_PORT%
echo.
echo Restore from: %BACKUP_FILE%
echo.

REM Confirm action
set /p CONFIRM="Are you sure you want to continue? (YES/no): "
if /i not "%CONFIRM%"=="YES" (
    echo Restore cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo Starting restore process...
echo ========================================
echo.

REM Step 1: Create safety backup
echo Step 1: Creating safety backup...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "SAFETY_BACKUP=database\backups\pre_restore_%DB_NAME%_%TIMESTAMP%.sql"

pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -f "%SAFETY_BACKUP%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Safety backup created: %SAFETY_BACKUP%
) else (
    echo Warning: Could not create safety backup
)
echo.

REM Step 2: Drop existing database
echo Step 2: Dropping existing database...
psql -h %DB_HOST% -p %DB_PORT% -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul
echo Database dropped
echo.

REM Step 3: Create new database
echo Step 3: Creating new database...
psql -h %DB_HOST% -p %DB_PORT% -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Database created
) else (
    echo Failed to create database
    pause
    exit /b 1
)
echo.

REM Step 4: Restore from backup
echo Step 4: Restoring from backup...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Restore completed successfully!
    echo ========================================
    echo.

    REM Verify restoration
    echo Verifying restoration...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

    echo.
    echo Database statistics:
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 'produk' as table_name, COUNT(*) as count FROM produk UNION ALL SELECT 'transaksi', COUNT(*) FROM transaksi UNION ALL SELECT 'pelanggan', COUNT(*) FROM pelanggan UNION ALL SELECT 'promo', COUNT(*) FROM promo;"

) else (
    echo.
    echo ========================================
    echo Restore failed!
    echo ========================================
    echo.
    echo You can restore from safety backup:
    echo   %SAFETY_BACKUP%
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Restore process completed!
echo ========================================
pause
