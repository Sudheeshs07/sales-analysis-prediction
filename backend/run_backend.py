"""
Run this file to start the full app (backend + serves the React frontend).
  python run_backend.py

Then open:  http://localhost:8000
"""
import os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
print("=" * 52)
print("  Sales Analysis & Future Sales Prediction App")
print("=" * 52)
print("  Open in browser:  http://localhost:8000")
print("  API docs:         http://localhost:8000/docs")
print("=" * 52)
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
