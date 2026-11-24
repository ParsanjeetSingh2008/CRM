"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import read_session_token
from app.models.user import User

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(request: Request, db: DbSession) -> User:
    """Resolve the logged-in user from the session cookie, or reject with 401."""
    token = request.cookies.get(settings.session_cookie_name)
    user_id = read_session_token(token) if token else None
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise UnauthorizedError()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
