@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem ============ EDIT THESE ============
set "IOT_SSH_USER=ky"
set "IOT_SERVER=192.168.88.5"
set "IOT_REMOTE_DIR=/home/ky/iot"
rem =====================================

if exist "%~dp0makedocker.local.bat" call "%~dp0makedocker.local.bat"

if /I "%~1"=="local" goto :local

if "%IOT_SSH_USER%"=="" (
  echo Set IOT_SSH_USER in run.bat
  exit /b 1
)

set "SSH_TARGET=%IOT_SSH_USER%@%IOT_SERVER%"
set "RUN_ARG="
if /I "%~1"=="run" set "RUN_ARG=run"

echo Running run.sh on %SSH_TARGET%:%IOT_REMOTE_DIR% ...
ssh "%SSH_TARGET%" "cd %IOT_REMOTE_DIR% && sed -i 's/\r$//' run.sh && chmod +x run.sh && ./run.sh %RUN_ARG%"
if errorlevel 1 exit /b 1

echo.
echo UI:  http://%IOT_SERVER%:8080
echo API: http://%IOT_SERVER%:888
exit /b 0

:local
bash "%~dp0run.sh"
exit /b %errorlevel%
