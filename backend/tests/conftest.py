"""Test fixtures: every test gets a fresh in-memory database.

- `anon_client`: an HTTP client that is not logged in.
- `client`: logged in as a freshly signed-up user (most tests use this).
- `other_client`: logged in as a second user, for data-isolation tests.
"""

import os

# Must be set before the app is imported, so settings pick it up.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["GROQ_API_KEY"] = ""  # tests never call the real model

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, engine  # noqa: E402
from app.core.rate_limit import auth_limiter, clive_limiter  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "Secret123"


@pytest.fixture(autouse=True)
def fresh_state():
    from app import models  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    auth_limiter.reset()
    clive_limiter.reset()
    yield


def signup(client: TestClient, email: str, name: str = "Olivia Owner") -> dict:
    response = client.post(
        "/api/auth/signup", json={"name": name, "email": email, "password": PASSWORD}
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def anon_client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        signup(test_client, "owner@example.org")
        yield test_client


@pytest.fixture
def other_client():
    with TestClient(app) as test_client:
        signup(test_client, "someone.else@example.org", name="Sam Else")
        yield test_client


@pytest.fixture
def lead_payload() -> dict:
    return {
        "name": "Aarav Sharma",
        "email": "aarav@brightpixel.in",
        "phone": "+91 98765 43210",
        "business_name": "BrightPixel Studios",
    }


@pytest.fixture
def create_lead(client, lead_payload):
    """Factory: create_lead(email=..., status=...) -> created lead JSON."""

    def _create(**overrides) -> dict:
        response = client.post("/api/leads", json={**lead_payload, **overrides})
        assert response.status_code == 201, response.text
        return response.json()

    return _create
