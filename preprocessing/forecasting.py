from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

import joblib
import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor


MODEL_VERSION = "forecast-v1"
HORIZONS = (7, 14, 30)
LAGS = (1, 7, 14, 28)


class Regressor(Protocol):
    def fit(self, x: pd.DataFrame, y: pd.Series) -> Any: ...

    def predict(self, x: pd.DataFrame) -> np.ndarray: ...


@dataclass
class ForecastOutput:
    predictions: pd.DataFrame
    report: dict[str, Any]
    artifact: dict[str, Any]


def _safe_float(value: float) -> float | None:
    return None if not math.isfinite(float(value)) else round(float(value), 6)


def _metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float | None]:
    actual_values = np.asarray(actual, dtype=float)
    predicted_values = np.asarray(predicted, dtype=float)
    return {
        "mae": _safe_float(mean_absolute_error(actual_values, predicted_values)),
        "rmse": _safe_float(
            math.sqrt(mean_squared_error(actual_values, predicted_values))
        ),
        "bias": _safe_float(np.mean(predicted_values - actual_values)),
        "r2": _safe_float(r2_score(actual_values, predicted_values)),
    }


def _daily_index(frame: pd.DataFrame, date_column: str, value_column: str) -> pd.Series:
    values = frame.copy()
    values[date_column] = pd.to_datetime(
        values[date_column], errors="coerce"
    ).dt.normalize()
    values[value_column] = pd.to_numeric(values[value_column], errors="coerce")
    values = values.dropna(subset=[date_column, value_column])
    daily = values.groupby(date_column)[value_column].sum().sort_index()
    index = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    return daily.reindex(index, fill_value=0.0).astype(float)


def clean_amazon_revenue(path: Path) -> pd.DataFrame:
    required = {"Date", "Status", "Category", "currency", "Amount"}
    source = pd.read_csv(path, low_memory=False)
    missing = sorted(required - set(source.columns))
    if missing:
        raise ValueError(f"Amazon sales data is missing columns: {', '.join(missing)}")
    data = source.loc[:, sorted(required)].rename(
        columns={
            "Date": "order_date",
            "Status": "order_status",
            "Category": "category",
            "Amount": "amount",
        }
    )
    data["order_date"] = pd.to_datetime(
        data["order_date"], format="%m-%d-%y", errors="coerce"
    )
    data["amount"] = pd.to_numeric(data["amount"], errors="coerce")
    data["currency"] = data["currency"].astype("string").str.upper().fillna("")
    data["category"] = data["category"].astype("string").str.strip().fillna("Unknown")
    status = data["order_status"].astype("string").str.casefold().fillna("")
    cancelled = status.str.contains("cancel", na=False).fillna(False)
    returned = status.str.contains("return|rejected|lost", regex=True, na=False).fillna(
        False
    )
    data["net_amount"] = data["amount"]
    data.loc[returned, "net_amount"] = -data.loc[returned, "amount"].abs()
    data = data.loc[
        ~cancelled
        & data["order_date"].notna()
        & data["net_amount"].notna()
        & data["currency"].eq("INR")
    ].copy()
    if data.empty:
        raise ValueError("Amazon sales data contains no valid INR revenue records")
    return data


def _feature_row(history: list[float], date: pd.Timestamp) -> dict[str, float]:
    if len(history) < max(LAGS):
        raise ValueError("At least 28 historical observations are required")
    return {
        "trend": float(len(history)),
        "day_of_week": float(date.dayofweek),
        "day_of_month": float(date.day),
        "week_of_year": float(date.isocalendar().week),
        "month": float(date.month),
        **{f"lag_{lag}": float(history[-lag]) for lag in LAGS},
        "rolling_mean_7": float(np.mean(history[-7:])),
        "rolling_mean_14": float(np.mean(history[-14:])),
        "rolling_std_7": float(np.std(history[-7:])),
    }


