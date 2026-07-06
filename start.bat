@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist logs mkdir logs

set "LOG=%~dp0logs\startup.log"
echo ======================================== > "%LOG%"
echo NAS Lite startup log >> "%LOG%"
echo Date: %date% %time% >> "%LOG%"
echo Folder: %cd% >> "%LOG%"
echo ======================================== >> "%LOG%"

echo ========================================
echo NAS Lite Launcher
echo ========================================
echo Folder: %cd%
echo Log: %LOG%
echo.

call "%~dp0run-with-log.bat" >> "%LOG%" 2>>&1
set "ERR=%ERRORLEVEL%"

echo.
if "%ERR%"=="0" (
  echo NAS Lite has stopped.
) else (
  echo [ERROR] NAS Lite failed to start. Error code: %ERR%
  echo Please open this log file and send its content:
  echo %LOG%
)
echo.
pause
exit /b %ERR%
