# MarketMind RBAC Permission Matrix

The tables below reflect the permission definitions and API scope rules implemented in the FastAPI
backend. Access is checked twice: the role must grant the permission, and the requested record must
belong to the user's tenant and operational scope.

## Scope legend

| Mark | Meaning |
|---|---|
| Tenant | Access to records inside the user's complete business tenant |
| Store | Access only to the user's assigned store |
| Own | Access only to records owned by the signed-in Sales Executive |
| Assigned | Access only to customers assigned to the signed-in Sales Executive |
| Summary | Aggregated operational customer information |
| No | Permission is not granted |

## Milestone 1 operational access

| Capability | Business Owner | Store Manager | Sales Executive | Administrator |
|---|---|---|---|---|
| Sales dashboard | Tenant | Store | Own | Tenant |
| Apply sales date filter | Tenant | Store | Own | Tenant |
| Read sales transactions | Tenant | Store | Own | Tenant |
| Create sales transaction | No | Store | Assigned store | Tenant |
| Update sales transaction | No | Store | Own | Tenant |
| Void sales transaction | No | Store | No | Tenant |
| Inventory summary and list | Tenant | Store | No | Tenant |
| Update inventory | No | Store | No | Tenant |
| Customer summary | Tenant | Summary | Assigned | Tenant |
| Customer list and detail | Tenant | Summary scope | Assigned | Tenant |
| View own profile | Yes | Yes | Yes | Yes |
| Update own profile | Yes | Yes | Yes | Yes |
| List users, roles and stores | No | No | No | Tenant |
| Invite users | No | No | No | Tenant + reauthentication |
| Change role or store assignment | No | No | No | Tenant + reauthentication |
| Enable or disable account | No | No | No | Tenant + reauthentication |
| Read audit trail | No | No | No | Tenant |

Administrator permission-protected requests require an enrolled and verified MFA factor. User
invitations, role changes, and account-state changes also require the short-lived token returned by
`POST /api/v1/auth/reauthenticate` in the `X-Reauth-Token` header.

## Implemented permission codes

| Permission code | Owner | Manager | Sales | Admin |
|---|:---:|:---:|:---:|:---:|
| `dashboard.sales.all` | Yes | No | No | Yes |
| `dashboard.sales.store` | No | Yes | No | Yes |
| `dashboard.sales.personal` | No | No | Yes | Yes |
| `dashboard.inventory.view` | Yes | Yes | No | Yes |
| `dashboard.inventory.manage` | No | Yes | No | Yes |
| `sales.read.all` | Yes | No | No | Yes |
| `sales.read.store` | No | Yes | No | Yes |
| `sales.read.own` | No | No | Yes | Yes |
| `sales.create` | No | Yes | Yes | Yes |
| `sales.update.store` | No | Yes | No | Yes |
| `sales.update.own` | No | No | Yes | Yes |
| `sales.void` | No | Yes | No | Yes |
| `inventory.read.all` | Yes | No | No | Yes |
| `inventory.read.store` | No | Yes | No | Yes |
| `inventory.update.store` | No | Yes | No | Yes |
| `customers.read.all` | Yes | No | No | Yes |
| `customers.read.summary` | No | Yes | No | Yes |
| `customers.read.assigned` | No | No | Yes | Yes |
| `users.read` | No | No | No | Yes |
| `users.manage` | No | No | No | Yes |
| `roles.manage` | No | No | No | Yes |
| `audit.read` | No | No | No | Yes |
| `security.manage` | No | No | No | Yes |
| `permissions.manage` | No | No | No | Yes |
| `datasets.manage` | No | No | No | Yes |
| `models.manage` | No | No | No | Yes |

## Reserved permissions for later milestones

These codes are present in the role catalog so the authorization model can grow without redesigning
roles. Their related frontend cards are labelled as planned, and Milestone 1 does not expose working
business APIs for them.

| Future capability | Business Owner | Store Manager | Sales Executive | Administrator |
|---|---|---|---|---|
| Forecasts | View | View | No | View/configure |
| Churn analytics | View | View | No | View/configure |
| Recommendations | View | View | Assigned | View/configure |
| Customer segments | Tenant view | Summary | Assigned | Full |
| Invoices | Read | Read | Manage | Full |
| Report export | Business | Operational | No | Full |

## Enforcement rules

1. A missing or invalid access token returns `401 Unauthorized`.
2. A valid user without the required permission returns `403 Forbidden`.
3. Store and seller scopes are applied inside database queries.
4. Cross-tenant records are never returned.
5. Administrators remain tenant-bound even though they receive the full permission catalog.
6. Role changes and account disabling revoke the target user's active sessions.
7. Client-side menu visibility is usability only; the API remains the security boundary.
