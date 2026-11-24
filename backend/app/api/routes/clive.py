"""Clive, the AI assistant."""

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.exceptions import TooManyRequestsError
from app.core.rate_limit import clive_limiter
from app.schemas.clive import AssistantStatus, ChatReply, ChatRequest
from app.services import clive

router = APIRouter(prefix="/clive", tags=["clive"])


@router.get("/status", response_model=AssistantStatus, summary="Is Clive configured?")
def status(_: CurrentUser):
    return AssistantStatus(available=clive.assistant_configured(), model=settings.clive_model)


@router.post("/chat", response_model=ChatReply, summary="Ask Clive about your leads")
def chat(payload: ChatRequest, db: DbSession, user: CurrentUser):
    if not clive_limiter.allow(f"user:{user.id}"):
        raise TooManyRequestsError("You've asked Clive a lot in a short time. Please wait a few minutes.")
    return clive.chat(db, user, payload.messages, payload.tz_offset_minutes)
