# MarketMind datasets

Only small, reviewed samples and the columns required by Milestone 1 are stored in Git. Technical
index columns, unused marketplace fields and the complete source files are excluded. The complete
files stay outside the repository because they are large and may have separate licence or
redistribution conditions.

## Raw samples

| File | Project use |
|---|---|
| `raw/sales_sample.csv` | Sales schema, dashboard mapping and cleaning verification |
| `raw/inventory_sample.csv` | Current-stock and low-stock processing |
| `raw/customer_transactions_sample.csv` | Customer transaction cleaning and summary preparation |

## Processed samples

| File | Project use |
|---|---|
| `processed/sales_cleaned_sample.csv` | Standardized sales transactions with cancellation/return labels |
| `processed/inventory_cleaned_sample.csv` | Real source stock with reorder status |
| `processed/customer_transactions_cleaned_sample.csv` | Valid customer-linked transaction rows |
| `processed/customer_summary_sample.csv` | Customer order, quantity, revenue and recency summary |
| `processed/quality_report.json` | Full-source cleaning and validation counts |
| `processed/customer_segments_sample.csv` | Reviewed Milestone 2 behavior features and segment assignments |
| `processed/segmentation_report.json` | Full-data cluster evaluation metrics and aggregate profiles |

These samples are development fixtures, not model-training datasets. Recreate them with the command
in `preprocessing/README.md`.

Complete Milestone 2 outputs are written under `data/generated/customer-segmentation/` and remain
outside version control. This keeps the repository small while preserving a repeatable path from
the original workbook to the trained model and database import files.

Forecast artifacts are written under `data/generated/forecasting/`. The Parquet demand target
`sale_amount` is stored as `source_unit` because the source does not define whether it represents a
quantity, value or index. Parquet store/product IDs do not match the Amazon inventory identifiers.
Any inventory link must therefore be supplied through a reviewed mapping CSV; generated or guessed
cross-dataset mappings must not be committed.

## Contribution

Dataset collection and preparation work for Milestone 1 was contributed by Komal (`komal283`).
