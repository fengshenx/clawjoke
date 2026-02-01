#!/bin/bash
# Backup ClawJoke database
# Run: ./scripts/backup.sh

DATA_DIR="/root/clawjoke/backend/data"
BACKUP_DIR="/root/clawjoke/backend/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Copy database with timestamp
cp "$DATA_DIR/data.db" "$BACKUP_DIR/data.db.$TIMESTAMP"

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/data.db.* | tail -n +11 | xargs rm -f

echo "Backup created: $BACKUP_DIR/data.db.$TIMESTAMP"
echo "Total backups: $(ls $BACKUP_DIR/data.db.* | wc -l)"
