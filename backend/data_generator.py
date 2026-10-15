"""
Synthetic sales dataset generator with realistic seasonal patterns.
Produces 2,000 rows with Order_ID, Order_Date, Product, Category,
Region, Quantity, Sales, Discount, Profit.
"""
import numpy as np
import pandas as pd
from datetime import date, timedelta
import random, string

CATEGORIES = {
    "Technology": ["Laptop", "Smartphone", "Tablet", "Monitor", "Keyboard", "Mouse", "Printer", "Headphones"],
    "Furniture": ["Office Chair", "Desk", "Bookshelf", "Filing Cabinet", "Standing Desk", "Conference Table"],
    "Office Supplies": ["Paper Ream", "Pens Set", "Stapler", "Binder", "Highlighters", "Tape", "Scissors"],
    "Clothing": ["T-Shirt", "Jeans", "Jacket", "Shoes", "Sneakers", "Socks", "Belt"],
    "Electronics": ["Smart TV", "Camera", "Speaker", "Charger", "USB Hub", "Router", "SSD Drive"],
}

REGIONS = ["North", "South", "East", "West", "Central"]

BASE_PRICES = {
    "Laptop": 1200, "Smartphone": 800, "Tablet": 600, "Monitor": 450, "Keyboard": 90,
    "Mouse": 45, "Printer": 350, "Headphones": 180, "Office Chair": 320, "Desk": 480,
    "Bookshelf": 210, "Filing Cabinet": 250, "Standing Desk": 680, "Conference Table": 900,
    "Paper Ream": 25, "Pens Set": 15, "Stapler": 30, "Binder": 18, "Highlighters": 12,
    "Tape": 8, "Scissors": 14, "T-Shirt": 45, "Jeans": 85, "Jacket": 160,
    "Shoes": 130, "Sneakers": 110, "Socks": 18, "Belt": 55, "Smart TV": 950,
    "Camera": 680, "Speaker": 220, "Charger": 35, "USB Hub": 60, "Router": 150,
    "SSD Drive": 120,
}

PROFIT_MARGINS = {
    "Technology": 0.22, "Furniture": 0.31, "Office Supplies": 0.40,
    "Clothing": 0.45, "Electronics": 0.18,
}


def generate_dataset(n: int = 2000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    random.seed(seed)

    start = date(2021, 1, 1)
    end   = date(2023, 12, 31)
    date_range = (end - start).days

    records = []
    used_ids: set = set()

    for i in range(n):
        # --- date with seasonal pattern -----------------------------------------
        day_offset = int(rng.integers(0, date_range))
        order_date = start + timedelta(days=day_offset)
        month = order_date.month

        # Q4 holiday boost; Q1 slightly slower
        season_mult = 1.0
        if month in (11, 12):
            season_mult = 1.45
        elif month in (6, 7, 8):
            season_mult = 1.15
        elif month in (1, 2):
            season_mult = 0.75

        # --- category & product --------------------------------------------------
        cat = random.choice(list(CATEGORIES.keys()))
        product = random.choice(CATEGORIES[cat])
        region  = random.choice(REGIONS)

        base_price = BASE_PRICES[product]

        # --- quantity (tech = fewer, supplies = more) ----------------------------
        if cat == "Office Supplies":
            qty = int(rng.integers(5, 50))
        elif cat in ("Technology", "Electronics"):
            qty = int(rng.integers(1, 8))
        else:
            qty = int(rng.integers(1, 20))

        # --- discount (occasionally larger for high season) ----------------------
        discount_pool = [0, 0, 0, 0.05, 0.05, 0.10, 0.10, 0.15, 0.20, 0.25]
        discount = random.choice(discount_pool)
        if month in (11, 12):
            discount_pool2 = [0.10, 0.15, 0.20, 0.25, 0.30]
            discount = random.choice(discount_pool2)

        # --- sales ---------------------------------------------------------------
        unit_price = base_price * season_mult * (1 + rng.normal(0, 0.08))
        unit_price = max(unit_price, base_price * 0.5)
        sales = round(unit_price * qty * (1 - discount), 2)

        # --- profit --------------------------------------------------------------
        margin = PROFIT_MARGINS[cat] * (1 + rng.normal(0, 0.05))
        margin = max(0.05, min(0.65, margin))
        profit = round(sales * margin, 2)

        # --- order ID ------------------------------------------------------------
        while True:
            oid = "ORD-" + "".join(random.choices(string.digits, k=7))
            if oid not in used_ids:
                used_ids.add(oid)
                break

        records.append({
            "Order_ID": oid,
            "Order_Date": order_date.strftime("%Y-%m-%d"),
            "Product": product,
            "Category": cat,
            "Region": region,
            "Quantity": qty,
            "Sales": sales,
            "Discount": discount,
            "Profit": profit,
        })

    return pd.DataFrame(records)


if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv("synthetic_sales_data.csv", index=False)
    print(f"Generated {len(df)} rows → synthetic_sales_data.csv")
