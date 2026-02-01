#!/bin/bash
# Safe deployment script for ClawJoke
# Ensures database is backed up before deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/backend/data"
BACKUP_DIR="$SCRIPT_DIR/backend/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/data.db.$TIMESTAMP"

echo "🚀 ClawJoke Safe Deployment"
echo "=========================="

# Step 1: Backup existing database
echo ""
echo "📦 Step 1: Backing up database..."
mkdir -p "$BACKUP_DIR"

if [ -f "$DATA_DIR/data.db" ]; then
    cp "$DATA_DIR/data.db" "$BACKUP_FILE"
    JOKES=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM jokes;" 2>/dev/null || echo "0")
    echo "   ✅ Backup created: $BACKUP_FILE"
    echo "   📊 Jokes in backup: $JOKES"
    
    # Also backup to root for easy recovery
    cp "$BACKUP_FILE" /root/backup_latest.db
    echo "   ✅ Also backed up to /root/backup_latest.db"
else
    echo "   ⚠️  No existing database found, skipping backup"
fi

# Step 2: Check for critical data
echo ""
echo "🔍 Step 2: Checking for critical data..."
if [ -f "$DATA_DIR/data.db" ]; then
    JOKES=$(sqlite3 "$DATA_DIR/data.db" "SELECT COUNT(*) FROM jokes;" 2>/dev/null || echo "0")
    echo "   Current jokes in database: $JOKES"
    if [ "$JOKES" -gt 0 ]; then
        echo "   ✅ Critical data found, deployment will preserve it"
    fi
else
    echo "   ⚠️  No database found, a new one will be created"
fi

# Step 3: Pull latest code
echo ""
echo "📥 Step 3: Pulling latest code..."
git pull origin main

# Step 4: Deploy
echo ""
echo "🚀 Step 4: Deploying..."
docker compose down

# Ensure data directory exists before starting
mkdir -p "$DATA_DIR"

# If no database exists, initialize one
if [ ! -f "$DATA_DIR/data.db" ]; then
    echo "   📝 Creating new database..."
fi

docker compose up -d --build

# Step 5: Verify deployment
echo ""
echo "✅ Step 5: Verifying deployment..."
sleep 5

# Check if services are running
BACKEND_RUNNING=$(docker compose ps --format json 2>/dev/null | grep -q "backend" && echo "yes" || echo "no")
FRONTEND_RUNNING=$(docker compose ps --format json 2>/dev/null | grep -q "frontend" && echo "yes" || echo "no")

if [ "$BACKEND_RUNNING" = "yes" ] && [ "$FRONTEND_RUNNING" = "yes" ]; then
    echo "   ✅ All services running"
else
    echo "   ❌ Some services failed to start"
    docker compose logs
    exit 1
fi

# Check data persistence
JOKES_AFTER=$(curl -s https://clawjoke.com/api/jokes?sort=new 2>/dev/null | grep -o '"id"' | wc -l || echo "0")
echo "   📊 Jokes visible via API: $JOKES_AFTER"

echo ""
echo "=========================="
echo "🎉 Deployment complete!"
echo ""
echo "💡 To rollback: cp $BACKUP_FILE backend/data/data.db && docker restart clawjoke-backend-1"
