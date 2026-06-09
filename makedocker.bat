@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem Optional password (no SSH key): set before call, e.g. set PASS=yourpassword
if defined PASS (
  set "PASS=%PASS:"=%"
  echo Using SSH password from PASS environment variable.
)

rem ============ EDIT THESE ============
set "IOT_SSH_USER=ky"
set "IOT_SERVER=192.168.88.5"
set "IOT_REMOTE_DIR=/home/ky/iot"
rem Docker Hub (optional): set user to tag + push after build
rem set "DOCKERHUB_USER=yourdockerhubuser"
rem set "DOCKERHUB_TAG=latest"
rem set "DOCKERHUB_TOKEN=your_token"
rem =====================================

if exist "%~dp0makedocker.local.bat" call "%~dp0makedocker.local.bat"

if "%IOT_SSH_USER%"=="" (
  echo Set IOT_SSH_USER in makedocker.bat
  exit /b 1
)

echo Building iot-api...
pushd "%~dp0..\..\api\iot"
docker build -t iot-api:latest .
if errorlevel 1 exit /b 1
popd

echo Building iot-font...
docker build -t iot-font:latest .
if errorlevel 1 exit /b 1

if defined DOCKERHUB_USER (
  echo.
  echo Pushing to Docker Hub ^(!DOCKERHUB_USER!^)...
  call "%~dp0push-dockerhub.bat" iot-api iot-font
  if errorlevel 1 exit /b 1
)

echo Saving images...
docker save -o api.tar iot-api:latest
docker save -o font.tar iot-font:latest
if errorlevel 1 exit /b 1

echo.
echo Copying to %IOT_SSH_USER%@%IOT_SERVER%:%IOT_REMOTE_DIR% ...
call "%~dp0copy-to-server.bat"
if errorlevel 1 exit /b 1

echo.
echo Running run.sh on server...
call "%~dp0run.bat"
exit /b %errorlevel%
