# MarketMind data preparation

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
  --demand-train "D:\MarketMind\Dataset\train.parquet" `
  --demand-eval "D:\MarketMind\Dataset\eval.parquet" `
  --output data\generated\forecasting
```

Revenue compares Seasonal Naive, Prophet, XGBoost and Random Forest. Demand compares Seasonal
Naive, XGBoost and Random Forest using lag, calendar, promotion, stock and weather features. The
selected models generate 7, 14 and 30-day-compatible predictions with lower and upper bounds.

## Contribution

The Milestone 1 dataset selection and preprocessing work was contributed by Komal (`komal283`).
