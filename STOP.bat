@echo off
setlocal
cd /d "%~dp0"

if not exist ".server.pid" (
  echo MASCO Election Server-এর PID file পাওয়া যায়নি।
  echo Server সম্ভবত ইতিমধ্যে বন্ধ আছে।
  timeout /t 2 >nul
  exit /b 0
)

set /p PID=<.server.pid
if "%PID%"=="" (
  echo PID পাওয়া যায়নি।
  del /q .server.pid >nul 2>nul
  exit /b 1
)

echo MASCO Election Server বন্ধ করা হচ্ছে... PID %PID%
taskkill /PID %PID% /T /F >nul 2>nul
if errorlevel 1 (
  echo Process পাওয়া যায়নি; PID file পরিষ্কার করা হচ্ছে।
) else (
  echo Server বন্ধ হয়েছে।
)

del /q .server.pid >nul 2>nul
exit /b 0
