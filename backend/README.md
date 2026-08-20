# MarketMind Backend

FastAPI backend for MarketMind. It provides authentication, tenant-aware role-based access,
database-backed dashboards, customer segmentation, and sales and demand forecasting.

Backend development and Milestone 1 integration are maintained on the `Garvitk001` branch.
Milestones 1 and 2 are implemented. Churn prediction, recommendations, formal ML anomaly detection
and production hardening remain planned under the Milestone 3 and 4 workflow.

## What is included

- Registration, email verification, login, logout, password reset, and profile updates
- Optional SMTP delivery for registration verification, employee invitations and password resets; development keeps one-time tokens visible for local testing
- Database-backed user profiles with photo upload, five fallback avatars, contact details, date of birth, location, joined date, and role-specific dashboard preferences
- Argon2 password hashing, login throttling and lockout
- Short-lived JWT access tokens and rotating, server-revocable refresh sessions
- TOTP multi-factor authentication, required for administrator actions
- Four system roles: Business Owner, Store Manager, Sales Executive, and Administrator
- Deny-by-default permissions enforced at the API layer
- Tenant, store, and seller-level data isolation
- Business Owner employee invitations, store/role assignment, account state management, target setting, individual performance analysis, and re-authentication
- Database-backed team analytics with revenue, orders, average order value, customers handled, store ranking, previous-period comparison and attention insights
- Store-scoped team performance for Managers and personal target/performance visibility for Sales Executives
- Preference-aware notifications generated from real revenue, inventory, targets, customer, audit and forecasting records
- Evidence-backed alerts for low stock, daily sales movement, target pace and declining purchases, scoped by role, store and seller
- Customer 360 insights with linked visits, favourite products/categories, buying patterns, 30-day comparison and follow-up suggestions
- Saved dashboard periods, inventory views, alert switches and Administrator refresh intervals are enforced by the API and UI
- Guided Business Owner onboarding with store creation, CSV preview/validation, confirmed imports, import history, repeatable sample data and analytics-readiness checks
- Tenant-specific intelligence refresh with source lineage, chronological model validation,
  baseline-improvement gates and K-Means cluster-quality gates
- SKU-linked sales line items for trustworthy store/product demand training
- Atomic daily-sale API with product lines, quantity, unit price, discounts, tax, payment method,
  optional customer reference, automatic inventory deduction and customer-summary updates
- A separately bootstrapped internal Administrator for platform security, RBAC policy, datasets, models, monitoring, and audit
- Append-only audit events for authentication and privileged operations
- Role-specific dashboard navigation and sales KPI scope
- Sales transaction create, list, update, and void workflow
- Repeatable cleaned sales and inventory import with stable upsert keys
- Tenant- and store-scoped product and inventory APIs
- Versioned revenue and product-demand forecasts with model metrics and prediction ranges
- Owner, Manager, Sales Executive and MFA-protected Admin forecasting views
- Administrator selectors for business, store and seller forecasting scopes
- Validated source-store/product to application-store/SKU forecast mapping
- PostgreSQL migrations, Docker Compose, health checks, OpenAPI, linting, and tests

## Project layout

```text
backend/
├── alembic/                 Database migrations
├── app/
│   ├── api/
│   │   ├── dependencies.py  Authentication and permission guards
│   │   └── v1/              Versioned route modules
│   ├── core/                Settings, security, and permission definitions
│   ├── db/                  SQLAlchemy base and session management
│   ├── models/              Identity, audit, session, and sales tables
│   ├── schemas/             API request and response contracts
│   ├── services/            Auth, scope, onboarding, imports and intelligence workflows
│   ├── commands/            Demo seeding and repeatable model/data imports
│   ├── bootstrap.py         Role/permission and initial admin setup
│   └── main.py              FastAPI application
├── tests/                   API, security, RBAC, and isolation tests
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```

## Run with Docker

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

Replace `MARKETMIND_JWT_SECRET` and `MARKETMIND_INITIAL_ADMIN_PASSWORD` before starting:

