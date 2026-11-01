@echo off
REM ==============================================================================
REM Popcorn Maths Express Server Startup Script (Windows)
REM ==============================================================================

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
    ) else (
        echo [ERROR] Node.js is not found in PATH.
        echo Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
)

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting server on http://localhost:5001 ...
echo.
node server.js
pause
