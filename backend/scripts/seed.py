"""Create the demo account filled with realistic sample leads.

Usage (from the backend/ folder):
    python -m scripts.seed           # create the demo account (+ samples) if missing,
                                     # and top up any missing sample leads
    python -m scripts.seed --reset   # DROP ALL TABLES (every account and lead), then seed

The demo account lets reviewers log in straight away:
    email:    demo@kinetiq.app
    password: DemoPass123
(Public on purpose. On Vercel it is created automatically on startup.)
"""

import argparse

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine, init_db
from app.models.user import User
from app.services.demo import DEMO_EMAIL, DEMO_PASSWORD, ensure_demo_account
from app.services.lead_service import load_sample_leads


def seed(reset: bool = False) -> tuple[bool, int]:
    """Return (demo user created?, number of leads added)."""
    if reset:
        from app import models  # noqa: F401  (register tables before dropping)

        Base.metadata.drop_all(bind=engine)
    init_db()

    with SessionLocal() as db:
        created, added = ensure_demo_account(db)
        if not created:  # existing demo: add back any sample leads that were deleted
            user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
            added = load_sample_leads(db, user.id)
    return created, added


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed KINETIQ with a demo account and sample leads.")
    parser.add_argument("--reset", action="store_true", help="drop all tables first (deletes everything)")
    args = parser.parse_args()
    created, added = seed(reset=args.reset)
    print(f"Demo account {'created' if created else 'already existed'}: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    print(f"Added {added} sample lead(s).")
