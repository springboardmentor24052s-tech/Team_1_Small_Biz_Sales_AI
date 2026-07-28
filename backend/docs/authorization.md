# Authorization model

Authorization is evaluated in two layers:

1. A role must grant the required permission.
2. The requested record must fall inside the user's tenant and operational scope.

The API denies access when either check fails. Client-side navigation is only a convenience and
is never treated as an authorization control.

| Capability | Business Owner | Store Manager | Sales Executive | Administrator |
|---|---|---|---|---|
| Sales dashboard | Entire tenant | Assigned store | Own sales | Entire tenant |
| Sales records | Read | Create/update/void in store | Create/update own | Full |
| Inventory | View analytics | View/manage | None | Full |
| Forecasts | View | View | None | View/configure |
| Churn | View | View | None | View/configure |
| Recommendations | View | View | Assigned | View/configure |
| Customer segments | View | Summary | Assigned | Full |
| Invoices | View | View | Manage | Full |
| Users, roles, audit | None | None | None | Manage |
| Dataset and model settings | None | None | None | Manage |

Store Managers and Sales Executives require a store assignment. Business Owners use a tenant-wide
scope. Administrators remain tenant-bound; platform-wide operations should use an explicit support
workflow rather than bypassing tenant isolation.

Privileged administrator changes require a recent re-authentication token in the
`X-Reauth-Token` header. Administrator permission checks also require an enrolled and verified MFA
factor.
