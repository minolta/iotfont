@echo off
setlocal EnableExtensions EnableDelayedExpansion
rem Caller sets REMOTE_AUTH_CMD=ssh or scp, then: call remote-auth.bat [args...]
if not defined REMOTE_AUTH_CMD exit /b 1
set "REMOTE_ARGS=%*"

if defined PASS set "PASS=!PASS:"=!"

if /I "!REMOTE_AUTH_CMD!"=="ssh" goto :do_ssh
if /I not "!REMOTE_AUTH_CMD!"=="scp" exit /b 1
goto :do_scp

:find_plink
set "PLINK_EXE="
where plink >nul 2>&1 && set "PLINK_EXE=plink"
if not defined PLINK_EXE if exist "%ProgramFiles%\PuTTY\plink.exe" set "PLINK_EXE=%ProgramFiles%\PuTTY\plink.exe"
if not defined PLINK_EXE if exist "%ProgramFiles(x86)%\PuTTY\plink.exe" set "PLINK_EXE=%ProgramFiles(x86)%\PuTTY\plink.exe"
exit /b 0

:find_pscp
set "PSCP_EXE="
where pscp >nul 2>&1 && set "PSCP_EXE=pscp"
if not defined PSCP_EXE if exist "%ProgramFiles%\PuTTY\pscp.exe" set "PSCP_EXE=%ProgramFiles%\PuTTY\pscp.exe"
if not defined PSCP_EXE if exist "%ProgramFiles(x86)%\PuTTY\pscp.exe" set "PSCP_EXE=%ProgramFiles(x86)%\PuTTY\pscp.exe"
exit /b 0

:plink_run
"%PLINK_EXE%" -batch -ssh -pw "!PASS!" !REMOTE_ARGS!
if !errorlevel! equ 0 exit /b 0
echo y| "%PLINK_EXE%" -ssh -pw "!PASS!" !REMOTE_ARGS!
exit /b !errorlevel!

:pscp_run
"%PSCP_EXE%" -batch -pw "!PASS!" !REMOTE_ARGS!
if !errorlevel! equ 0 exit /b 0
echo y| "%PSCP_EXE%" -pw "!PASS!" !REMOTE_ARGS!
exit /b !errorlevel!

:do_ssh
if not defined PASS goto :do_ssh_key
call :find_plink
if defined PLINK_EXE (
  echo Using PuTTY plink for password login...
  call :plink_run
  exit /b !errorlevel!
)
where sshpass >nul 2>&1
if !errorlevel! equ 0 (
  echo Using sshpass for password login...
  sshpass -p "!PASS!" ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password !REMOTE_ARGS!
  exit /b !errorlevel!
)
set "SSH_ASKPASS=%~dp0ssh-askpass.cmd"
set "SSH_ASKPASS_REQUIRE=force"
set "DISPLAY=localhost:0"
echo Using SSH_ASKPASS for password login...
ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no !REMOTE_ARGS!
exit /b !errorlevel!

:do_ssh_key
if not defined PASS echo PASS is not set — using SSH key only. To use password: set PASS=yourpassword
ssh !REMOTE_ARGS!
exit /b !errorlevel!

:do_scp
if not defined PASS goto :do_scp_key
call :find_pscp
if defined PSCP_EXE (
  echo Using PuTTY pscp for password login...
  call :pscp_run
  exit /b !errorlevel!
)
where sshpass >nul 2>&1
if !errorlevel! equ 0 (
  echo Using sshpass for password login...
  sshpass -p "!PASS!" scp -o PubkeyAuthentication=no -o PreferredAuthentications=password !REMOTE_ARGS!
  exit /b !errorlevel!
)
set "SSH_ASKPASS=%~dp0ssh-askpass.cmd"
set "SSH_ASKPASS_REQUIRE=force"
set "DISPLAY=localhost:0"
echo Using SSH_ASKPASS for password login...
scp -o PubkeyAuthentication=no -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no !REMOTE_ARGS!
exit /b !errorlevel!

:do_scp_key
if not defined PASS echo PASS is not set — using SSH key only. To use password: set PASS=yourpassword
scp !REMOTE_ARGS!
exit /b !errorlevel!
