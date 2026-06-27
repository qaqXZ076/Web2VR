# ============================================================================
# Package Web2VR — Cross-platform packager (PowerShell)
#
# Produces portable, no-install archives:
#   - Linux x86_64:  dist/Web2VR-linux-x64-vX.Y.Z.tar.gz
#   - Windows x86_4: dist/Web2VR-win-x64-vX.Y.Z.zip
#   - macOS arm64:   dist/Web2VR-darwin-arm64-vX.Y.Z.tar.gz
#   - macOS x86_64:  dist/Web2VR-darwin-x64-vX.Y.Z.tar.gz
#
# Prerequisites on the build machine:
#   - Node.js >= 18 (for next build)
#   - bun (for dependency install)
#   - PowerShell 5.1+ (Windows) or PowerShell 7+ (cross-platform)
#
# Usage:
#   .\scripts\package.ps1                           # package for current platform
#   .\scripts\package.ps1 -Platform linux-x64       # package for Linux x64
#   .\scripts\package.ps1 -Platform win-x64         # package for Windows x64
#   .\scripts\package.ps1 -Platform darwin-arm64    # package for macOS ARM64
#   .\scripts\package.ps1 -Platform darwin-x64      # package for macOS x64
#   .\scripts\package.ps1 -Platform all             # package for all platforms
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(HelpMessage = "Target platform: linux-x64, win-x64, darwin-arm64, darwin-x64, all")]
    [string]$Platform
)

# ---- Configuration ----
$AppName = "Web2VR"
$NodeVersion = "v22.16.0"
$ProjectDir = Resolve-Path (Join-Path $PSScriptRoot "..")

# Read version from package.json
$Version = "1.0.0"
$PkgPath = Join-Path $ProjectDir "package.json"
if (Test-Path $PkgPath) {
    try {
        $PkgJson = Get-Content $PkgPath -Raw | ConvertFrom-Json
        if ($PkgJson.version) { $Version = $PkgJson.version }
    } catch {
        Write-Warning "Could not read version from package.json, using default: $Version"
    }
}

# Platform definitions
$Platforms = @{
    "linux-x64" = @{
        NodeOs   = "linux"
        NodeArch = "x64"
        Ext      = "tar.gz"
        NodeExt  = "tar.xz"
    }
    "win-x64" = @{
        NodeOs   = "win"
        NodeArch = "x64"
        Ext      = "zip"
        NodeExt  = "zip"
    }
    "darwin-arm64" = @{
        NodeOs   = "darwin"
        NodeArch = "arm64"
        Ext      = "tar.gz"
        NodeExt  = "tar.xz"
    }
    "darwin-x64" = @{
        NodeOs   = "darwin"
        NodeArch = "x64"
        Ext      = "tar.gz"
        NodeExt  = "tar.xz"
    }
}

# ---- Helper functions ----

function Invoke-Cmd {
    param([string]$Command)
    Write-Host "  > $Command" -ForegroundColor DarkGray
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE: $Command"
    }
}

