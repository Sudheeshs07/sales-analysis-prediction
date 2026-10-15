"""
FastAPI backend for Sales Analysis & Prediction dashboard.

Endpoints:
  GET  /api/health
  GET  /api/dataset
  GET  /api/kpis
  GET  /api/sales-trend
  GET  /api/category-analysis
  GET  /api/regional-analysis
  GET  /api/product-analysis
  GET  /api/recent-sales
  GET  /api/sales-analysis
  GET  /api/prediction-options
  GET  /api/model-metrics
  POST /api/predict
  POST /api/upload-csv
  POST /api/train
"""

import io
import os
import json
import warnings
import traceback
from typing import Optional
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

# ── app setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="Sales Analysis API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model_artifact.pkl")
DATA_PATH  = os.path.join(BASE_DIR, "sales_data.csv")

# ── global state ──────────────────────────────────────────────────────────────
_df: Optional[pd.DataFrame] = None
_artifact: Optional[dict]   = None


# ══════════════════════════════════════════════════════════════════════════════
# Data helpers
# ══════════════════════════════════════════════════════════════════════════════

def get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        _df = _load_or_generate()
    return _df


def _load_or_generate() -> pd.DataFrame:
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH, parse_dates=["Order_Date"])
    else:
        from data_generator import generate_dataset
        df = generate_dataset(2000)
        df.to_csv(DATA_PATH, index=False)
        df["Order_Date"] = pd.to_datetime(df["Order_Date"])
    df = _clean(df)
    return df


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    """Normalise column names and ensure correct dtypes."""
    df.columns = [c.strip() for c in df.columns]

    # Accept flexible CSV column naming
    rename = {}
    col_map = {
        "order_id":    "Order_ID",
        "order_date":  "Order_Date",
        "product":     "Product",
        "category":    "Category",
        "region":      "Region",
        "quantity":    "Quantity",
        "sales":       "Sales",
        "discount":    "Discount",
        "profit":      "Profit",
    }
    for c in df.columns:
        low = c.lower().replace(" ", "_")
        if low in col_map and c != col_map[low]:
            rename[c] = col_map[low]
    if rename:
        df = df.rename(columns=rename)

    required = ["Order_Date", "Product", "Category", "Region", "Quantity", "Sales", "Discount", "Profit"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")

    if not pd.api.types.is_datetime64_any_dtype(df["Order_Date"]):
        df["Order_Date"] = pd.to_datetime(df["Order_Date"], infer_datetime_format=True)

    for col in ["Quantity", "Sales", "Discount", "Profit"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["Order_Date", "Sales"])
    df["Year"]  = df["Order_Date"].dt.year
    df["Month"] = df["Order_Date"].dt.month
    df["Quarter"] = df["Order_Date"].dt.quarter
    df["Month_Name"] = df["Order_Date"].dt.strftime("%b")
    df["YearMonth"] = df["Order_Date"].dt.to_period("M").astype(str)
    return df


def _apply_filters(df: pd.DataFrame, start_date=None, end_date=None,
                   category=None, region=None, product=None) -> pd.DataFrame:
    if start_date:
        df = df[df["Order_Date"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["Order_Date"] <= pd.to_datetime(end_date)]
    if category and category != "All":
        df = df[df["Category"] == category]
    if region and region != "All":
        df = df[df["Region"] == region]
    if product and product != "All":
        df = df[df["Product"] == product]
    return df


# ══════════════════════════════════════════════════════════════════════════════
# ML helpers
# ══════════════════════════════════════════════════════════════════════════════

def train_models(df: pd.DataFrame) -> dict:
    """Train LinearRegression + RandomForest, return artifact."""
    work = df.copy()
    work = work.sort_values("Order_Date").reset_index(drop=True)

    encoders: dict[str, LabelEncoder] = {}
    for col in ["Category", "Region"]:
        le = LabelEncoder()
        work[col + "_enc"] = le.fit_transform(work[col].astype(str))
        encoders[col] = le

    feature_cols = ["Month", "Year", "Quantity", "Discount", "Category_enc", "Region_enc"]
    X = work[feature_cols].values.astype(np.float64)
    y = work["Sales"].values.astype(np.float64)

    # Chronological split
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    results = {}

    # Linear Regression
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    results["Linear Regression"] = {
        "model": lr,
        "mae":  round(float(mean_absolute_error(y_test, y_pred_lr)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred_lr))), 2),
        "r2":   round(float(r2_score(y_test, y_pred_lr)), 4),
        "y_test": y_test.tolist(),
        "y_pred": y_pred_lr.tolist(),
    }

    # Random Forest
    rf = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    fi = dict(zip(feature_cols, [round(float(v), 4) for v in rf.feature_importances_]))
    results["Random Forest"] = {
        "model": rf,
        "mae":  round(float(mean_absolute_error(y_test, y_pred_rf)), 2),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, y_pred_rf))), 2),
        "r2":   round(float(r2_score(y_test, y_pred_rf)), 4),
        "y_test": y_test.tolist(),
        "y_pred": y_pred_rf.tolist(),
        "feature_importances": fi,
    }

    # Pick best by R²
    best_name = max(results, key=lambda k: results[k]["r2"])

    # Future forecast (next 6 months from last date)
    last_date = work["Order_Date"].max()
    future = []
    for m in range(1, 7):
        fdate = last_date + pd.DateOffset(months=m)
        row = np.array([[fdate.month, fdate.year,
                         int(work["Quantity"].mean()),
                         float(work["Discount"].mean()),
                         0, 0]], dtype=np.float64)
        pred = float(results[best_name]["model"].predict(row)[0])
        future.append({"period": str(fdate.to_period("M")), "predicted_sales": round(pred, 2)})

    artifact = {
        "encoders": encoders,
        "feature_cols": feature_cols,
        "best_model": best_name,
        "results": {k: {m: v for m, v in v2.items() if m != "model"} for k, v2 in results.items()},
        "models": {k: v["model"] for k, v in results.items()},
        "future_forecast": future,
        "categories": sorted(work["Category"].unique().tolist()),
        "regions": sorted(work["Region"].unique().tolist()),
    }
    joblib.dump(artifact, MODEL_PATH)
    return artifact


