import pytest

from app.core.config import DEV_SECRET_KEY, Settings
from tests.conftest import PASSWORD, signup


def test_signup_logs_the_user_in(anon_client):
    response = anon_client.post(
        "/api/auth/signup",
        json={"name": "  Priya   Nair ", "email": "Priya@Example.ORG", "password": "Garden2024"},
    )

    assert response.status_code == 201
    user = response.json()
    assert user["name"] == "Priya Nair"
    assert user["email"] == "priya@example.org"
    assert "password" not in response.text and "password_hash" not in user

    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie

    assert anon_client.get("/api/auth/me").json()["email"] == "priya@example.org"


def test_signup_rejects_duplicate_email_any_case(anon_client):
    signup(anon_client, "taken@example.org")
    response = anon_client.post(
        "/api/auth/signup", json={"name": "Copy Cat", "email": "TAKEN@example.org", "password": PASSWORD}
    )

    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == "EMAIL_TAKEN"
    assert error["details"][0]["field"] == "email"


@pytest.mark.parametrize(
    ("password", "expected"),
    [("short1", "at least 8"), ("onlyletters", "letter and one number"), ("12345678", "letter and one number")],
)
def test_signup_password_rules(anon_client, password, expected):
    response = anon_client.post(
        "/api/auth/signup", json={"name": "Weak Pass", "email": "weak@example.org", "password": password}
    )
    assert response.status_code == 422
    details = {d["field"]: d["message"] for d in response.json()["error"]["details"]}
    assert expected in details["password"]


def test_login_and_logout(anon_client):
    signup(anon_client, "me@example.org")
    anon_client.post("/api/auth/logout")
    assert anon_client.get("/api/auth/me").status_code == 401

    response = anon_client.post("/api/auth/login", json={"email": "ME@example.org", "password": PASSWORD})
    assert response.status_code == 200
    assert anon_client.get("/api/auth/me").json()["email"] == "me@example.org"


@pytest.mark.parametrize(
    "credentials",
    [{"email": "me@example.org", "password": "WrongPass1"}, {"email": "nobody@example.org", "password": PASSWORD}],
)
def test_login_failures_give_the_same_vague_error(anon_client, credentials):
    signup(anon_client, "me@example.org")
    anon_client.post("/api/auth/logout")

    response = anon_client.post("/api/auth/login", json=credentials)

    assert response.status_code == 401
    assert response.json()["error"] == {
        "code": "INVALID_CREDENTIALS",
        "message": "Incorrect email or password.",
        "details": [],
    }


def test_login_is_rate_limited(anon_client):
    statuses = [
        anon_client.post("/api/auth/login", json={"email": "x@example.org", "password": "Nope1234"}).status_code
        for _ in range(11)
    ]
    assert statuses[:10] == [401] * 10
    assert statuses[10] == 429


@pytest.mark.parametrize(
    ("method", "path"),
    [("get", "/api/leads"), ("get", "/api/leads/stats"), ("get", "/api/leads/analytics"),
     ("post", "/api/leads"), ("delete", "/api/leads/1"), ("post", "/api/clive/chat")],
)
def test_lead_and_clive_endpoints_require_login(anon_client, method, path):
    response = getattr(anon_client, method)(path)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_tampered_session_is_rejected(anon_client):
    anon_client.cookies.set("crm_session", "not.a.real.token")
    assert anon_client.get("/api/auth/me").status_code == 401


def test_users_only_see_their_own_leads(client, other_client, create_lead, lead_payload):
    mine = create_lead()

    # The other account sees nothing and cannot touch my lead (404, not 403: no leak).
    assert other_client.get("/api/leads").json()["total"] == 0
    assert other_client.get("/api/leads/stats").json()["total"] == 0
    assert other_client.get(f"/api/leads/{mine['id']}").status_code == 404
    assert other_client.put(f"/api/leads/{mine['id']}", json={**lead_payload, "status": "New"}).status_code == 404
    assert other_client.patch(f"/api/leads/{mine['id']}/status", json={"status": "Converted"}).status_code == 404
    assert other_client.delete(f"/api/leads/{mine['id']}").status_code == 404

    # The same lead email is fine in a different account.
    assert other_client.post("/api/leads", json=lead_payload).status_code == 201
    assert client.get(f"/api/leads/{mine['id']}").json()["status"] == "New"


def test_sample_data_fills_only_my_account(client, other_client):
    first = client.post("/api/leads/sample-data").json()
    again = client.post("/api/leads/sample-data").json()

    assert first["added"] == 70
    assert again["added"] == 0
    assert client.get("/api/leads/stats").json()["total"] == 70
    assert other_client.get("/api/leads/stats").json()["total"] == 0


def test_production_refuses_the_dev_secret():
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        Settings(environment="production", secret_key=DEV_SECRET_KEY).check_production_safety()
    Settings(environment="production", secret_key="x" * 40).check_production_safety()  # fine
    Settings(environment="development", secret_key="").check_production_safety()  # dev default ok
