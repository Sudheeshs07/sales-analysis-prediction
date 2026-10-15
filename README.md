# Sales Analysis & Future Sales Prediction
## Quick Start Guide

---

### Option 1 — One-click launch (Windows)
```
Double-click:  sales-analysis-app\start.bat
```
This opens two terminal windows (backend + frontend) and launches the browser automatically.

---

### Option 2 — Manual launch (2 terminals)

**Terminal 1 — Backend (FastAPI + ML)**
```powershell
cd sales-analysis-app\backend
pip install -r requirements.txt   # first time only
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend (React + Vite)**
```powershell
cd sales-analysis-app\frontend
npm install    # first time only
npm run dev
```

---

### URLs

| Service      | URL                           |
|--------------|-------------------------------|
| **App**      | http://localhost:3000         |
| Backend API  | http://localhost:8000         |
| API Docs     | http://localhost:8000/docs    |

---

### Pages

| Page               | What it shows |
|--------------------|---------------|
| Dashboard          | KPIs, trend charts, top products, recent sales |
| Sales Analysis     | Monthly trend, growth %, category performance, scatter charts, auto insights |
| Product Analysis   | Top/bottom products by sales, profit, margin |
| Regional Analysis  | Region comparison bar/radar, trend line per region |
| Sales Prediction   | Interactive ML form (Linear Regression + Random Forest), Actual vs Predicted, 6-month forecast |
| Data Explorer      | Browse/search 2,000 rows, upload custom CSV → auto-retrain |
| About Project      | Tech stack, dataset description, ML methodology |

---

### Dataset

A **synthetic dataset of 2,000 records (2021–2023)** is auto-generated on first run with realistic:
- Seasonal patterns (Q4 holiday uplift, Q1 slowdown)
- 5 categories: Technology, Furniture, Office Supplies, Clothing, Electronics
- 5 regions: North, South, East, West, Central
- Columns: `Order_ID, Order_Date, Product, Category, Region, Quantity, Sales, Discount, Profit`

You can upload your own CSV from the **Data Explorer** page — the app validates, cleans and retrains both ML models automatically.
