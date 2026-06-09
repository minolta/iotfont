@echo off
setlocal EnableExtensions EnableDelayedExpansion
rem Push local images to Docker Hub. Requires DOCKERHUB_USER.
rem Optional: DOCKERHUB_TAG (default latest), DOCKERHUB_TOKEN (auto docker login)
if not defined DOCKERHUB_USER exit /b 0
if not defined DOCKERHUB_TAG set "DOCKERHUB_TAG=latest"

if defined DOCKERHUB_TOKEN (
  echo Logging in to Docker Hub as !DOCKERHUB_USER!...
  echo(!DOCKERHUB_TOKEN!| docker login -u "!DOCKERHUB_USER!" --password-stdin
  if errorlevel 1 exit /b 1
)

if "%~1"=="" (
  echo No images specified for push-dockerhub.bat
  exit /b 1
)

:push_loop
if "%~1"=="" goto push_done
set "IMG=%~1"
set "REMOTE=!DOCKERHUB_USER!/!IMG!:!DOCKERHUB_TAG!"
echo Tagging !IMG!:latest as !REMOTE! ...
docker tag "!IMG!:latest" "!REMOTE!"
if errorlevel 1 exit /b 1
echo Pushing !REMOTE! ...
docker push "!REMOTE!"
if errorlevel 1 exit /b 1
shift
goto push_loop

:push_done
echo Docker Hub push finished.
exit /b 0
