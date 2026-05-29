@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not defined IOT_SERVER set "IOT_SERVER=192.168.88.5"
if not defined IOT_REMOTE_DIR set "IOT_REMOTE_DIR=/home/ky/iot"

if not defined IOT_SSH_USER (
  echo IOT_SSH_USER is not set. Run makedocker.bat or set variables first.
  exit /b 1
)

set "SSH_TARGET=%IOT_SSH_USER%@%IOT_SERVER%"

for %%F in (api.tar font.tar run.sh) do (
  if not exist "%%F" (
    echo Missing %%F — run makedocker.bat first.
    exit /b 1
  )
)

echo Normalizing line endings for run.sh...
powershell -NoProfile -Command "$p='%CD%'; $f='run.sh'; $path=Join-Path $p $f; $t=[IO.File]::ReadAllText($path) -replace \"`r`n\",\"`n\" -replace \"`r\",\"`n\"; [IO.File]::WriteAllText($path,$t,(New-Object Text.UTF8Encoding $false))"

echo Creating remote folder %IOT_REMOTE_DIR% ...
ssh "%SSH_TARGET%" "mkdir -p %IOT_REMOTE_DIR%"
if errorlevel 1 exit /b 1

echo Copying to %SSH_TARGET%:%IOT_REMOTE_DIR% ...
scp api.tar font.tar run.sh "%SSH_TARGET%:%IOT_REMOTE_DIR%/"
if errorlevel 1 exit /b 1

echo.
echo Copy finished: %SSH_TARGET%:%IOT_REMOTE_DIR%
