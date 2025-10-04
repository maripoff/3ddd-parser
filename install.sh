#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user."
   exit 1
fi

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    print_error "systemctl not found. This script requires systemd."
    exit 1
fi

# Get current directory and user
CURRENT_DIR=$(pwd)
CURRENT_USER=$(whoami)
SERVICE_NAME="3ddd-parser"

print_info "Installing 3DDD Parser systemd service..."
print_info "Current directory: $CURRENT_DIR"
print_info "Current user: $CURRENT_USER"

# Check if npm is available and get its path
NPM_PATH=$(command -v npm)
if [[ -z "$NPM_PATH" ]]; then
    print_error "npm not found. Please install Node.js and npm first."
    exit 1
fi

print_info "Found npm at: $NPM_PATH"

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Install npm dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    print_info "Installing npm dependencies..."
    npm install
fi

# Create systemd service file from template
SERVICE_FILE="/tmp/${SERVICE_NAME}.service"
print_info "Creating systemd service file..."

if [[ ! -f "etc/systemd-service.template" ]]; then
    print_error "Service template not found: etc/systemd-service.template"
    exit 1
fi

sed "s|{{USER}}|$CURRENT_USER|g; s|{{WORKING_DIR}}|$CURRENT_DIR|g; s|{{NPM_PATH}}|$NPM_PATH|g" etc/systemd-service.template > "$SERVICE_FILE"

# Create systemd timer file from template
TIMER_FILE="/tmp/${SERVICE_NAME}.timer"
print_info "Creating systemd timer file..."

if [[ ! -f "etc/systemd-timer.template" ]]; then
    print_error "Timer template not found: etc/systemd-timer.template"
    exit 1
fi

sed "s|{{SERVICE_NAME}}|$SERVICE_NAME|g" etc/systemd-timer.template > "$TIMER_FILE"

# Check if service already exists and handle reinstallation
if systemctl list-unit-files "${SERVICE_NAME}.timer" &>/dev/null; then
    print_info "Existing installation detected. Updating service..."
    
    # Stop and disable existing timer and service
    if systemctl is-active --quiet "${SERVICE_NAME}.timer"; then
        print_info "Stopping existing timer..."
        sudo systemctl stop "${SERVICE_NAME}.timer"
    fi
    
    if systemctl is-enabled --quiet "${SERVICE_NAME}.timer"; then
        print_info "Disabling existing timer..."
        sudo systemctl disable "${SERVICE_NAME}.timer"
    fi
    
    if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
        print_info "Stopping existing service..."
        sudo systemctl stop "${SERVICE_NAME}.service"
    fi
else
    print_info "New installation detected."
fi

# Copy files to systemd directory (requires sudo)
print_info "Installing systemd files (requires sudo)..."
sudo cp "$SERVICE_FILE" "/etc/systemd/system/"
sudo cp "$TIMER_FILE" "/etc/systemd/system/"

# Clean up temporary files
rm "$SERVICE_FILE" "$TIMER_FILE"

# Reload systemd daemon
print_info "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable and start the timer
print_info "Enabling and starting the timer..."
sudo systemctl enable "${SERVICE_NAME}.timer"
sudo systemctl start "${SERVICE_NAME}.timer"

# Check status
print_info "Checking timer status..."
sudo systemctl status "${SERVICE_NAME}.timer" --no-pager

print_info "Installation completed successfully!"
print_info "The service will run every 5 minutes."
print_info ""
print_info "Useful commands:"
print_info "  Check timer status: sudo systemctl status ${SERVICE_NAME}.timer"
print_info "  Check service logs: sudo journalctl -u ${SERVICE_NAME}.service -f"
print_info "  Stop timer: sudo systemctl stop ${SERVICE_NAME}.timer"
print_info "  Disable timer: sudo systemctl disable ${SERVICE_NAME}.timer"
print_info "  Run service manually: sudo systemctl start ${SERVICE_NAME}.service"
