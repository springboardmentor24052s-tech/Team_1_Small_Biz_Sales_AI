# 🚀 MarketMind AI — Enterprise Sales Intelligence & Business Copilot Platform

> **MarketMind AI (v2.4)** is an AI-powered sales intelligence, customer retention, inventory management, and business copilot platform designed specifically for small and medium retail businesses in India.

---

## 🌟 Key Platform Features

### 🏢 1. Role-Aware Executive Dashboards
* **Business Owner View**: Total revenue, completed orders, active customers, AOV calculations, revenue trend curves, and AI strategic recommendation cards.
* **Store Manager View**: Stock alerts, opening inventory thresholds, supplier purchase orders, and daily POS entry.
* **Sales Executive View**: Sales deals pipeline, transaction logs, personal performance metrics, and customer contact histories.
* **Administrator View**: Platform audit logs, MFA security control, user role management, and system monitoring.

### 🤖 2. Dedicated AI Business Copilot Chat System (`AiChatModule.jsx`)
* **Full-Screen AI Chat Workspace**: Talk to 4 specialized AI Agent Personas:
  1. 📈 **Sales & Strategy Advisor**: Revenue growth advice, pricing, and bundle deals.
  2. 📦 **Inventory & PO Specialist**: Low-stock SKUs, safety thresholds, and supplier restock guidance.
  3. 👥 **Customer Retention Coach**: High-risk churn accounts and 1-click WhatsApp/Email pitches.
  4. 🛡️ **Safeguards & Audit Bot**: Discount anomaly detection, security rules, and audit status.
* **Floating Assistant Widget**: Access `✨ AI Copilot Help` from the bottom-right corner of any page.
* **Multi-Language Support**: Answers naturally in **English** and **Hindi (`हिन्दी`)**.

### 🛒 3. AI Product Recommender (`ProductRecommendationsModule.jsx`)
* **Association Rule Co-occurrence Scoring**: Identifies product pairings frequently bought together.
* **Average Order Value (AOV) Boost**: Displays Bundle Match Accuracy scores and expected revenue uplift (+18%).
* **High-Margin Cross-Selling**: Prioritizes products with prices above ₹150 for upsell pitching at checkout.

### 👥 4. At-Risk Customer Retention & Churn Analytics (`ChurnPredictionModule.jsx`)
* **RFM Behavioral Scoring**: Ranks customers by recency (days inactive), order frequency, and monetary value.
* **Revenue at Risk Protection**: Flags high-risk accounts representing ₹5.33M in slipping revenue.
* **1-Click Outreach Modals**:
  * 📧 **Email Retention Offer**: Pre-filled offer pitch with direct `mailto:` launcher.
  * 💬 **Call & WhatsApp Outreach**: Pre-filled pitch script with direct `wa.me/` WhatsApp chat launcher.

### 🛡️ 5. Business Safeguards & Anomaly Detection (`AnomalyDetectionModule.jsx`)
* **Statistical Outlier Detection**: Scans transactions for unauthorized discount spikes (>30%) and stock depletion leaks using Z-score baselines.
* **Sensitivity Control Modes**: Toggle between **Strict** (audit mode), **Balanced** (standard), and **High** threshold modes.
* **Audit Resolution Workflow**: 1-click **Acknowledge** (`Under Investigation`) and **Resolve** (`Resolved ✓`) state persistence.

### 📦 6. Supplier Purchase Order Generator (`InventoryModule.jsx`)
* **Low-Stock Priority Queue**: Monitors safety stock levels and SKU-specific pricing (in Indian Rupees `₹`).
* **1-Click Dispatch**: Generate POs with 1-click **Download PO (CSV)** and **Email Supplier**.

### 🌐 7. Indian Market & Hindi (`हिन्दी`) Localization
* **Indian Rupee (`₹`) Formatting**: All metrics across all dashboards and modals are formatted in `en-IN` locale (`₹1,48,520.00`).
* **1-Click Language Switcher**: Toggle between **`हिन्दी`** and **`English`** in the top navbar.

---

## 📁 Repository Directory Structure

