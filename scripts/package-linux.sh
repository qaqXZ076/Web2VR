#!/usr/bin/env bash
# ============================================================================
# Package WebXR VR Video Player for Linux (x86_64)
# Produces a portable, no-install archive: dist/webxr-vr-player-linux-x64.tar.gz
#
# Prerequisites on the build machine:
#   - Node.js >= 18 (for next build)
#   - bun (for dependency install)
#   - curl
#
# Usage:
#   bash scripts/package-linux.sh
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_NAME="webxr-vr-player"
VERSION="$(node -p "require('$PROJECT_DIR/package.json').version" 2>/dev/null || echo '0.2.0')"
NODE_VERSION="v22.16.0"
NODE_PLATFORM="linux-x64"
DIST_DIR="$PROJECT_DIR/dist"
STAGE_DIR="$DIST_DIR/$APP_NAME"
ARCHIVE_NAME="${APP_NAME}-linux-x64-v${VERSION}.tar.gz"

echo "============================================"
echo " Packaging $APP_NAME v$VERSION for Linux x86_64"
echo "============================================"

# ---- 1. Build the Next.js standalone output ----
echo ""
echo "[1/6] Installing dependencies..."
cd "$PROJECT_DIR"
bun install

echo "[2/6] Running Next.js production build..."
bun run build

# ---- 2. Download Node.js runtime ----
NODE_TAR="node-${NODE_VERSION}-${NODE_PLATFORM}.tar.xz"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/${NODE_TAR}"
NODE_CACHE="$DIST_DIR/.cache"

mkdir -p "$NODE_CACHE"

if [ ! -f "$NODE_CACHE/$NODE_TAR" ]; then
  echo "[3/6] Downloading Node.js ${NODE_VERSION} (${NODE_PLATFORM})..."
  curl -fSL -o "$NODE_CACHE/$NODE_TAR" "$NODE_URL"
else
  echo "[3/6] Using cached Node.js ${NODE_VERSION}..."
fi

# ---- 3. Prepare staging directory ----
echo "[4/6] Preparing staging directory..."
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

# Extract Node.js into staging (only the node binary)
mkdir -p "$STAGE_DIR/node-runtime"
tar xf "$NODE_CACHE/$NODE_TAR" -C "$STAGE_DIR/node-runtime" --strip-components=1

# Copy standalone build output
cp -r "$PROJECT_DIR/.next/standalone" "$STAGE_DIR/app"

# Copy static files and public assets
cp -r "$PROJECT_DIR/.next/static" "$STAGE_DIR/app/.next/static"
if [ -d "$PROJECT_DIR/public" ]; then
  cp -r "$PROJECT_DIR/public" "$STAGE_DIR/app/public"
fi

# Copy Prisma files (if using database)
if [ -d "$PROJECT_DIR/node_modules/.prisma" ]; then
  mkdir -p "$STAGE_DIR/app/node_modules/.prisma"
  cp -r "$PROJECT_DIR/node_modules/.prisma"/* "$STAGE_DIR/app/node_modules/.prisma/"
fi
if [ -f "$PROJECT_DIR/prisma/schema.prisma" ]; then
  mkdir -p "$STAGE_DIR/app/prisma"
  cp "$PROJECT_DIR/prisma/schema.prisma" "$STAGE_DIR/app/prisma/"
fi
if [ -f "$PROJECT_DIR/db/custom.db" ]; then
  mkdir -p "$STAGE_DIR/app/db"
  cp "$PROJECT_DIR/db/custom.db" "$STAGE_DIR/app/db/"
fi

# ---- 4. Create launcher script ----
echo "[5/6] Creating launcher script..."
cat > "$STAGE_DIR/start.sh" << 'LAUNCHER'
#!/usr/bin/env bash
# WebXR VR Video Player - Linux Launcher
# Starts the server on port 3000 and opens the browser.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$SCRIPT_DIR/node-runtime/bin/node"
SERVER="$SCRIPT_DIR/app/server.js"

# Allow custom port via env var
PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

echo "============================================"
echo " WebXR VR Video Player"
echo " Starting on http://localhost:$PORT"
echo "============================================"
echo ""

export HOSTNAME="$HOST"
export PORT

# Start the server
exec "$NODE" "$SERVER"
LAUNCHER
chmod +x "$STAGE_DIR/start.sh"

# ---- 5. Create archive ----
echo "[6/6] Creating archive: $ARCHIVE_NAME"
cd "$DIST_DIR"
tar czf "$ARCHIVE_NAME" "$APP_NAME"

ARCHIVE_PATH="$DIST_DIR/$ARCHIVE_NAME"
ARCHIVE_SIZE="$(du -h "$ARCHIVE_PATH" | cut -f1)"

echo ""
echo "============================================"
echo " ✅ Package complete!"
echo "============================================"
echo ""
echo " Archive: $ARCHIVE_PATH"
echo " Size:    $ARCHIVE_SIZE"
echo ""
echo " To run on the target machine:"
echo "   tar xzf $ARCHIVE_NAME"
echo "   cd $APP_NAME"
echo "   ./start.sh"
echo "   → Open http://localhost:3000 in Chrome/Edge"
echo ""
