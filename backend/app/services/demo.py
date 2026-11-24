"""The public demo account ("Try the demo account" on the login screen)."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.services.lead_service import load_sample_leads

DEMO_NAME = "Demo User"
DEMO_EMAIL = "demo@kinetiq.app"
DEMO_PASSWORD = "DemoPass123"  # public on purpose: it's a shared demo


def ensure_demo_account(db: Session) -> tuple[bool, int]:
    """Create the demo user if missing and top up its sample leads.

    Returns (created?, leads added). Safe to call on every start.
    """
    user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    created = user is None
    if created:
        user = User(name=DEMO_NAME, email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD))
        db.add(user)
        try:
            db.commit()
        except IntegrityError:  # another worker created it at the same moment
            db.rollback()
            return False, 0
        db.refresh(user)
    # Only load samples into a brand-new (or emptied) demo, never on top of edits.
    added = load_sample_leads(db, user.id) if created else 0
    return created, added
