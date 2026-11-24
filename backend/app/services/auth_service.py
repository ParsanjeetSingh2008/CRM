"""Account creation and login checks."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import EmailTakenError, InvalidCredentialsError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest


def create_user(db: Session, data: SignupRequest) -> User:
    if db.scalar(select(User.id).where(User.email == data.email)) is not None:
        raise EmailTakenError()
    user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two sign-ups with the same email at the same moment
        db.rollback()
        raise EmailTakenError() from None
    db.refresh(user)
    return user


def authenticate(db: Session, data: LoginRequest) -> User:
    user = db.scalar(select(User).where(User.email == data.email))
    # verify_password runs even when the user doesn't exist (constant-ish timing).
    if not verify_password(data.password, user.password_hash if user else None) or user is None:
        raise InvalidCredentialsError()
    return user
