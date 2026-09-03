# 🚀 MarketMind AI — Enterprise Sales Intelligence & Business Copilot Platform

> **MarketMind AI (v2.4)** is an AI-powered sales intelligence, customer retention, inventory management, forecasting, and business copilot platform designed for small and medium retail businesses in India.

---

## 🌟 Key Platform Features

### 🏢 1. Role-Aware Executive Dashboards

- **Business Owner View**: Revenue, completed orders, active customers, AOV, revenue trends, and strategic insights.
- **Store Manager View**: Inventory alerts, stock thresholds, supplier purchase orders, and POS entry.
- **Sales Executive View**: Sales pipeline, transactions, personal performance, and customer information.
- **Administrator View**: Audit logs, security controls, user management, and system monitoring.

### 🤖 2. AI Business Copilot

- Full-screen AI chat workspace with specialized business personas.
- Sales and strategy assistance.
- Inventory and purchase-order guidance.
- Customer retention and churn assistance.
- Security and audit assistance.
- English and Hindi language support.

### 🛒 3. AI Product Recommendations

- Product co-occurrence and association-based recommendations.
- Customer-specific recommendations.
- Cross-selling and bundle opportunities.
- Recommendation analytics and evaluation metrics.
- Revenue uplift insights.

### 👥 4. Customer Retention & Churn Analytics

- RFM-based customer analysis.
- Customer risk classification.
- Revenue-at-risk identification.
- Customer retention insights.
- Email and WhatsApp outreach support.

### 🛡️ 5. Business Safeguards & Anomaly Detection

- Detection of unusual sales and transaction activity.
- Severity-based anomaly filtering.
- Configurable sensitivity levels.
- Acknowledge and resolve workflow for detected anomalies.

### 📦 6. Inventory & Supplier Purchase Orders

- Low-stock monitoring.
- Safety-stock thresholds.
- SKU-specific inventory information.
- Supplier purchase-order generation.
- CSV export and supplier communication support.

### 📈 7. Forecasting & Business Reports

- Revenue forecasting.
- Product/category demand forecasting.
- Personal sales forecasting where applicable.
- Multiple forecast horizons: **7, 14, and 30 days**.
- Business analytics reports.
- CSV report export.

### 🌐 8. Indian Market & Hindi Localization

- Indian Rupee (`₹`) formatting.
- `en-IN` number and currency formatting.
- English and Hindi language switching.

---

## 📁 Repository Structure

