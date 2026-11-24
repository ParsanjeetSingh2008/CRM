"""Sign up, log in, log out, and "who am I"."""

from fastapi import APIRouter, Request, Response, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.exceptions import TooManyRequestsError
from app.core.rate_limit import auth_limiter, client_ip
from app.core.security import create_session_token
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _start_session(response: Response, user: User) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=create_session_token(user.id),
        max_age=settings.session_days * 24 * 60 * 60,
        httponly=True,  # not readable from JavaScript
        secure=settings.is_production,  # HTTPS-only in production
        samesite="lax",  # not sent on cross-site POSTs (CSRF protection)
        path="/",
    )


def _check_rate_limit(request: Request) -> None:
    if not auth_limiter.allow(client_ip(request)):
        raise TooManyRequestsError()


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Create an account")
def signup(payload: SignupRequest, request: Request, response: Response, db: DbSession):
    _check_rate_limit(request)
    user = auth_service.create_user(db, payload)
    _start_session(response, user)
    return user


@router.post("/login", response_model=UserOut, summary="Log in")
def login(payload: LoginRequest, request: Request, response: Response, db: DbSession):
    _check_rate_limit(request)
    user = auth_service.authenticate(db, payload)
    _start_session(response, user)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Log out")
def logout():
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(
        settings.session_cookie_name,
        path="/",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )
    return response


@router.get("/me", response_model=UserOut, summary="The logged-in user")
def me(user: CurrentUser):
    return user
