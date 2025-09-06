@echo off
REM show-10-once.cmd - show top 10 vacancies and top 10 tasks once
cd /d "%~dp0"
echo Running: node src/start.js %*
node src/start.js %*
echo.
REM Wait for the user to press Enter before exiting
set /p _=Press Enter to exit...
exit /b %ERRORLEVEL%
