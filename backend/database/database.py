from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, declarative_base

url = URL.create(
    drivername="postgresql+psycopg2",
    username="postgres",
    password="Tanu@2003",   
    port=5432,
    database="small_business_ai"
)

engine = create_engine(url)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

if __name__ == "__main__":
    try:
        connection = engine.connect()
        print("✅ Connected to PostgreSQL successfully!")
        connection.close()
    except Exception as e:
        print("❌ Database Connection Failed!")
        print(e)
