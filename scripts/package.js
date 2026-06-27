#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// ============================================================================
// Package Web2VR — Cross-platform packager
//
// Produces portable, no-install archives:
//   - Linux x86_64:  dist/Web2VR-linux-x64-vX.Y.Z.tar.gz
//   - Windows x86_4: dist/Web2VR-win-x64-vX.Y.Z.zip
//   - macOS arm64:   dist/Web2VR-darwin-arm64-vX.Y.Z.tar.gz
//
// Usage:
//   node scripts/package.js                # package for current platform
//   node scripts/package.js --platform linux-x64
//   node scripts/package.js --platform win-x64
//   node scripts/package.js --platform darwin-arm64
//   node scripts/package.js --platform all
// ============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

// ---- Configuration ----
const NODE_VERSION = 'v22.16.0';
const APP_NAME = 'Web2VR';
const PROJECT_DIR = path.resolve(__dirname, '..');

// Read version from package.json
let VERSION = '1.0.0';
try {
  VERSION = require(path.join(PROJECT_DIR, 'package.json')).version;
} catch {}

// Platform definitions
const PLATFORMS = {
  'linux-x64': {
    nodeOs: 'linux',
    nodeArch: 'x64',
    ext: 'tar.gz',
    nodeExt: 'tar.xz',
    binaryName: 'node',
    launcherName: 'start.sh',
    createArchive: createTarGz,
  },
  'win-x64': {
    nodeOs: 'win',
    nodeArch: 'x64',
    ext: 'zip',
    nodeExt: 'zip',
    binaryName: 'node.exe',
    launcherName: 'start.bat',
    createArchive: createZip,
  },
  'darwin-arm64': {
    nodeOs: 'darwin',
    nodeArch: 'arm64',
    ext: 'tar.gz',
    nodeExt: 'tar.xz',
    binaryName: 'node',
    launcherName: 'start.sh',
    createArchive: createTarGz,
  },
  'darwin-x64': {
    nodeOs: 'darwin',
    nodeArch: 'x64',
    ext: 'tar.gz',
    nodeExt: 'tar.xz',
    binaryName: 'node',
    launcherName: 'start.sh',
    createArchive: createTarGz,
  },
};

// ---- Utilities ----
function run(cmd, opts = {}) {
  console.log(`  > ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: PROJECT_DIR, ...opts });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

async function download(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`  Using cached: ${path.basename(dest)}`);
    return;
  }
  console.log(`  Downloading: ${url}`);
  const tmpDest = dest + '.tmp';
  ensureDir(path.dirname(dest));

  await new Promise((resolve, reject) => {
    const file = createWriteStream(tmpDest);
    const doGet = (u) => {
      https.get(u, { headers: { 'User-Agent': 'node' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doGet(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    doGet(url);
  });

  fs.renameSync(tmpDest, dest);
}

// ---- Archive creation ----
function createTarGz(stageDir, archivePath, appName) {
  const distDir = path.dirname(archivePath);
  run(`tar czf "${archivePath}" -C "${distDir}" "${appName}"`);
}

function createZip(stageDir, archivePath, appName) {
  const distDir = path.dirname(archivePath);
  if (process.platform === 'win32') {
    run(`powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}' -DestinationPath '${archivePath}' -Force"`);
  } else {
    // Use zip on Linux/Mac
    run(`cd "${distDir}" && zip -rq "${archivePath}" "${appName}"`);
  }
}