def get_artifact() -> dict:
    global _artifact
    if _artifact is None:
        if os.path.exists(MODEL_PATH):
            _artifact = joblib.load(MODEL_PATH)
        else:
            _artifact = train_models(get_df())
    return _artifact


# ══════════════════════════════════════════════════════════════════════════════
# Endpoints
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/dataset")
def dataset(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: str = Query(""),
    sort_by: str = Query("Order_Date"),
    sort_dir: str = Query("desc"),
    category: str = Query("All"),
    region: str = Query("All"),
):
    df = get_df().copy()
    if category != "All":
        df = df[df["Category"] == category]
    if region != "All":
        df = df[df["Region"] == region]
    if search:
        mask = df.apply(lambda row: search.lower() in " ".join(row.astype(str)).lower(), axis=1)
        df = df[mask]
    valid_cols = [c for c in df.columns if c in df.columns]
    if sort_by in valid_cols:
        df = df.sort_values(sort_by, ascending=(sort_dir == "asc"))
    total = len(df)
    start = (page - 1) * page_size
    page_df = df.iloc[start: start + page_size]
    disp_cols = ["Order_ID", "Order_Date", "Product", "Category", "Region", "Quantity", "Sales", "Discount", "Profit"]
    disp_cols = [c for c in disp_cols if c in page_df.columns]
    page_df = page_df[disp_cols].copy()
    page_df["Order_Date"] = page_df["Order_Date"].dt.strftime("%Y-%m-%d")
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": page_df.to_dict(orient="records"),
        "categories": ["All"] + sorted(get_df()["Category"].unique().tolist()),
        "regions": ["All"] + sorted(get_df()["Region"].unique().tolist()),
    }


