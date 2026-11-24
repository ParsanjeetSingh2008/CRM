"""HTTP endpoints for leads. Each route validates input, calls the service, returns JSON.

Every route requires a logged-in user (`CurrentUser`) and only sees that user's leads.
"""

from typing import Annotated

from fastapi import APIRouter, Path, Query, Response, status

from app.api.deps import CurrentUser, DbSession
from app.models.lead import LeadStatus
from app.schemas.lead import (
    LeadAnalytics,
    LeadCreate,
    LeadList,
    LeadOut,
    LeadStats,
    LeadStatusUpdate,
    LeadUpdate,
    SampleDataResult,
    SortOption,
)
from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["leads"])

LeadId = Annotated[int, Path(ge=1, description="Lead ID")]


@router.get("", response_model=LeadList, summary="List, search and filter leads")
def list_leads(
    db: DbSession,
    user: CurrentUser,
    search: Annotated[str | None, Query(max_length=100, description="Matches name or email")] = None,
    status_filter: Annotated[LeadStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    sort: SortOption = "newest",
):
    return lead_service.list_leads(
        db, user.id, search=search, status=status_filter, page=page, page_size=page_size, sort=sort
    )


# Declared before "/{lead_id}" so "stats" / "analytics" are not parsed as an ID.
@router.get("/stats", response_model=LeadStats, summary="Dashboard counts")
def get_stats(db: DbSession, user: CurrentUser):
    return lead_service.get_stats(db, user.id)


@router.get("/analytics", response_model=LeadAnalytics, summary="Chart data for a time range")
def get_analytics(
    db: DbSession,
    user: CurrentUser,
    days: Annotated[int, Query(ge=7, le=365, description="Range length in days")] = 30,
    tz_offset_minutes: Annotated[
        int,
        Query(ge=-840, le=840, description="Viewer's local time minus UTC, in minutes (IST = 330)"),
    ] = 0,
):
    return lead_service.get_analytics(db, user.id, days=days, tz_offset_minutes=tz_offset_minutes)


@router.post(
    "/sample-data",
    response_model=SampleDataResult,
    summary="Fill your account with ~70 demo leads",
)
def load_sample_data(db: DbSession, user: CurrentUser):
    return SampleDataResult(added=lead_service.load_sample_leads(db, user.id))


@router.get("/{lead_id}", response_model=LeadOut, summary="Get one lead")
def get_lead(lead_id: LeadId, db: DbSession, user: CurrentUser):
    return lead_service.get_lead(db, user.id, lead_id)


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED, summary="Create a lead")
def create_lead(payload: LeadCreate, db: DbSession, user: CurrentUser):
    return lead_service.create_lead(db, user.id, payload)


@router.put("/{lead_id}", response_model=LeadOut, summary="Update all fields of a lead")
def update_lead(lead_id: LeadId, payload: LeadUpdate, db: DbSession, user: CurrentUser):
    return lead_service.update_lead(db, user.id, lead_id, payload)


@router.patch("/{lead_id}/status", response_model=LeadOut, summary="Change a lead's status")
def update_lead_status(lead_id: LeadId, payload: LeadStatusUpdate, db: DbSession, user: CurrentUser):
    return lead_service.update_lead_status(db, user.id, lead_id, payload.status)


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a lead")
def delete_lead(lead_id: LeadId, db: DbSession, user: CurrentUser):
    lead_service.delete_lead(db, user.id, lead_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
