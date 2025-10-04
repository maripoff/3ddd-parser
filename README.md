# 3DDD Parser

A parser for monitoring new vacancies and orders on 3ddd.ru with Telegram notifications.

## Features

- Monitors 3ddd.ru for new vacancies and orders
- Sends formatted Telegram notifications for new items
- Runs as a systemd service with automatic scheduling
- Stores data in JSON files for comparison

## Prerequisites

- Node.js and npm
- systemd (Linux)
- Telegram bot token and chat ID

## Installation

1. Clone the repository and navigate to the project directory
2. Copy `.env.example` to `.env` and configure your Telegram credentials:
   ```bash
   cp .env.example .env
   ```
   
3. Edit `.env` file and add your Telegram credentials:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

4. Run the installation script:
   ```bash
   ./install.sh
   ```

The installation script will:
- Install npm dependencies
- Create systemd service and timer files
- Install them to `/etc/systemd/system/`
- Enable and start the timer to run every 5 minutes

## Manual Usage

You can also run the parser manually:

```bash
# Run once
npm run run:once

# Run continuously (for development)
npm start
```

## Systemd Management

After installation, you can manage the service using systemctl:

```bash
# Check timer status
sudo systemctl status 3ddd-parser.timer

# Check service logs
sudo journalctl -u 3ddd-parser.service -f

# Stop the timer
sudo systemctl stop 3ddd-parser.timer

# Disable the timer
sudo systemctl disable 3ddd-parser.timer

# Run service manually
sudo systemctl start 3ddd-parser.service
```

## Configuration

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID

## File Structure

- `src/check.js` - Main parser logic
- `src/send-tg-notification.js` - Telegram notification handler
- `src/parse-vacancies.js` - Vacancy parser
- `src/parse-tasks.js` - Task/order parser
- `src/fetch-html.js` - HTML fetching utility
- `data/` - JSON data storage directory
- `etc/` - Systemd service templates
- `install.sh` - Installation script
