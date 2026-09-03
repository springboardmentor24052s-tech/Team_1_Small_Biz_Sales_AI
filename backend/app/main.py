from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    from app.bootstrap import bootstrap
    try:
        bootstrap()
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Sales intelligence APIs for MarketMind",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url=f"{settings.api_v1_prefix}/docs",
    redoc_url=f"{settings.api_v1_prefix}/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Correlation-ID", "X-Reauth-Token"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or str(uuid4())
    request.state.correlation_id = correlation_id
    response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "code": f"http_{exc.status_code}",
            "message": str(exc.detail),
            "correlation_id": request.state.correlation_id,
            "field_details": [],
            "retryable": exc.status_code >= 500,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "code": "validation_error",
            "message": "Request validation failed",
            "correlation_id": request.state.correlation_id,
            "field_details": jsonable_encoder(exc.errors()),
            "retryable": False,
        },
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)
app.mount(
    f"{settings.api_v1_prefix}/uploads",
    StaticFiles(directory="uploads", check_dir=False),
    name="uploads",
)


@app.get("/", include_in_schema=False)
def root():
    return {"service": settings.app_name, "docs": f"{settings.api_v1_prefix}/docs"}
