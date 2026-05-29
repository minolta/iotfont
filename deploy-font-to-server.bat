@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem ============ EDIT THESE ============
set "IOT_SSH_USER=ky"
set "IOT_SERVER=192.168.88.5"
set "IOT_REMOTE_DIR=/home/ky/iot"
rem =====================================

if exist "%~dp0makedocker.local.bat" call "%~dp0makedocker.local.bat"

call "%~dp0makedocker-font.bat"
if errorlevel 1 exit /b 1

call "%~dp0copy-font-to-server.bat"
if errorlevel 1 exit /b 1

set "SSH_TARGET=%IOT_SSH_USER%@%IOT_SERVER%"

echo Restarting iot-font on %SSH_TARGET% ...
ssh "%SSH_TARGET%" "cd %IOT_REMOTE_DIR% && docker load -i font.tar && docker rm -f iot-font 2>/dev/null || true && docker network inspect iot-net >/dev/null 2>&1 || docker network create iot-net && docker run -d --name iot-font --network iot-net --restart unless-stopped -p 8080:80 iot-font:latest"
if errorlevel 1 exit /b 1

echo.
echo UI: http://%IOT_SERVER%:8080