```text
Team_1_Small_Biz_Sales_AI/
├── backend/                  # FastAPI Python backend (API routes, ORM models, AI engines)
│   ├── app/
│   │   ├── api/v1/          # REST Endpoints (Copilot, Sales, Inventory, Churn, Anomalies, Recommendations)
│   │   ├── core/            # Security, Auth (Argon2 + PBKDF2 Fallback), JWT, Config
│   │   ├── models/          # SQLAlchemy ORM Schemas (Users, Sales, Inventory, Customers, Anomalies)
│   │   ├── services/        # AI & ML Engines (Copilot, Recommendations, Churn, Anomalies)
│   │   └── bootstrap.py     # Auto-seeding & database initialization
│   ├── tests/               # Automated pytest unit test suite (10/10 tests passing)
│   ├── pyproject.toml       # Backend dependencies configuration
│   └── requirements.txt     # Pip dependencies requirements list
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/      # UI components, dashboards, and workspace modules
│   │   │   ├── common/      # Navbar, Sidebar, AiAssistantModal
│   │   │   ├── dashboards/  # Owner, Manager, Sales, Admin Views
│   │   │   ├── modules/     # AiChatModule, ReportsModule, InventoryModule, ChurnModule
│   │   │   └── ui/          # Reusable Card, Button, Input, Modal, Badge components
│   │   ├── context/         # AuthContext, LanguageContext (Hindi), ThemeContext, DataContext
│   │   └── services/        # API client services & mock data fallbacks
│   └── .env.example         # Frontend environment configuration template
└── data/                     # Cleaned sample CSV datasets (Sales, Inventory, Customers)
```

---

## 🚀 Easy Quickstart Guide (Run Locally)

### Prerequisites
* **Python**: `3.10+` (or 3.11 / 3.12)
* **Node.js**: `18.x` or `20.x`
* **Git**

---

### Step 1: Clone & Navigate
```bash
git clone https://github.com/springboardmentor24052s-tech/Team_1_Small_Biz_Sales_AI.git
cd Team_1_Small_Biz_Sales_AI
git checkout Garvitk001
```

---

### Step 2: Start Backend Server (FastAPI)

1. Open terminal in `backend/` folder:
   ```bash
   cd backend
   ```

2. Create virtual environment & install dependencies:
   * **Windows**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     pip install -r requirements.txt
     ```
   * **Mac / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     ```

3. Seed demo accounts & evaluation sample data:
   ```bash
   python -m app.commands.seed_demo
   ```

4. Launch FastAPI Backend:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
   * *Backend API URL:* **`http://127.0.0.1:8000`**
   * *Swagger Interactive Docs:* **`http://127.0.0.1:8000/api/v1/docs`**

---

### Step 3: Start Frontend App (React + Vite)

Open a **second terminal** window:

1. Navigate to `frontend/` folder:
   ```bash
   cd Team_1_Small_Biz_Sales_AI/frontend
   ```

2. Setup environment configuration file:
   * **Windows**: `Copy-Item .env.example .env`
   * **Mac / Linux**: `cp .env.example .env`

3. Install packages & start dev server:
   ```bash
   npm install
   npm run dev
   ```
   * *Frontend Web App:* **`http://localhost:5173/`**

---

## 🔑 Login Credentials Cheat Sheet

Open **`http://localhost:5173/`** in your browser and log in with any role:

| Role | Email | Password | Primary Workspace |
| :--- | :--- | :--- | :--- |
| 🏢 **Business Owner** | `owner@business.com` | `owner123` | Executive Dashboard, AI Copilot, Strategic Advice |
| 🏪 **Store Manager** | `manager@store.com` | `manager123` | Inventory Stock Alerts, Supplier PO Generator |
| 💼 **Sales Executive** | `sales@team.com` | `sales123` | Sales Deals Pipeline & Transaction Entry |
| 🛡️ **Administrator** | `admin@system.com` | `admin123` | User Access Control & Fraud Safeguard Audit |

*(Alternative Demo Owner account: `owner.demo@marketmind.example.com` / `MarketMindDemo123!`)*

---

## 📊 Data Provisioning & Seeding

* **Database Security**: Database binary files (`*.db`) are intentionally excluded from Git per security standards.
* **Automatic Data Seeding**:
  * **Option A**: Running `python -m app.commands.seed_demo` loads all 1,842 sample sales, SKUs, customer segments, and AI recommendations into your local database.
  * **Option B (1-Click UI)**: When logged in, click **`[Open Business Setup]`** ➔ **`[Add Evaluation Sample Data]`** to populate sample records directly from the browser!

---

## 🧪 Automated Testing & Verification

Run backend unit test suite:
```bash
cd backend
python -m pytest tests/test_churn.py tests/test_anomalies.py tests/test_model_monitoring.py tests/test_recommendations.py -v
```
**Test Results**: `10 / 10 PASSED (100% Success)`
