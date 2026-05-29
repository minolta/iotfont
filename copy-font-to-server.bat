@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not defined IOT_SERVER set "IOT_SERVER=192.168.88.5"
if not defined IOT_REMOTE_DIR set "IOT_REMOTE_DIR=/home/ky/iot"

if not defined IOT_SSH_USER (
  echo IOT_SSH_USER is not set. Run makedocker-font.bat or set variables first.
  exit /b 1
)

if not exist "font.tar" (
  echo Missing font.tar — run makedocker-font.bat first.
  exit /b 1
)

set "SSH_TARGET=%IOT_SSH_USER%@%IOT_SERVER%"

echo Creating remote folder %IOT_REMOTE_DIR% ...
ssh "%SSH_TARGET%" "mkdir -p %IOT_REMOTE_DIR%"
if errorlevel 1 exit /b 1

echo Copying font.tar to %SSH_TARGET%:%IOT_REMOTE_DIR% ...
scp font.tar "%SSH_TARGET%:%IOT_REMOTE_DIR%/"
if errorlevel 1 exit /b 1

echo.
echo Copy finished: %SSH_TARGET%:%IOT_REMOTE_DIR%/font.tar
