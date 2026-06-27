@echo off
REM ============================================================================
REM Package WebXR VR Video Player for Windows (x86_64)
REM Produces a portable, no-install archive: dist\webxr-vr-player-win-x64.zip
REM
REM Prerequisites on the build machine:
REM   - Node.js >= 18 (for next build)
REM   - bun (for dependency install)
REM   - PowerShell (for zip creation)
REM
REM Usage:
REM   scripts\package-windows.bat
REM ============================================================================

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "APP_NAME=webxr-vr-player"

REM Read version from package.json
set "VERSION=0.2.0"
for /f "usebackq delims=" %%v in (`node -p "require('%PROJECT_DIR%/package.json').version" 2^>nul`) do set "VERSION=%%v"

set "NODE_VERSION=v22.16.0"
set "NODE_PLATFORM=win-x64"
set "DIST_DIR=%PROJECT_DIR%\dist"
set "STAGE_DIR=%DIST_DIR%\%APP_NAME%"
set "ARCHIVE_NAME=%APP_NAME%-win-x64-v%VERSION%.zip"

echo ============================================
echo  Packaging %APP_NAME% v%VERSION% for Windows x86_64
echo ============================================
echo.

REM ---- 1. Build the Next.js standalone output ----
echo [1/6] Installing dependencies...
cd /d "%PROJECT_DIR%"
call bun install

echo [2/6] Running Next.js production build...
call bun run build

REM ---- 2. Download Node.js runtime ----
set "NODE_ZIP=node-%NODE_VERSION%-%NODE_PLATFORM%.zip"
set "NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%NODE_ZIP%"
set "NODE_CACHE=%DIST_DIR%\.cache"

if not exist "%NODE_CACHE%" mkdir "%NODE_CACHE%"

if not exist "%NODE_CACHE%\%NODE_ZIP%" (
    echo [3/6] Downloading Node.js %NODE_VERSION% (%NODE_PLATFORM%)...
    curl -fSL -o "%NODE_CACHE%\%NODE_ZIP%" "%NODE_URL%"
) else (
    echo [3/6] Using cached Node.js %NODE_VERSION%...
)

REM ---- 3. Prepare staging directory ----
echo [4/6] Preparing staging directory...
if exist "%STAGE_DIR%" rmdir /s /q "%STAGE_DIR%"
mkdir "%STAGE_DIR%"

REM Extract Node.js into staging
mkdir "%STAGE_DIR%\node-runtime"
powershell -NoProfile -Command "Expand-Archive -Path '%NODE_CACHE%\%NODE_ZIP%' -DestinationPath '%STAGE_DIR%\node-runtime-temp' -Force"
REM Move contents from node-v22.16.0-win-x64/ up one level
for /d %%d in ("%STAGE_DIR%\node-runtime-temp\*") do (
    xcopy "%%d\*" "%STAGE_DIR%\node-runtime\" /s /e /q /y
)
rmdir /s /q "%STAGE_DIR%\node-runtime-temp"

REM Copy standalone build output
xcopy "%PROJECT_DIR%\.next\standalone" "%STAGE_DIR%\app\" /s /e /q /y

REM Copy static files and public assets
xcopy "%PROJECT_DIR%\.next\static" "%STAGE_DIR%\app\.next\static\" /s /e /q /y
if exist "%PROJECT_DIR%\public" (
    xcopy "%PROJECT_DIR%\public" "%STAGE_DIR%\app\public\" /s /e /q /y
)

REM Copy Prisma files (if using database)
if exist "%PROJECT_DIR%\node_modules\.prisma" (
    mkdir "%STAGE_DIR%\app\node_modules\.prisma"
    xcopy "%PROJECT_DIR%\node_modules\.prisma" "%STAGE_DIR%\app\node_modules\.prisma\" /s /e /q /y
)
if exist "%PROJECT_DIR%\prisma\schema.prisma" (
    mkdir "%STAGE_DIR%\app\prisma"
    copy "%PROJECT_DIR%\prisma\schema.prisma" "%STAGE_DIR%\app\prisma\" /y
)
if exist "%PROJECT_DIR%\db\custom.db" (
    mkdir "%STAGE_DIR%\app\db"
    copy "%PROJECT_DIR%\db\custom.db" "%STAGE_DIR%\app\db\" /y
)

REM ---- 4. Create launcher script ----
echo [5/6] Creating launcher script...

(
echo @echo off
echo REM WebXR VR Video Player - Windows Launcher
echo REM Starts the server on port 3000 and opens the browser.
echo.
echo setlocal
echo.
echo set "SCRIPT_DIR=%%~dp0"
echo set "NODE=%%SCRIPT_DIR%%node-runtime\node.exe"
echo set "SERVER=%%SCRIPT_DIR%%app\server.js"
echo.
echo REM Allow custom port via env var
echo if "%%PORT%%"=="" set "PORT=3000"
echo if "%%HOST%%"=="" set "HOST=0.0.0.0"
echo.
echo echo ============================================
echo echo  WebXR VR Video Player
echo echo  Starting on http://localhost:%%PORT%%
echo echo ============================================
echo echo.
echo.
echo set HOSTNAME=%%HOST%%
echo.
echo "%%NODE%%" "%%SERVER%%"
echo.
echo pause
) > "%STAGE_DIR%\start.bat"

REM Also create a start.ps1 for PowerShell users
(
echo # WebXR VR Video Player - PowerShell Launcher
echo $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
echo $Node = Join-Path $ScriptDir 'node-runtime\node.exe'
echo $Server = Join-Path $ScriptDir 'app\server.js'
echo.
echo $env:PORT = if ($env:PORT) { $env:PORT } else { '3000' }
echo $env:HOSTNAME = if ($env:HOSTNAME) { $env:HOSTNAME } else { '0.0.0.0' }
echo.
echo Write-Host "============================================"
echo Write-Host " WebXR VR Video Player"
echo Write-Host " Starting on http://localhost:$env:PORT"
echo Write-Host "============================================"
echo Write-Host ""
echo.
echo & $Node $Server
) > "%STAGE_DIR%\start.ps1"

REM ---- 5. Create archive ----
echo [6/6] Creating archive: %ARCHIVE_NAME%
if exist "%DIST_DIR%\%ARCHIVE_NAME%" del "%DIST_DIR%\%ARCHIVE_NAME%"
powershell -NoProfile -Command "Compress-Archive -Path '%STAGE_DIR%' -DestinationPath '%DIST_DIR%\%ARCHIVE_NAME%' -Force"

echo.
echo ============================================
echo  Package complete!
echo ============================================
echo.
echo  Archive: %DIST_DIR%\%ARCHIVE_NAME%
echo.
echo  To run on the target machine:
echo    1. Extract the ZIP file
echo    2. Double-click start.bat (or run start.ps1 in PowerShell)
echo    3. Open http://localhost:3000 in Chrome/Edge
echo.

cd /d "%PROJECT_DIR%"
endlocal
