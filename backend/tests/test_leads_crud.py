def test_create_lead_defaults_to_new(client, lead_payload):
    response = client.post("/api/leads", json=lead_payload)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] >= 1
    assert body["status"] == "New"
    assert body["notes"] is None
    assert body["created_at"].endswith(("Z", "+00:00"))
    for field in ("name", "email", "phone", "business_name"):
        assert body[field] == lead_payload[field]


def test_create_normalises_input(client, lead_payload):
    payload = {**lead_payload, "name": "  Aarav   Sharma ", "email": "  Aarav@BrightPixel.IN "}
    body = client.post("/api/leads", json=payload).json()

    assert body["name"] == "Aarav Sharma"
    assert body["email"] == "aarav@brightpixel.in"


def test_create_with_explicit_status_and_notes(client, lead_payload):
    payload = {**lead_payload, "status": "Contacted", "notes": "Asked for pricing."}
    body = client.post("/api/leads", json=payload).json()

    assert body["status"] == "Contacted"
    assert body["notes"] == "Asked for pricing."


def test_get_lead(client, create_lead):
    lead = create_lead()
    response = client.get(f"/api/leads/{lead['id']}")

    assert response.status_code == 200
    assert response.json() == lead


def test_get_missing_lead_returns_uniform_404(client):
    response = client.get("/api/leads/999")

    assert response.status_code == 404
    error = response.json()["error"]
    assert error["code"] == "NOT_FOUND"
    assert "999" in error["message"]


def test_update_lead(client, create_lead, lead_payload):
    lead = create_lead()
    update = {**lead_payload, "name": "Aarav S.", "phone": "022-1234-5678", "status": "Converted"}

    response = client.put(f"/api/leads/{lead['id']}", json=update)

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Aarav S."
    assert body["phone"] == "022-1234-5678"
    assert body["status"] == "Converted"
    assert body["updated_at"] >= lead["updated_at"]


def test_update_keeping_own_email_is_allowed(client, create_lead, lead_payload):
    lead = create_lead()
    response = client.put(f"/api/leads/{lead['id']}", json={**lead_payload, "status": "New"})
    assert response.status_code == 200


def test_update_missing_lead(client, lead_payload):
    response = client.put("/api/leads/42", json={**lead_payload, "status": "New"})
    assert response.status_code == 404


def test_update_status(client, create_lead):
    lead = create_lead()
    response = client.patch(f"/api/leads/{lead['id']}/status", json={"status": "Contacted"})

    assert response.status_code == 200
    assert response.json()["status"] == "Contacted"
    assert client.get(f"/api/leads/{lead['id']}").json()["status"] == "Contacted"


def test_delete_lead(client, create_lead):
    lead = create_lead()

    response = client.delete(f"/api/leads/{lead['id']}")
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/api/leads/{lead['id']}").status_code == 404


def test_delete_missing_lead(client):
    assert client.delete("/api/leads/7").status_code == 404


def test_duplicate_email_on_create_is_case_insensitive(client, create_lead):
    create_lead(email="dup@example.org")
    response = client.post(
        "/api/leads",
        json={"name": "Other", "email": "DUP@example.org", "phone": "9876543210", "business_name": "Other Co"},
    )

    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == "DUPLICATE_EMAIL"
    assert error["details"][0]["field"] == "email"


def test_duplicate_email_on_update(client, create_lead, lead_payload):
    create_lead(email="first@example.org")
    second = create_lead(email="second@example.org")

    response = client.put(
        f"/api/leads/{second['id']}",
        json={**lead_payload, "email": "first@example.org", "status": "New"},
    )
    assert response.status_code == 409


def test_stats(client, create_lead):
    create_lead(email="a@example.org")
    create_lead(email="b@example.org", status="Contacted")
    create_lead(email="c@example.org", status="Converted")
    create_lead(email="d@example.org", status="Converted")

    stats = client.get("/api/leads/stats").json()

    assert stats == {"total": 4, "new": 1, "contacted": 1, "converted": 2, "conversion_rate": 50.0}


def test_stats_when_empty(client):
    stats = client.get("/api/leads/stats").json()
    assert stats == {"total": 0, "new": 0, "contacted": 0, "converted": 0, "conversion_rate": 0.0}
