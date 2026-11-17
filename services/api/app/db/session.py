import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Determine active database URL with fallback
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://") and "+psycopg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = None

try:
    # Test creating connection
    temp_engine = create_engine(db_url, pool_pre_ping=True)
    with temp_engine.connect() as conn:
        pass
    engine = temp_engine
except Exception as e:
    # Fallback to local SQLite database for flexible offline development & testing
    local_db_path = Path(settings.DATA_DIR) / "civicsphere_local.db"
    local_db_path.parent.mkdir(parents=True, exist_ok=True)
    sqlite_url = f"sqlite:///{local_db_path}"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