For real invitation, verification and password-reset emails, also set `MARKETMIND_SMTP_HOST`,
`MARKETMIND_SMTP_PORT`, `MARKETMIND_SMTP_USERNAME`, `MARKETMIND_SMTP_PASSWORD` and
`MARKETMIND_SMTP_FROM_EMAIL`. Production refuses to create security tokens when email delivery is
not configured. Development may expose one-time tokens in the UI so the local workflow remains
testable without an email provider.

```powershell
docker compose up --build
```

The API is available at `http://localhost:8000`. Interactive documentation is at
`http://localhost:8000/api/v1/docs`.

To test a protected endpoint in the interactive documentation:

1. Run `POST /api/v1/auth/login`.
2. Copy `access_token` from the response.
3. Select **Authorize** at the top of the page.
4. Paste the token into the BearerAuth field and confirm.

Swagger adds the `Bearer` prefix automatically, so paste only the token.

The bootstrap administrator must enroll TOTP MFA after the first login:

1. `POST /api/v1/auth/login`
2. `POST /api/v1/auth/mfa/setup`
3. Add the returned provisioning URI to an authenticator
4. `POST /api/v1/auth/mfa/confirm`
5. Sign in again with `mfa_code`

## Run locally

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
alembic upgrade head
python -m app.bootstrap
uvicorn app.main:app --reload
```

The repository frontend defaults to `http://127.0.0.1:8001/api/v1`. For the normal two-terminal
local setup, start Uvicorn with `--port 8001`. The command without that flag uses Uvicorn's port
8000 and is suitable when the frontend API URL is overridden accordingly.

SQLite is the default when no database URL is configured and is intended only for local
development. PostgreSQL is the supported production database.

## Import Milestone 1 data

Run migrations and create the four demo roles before importing. On an empty local database,
`python -m app.commands.seed_demo` creates the `hello` tenant, `MAIN` store and demo accounts.
From `backend/`, import the reviewed repository samples with:

```powershell
python -m app.commands.import_data `
  --tenant hello `
  --store MAIN `
  --seller sales.demo@marketmind.example.com `
  --sales ..\data\processed\sales_cleaned_sample.csv `
  --inventory ..\data\processed\inventory_cleaned_sample.csv `
  --customers ..\data\processed\customer_summary_sample.csv
```

The importer groups sales lines by order, excludes cancellations and invalid financial rows, and
upserts products, inventory, sales and customer summaries using stable tenant/store keys. Running
the same command again does not create duplicates. The resulting sales transactions are read
directly by `GET /api/v1/dashboard/sales`.

Inventory endpoints:

- `GET /api/v1/inventory`
- `GET /api/v1/inventory/summary`
- `GET /api/v1/inventory/{inventory_id}`
- `PATCH /api/v1/inventory/{inventory_id}`

Business Owners can view tenant-wide inventory. Store Managers can view and update their assigned
store. Sales Executives have no inventory access. Administrators have tenant-wide access after MFA.

Customer endpoints:

- `GET /api/v1/customers`
- `GET /api/v1/customers/summary`
- `GET /api/v1/customers/{customer_id}`
- `GET /api/v1/customers/{customer_id}/insights` — role-scoped Customer 360 timeline and purchasing evidence

Operational endpoint groups added in the latest integrated build:

- `/api/v1/onboarding` — store creation, CSV templates, previews, imports and readiness
- `/api/v1/intelligence` — tenant readiness and quality-gated intelligence refresh
- `/api/v1/team` — employee access, targets and role-scoped performance
- `/api/v1/notifications` — preference-controlled operational alerts from database evidence
- `/api/v1/sales` — sales catalog, transaction workflow, daily line-item entry and voiding

Profile and preference endpoints:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `POST /api/v1/users/me/avatar`
- `DELETE /api/v1/users/me/avatar`

Business Owners, Store Managers and Sales Executives can maintain their own profile details and
photo. The internal Administrator has console and security preferences but does not use a public
employee profile or avatar.

Business Owners and Administrators can view tenant customer records. Store Managers receive the
customer summary, while Sales Executives only receive customers assigned to them.

