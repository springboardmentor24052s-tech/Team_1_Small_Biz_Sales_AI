import io
from fastapi.testclient import TestClient
from app.main import app
from tests.conftest import TEST_PASSWORD, auth_header, login, create_user


def test_avatar_upload_rejects_non_image_or_malicious_files(client: TestClient, db, tenant, store):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="upload.owner@example.com"
    )
    token = login(client, owner.email)

    # 1. Reject fake JPEG with executable script inside (invalid magic bytes)
    fake_jpg = io.BytesIO(b"#!/bin/bash\necho 'malicious'")
    res = client.post(
        "/api/v1/users/me/avatar",
        headers=auth_header(token),
        files={"avatar": ("malicious.jpg", fake_jpg, "image/jpeg")},
    )
    assert res.status_code == 422
    assert "not a valid image" in res.json()["message"]

    # 2. Reject unsupported content types (e.g. text/html, python script)
    py_script = io.BytesIO(b"import os; os.system('calc.exe')")
    res = client.post(
        "/api/v1/users/me/avatar",
        headers=auth_header(token),
        files={"avatar": ("script.py", py_script, "text/x-python")},
    )
    assert res.status_code == 422

    # 3. Accept valid PNG with genuine magic bytes
    valid_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    valid_png = io.BytesIO(valid_png_bytes)
    res = client.post(
        "/api/v1/users/me/avatar",
        headers=auth_header(token),
        files={"avatar": ("avatar.png", valid_png, "image/png")},
    )
    assert res.status_code == 200
    assert "/uploads/avatars/" in res.json()["avatar_url"]


def test_csv_upload_rejects_binary_executables(client: TestClient, db, tenant, store):
    owner = create_user(
        db, tenant=tenant, store=store, role_code="business_owner", email="csv.owner@example.com"
    )
    token = login(client, owner.email)

    # Reject binary file containing NULL bytes
    binary_csv = io.BytesIO(b"id,name\n1,\x00\x01\x02")
    res = client.post(
        "/api/v1/onboarding/imports/preview",
        headers=auth_header(token),
        data={"kind": "products"},
        files={"upload": ("data.csv", binary_csv, "text/csv")},
    )
    assert res.status_code == 422
    assert "Binary or executable" in res.json()["message"]
