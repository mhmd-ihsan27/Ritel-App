#!/bin/bash

# ============================================
# PostgreSQL Database Restore Script
# ============================================
# Restores database from a backup file
#
# Usage:
#   ./database/restore.sh <backup_file>
#
# Example:
#   ./database/restore.sh database/backups/ritel_db_20250101_120000.sql
# ============================================

# Configuration
DB_NAME="ritel_db"
DB_USER="ritel"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lht database/backups/*.sql 2>/dev/null | head -10
    echo ""
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if it's a gzipped file
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${BLUE}Decompressing backup...${NC}"
    gunzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}⚠️  WARNING: Database Restore${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${RED}This will DROP and recreate the database!${NC}"
echo -e "${RED}All current data will be LOST!${NC}"
echo ""
echo -e "Database: ${GREEN}$DB_NAME${NC}"
echo -e "User:     ${GREEN}$DB_USER${NC}"
echo -e "Host:     ${GREEN}$DB_HOST${NC}"
echo -e "Port:     ${GREEN}$DB_PORT${NC}"
echo ""
echo -e "Restore from: ${GREEN}$BACKUP_FILE${NC}"
echo ""

# Confirm action
read -p "Are you sure you want to continue? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting restore process...${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Create a pre-restore backup
echo -e "${BLUE}Step 1: Creating safety backup...${NC}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SAFETY_BACKUP="database/backups/pre_restore_${DB_NAME}_${TIMESTAMP}.sql"
mkdir -p database/backups
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$SAFETY_BACKUP" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"
else
    echo -e "${YELLOW}⚠ Could not create safety backup (database might not exist)${NC}"
fi
echo ""

# Step 2: Drop existing database
echo -e "${BLUE}Step 2: Dropping existing database...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database dropped${NC}"
else
    echo -e "${YELLOW}⚠ Could not drop database (might not exist)${NC}"
fi
echo ""

# Step 3: Create new database
echo -e "${BLUE}Step 3: Creating new database...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${RED}✗ Failed to create database${NC}"
    exit 1
fi
echo ""

# Step 4: Restore from backup
echo -e "${BLUE}Step 4: Restoring from backup...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Restore completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # Verify restoration
    echo -e "${BLUE}Verifying restoration...${NC}"
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo -e "Tables restored: ${GREEN}$TABLE_COUNT${NC}"

    # Show some statistics
    echo ""
    echo -e "${BLUE}Database statistics:${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT
            'produk' as table_name, COUNT(*) as count FROM produk
        UNION ALL
        SELECT 'transaksi', COUNT(*) FROM transaksi
        UNION ALL
        SELECT 'pelanggan', COUNT(*) FROM pelanggan
        UNION ALL
        SELECT 'promo', COUNT(*) FROM promo;
    "

else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ Restore failed!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "You can restore from safety backup:"
    echo -e "  $SAFETY_BACKUP"
    echo ""
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Restore process completed!${NC}"
echo -e "${BLUE}========================================${NC}"
