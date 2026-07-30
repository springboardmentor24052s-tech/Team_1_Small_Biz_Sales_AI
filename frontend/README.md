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

## Run locally

Install the frontend dependencies:

```powershell
cd frontend
npm install
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

- Divyanka (`divyanka-0525`)
- Tejananda (`Tejananda`)

Their branch work was retained while connecting the user interface to the Milestone 1 backend and
database services.
