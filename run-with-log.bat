@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo [STEP] Current folder: %cd%

if not exist package.json (
  echo [ERROR] package.json was not found. Please extract the ZIP before running start.bat.
  exit /b 10
)

set "PORTABLE_NODE=%~dp0runtime\node"
if exist "%PORTABLE_NODE%\node.exe" set "PATH=%PORTABLE_NODE%;%PATH%"
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

echo [STEP] Checking node...
where node
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js LTS from https://nodejs.org/ or put portable node.exe in runtime\node\.
  exit /b 11
)
node -v

echo [STEP] Checking npm...
where npm
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall Node.js and keep npm/Add to PATH enabled.
  exit /b 12
)
call npm -v

if not exist node_modules (
  echo [STEP] node_modules not found. Running npm install...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    exit /b 13
  )
) else (
  echo [STEP] node_modules exists. Skipping npm install.
)

echo [STEP] Starting server with node server.js ...
node server.js
set "ERR=%ERRORLEVEL%"
echo [STEP] node server.js exited with code %ERR%.
exit /b %ERR%
