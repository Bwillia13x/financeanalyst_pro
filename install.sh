#!/bin/bash

# FinanceAnalyst Pro - One-Line Installer
# Quick installer for remote agents

set -e

echo "🚀 FinanceAnalyst Pro - Quick Installer"
echo "======================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
else
    OS="unknown"
fi

echo "Detected OS: $OS"
echo ""

# Download and run appropriate setup script
case $OS in
    "linux"|"macos")
        echo "Downloading setup script..."
        curl -sSL https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.sh -o setup.sh
        chmod +x setup.sh
        echo "Running setup..."
        ./setup.sh
        ;;
    "windows")
        echo "For Windows, please run:"
        echo "iwr -useb https://raw.githubusercontent.com/Bwillia13x/financeanalyst_pro/main/setup.ps1 | iex"
        ;;
    *)
        echo "Unsupported OS. Please use manual setup:"
        echo "1. git clone https://github.com/Bwillia13x/financeanalyst_pro.git"
        echo "2. cd financeanalyst_pro"
        echo "3. npm install"
        echo "4. cp .env.example .env"
        echo "5. npm start"
        ;;
esac
