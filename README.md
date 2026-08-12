# MarketMind AI

MarketMind is a sales intelligence platform for small businesses. The project is organized as a
monorepo so the FastAPI service and the frontend can evolve together without mixing their
dependencies.

The current `Garvitk001` implementation covers Milestone 1 and the functional Milestone 2 scope:
authentication and RBAC, database-backed sales and inventory, customer segmentation and behaviour
analysis, and role-scoped revenue, personal-sales and product-demand forecasting.

```text
Team_1_Small_Biz_Sales_AI/
|-- backend/       FastAPI, database models, RBAC, imports and APIs
|-- frontend/      React/Vite role-aware dashboards and reports
|-- preprocessing/ Dataset cleaning, segmentation and forecasting pipelines
|-- data/          Reviewed samples, quality reports and ignored generated artifacts
`-- docs/          Milestone workflows and model documentation
```

## Backend

The first backend milestone is available in [`backend/`](backend/). It includes:

- user registration, verification, login, logout and password reset
- JWT access tokens with rotating refresh sessions
- administrator MFA
- role-based permissions for Business Owners, Store Managers, Sales Executives and Administrators
- tenant, store and seller data isolation
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

## Team contributions

- Backend and Milestone 1 integration: Garvit (`Garvitk001`)
- Frontend design and features: Divyanka (`divyanka-0525`) and Tejananda (`Tejananda`)
- Dataset selection and preprocessing: Komal (`komal283`)
- Milestone 2 report interface and documentation: Akshaya (`Akshaya29`)
