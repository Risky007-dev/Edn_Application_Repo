@echo off
REM Quick Start Script for Popcorn Maths

echo ===================================
echo  Popcorn Maths Setup & Run Script
echo ===================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/4] Python found
echo.

REM Check if requirements.txt exists
if not exist requirements.txt (
    echo ERROR: requirements.txt not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo [2/4] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Check if .env exists
if not exist .env (
    echo [3/4] Creating .env from template...
    if exist .env.example (
        copy .env.example .env
        echo WARNING: .env created from .env.example
        echo Please edit .env with your email credentials before running the server
        echo.
        pause
    ) else (
        echo ERROR: .env.example not found
        pause
        exit /b 1
    )
) else (
    echo [3/4] .env file already exists
)
echo.

echo [4/4] Starting Flask server...
echo.
echo Server will run on http://localhost:5001
echo Press Ctrl+C to stop the server
echo.
cd MyWebApp\src\main\webapp
python flasktest.py
