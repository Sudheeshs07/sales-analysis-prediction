@echo off
title Sales Analysis App - Quick Start
color 0A
setlocal enabledelayedexpansion

echo.
echo  =====================================================
echo   Sales Analysis & Future Sales Prediction App
echo  =====================================================
echo.

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install from https://python.org
    pause & exit /b
)

:: Check Node (for frontend)
node --version >nul 2>&1
if errorlevel 1 (
    echo  WARNING: Node.js not found. Frontend will not start automatically.
    set "NODE_OK=0"
) else (
    set "NODE_OK=1"
)

echo.
echo  Starting backend in a new terminal...
start "Backend" /D "%BACKEND_DIR%" cmd /k "if not exist .venv (python -m venv .venv) && call .venv\Scripts\activate && pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo  Starting frontend (if Node.js is available)...
if "%NODE_OK%"=="1" (
    start "Frontend" /D "%FRONTEND_DIR%" cmd /k "npm install && npm run dev"
    timeout /t 5 /nobreak >nul
    echo  Opening browser at http://localhost:3000 ...
    start "" "http://localhost:3000"
) else (
    echo  Frontend start skipped because Node.js was not found on PATH.
    echo  You can start the frontend manually: cd frontend && npm install && npm run dev
    echo  Opening backend docs at http://localhost:8000/docs ...
    timeout /t 3 /nobreak >nul
    start "" "http://localhost:8000/docs"
)

echo.
echo  Waiting for startup to complete...
echo  To stop the servers, close the Backend and Frontend terminal windows.
echo.
pause
