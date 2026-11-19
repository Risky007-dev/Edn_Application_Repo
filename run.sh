#!/usr/bin/env bash
# ==============================================================================
# Popcorn Maths & Tutor Time - Linux / Ubuntu Setup & Startup Script
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "========================================================"
echo "  Popcorn Maths & Tutor Time - Ubuntu / Linux Setup"
echo "========================================================"
echo ""

# 1. Check Node.js installation
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed."
    echo "To install on Ubuntu/Debian:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

echo "[1/4] Found Node.js $(node -v) and npm $(npm -v)"

# 2. Check and initialize .env file
if [ ! -f ".env" ]; then
    echo "[2/4] Initializing .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "      Created .env with default local settings."
    else
        echo "[WARNING] .env.example not found."
    fi
else
    echo "[2/4] .env configuration file already exists."
fi

# 3. Check and install dependencies
if [ ! -d "node_modules" ]; then
    echo "[3/4] Installing dependencies with npm install..."
    npm install
else
    echo "[3/4] Dependencies already installed."
fi

# 4. Start application
echo "[4/4] Starting server..."
echo ""
echo "========================================================"
echo "  Server running on http://localhost:5001"
echo "  View subscribers on http://localhost:5001/subscribers"
echo "  Press Ctrl+C to stop"
echo "========================================================"
echo ""

node server.js
