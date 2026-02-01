#!/bin/bash
# Safe deployment script for ClawJoke
# ⚠️  CRITICAL: NEVER use -v or --volumes flags - this will DELETE all data!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backend/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 ClawJoke Safe Deployment"
echo "=========================="

# ========== STEP 1: BACKUP FROM DOCKER VOLUME FIRST ==========
echo ""
echo "📦 Step 1: Backing up database from Docker volume..."

BACKUP_FILE="$BACKUP_DIR/data.db.$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Get container ID
CONTAINER_ID=$(docker ps -q --filter "name=clawjoke-backend-1" 2>/dev/null || echo "")

if [ -n "$CONTAINER_ID" ]; then
    # Copy database from container (which is mounted from the volume)
    docker cp "$CONTAINER_ID:/app/backend/data/data.db" "$BACKUP_FILE" 2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        JOKES=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM jokes;" 2>/dev/null || echo "0")
        echo "   ✅ Backup saved: $BACKUP_FILE"
        echo "   📊 Jokes backed up: $JOKES"
        cp "$BACKUP_FILE" /root/backup_latest.db
        echo "   ✅ Also saved to /root/backup_latest.db"
    else
        echo "   ⚠️  Could not backup (database may be empty or not mounted)"
    fi
else
    echo "   ⚠️  Container not running, skipping backup"
fi

# ========== STEP 2: CHECK CURRENT DATA ==========
echo ""
echo "🔍 Step 2: Checking current data..."

if docker volume ls -q | grep -q "clawjoke_backend_data"; then
    echo "   ✅ Volume 'clawjoke_backend_data' exists"
else
    echo "   ⚠️  Volume does not exist, will be created on start"
fi

# ========== STEP 3: PULL CODE ==========
echo ""
echo "📥 Step 3: Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main

# ========== STEP 4: DEPLOY (NEVER delete volumes!) ==========
echo ""
echo "🚀 Step 4: Deploying..."
echo "   ⚠️  IMPORTANT: Using --remove-orphans ONLY (NOT -v or --volumes)"

# NEVER use: docker compose down -v
# NEVER use: docker compose down --volumes
# This preserves the volume!
docker compose down --remove-orphans

# Start services - the volume will be automatically mounted
docker compose up -d --build

# ========== STEP 5: VERIFY ==========
echo ""
echo "✅ Step 5: Verifying deployment..."
sleep 5

# Check services
BACKEND_RUNNING=$(docker ps --format '{{.Names}}' | grep -q "clawjoke-backend" && echo "yes" || echo "no")
FRONTEND_RUNNING=$(docker ps --format '{{.Names}}' | grep -q "clawjoke-frontend" && echo "yes" || echo "no")

if [ "$BACKEND_RUNNING" = "yes" ] && [ "$FRONTEND_RUNNING" = "yes" ]; then
    echo "   ✅ All services running"
else
    echo "   ❌ Some services failed"
    docker compose logs
fi

# Check data
JOKES_AFTER=$(curl -s https://clawjoke.com/api/jokes?limit=1 2>/dev/null | grep -o '"id"' | wc -l || echo "0")
echo "   📊 Jokes visible: $JOKES_AFTER"

echo ""
echo "=========================="
echo "🎉 Deployment complete!"
echo ""
echo "💡 Data is stored in Docker volume 'clawjoke_backend_data'"
echo ""
echo "🛑 NEVER run these commands (they DELETE all data):"
echo "   docker compose down -v"
echo "   docker compose down --volumes"
echo "   docker volume rm clawjoke_backend_data"
echo ""
echo "💡 Safe rollback:"
echo "   1. Check backups: ls $BACKUP_DIR"
echo "   2. Copy backup: cp $BACKUP_DIR/data.db.YYYYMMDD_HHMMSS backend/data/data.db"
echo "   3. Restart: docker restart clawjoke-backend-1"
