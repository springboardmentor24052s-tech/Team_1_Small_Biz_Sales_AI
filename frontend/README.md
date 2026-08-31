# MarketMind Frontend

The MarketMind frontend is a React and Vite application for small-business sales and inventory
operations. It connects to the FastAPI service in `../backend` and presents a different workspace
for each authorized role.

The current interface implements Milestones 1 and 2. Milestone 3 recommendation, churn and formal
ML anomaly screens are planned and must not display fabricated predictions before their APIs and
quality gates are implemented.

## Milestone 1 features

- Login and session handling through the backend API
- Separate dashboards for Business Owners, Store Managers, Sales Executives, and Administrators
- Role-aware navigation and access restrictions
- Database-backed sales KPIs and revenue trends
- Sales date filtering and role-scoped global search
- Sales transaction create, update, and void workflows
- Inventory stock levels and low-stock alerts
- Business Owner Team & Performance workspace for employee access, targets, search/filtering, performance trends and individual drill-down
- Store Manager team-performance view and Sales Executive personal-performance view, both restricted to their authorized data scope
- Internal Administrator workspace for platform RBAC policy, security audit and model monitoring
- Settings in every role workspace, with database-backed profiles for Owners, Managers and Sales Executives
- Email-confirmed employee invitations that remain pending until activation, plus email-based password recovery
- Profile photos or selectable fallback avatars, contact/location details, date of birth, joined date, role/store context, language, theme, date, density and personalized role preferences
- Active role preferences: default KPI/sales periods, inventory views, live summaries, stock/revenue/customer/security alerts and Administrator monitoring intervals
- Database-generated notification centre with preference-controlled low-stock, sales movement, target-progress and customer-decline alerts
- Business Setup workspace with a progress checklist, store creation, downloadable CSV templates, validation previews, error reports, sample data and forecast-readiness indicators
- Business Owner **Train & Refresh Intelligence** control showing real data blockers, eligible
  modules, last-run status and the no-publication-on-failure policy
- Honest empty states for new tenants; no existing business or mock inventory is shown in a newly registered workspace
- Daily multi-product sales form with live totals, store-stock visibility, customer reference,
  payment method, line/order discounts and tax
- Indian rupee formatting throughout the application
- Clear labels for sample layouts and features planned for later milestones
- Public Indian small-business landing page with English/Hindi content, responsive typography,
  light/dark themes, services, outcomes, role explanations, security, FAQ and sign-in actions
- Email-based forgotten-password entry and invitation-token activation for employees

## Milestone 2 features

- Business Owner INR revenue forecasting with 7, 14 and 30-day horizons and category filtering
- Store Manager product-demand forecasting with category/product filters and stock-mapping status
- Sales Executive personal forecast trained from authorised cleaned sales history
- Administrator access to business revenue, store demand, seller-personal forecasts, model registry
  and import-job monitoring, with explicit store/seller selectors
- Actual-versus-predicted charts with recorded history, future confidence ranges and chronological model metrics
- Customer segment profiles, observed-distribution chart, purchasing behaviour, engagement, search and pagination
- Customer 360 drill-down with visits, favourite products, purchase-trend evidence and follow-up suggestions
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
|   |-- landing/      Public bilingual landing-page sections and styles
|   `-- modules/      Sales, inventory, customers, reports, setup, team and settings
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

## Planned Milestone 3 and 4 interface work

Future role screens will consume backend-scoped churn, recommendation, anomaly and monitoring APIs.
Every screen must include loading, empty, low-data, error and permission-denied states; model name,
version and generated time; and a plain-language reason for each recommendation or alert. The
approved sequence is documented in the
[Milestone 3 and 4 workflow](../docs/milestone-3-4/milestone-3-4-workflow.md).
