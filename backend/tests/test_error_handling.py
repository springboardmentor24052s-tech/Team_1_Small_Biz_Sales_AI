from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from app.main import app


def test_unhandled_exception_sanitization():
    # Define a temporary route that raises an unhandled exception with internal details
    @app.get("/api/v1/test-unhandled-error")
    def trigger_unhandled_error():
        raise RuntimeError("Traceback (most recent call last): File 'C:\\internal\\secret\\path.py', line 42")

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/api/v1/test-unhandled-error")
    assert response.status_code == 500
    data = response.json()
    assert data["code"] == "internal_server_error"
    assert "C:\\internal\\secret\\path.py" not in data["message"]
    assert "Traceback" not in data["message"]
    assert "correlation_id" in data
    assert data["retryable"] is True


def test_database_error_sanitization():
    # Define a temporary route that raises a raw SQLAlchemy OperationalError
    @app.get("/api/v1/test-database-error")
    def trigger_db_error():
        raise OperationalError("SELECT * FROM sensitive_schema_table", {}, Exception("sqlite3.OperationalError: no such column"))

    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/api/v1/test-database-error")
    assert response.status_code == 500
    data = response.json()
    assert data["code"] == "database_error"
    assert "sensitive_schema_table" not in data["message"]
    assert "sqlite3" not in data["message"]
    assert "correlation_id" in data
