"""Request and response shapes for the leads API.

Pydantic validates every incoming body against these models before any route
code runs, so invalid data never reaches the database.
"""

import re
from datetime import date, datetime
from typing import Literal

from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.lead import LeadStatus

# Digits, spaces, dashes, dots, brackets and an optional leading "+".
PHONE_PATTERN = re.compile(r"^\+?[0-9\s\-().]+$")
PHONE_MIN_DIGITS = 7
PHONE_MAX_DIGITS = 15  # E.164 maximum

SortOption = Literal["newest", "oldest", "name_asc", "name_desc"]


def normalize_email(value: str) -> str:
    """Validate an email address and return it normalised to lowercase."""
    try:
        result = validate_email(value, check_deliverability=False)
    except EmailNotValidError:
        raise ValueError("Enter a valid email address.") from None
    return result.normalized.lower()


class LeadBase(BaseModel):
    """Fields shared by create and update requests."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=100, examples=["Aarav Sharma"])
    email: str = Field(max_length=255, examples=["aarav@brightpixel.in"])
    phone: str = Field(max_length=20, examples=["+91 98765 43210"])
    business_name: str = Field(min_length=2, max_length=150, examples=["BrightPixel Studios"])
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "business_name")
    @classmethod
    def collapse_spaces(cls, value: str) -> str:
        return re.sub(r"\s+", " ", value)

    @field_validator("email")
    @classmethod
    def validate_email_address(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not PHONE_PATTERN.fullmatch(value):
            raise ValueError("Phone can only contain digits, spaces, +, -, ( ) and dots.")
        digit_count = sum(ch.isdigit() for ch in value)
        if not PHONE_MIN_DIGITS <= digit_count <= PHONE_MAX_DIGITS:
            raise ValueError(
                f"Phone must contain between {PHONE_MIN_DIGITS} and {PHONE_MAX_DIGITS} digits."
            )
        return re.sub(r"\s+", " ", value)

    @field_validator("notes")
    @classmethod
    def empty_notes_to_none(cls, value: str | None) -> str | None:
        return value or None


class LeadCreate(LeadBase):
    status: LeadStatus = LeadStatus.NEW


class LeadUpdate(LeadBase):
    """Full update (PUT): every editable field must be sent."""

    status: LeadStatus


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str
    business_name: str
    status: LeadStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime


class LeadList(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    page_size: int
    pages: int


class LeadStats(BaseModel):
    total: int
    new: int
    contacted: int
    converted: int
    conversion_rate: float = Field(description="Converted / total, as a percentage (0-100).")


class SampleDataResult(BaseModel):
    added: int


# ---------- Analytics (charts) ----------


class TimelinePoint(BaseModel):
    date: date
    total: int


class StatusSlice(BaseModel):
    status: LeadStatus
    count: int


class Heatmap(BaseModel):
    days: list[str] = Field(description="Row labels, Monday first.")
    slots: list[str] = Field(description="Column labels: 3-hour blocks of the local day.")
    values: list[list[int]] = Field(description="values[day][slot] = leads created.")
    max: int


class LeadAnalytics(BaseModel):
    range_days: int
    start_date: date
    end_date: date
    total: int = Field(description="Leads created in the range.")
    status_breakdown: list[StatusSlice]
    timeline: list[TimelinePoint] = Field(description="Leads created per day, oldest first.")
    heatmap: Heatmap