@app.get("/api/kpis")
def kpis(
    start_date: str = Query(None),
    end_date: str = Query(None),
    category: str = Query("All"),
    region: str = Query("All"),
    product: str = Query("All"),
):
    df = _apply_filters(get_df(), start_date, end_date, category, region, product)
    if df.empty:
        return {"total_sales": 0, "total_profit": 0, "total_orders": 0,
                "total_quantity": 0, "avg_order_value": 0}
    return {
        "total_sales":      round(float(df["Sales"].sum()), 2),
        "total_profit":     round(float(df["Profit"].sum()), 2),
        "total_orders":     int(len(df)),
        "total_quantity":   int(df["Quantity"].sum()),
        "avg_order_value":  round(float(df["Sales"].mean()), 2),
    }


@app.get("/api/sales-trend")
def sales_trend(
    granularity: str = Query("monthly"),
    start_date: str = Query(None),
    end_date: str = Query(None),
    category: str = Query("All"),
    region: str = Query("All"),
):
    df = _apply_filters(get_df(), start_date, end_date, category, region)
    if df.empty:
        return {"trend": []}
    if granularity == "yearly":
        grp = df.groupby("Year").agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Sales", "count")).reset_index()
        grp["period"] = grp["Year"].astype(str)
    else:
        grp = df.groupby("YearMonth").agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Sales", "count")).reset_index()
        grp = grp.sort_values("YearMonth")
        grp["period"] = grp["YearMonth"]

    grp["Sales"]  = grp["Sales"].round(2)
    grp["Profit"] = grp["Profit"].round(2)
    return {"trend": grp[["period", "Sales", "Profit", "Orders"]].to_dict(orient="records")}


@app.get("/api/category-analysis")
def category_analysis(
    start_date: str = Query(None),
    end_date: str = Query(None),
    region: str = Query("All"),
):
    df = _apply_filters(get_df(), start_date, end_date, region=region)
    if df.empty:
        return {"categories": []}
    grp = df.groupby("Category").agg(
        Sales=("Sales", "sum"),
        Profit=("Profit", "sum"),
        Orders=("Sales", "count"),
        Quantity=("Quantity", "sum"),
    ).reset_index()
    grp["Profit_Margin"] = ((grp["Profit"] / grp["Sales"]) * 100).round(2)
    grp = grp.sort_values("Sales", ascending=False)
    grp[["Sales", "Profit"]] = grp[["Sales", "Profit"]].round(2)
    return {"categories": grp.to_dict(orient="records")}


@app.get("/api/regional-analysis")
def regional_analysis(
    start_date: str = Query(None),
    end_date: str = Query(None),
    category: str = Query("All"),
):
    df = _apply_filters(get_df(), start_date, end_date, category=category)
    if df.empty:
        return {"regions": []}
    grp = df.groupby("Region").agg(
        Sales=("Sales", "sum"),
        Profit=("Profit", "sum"),
        Orders=("Sales", "count"),
        Quantity=("Quantity", "sum"),
    ).reset_index()
    grp["Profit_Margin"] = ((grp["Profit"] / grp["Sales"]) * 100).round(2)
    grp = grp.sort_values("Sales", ascending=False)
    grp[["Sales", "Profit"]] = grp[["Sales", "Profit"]].round(2)

    # Month-over-month by region
    monthly = df.groupby(["Region", "YearMonth"]).agg(Sales=("Sales", "sum")).reset_index()
    monthly = monthly.sort_values(["Region", "YearMonth"])
    regional_trends = {}
    for reg, rdf in monthly.groupby("Region"):
        regional_trends[reg] = rdf[["YearMonth", "Sales"]].rename(
            columns={"YearMonth": "period", "Sales": "sales"}
        ).to_dict(orient="records")

    return {
        "regions": grp.to_dict(orient="records"),
        "regional_trends": regional_trends,
    }


