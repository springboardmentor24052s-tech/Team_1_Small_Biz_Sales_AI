# Milestone 1 backend status

## Completed

| Requirement | Implementation | Verification |
|---|---|---|
| Initialize FastAPI backend | Versioned API, settings, SQLAlchemy, OpenAPI, health endpoints | OpenAPI and readiness smoke checks |
| Registration and activation | Tenant-owner registration and single-use email verification token | `test_registration_verification_login_refresh_and_logout` |
| Login and logout | Argon2 passwords, JWT access token, persisted refresh session, logout revocation | Authentication tests |
| Password reset | Single-use reset token, password policy, session revocation | `test_password_reset_revokes_existing_sessions` |
| Session security | Short access lifetime, refresh rotation, replay rejection, idle expiry | Authentication tests |
| Login abuse protection | Configurable failure threshold and timed account lock | `test_login_lockout_after_repeated_failures` |
| Administrator MFA | TOTP enrollment and mandatory MFA for privileged permission checks | `test_admin_mfa_is_required_for_privileged_access` |
| Role-based access control | Four seeded roles and deny-by-default API permission dependencies | RBAC tests |
| User permissions | Permission catalog and SRS-aligned role mappings | Role dashboard matrix test |
| Tenant/store isolation | Tenant checks plus store and seller query scopes | Cross-tenant sales test |
| User administration | Invite, accept, list, role assignment, account enable/disable | Admin workflow tests |
| Privileged change controls | Password/MFA re-authentication and before/after audit records | Admin workflow tests |
| Dashboard access management | Server-generated module access for each role | Dashboard access tests |
| Sales dashboard | Revenue, transactions, quantity, average order value, scope and freshness metadata | Dashboard scope tests |
| Transaction workflow | Create, read, update, list, paginate and void with role scope | Sales scope tests |
| Dataset import | Repeatable product, inventory and order upserts from cleaned CSV files | Import service and committed-sample tests |
| Inventory API | List, filter, summarize, read and update inventory with tenant/store scope | Inventory RBAC tests |
| Customer summaries | Repeatable customer import plus tenant/summary/assigned customer scopes | Customer API and import tests |
| Imported dashboard data | Imported orders use the existing sales transaction KPI query | Import-to-dashboard integration test |
| Audit trail | Authentication, administrator and sales events; administrator read endpoint | Admin workflow tests |
| Database delivery | PostgreSQL-ready models and Alembic initial migration | `alembic check` |
| Deployment setup | Non-root API image, PostgreSQL Compose service and health checks | Compose configuration review |
| Engineering checks | Ruff lint/format and pytest coverage | Thirteen tests passing |

## Integration dependencies

Production email delivery is intentionally behind the identity workflow. Development responses expose
one-time verification, invitation and reset tokens; production responses suppress them. An approved
email provider and sender configuration are still required before a public deployment.

Docker files are ready, but the image must be built on a machine with Docker installed. The current
development workstation does not provide the Docker CLI.
