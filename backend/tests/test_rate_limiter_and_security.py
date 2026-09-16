import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock
from app.core.rate_limiter import InMemoryRateLimiter
from app.core.config import settings
from app.schemas.auth import LoginRequest, RegisterRequest, DeveloperOtpVerify


def test_rate_limiter_sliding_window():
    limiter = InMemoryRateLimiter()
    # Mock request
    request = MagicMock()
    request.headers = {}
    request.client.host = "192.168.1.100"

    # Override settings for test
    orig_enabled = settings.rate_limit_enabled
    orig_env = settings.environment
    settings.rate_limit_enabled = True
    settings.environment = "production"
    settings.rate_limit_public_per_minute = 3

    try:
        # 3 requests should pass
        limiter.check_rate_limit(request, tier="public")
        limiter.check_rate_limit(request, tier="public")
        limiter.check_rate_limit(request, tier="public")

        # 4th request should raise HTTP 429
        with pytest.raises(HTTPException) as exc_info:
            limiter.check_rate_limit(request, tier="public")
        
        assert exc_info.value.status_code == 429
        assert "Rate limit exceeded" in exc_info.value.detail
        assert "Retry-After" in exc_info.value.headers
    finally:
        settings.rate_limit_enabled = orig_enabled
        settings.environment = orig_env


def test_auth_exponential_backoff():
    limiter = InMemoryRateLimiter()
    request = MagicMock()
    request.headers = {}
    request.client.host = "192.168.1.101"
    email = "attacker@test.com"

    orig_enabled = settings.rate_limit_enabled
    orig_env = settings.environment
    orig_base = settings.auth_backoff_base_seconds
    orig_max = settings.auth_backoff_max_seconds

    settings.rate_limit_enabled = True
    settings.environment = "production"
    settings.auth_backoff_base_seconds = 2
    settings.auth_backoff_max_seconds = 60

    try:
        # First failure -> backoff = 2 * (2^0) = 2 seconds
        limiter.record_auth_failure(request, email)

        # Immediate check should raise 429
        with pytest.raises(HTTPException) as exc_info:
            limiter.check_auth_backoff(request, email)
        assert exc_info.value.status_code == 429
        assert "Exponential backoff active" in exc_info.value.detail
        assert "Retry-After" in exc_info.value.headers

        # Success clears backoff
        limiter.record_auth_success(request, email)
        # Should now pass without error
        limiter.check_auth_backoff(request, email)
    finally:
        settings.rate_limit_enabled = orig_enabled
        settings.environment = orig_env
        settings.auth_backoff_base_seconds = orig_base
        settings.auth_backoff_max_seconds = orig_max


def test_strict_input_validation():
    # 1. Valid OTP
    valid_otp = DeveloperOtpVerify(otp="123456")
    assert valid_otp.otp == "123456"

    # 2. Invalid OTP (non-numeric / wrong length) -> Must be rejected by schema
    with pytest.raises(ValueError):
        DeveloperOtpVerify(otp="1234")  # too short
    with pytest.raises(ValueError):
        DeveloperOtpVerify(otp="abcdef")  # non-digit
    with pytest.raises(ValueError):
        DeveloperOtpVerify(otp="1234567")  # too long

    # 3. Currency code pattern check
    with pytest.raises(ValueError):
        RegisterRequest(
            business_name="Test Store",
            store_name="Main Store",
            full_name="Tester",
            email="test@example.com",
            password="securepassword123",
            currency="US",  # Not 3 chars
        )