## Import and serve Milestone 2 customer segments

Run the customer segmentation pipeline first, then apply the latest migration and import its full
assignment file:

```powershell
alembic upgrade head
python -m app.commands.import_segments `
  --tenant hello `
  --seller sales.demo@marketmind.example.com `
  --assignments ..\data\generated\customer-segmentation\customer_segments.csv `
  --report ..\data\generated\customer-segmentation\segmentation_report.json
```

The command creates or updates the full customer summaries, records the model version and quality
metrics, and upserts each segment assignment. Running it twice does not create duplicates.

Customer-segmentation endpoints:

- `GET /api/v1/customer-segments/summary`
- `GET /api/v1/customer-segments`
- `GET /api/v1/customer-segments/{customer_id}`

Tenant training endpoints (Business Owner only; training requires recent password confirmation):

- `GET /api/v1/intelligence/readiness` — exact record counts, date coverage, data source and blockers
- `POST /api/v1/intelligence/train` — trains eligible modules and publishes only quality-approved outputs

The onboarding sales CSV contract is
`order_id,order_date,sku,quantity,amount,currency`. `sku` and `quantity` are mandatory because an
order total cannot support a defensible product-demand forecast. Revenue needs at least 30 completed
sales across 30 days, demand needs at least one SKU/store series with 30 records across 30 days, and
segmentation needs at least 20 customers. Forecast models must beat the last-value baseline by 2%
on later unseen dates; clustering requires a Silhouette Score of at least `0.20`. Failed gates are
recorded in the training job and are never served as active dashboard models.

Daily sales endpoints:

- `GET /api/v1/sales/catalog` — store-scoped product and available-stock choices
- `POST /api/v1/sales/transactions` — accepts one or more product lines and calculates totals server-side
- `POST /api/v1/sales/transactions/{transaction_id}/void` — restores stock and reverses customer totals for POS-created sales

The product-sale operation is atomic. Unknown products, products outside the assigned store, duplicate
product lines, invalid discounts, and insufficient inventory reject the complete order without making
partial changes. New sales and customer changes also make the Business Setup intelligence-refresh
indicator active; models are still retrained only after an explicit Business Owner confirmation.

Business Owners and MFA-verified Administrators receive business-wide results. Store Managers can
only read their assigned-store summary. Sales Executives can list or open their assigned customers.
The summary includes segment distribution, revenue contribution, repeat-customer rate, average
order value, recency, engagement, return behavior, and the model's Silhouette Score.

## Train and import Milestone 2 forecasts

From the repository root, train both forecasting tasks on the full source datasets:

```powershell
.\preprocessing\.venv\Scripts\python.exe -m preprocessing.forecasting `
  --amazon "D:\MarketMind\Dataset\archive (9)\Amazon Sale Report.csv" `
  --personal-sales data\processed\sales_cleaned_sample.csv `
  --demand-train "D:\MarketMind\Dataset\train.parquet" `
  --demand-eval "D:\MarketMind\Dataset\eval.parquet" `
  --output data\generated\forecasting
```

The pipeline uses chronological validation. Revenue compares Seasonal Naive, Prophet, a
weekday-aware Linear Trend model, XGBoost and Random Forest. Store/product demand compares
Seasonal Naive, XGBoost and Random Forest.
Candidate metrics are saved with the selected model; full generated files remain ignored by Git.

Apply the migration and synchronize role permissions before importing:

```powershell
alembic upgrade head
python -m app.bootstrap
```

Import the generated output from `backend/`:

```powershell
python -m app.commands.import_forecasts --tenant hello --scope business `
  --predictions ..\data\generated\forecasting\revenue_forecasts.csv `
  --report ..\data\generated\forecasting\revenue_report.json

