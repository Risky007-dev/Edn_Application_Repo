@echo off
REM Popcorn Maths Express Server Startup Script

echo.
echo ╔════════════════════════════════════╗
echo ║    🍿 Popcorn Maths Server 🍿    ║
echo ╚════════════════════════════════════╝
echo.

REM Check if node_modules exist
if not exist node_modules (
    echo Installing dependencies...
    call "C:\Program Files\nodejs\npm.cmd" install
    echo.
)

REM Start the server
echo Starting server...
echo.
call "C:\Program Files\nodejs\node.exe" server.js
