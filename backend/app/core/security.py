"""Password hashing and session tokens.

- Passwords are hashed with Argon2 (memory-hard, the current OWASP recommendation).
  The plain password is never stored or logged.
- A session is a signed JWT stored in an httpOnly cookie, so page JavaScript
  (and any injected script) cannot read it.
"""

from datetime import timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import settings
from app.models.types import utcnow

_hasher = PasswordHasher()

# Verifying against this when the email is unknown makes "no such user" take as
# long as "wrong password", so response timing doesn't reveal which emails exist.
_DUMMY_HASH = _hasher.hash("not-a-real-password")

_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_session_token(user_id: int) -> str:
    now = utcnow()
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(days=settings.session_days),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def read_session_token(token: str) -> int | None:
    """Return the user id inside a valid, unexpired token, else None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[_ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
