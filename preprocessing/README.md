# MarketMind data preparation

The preprocessing package contains repeatable pipelines for both completed milestones. Milestone 1
creates reviewed sales, inventory and customer samples. Milestone 2 trains customer segmentation,
business/personal revenue forecasting and store-product demand forecasting artifacts.

Milestone 3 pipelines are planned extensions. They will reuse these cleaned identifiers and
features for churn labels, customer-product interactions and anomaly signals. Milestone 4 will add
reproducibility, drift and release checks around the approved models rather than a new business
model.

This folder prepares the three datasets needed for the first MarketMind milestone:

- marketplace sales for the initial dashboard;
- current stock for inventory monitoring;
- customer transactions for the cleaned customer-data foundation.

The original datasets stay outside the repository. Run the pipeline by passing their local paths:

```powershell
python -m preprocessing.milestone1 `
  --sales "D:\MarketMind\Dataset\archive (9)\Amazon Sale Report.csv" `
  --inventory "D:\MarketMind\Dataset\archive (9)\Sale Report.csv" `
  --customers "D:\MarketMind\Dataset\online+retail+ii\online_retail_II.xlsx" `
  --output data
```

The command recreates the committed samples with a fixed random seed and calculates the quality
report from the complete source files.

## Milestone 2 customer segmentation

Install the separate preprocessing dependencies from the repository root:

```powershell
python -m venv preprocessing\.venv
.\preprocessing\.venv\Scripts\python.exe -m pip install -r preprocessing\requirements.txt
```

Run the complete Online Retail II workbook through feature engineering and model selection:

```powershell
.\preprocessing\.venv\Scripts\python.exe -m preprocessing.customer_segmentation `
  --customers "D:\MarketMind\Dataset\online+retail+ii\online_retail_II.xlsx" `
  --output "data\generated\customer-segmentation" `
  --review-output "data\processed"
```

The generated directory contains the complete customer feature table, segment assignments,
evaluation report, and trained model. It is ignored by Git. The review output contains only a
small deterministic sample and aggregate model metrics that are safe to keep in the repository.

The pipeline evaluates K-Means and Hierarchical Clustering for multiple cluster counts. K-Means is
used for persisted assignments because it can consistently classify later customer feature rows;
hierarchical clustering is retained as an evaluation comparison.

Run the preprocessing tests with:

```powershell
.\preprocessing\.venv\Scripts\python.exe -m unittest discover -s preprocessing\tests -v
```

## Milestone 2 forecasting

Run the full Amazon revenue and Parquet demand datasets through chronological model comparison:

```powershell
.\preprocessing\.venv\Scripts\python.exe -m preprocessing.forecasting `
  --amazon "D:\MarketMind\Dataset\archive (9)\Amazon Sale Report.csv" `
  --personal-sales data\processed\sales_cleaned_sample.csv `
  --demand-train "D:\MarketMind\Dataset\train.parquet" `
  --demand-eval "D:\MarketMind\Dataset\eval.parquet" `
  --output data\generated\forecasting
```

Revenue compares Seasonal Naive, Prophet, a 56-day weekday-aware Linear Trend candidate, XGBoost
and Random Forest. Demand compares Seasonal Naive, XGBoost and Random Forest using lag, calendar,
promotion, stock and weather features. The selected models generate 7, 14 and 30-day-compatible
predictions with lower and upper bounds.
When `--personal-sales` is provided, the pipeline also creates a separate seller-scale revenue
model from valid INR sales and returns in the cleaned application dataset.

`sale_amount` is the source field used for demand modelling. Its dataset documentation does not
confirm whether it is a quantity, monetary value or index. Forecast files therefore use the unit
`source_unit`, and downstream screens must not rename it to units sold. Source product IDs are not
assumed to match inventory SKUs; a separately reviewed mapping CSV is applied during backend import.

Full model artifacts are written to `data/generated/` and ignored by Git. Only deterministic review
samples, quality reports, code and documentation are versioned. This keeps the repository small and
prevents local training artifacts from being mistaken for source data.

## Planned Milestone 3 preprocessing

The next pipelines should be added in this order:

1. Build point-in-time churn labels from a documented observation window and later inactivity
   window. Future records must never enter training features.
2. Build customer-product baskets from valid sales lines and keep returns, voids, stockouts and
   unavailable products explicit.
3. Create anomaly features from sales, inventory movements and forecast residuals, starting with
   transparent business/statistical baselines.
4. Use chronological train/validation/test splits, compare every candidate with a simple baseline,
   and save feature schema, metrics, scope and version with each run.
5. Publish an artifact only when its quality gate passes; otherwise produce a report explaining the
   failure and required data.

Recommended compatible models are Logistic Regression followed by Random Forest/XGBoost for
churn; association rules with popularity/category fallback before item-based collaborative
filtering for recommendations; and robust thresholds before Isolation Forest for anomaly
detection. Details are in the
[Milestone 3 and 4 workflow](../docs/milestone-3-4/milestone-3-4-workflow.md).

## Contribution

The Milestone 1 dataset selection and preprocessing work was contributed by Komal (`komal283`).
