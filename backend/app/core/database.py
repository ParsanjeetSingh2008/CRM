"""Database engine, session factory and the FastAPI `get_db` dependency."""

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class every ORM model inherits from."""


def _is_in_memory(url: str) -> bool:
    return url in ("sqlite://", "sqlite:///:memory:")


def build_engine(url: str) -> Engine:
    connect_args: dict = {}
    engine_kwargs: dict = {"pool_pre_ping": True}

    if url.startswith("sqlite"):
        # FastAPI runs sync endpoints in a thread pool, so a connection may be
        # used from a different thread than the one that opened it.
        connect_args["check_same_thread"] = False
        if _is_in_memory(url):
            # One shared connection, otherwise every connection gets its own
            # empty in-memory database (used by the test suite).
            engine_kwargs["poolclass"] = StaticPool

    engine = create_engine(url, connect_args=connect_args, **engine_kwargs)

    if url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _set_sqlite_pragmas(dbapi_connection, _connection_record) -> None:
            cursor = dbapi_connection.cursor()
            # WAL lets reads happen while a write is in progress, which avoids
            # most "database is locked" errors.
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


engine = build_engine(settings.database_url)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """Yield one database session per request and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they do not exist yet."""
    # Importing the models registers them on Base.metadata.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
