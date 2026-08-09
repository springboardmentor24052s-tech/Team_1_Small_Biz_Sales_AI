# MarketMind AI

MarketMind is a sales intelligence platform for small businesses. The project is organized as a
monorepo so the FastAPI service and the frontend can evolve together without mixing their
dependencies.

```text
Team_1_Small_Biz_Sales_AI/
├── backend/   FastAPI, PostgreSQL, authentication, RBAC, dashboards and sales APIs
└── frontend/  React/Vite authentication and role-aware dashboard application
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
- The Administrator forecasting view reports real model versions, metrics and import-job status.

Read the [Milestone 2 workflow](docs/milestone-2/milestone-2-workflow.md) for the agreed task order,
datasets, models and completion checks. The detailed
[customer segmentation notes](docs/milestone-2/customer-segmentation.md) contain the feature
definitions, evaluation metrics, commands and API routes.

## Frontend connection

The backend exposes versioned routes under `/api/v1` and permits configured React development
origins through CORS. A Vite frontend can use:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Interactive API documentation is available at `http://localhost:8000/api/v1/docs` while the
service is running.

For the current local setup, the backend is running on port `8001`. Start the frontend from its
directory with `npm run dev`, then open `http://127.0.0.1:5173`.

## Team contributions

- Backend and Milestone 1 integration: Garvit (`Garvitk001`)
- Frontend design and features: Divyanka (`divyanka-0525`) and Tejananda (`Tejananda`)
- Dataset selection and preprocessing: Komal (`komal283`)
- Documentation(`Akshaya29`)
