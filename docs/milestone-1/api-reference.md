# MarketMind Milestone 1 API Reference

## Local addresses

- API base URL: `http://127.0.0.1:8001/api/v1`
- Swagger UI: `http://127.0.0.1:8001/api/v1/docs`
- ReDoc: `http://127.0.0.1:8001/api/v1/redoc`
- OpenAPI JSON: `http://127.0.0.1:8001/api/v1/openapi.json`

Production and Docker environments can change the host or port without changing the `/api/v1`
route prefix.

## Authentication headers

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Administrator invitation, role-change, and account-state requests also require:

```http
X-Reauth-Token: <reauth_token>
```

Call `POST /auth/reauthenticate` with the administrator password and current MFA code to obtain the
short-lived reauthentication token.

## Health

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health/live` | Public | Confirms the API process is running |
| GET | `/health/ready` | Public | Confirms the database is reachable and ready |

## Authentication

| Method | Endpoint | Access | Request or purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a tenant, first store, and Business Owner |
| POST | `/auth/verify-email` | Public | Activate an account with a verification token |
| POST | `/auth/login` | Public | Receive access and refresh tokens; administrators provide `mfa_code` |
| POST | `/auth/refresh` | Public | Rotate a valid refresh token |
| POST | `/auth/logout` | Authenticated | Revoke the current session |
| POST | `/auth/password-reset/request` | Public | Request a password-reset token |
| POST | `/auth/password-reset/confirm` | Public | Set a new password using the reset token |
| POST | `/auth/reauthenticate` | Authenticated | Receive a token for sensitive administrator actions |
| POST | `/auth/mfa/setup` | Authenticated | Generate a TOTP secret and provisioning URI |
| POST | `/auth/mfa/confirm` | Authenticated | Confirm the current TOTP code and enable MFA |

Example login:

```json
{
  "email": "owner.demo@marketmind.example.com",
  "password": "MarketMindDemo123!",
  "mfa_code": null
}
```

## Users and RBAC

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | Any authenticated role | Return the current profile, role, and permissions |
| PATCH | `/users/me` | Any authenticated role | Update full name, locale, or timezone |
| GET | `/users` | Administrator + MFA | List tenant users |
| POST | `/users/invite` | Administrator + MFA + reauthentication | Invite a user |
| POST | `/users/accept-invitation` | Public | Activate an invited account |
| PATCH | `/users/{user_id}/role` | Administrator + MFA + reauthentication | Change role and store |
| PATCH | `/users/{user_id}/state` | Administrator + MFA + reauthentication | Enable or disable account |
| GET | `/users/roles/catalog` | Administrator + MFA | List roles and permission codes |
| GET | `/users/stores/catalog` | Administrator + MFA | List active tenant stores |

Invite request:

```json
{
  "email": "new.manager@example.com",
  "full_name": "New Store Manager",
  "role_code": "store_manager",
  "store_id": "00000000-0000-0000-0000-000000000000"
}
```

Valid role codes are `business_owner`, `store_manager`, `sales_executive`, and `administrator`.
Store Managers and Sales Executives require a valid `store_id`.

## Dashboard

| Method | Endpoint | Access | Query parameters |
|---|---|---|---|
| GET | `/dashboard/access` | Any authenticated role | None |
| GET | `/dashboard/sales` | Owner, Manager, Sales, Administrator | `date_from`, `date_to` as ISO date-times |

The sales dashboard scope is automatically selected from the signed-in role: tenant, assigned
store, or personal seller. The maximum date range is 366 days, and `date_from` must be earlier than
`date_to`.

## Sales transactions

| Method | Endpoint | Owner | Manager | Sales | Admin |
|---|---|:---:|:---:|:---:|:---:|
| POST | `/sales/transactions` | No | Store | Assigned store | Tenant |
| GET | `/sales/transactions` | Tenant | Store | Own | Tenant |
| GET | `/sales/transactions/{transaction_id}` | Tenant | Store | Own | Tenant |
| PATCH | `/sales/transactions/{transaction_id}` | No | Store | Own | Tenant |
| POST | `/sales/transactions/{transaction_id}/void` | No | Store | No | Tenant |

List parameters: `limit` defaults to 50 and is limited to 200; `offset` defaults to 0.

Create request:

```json
{
  "store_id": "00000000-0000-0000-0000-000000000000",
  "external_reference": "POS-DEMO-001",
  "occurred_at": "2026-07-30T10:30:00+05:30",
  "currency": "INR",
  "total_amount": 2499.00,
  "item_count": 2,
  "notes": "Created from Postman"
}
```

## Inventory

| Method | Endpoint | Owner | Manager | Sales | Admin |
|---|---|:---:|:---:|:---:|:---:|
| GET | `/inventory/summary` | Tenant | Store | No | Tenant |
| GET | `/inventory` | Tenant | Store | No | Tenant |
| GET | `/inventory/{inventory_id}` | Tenant | Store | No | Tenant |
| PATCH | `/inventory/{inventory_id}` | No | Store | No | Tenant |

Inventory list parameters:

- `store_id`: optional for tenant-wide readers
- `sku`: partial SKU search
- `category`: partial category search
- `stock_status`: `in_stock`, `low_stock`, or `out_of_stock`
- `limit`: 1 to 200
- `offset`: zero or greater

Update request:

```json
{
  "stock_quantity": 25,
  "reorder_level": 10
}
```

## Customers

| Method | Endpoint | Owner | Manager | Sales | Admin |
|---|---|:---:|:---:|:---:|:---:|
| GET | `/customers/summary` | Tenant | Summary | Assigned | Tenant |
| GET | `/customers` | Tenant | Summary scope | Assigned | Tenant |
| GET | `/customers/{customer_id}` | Tenant | Summary scope | Assigned | Tenant |

Customer list parameters are `search`, `limit`, and `offset`.

## Audit

| Method | Endpoint | Access | Query parameters |
|---|---|---|---|
| GET | `/audit` | Administrator + MFA | `limit`, from 1 to 500; default 100 |

Audit events are tenant-scoped and include the actor, event type, target, correlation ID, time, and
change details.

## Common status codes

| Code | Meaning |
|---|---|
| 200 | Request completed |
| 201 | Record or invitation created |
| 400 | Invalid operation or MFA code |
| 401 | Missing, invalid, expired, or revoked authentication |
| 403 | Permission or scope denied |
| 404 | Scoped record was not found |
| 409 | Duplicate or conflicting state |
| 422 | Request validation failed |
| 503 | Required service or authorization bootstrap is unavailable |

Error responses include `code`, `message`, `correlation_id`, `field_details`, and `retryable`.

## Postman

Import these two repository files:

1. `postman/MarketMind_Milestone_1.postman_collection.json`
2. `postman/MarketMind_Local.postman_environment.json`

Select the **MarketMind Local** environment. Run **Authentication > Login - Owner** or another demo
login first. The login test script stores `access_token` and `refresh_token` automatically.
Administrator actions require **Login - Administrator**, a current MFA code, and then
**Reauthenticate Administrator** to store `reauth_token`.

Requests labelled **Changes Data** mutate the local database. Set `user_id` manually before running
role or account-state changes so an unintended account is never selected automatically.
