@echo off
echo This will close any node.exe processes that may be running NAS Lite.
echo If you run other Node.js apps, close this window now.
pause
taskkill /F /IM node.exe
echo Done.
pause
