@echo off
REM ==============================================================================
REM Popcorn Maths & Tutor Time - Windows Startup Script (Node.js / Express)
REM ==============================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================
echo   Popcorn Maths & Tutor Time - Windows Setup & Startup
echo ========================================================
echo.

REM 1. Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else (
        echo [ERROR] Node.js is not installed or not in your system PATH.
        echo Please install Node.js (v20+ recommended) from: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [1/4] Found Node.js %NODE_VERSION%

REM 2. Check and initialize .env file
if not exist ".env" (
    echo [2/4] Creating .env from .env.example...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo       Created .env with default local settings.
    ) else (
        echo [WARNING] .env.example not found; skipping .env copy.
    )
) else (
    echo [2/4] .env configuration file already exists.
)

REM 3. Install npm dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [3/4] Installing npm dependencies (first run)...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
) else (
    echo [3/4] Dependencies already installed.
)

REM 4. Start the application
echo [4/4] Starting server...
echo.
echo ========================================================
echo   Server is running at: http://localhost:5001
echo   View subscribers at:  http://localhost:5001/subscribers
echo   Press Ctrl+C to stop the server
echo ========================================================
echo.

node server.js

pause
