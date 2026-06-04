#!/bin/bash

set -e

INTERVAL_MINUTES=5

while [[ $# -gt 0 ]]; do
	case $1 in
	--interval)
		INTERVAL_MINUTES="$2"
		if ! [[ "$INTERVAL_MINUTES" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_MINUTES" -lt 1 ]]; then
			echo "Error: --interval must be a positive integer (minutes)"
			exit 1
		fi
		shift 2
		;;
	--help | -h)
		echo "Usage: sudo $0 [--interval MINUTES]"
		echo ""
		echo "Options:"
		echo "  --interval MINUTES    Set timer interval in minutes (default: 5)"
		echo "  --help, -h           Show this help message"
		echo ""
		echo "This script must be run as root (use sudo)."
		exit 0
		;;
	*)
		echo "Unknown option: $1"
		echo "Use --help for usage information"
		exit 1
		;;
	esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
	echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
	echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
	echo -e "${RED}[ERROR]${NC} $1"
}

if [[ $EUID -ne 0 ]]; then
	print_error "This script must be run as root. Please run with sudo."
	exit 1
fi

if ! command -v systemctl &>/dev/null; then
	print_error "systemctl not found. This script requires systemd."
	exit 1
fi

APP_USER="app"
APP_HOME="/home/app"
INSTALL_DIR="${APP_HOME}/3ddd-parser"
SERVICE_NAME="3ddd-parser"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "${SCRIPT_DIR}/package.json" ]]; then
	print_error "package.json not found in ${SCRIPT_DIR}. Please run this script from the project root directory."
	exit 1
fi

NPM_PATH=$(command -v npm)
if [[ -z "$NPM_PATH" ]]; then
	print_error "npm not found. Please install Node.js and npm first."
	exit 1
fi

print_info "Installing 3DDD Parser systemd service..."
print_info "Source directory: $SCRIPT_DIR"
print_info "Install directory: $INSTALL_DIR"
print_info "Service user: $APP_USER"
print_info "Timer interval: $INTERVAL_MINUTES minutes"
print_info "Found npm at: $NPM_PATH"

if ! id "$APP_USER" &>/dev/null; then
	print_info "Creating system user '$APP_USER'..."
	useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
fi

mkdir -p "$INSTALL_DIR"

if command -v rsync &>/dev/null; then
	print_info "Copying project files with rsync..."
	rsync -a --exclude='.git' --exclude='node_modules' --exclude='data' --exclude='nul' "${SCRIPT_DIR}/" "$INSTALL_DIR/"
else
	print_info "Copying project files with cp..."
	cp -r "${SCRIPT_DIR}/"* "$INSTALL_DIR/"
	cp "${SCRIPT_DIR}/.env" "$INSTALL_DIR/" 2>/dev/null || true
	cp "${SCRIPT_DIR}/.gitignore" "$INSTALL_DIR/" 2>/dev/null || true
	rm -rf "$INSTALL_DIR/.git" "$INSTALL_DIR/node_modules"
fi

if [[ ! -f "${INSTALL_DIR}/.env" ]]; then
	print_warning "No .env file found in ${INSTALL_DIR}. You may need to configure it manually."
fi

print_info "Installing npm dependencies..."
cd "$INSTALL_DIR" && npm install --production

mkdir -p "${INSTALL_DIR}/data"

chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"

SERVICE_FILE="/tmp/${SERVICE_NAME}.service"
print_info "Creating systemd service file..."

if [[ ! -f "${INSTALL_DIR}/etc/systemd-service.template" ]]; then
	print_error "Service template not found: ${INSTALL_DIR}/etc/systemd-service.template"
	exit 1
fi

sed "s|{{USER}}|$APP_USER|g; s|{{WORKING_DIR}}|$INSTALL_DIR|g; s|{{NPM_PATH}}|$NPM_PATH|g" "${INSTALL_DIR}/etc/systemd-service.template" >"$SERVICE_FILE"

TIMER_FILE="/tmp/${SERVICE_NAME}.timer"
print_info "Creating systemd timer file..."

if [[ ! -f "${INSTALL_DIR}/etc/systemd-timer.template" ]]; then
	print_error "Timer template not found: ${INSTALL_DIR}/etc/systemd-timer.template"
	exit 1
fi

sed "s|{{SERVICE_NAME}}|$SERVICE_NAME|g; s|{{INTERVAL_MINUTES}}|$INTERVAL_MINUTES|g" "${INSTALL_DIR}/etc/systemd-timer.template" >"$TIMER_FILE"

if systemctl list-unit-files "${SERVICE_NAME}.timer" &>/dev/null; then
	print_info "Existing installation detected. Updating service..."

	if systemctl is-active --quiet "${SERVICE_NAME}.timer"; then
		print_info "Stopping existing timer..."
		systemctl stop "${SERVICE_NAME}.timer"
	fi

	if systemctl is-enabled --quiet "${SERVICE_NAME}.timer"; then
		print_info "Disabling existing timer..."
		systemctl disable "${SERVICE_NAME}.timer"
	fi

	if systemctl is-active --quiet "${SERVICE_NAME}.service"; then
		print_info "Stopping existing service..."
		systemctl stop "${SERVICE_NAME}.service"
	fi
else
	print_info "New installation detected."
fi

print_info "Installing systemd files..."
cp "$SERVICE_FILE" "/etc/systemd/system/"
cp "$TIMER_FILE" "/etc/systemd/system/"

rm "$SERVICE_FILE" "$TIMER_FILE"

print_info "Reloading systemd daemon..."
systemctl daemon-reload

print_info "Enabling and starting the timer..."
systemctl enable "${SERVICE_NAME}.timer"
systemctl start "${SERVICE_NAME}.timer"

print_info "Checking timer status..."
systemctl status "${SERVICE_NAME}.timer" --no-pager

print_info "Installation completed successfully!"
print_info "The service will run every $INTERVAL_MINUTES minutes as user '$APP_USER'."
print_info "Install location: $INSTALL_DIR"
print_info ""
print_info "Useful commands:"
print_info "  Check timer status: sudo systemctl status ${SERVICE_NAME}.timer"
print_info "  Check service logs: sudo journalctl -u ${SERVICE_NAME}.service -f"
print_info "  Stop timer:         sudo systemctl stop ${SERVICE_NAME}.timer"
print_info "  Disable timer:      sudo systemctl disable ${SERVICE_NAME}.timer"
print_info "  Run service manually: sudo systemctl start ${SERVICE_NAME}.service"
