@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if defined PASS set "PASS=%PASS:"=%"

rem ============ EDIT THESE ============
set "IOT_SSH_USER=ky"
set "IOT_SERVER=192.168.88.5"
set "IOT_REMOTE_DIR=/home/ky/iot"
rem Docker Hub (optional): set user to tag + push after build
rem set "DOCKERHUB_USER=yourdockerhubuser"
rem set "DOCKERHUB_TAG=latest"
rem =====================================

if exist "%~dp0makedocker.local.bat" call "%~dp0makedocker.local.bat"

echo Building iot-font...
docker build -t iot-font:latest .
if errorlevel 1 exit /b 1

if defined DOCKERHUB_USER (
  echo.
  echo Pushing to Docker Hub ^(!DOCKERHUB_USER!^)...
  call "%~dp0push-dockerhub.bat" iot-font
  if errorlevel 1 exit /b 1
)

echo Saving font.tar...
docker save -o font.tar iot-font:latest
if errorlevel 1 exit /b 1

echo.
echo Done. Run copy-font-to-server.bat or deploy-font-to-server.bat
