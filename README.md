# MarketMind AI

MarketMind is a sales intelligence platform for small businesses. The project is organized as a
monorepo so the FastAPI service and the frontend can evolve together without mixing their
dependencies.

The current `Garvitk001` implementation covers Milestone 1 and the functional Milestone 2 scope:
authentication and RBAC, database-backed sales and inventory, customer segmentation and behaviour
analysis, and role-scoped revenue, personal-sales and product-demand forecasting. The current build
also includes guided business onboarding, employee activation, profile and preference settings,
operational alerts, daily sales entry and team-performance views.

```text
Team_1_Small_Biz_Sales_AI/
|-- backend/       FastAPI, database models, RBAC, imports and APIs
|-- frontend/      React/Vite role-aware dashboards and reports
|-- preprocessing/ Dataset cleaning, segmentation and forecasting pipelines
|-- data/          Reviewed samples, quality reports and ignored generated artifacts
`-- docs/          Milestone workflows and model documentation
```

## Project documentation

The [Software Requirements Specification v1.1](docs/srs/MarketMind_AI_Detailed_SRS_v1.1.docx)
records the implemented Milestone 1 and Milestone 2 scope. It also keeps Milestone 3 and Milestone 4
requirements separate as planned work, so future features are not presented as complete.

## Backend

The first backend milestone is available in [`backend/`](backend/). It includes:

- user registration, verification, login, logout and password reset
- JWT access tokens with rotating refresh sessions
- administrator MFA
- role-based permissions for Business Owners, Store Managers, Sales Executives and Administrators
- Business Owner control of employee invitations, role/store assignment, account state, revenue targets and employee performance analysis
- Role-scoped performance views for Store Managers and Sales Executives
- Role-specific preferences that actively control dashboard periods, inventory views, summaries, notifications and monitoring refresh
- Role-scoped alerts for low inventory, daily sales movement, target progress and evidence-backed customer decline
- Customer 360 timelines built from linked sales, including visits, preferred products and practical follow-up suggestions
- Tenant-isolated Business Owner onboarding for stores, products, opening inventory, sales, customers, sample data and analytics readiness
- Tenant-specific **Train & Refresh Intelligence** workflow with chronological holdout tests,
  baseline comparison, clustering quality gates and explicit rejection of unreliable outputs
- Product-level sales lines (`SKU` + `quantity`) so demand forecasts are based on actual product
  movement rather than order-level totals
- Daily multi-product POS entry for Store Managers and Sales Executives, with server-calculated
  totals, stock validation/deduction, customer-summary updates and reversible voiding
- one internally bootstrapped Administrator account for platform security, RBAC policy and monitoring
- tenant, store and seller data isolation
- role-aware Settings with database-backed employee profiles and internal Administrator controls
- role-aware dashboard access and sales KPIs
- sales transaction endpoints
- Alembic migrations, tests, Docker Compose and OpenAPI documentation

See [`backend/README.md`](backend/README.md) for installation and startup instructions.

## Local quick start

Use two PowerShell terminals from the repository root.

Backend:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m app.commands.seed_demo
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Open the frontend at `http://127.0.0.1:5173` and Swagger UI at
`http://127.0.0.1:8001/api/v1/docs`. Generated datasets and local database files are intentionally
excluded from Git.

## Milestone 2: customer intelligence

Milestone 2 covers customer intelligence and forecasting. The completed customer-intelligence
module turns the complete Online Retail II transaction history into reusable behaviour features
and data-driven segments. It evaluates K-Means and Hierarchical Clustering, selects the K-Means
cluster count using Silhouette Score, and stores versioned segment assignments in the application
database.

For a newly onboarded business, models are not copied from the demo tenant and insights are not
fabricated. The Business Owner imports dated business records, checks readiness in **Business
Setup**, and starts **Train & Refresh Intelligence**. Revenue and demand models are evaluated on a
chronological holdout and must improve on the last-value baseline by at least 2%. Customer clusters
must pass a minimum Silhouette Score of `0.20` and cluster-size checks. Only accepted outputs are
published to role-scoped dashboards; rejected and not-ready results remain visible only as status
messages.

