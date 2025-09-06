@echo off
REM start.cmd - run the vacancies fetch script from project root
cd /d "%~dp0"
echo Running: node src/start.js %*
node src/fetch-vacancies.js %*
if %ERRORLEVEL% neq 0 (
  echo.
  echo Script exited with error %ERRORLEVEL%.
)
echo.
REM Wait for the user to press Enter before exiting (readline)
set /p _=Press Enter to exit...
exit /b %ERRORLEVEL%
