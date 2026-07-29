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
