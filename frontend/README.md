# MarketMind AI — Frontend

React + Vite frontend wired to match your actual `main.py` exactly (verified
against the real route/schema code, not just endpoint names).

## Setup

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL if your backend isn't on :8000
npm run dev
```

### Backend change required: CORS

Your `main.py` has no `CORSMiddleware`, so the browser will block every
request from the frontend until you add this (right after `app = FastAPI()`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Endpoint mapping (confirmed against main.py)

| Frontend | Backend | Notes |
| --- | --- | --- |
| Login | `POST /login` | Form-encoded (`OAuth2PasswordRequestForm`), not JSON — `username` field carries the email |
| Register | `POST /register` | JSON `{ username, email, password, role_id }` |
| Profile | `GET /profile` | Shape of `current_user` in the response isn't fully confirmed — Profile.jsx renders whatever scalar fields come back |
| Admin dashboard | `GET /admin-dashboard` (role_id 1 only) + shared `/kpi`, `/sales-trend`, `/top-category`, `/state-revenue` |
| Owner dashboard | `GET /owner-dashboard` (role_id 1–2) + shared analytics |
| Manager dashboard | `GET /manager-dashboard` (role_id 1–3) + `/inventory` |
| Sales dashboard | `GET /sales-dashboard` (role_id 1–4) + `/sales-trend` |
| Sales Forecast | `POST /predict` | Full `SalesInput` — 17 label-encoded fields, see below |
| Inventory | `GET/POST/PUT/DELETE /inventory` | `{ product_name, category, quantity, price }` — no stock-status field exists |
| Users | `GET /users`, `PUT /users/{id}/status`, `PUT /users/{id}/role`, `DELETE /users/{id}` | `is_active` boolean, `role_id` integer |

**Roles** (integer `role_id`, matches `require_roles(...)` in `main.py`):
1 = Administrator, 2 = Business Owner, 3 = Store Manager, 4 = Sales Executive.
Lower id = more access (e.g. Administrator can reach every dashboard).

## One thing to double check

`GET /profile` returns `{ message, user: current_user }`, but `current_user`'s
exact shape depends on what your `get_current_user` dependency returns (the
raw JWT payload vs. a full user record). `Profile.jsx` renders whatever
scalar fields it finds, so it won't break either way — but if you want it to
show something specific (name, join date, etc.), let me know what
`get_current_user` actually returns.

## Predict page

`POST /predict` expects `SalesInput` — 17 fields, all label-encoded integers
except `B2B` (bool). The form auto-derives `Year`/`Month`/`Day`/`DayOfWeek`
from a single date picker; the rest (Status, Category, ship_city, etc.) are
plain number inputs since they need to match whatever label encoding
`prepare_training_data.py` used — there's no way to infer that mapping from
the frontend.

## Design

"Ledger meets price tag" — deep teal ink sidebar, brass/gold accents on KPI
cards (styled like a hole-punched price tag), monospace figures for anything
that counts (money, stock, SKUs). Tokens are in `src/styles/tokens.css`.

## Folder structure

```
src/
├── api/            axios calls, one file per resource
├── components/     shared UI (layout, KPI cards, charts)
├── context/        AuthContext (token/username/roleId state)
├── hooks/          useDashboardData (shared analytics fetching)
├── pages/          one file per route
└── styles/         design tokens + layout + auth CSS
```
