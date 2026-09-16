# Milestone 3 and 4 workflow

## Current baseline

MarketMind already has the Milestone 1 and 2 foundation: FastAPI and React, JWT authentication,
Administrator MFA, tenant/store/seller RBAC, PostgreSQL-compatible models and migrations,
repeatable imports, onboarding, sales and inventory operations, customer segmentation and
role-scoped forecasting.

Milestone 3 extends this platform with churn prediction, product recommendations and formal ML
anomaly detection. Milestone 4 validates, deploys and operates the integrated application. These
features remain planned until their completion gates pass.

## Milestone 3 workflow

1. **Confirm definitions.** Agree the churn inactivity window, eligible customers,
   recommendation context, anomaly severity and alert owners.
2. **Extend data contracts.** Add consent, dated engagement events, customer-product baskets,
   inventory movements and recommendation feedback without changing existing tenant/store/user/
   customer/product IDs.
3. **Build reusable features.** Reuse RFM, engagement, segment, forecast residual and stock
   signals. Add point-in-time churn labels and customer-item interaction features.
4. **Establish baselines.** Start with inactivity rules, popular/category products, association
   rules and statistical thresholds before evaluating complex models.
5. **Train and compare.** Use chronological splits, inspect role/store slices and reject leakage,
   unstable results or excessive false alerts.
6. **Store versioned outputs.** Persist the model run, feature version, scope, metrics, generated
   time and predictions. Actual business records are never overwritten.
7. **Connect APIs and dashboards.** Return role-scoped results, explanations, feedback controls and
   clear `not_ready` states through FastAPI and React.
8. **Run acceptance checks.** Test repeat imports, tenant isolation, model gates, API contracts,
   frontend states and human review of recommendations and alerts.

Recommended build order: churn labels and datasets, association-rule recommendations, churn
candidate models, then Isolation Forest anomaly scoring. This gives the backend and frontend stable
contracts before heavier models are introduced.

## Dataset map

| Dataset | Status | Use |
| --- | --- | --- |
| Online Retail II transactions | Continue | Churn features, customer-item baskets, repeat-purchase analysis and association rules |
| Customer summaries and segment assignments | Continue | RFM, engagement, churn features and segment-aware actions |
| Application sales transactions and line items | Continue | Tenant/store/seller history, baskets, cross-sell evidence and sales anomalies |
| Products and inventory | Continue | Availability filtering, stock-aware recommendations and inventory anomalies |
| Forecast outputs and actuals | Continue | Revenue/demand residual anomalies and model monitoring |
| Customer engagement events | Add in Milestone 3 | Dated visits/contacts/campaign outcomes and consent for churn and engagement |
| Recommendation feedback | Add in Milestone 3 | Impressions, clicks, acceptance, rejection and purchases for evaluation |
| Operational telemetry | Add in Milestone 4 | API health, audit, model runs, drift, jobs and incident response |

Stable identifiers and consent are mandatory. Returns, cancellations, voids, unavailable products
and stockouts remain explicit. Unknown product/store mappings are never guessed. When a tenant has
too little eligible history, MarketMind reports the exact blocker instead of showing a fake score.

## Compatible model plan

| Capability | Models | Why it fits the current project | Acceptance evidence |
| --- | --- | --- | --- |
| Customer segmentation | Continue K-Means; Hierarchical comparator | Existing RFM and engagement pipeline | Silhouette, Davies-Bouldin, stability and useful profiles |
| Forecasting | Continue Seasonal Naive, Linear Trend/Prophet, XGBoost and Random Forest | Existing chronological forecast pipeline and inventory link | MAE, RMSE, bias, baseline improvement and matured accuracy |
| Churn prediction | Logistic Regression baseline; Random Forest/XGBoost candidates | Existing tabular customer features | Precision, recall, F1, PR-AUC, ROC-AUC, calibration and scope slices |
| Product recommendations | Association rules first; popularity/category fallback; item-based CF or implicit ALS when dense | Existing invoice-product baskets and inventory SKUs | Precision@K, Recall@K, coverage, diversity and reviewed conversion |
| Anomaly detection | Business rules and robust statistics first; Isolation Forest candidate | Existing alerts, sales, stock and forecast residuals | Reviewed precision, detection rate, false-alert workload and resolution time |

A complex model is selected only when it beats the approved baseline on unseen, time-ordered data
and remains understandable at the user's permitted scope. Otherwise the baseline remains active and
the failed candidate is recorded for review.

## Planned APIs and database records

Proposed route groups:

- `GET /api/v1/churn/summary` and `GET /api/v1/churn/customers`
- `GET /api/v1/recommendations/customer/{id}` and recommendation feedback routes
- `GET /api/v1/anomalies` with acknowledgement and resolution actions
- `GET /api/v1/models/monitoring` and versioned model-run details

Planned tables store churn model runs/predictions, recommendation runs/results/feedback, anomaly
runs/events/actions and shared model status. Every record includes tenant scope, model and feature
version, metrics, approval state and generated time where applicable.

Role rules continue unchanged:

- Business Owners receive tenant-scoped results and operational actions, not platform model
  administration.
- Store Managers receive assigned-store results.
- Sales Executives receive recommendations only for assigned customers; they do not receive a
  churn report or inventory/model controls.
- The internal Administrator can configure, monitor and audit approved models after MFA.

## Milestone 4 workflow

1. Freeze approved requirements, API schemas, migrations, model versions and known limitations.
2. Run a clean PostgreSQL install, apply all migrations, seed roles and import every dataset twice
   to verify idempotency.
3. Test onboarding, sales, inventory, settings, alerts, segmentation, forecasting, churn,
   recommendations and anomaly workflows for all four roles.
4. Reproduce model features and artifacts; verify leakage controls, baselines, calibration,
   role/store slices, drift, false alerts and rollback.
5. Test authentication, MFA, session revocation, tenant isolation, uploads, rate limits, secrets,
   audit coverage and PII minimization.
6. Validate responsive screens, keyboard access, contrast, loading/empty/error states, latency,
   large imports and concurrent jobs.
7. Build Docker images and deploy FastAPI with PostgreSQL to staging. Apply migrations, configure
   HTTPS and secrets, then run smoke tests before a production decision.
8. Enable logs, health alerts, backups, restore rehearsal, model/application rollback and incident
   runbooks.
9. Complete role-based UAT, publish the final evidence and release only after rollback is proven.

## Team priority

| Priority | Area | Required result |
| --- | --- | --- |
| P0 | Data and product decisions | Approved churn policy, consent, events, baskets, anomaly severity and success metrics |
| P1 | Data pipeline | Validated point-in-time features, interaction density, lineage and quality reports |
| P2 | Models | Baselines, candidates, chronological evaluation, model cards and safe fallbacks |
| P3 | Backend/database | Migrations, imports, scoped APIs, audit, jobs and model lifecycle |
| P4 | Frontend | Role pages, filters, explanations, feedback, alerts and `not_ready` states |
| P5 | Integration and QA | Clean install, repeat imports, role/model/API/UI tests and end-to-end demo |
| P6 | Deployment hardening | Security, accessibility, load, monitoring, backup, UAT and rollback evidence |

## Completion gates

Milestone 3 is complete only when all three new modules use real tenant data, approved model or
baseline results reach role-scoped APIs and dashboards, low-data states show no fake predictions,
and automated model/API/RBAC tests pass.

Milestone 4 is complete only when a clean PostgreSQL installation and all four role journeys pass,
there are no unresolved critical or high security findings, agreed performance and accessibility
targets pass, monitoring and backup/restore work, rollback is demonstrated and UAT is signed.
