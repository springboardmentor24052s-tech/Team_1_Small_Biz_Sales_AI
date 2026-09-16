from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd


SALES_COLUMNS = {
    "Order ID": "order_id",
    "Date": "order_date",
    "Status": "order_status",
    "Fulfilment": "fulfilment",
    "Sales Channel ": "sales_channel",
    "ship-service-level": "ship_service_level",
    "Style": "style",
    "SKU": "sku",
    "Category": "category",
    "Size": "size",
    "ASIN": "asin",
    "Courier Status": "courier_status",
    "Qty": "quantity",
    "currency": "currency",
    "Amount": "amount",
    "ship-state": "ship_state",
    "B2B": "is_b2b",
    "fulfilled-by": "fulfilled_by",
}

INVENTORY_COLUMNS = {
    "SKU Code": "sku",
    "Design No.": "design_number",
    "Stock": "stock_quantity",
    "Category": "category",
    "Size": "size",
    "Color": "color",
}

CUSTOMER_COLUMNS = {
    "Invoice": "invoice_id",
    "StockCode": "stock_code",
    "Description": "description",
    "Quantity": "quantity",
    "InvoiceDate": "invoice_date",
    "Price": "unit_price",
    "Customer ID": "customer_id",
    "Country": "country",
}


def _clean_text(series: pd.Series, *, upper: bool = False) -> pd.Series:
    cleaned = series.astype("string").str.strip().str.replace(r"\s+", " ", regex=True)
    return cleaned.str.upper() if upper else cleaned


def _required_columns(frame: pd.DataFrame, columns: dict[str, str], dataset: str) -> None:
    missing = sorted(set(columns) - set(frame.columns))
    if missing:
        raise ValueError(f"{dataset} is missing columns: {', '.join(missing)}")


