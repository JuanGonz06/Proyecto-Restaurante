"""Conexión a la base de datos (PostgreSQL/Neon en producción, SQLite por defecto en desarrollo)."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

_url = settings.database_url
if _url.startswith("postgres://"):  # algunos proveedores entregan este prefijo, SQLAlchemy exige postgresql://
    _url = _url.replace("postgres://", "postgresql://", 1)

_connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}

# pool_pre_ping: Neon suspende las conexiones inactivas; así se reabren sin error.
engine = create_engine(_url, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
