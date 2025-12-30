#!/bin/bash

# ============================================
# Database Setup Script (Linux/Mac)
# ============================================
# Makes all scripts executable and creates
# necessary directories
# ============================================

echo "=========================================="
echo "Database Setup"
echo "=========================================="
echo ""

# Create backups directory
echo "Creating backups directory..."
mkdir -p database/backups
echo "✓ Created: database/backups/"
echo ""

# Make scripts executable
echo "Making scripts executable..."
chmod +x database/backup.sh
echo "✓ database/backup.sh"

chmod +x database/restore.sh
echo "✓ database/restore.sh"

chmod +x database/setup.sh
echo "✓ database/setup.sh"
echo ""

echo "=========================================="
echo "✓ Setup complete!"
echo "=========================================="
echo ""
echo "You can now:"
echo "  - Run backups: ./database/backup.sh"
echo "  - Run restore: ./database/restore.sh <backup_file>"
echo ""
