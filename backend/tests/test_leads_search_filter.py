import pytest


@pytest.fixture
def seeded(create_lead):
    create_lead(name="Priya Nair", email="priya@greenleaf.in", status="New")
    create_lead(name="Rohan Mehta", email="rohan@urbanfit.co", status="Contacted")
    create_lead(name="Meera Kapoor", email="meera@bloom.com", status="Converted")
    create_lead(name="Priyanka Das", email="pd@studio.in", status="Converted")


def names(response) -> list[str]:
    return [item["name"] for item in response.json()["items"]]


def test_list_returns_newest_first(client, seeded):
    response = client.get("/api/leads")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 4
    assert body["page"] == 1
    assert body["pages"] == 1
    assert names(response)[0] == "Priyanka Das"


def test_empty_list(client):
    body = client.get("/api/leads").json()
    assert body == {"items": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}


def test_search_by_name_is_case_insensitive_and_partial(client, seeded):
    response = client.get("/api/leads", params={"search": "PRIYA"})
    assert sorted(names(response)) == ["Priya Nair", "Priyanka Das"]


def test_search_by_email(client, seeded):
    response = client.get("/api/leads", params={"search": "urbanfit"})
    assert names(response) == ["Rohan Mehta"]


def test_search_with_no_match(client, seeded):
    body = client.get("/api/leads", params={"search": "zzz"}).json()
    assert body["items"] == [] and body["total"] == 0


def test_search_treats_wildcards_literally(client, seeded):
    assert client.get("/api/leads", params={"search": "%"}).json()["total"] == 0
    assert client.get("/api/leads", params={"search": "_"}).json()["total"] == 0


def test_filter_by_status(client, seeded):
    response = client.get("/api/leads", params={"status": "Converted"})
    assert sorted(names(response)) == ["Meera Kapoor", "Priyanka Das"]


def test_search_and_filter_combined(client, seeded):
    response = client.get("/api/leads", params={"search": "priya", "status": "Converted"})
    assert names(response) == ["Priyanka Das"]


def test_invalid_status_filter(client):
    response = client.get("/api/leads", params={"status": "Lost"})

    assert response.status_code == 422
    assert response.json()["error"]["details"][0]["field"] == "status"


def test_pagination(client, seeded):
    first = client.get("/api/leads", params={"page": 1, "page_size": 3}).json()
    second = client.get("/api/leads", params={"page": 2, "page_size": 3}).json()

    assert first["pages"] == 2 and len(first["items"]) == 3
    assert len(second["items"]) == 1
    assert not {i["id"] for i in first["items"]} & {i["id"] for i in second["items"]}


def test_sort_by_name(client, seeded):
    asc = names(client.get("/api/leads", params={"sort": "name_asc"}))
    desc = names(client.get("/api/leads", params={"sort": "name_desc"}))

    assert asc == sorted(asc)
    assert desc == list(reversed(asc))


def test_invalid_pagination_params(client):
    assert client.get("/api/leads", params={"page": 0}).status_code == 422
    assert client.get("/api/leads", params={"page_size": 500}).status_code == 422
