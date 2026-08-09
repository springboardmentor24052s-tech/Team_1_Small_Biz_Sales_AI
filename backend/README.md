# MarketMind Backend

FastAPI backend for the first MarketMind milestone. It provides authentication, tenant-aware
role-based access control, user administration, role-scoped dashboard access, and a working
sales transaction flow.

Backend development and Milestone 1 integration are maintained on the `Garvitk001` branch.

## What is included

- Registration, email verification, login, logout, password reset, and profile updates
- Argon2 password hashing, login throttling and lockout
- Short-lived JWT access tokens and rotating, server-revocable refresh sessions
- TOTP multi-factor authentication, required for administrator actions
- Four system roles: Business Owner, Store Manager, Sales Executive, and Administrator
- Deny-by-default permissions enforced at the API layer
- Tenant, store, and seller-level data isolation
- Administrator invitations, role changes, account state management, and re-authentication
- Append-only audit events for authentication and privileged operations
- Role-specific dashboard navigation and sales KPI scope
- Sales transaction create, list, update, and void workflow
- Repeatable cleaned sales and inventory import with stable upsert keys
- Tenant- and store-scoped product and inventory APIs
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
│   ├── services/            Authentication, audit, identity, and scope rules
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

SQLite is the default when no database URL is configured and is intended only for local
development. PostgreSQL is the supported production database.

## Import Milestone 1 data

Run migrations and authorization bootstrap before importing. The tenant, store and seller must
already exist. From `backend/`, import the reviewed repository samples with:

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

Business Owners and MFA-verified Administrators receive business-wide results. Store Managers can
only read their assigned-store summary. Sales Executives can list or open their assigned customers.
The summary includes segment distribution, revenue contribution, repeat-customer rate, average
order value, recency, engagement, return behavior, and the model's Silhouette Score.

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
