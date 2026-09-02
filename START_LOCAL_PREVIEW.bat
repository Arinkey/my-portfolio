@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Portfolio Server

echo ==========================================
echo   Min Yun Pan Portfolio - Local Preview
echo ==========================================
echo.

set "PY_CMD="

rem Prefer the Windows Python Launcher because it avoids Store aliases.
py -3 --version >nul 2>&1
if %errorlevel%==0 set "PY_CMD=py -3"

if not defined PY_CMD (
  python --version >nul 2>&1
  if %errorlevel%==0 set "PY_CMD=python"
)

if not defined PY_CMD (
  echo [ERROR] Python could not be started.
  echo.
  echo Please install Python 3 from python.org, then run this file again.
  echo During installation, enable "Add Python to PATH".
  echo.
  pause
  exit /b 1
)

echo [OK] Python found: %PY_CMD%

set "PORT=8000"
netstat -ano 2>nul | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  set "PORT=8010"
  echo [INFO] Port 8000 is already in use. Using port 8010 instead.
)

echo [INFO] Site folder: %CD%
echo [INFO] Editor URL: http://127.0.0.1:%PORT%/editor.html
echo.
echo Keep this window OPEN while editing the portfolio.
echo Press Ctrl+C here when you want to stop the server.
echo.

rem Open the browser after a short delay, while this window runs the server.
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" "http://127.0.0.1:%PORT%/editor.html""

%PY_CMD% -m http.server %PORT% --bind 127.0.0.1

set "SERVER_EXIT=%errorlevel%"
echo.
if not "%SERVER_EXIT%"=="0" (
  echo [ERROR] The local server stopped unexpectedly. Error code: %SERVER_EXIT%
  echo Try running this command manually:
  echo     %PY_CMD% -m http.server %PORT% --bind 127.0.0.1
  echo.
  pause
)
endlocal