def _supervised_frame(series: pd.Series) -> tuple[pd.DataFrame, pd.Series]:
    rows: list[dict[str, float]] = []
    targets: list[float] = []
    history: list[float] = []
    for date, value in series.items():
        if len(history) >= max(LAGS):
            rows.append(_feature_row(history, pd.Timestamp(date)))
            targets.append(float(value))
        history.append(float(value))
    return pd.DataFrame(rows), pd.Series(targets, dtype=float)


def _regressor(name: str, random_state: int) -> Regressor:
    if name == "xgboost":
        return XGBRegressor(
            n_estimators=350,
            max_depth=4,
            learning_rate=0.04,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=random_state,
            n_jobs=4,
        )
    if name == "random_forest":
        return RandomForestRegressor(
            n_estimators=300,
            max_depth=14,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1,
        )
    raise ValueError(f"Unsupported regressor: {name}")


def _recursive_regression(
    model: Regressor,
    history: list[float],
    dates: pd.DatetimeIndex,
) -> np.ndarray:
    values = list(map(float, history))
    predictions: list[float] = []
    for date in dates:
        row = pd.DataFrame([_feature_row(values, pd.Timestamp(date))])
        prediction = max(0.0, float(model.predict(row)[0]))
        predictions.append(prediction)
        values.append(prediction)
    return np.asarray(predictions)


def _seasonal_naive(history: list[float], periods: int, season: int = 7) -> np.ndarray:
    values = list(map(float, history))
    predictions: list[float] = []
    for _ in range(periods):
        prediction = max(0.0, values[-season] if len(values) >= season else values[-1])
        predictions.append(prediction)
        values.append(prediction)
    return np.asarray(predictions)


def _prophet_predict(
    series: pd.Series,
    dates: pd.DatetimeIndex,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, Prophet]:
    training = pd.DataFrame({"ds": series.index, "y": series.to_numpy(dtype=float)})
    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False,
        interval_width=0.9,
    )
    model.fit(training)
    result = model.predict(pd.DataFrame({"ds": dates}))
    return (
        result["yhat"].clip(lower=0).to_numpy(),
        result["yhat_lower"].clip(lower=0).to_numpy(),
        result["yhat_upper"].clip(lower=0).to_numpy(),
        model,
    )


