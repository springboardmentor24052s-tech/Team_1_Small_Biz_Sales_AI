import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from preprocessing.forecasting import (
    _metrics,
    _seasonal_naive,
    clean_amazon_revenue,
    clean_processed_sales,
    train_demand_forecasts,
    train_personal_revenue_forecasts,
    train_revenue_forecasts,
)


def _amazon_fixture(path: Path) -> None:
    dates = pd.date_range("2025-01-01", periods=70, freq="D")
    rows = []
    for index, date in enumerate(dates):
        rows.append(
            {
                "Date": date.strftime("%m-%d-%y"),
                "Status": "Shipped",
                "Category": "Set",
                "currency": "INR",
                "Amount": 1000 + (index % 7) * 100 + index * 2,
            }
        )
    rows.extend(
        [
            {
                "Date": "03-01-25",
                "Status": "Cancelled",
                "Category": "Set",
                "currency": "INR",
                "Amount": 9000,
            },
            {
                "Date": "03-02-25",
                "Status": "Shipped - Returned to Seller",
                "Category": "Set",
                "currency": "INR",
                "Amount": 500,
            },
            {
                "Date": "03-03-25",
                "Status": None,
                "Category": "Set",
                "currency": None,
                "Amount": 100,
            },
        ]
    )
    pd.DataFrame(rows).to_csv(path, index=False)


def _demand_fixture(train_path: Path, eval_path: Path) -> None:
    rows = []
    dates = pd.date_range("2025-01-01", periods=70, freq="D")
    for store_id, product_id, category_id in ((1, 101, 10), (1, 102, 20)):
        for index, date in enumerate(dates):
            rows.append(
                {
                    "store_id": store_id,
                    "product_id": product_id,
                    "first_category_id": category_id,
                    "dt": date,
                    "sale_amount": 20 + product_id % 100 + (index % 7) + index * 0.1,
                    "discount": 0.05,
                    "holiday_flag": 0,
                    "activity_flag": index % 5 == 0,
                    "stock_hour6_22_cnt": 100,
                    "avg_temperature": 25,
                    "avg_humidity": 60,
                }
            )
    data = pd.DataFrame(rows)
    data.loc[data["dt"] <= dates[-8]].to_parquet(train_path, index=False)
    data.loc[data["dt"] > dates[-8]].to_parquet(eval_path, index=False)


def _processed_sales_fixture(path: Path) -> None:
    dates = pd.date_range("2025-01-01", periods=70, freq="D")
    rows = [
        {
            "order_date": date.date().isoformat(),
            "transaction_type": "sale",
            "currency": "INR",
            "amount": 500 + (index % 7) * 25 + index,
            "category": "Set",
            "quality_status": "valid",
        }
        for index, date in enumerate(dates)
    ]
    rows.append(
        {
            "order_date": "2025-02-01",
            "transaction_type": "cancelled",
            "currency": "INR",
            "amount": 9999,
            "category": "Set",
            "quality_status": "non_positive_quantity",
        }
    )
    pd.DataFrame(rows).to_csv(path, index=False)


class ForecastingTests(unittest.TestCase):
    def test_clean_amazon_revenue_excludes_cancelled_and_negates_returns(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "amazon.csv"
            _amazon_fixture(source)
            cleaned = clean_amazon_revenue(source)
        self.assertFalse(cleaned["order_status"].str.contains("Cancelled").any())
        returned = cleaned.loc[
            cleaned["order_status"].str.contains("Returned"), "net_amount"
        ].iloc[0]
        self.assertEqual(returned, -500)

    def test_revenue_pipeline_returns_30_days_and_candidate_metrics(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "amazon.csv"
            _amazon_fixture(source)
            result = train_revenue_forecasts(source, random_state=7)
        aggregate = result.predictions.loc[
            result.predictions["source_category_id"] == "ALL"
        ]
        self.assertEqual(len(aggregate), 30)
        self.assertTrue(aggregate["predicted"].ge(0).all())
        self.assertEqual(
            {"seasonal_naive", "prophet", "linear_trend", "xgboost", "random_forest"},
            {item["algorithm"] for item in result.report["candidate_metrics"]},
        )

    def test_demand_pipeline_returns_each_series_for_30_days(self):
        with tempfile.TemporaryDirectory() as directory:
            train_path = Path(directory) / "train.parquet"
            eval_path = Path(directory) / "eval.parquet"
            _demand_fixture(train_path, eval_path)
            result = train_demand_forecasts(
                train_path, eval_path, max_series=2, random_state=7
            )
        self.assertEqual(len(result.predictions), 60)
        self.assertEqual(result.report["modelled_series"], 2)
        self.assertEqual(set(result.predictions["horizon_day"]), set(range(1, 31)))
        self.assertTrue(result.predictions["predicted"].ge(0).all())

    def test_personal_forecast_uses_only_valid_processed_sales(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "sales.csv"
            _processed_sales_fixture(source)
            cleaned = clean_processed_sales(source)
            result = train_personal_revenue_forecasts(source, random_state=7)
        self.assertEqual(len(cleaned), 70)
        self.assertEqual(result.report["model_version"], "personal-forecast-v2")
        self.assertEqual(result.report["source_system"], "marketmind_processed_sales")
        self.assertEqual(len(result.predictions), 30)

    def test_seasonal_naive_and_metrics_are_deterministic(self):
        history = [float(value) for value in range(1, 15)]
        predicted = _seasonal_naive(history, 3)
        self.assertEqual(predicted.tolist(), [8.0, 9.0, 10.0])
        metrics = _metrics(np.array([8.0, 10.0]), np.array([8.0, 9.0]))
        self.assertEqual(metrics["mae"], 0.5)


if __name__ == "__main__":
    unittest.main()
