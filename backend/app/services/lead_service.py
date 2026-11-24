"""All database logic for leads.

Routes stay thin (HTTP in, HTTP out) and call these functions, which keeps the
business rules in one place and easy to test.

Every function takes `owner_id` and only ever touches that account's leads, so
one user can never read or change another user's data. A lead that belongs to
someone else behaves exactly like a lead that doesn't exist (404).
"""

import math
from collections import Counter
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateEmailError, NotFoundError
from app.models.lead import Lead, LeadStatus
from app.models.types import utcnow
from app.schemas.lead import (
    Heatmap,
    LeadAnalytics,
    LeadCreate,
    LeadList,
    LeadOut,
    LeadStats,
    LeadUpdate,
    SortOption,
    StatusSlice,
    TimelinePoint,
)
from app.services.sample_data import build_sample_leads

HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
HEATMAP_SLOTS = ["12–3am", "3–6am", "6–9am", "9am–12pm", "12–3pm", "3–6pm", "6–9pm", "9pm–12am"]
HOURS_PER_SLOT = 3

_SORT_COLUMNS = {
    "newest": (Lead.created_at.desc(), Lead.id.desc()),
    "oldest": (Lead.created_at.asc(), Lead.id.asc()),
    "name_asc": (func.lower(Lead.name).asc(), Lead.id.asc()),
    "name_desc": (func.lower(Lead.name).desc(), Lead.id.desc()),
}


def _escape_like(term: str) -> str:
    """Escape LIKE wildcards so a search for "50%" matches the literal text."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def list_leads(
    db: Session,
    owner_id: int,
    *,
    search: str | None = None,
    status: LeadStatus | None = None,
    page: int = 1,
    page_size: int = 20,
    sort: SortOption = "newest",
) -> LeadList:
    query = select(Lead).where(Lead.owner_id == owner_id)

    if search and search.strip():
        pattern = f"%{_escape_like(search.strip().lower())}%"
        query = query.where(
            or_(
                func.lower(Lead.name).like(pattern, escape="\\"),
                func.lower(Lead.email).like(pattern, escape="\\"),
            )
        )
    if status is not None:
        query = query.where(Lead.status == status)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    items = db.scalars(
        query.order_by(*_SORT_COLUMNS[sort]).offset((page - 1) * page_size).limit(page_size)
    ).all()

    return LeadList(
        items=[LeadOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


def get_lead(db: Session, owner_id: int, lead_id: int) -> Lead:
    lead = db.scalar(select(Lead).where(Lead.id == lead_id, Lead.owner_id == owner_id))
    if lead is None:
        raise NotFoundError(f"Lead with id {lead_id} was not found.")
    return lead


def _ensure_email_available(
    db: Session, owner_id: int, email: str, exclude_id: int | None = None
) -> None:
    query = select(Lead.id).where(Lead.owner_id == owner_id, Lead.email == email)
    if exclude_id is not None:
        query = query.where(Lead.id != exclude_id)
    if db.scalar(query) is not None:
        raise DuplicateEmailError()


def _commit(db: Session) -> None:
    """Commit, turning a unique-constraint race into a friendly 409."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateEmailError() from None


def create_lead(db: Session, owner_id: int, data: LeadCreate) -> Lead:
    _ensure_email_available(db, owner_id, data.email)
    lead = Lead(**data.model_dump(), owner_id=owner_id)
    db.add(lead)
    _commit(db)
    db.refresh(lead)
    return lead


def update_lead(db: Session, owner_id: int, lead_id: int, data: LeadUpdate) -> Lead:
    lead = get_lead(db, owner_id, lead_id)
    _ensure_email_available(db, owner_id, data.email, exclude_id=lead_id)
    for field, value in data.model_dump().items():
        setattr(lead, field, value)
    _commit(db)
    db.refresh(lead)
    return lead


def update_lead_status(db: Session, owner_id: int, lead_id: int, status: LeadStatus) -> Lead:
    lead = get_lead(db, owner_id, lead_id)
    lead.status = status
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, owner_id: int, lead_id: int) -> None:
    lead = get_lead(db, owner_id, lead_id)
    db.delete(lead)
    db.commit()


def load_sample_leads(db: Session, owner_id: int) -> int:
    """Fill an account with demo leads, skipping emails it already has."""
    existing = set(db.scalars(select(Lead.email).where(Lead.owner_id == owner_id)).all())
    added = 0
    for data in build_sample_leads(utcnow()):
        if data["email"] in existing:
            continue
        db.add(Lead(**data, owner_id=owner_id, updated_at=data["created_at"]))
        added += 1
    db.commit()
    return added


def get_stats(db: Session, owner_id: int) -> LeadStats:
    rows = db.execute(
        select(Lead.status, func.count()).where(Lead.owner_id == owner_id).group_by(Lead.status)
    ).all()
    counts = {status: count for status, count in rows}

    total = sum(counts.values())
    converted = counts.get(LeadStatus.CONVERTED, 0)

    return LeadStats(
        total=total,
        new=counts.get(LeadStatus.NEW, 0),
        contacted=counts.get(LeadStatus.CONTACTED, 0),
        converted=converted,
        conversion_rate=round(converted / total * 100, 1) if total else 0.0,
    )


def get_analytics(
    db: Session, owner_id: int, *, days: int = 30, tz_offset_minutes: int = 0
) -> LeadAnalytics:
    """Chart data for leads created in the last `days` days (today included).

    Days and hours are bucketed in the viewer's local time: `tz_offset_minutes`
    is local time minus UTC (e.g. 330 for India). Aggregation happens in Python
    rather than SQL so it works the same on SQLite, Turso or Postgres.
    """
    offset = timedelta(minutes=tz_offset_minutes)
    end_date = (utcnow() + offset).date()
    start_date = end_date - timedelta(days=days - 1)
    start_utc = datetime.combine(start_date, time.min, tzinfo=timezone.utc) - offset

    rows = db.execute(
        select(Lead.created_at, Lead.status).where(
            Lead.owner_id == owner_id, Lead.created_at >= start_utc
        )
    ).all()

    per_day: Counter = Counter()
    per_status: Counter = Counter()
    heatmap = [[0] * len(HEATMAP_SLOTS) for _ in HEATMAP_DAYS]

    for created_at, status in rows:
        local = created_at + offset
        per_day[local.date()] += 1
        per_status[status] += 1
        heatmap[local.weekday()][local.hour // HOURS_PER_SLOT] += 1

    return LeadAnalytics(
        range_days=days,
        start_date=start_date,
        end_date=end_date,
        total=len(rows),
        status_breakdown=[
            StatusSlice(status=status, count=per_status.get(status, 0)) for status in LeadStatus
        ],
        timeline=[
            TimelinePoint(date=day, total=per_day.get(day, 0))
            for day in (start_date + timedelta(days=i) for i in range(days))
        ],
        heatmap=Heatmap(
            days=HEATMAP_DAYS,
            slots=HEATMAP_SLOTS,
            values=heatmap,
            max=max((max(row) for row in heatmap), default=0),
        ),
    )
