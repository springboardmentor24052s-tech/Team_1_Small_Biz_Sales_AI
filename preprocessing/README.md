# Milestone 1 data preparation

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
report from the complete source files. Forecasting, price mapping and Parquet feature preparation
are intentionally deferred to later milestones.