def clean_sales(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    _required_columns(frame, SALES_COLUMNS, "sales")
    source_rows = len(frame)
    data = frame[list(SALES_COLUMNS)].rename(columns=SALES_COLUMNS).copy()
    data = data.drop_duplicates()
    duplicates_removed = source_rows - len(data)

    for column in (
        "order_id",
        "order_status",
        "fulfilment",
        "sales_channel",
        "ship_service_level",
        "style",
        "sku",
        "category",
        "size",
        "asin",
        "courier_status",
        "currency",
        "ship_state",
        "fulfilled_by",
    ):
        data[column] = _clean_text(data[column])

    data["sku"] = data["sku"].str.upper()
    data["category"] = data["category"].str.title()
    data["ship_state"] = data["ship_state"].str.upper()
    data["order_date"] = pd.to_datetime(data["order_date"], format="%m-%d-%y", errors="coerce")
    data["quantity"] = pd.to_numeric(data["quantity"], errors="coerce")
    data["amount"] = pd.to_numeric(data["amount"], errors="coerce")
    data["currency"] = data["currency"].fillna("INR").str.upper()
    data["is_b2b"] = data["is_b2b"].fillna(False).astype(bool)

    invalid_required = (
        data["order_id"].isna()
        | data["sku"].isna()
        | data["order_date"].isna()
        | data["quantity"].isna()
    )
    invalid_rows_removed = int(invalid_required.sum())
    data = data.loc[~invalid_required].copy()

    status = data["order_status"].fillna("").str.lower()
    data["transaction_type"] = "sale"
    data.loc[status.str.contains("cancel", na=False), "transaction_type"] = "cancelled"
    data.loc[
        status.str.contains("return|refund", na=False) | data["quantity"].lt(0),
        "transaction_type",
    ] = "return"

    data["quality_status"] = "valid"
    data.loc[data["amount"].isna(), "quality_status"] = "missing_amount"
    data.loc[data["quantity"].le(0), "quality_status"] = "non_positive_quantity"
    data.loc[data["amount"].notna() & data["amount"].lt(0), "quality_status"] = "negative_amount"
    data = data.sort_values(["order_date", "order_id", "sku"]).reset_index(drop=True)

    report = {
        "source_rows": source_rows,
        "output_rows": len(data),
        "duplicates_removed": duplicates_removed,
        "invalid_required_rows_removed": invalid_rows_removed,
        "cancelled_rows": int(data["transaction_type"].eq("cancelled").sum()),
        "return_rows": int(data["transaction_type"].eq("return").sum()),
        "missing_amount_rows": int(data["amount"].isna().sum()),
        "non_positive_quantity_rows": int(data["quantity"].le(0).sum()),
    }
    return data, report


def clean_inventory(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    _required_columns(frame, INVENTORY_COLUMNS, "inventory")
    source_rows = len(frame)
    data = frame[list(INVENTORY_COLUMNS)].rename(columns=INVENTORY_COLUMNS).copy()
    data = data.drop_duplicates()
    duplicates_removed = source_rows - len(data)

    for column in ("sku", "design_number", "category", "size", "color"):
        data[column] = _clean_text(data[column])
    data["sku"] = data["sku"].str.upper()
    data["category"] = data["category"].str.replace(r"^[A-Z]+\s*:\s*", "", regex=True).str.title()
    data["stock_quantity"] = pd.to_numeric(data["stock_quantity"], errors="coerce")

    invalid = data["sku"].isna() | data["stock_quantity"].isna() | data["stock_quantity"].lt(0)
    invalid_rows_removed = int(invalid.sum())
    data = data.loc[~invalid].copy()
    data["stock_quantity"] = data["stock_quantity"].round().astype("int64")

    data = (
        data.groupby("sku", as_index=False, dropna=False)
        .agg(
            design_number=("design_number", "first"),
            stock_quantity=("stock_quantity", "sum"),
            category=("category", "first"),
            size=("size", "first"),
            color=("color", "first"),
        )
        .sort_values("sku")
        .reset_index(drop=True)
    )
    data["reorder_level"] = 5
    data["stock_status"] = "in_stock"
    data.loc[data["stock_quantity"].le(data["reorder_level"]), "stock_status"] = "low_stock"
    data.loc[data["stock_quantity"].eq(0), "stock_status"] = "out_of_stock"

    report = {
        "source_rows": source_rows,
        "output_rows": len(data),
        "duplicates_removed": duplicates_removed,
        "invalid_rows_removed": invalid_rows_removed,
        "low_stock_skus": int(data["stock_status"].eq("low_stock").sum()),
        "out_of_stock_skus": int(data["stock_status"].eq("out_of_stock").sum()),
    }
    return data, report


def clean_customer_transactions(
    frame: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, int]]:
    _required_columns(frame, CUSTOMER_COLUMNS, "customer transactions")
    source_rows = len(frame)
    data = frame[list(CUSTOMER_COLUMNS)].rename(columns=CUSTOMER_COLUMNS).copy()
    data = data.drop_duplicates()
    duplicates_removed = source_rows - len(data)

    for column in ("invoice_id", "stock_code", "description", "country"):
        data[column] = _clean_text(data[column])
    data["invoice_id"] = data["invoice_id"].str.upper()
    data["stock_code"] = data["stock_code"].str.upper()
    data["invoice_date"] = pd.to_datetime(data["invoice_date"], errors="coerce")
    data["quantity"] = pd.to_numeric(data["quantity"], errors="coerce")
    data["unit_price"] = pd.to_numeric(data["unit_price"], errors="coerce")
    data["customer_id"] = pd.to_numeric(data["customer_id"], errors="coerce").astype("Int64")

    missing_customer_rows = int(data["customer_id"].isna().sum())
    invalid = (
        data["invoice_id"].isna()
        | data["stock_code"].isna()
        | data["invoice_date"].isna()
        | data["quantity"].isna()
        | data["unit_price"].isna()
        | data["customer_id"].isna()
        | data["unit_price"].lt(0)
    )
    invalid_rows_removed = int(invalid.sum())
    data = data.loc[~invalid].copy()

    cancelled_invoice = data["invoice_id"].str.startswith("C", na=False)
    data["transaction_type"] = "sale"
    data.loc[cancelled_invoice | data["quantity"].lt(0), "transaction_type"] = "return"
    data["line_revenue"] = (data["quantity"] * data["unit_price"]).round(2)
    data = data.sort_values(["invoice_date", "invoice_id", "stock_code"]).reset_index(drop=True)

    sales_only = data.loc[data["transaction_type"].eq("sale") & data["quantity"].gt(0)].copy()
    reference_date = sales_only["invoice_date"].max() + pd.Timedelta(days=1)
    customer_summary = (
        sales_only.groupby("customer_id", as_index=False)
        .agg(
            last_purchase=("invoice_date", "max"),
            order_count=("invoice_id", "nunique"),
            item_quantity=("quantity", "sum"),
            total_revenue=("line_revenue", "sum"),
        )
        .sort_values("customer_id")
        .reset_index(drop=True)
    )
    customer_summary["recency_days"] = (
        reference_date - customer_summary["last_purchase"]
    ).dt.days
    customer_summary["total_revenue"] = customer_summary["total_revenue"].round(2)

    report = {
        "source_rows": source_rows,
        "output_rows": len(data),
        "customer_summary_rows": len(customer_summary),
        "duplicates_removed": duplicates_removed,
        "missing_customer_rows": missing_customer_rows,
        "invalid_rows_removed": invalid_rows_removed,
        "return_rows": int(data["transaction_type"].eq("return").sum()),
    }
    return data, customer_summary, report


def _representative_sample(frame: pd.DataFrame, size: int, seed: int = 42) -> pd.DataFrame:
    if len(frame) <= size:
        return frame.copy()
    return frame.sample(n=size, random_state=seed).sort_index()


def _safe_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _safe_json(item) for key, item in value.items()}
    if isinstance(value, (pd.Timestamp, Path)):
        return str(value)
    return value


