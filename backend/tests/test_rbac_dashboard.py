from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.identity import Store, Tenant
from tests.conftest import auth_header, create_user, login


def test_role_dashboard_access_matrix(
    client: TestClient,
    db: Session,
    tenant: Tenant,
    store: Store,
):
    accounts = {
        "business_owner": create_user(
            db,
            tenant=tenant,
            store=store,
            role_code="business_owner",
            email="owner@example.com",
        ),
        "store_manager": create_user(
            db,
            tenant=tenant,
            store=store,
            role_code="store_manager",
            email="manager@example.com",
        ),
        "sales_executive": create_user(
            db,
            tenant=tenant,
            store=store,
            role_code="sales_executive",
            email="sales@example.com",
        ),
    }

    expected_scope = {
        "business_owner": "business",
        "store_manager": "store",
        "sales_executive": "personal",
    }
    for role_code, account in accounts.items():
        token = login(client, account.email)
        response = client.get("/api/v1/dashboard/access", headers=auth_header(token))
        assert response.status_code == 200
        modules = {module["code"]: module for module in response.json()["modules"]}
        assert modules["sales"]["access"] == expected_scope[role_code]

    sales_token = login(client, accounts["sales_executive"].email)
    sales_modules = client.get("/api/v1/dashboard/access", headers=auth_header(sales_token)).json()[
        "modules"
    ]
    sales_codes = {module["code"] for module in sales_modules}
    assert "forecasts" not in sales_codes
    assert "churn" not in sales_codes
    assert "inventory" not in sales_codes
    assert "administration" not in sales_codes

    owner_token = login(client, accounts["business_owner"].email)
    forbidden = client.get("/api/v1/users", headers=auth_header(owner_token))
    assert forbidden.status_code == 403


def test_admin_mfa_is_required_for_privileged_access(
    client: TestClient,
    db: Session,
    tenant: Tenant,
):
    admin = create_user(
        db,
        tenant=tenant,
        store=None,
        role_code="administrator",
        email="admin@example.com",
    )
    initial_token = login(client, admin.email)
    blocked = client.get("/api/v1/users", headers=auth_header(initial_token))
    assert blocked.status_code == 403

    setup = client.post("/api/v1/auth/mfa/setup", headers=auth_header(initial_token))
    assert setup.status_code == 200
    secret = setup.json()["secret"]

    import pyotp

    confirmed = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=auth_header(initial_token),
    )
    assert confirmed.status_code == 200

    mfa_token = login(client, admin.email, pyotp.TOTP(secret).now())
    allowed = client.get("/api/v1/users", headers=auth_header(mfa_token))
    assert allowed.status_code == 200