function Ensure-Dir {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Remove-DirRecursive {
    param([string]$Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Recurse -Force
    }
}

function Copy-Recursive {
    param([string]$Source, [string]$Destination)
    Ensure-Dir $Destination
    Get-ChildItem -Path $Source -Recurse | ForEach-Object {
        $DestPath = $_.FullName -replace [regex]::Escape($Source), $Destination
        if ($_.PSIsContainer) {
            Ensure-Dir $DestPath
        } else {
            $DestDir = Split-Path $DestPath -Parent
            Ensure-Dir $DestDir
            Copy-Item $_.FullName -Destination $DestPath -Force
        }
    }
}

function Download-File {
    param([string]$Url, [string]$Destination)
    if (Test-Path $Destination) {
        Write-Host "  Using cached: $(Split-Path $Destination -Leaf)" -ForegroundColor Cyan
        return
    }
    Write-Host "  Downloading: $Url" -ForegroundColor Cyan
    Ensure-Dir (Split-Path $Destination -Parent)
    $TmpDest = "$Destination.tmp"
    try {
        # Use WebClient for broader compatibility
        $WebClient = New-Object System.Net.WebClient
        $WebClient.Headers.Add("User-Agent", "PowerShell")
        $WebClient.DownloadFile($Url, $TmpDest)
        Move-Item -Path $TmpDest -Destination $Destination -Force
    } catch {
        if (Test-Path $TmpDest) { Remove-Item $TmpDest -Force }
        throw "Download failed: $_"
    } finally {
        if ($WebClient) { $WebClient.Dispose() }
    }
}

function Create-Archive {
    param(
        [string]$StageDir,
        [string]$ArchivePath,
        [string]$ArchiveFormat  # "zip" or "tar.gz"
    )

    if (Test-Path $ArchivePath) { Remove-Item $ArchivePath -Force }

    if ($ArchiveFormat -eq "zip") {
        # Use Compress-Archive (available on PowerShell 5.1+)
        Compress-Archive -Path $StageDir -DestinationPath $ArchivePath -Force
    } else {
        # Use tar command (available on Windows 10+, Linux, macOS)
        $DistDir = Split-Path $ArchivePath -Parent
        $FolderName = Split-Path $StageDir -Leaf
        Push-Location $DistDir
        try {
            Invoke-Cmd "tar czf `"$ArchivePath`" `"$FolderName`""
        } finally {
            Pop-Location
        }
    }
}

# ---- Launcher creation ----

function Create-Launcher {
    param(
        [string]$StageDir,
        [hashtable]$PlatformInfo,
        [string]$PlatformKey
    )

    $IsWin = $PlatformInfo.NodeOs -eq "win"

    if ($IsWin) {
        # .bat launcher
        $BatContent = @"
@echo off
REM Web2VR - Windows Launcher
setlocal

set "SCRIPT_DIR=%~dp0"
set "NODE=%SCRIPT_DIR%node-runtime\node.exe"
set "SERVER=%SCRIPT_DIR%app\server.js"

if "%PORT%"=="" set "PORT=3000"
if "%HOST%"=="" set "HOST=0.0.0.0"

echo ============================================
echo  Web2VR v$Version
echo  Starting on http://localhost:%PORT%
echo ============================================
echo.

set HOSTNAME=%HOST%
"%NODE%" "%SERVER%"

pause
"@
        Set-Content -Path (Join-Path $StageDir "start.bat") -Value $BatContent -Encoding ASCII

        # .ps1 launcher
        $Ps1Content = @"
# Web2VR - PowerShell Launcher
`$ScriptDir = Split-Path -Parent `$MyInvocation.MyCommand.Path
`$Node = Join-Path `$ScriptDir 'node-runtime\node.exe'
`$Server = Join-Path `$ScriptDir 'app\server.js'

`$env:PORT = if (`$env:PORT) { `$env:PORT } else { '3000' }
`$env:HOSTNAME = if (`$env:HOSTNAME) { `$env:HOSTNAME } else { '0.0.0.0' }

Write-Host "============================================"
Write-Host " Web2VR v$Version"
Write-Host " Starting on http://localhost:`$env:PORT"
Write-Host "============================================"
Write-Host ""

& `$Node `$Server
"@
        Set-Content -Path (Join-Path $StageDir "start.ps1") -Value $Ps1Content -Encoding UTF8

    } else {
        # Unix shell launcher
        $ShContent = @"
#!/usr/bin/env bash
# Web2VR - Launcher
set -e

SCRIPT_DIR="`$(cd "`$(dirname "`${BASH_SOURCE[0]}")" && pwd)"
NODE="`$SCRIPT_DIR/node-runtime/bin/node"
SERVER="`$SCRIPT_DIR/app/server.js"

PORT="`${PORT:-3000}"
HOST="`${HOST:-0.0.0.0}"

echo "============================================"
echo " Web2VR v$Version"
echo " Starting on http://localhost:`$PORT"
echo "============================================"
echo ""

export HOSTNAME="`$HOST"
export PORT

exec "`$NODE" "`$SERVER"
"@
        $ShPath = Join-Path $StageDir "start.sh"
        Set-Content -Path $ShPath -Value $ShContent -Encoding UTF8NoBOM
        # Make executable (works on non-Windows; ignored on Windows)
        try {
            if ($IsLinux -or $IsMacOS) {
                chmod +x $ShPath 2>$null
            }
        } catch {}
    }

    # Create README for the package
    $ReadmeContent = @"
# Web2VR v$Version

## Quick Start

$($IsWin ? 'Double-click ``start.bat`` or run ``start.ps1`` in PowerShell.' : 'Run ``./start.sh`` in the terminal.')

Then open http://localhost:3000 in Chrome or Edge with your VR headset.

## Configuration

- **Port**: Set the ``PORT`` environment variable (default: 3000)
- **Host**: Set the ``HOST`` environment variable (default: 0.0.0.0)

$($IsWin ? @'
### Command Line (cmd)
```cmd
set PORT=8080
start.bat
```

### Command Line (PowerShell)
```powershell
$env:PORT = "8080"
.\start.ps1
```
'@ : @'
### Command Line
```bash
PORT=8080 ./start.sh
```
'@)

## Requirements

- **VR Mode**: Chrome/Edge with WebXR support, VR headset, SteamVR
- **Screen Capture**: Chrome/Edge browser (no installation needed on the server side)

## Platform

- Built for: $PlatformKey
- Node.js: $NodeVersion
- Next.js standalone server
"@
    Set-Content -Path (Join-Path $StageDir "README.md") -Value $ReadmeContent -Encoding UTF8
}

# ---- Main packaging function ----

function Package-Platform {
    param([string]$PlatformKey)

    $PlatformInfo = $Platforms[$PlatformKey]
    if (-not $PlatformInfo) {
        Write-Error "Unknown platform: $PlatformKey"
        Write-Error "Available: $($Platforms.Keys -join ', '), all"
        exit 1
    }

    $DistDir = Join-Path $ProjectDir "dist"
    $StageDir = Join-Path $DistDir $AppName
    $ArchiveName = "$AppName-$PlatformKey-v$Version.$($PlatformInfo.Ext)"
    $ArchivePath = Join-Path $DistDir $ArchiveName

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host " Packaging $AppName v$Version for $PlatformKey" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow

    # 1. Build
    Write-Host ""
    Write-Host "[1/6] Installing dependencies..." -ForegroundColor Green
    Push-Location $ProjectDir
    try {
        Invoke-Cmd "bun install"
    } finally {
        Pop-Location
    }

    Write-Host "[2/6] Running Next.js production build..." -ForegroundColor Green
    Push-Location $ProjectDir
    try {
        Invoke-Cmd "bun run build"
    } finally {
        Pop-Location
    }

    # 2. Download Node.js
    $NodeFileName = "node-$NodeVersion-$($PlatformInfo.NodeOs)-$($PlatformInfo.NodeArch)"
    $NodeArchiveName = "$NodeFileName.$($PlatformInfo.NodeExt)"
    $NodeUrl = "https://nodejs.org/dist/$NodeVersion/$NodeArchiveName"
    $CacheDir = Join-Path $DistDir ".cache"
    $CachePath = Join-Path $CacheDir $NodeArchiveName

    Write-Host "[3/6] Downloading Node.js runtime..." -ForegroundColor Green
    Download-File -Url $NodeUrl -Destination $CachePath

    # 3. Prepare staging
    Write-Host "[4/6] Preparing staging directory..." -ForegroundColor Green
    Remove-DirRecursive $StageDir
    Ensure-Dir $StageDir

    # Extract Node.js
    $NodeRuntimeDir = Join-Path $StageDir "node-runtime"
    Ensure-Dir $NodeRuntimeDir

    if ($PlatformInfo.NodeExt -eq "tar.xz") {
        Invoke-Cmd "tar xf `"$CachePath`" -C `"$NodeRuntimeDir`" --strip-components=1"
    } elseif ($PlatformInfo.NodeExt -eq "zip") {
        $TmpDir = Join-Path $StageDir "_node_tmp"
        Ensure-Dir $TmpDir
        Expand-Archive -Path $CachePath -DestinationPath $TmpDir -Force
        # Move contents from inner directory up one level
        $Extracted = Get-ChildItem $TmpDir -Directory
        if ($Extracted.Count -eq 1) {
            $InnerDir = $Extracted[0].FullName
            Get-ChildItem $InnerDir | ForEach-Object {
                $Dest = Join-Path $NodeRuntimeDir $_.Name
                Move-Item $_.FullName -Destination $Dest -Force
            }
        }
        Remove-DirRecursive $TmpDir
    }

    # Copy standalone build
    $AppDir = Join-Path $StageDir "app"
    $StandaloneDir = Join-Path $ProjectDir ".next\standalone"
    Copy-Recursive -Source $StandaloneDir -Destination $AppDir

    # Copy static files
    $StaticSrc = Join-Path $ProjectDir ".next\static"
    $StaticDest = Join-Path $AppDir ".next\static"
    Copy-Recursive -Source $StaticSrc -Destination $StaticDest

    # Copy public assets
    $PublicDir = Join-Path $ProjectDir "public"
    if (Test-Path $PublicDir) {
        $PublicDest = Join-Path $AppDir "public"
        Copy-Recursive -Source $PublicDir -Destination $PublicDest
    }

    # Copy Prisma schema (if exists)
    $PrismaSchema = Join-Path $ProjectDir "prisma\schema.prisma"
    if (Test-Path $PrismaSchema) {
        Ensure-Dir (Join-Path $AppDir "prisma")
        Copy-Item $PrismaSchema -Destination (Join-Path $AppDir "prisma\schema.prisma") -Force
    }

    # Copy Prisma client (if exists)
    $PrismaClient = Join-Path $ProjectDir "node_modules\.prisma"
    if (Test-Path $PrismaClient) {
        Copy-Recursive -Source $PrismaClient -Destination (Join-Path $AppDir "node_modules\.prisma")
    }

    # Copy database (if exists)
    $DbFile = Join-Path $ProjectDir "db\custom.db"
    if (Test-Path $DbFile) {
        Ensure-Dir (Join-Path $AppDir "db")
        Copy-Item $DbFile -Destination (Join-Path $AppDir "db\custom.db") -Force
    }

    # 4. Create launcher
    Write-Host "[5/6] Creating launcher script..." -ForegroundColor Green
    Create-Launcher -StageDir $StageDir -PlatformInfo $PlatformInfo -PlatformKey $PlatformKey

    # 5. Create archive
    Write-Host "[6/6] Creating archive..." -ForegroundColor Green
    Ensure-Dir $DistDir
    Create-Archive -StageDir $StageDir -ArchivePath $ArchivePath -ArchiveFormat $PlatformInfo.Ext

    $SizeMB = [math]::Round((Get-Item $ArchivePath).Length / 1MB, 1)

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host " Package complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host " Archive: $ArchivePath"
    Write-Host " Size:    $SizeMB MB"
    Write-Host ""

    if ($PlatformInfo.NodeOs -eq "win") {
        Write-Host " To run on the target machine:"
        Write-Host "   1. Extract $ArchiveName"
        Write-Host "   2. Double-click start.bat"
        Write-Host "   3. Open http://localhost:3000 in Chrome/Edge"
    } else {
        Write-Host " To run on the target machine:"
        Write-Host "   tar xzf $ArchiveName"
        Write-Host "   cd $AppName"
        Write-Host "   ./start.sh"
        Write-Host "   -> Open http://localhost:3000 in Chrome/Edge"
    }
    Write-Host ""
}

# ---- Determine target platform ----

if (-not $Platform) {
    # Auto-detect current platform
    $OsName = "linux"
    if ($IsWindows -or $env:OS -eq "Windows_NT") { $OsName = "win" }
    elseif ($IsMacOS) { $OsName = "darwin" }

    $ArchName = "x64"
    if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq "Arm64") {
        $ArchName = "arm64"
    }
    # Fallback: check PROCESSOR_ARCHITECTURE on Windows
    if ($OsName -eq "win" -and $env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
        $ArchName = "arm64"
    }

    $Platform = "$OsName-$ArchName"
    Write-Host "Auto-detected platform: $Platform" -ForegroundColor Cyan
}

# ---- Run ----

try {
    if ($Platform -eq "all") {
        foreach ($Key in @("linux-x64", "win-x64", "darwin-arm64", "darwin-x64")) {
            Package-Platform -PlatformKey $Key
        }
    } else {
        Package-Platform -PlatformKey $Platform
    }
} catch {
    Write-Host ""
    Write-Host "Packaging failed: $_" -ForegroundColor Red
    exit 1
}
