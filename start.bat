@echo off
title Sales Analysis App
color 0A

echo.
echo  =====================================================
echo   Sales Analysis ^& Future Sales Prediction App
echo  =====================================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found. Install from https://python.org
    pause & exit /b
)

:: Install Python deps silently if missing
echo  Checking Python dependencies...
pip install fastapi "uvicorn[standard]" pandas numpy scikit-learn joblib python-multipart -q 2>nul

echo  Starting app...
echo.
echo  Open your browser at:  http://localhost:8000
echo.
echo  (Close this window to stop the server)
echo.

cd /d "%~dp0backend"
start "" "http://localhost:8000"
python run_backend.py

pause
