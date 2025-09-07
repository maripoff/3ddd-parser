@echo off
REM check-once.cmd - run one iteration of the checker (fetch & compare once)
cd /d "%~dp0"
echo Running: node src/check.js --once %*
node src/check.js --once %*
if %ERRORLEVEL% neq 0 (
  echo.
  echo Script exited with error %ERRORLEVEL%.
)
echo.
REM Wait for the user to press Enter before exiting
set /p _=Press Enter to exit...
exit /b %ERRORLEVEL%
