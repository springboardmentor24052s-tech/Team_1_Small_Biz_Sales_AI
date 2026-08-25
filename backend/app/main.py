import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.api.v1.api import api_router
from backend.app.db.session import SessionLocal
from backend.app.db.init_db import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("marketmind.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MarketMind AI Database...")
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    finally:
        db.close()
    yield
    logger.info("MarketMind AI Backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="MarketMind AI - Enterprise Grade Small Business Sales Intelligence Platform",
    version="2.4.0",
    lifespan=lifespan
)

# Enable CORS for local frontend development (Vite server http://localhost:5173 or 127.0.0.1:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root_status():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "version": "2.4.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8001, reload=True)