// ---- Launcher creation ----
function createLauncher(stageDir, platform, platformKey) {
  const isWin = platform.nodeOs === 'win';

  if (isWin) {
    // .bat launcher
    const bat = `@echo off
REM Web2VR - Windows Launcher
setlocal

set "SCRIPT_DIR=%~dp0"
set "NODE=%SCRIPT_DIR%node-runtime\\node.exe"
set "SERVER=%SCRIPT_DIR%app\\server.js"

if "%PORT%"=="" set "PORT=3000"
if "%HOST%"=="" set "HOST=0.0.0.0"

echo ============================================
echo  Web2VR v${VERSION}
echo  Starting on http://localhost:%PORT%
echo ============================================
echo.

set HOSTNAME=%HOST%
"%NODE%" "%SERVER%"

pause
`;
    fs.writeFileSync(path.join(stageDir, 'start.bat'), bat);

    // .ps1 launcher
    const ps1 = `# Web2VR - PowerShell Launcher
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = Join-Path $ScriptDir 'node-runtime\\node.exe'
$Server = Join-Path $ScriptDir 'app\\server.js'

$env:PORT = if ($env:PORT) { $env:PORT } else { '3000' }
$env:HOSTNAME = if ($env:HOSTNAME) { $env:HOSTNAME } else { '0.0.0.0' }

Write-Host "============================================"
Write-Host " Web2VR v${VERSION}"
Write-Host " Starting on http://localhost:$env:PORT"
Write-Host "============================================"
Write-Host ""

& $Node $Server
`;
    fs.writeFileSync(path.join(stageDir, 'start.ps1'), ps1);

  } else {
    // Unix shell launcher
    const sh = `#!/usr/bin/env bash
# Web2VR - Launcher
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
NODE="$SCRIPT_DIR/node-runtime/bin/node"
SERVER="$SCRIPT_DIR/app/server.js"

PORT="\${PORT:-3000}"
HOST="\${HOST:-0.0.0.0}"

echo "============================================"
echo " Web2VR v${VERSION}"
echo " Starting on http://localhost:$PORT"
echo "============================================"
echo ""

export HOSTNAME="$HOST"
export PORT

exec "$NODE" "$SERVER"
`;
    const launcherPath = path.join(stageDir, 'start.sh');
    fs.writeFileSync(launcherPath, sh);
    fs.chmodSync(launcherPath, 0o755);
  }

  // Create README
  const readme = `# Web2VR v${VERSION}

## Quick Start

${isWin ? 'Double-click `start.bat` or run `start.ps1` in PowerShell.' : 'Run `./start.sh` in the terminal.'}

Then open http://localhost:3000 in Chrome or Edge with your VR headset.

## Configuration

- **Port**: Set the \`PORT\` environment variable (default: 3000)
- **Host**: Set the \`HOST\` environment variable (default: 0.0.0.0)

${isWin ? `### Command Line
\`\`\`cmd
set PORT=8080
start.bat
\`\`\`` : `### Command Line
\`\`\`bash
PORT=8080 ./start.sh
\`\`\``}

## Requirements

- **VR Mode**: Chrome/Edge with WebXR support, VR headset, SteamVR
- **Screen Capture**: Chrome/Edge browser (no installation needed on the server side)

## Platform

- Built for: ${platformKey}
- Node.js: ${NODE_VERSION}
- Next.js standalone server
`;
  fs.writeFileSync(path.join(stageDir, 'README.md'), readme);
}

// ---- Main packaging function ----
async function packagePlatform(platformKey) {
  const platform = PLATFORMS[platformKey];
  if (!platform) {
    console.error(`Unknown platform: ${platformKey}`);
    console.error(`Available: ${Object.keys(PLATFORMS).join(', ')}, all`);
    process.exit(1);
  }

  const distDir = path.join(PROJECT_DIR, 'dist');
  const stageDir = path.join(distDir, APP_NAME);
  const archiveName = `${APP_NAME}-${platformKey}-v${VERSION}.${platform.ext}`;
  const archivePath = path.join(distDir, archiveName);

  console.log('');
  console.log('============================================');
  console.log(` Packaging ${APP_NAME} v${VERSION} for ${platformKey}`);
  console.log('============================================');

  // 1. Build
  console.log('\n[1/6] Installing dependencies...');
  run('bun install');

  console.log('[2/6] Running Next.js production build...');
  run('bun run build');

  // 2. Download Node.js
  const nodeFileName = `node-${NODE_VERSION}-${platform.nodeOs}-${platform.nodeArch}`;
  const nodeArchiveName = `${nodeFileName}.${platform.nodeExt}`;
  const nodeUrl = `https://nodejs.org/dist/${NODE_VERSION}/${nodeArchiveName}`;
  const cacheDir = path.join(distDir, '.cache');
  const cachePath = path.join(cacheDir, nodeArchiveName);

  console.log('[3/6] Downloading Node.js runtime...');
  await download(nodeUrl, cachePath);

  // 3. Prepare staging
  console.log('[4/6] Preparing staging directory...');
  rmrf(stageDir);
  ensureDir(stageDir);

  // Extract Node.js
  const nodeRuntimeDir = path.join(stageDir, 'node-runtime');
  ensureDir(nodeRuntimeDir);

  if (platform.nodeExt === 'tar.xz') {
    run(`tar xf "${cachePath}" -C "${nodeRuntimeDir}" --strip-components=1`);
  } else if (platform.nodeExt === 'zip') {
    const tmpDir = path.join(stageDir, '_node_tmp');
    ensureDir(tmpDir);
    if (process.platform === 'win32') {
      run(`powershell -NoProfile -Command "Expand-Archive -Path '${cachePath}' -DestinationPath '${tmpDir}' -Force"`);
    } else {
      run(`unzip -q "${cachePath}" -d "${tmpDir}"`);
    }
    // Move contents up
    const extracted = fs.readdirSync(tmpDir);
    const innerDir = path.join(tmpDir, extracted[0]);
    if (fs.statSync(innerDir).isDirectory()) {
      const items = fs.readdirSync(innerDir);
      for (const item of items) {
        fs.renameSync(path.join(innerDir, item), path.join(nodeRuntimeDir, item));
      }
    }
    rmrf(tmpDir);
  }

  // Copy standalone build
  const appDir = path.join(stageDir, 'app');
  const standaloneDir = path.join(PROJECT_DIR, '.next', 'standalone');
  cpRecursive(standaloneDir, appDir);

  // Copy static and public
  cpRecursive(
    path.join(PROJECT_DIR, '.next', 'static'),
    path.join(appDir, '.next', 'static')
  );

  const publicDir = path.join(PROJECT_DIR, 'public');
  if (fs.existsSync(publicDir)) {
    cpRecursive(publicDir, path.join(appDir, 'public'));
  }

  // Copy Prisma schema & DB
  const prismaSchema = path.join(PROJECT_DIR, 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchema)) {
    ensureDir(path.join(appDir, 'prisma'));
    fs.copyFileSync(prismaSchema, path.join(appDir, 'prisma', 'schema.prisma'));
  }
  const prismaClient = path.join(PROJECT_DIR, 'node_modules', '.prisma');
  if (fs.existsSync(prismaClient)) {
    ensureDir(path.join(appDir, 'node_modules', '.prisma'));
    cpRecursive(prismaClient, path.join(appDir, 'node_modules', '.prisma'));
  }
  const dbFile = path.join(PROJECT_DIR, 'db', 'custom.db');
  if (fs.existsSync(dbFile)) {
    ensureDir(path.join(appDir, 'db'));
    fs.copyFileSync(dbFile, path.join(appDir, 'db', 'custom.db'));
  }

  // 4. Create launcher
  console.log('[5/6] Creating launcher script...');
  createLauncher(stageDir, platform, platformKey);

  // 5. Create archive
  console.log('[6/6] Creating archive...');
  ensureDir(distDir);
  if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
  platform.createArchive(stageDir, archivePath, APP_NAME);

  const sizeMB = (fs.statSync(archivePath).size / (1024 * 1024)).toFixed(1);

  console.log('');
  console.log('============================================');
  console.log(' ✅ Package complete!');
  console.log('============================================');
  console.log('');
  console.log(` Archive: ${archivePath}`);
  console.log(` Size:    ${sizeMB} MB`);
  console.log('');
  console.log(` To run on the target machine:`);
  if (platform.nodeOs === 'win') {
    console.log(`   1. Extract ${archiveName}`);
    console.log(`   2. Double-click start.bat`);
    console.log(`   3. Open http://localhost:3000 in Chrome/Edge`);
  } else {
    console.log(`   tar xzf ${archiveName}`);
    console.log(`   cd ${APP_NAME}`);
    console.log(`   ./start.sh`);
    console.log(`   → Open http://localhost:3000 in Chrome/Edge`);
  }
  console.log('');
}

// Recursive copy helper
function cpRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      cpRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---- CLI ----
const args = process.argv.slice(2);
let platformArg = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--platform' && args[i + 1]) {
    platformArg = args[i + 1];
    i++;
  }
}

// Detect current platform if not specified
if (!platformArg) {
  const plat = process.platform;
  const arch = process.arch;
  const key = `${plat === 'win32' ? 'win' : plat === 'darwin' ? 'darwin' : 'linux'}-${arch === 'arm64' ? 'arm64' : 'x64'}`;
  platformArg = key;
}

(async () => {
  try {
    if (platformArg === 'all') {
      for (const key of Object.keys(PLATFORMS)) {
        await packagePlatform(key);
      }
    } else {
      await packagePlatform(platformArg);
    }
  } catch (err) {
    console.error('\n❌ Packaging failed:', err.message);
    process.exit(1);
  }
})();
