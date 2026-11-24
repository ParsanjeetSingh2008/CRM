"""The `leads` table."""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.types import UTCDateTime, utcnow


class LeadStatus(StrEnum):
    NEW = "New"
    CONTACTED = "Contacted"
    CONVERTED = "Converted"


class Lead(Base):
    __tablename__ = "leads"
    # Each account has its own leads, so an email only has to be unique per owner.
    __table_args__ = (UniqueConstraint("owner_id", "email", name="uq_leads_owner_email"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Stored lowercase (see schemas) so uniqueness is case-insensitive.
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    business_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[LeadStatus] = mapped_column(
        Enum(
            LeadStatus,
            name="lead_status",
            native_enum=False,  # plain VARCHAR, portable across databases
            length=20,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            validate_strings=True,
        ),
        nullable=False,
        default=LeadStatus.NEW,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        UTCDateTime, nullable=False, default=utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    def __repr__(self) -> str:
        return f"<Lead id={self.id} email={self.email!r} status={self.status.value}>"
