@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if exist "%~dp0makedocker.local.bat" call "%~dp0makedocker.local.bat"

echo Building iot-font...
docker build -t iot-font:latest .
if errorlevel 1 exit /b 1

echo Saving font.tar...
docker save -o font.tar iot-font:latest
if errorlevel 1 exit /b 1

echo.
echo Done. Run copy-font-to-server.bat or deploy-font-to-server.bat
