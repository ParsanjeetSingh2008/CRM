from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.lead import Lead
from app.models.types import utcnow


def set_created_at(lead_id: int, created_at: datetime) -> None:
    with SessionLocal() as db:
        db.get(Lead, lead_id).created_at = created_at
        db.commit()


def test_analytics_shape_when_empty(client):
    body = client.get("/api/leads/analytics").json()

    assert body["range_days"] == 30
    assert body["total"] == 0
    assert len(body["timeline"]) == 30
    assert body["timeline"][-1]["date"] == body["end_date"]
    assert [s["status"] for s in body["status_breakdown"]] == ["New", "Contacted", "Converted"]
    assert len(body["heatmap"]["values"]) == 7
    assert all(len(row) == 8 for row in body["heatmap"]["values"])
    assert body["heatmap"]["max"] == 0


def test_analytics_counts_leads_in_range(client, create_lead):
    create_lead(email="a@example.org")
    create_lead(email="b@example.org", status="Converted")
    old = create_lead(email="old@example.org")
    set_created_at(old["id"], utcnow() - timedelta(days=60))

    body = client.get("/api/leads/analytics", params={"days": 30}).json()

    assert body["total"] == 2
    assert body["timeline"][-1]["total"] == 2
    counts = {s["status"]: s["count"] for s in body["status_breakdown"]}
    assert counts == {"New": 1, "Contacted": 0, "Converted": 1}

    wider = client.get("/api/leads/analytics", params={"days": 90}).json()
    assert wider["total"] == 3
    assert len(wider["timeline"]) == 90


def test_heatmap_uses_viewer_timezone(client, create_lead):
    lead = create_lead()
    # Monday 2026-11-23 20:00 UTC == Tuesday 01:30 in India (UTC+5:30).
    monday_evening_utc = datetime(2026, 11, 23, 20, 0, tzinfo=timezone.utc)
    set_created_at(lead["id"], monday_evening_utc)

    utc_view = client.get("/api/leads/analytics", params={"days": 365}).json()["heatmap"]
    ist_view = client.get(
        "/api/leads/analytics", params={"days": 365, "tz_offset_minutes": 330}
    ).json()["heatmap"]

    assert utc_view["values"][0][6] == 1  # Mon, 6–9pm slot
    assert ist_view["values"][1][0] == 1  # Tue, 12–3am slot
    assert ist_view["max"] == 1


def test_analytics_validates_params(client):
    assert client.get("/api/leads/analytics", params={"days": 3}).status_code == 422
    assert client.get("/api/leads/analytics", params={"days": 1000}).status_code == 422
    assert client.get("/api/leads/analytics", params={"tz_offset_minutes": 2000}).status_code == 422


def test_seed_data_is_valid_and_deterministic():
    from app.services.sample_data import build_sample_leads
    from app.schemas.lead import LeadCreate

    now = utcnow()
    first, second = build_sample_leads(now), build_sample_leads(now)

    assert first == second
    assert len({lead["email"] for lead in first}) == len(first) == 70
    for lead in first:
        LeadCreate(**{k: v for k, v in lead.items() if k != "created_at"})  # passes API validation
        assert lead["created_at"] <= now
