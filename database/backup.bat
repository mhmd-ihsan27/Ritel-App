@echo off
REM ============================================
REM PostgreSQL Database Backup Script (Windows)
REM ============================================
REM Creates a timestamped backup of the database
REM
REM Usage:
REM   database\backup.bat
REM
REM The backup will be saved to:
REM   database\backups\ritel_db_YYYYMMDD_HHMMSS.sql
REM ============================================

setlocal

REM Configuration
set DB_NAME=ritel_db
set DB_USER=ritel
set DB_HOST=localhost
set DB_PORT=5432
set PGPASSWORD=ritel

REM Create backups directory
if not exist "database\backups" mkdir "database\backups"

REM Generate timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "BACKUP_FILE=database\backups\%DB_NAME%_%TIMESTAMP%.sql"

echo ========================================
echo PostgreSQL Database Backup
echo ========================================
echo.
echo Database: %DB_NAME%
echo User:     %DB_USER%
echo Host:     %DB_HOST%
echo Port:     %DB_PORT%
echo.
echo Backup file: %BACKUP_FILE%
echo.

REM Perform backup
echo Creating backup...
pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Backup created successfully!
    echo ========================================
    echo File: %BACKUP_FILE%
    echo.

    REM Count backups
    for /f %%A in ('dir /b "database\backups\*.sql" 2^>nul ^| find /c /v ""') do set COUNT=%%A
    echo Total backups: %COUNT%

    REM Optional cleanup (keep last 10)
    echo.
    echo Keeping last 10 backups...
    for /f "skip=10 delims=" %%F in ('dir /b /o-d "database\backups\*.sql" 2^>nul') do (
        del "database\backups\%%F"
        echo Deleted old backup: %%F
    )
) else (
    echo.
    echo ========================================
    echo Backup failed!
    echo ========================================
    echo Please check your database connection.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Backup process completed!
echo ========================================
pause
