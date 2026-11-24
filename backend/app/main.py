"""FastAPI application entry point.

Run locally:  uvicorn app.main:app --reload
API docs:     http://127.0.0.1:8000/api/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db
from app.core.exceptions import register_exception_handlers, unhandled_error_middleware

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


def prepare_database() -> None:
    """Create tables (and, if enabled, the demo account). Safe to run repeatedly."""
    init_db()
    if settings.seed_demo_on_startup:
        from app.core.database import SessionLocal
        from app.services.demo import ensure_demo_account

        with SessionLocal() as db:
            created, added = ensure_demo_account(db)
            if created:
                logging.getLogger(__name__).info("Demo account created with %s sample leads", added)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.check_production_safety()
    prepare_database()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="REST API for KINETIQ, a lead-tracking CRM: manage, search and track leads.",
        lifespan=lifespan,
        # Docs live under /api so they work behind the same path prefix in production.
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=None,
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    register_exception_handlers(app)

    # Order matters: the last middleware added is the outermost. CORS wraps the
    # error middleware so even 500 responses carry CORS headers.
    app.middleware("http")(unhandled_error_middleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,  # the session cookie must be sent if the API is on another origin
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/", include_in_schema=False)
    def root():
        return {"name": settings.app_name, "docs": f"{settings.api_prefix}/docs"}

    return app


app = create_app()