```text
Team_1_Small_Biz_Sales_AI/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints
│   │   ├── core/            # Security, authentication and configuration
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── services/        # Business and AI/ML services
│   │   └── bootstrap.py     # Database initialization and setup
│   ├── tests/               # Backend automated tests
│   ├── pyproject.toml
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboards and UI modules
│   │   ├── context/         # Authentication, language and application contexts
│   │   ├── services/        # API service clients
│   │   └── test/            # Frontend automated tests
│   └── .env.example
│
├── preprocessing/            # Dataset preprocessing and ML preparation
├── data/                     # Sample datasets
├── docs/                     # Project documentation
└── README.md



🚀 Quickstart — Run Locally
Prerequisites
Python 3.10+
Node.js 18.x or 20.x
Git
Step 1: Clone the Repository
git clone https://github.com/springboardmentor24052s-tech/Team_1_Small_Biz_Sales_AI.git
cd Team_1_Small_Biz_Sales_AI

Use the branch provided by your team/mentor for evaluation.

Step 2: Start the Backend

Open a terminal in the backend/ directory:

cd backend
Windows

Create and activate a virtual environment:

python -m venv .venv
.\.venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Seed the local demo database:

.\.venv\Scripts\python.exe -m app.commands.seed_demo

Start FastAPI:

.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Backend:

http://127.0.0.1:8000

Swagger API documentation:

http://127.0.0.1:8000/api/v1/docs
Mac / Linux
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.commands.seed_demo
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Step 3: Start the Frontend

Open a second terminal:

cd frontend

Create the environment file:

Windows
Copy-Item .env.example .env
Mac / Linux
cp .env.example .env

Install dependencies:

npm install

Start the development server:

npm run dev

Frontend:

http://localhost:5173/
🔑 Demo Login

The application contains demo accounts for local evaluation.

For security reasons, passwords and authentication secrets are not stored in this public repository README.

Use the project's local database seeding/setup process to create the required demo accounts.

Available application roles include:

Role	Workspace
🏢 Business Owner	Executive Dashboard, AI Copilot, Strategic Insights
🏪 Store Manager	Inventory, Stock Alerts, Supplier Purchase Orders
💼 Sales Executive	Sales Pipeline, Transactions, Performance
🛡️ Administrator	User Management, Audit and Security Controls
📊 Data Provisioning

Database files are intentionally excluded from Git.

To populate a local environment with evaluation data, use:

python -m app.commands.seed_demo

The application also provides a Business Setup workflow for adding evaluation/sample data directly from the UI.

After loading sample data, the dashboards can be used to verify:

Sales and revenue metrics
Customer analytics
Inventory information
Product recommendations
Anomaly detection
Forecasting
Reports and exports
🧪 Milestone 4 — Testing & Verification

Milestone 4 focused on testing, integration verification, frontend reliability, error handling, and deployment readiness.

Backend Testing

The backend test suite was expanded and stabilized for time-dependent and validation scenarios.

Coverage includes:

Authentication and role-based access
Dashboard and preference behavior
Forecasting APIs
Forecast horizon validation
Recommendation APIs
Customer-specific recommendations
Anomaly detection
Anomaly severity filtering
Anomaly acknowledgement and resolution
Model monitoring
Churn-related functionality

A time-dependent preference test was updated to use relative dates so that it remains reliable as the system date changes.

Forecasting validation was also tested to ensure unsupported horizons are rejected correctly. Supported horizons are:

7 days
14 days
30 days
Frontend Testing

Vitest and React Testing Library were added for frontend automated testing.

Coverage includes:

API client success and error handling
Authentication headers and JSON requests
Empty/204 API responses
Recommendation service API calls
Recommendation analytics and evaluation APIs
Anomaly service API calls
Anomaly acknowledgement and resolution
Anomaly severity filtering in the UI
Recommendation API failure states
Recommendation retry behavior
Reports API failure handling
Test Results
Frontend Tests:       19 / 19 PASSED
Backend Tests:        41 / 41 PASSED
Preprocessing Tests:  10 / 10 PASSED
-------------------------------------
Total:                70 / 70 PASSED
Additional Verification
Frontend Lint:        0 errors
Frontend Build:       Successful
Local Application:    Manually verified

The production frontend build completed successfully with Vite.

🔍 Manual Application Verification

The application was also tested locally after the automated tests.

The following workflows were verified:

User login and role-based dashboard access
Business Setup
Evaluation sample-data loading
Dashboard KPI population
AI Product Recommendations
Anomaly Alerts
Anomaly severity filtering
Anomaly acknowledgement/resolution workflow
Customer and business analytics
Model training/refresh workflow
Reports & Forecasts
CSV report download
Frontend loading and API error states
Retry behavior for unavailable recommendation data

This manual verification was performed in addition to the automated test suites.

📈 Forecasting

The forecasting module supports:

Revenue forecasting
Demand forecasting
Personal sales forecasting
7-day forecasts
14-day forecasts
30-day forecasts
Forecast model monitoring
Forecast prediction APIs

Invalid forecast horizons are rejected by the API with a validation error rather than being processed as an unsupported request.

🛡️ Security & Data Handling
Authentication and role-based access control are implemented in the backend.
Database files are excluded from Git.
Local environment configuration is provided through .env.example.
Passwords and authentication secrets are not documented in the public README.
Demo/evaluation data should be generated locally through the provided setup and seeding workflows.

Do not commit real production credentials, API keys, tokens, database files, or other secrets to the repository.

☁️ Deployment Readiness

Milestone 4 also prepared the project for deployment and evaluation by verifying:

Backend dependency installation
Frontend dependency installation
Production frontend build
API integration
Error handling
Automated test execution
Local end-to-end application workflow
Environment configuration through .env
Database/sample-data initialization

The project can therefore be validated locally before being deployed to a cloud hosting environment.

🧰 Technology Stack
Frontend
React
Vite
Tailwind CSS
Recharts
Vitest
React Testing Library
Backend
Python
FastAPI
SQLAlchemy
Pydantic
Pytest
AI / ML
Scikit-learn
XGBoost
Prophet
Recommendation algorithms
Customer segmentation
Churn prediction
Anomaly detection
Forecasting
Database
SQLite for local development/evaluation
SQLAlchemy ORM
Development
Git
GitHub
REST APIs
Swagger / OpenAPI
Automated testing
👥 Project Outcome

MarketMind AI combines sales analytics, customer intelligence, inventory management, forecasting, recommendations, anomaly detection, and AI-assisted business decision support into a single platform for small and medium retail businesses.

Milestone 4 strengthened the project through automated testing, frontend integration testing, API validation, error-state handling, local application verification, build validation, and deployment-readiness documentation.
