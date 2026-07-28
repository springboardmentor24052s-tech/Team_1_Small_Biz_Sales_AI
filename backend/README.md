# MarketMind Backend

FastAPI backend for the first MarketMind milestone. It provides authentication, tenant-aware
role-based access control, user administration, role-scoped dashboard access, and a working
sales transaction flow.

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
