# MarketMind AI — Backend Service

FastAPI backend service powering MarketMind AI. Provides multi-tenant data isolation, role-based access control (RBAC), database-backed business dashboards, customer analytics, product recommendations, anomaly detection, inventory management, and multi-horizon demand/revenue forecasting.

---

## 🌟 Capabilities & Architecture

- **Multi-Tenant Data Isolation**: Robust tenant, store, and seller-level isolation enforced across all database queries and endpoints.
- **Enterprise Authentication & Security**:
  - Argon2id password hashing and account lockout mechanisms.
  - Short-lived JWT access tokens and rotating, revocable refresh sessions.
  - 6-digit cryptographic verification codes for registration and password resets.
  - Multi-tier in-memory rate limiting with exponential backoff headers.
  - Global sanitized error handling with server-side correlation IDs (preventing internal schema exposure).
  - Safe file upload handling with magic-byte image validation and strict CSV inspection.
- **Role-Based Access Control (RBAC)**:
  - **Business Owner**: Comprehensive tenant-wide revenue analytics, inventory control, team management, AI Copilot, and business forecasting.
  - **Store Manager**: Store-scoped inventory management, stock alerts, supplier purchase order generation, and store demand forecasts.
  - **Sales Executive**: Scoped personal transaction logging, customer assignments, quota tracking, and personal sales forecasting.
- **Machine Learning & Analytics Pipelines**:
  - **RFM Customer Segmentation & Churn Analytics**: Recency, Frequency, and Monetary value clustering with actionable retention insights.
  - **AI Recommender**: Product affinity, cross-selling, and up-selling recommendations based on transaction co-occurrence.
  - **Forecasting Engine**: Multi-horizon revenue and demand predictions (7, 14, 30 days) using XGBoost, Prophet, and Linear Trend models with chronological validation.
  - **Anomaly Detection**: Real-time sales and inventory anomaly identification with severity triage and resolution workflows.
- **B2B Wholesale & Retail Operations**:
  - Atomic POS transaction processing with line-item discounts, inventory deduction, and customer updates.
  - GST-compliant invoice generation and automated supplier purchase order drafting.

---

## 📁 Layout

```text
backend/
├── alembic/                 # Database migrations
├── app/
│   ├── api/
│   │   ├── dependencies.py  # Auth, rate limiting, and permission guards
│   │   └── v1/              # API route controllers
│   ├── core/                # Settings, rate limiter, security, and hashing
│   ├── db/                  # SQLAlchemy base and session manager
│   ├── models/              # Relational models (users, stores, sales, inventory, ML)
│   ├── schemas/             # Pydantic request/response validation schemas
│   ├── services/            # Business logic, ML inference, and email dispatchers
│   ├── commands/            # CLI commands for data seeding and model imports
│   ├── bootstrap.py         # Initial role and permission setup
│   └── main.py              # Application entry point & exception handlers
├── tests/                   # Automated Pytest test suite
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── pyproject.toml
```

---

## 🚀 Running Locally

### 1. Environment Setup

```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy example configuration
Copy-Item .env.example .env
```

### 2. Database Initialization & Seeding

```powershell
# Run database migrations
alembic upgrade head

# Seed initial roles and demo dataset
python -m app.commands.seed_demo
```

### 3. Start the Server

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Base URL**: `http://127.0.0.1:8000`
- **Swagger Documentation**: `http://127.0.0.1:8000/api/v1/docs`
- **Health Check**: `http://127.0.0.1:8000/api/v1/health/ready`

---

## 🧪 Testing & Code Quality

Run the backend automated test suite:

```powershell
pytest -v
```

Run code formatting and lint checks:

```powershell
ruff check app tests
ruff format --check app tests
```

---

## 🔒 Security Best Practices

- Always update `MARKETMIND_JWT_SECRET` in `.env` before deploying to production.
- Production environments require configuring valid SMTP credentials (`MARKETMIND_SMTP_HOST`, `MARKETMIND_SMTP_PORT`, `MARKETMIND_SMTP_USERNAME`, `MARKETMIND_SMTP_PASSWORD`, `MARKETMIND_SMTP_FROM_EMAIL`) for user notifications and password recovery.
- Never commit `.env` or SQLite `.db` files to source control.