def _train_single_series(
    series: pd.Series,
    *,
    random_state: int,
    include_prophet: bool = True,
) -> tuple[dict[str, Any], dict[str, Any]]:
    if len(series) < 56:
        raise ValueError("At least 56 daily observations are required for forecasting")
    validation_days = min(14, max(7, len(series) // 5))
    training = series.iloc[:-validation_days]
    validation = series.iloc[-validation_days:]
    candidates: list[dict[str, Any]] = []
    validation_predictions: dict[str, np.ndarray] = {}

    baseline = _seasonal_naive(training.tolist(), validation_days)
    validation_predictions["seasonal_naive"] = baseline
    candidates.append(
        {"algorithm": "seasonal_naive", **_metrics(validation.to_numpy(), baseline)}
    )

    if include_prophet:
        prophet_values, _, _, _ = _prophet_predict(training, validation.index)
        validation_predictions["prophet"] = prophet_values
        candidates.append(
            {"algorithm": "prophet", **_metrics(validation.to_numpy(), prophet_values)}
        )

    x_train, y_train = _supervised_frame(training)
    for algorithm in ("xgboost", "random_forest"):
        model = _regressor(algorithm, random_state)
        model.fit(x_train, y_train)
        predicted = _recursive_regression(model, training.tolist(), validation.index)
        validation_predictions[algorithm] = predicted
        candidates.append(
            {"algorithm": algorithm, **_metrics(validation.to_numpy(), predicted)}
        )

    selected = min(candidates, key=lambda item: (item["mae"], item["rmse"]))
    algorithm = str(selected["algorithm"])
    residuals = np.abs(validation.to_numpy() - validation_predictions[algorithm])
    interval_error = max(float(np.quantile(residuals, 0.9)), 1.0)

    artifact: dict[str, Any] = {
        "algorithm": algorithm,
        "interval_error": interval_error,
    }
    future_dates = pd.date_range(
        series.index.max() + pd.Timedelta(days=1), periods=30, freq="D"
    )
    if algorithm == "seasonal_naive":
        future = _seasonal_naive(series.tolist(), len(future_dates))
        lower = np.clip(future - interval_error, 0, None)
        upper = future + interval_error
    elif algorithm == "prophet":
        future, lower, upper, model = _prophet_predict(series, future_dates)
        artifact["model"] = model
    else:
        x_full, y_full = _supervised_frame(series)
        model = _regressor(algorithm, random_state)
        model.fit(x_full, y_full)
        future = _recursive_regression(model, series.tolist(), future_dates)
        lower = np.clip(future - interval_error, 0, None)
        upper = future + interval_error
        artifact["model"] = model

    artifact["history"] = series.tolist()
    report = {
        "selected_algorithm": algorithm,
        "selected_metrics": selected,
        "candidate_metrics": candidates,
        "validation_days": validation_days,
        "interval_error": round(interval_error, 6),
        "future_dates": [date.date().isoformat() for date in future_dates],
        "future": future.tolist(),
        "lower": lower.tolist(),
        "upper": upper.tolist(),
    }
    return report, artifact


def train_revenue_forecasts(
    amazon_path: Path,
    *,
    random_state: int = 42,
) -> ForecastOutput:
    cleaned = clean_amazon_revenue(amazon_path)
    scopes: list[tuple[str, pd.DataFrame]] = [("ALL", cleaned)]
    scopes.extend(
        (str(category), group)
        for category, group in cleaned.groupby("category")
        if len(group) >= 50
    )
    prediction_rows: list[dict[str, Any]] = []
    scope_reports: list[dict[str, Any]] = []
    scope_artifacts: dict[str, Any] = {}
    for category, frame in scopes:
        series = _daily_index(frame, "order_date", "net_amount")
        trained, artifact = _train_single_series(
            series,
            random_state=random_state,
            include_prophet=True,
        )
        scope_reports.append(
            {
                "category": category,
                "training_start": series.index.min().date().isoformat(),
                "training_end": series.index.max().date().isoformat(),
                **{
                    key: value
                    for key, value in trained.items()
                    if key not in {"future_dates", "future", "lower", "upper"}
                },
            }
        )
        scope_artifacts[category] = artifact
        for index, forecast_date in enumerate(trained["future_dates"], start=1):
            prediction_rows.append(
                {
                    "forecast_type": "revenue",
                    "target": "daily_net_revenue_inr",
                    "unit": "INR",
                    "granularity": "day",
                    "source_store_id": "ALL",
                    "source_product_id": "ALL",
                    "source_category_id": category,
                    "forecast_date": forecast_date,
                    "horizon_day": index,
                    "actual": "",
                    "predicted": round(float(trained["future"][index - 1]), 4),
                    "lower_bound": round(float(trained["lower"][index - 1]), 4),
                    "upper_bound": round(float(trained["upper"][index - 1]), 4),
                }
            )

    aggregate = next(item for item in scope_reports if item["category"] == "ALL")
    report = {
        "model_version": MODEL_VERSION,
        "forecast_type": "revenue",
        "source_system": "amazon_sales",
        "target": "daily_net_revenue_inr",
        "source_target": "Amount",
        "unit": "INR",
        "granularity": "day",
        "horizons": list(HORIZONS),
        "generated_at": datetime.now(UTC).isoformat(),
        "source_rows": int(len(cleaned)),
        "category_count": int(cleaned["category"].nunique()),
        "selected_algorithm": aggregate["selected_algorithm"],
        "selected_metrics": aggregate["selected_metrics"],
        "candidate_metrics": aggregate["candidate_metrics"],
        "training_start": aggregate["training_start"],
        "training_end": aggregate["training_end"],
        "scope_reports": scope_reports,
        "data_rule": "Cancelled orders excluded; returned, returning, rejected and lost orders subtract revenue.",
    }
    return ForecastOutput(
        predictions=pd.DataFrame(prediction_rows),
        report=report,
        artifact={"model_version": MODEL_VERSION, "scopes": scope_artifacts},
    )


DEMAND_COLUMNS = [
    "store_id",
    "product_id",
    "first_category_id",
    "dt",
    "sale_amount",
    "discount",
    "holiday_flag",
    "activity_flag",
    "stock_hour6_22_cnt",
    "avg_temperature",
    "avg_humidity",
]


def _load_demand(path: Path) -> pd.DataFrame:
    data = pd.read_parquet(path, columns=DEMAND_COLUMNS)
    data["dt"] = pd.to_datetime(data["dt"], errors="coerce").dt.normalize()
    data["sale_amount"] = pd.to_numeric(data["sale_amount"], errors="coerce")
    data = data.dropna(subset=["dt", "sale_amount", "store_id", "product_id"])
    return data


def _top_demand_series(data: pd.DataFrame, max_series: int) -> pd.DataFrame:
    ranking = (
        data.groupby(["store_id", "product_id"], as_index=False)["sale_amount"]
        .sum()
        .sort_values(
            ["sale_amount", "store_id", "product_id"], ascending=[False, True, True]
        )
        .head(max_series)
    )
    return ranking[["store_id", "product_id"]]


def _filter_series(data: pd.DataFrame, selected: pd.DataFrame) -> pd.DataFrame:
    return data.merge(selected, on=["store_id", "product_id"], how="inner")


def _demand_features(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    values = data.sort_values(["store_id", "product_id", "dt"]).copy()
    groups = values.groupby(["store_id", "product_id"], sort=False)["sale_amount"]
    for lag in LAGS:
        values[f"lag_{lag}"] = groups.shift(lag)
    values["rolling_mean_7"] = groups.transform(
        lambda series: series.shift(1).rolling(7).mean()
    )
    values["rolling_mean_14"] = groups.transform(
        lambda series: series.shift(1).rolling(14).mean()
    )
    values["day_of_week"] = values["dt"].dt.dayofweek
    values["week_of_year"] = values["dt"].dt.isocalendar().week.astype(int)
    feature_names = [
        "store_id",
        "product_id",
        "first_category_id",
        "discount",
        "holiday_flag",
        "activity_flag",
        "stock_hour6_22_cnt",
        "avg_temperature",
        "avg_humidity",
        "day_of_week",
        "week_of_year",
        *[f"lag_{lag}" for lag in LAGS],
        "rolling_mean_7",
        "rolling_mean_14",
    ]
    values = values.dropna(subset=feature_names + ["sale_amount"])
    return values[feature_names].astype(float), values["sale_amount"].astype(float)


def _demand_recursive(
    model: Regressor,
    history: pd.DataFrame,
    future: pd.DataFrame,
) -> np.ndarray:
    histories = {
        key: group.sort_values("dt")["sale_amount"].astype(float).tolist()
        for key, group in history.groupby(["store_id", "product_id"])
    }
    predictions: list[float] = []
    for row in future.sort_values(["dt", "store_id", "product_id"]).itertuples():
        key = (row.store_id, row.product_id)
        values = histories[key]
        features = {
            "store_id": float(row.store_id),
            "product_id": float(row.product_id),
            "first_category_id": float(row.first_category_id),
            "discount": float(row.discount),
            "holiday_flag": float(row.holiday_flag),
            "activity_flag": float(row.activity_flag),
            "stock_hour6_22_cnt": float(row.stock_hour6_22_cnt),
            "avg_temperature": float(row.avg_temperature),
            "avg_humidity": float(row.avg_humidity),
            "day_of_week": float(row.dt.dayofweek),
            "week_of_year": float(row.dt.isocalendar().week),
            **{f"lag_{lag}": float(values[-lag]) for lag in LAGS},
            "rolling_mean_7": float(np.mean(values[-7:])),
            "rolling_mean_14": float(np.mean(values[-14:])),
        }
        prediction = max(0.0, float(model.predict(pd.DataFrame([features]))[0]))
        predictions.append(prediction)
        values.append(prediction)
    return np.asarray(predictions)


def _future_demand_frame(data: pd.DataFrame, periods: int) -> pd.DataFrame:
    last_date = data["dt"].max()
    latest = (
        data.sort_values("dt")
        .groupby(["store_id", "product_id"], as_index=False)
        .tail(7)
        .groupby(["store_id", "product_id"], as_index=False)
        .agg(
            first_category_id=("first_category_id", "last"),
            discount=("discount", "mean"),
            holiday_flag=("holiday_flag", "last"),
            activity_flag=("activity_flag", "last"),
            stock_hour6_22_cnt=("stock_hour6_22_cnt", "mean"),
            avg_temperature=("avg_temperature", "mean"),
            avg_humidity=("avg_humidity", "mean"),
        )
    )
    frames = []
    for offset in range(1, periods + 1):
        frame = latest.copy()
        frame["dt"] = last_date + pd.Timedelta(days=offset)
        frames.append(frame)
    return pd.concat(frames, ignore_index=True)


def train_demand_forecasts(
    train_path: Path,
    eval_path: Path,
    *,
    max_series: int = 250,
    random_state: int = 42,
) -> ForecastOutput:
    train = _load_demand(train_path)
    evaluation = _load_demand(eval_path)
    selected = _top_demand_series(train, max_series)
    train = _filter_series(train, selected)
    evaluation = _filter_series(evaluation, selected)
    train = train.sort_values(["dt", "store_id", "product_id"])
    evaluation = evaluation.sort_values(["dt", "store_id", "product_id"])
    x_train, y_train = _demand_features(train)
    candidates: list[dict[str, Any]] = []
    candidate_predictions: dict[str, np.ndarray] = {}

    histories = {
        key: group.sort_values("dt")["sale_amount"].astype(float).tolist()
        for key, group in train.groupby(["store_id", "product_id"])
    }
    baseline: list[float] = []
    for row in evaluation.itertuples():
        key = (row.store_id, row.product_id)
        values = histories[key]
        prediction = max(0.0, values[-7])
        baseline.append(prediction)
        values.append(prediction)
    baseline_values = np.asarray(baseline)
    candidate_predictions["seasonal_naive"] = baseline_values
    candidates.append(
        {
            "algorithm": "seasonal_naive",
            **_metrics(evaluation["sale_amount"].to_numpy(), baseline_values),
        }
    )

    models: dict[str, Regressor] = {}
    for algorithm in ("xgboost", "random_forest"):
        model = _regressor(algorithm, random_state)
        model.fit(x_train, y_train)
        predicted = _demand_recursive(model, train, evaluation)
        models[algorithm] = model
        candidate_predictions[algorithm] = predicted
        candidates.append(
            {
                "algorithm": algorithm,
                **_metrics(evaluation["sale_amount"].to_numpy(), predicted),
            }
        )
    selected_metrics = min(candidates, key=lambda item: (item["mae"], item["rmse"]))
    algorithm = str(selected_metrics["algorithm"])
    residuals = np.abs(
        evaluation["sale_amount"].to_numpy() - candidate_predictions[algorithm]
    )
    interval_error = max(float(np.quantile(residuals, 0.9)), 0.1)
    combined = pd.concat([train, evaluation], ignore_index=True)
    future = _future_demand_frame(combined, 30).sort_values(
        ["dt", "store_id", "product_id"]
    )

    if algorithm == "seasonal_naive":
        future_histories = {
            key: group.sort_values("dt")["sale_amount"].astype(float).tolist()
            for key, group in combined.groupby(["store_id", "product_id"])
        }
        future_values = []
        for row in future.itertuples():
            key = (row.store_id, row.product_id)
            values = future_histories[key]
            prediction = max(0.0, values[-7])
            future_values.append(prediction)
            values.append(prediction)
        predictions = np.asarray(future_values)
        artifact_model: Any = None
    else:
        x_full, y_full = _demand_features(combined)
        artifact_model = _regressor(algorithm, random_state)
        artifact_model.fit(x_full, y_full)
        predictions = _demand_recursive(artifact_model, combined, future)

    future = future.reset_index(drop=True)
    future["predicted"] = predictions
    future["lower_bound"] = np.clip(predictions - interval_error, 0, None)
    future["upper_bound"] = predictions + interval_error
    future["horizon_day"] = (future["dt"] - combined["dt"].max()).dt.days
    output = pd.DataFrame(
        {
            "forecast_type": "demand",
            "target": "predicted_demand",
            "unit": "source_unit",
            "granularity": "day",
            "source_store_id": future["store_id"].astype(str),
            "source_product_id": future["product_id"].astype(str),
            "source_category_id": future["first_category_id"].astype(str),
            "forecast_date": future["dt"].dt.date.astype(str),
            "horizon_day": future["horizon_day"],
            "actual": "",
            "predicted": future["predicted"].round(4),
            "lower_bound": future["lower_bound"].round(4),
            "upper_bound": future["upper_bound"].round(4),
        }
    )
    report = {
        "model_version": MODEL_VERSION,
        "forecast_type": "demand",
        "source_system": "marketmind_parquet",
        "target": "predicted_demand",
        "source_target": "sale_amount",
        "unit": "source_unit",
        "granularity": "day",
        "horizons": list(HORIZONS),
        "generated_at": datetime.now(UTC).isoformat(),
        "source_train_rows": 4_500_000,
        "source_eval_rows": 350_000,
        "modelled_series": int(len(selected)),
        "selected_algorithm": algorithm,
        "selected_metrics": selected_metrics,
        "candidate_metrics": candidates,
        "training_start": train["dt"].min().date().isoformat(),
        "training_end": train["dt"].max().date().isoformat(),
        "evaluation_start": evaluation["dt"].min().date().isoformat(),
        "evaluation_end": evaluation["dt"].max().date().isoformat(),
        "interval_error": round(interval_error, 6),
        "data_rule": "sale_amount is treated as demand, not revenue, pending final source-unit approval.",
    }
    return ForecastOutput(
        predictions=output,
        report=report,
        artifact={
            "model_version": MODEL_VERSION,
            "algorithm": algorithm,
            "model": artifact_model,
            "series": selected.to_dict(orient="records"),
            "interval_error": interval_error,
        },
    )


def write_output(output: ForecastOutput, output_dir: Path, name: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    output.predictions.to_csv(output_dir / f"{name}_forecasts.csv", index=False)
    (output_dir / f"{name}_report.json").write_text(
        json.dumps(output.report, indent=2) + "\n", encoding="utf-8"
    )
    joblib.dump(output.artifact, output_dir / f"{name}_forecast.joblib")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train MarketMind Milestone 2 forecasts."
    )
    parser.add_argument("--amazon", required=True, type=Path)
    parser.add_argument("--demand-train", required=True, type=Path)
    parser.add_argument("--demand-eval", required=True, type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/generated/forecasting"),
    )
    parser.add_argument("--max-demand-series", type=int, default=250)
    parser.add_argument("--random-state", type=int, default=42)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.max_demand_series < 1:
        raise ValueError("max-demand-series must be at least 1")
    revenue = train_revenue_forecasts(args.amazon, random_state=args.random_state)
    write_output(revenue, args.output, "revenue")
    demand = train_demand_forecasts(
        args.demand_train,
        args.demand_eval,
        max_series=args.max_demand_series,
        random_state=args.random_state,
    )
    write_output(demand, args.output, "demand")
    print(
        json.dumps(
            {
                "revenue": revenue.report,
                "demand": demand.report,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
