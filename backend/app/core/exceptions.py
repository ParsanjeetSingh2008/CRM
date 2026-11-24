"""Custom errors and handlers that turn every failure into one JSON shape:

    {"error": {"code": "...", "message": "...", "details": [...]}}

The frontend can then show `message` in a toast and map `details` onto form fields.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "INTERNAL_ERROR"
    message: str = "Something went wrong. Please try again."

    def __init__(self, message: str | None = None, details: list[dict[str, Any]] | None = None):
        self.message = message or self.message
        self.details = details or []
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"
    message = "The requested resource was not found."


class DuplicateEmailError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "DUPLICATE_EMAIL"
    message = "A lead with this email already exists."

    def __init__(self) -> None:
        super().__init__(details=[{"field": "email", "message": self.message}])


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "UNAUTHORIZED"
    message = "Please log in to continue."


class InvalidCredentialsError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "INVALID_CREDENTIALS"
    # Deliberately vague: never reveal whether the email or the password was wrong.
    message = "Incorrect email or password."


class EmailTakenError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "EMAIL_TAKEN"
    message = "An account with this email already exists. Try logging in instead."

    def __init__(self) -> None:
        super().__init__(details=[{"field": "email", "message": self.message}])


class TooManyRequestsError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "TOO_MANY_REQUESTS"
    message = "Too many attempts. Please wait a few minutes and try again."


class AssistantUnavailableError(AppError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "ASSISTANT_UNAVAILABLE"
    message = "Clive is unavailable right now. Please try again in a moment."


def error_response(
    status_code: int, code: str, message: str, details: list[dict[str, Any]] | None = None
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def _friendly_message(err: dict[str, Any]) -> str:
    """Rewrite Pydantic's technical messages into ones a user can act on."""
    err_type = err.get("type", "")
    ctx = err.get("ctx") or {}
    if err_type == "missing":
        return "This field is required."
    if err_type == "string_too_short":
        min_length = ctx.get("min_length", 1)
        return "This field is required." if min_length == 1 else f"Must be at least {min_length} characters."
    if err_type == "string_too_long":
        return f"Must be at most {ctx.get('max_length')} characters."
    if err_type == "enum":
        return f"Must be one of: {ctx.get('expected')}."
    if err_type == "value_error":
        return str(err.get("msg", "")).removeprefix("Value error, ")
    return str(err.get("msg", "Invalid value."))


def _field_name(loc: tuple | list) -> str:
    # loc looks like ("body", "email") or ("query", "page").
    parts = [str(part) for part in loc[1:]] if len(loc) > 1 else [str(part) for part in loc]
    return ".".join(parts)


async def _app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return error_response(exc.status_code, exc.code, exc.message, exc.details)


async def _validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    details = [
        {"field": _field_name(err.get("loc", ())), "message": _friendly_message(err)}
        for err in exc.errors()
    ]
    return error_response(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        "VALIDATION_ERROR",
        "Some fields are invalid. Please check and try again.",
        details,
    )


async def _http_error_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}.get(exc.status_code, "HTTP_ERROR")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return error_response(exc.status_code, code, message)


async def unhandled_error_middleware(request: Request, call_next):
    """Catch anything unexpected, log it, and return a clean 500.

    This runs as middleware (inside CORS) rather than an exception handler so
    the browser still receives CORS headers and can read the error body.
    """
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR, AppError.code, AppError.message
        )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, _http_error_handler)
