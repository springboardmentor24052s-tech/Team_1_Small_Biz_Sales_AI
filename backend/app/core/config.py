import os

class Settings:
    PROJECT_NAME: str = "MarketMind AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "marketmind_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/marketmind")

settings = Settings()