@app.get("/api/product-analysis")
def product_analysis(
    start_date: str = Query(None),
    end_date: str = Query(None),
    category: str = Query("All"),
    region: str = Query("All"),
    limit: int = Query(10),
):
    df = _apply_filters(get_df(), start_date, end_date, category, region)
    if df.empty:
        return {"top_products": [], "bottom_products": []}
    grp = df.groupby(["Product", "Category"]).agg(
        Sales=("Sales", "sum"),
        Profit=("Profit", "sum"),
        Quantity=("Quantity", "sum"),
        Orders=("Sales", "count"),
    ).reset_index()
    grp["Profit_Margin"] = ((grp["Profit"] / grp["Sales"]) * 100).round(2)
    grp[["Sales", "Profit"]] = grp[["Sales", "Profit"]].round(2)
    top    = grp.nlargest(limit, "Sales").to_dict(orient="records")
    bottom = grp.nsmallest(limit, "Sales").to_dict(orient="records")
    return {"top_products": top, "bottom_products": bottom}


@app.get("/api/recent-sales")
def recent_sales(limit: int = Query(10)):
    df = get_df().copy()
    df = df.sort_values("Order_Date", ascending=False).head(limit)
    disp = ["Order_ID", "Order_Date", "Product", "Category", "Region", "Quantity", "Sales", "Discount", "Profit"]
    disp = [c for c in disp if c in df.columns]
    df = df[disp].copy()
    df["Order_Date"] = df["Order_Date"].dt.strftime("%Y-%m-%d")
    df["Sales"]   = df["Sales"].round(2)
    df["Profit"]  = df["Profit"].round(2)
    return {"records": df.to_dict(orient="records")}


@app.get("/api/sales-analysis")
def sales_analysis_page(
    start_date: str = Query(None),
    end_date: str = Query(None),
    category: str = Query("All"),
    region: str = Query("All"),
):
    df = _apply_filters(get_df(), start_date, end_date, category, region)
    if df.empty:
        return {}

    # Growth month-over-month
    monthly = df.groupby("YearMonth")["Sales"].sum().reset_index().sort_values("YearMonth")
    monthly["Growth"] = monthly["Sales"].pct_change() * 100
    monthly["Growth"] = monthly["Growth"].round(2).fillna(0)

    # Discount vs Sales scatter
    disc_sales = df[["Discount", "Sales", "Category"]].copy()
    disc_sales["Sales"] = disc_sales["Sales"].round(2)

    # Quantity vs Sales
    qty_sales = df[["Quantity", "Sales", "Category"]].copy()

    # Category performance
    cat_perf = df.groupby("Category").agg(
        Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Sales", "count")
    ).reset_index()
    cat_perf["Profit_Margin"] = ((cat_perf["Profit"] / cat_perf["Sales"]) * 100).round(2)

    # Insights (auto-generated)
    total_sales = df["Sales"].sum()
    top_cat   = cat_perf.loc[cat_perf["Sales"].idxmax(), "Category"]
    top_cat_share = round(cat_perf["Sales"].max() / total_sales * 100, 1)
    avg_discount  = round(df["Discount"].mean() * 100, 1)
    corr_disc = round(df["Discount"].corr(df["Sales"]), 3)
    corr_qty  = round(df["Quantity"].corr(df["Sales"]), 3)

    insights = [
        f"📦 Top category is **{top_cat}** contributing **{top_cat_share}%** of total sales.",
        f"🏷️ Average discount across all orders is **{avg_discount}%**.",
        f"📉 Discount-Sales correlation: **{corr_disc}** ({'positive' if corr_disc > 0 else 'negative'}).",
        f"📈 Quantity-Sales correlation: **{corr_qty}** ({'positive' if corr_qty > 0 else 'negative'}).",
    ]
    if monthly["Sales"].iloc[-1] > monthly["Sales"].iloc[-2] if len(monthly) > 1 else False:
        insights.append("📊 Sales are **trending upward** in the latest period.")
    else:
        insights.append("📊 Sales showed a **dip** in the most recent period.")

    # Top region
    top_region = df.groupby("Region")["Sales"].sum().idxmax()
    insights.append(f"🌍 Highest sales region: **{top_region}**.")

    return {
        "monthly_trend": monthly.rename(columns={"YearMonth": "period", "Sales": "sales"}).to_dict(orient="records"),
        "discount_scatter": disc_sales.sample(min(500, len(disc_sales)), random_state=42).to_dict(orient="records"),
        "qty_scatter": qty_sales.sample(min(500, len(qty_sales)), random_state=42).to_dict(orient="records"),
        "category_performance": cat_perf.to_dict(orient="records"),
        "insights": insights,
    }


