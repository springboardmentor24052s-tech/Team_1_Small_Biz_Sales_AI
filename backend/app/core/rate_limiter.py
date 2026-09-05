import math
import time
from collections import defaultdict
from threading import Lock
from typing import Literal

from fastapi import HTTPException, Request, status

from app.core.config import settings


class InMemoryRateLimiter:
    """
    Thread-safe, sliding-window and exponential-backoff rate limiter.
    Supports:
    - Tiered route limits (Auth, Public, Authenticated)
    - Per-IP and Per-Account limits
    - Exponential backoff penalty on consecutive authentication failures
    """

    def __init__(self):
        self._lock = Lock()
        # key -> list of timestamp floats
        self._requests: dict[str, list[float]] = defaultdict(list)
        # key -> {"failures": int, "cooldown_until": float, "last_attempt": float}
        self._auth_backoffs: dict[str, dict] = defaultdict(dict)

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def check_rate_limit(
        self,
        request: Request,
        tier: Literal["auth", "public", "authenticated"] = "public",
        custom_key: str | None = None,
    ) -> None:
        if not settings.rate_limit_enabled or settings.environment == "testing":
            return

        now = time.time()
        client_ip = self._get_client_ip(request)
        key = custom_key or f"{tier}:{client_ip}"

        if tier == "auth":
            limit = settings.rate_limit_auth_ip_per_minute
        elif tier == "authenticated":
            limit = settings.rate_limit_authenticated_per_minute
        else:
            limit = settings.rate_limit_public_per_minute

        window_seconds = 60.0

        with self._lock:
            # Filter out timestamps older than the sliding window
            timestamps = [ts for ts in self._requests[key] if now - ts < window_seconds]
            self._requests[key] = timestamps

            if len(timestamps) >= limit:
                retry_after = math.ceil(window_seconds - (now - timestamps[0]))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for {tier} tier. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(max(1, retry_after))},
                )

            self._requests[key].append(now)

    def check_auth_backoff(self, request: Request, account_email: str | None = None) -> None:
        """
        Enforces exponential backoff for authentication endpoints (login, OTP, reset).
        Checks both client IP and normalized account email.
        """
        if not settings.rate_limit_enabled or settings.environment == "testing":
            return

        now = time.time()
        client_ip = self._get_client_ip(request)
        keys_to_check = [f"ip:{client_ip}"]
        if account_email:
            keys_to_check.append(f"account:{account_email.strip().lower()}")

        with self._lock:
            for key in keys_to_check:
                backoff_info = self._auth_backoffs.get(key)
                if backoff_info:
                    cooldown_until = backoff_info.get("cooldown_until", 0.0)
                    if now < cooldown_until:
                        remaining = math.ceil(cooldown_until - now)
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail=f"Too many failed login attempts. Exponential backoff active. Please wait {remaining} seconds before trying again.",
                            headers={"Retry-After": str(max(1, remaining))},
                        )

    def record_auth_failure(self, request: Request, account_email: str | None = None) -> None:
        """
        Increments failure counter and applies exponential backoff delay.
        delay = min(base * (2 ^ (failures - 1)), max_seconds)
        """
        if not settings.rate_limit_enabled or settings.environment == "testing":
            return

        now = time.time()
        client_ip = self._get_client_ip(request)
        keys_to_update = [f"ip:{client_ip}"]
        if account_email:
            keys_to_update.append(f"account:{account_email.strip().lower()}")

        with self._lock:
            for key in keys_to_update:
                current = self._auth_backoffs[key]
                failures = current.get("failures", 0) + 1
                base = settings.auth_backoff_base_seconds
                max_backoff = settings.auth_backoff_max_seconds

                # Exponential backoff: base * 2^(failures - 1)
                backoff_seconds = min(base * (2 ** (failures - 1)), max_backoff)
                cooldown_until = now + backoff_seconds

                self._auth_backoffs[key] = {
                    "failures": failures,
                    "cooldown_until": cooldown_until,
                    "last_attempt": now,
                }

    def record_auth_success(self, request: Request, account_email: str | None = None) -> None:
        """
        Resets failure count on successful authentication.
        """
        if not settings.rate_limit_enabled or settings.environment == "testing":
            return

        client_ip = self._get_client_ip(request)
        keys_to_reset = [f"ip:{client_ip}"]
        if account_email:
            keys_to_reset.append(f"account:{account_email.strip().lower()}")

        with self._lock:
            for key in keys_to_reset:
                self._auth_backoffs.pop(key, None)

    def reset(self) -> None:
        """Clears all sliding-window logs and backoff counters."""
        with self._lock:
            self._requests.clear()
            self._auth_backoffs.clear()


rate_limiter = InMemoryRateLimiter()


def rate_limit_auth(request: Request) -> None:
    rate_limiter.check_rate_limit(request, tier="auth")


def rate_limit_public(request: Request) -> None:
    rate_limiter.check_rate_limit(request, tier="public")


def rate_limit_authenticated(request: Request) -> None:
    rate_limiter.check_rate_limit(request, tier="authenticated")
