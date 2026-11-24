import pytest


def field_errors(response) -> dict[str, str]:
    assert response.status_code == 422, response.text
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    return {item["field"]: item["message"] for item in error["details"]}


@pytest.mark.parametrize("email", ["not-an-email", "a@", "@b.com", "a b@c.com", ""])
def test_invalid_email(client, lead_payload, email):
    errors = field_errors(client.post("/api/leads", json={**lead_payload, "email": email}))
    assert errors["email"] == "Enter a valid email address."


@pytest.mark.parametrize(
    ("phone", "expected"),
    [
        ("12345", "between 7 and 15 digits"),
        ("1234567890123456", "between 7 and 15 digits"),
        ("98765abcde", "can only contain"),
        ("+91-98765@43210", "can only contain"),
    ],
)
def test_invalid_phone(client, lead_payload, phone, expected):
    errors = field_errors(client.post("/api/leads", json={**lead_payload, "phone": phone}))
    assert expected in errors["phone"]


@pytest.mark.parametrize("phone", ["9876543210", "+91 98765 43210", "(022) 1234-5678", "+1.415.555.0100"])
def test_valid_phone_formats(client, lead_payload, phone):
    assert client.post("/api/leads", json={**lead_payload, "phone": phone}).status_code == 201


def test_missing_fields(client):
    errors = field_errors(client.post("/api/leads", json={}))

    for field in ("name", "email", "phone", "business_name"):
        assert errors[field] == "This field is required."


def test_whitespace_only_name_is_rejected(client, lead_payload):
    errors = field_errors(client.post("/api/leads", json={**lead_payload, "name": "    "}))
    assert "at least 2 characters" in errors["name"]


def test_too_long_fields(client, lead_payload):
    payload = {**lead_payload, "name": "x" * 101, "notes": "y" * 1001}
    errors = field_errors(client.post("/api/leads", json=payload))

    assert errors["name"] == "Must be at most 100 characters."
    assert errors["notes"] == "Must be at most 1000 characters."


def test_invalid_status_on_create(client, lead_payload):
    errors = field_errors(client.post("/api/leads", json={**lead_payload, "status": "Won"}))
    assert "New" in errors["status"] and "Converted" in errors["status"]


def test_invalid_status_on_patch(client, create_lead):
    lead = create_lead()
    errors = field_errors(client.patch(f"/api/leads/{lead['id']}/status", json={"status": "done"}))
    assert "status" in errors


def test_put_requires_status(client, create_lead, lead_payload):
    lead = create_lead()
    errors = field_errors(client.put(f"/api/leads/{lead['id']}", json=lead_payload))
    assert errors["status"] == "This field is required."


def test_invalid_id_in_path(client):
    assert client.get("/api/leads/0").status_code == 422
    assert client.get("/api/leads/abc").status_code == 422


def test_malformed_json(client):
    response = client.post(
        "/api/leads", content="{not json", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422
