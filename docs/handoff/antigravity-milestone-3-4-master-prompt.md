# MarketMind AI — Antigravity Milestone 3 and 4 handoff

Copy the prompt below into Antigravity after opening the latest MarketMind repository. Attach the
project brief PDF if Antigravity cannot read files outside the repository.

## Files Antigravity must read first

Treat these files as the source of truth, in this order:

1. `D:\MarketMind\AI_Small Business Sales Intelligence Platform.pdf`
2. `docs/srs/MarketMind_AI_Detailed_SRS_v1.1.docx`
3. `docs/milestone-3-4/milestone-3-4-workflow.md`
4. `docs/milestone-3-4/marketmind-milestone-3-4-workflow.pdf`
5. `docs/milestone-2/milestone-2-workflow.md`
6. `docs/milestone-2/customer-segmentation.md`
7. `README.md`, `backend/README.md`, `frontend/README.md`, `data/README.md` and
   `preprocessing/README.md`

If two documents disagree, prefer the newer SRS and Milestone 3–4 workflow, then explain the
conflict before changing code. Never silently reinterpret a business rule.

## Master prompt

```text
You are continuing the MarketMind AI project for Milestones 3 and 4. This is an existing,
integrated application, not a greenfield project. Inspect the repository and all supplied project
documents before writing code.

Repository and branch safety

- Start from the latest origin/Garvitk001.
- Create or use a dedicated milestone-3-4-development branch unless I explicitly name another
  branch.
- Never change main, Review or teammate branches directly.
- Preserve all current frontend, backend, preprocessing, documentation and contributor credits.
- Do not commit or push until you show me the exact changed-file list, tests and proposed commit
  message and I approve them.
- Do not commit secrets, local databases, virtual environments, node_modules, full licensed
  datasets, generated model artifacts or temporary output.

Current implementation that must continue working

- React/Vite frontend with the current MarketMind visual identity, responsive layout, larger
  readable typography, INR formatting, English/Hindi landing content and light/dark themes.
- Four role workspaces: Business Owner, Store Manager, Sales Executive and internal Administrator.
- FastAPI, Pydantic, SQLAlchemy, Alembic, SQLite for local development and PostgreSQL/Docker for
  deployment.
- JWT access/refresh sessions, Argon2 password hashing, Administrator TOTP MFA, audit events and
  deny-by-default backend RBAC.
- Tenant, store and seller data isolation. Frontend hiding is not security; every protected action
  must be checked by the backend.
- Business onboarding, CSV preview/import, employee invitation and activation, password recovery,
  profiles, personalized settings, notifications, team performance, Customer 360, daily
  multi-product sales, inventory and reversible voiding.
- Milestone 2 K-Means segmentation with a Hierarchical comparator.
- Revenue, personal-sales and product-demand forecasting using the existing baseline/candidate
  approach: Seasonal Naive, Linear Trend/Prophet, XGBoost and Random Forest where applicable.
- Versioned model runs, chronological evaluation, repeatable imports, role-scoped APIs, readiness
  checks and honest not_ready states.

Non-negotiable product rules

- Never display demo, random, copied or hard-coded AI predictions as real results.
- A new tenant receives only its own imported/entered records and its own model outputs.
- If data is insufficient, return status=not_ready with exact blockers and minimum requirements.
- Keep actual observations visually separate from predictions, scores and recommendations.
- Show model/baseline name, version, generated time, data scope and a plain-language explanation.
- Keep unknown store/product mappings explicitly unmapped. Never guess a cross-dataset identity.
- Preserve returns, cancellations, voids, unavailable items and stockouts as explicit signals.
- Apply consent and minimum-data rules before using customer engagement or recommendation events.
- Use chronological or point-in-time validation for time-dependent tasks; never leak future data.
- A complex model may be activated only when it passes the documented quality gate and improves on
  the approved baseline. Otherwise keep the safe baseline or not_ready state.

UI and design compatibility

- Extend existing React components, CSS variables, cards, tables, filters, charts, spacing,
  typography, navigation, themes and loading/error patterns. Do not replace the UI framework or
  redesign the product.
- Maintain the same premium dark-blue/purple MarketMind style in both light and dark themes.
- Keep text business-friendly for Indian small-business users; place technical model details in an
  expandable information area rather than the main KPI row.
- Use Indian rupees for money and preserve the documented source_unit label for Parquet demand
  until the provider confirms its meaning.
- Each new page must include responsive behavior, loading, empty, not-ready, error,
  permission-denied and success states.
- Keep global navigation and role dashboards consistent. Add a sidebar item only when the feature
  is useful for that role.
- Do not claim that a planned feature is working before its database, API, RBAC and tests exist.

Milestone 3 implementation order

Phase 0 — repository audit and contracts

1. Read the project brief, SRS, workflow and all READMEs.
2. Inspect current migrations, models, permissions, APIs, services, preprocessing, frontend
   modules and tests.
3. Produce a short gap matrix: requirement, current support, missing work, files affected and
   acceptance test.
4. Freeze definitions for churn inactivity, eligible customers, recommendation context, anomaly
   severity, alert ownership, consent and minimum data.
5. Propose API schemas and database migrations before implementing UI pages.

Phase 1 — governed data foundation

- Reuse Online Retail II transactions, customer summaries and segment assignments for RFM,
  purchase gaps, returns, baskets and churn features.
- Reuse application sales transactions and sales line items for tenant/store/seller/customer/SKU
  history.
- Reuse products and inventory for availability filtering and stock-aware recommendations.
- Reuse forecast actuals, predictions and residuals for anomaly evidence.
- Add tenant-scoped customer engagement events with event time, channel, outcome and consent.
- Add recommendation feedback: shown, clicked, accepted, rejected, purchased and timestamp.
- Add inventory movement/anomaly action records only when required by the approved schema.
- Add validation, quality reports, stable identifiers, lineage and repeatable imports/upserts.

Phase 2 — churn prediction

- Create point-in-time labels using an observation window followed by an inactivity window.
- Begin with a transparent inactivity-rule baseline and Logistic Regression.
- Compare Random Forest and XGBoost only after the baseline dataset is valid.
- Evaluate precision, recall, F1, PR-AUC, ROC-AUC, calibration and tenant/store/segment slices.
- Store versioned churn model runs and customer predictions with probability, risk band, top
  drivers, scope and generated time.
- Proposed APIs: GET /api/v1/churn/summary and GET /api/v1/churn/customers. Training/activation
  must require the approved privileged permission and recent authentication where appropriate.
- Business Owner: tenant view. Store Manager: assigned-store view only if approved by SRS.
  Sales Executive: no churn report. Administrator: monitoring/configuration after MFA.

Phase 3 — product recommendations

- Start with popularity/category fallback and association rules from valid invoice-product baskets.
- Filter unavailable, out-of-stock, returned and unauthorized products before returning results.
- Add item-based collaborative filtering or implicit ALS only when interaction density is enough.
- Evaluate Precision@K, Recall@K, coverage, diversity and later reviewed conversion.
- Store versioned recommendation results and feedback with product eligibility evidence and a
  plain-language reason such as Frequently bought together or Popular in this customer's category.
- Proposed APIs: GET /api/v1/recommendations/customer/{id}, product-level alternatives where
  approved, and POST /api/v1/recommendations/feedback.
- Business Owner: tenant scope. Store Manager: assigned store. Sales Executive: assigned customers
  only. Administrator: audit/configuration after MFA.

Phase 4 — anomaly detection

- Begin with existing business alerts and robust statistical thresholds for sales, stock and
  forecast residuals.
- Compare Isolation Forest only when enough clean history exists.
- Each anomaly must include evidence, expected range, observed value, severity, scope, detector
  version, status, assignee and resolution notes.
- Measure reviewed precision, detection rate, false-positive workload and time to resolution.
- Proposed APIs: GET /api/v1/anomalies and protected acknowledgement/resolution actions.
- Role scope must follow tenant/store/seller ownership; model configuration remains Administrator
  only after MFA.

Phase 5 — frontend and integration

- Connect all new pages only to real authenticated FastAPI responses.
- Add understandable KPI cards, filters, searchable tables, detail drawers and charts only where
  they help a business decision.
- Show actual versus predicted/expected values clearly. Churn and recommendation screens must not
  present cluster assignments as future predictions.
- Add explanation and feedback controls and keep export actions permission-controlled.
- Extend Swagger/OpenAPI, Postman examples and human-written README/workflow documentation.

Milestone 3 completion gate

- Churn, recommendation and anomaly modules use real tenant data.
- Baselines and candidate models are documented and reproducible.
- Versioned approved outputs reach database-backed, role-scoped APIs and dashboards.
- Low-data tenants receive no fake predictions.
- Unit, preprocessing/model, API-contract, repeat-import, tenant-isolation, RBAC and frontend tests
  pass.

Milestone 4 implementation order

1. Freeze requirements, API schemas, migrations, model versions and known limitations.
2. Perform a clean PostgreSQL installation; apply every migration; seed four demo roles; import
   each dataset twice; verify idempotency and no duplicate business records.
3. Run functional journeys for onboarding, employees, sales, inventory, customers, settings,
   alerts, segmentation, forecasts, churn, recommendations and anomalies across all four roles.
4. Reproduce model features/artifacts and verify leakage controls, baseline comparisons,
   calibration, scope slices, drift, false alerts, approval and rollback.
5. Test authentication, MFA, refresh/session revocation, tenant isolation, file uploads, rate
   limits, secret handling, audit coverage and PII minimization.
6. Test responsive layout, keyboard access, contrast, readable font size, loading/empty/error
   states, API latency, large imports and concurrent jobs.
7. Build Docker images and run FastAPI with PostgreSQL in staging. Keep frontend/backend environment
   values separate, configure HTTPS/secrets and run migrations before smoke tests.
8. Add structured logs, health/readiness endpoints, job/model monitoring, alerts, backups, restore
   rehearsal, application rollback, model rollback and incident runbooks.
9. Complete role-based UAT and publish final architecture, ERD, data/model cards, API/Postman,
   deployment, testing, backup and known-limitations documents.

Milestone 4 completion gate

- Clean PostgreSQL installation and all four role journeys pass.
- No unresolved critical/high security issue remains.
- Agreed performance and accessibility targets pass.
- Monitoring, backup/restore and application/model rollback are demonstrated.
- UAT evidence and release documentation are complete.

Required working behavior

- Work in small reviewable phases. Before each phase, list the exact files and migrations you plan
  to change.
- Preserve backward compatibility unless an approved migration and frontend update are included.
- After each phase, run the most relevant backend, preprocessing and frontend tests and report the
  exact results. Do not say tests passed if they were not run.
- If a dataset field or business definition is uncertain, stop that feature at not_ready and record
  the decision needed. Do not invent a meaning.
- Keep documentation concise, human-written and synchronized with actual code.
- At the end of every phase, provide: completed work, remaining work, changed files, migrations,
  API changes, model evidence, role-access evidence, tests, known limitations and the next safest
  step.

Start now with Phase 0 only. Do not modify code yet. First return the repository audit, conflict
check, gap matrix, proposed database/API contracts and a phase-by-phase implementation plan based
on the actual repository.
```

## Recommended way to use this prompt

1. Open `Team_1_Small_Biz_Sales_AI` in Antigravity and fetch the latest `Garvitk001` branch.
2. Attach the external project brief PDF. The SRS and workflow files are already inside the repo.
3. Paste the master prompt without removing the safety or `not_ready` rules.
4. Review Antigravity's Phase 0 audit before allowing any code change.
5. Approve one phase at a time and inspect the changed-file list and tests before each commit.

This staged approach keeps the current application usable while each Milestone 3 and 4 capability
is added and verified.
