@echo off
REM check-loop.cmd - run the checker continuously (every INTERVAL_MS)
cd /d "%~dp0"
echo Running: node src/check.js %*
node src/check.js %*
if %ERRORLEVEL% neq 0 (
  echo.
  echo Script exited with error %ERRORLEVEL%.
)
echo.
REM Press Ctrl+C to stop the loop when running in this console.
set /p _=Press Enter to exit...
exit /b %ERRORLEVEL%
