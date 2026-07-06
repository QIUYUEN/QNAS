@echo off
cd /d "%~dp0"
echo Manual start. This window will stay open.
echo.
if not exist node_modules call npm install
node server.js
echo.
echo Server stopped or failed.
pause