python -m app.commands.import_forecasts --tenant hello --scope personal `
  --seller sales.demo@marketmind.example.com `
  --predictions ..\data\generated\forecasting\personal_revenue_forecasts.csv `
  --report ..\data\generated\forecasting\personal_revenue_report.json

python -m app.commands.import_forecasts --tenant hello --scope store --store MAIN `
  --source-store-id 1 `
  --predictions ..\data\generated\forecasting\demand_forecasts.csv `
  --report ..\data\generated\forecasting\demand_report.json
```

The optional mapping CSV has this contract:

```csv
source_store_id,source_product_id,store_code,product_sku
1,117,MAIN,REVIEWED-INVENTORY-SKU
```

When an approved crosswalk is available, append
`--product-mapping <path-to-mapping.csv>` to the store import command.

Every store code and product SKU is validated against the tenant. Conflicting, unknown or
cross-store mappings are rejected. Without a reviewed mapping, a demand series remains unmapped and
its stock risk is returned as `unknown`; the importer never guesses a product relationship. The
`--source-store-id 1 --store MAIN` arguments are the explicit source-store to application-store
mapping for the imported run.

The commands are idempotent: importing the same model version and scope again updates changed
values and does not duplicate predictions.

Forecasting endpoints:

- `GET /api/v1/forecasts/revenue` — Business Owner; business-wide INR revenue
- `GET /api/v1/forecasts/personal` — Sales Executive; only the signed-in seller
- `GET /api/v1/forecasts/demand` — Store Manager; only the assigned store
- `GET /api/v1/forecasts/monitoring` — Administrator; MFA-protected model and job status
- `GET /api/v1/forecasts/options` — role-scoped category, product and horizon filter metadata

The forecast routes accept only 7, 14 or 30-day horizons. Revenue supports category filtering;
demand supports category and product filtering and adds inventory risk when the source product is
mapped to an inventory SKU.

Administrators may call all four endpoints. Store demand requires `store_id`, and a personal
forecast requires `seller_id`; the frontend obtains both choices from protected catalog APIs.
Sales Executive personal forecasting is intentionally seller-scoped. It is a documented extension
to the original proposal, which denied general forecasting access to that role.

Revenue and personal responses include a 30-day `history` array of recorded database values before
the future `series`. Every mapped demand product carries the same recorded demand history, keeping
actual observations and model predictions visibly separate.

The demand source target is the Parquet `sale_amount` field. Because its provider has not supplied
a signed definition confirming quantity, money or index semantics, MarketMind reports the unit as
`source_unit` and does not label the value as physical units sold.

Current full-data model evidence:

- Customer segmentation: 5,878 customers, three K-Means segments, Silhouette Score `0.363917`.
- Business revenue: `forecast-v2`, Linear Trend, MAE `77,902.286`, RMSE `107,281.902`,
  R2 `-0.845`; functional baseline only because the dated source history is short.
- Store demand: `forecast-v1`, XGBoost, MAE `2.152`, RMSE `2.945`, R2 `0.918` across the selected
  high-volume series.
- Personal sales: `personal-forecast-v2`, trained separately from authorised cleaned sales data.

For local UI testing, create the four demo accounts with:

```powershell
python -m app.commands.seed_demo
```

The command prints the local credentials and the administrator TOTP setup secret. These accounts
are for development only.

## Quality checks

```powershell
ruff check app tests alembic\env.py
ruff format --check app tests alembic\env.py
pytest --cov=app
alembic check
```

## Development token behavior

In development, registration, invitation, and password reset endpoints return their one-time
token in the response so the backend can be tested without an email provider. Production
configuration suppresses these values. Connect an approved email service before deployment.

## Planned Milestone 3 and 4 backend work

The next modules will extend the current service instead of creating a separate AI backend:

- churn model runs and customer risk predictions with documented label windows;
- stock-aware product recommendations and explicit user feedback;
- anomaly model runs, evidence-backed alert records and resolution actions;
- monitoring, model approval/rollback, backups, security testing and staged deployment.

All future endpoints must keep the existing tenant/store/seller scope, Administrator MFA,
deny-by-default permissions, model versioning and honest `not_ready` behavior. See the
[Milestone 3 and 4 workflow](../docs/milestone-3-4/milestone-3-4-workflow.md).
