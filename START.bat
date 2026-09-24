@echo off
setlocal
cd /d "%~dp0"
title MASCO Election Node Server
cls

echo ==============================================
echo   MASCO Election Portal - Node Server
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js LTS, reopen Command Prompt, then run START.bat again.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo Node.js: %%v
echo.
echo Starting server...
echo Keep this window open. Press Ctrl + C to stop.
echo.
node server.js

if errorlevel 1 (
  echo.
  echo Server stopped with an error.
  pause
)
