# MarketMind Frontend

The MarketMind frontend is a React and Vite application for small-business sales and inventory
operations. It connects to the FastAPI service in `../backend` and presents a different workspace
for each authorized role.

## Milestone 1 features

- Login and session handling through the backend API
- Separate dashboards for Business Owners, Store Managers, Sales Executives, and Administrators
- Role-aware navigation and access restrictions
- Database-backed sales KPIs and revenue trends
- Sales date filtering and role-scoped global search
- Sales transaction create, update, and void workflows
- Inventory stock levels and low-stock alerts
- Administrator user and access management
- Indian rupee formatting throughout the application
- Clear labels for sample layouts and features planned for later milestones

## Milestone 2 features

- Business Owner INR revenue forecasting with 7, 14 and 30-day horizons and category filtering
- Store Manager product-demand forecasting with category/product filters and stock-mapping status
- Sales Executive personal forecast trained from authorised cleaned sales history
- Administrator access to business revenue, store demand, seller-personal forecasts, model registry
  and import-job monitoring, with explicit store/seller selectors
- Actual-versus-predicted charts, confidence ranges and chronological model metrics
- Customer segment profiles, purchasing behaviour, engagement, search, pagination and drill-down
- Backend-enforced business, store, seller and administrator access scopes
- CSV and print/PDF actions shown only to roles with report-export permission
- Demand rows show their inventory mapping status, reviewed SKU/name and stock risk; unmapped source
  identifiers are labelled clearly instead of being matched automatically

The Sales Executive page is a limited personal forecast, not general forecasting access. The
backend always replaces any requested seller scope with the signed-in seller's ID. Demand values
use the label `source_unit` until the Parquet provider confirms the meaning of `sale_amount`.

## Run locally

Install the frontend dependencies:

```powershell
cd frontend
npm ci
```

Set the API address in `frontend/.env` when the backend is not using the default local URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api/v1
```

Start the development server:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173` in a browser. The FastAPI service must also be running for login,
dashboard data, search, inventory, and transaction actions to work.

Useful local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend readiness: `http://127.0.0.1:8001/api/v1/health/ready`
- Swagger UI: `http://127.0.0.1:8001/api/v1/docs`

## Checks

```powershell
npm run lint
npm run build
```

## Main folders

```text
frontend/src/
|-- components/
|   |-- auth/         Login and registration screens
|   |-- common/       Navigation, search, filters, and shared UI
|   |-- dashboards/   Role-specific dashboards
|   `-- modules/      Sales, inventory, reports, and settings views
|-- context/          Authentication and API data state
|-- data/             UI fixtures used only for labelled sample sections
`-- App.jsx           Application shell and role-based routing
```

## Frontend contributors

The frontend design and feature work was contributed by:

- Divyanka (`divyanka-0525`) — forecasting dashboard visual concepts
- Tejananda (`Tejananda`) — application layout and Milestone 1 frontend integration
- Akshaya (`Akshaya29`) — Milestone 2 analytics and forecasting report interface

Their branch work was retained while connecting the user interface to the Milestone 1 backend and
database services.
