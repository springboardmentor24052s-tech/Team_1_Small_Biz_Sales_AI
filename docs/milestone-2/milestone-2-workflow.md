# Milestone 2 workflow

## Goal

Milestone 2 adds customer intelligence and forecasting to MarketMind. By the end of the milestone,
the dashboards must show database-backed customer segments, purchasing behaviour, engagement,
sales forecasts and revenue trends under the existing role permissions.

## Work order

1. **Confirm data definitions** - agree on currency, timezone, forecast target, forecast horizon and
   the meaning of `sale_amount` before training.
2. **Prepare the datasets** - clean identifiers, dates, quantities, revenue, returns, missing days
   and duplicates. Keep full generated files outside Git and commit only samples and reports.
3. **Build customer features** - calculate recency, order frequency, revenue, average order value,
   tenure, purchase gaps, product variety, return rate and transaction engagement.
4. **Train customer segments** - compare K-Means with Hierarchical Clustering, select the cluster
   count using Silhouette, Davies-Bouldin and business interpretation, then create clear segment
   names and actions.
5. **Build forecasting models** - create time-based and lag features, establish a Seasonal Naive
   baseline, and compare Prophet, XGBoost and Random Forest with chronological backtesting.
6. **Integrate with the application** - store versioned model runs, customer assignments,
   forecasts and metrics in the database; expose scoped FastAPI endpoints; connect the React
   customer and forecast views.
7. **Validate and document** - test repeatable imports, model metrics, leakage, APIs, role access,
   frontend states and report generation.

## Dataset and model map

| Subtask | Dataset | Why it helps | Method/model | Main output |
| --- | --- | --- | --- | --- |
| Customer segmentation | `online_retail_II.xlsx` | Two years of customer, invoice, product, quantity, price and return history | RFM and behaviour features; K-Means primary; Hierarchical comparator | Segment assignment, profile and model metrics |
| Purchasing behaviour | Cleaned Online Retail II transactions | Supports order value, basket size, purchase gaps, variety, returns and activity | Aggregation, percentile scoring and cohort summaries | Customer feature table and engagement score |
| INR revenue forecast | Full Amazon sales data | Contains order dates and INR order amounts used by the current dashboard | Seasonal Naive, Prophet, XGBoost and Random Forest | 7-day and 14-day revenue forecast |
| Store/product demand forecast | `train.parquet` and `eval.parquet` | Large store-product history with category, discount, promotion, stock, holiday and weather fields | Seasonal Naive baseline plus XGBoost/Random Forest; Prophet for aggregate series | 7-day, 14-day and 30-day demand forecast |
| Stock-aware analysis | Inventory dataset and stock fields | Separates low demand from unavailable stock and supports future alerts | Stock flags and forecast residual rules | Stock-risk context for forecasts |
| Dashboard reports | Database model outputs | Keeps the UI traceable, role-scoped and free of hard-coded AI values | FastAPI, SQLAlchemy and React charts | Segment, behaviour and forecast reports |

## Model selection rules

### Segmentation

- Higher Silhouette is better.
- Lower Davies-Bouldin is better.
- Calinski-Harabasz is supporting evidence; higher is better on the same sample.
- Reject tiny or meaningless clusters even if one metric looks good.
- The selected segments must be stable and understandable to the Business Owner.

### Forecasting

- Use chronological or rolling-origin validation; never randomly shuffle time-series records.
- Compare every candidate with Seasonal Naive.
- Select the model with lower MAE and RMSE, bias close to zero and stable results across important
  stores, categories and horizons.
- A complex model is accepted only if it performs better than the baseline on unseen periods.

## Role access

| Role | Segmentation | Forecasting |
| --- | --- | --- |
| Business Owner | Business-wide summary and permitted customer membership | Business-wide forecasts and exports |
| Store Manager | Assigned-store segment summary | Assigned-store forecast summary |
| Sales Executive | Assigned customers only | No forecast access |
| Administrator | Full access with MFA | Full access and model operations with MFA |

## Milestone 2 completion checklist

- Customer features and engagement are reproducible.
- K-Means and Hierarchical results are compared and documented.
- Segment names, profiles, sizes and recommended actions are available.
- Forecast baseline and candidate models are evaluated chronologically.
- Forecasts include model version, horizon, metrics and generated time.
- Database imports are repeatable and do not create duplicates.
- APIs and dashboards use database records and enforce all four role scopes.
- Automated backend, model and frontend checks pass.
- Model report, API notes and demo steps are ready for evaluation.

## Reuse in later milestones

- Customer features and segment history support churn prediction.
- Invoice-product baskets support recommendation and cross-sell models.
- Forecast residuals and stock signals support anomaly detection.
- Versioned model runs, APIs and monitoring are reused during deployment and hardening.