The current full-data run selected three useful groups: Champions, Needs Attention, and
Hibernating. The FastAPI endpoints apply the existing role rules so owners and administrators can
see business-wide results, store managers receive store summaries, and sales executives only see
their assigned customers.

Current status:

- Customer feature engineering, engagement analysis and segmentation are implemented.
- Model results can be imported repeatedly without creating duplicates.
- Database-backed segment APIs and the customer dashboard follow the four-role access rules.
- Automated preprocessing, import, API and role tests are included.
- Revenue, personal-sales and store/product demand forecasting are implemented with versioned,
  repeatable database imports and four role-scoped APIs.
- Administrators can open business revenue, store demand, seller-personal and model-monitoring
  reports after MFA. Store and seller selectors preserve the requested data scope.
- The React reports workspace now uses those APIs for 7/14/30-day charts, confidence ranges,
  category/product filters, role-controlled exports, loading/error states and model comparison.
- The customer workspace provides segment profiles, purchasing-behaviour KPIs, search, filtering,
  pagination, drill-down details and scope-aware exports.
- Forecast charts place 30 days of recorded database history before the future prediction range.
  Segmentation uses an observed distribution because clustering assigns current customers rather
  than predicting a future time series.
- Personal forecasts are trained separately from the cleaned sales records instead of reusing the
  business-wide Amazon forecast.
- Revenue model comparison includes a weekday-aware linear trend candidate in addition to the
  Seasonal Naive, Prophet, XGBoost and Random Forest candidates.
- Demand-to-inventory linking uses an explicit validated source ID to store/SKU mapping. Unknown
  source IDs remain visibly unmapped instead of receiving a guessed inventory product.

The Sales Executive forecast is an approved project extension to the original access matrix. It
contains only the signed-in seller's authorised sales history and does not grant access to business
or store forecasting. The supplied Parquet field `sale_amount` is used as the demand target, but its
business unit has not been confirmed by the provider. The UI and API therefore label it
`source_unit`, not units sold or revenue.

Read the [Milestone 2 workflow](docs/milestone-2/milestone-2-workflow.md) for the agreed task order,
datasets, models and completion checks. The detailed
[customer segmentation notes](docs/milestone-2/customer-segmentation.md) contain the feature
definitions, evaluation metrics, commands and API routes.

The [Milestone 2 status PDF](docs/milestone-2/marketmind-milestone-2-status-and-remaining-work.pdf)
summarizes completed work, remaining priorities, execution order and final acceptance checks.

## Frontend connection

The backend exposes versioned routes under `/api/v1` and permits configured React development
origins through CORS. A Vite frontend can use:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The Vite client defaults to port `8001` for local API requests. Docker Compose exposes the backend
on port `8000`; set `VITE_API_BASE_URL=http://localhost:8000/api/v1` when using Docker.

## Frontend experience

The React application includes an English/Hindi landing page, light and dark themes, role-specific
navigation and dashboards, profile avatars, personal preferences and account recovery screens.
Business Owners can complete store setup, import their business data, review readiness and manage
Store Manager and Sales Executive access. Store Managers and Sales Executives receive only their
assigned operational scope, while the internal Administrator workspace is reserved for security,
permissions, audit and model monitoring.

## Next milestones

- **Milestone 3:** product recommendations, churn prediction and a formal anomaly-detection model,
  supported by approved labels, interaction data and offline model evaluation.
- **Milestone 4:** production deployment hardening, accessibility, load and security testing,
  observability, backup and restore, UAT evidence and rollback procedures.

## Team contributions

- Backend and Milestone 1 integration: Garvit (`Garvitk001`)
- Frontend design and features: Divyanka (`divyanka-0525`) and Tejananda (`Tejananda`)
- Dataset selection and preprocessing: Komal (`komal283`)
- Milestone 2 report interface and documentation: Akshaya (`Akshaya29`)
