import os
from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL") or get_settings().database_url
if _url.startswith("postgres://"):
    _url = "postgresql+psycopg://" + _url.removeprefix("postgres://")
elif _url.startswith("postgresql://"):
    _url = "postgresql+psycopg://" + _url.removeprefix("postgresql://")
if _url.startswith("sqlite") and os.environ.get("VERCEL") == "1":
    raise RuntimeError("Set DATABASE_URL to a durable PostgreSQL database on Vercel; SQLite is ephemeral.")
_connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}
engine = create_engine(_url, connect_args=_connect_args, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.db import models  # noqa: F401  (registers tables; avoids circular import)

    # Add the column before create_all tries to create the new Firebase UID index.
    if "users" in inspect(engine).get_table_names():
        columns = {column["name"] for column in inspect(engine).get_columns("users")}
        if "firebase_uid" not in columns:
            with engine.begin() as connection:
                if connection.dialect.name == "postgresql":
                    connection.execute(text(
                        "ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128)"
                    ))
                else:
                    connection.execute(text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128)"))
    Base.metadata.create_all(engine)
