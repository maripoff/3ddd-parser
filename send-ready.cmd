@echo off
chcp 65001 >nul
REM Запускает скрипт, который отправляет сообщение "Готов к работе!" в Telegram
node "%~dp0src\send-ready.js"
echo.
echo Script finished. Press any key to close.
pause >nul
