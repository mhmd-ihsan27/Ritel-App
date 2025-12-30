#!/bin/bash

# ============================================
# PostgreSQL Database Backup Script
# ============================================
# Creates a timestamped backup of the database
#
# Usage:
#   ./database/backup.sh
#
# The backup will be saved to:
#   database/backups/ritel_db_YYYYMMDD_HHMMSS.sql
# ============================================

# Configuration
DB_NAME="ritel_db"
DB_USER="ritel"
DB_HOST="localhost"
DB_PORT="5432"

# Create backups directory if it doesn't exist
BACKUP_DIR="database/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}PostgreSQL Database Backup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Database: ${GREEN}$DB_NAME${NC}"
echo -e "User:     ${GREEN}$DB_USER${NC}"
echo -e "Host:     ${GREEN}$DB_HOST${NC}"
echo -e "Port:     ${GREEN}$DB_PORT${NC}"
echo ""
echo -e "Backup file: ${GREEN}$BACKUP_FILE${NC}"
echo ""

# Perform backup
echo -e "${BLUE}Creating backup...${NC}"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Get file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Backup created successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "File: $BACKUP_FILE"
    echo -e "Size: $FILE_SIZE"
    echo ""

    # Cleanup old backups (keep last 10)
    echo -e "${BLUE}Cleaning up old backups...${NC}"
    ls -t "$BACKUP_DIR"/*.sql | tail -n +11 | xargs -r rm

    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ Kept last $BACKUP_COUNT backups${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ Backup failed!${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "Please check your database connection settings."
    echo ""
    exit 1
fi

# Optional: Compress the backup
read -p "Compress backup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Compressing backup...${NC}"
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup compressed: ${BACKUP_FILE}.gz${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Backup process completed!${NC}"
echo -e "${BLUE}========================================${NC}"