def build_milestone_one_data(
    sales_path: Path,
    inventory_path: Path,
    customer_path: Path,
    output_root: Path,
    sample_size: int = 250,
) -> dict[str, Any]:
    raw_dir = output_root / "raw"
    processed_dir = output_root / "processed"
    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)

    raw_sales = pd.read_csv(sales_path, low_memory=False)
    raw_inventory = pd.read_csv(inventory_path, low_memory=False)
    sheets = pd.read_excel(customer_path, sheet_name=None)
    raw_customers = pd.concat(sheets.values(), ignore_index=True)

    raw_samples = {
        "sales_sample.csv": _representative_sample(
            raw_sales[list(SALES_COLUMNS)], sample_size
        ),
        "inventory_sample.csv": _representative_sample(
            raw_inventory[list(INVENTORY_COLUMNS)], sample_size
        ),
        "customer_transactions_sample.csv": _representative_sample(
            raw_customers[list(CUSTOMER_COLUMNS)], sample_size
        ),
    }
    for filename, frame in raw_samples.items():
        frame.to_csv(raw_dir / filename, index=False)

    clean_sales_data, sales_report = clean_sales(raw_sales)
    clean_inventory_data, inventory_report = clean_inventory(raw_inventory)
    clean_customers, customer_summary, customer_report = clean_customer_transactions(raw_customers)

    _representative_sample(clean_sales_data, sample_size).to_csv(
        processed_dir / "sales_cleaned_sample.csv", index=False
    )
    _representative_sample(clean_inventory_data, sample_size).to_csv(
        processed_dir / "inventory_cleaned_sample.csv", index=False
    )
    _representative_sample(clean_customers, sample_size).to_csv(
        processed_dir / "customer_transactions_cleaned_sample.csv", index=False
    )
    _representative_sample(customer_summary, sample_size).to_csv(
        processed_dir / "customer_summary_sample.csv", index=False
    )

    report: dict[str, Any] = {
        "scope": "MarketMind Milestone 1",
        "sampling": {
            "rows_per_committed_sample": sample_size,
            "random_seed": 42,
            "note": "Quality counts are calculated from the full local source files.",
        },
        "sales": sales_report,
        "inventory": inventory_report,
        "customers": customer_report,
    }
    (processed_dir / "quality_report.json").write_text(
        json.dumps(_safe_json(report), indent=2) + "\n", encoding="utf-8"
    )
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare MarketMind Milestone 1 datasets.")
    parser.add_argument("--sales", type=Path, required=True, help="Amazon Sale Report.csv")
    parser.add_argument("--inventory", type=Path, required=True, help="Sale Report.csv")
    parser.add_argument("--customers", type=Path, required=True, help="online_retail_II.xlsx")
    parser.add_argument("--output", type=Path, default=Path("data"))
    parser.add_argument("--sample-size", type=int, default=250)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.sample_size < 1:
        raise ValueError("sample-size must be at least 1")
    report = build_milestone_one_data(
        sales_path=args.sales,
        inventory_path=args.inventory,
        customer_path=args.customers,
        output_root=args.output,
        sample_size=args.sample_size,
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
