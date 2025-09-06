@echo off
REM poll.cmd - run one iteration of the poller (fetch & compare once)
cd /d "%~dp0"
echo Running: node src/poller.js --once %*
node src/poller.js --once %*
if %ERRORLEVEL% neq 0 (
  echo.
  echo Script exited with error %ERRORLEVEL%.
)
echo.
REM Wait for the user to press Enter before exiting
set /p _=Press Enter to exit...
exit /b %ERRORLEVEL%
