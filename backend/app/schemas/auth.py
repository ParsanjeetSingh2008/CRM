"""Request and response shapes for sign up / log in."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.lead import normalize_email

PASSWORD_MIN = 8
PASSWORD_MAX = 128


class LoginRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(max_length=255)
    # Not stripped/validated beyond length: a login must try the password exactly as typed.
    password: str = Field(min_length=1, max_length=PASSWORD_MAX)

    @field_validator("email")
    @classmethod
    def validate_email_address(cls, value: str) -> str:
        return normalize_email(value)


class SignupRequest(LoginRequest):
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)

    @field_validator("name")
    @classmethod
    def collapse_spaces(cls, value: str) -> str:
        return re.sub(r"\s+", " ", value)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not (re.search(r"[A-Za-z]", value) and re.search(r"\d", value)):
            raise ValueError("Password must contain at least one letter and one number.")
        return value


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime
