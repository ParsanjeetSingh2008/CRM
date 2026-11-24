"""Vercel entry point: runs the FastAPI backend as one serverless function.

vercel.json rewrites every /api/* request here; FastAPI then routes it using
the original path (e.g. /api/leads). The backend code lives in backend/app.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings  # noqa: E402
from app.main import app, prepare_database  # noqa: E402

# Runs once per cold start, so the (temporary) SQLite database is ready even
# before the first request. FastAPI's own startup hook repeats it harmlessly.
settings.check_production_safety()
prepare_database()

__all__ = ["app"]
