@echo off
call "%~dp0makedocker.bat"
if errorlevel 1 exit /b 1
call "%~dp0run.bat"
exit /b %errorlevel%
