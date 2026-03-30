from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import psycopg2
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:5432/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_size=3,
    max_overflow=3,
    pool_timeout=30,
    pool_pre_ping=True,
    pool_recycle=1800
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# ORM connections, for general endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Raw SQL connections, for search endpoints
def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )