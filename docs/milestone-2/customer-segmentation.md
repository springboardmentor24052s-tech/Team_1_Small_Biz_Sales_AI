# Customer segmentation and purchasing behavior

This is the first MarketMind Milestone 2 model. It converts customer purchase history into a
versioned feature table, compares clustering approaches, assigns understandable business segments,
and exposes the results through the existing authenticated API.

## Source and cleaning

The model uses both sheets of `online_retail_II.xlsx`. The complete source stays outside Git; only
a reviewed sample and aggregate quality report are committed.

The latest full run processed 1,067,371 source rows. It removed 34,335 duplicate rows and excluded
235,151 rows without a usable customer ID. Returns remain available as behavioral signals but are
not counted as positive sales revenue. The final model contains 5,878 customers.

## Customer features

The reusable feature table contains classic RFM measures and additional purchasing behavior:

- recency, order frequency, total revenue, quantity, and average order value;
- active days, active months, customer tenure, and average days between orders;
- average basket size, product variety, and purchase frequency per 30 days;
- return orders, returned quantity, returned value, and return rate;
- a transaction engagement score from 0 to 100.

The engagement score uses 35% recency, 25% order frequency, 20% active months, 10% product variety,
and 10% inverse return rate. It measures purchasing engagement only. It does not claim to measure
email, advertising, or website engagement because those events are not present in this dataset.

## Model selection

Skewed count and monetary features are transformed with `log1p` and scaled with `RobustScaler`.
K-Means and Hierarchical Clustering are evaluated from 2 through 8 clusters using Silhouette Score,
Davies-Bouldin Score, and Calinski-Harabasz Score. Hierarchical evaluation uses a deterministic
2,000-customer sample to keep memory usage predictable.

The current K-Means model selected three clusters:

| Segment | Customers | Customer share | Revenue share | Business reading |
| --- | ---: | ---: | ---: | --- |
| Champions | 2,113 | 35.95% | 84.04% | Recent, frequent, high-value and highly engaged |
| Needs Attention | 1,058 | 18.00% | 8.04% | Moderate value with older activity and a high return rate |
| Hibernating | 2,707 | 46.05% | 7.92% | Low-frequency customers with long purchase inactivity |

Selected-model metrics:

- Silhouette Score: `0.363917`
- Davies-Bouldin Score: `1.052492`
- Calinski-Harabasz Score: `3643.936581`

The segment names describe the current cluster profiles. They are not hard-coded predictions and
will be regenerated if a later model version produces a different cluster structure.

## Database design

`segmentation_model_runs` stores the model version, algorithm, selected cluster count, features,
evaluation metrics, and training time. `customer_segment_assignments` stores one assignment and its
behavior snapshot per customer and model run. A new model version therefore keeps historical
assignments instead of overwriting the previous run.

The import command uses stable model-run and customer keys. It can create missing customer summaries
and safely update an existing run, so repeating the same import does not duplicate records.

## API and role access

| Endpoint | Owner/Admin | Store Manager | Sales Executive |
| --- | --- | --- | --- |
| `GET /customer-segments/summary` | Business-wide | Assigned-store summary | Assigned-customer summary |
| `GET /customer-segments` | Business-wide customers | Not permitted | Assigned customers only |
| `GET /customer-segments/{customer_id}` | Business-wide customer | Not permitted | Assigned customer only |

Administrator access still requires MFA because the same backend permission dependency protects
these endpoints.

## Reuse in later milestones

The feature table is intentionally reusable. Churn prediction can use recency, purchase gaps,
frequency, tenure, and return behavior. Product recommendations can use the underlying invoice and
product baskets. Model-run versioning and role-scoped APIs can also be reused by forecasting,
recommendation, and anomaly-detection modules.