@app.get("/api/prediction-options")
def prediction_options():
    df = get_df()
    return {
        "categories": sorted(df["Category"].unique().tolist()),
        "regions":    sorted(df["Region"].unique().tolist()),
        "products":   sorted(df["Product"].unique().tolist()),
    }


@app.get("/api/model-metrics")
def model_metrics():
    art = get_artifact()
    return {
        "best_model": art["best_model"],
        "results": {k: {m: v for m, v in v2.items() if m not in ("y_test", "y_pred")}
                    for k, v2 in art["results"].items()},
        "actual_vs_predicted": {
            k: {"actual": v["y_test"][:100], "predicted": v["y_pred"][:100]}
            for k, v in art["results"].items()
        },
        "future_forecast": art["future_forecast"],
    }


class PredictRequest(BaseModel):
    category: str
    region: str
    quantity: int
    discount: float
    month: int
    year: int = 2024
    model_name: str = "Random Forest"


@app.post("/api/predict")
def predict(req: PredictRequest):
    art = get_artifact()
    enc = art["encoders"]

    def safe_enc(le: LabelEncoder, val: str) -> int:
        classes = le.classes_.tolist()
        return classes.index(val) if val in classes else 0

    cat_enc = safe_enc(enc["Category"], req.category)
    reg_enc = safe_enc(enc["Region"],   req.region)

    X = np.array([[req.month, req.year, req.quantity, req.discount, cat_enc, reg_enc]], dtype=np.float64)

    model_key = req.model_name if req.model_name in art["models"] else art["best_model"]
    model = art["models"][model_key]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        pred = float(model.predict(X)[0])

    metrics = art["results"][model_key]
    return {
        "predicted_sales": round(pred, 2),
        "model_used": model_key,
        "mae":  metrics["mae"],
        "rmse": metrics["rmse"],
        "r2":   metrics["r2"],
        "future_forecast": art["future_forecast"],
    }


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    global _df, _artifact
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        df = _clean(df)
        # persist
        df.to_csv(DATA_PATH, index=False)
        _df = df
        _artifact = None  # force retrain
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)
        # retrain in background (sync is fine for small datasets)
        _artifact = train_models(_df)
        return {
            "success": True,
            "rows": len(df),
            "columns": df.columns.tolist(),
            "message": f"Dataset uploaded successfully ({len(df)} rows). Model retrained.",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/train")
def retrain():
    global _artifact
    _artifact = None
    if os.path.exists(MODEL_PATH):
        os.remove(MODEL_PATH)
    try:
        _artifact = train_models(get_df())
        best = _artifact["best_model"]
        m = _artifact["results"][best]
        return {
            "success": True,
            "best_model": best,
            "mae": m["mae"], "rmse": m["rmse"], "r2": m["r2"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/filters-options")
def filters_options():
    df = get_df()
    return {
        "categories": ["All"] + sorted(df["Category"].unique().tolist()),
        "regions":    ["All"] + sorted(df["Region"].unique().tolist()),
        "products":   ["All"] + sorted(df["Product"].unique().tolist()),
        "date_min":   df["Order_Date"].min().strftime("%Y-%m-%d"),
        "date_max":   df["Order_Date"].max().strftime("%Y-%m-%d"),
    }


# ── Serve built React frontend ────────────────────────────────────────────────
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        # Don't intercept /api/* routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        raise HTTPException(status_code=404, detail="Frontend not built")


# Startup: pre-load data + model
@app.on_event("startup")
async def startup():
    try:
        get_df()
        get_artifact()
        print("Data and model loaded OK.")
    except Exception as e:
        print(f"Startup warning: {e}")
