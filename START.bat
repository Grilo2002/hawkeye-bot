@echo off
title 🦅 HawkEye Bot
color 0A

echo.
echo  ██╗  ██╗ █████╗ ██╗    ██╗██╗  ██╗███████╗██╗   ██╗███████╗
echo  ██║  ██║██╔══██╗██║    ██║██║ ██╔╝██╔════╝╚██╗ ██╔╝██╔════╝
echo  ███████║███████║██║ █╗ ██║█████╔╝ █████╗   ╚████╔╝ █████╗
echo  ██╔══██║██╔══██║██║███╗██║██╔═██╗ ██╔══╝    ╚██╔╝  ██╔══╝
echo  ██║  ██║██║  ██║╚███╔███╔╝██║  ██╗███████╗   ██║   ███████╗
echo  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝
echo.
echo  Ultimate Edition - Starting...
echo  ─────────────────────────────────────────────────────────────
echo.

:: Go to the bot folder (same folder as this .bat file)
cd /d "%~dp0"

:: Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found! Please install Python from python.org
    pause
    exit
)

:: Check bot.py exists
if not exist "bot.py" (
    echo  [ERROR] bot.py not found in this folder!
    echo  Make sure START.bat is in the same folder as bot.py
    pause
    exit
)

:: Check .env exists
if not exist ".env" (
    echo  [WARNING] .env file not found!
    echo  Copy .env.example to .env and fill in your tokens.
    pause
    exit
)

echo  [OK] All checks passed. Starting HawkEye...
echo  [OK] Press CTRL+C to stop the bot.
echo.

:start
python bot.py
echo.
echo  [!] Bot stopped or crashed.
echo  [!] Restarting in 5 seconds... Press CTRL+C to exit.
timeout /t 5
goto start
