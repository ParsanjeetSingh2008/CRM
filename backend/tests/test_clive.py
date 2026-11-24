"""Clive tests. The Groq API is replaced by a fake, so these are free and offline.

(scripts/clive_live_check.py runs real questions against Groq when a key is set.)
"""

import json
from types import SimpleNamespace

import groq
import httpx
import pytest
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.user import User
from app.services import clive


# ---------- the tools Clive can call ----------


@pytest.fixture
def tools(client, create_lead):
    create_lead(email="a@example.org", name="Priya Nair", business_name="GreenLeaf Cafe", notes="Wants a demo.")
    create_lead(email="b@example.org", name="Rohan Mehta", business_name="UrbanFit Gym", status="Converted")
    with SessionLocal() as db:
        owner = db.scalar(select(User).where(User.email == "owner@example.org"))
        yield {tool.name: tool for tool in clive.build_tools(db, owner.id)}


def test_tool_schemas_are_valid_for_groq(tools):
    assert set(tools) == {"get_pipeline_summary", "search_leads", "get_lead_details", "get_lead_trends"}
    for tool in tools.values():
        schema = tool.schema()
        assert schema["type"] == "function"
        assert schema["function"]["parameters"]["type"] == "object"
        json.dumps(schema)  # serialisable
    search = tools["search_leads"].schema()["function"]["parameters"]["properties"]
    assert search["status"]["enum"] == ["New", "Contacted", "Converted"]


def test_pipeline_summary_tool(tools):
    data = json.loads(tools["get_pipeline_summary"].run({}))
    assert data["total"] == 2 and data["converted"] == 1 and data["conversion_rate"] == 50.0


def test_search_tool(tools):
    data = json.loads(tools["search_leads"].run({"query": "priya"}))
    assert data["total_matches"] == 1
    assert data["leads"][0]["business"] == "GreenLeaf Cafe"
    assert data["leads"][0]["notes_preview"] == "Wants a demo."

    converted = json.loads(tools["search_leads"].run({"status": "Converted"}))
    assert [lead["name"] for lead in converted["leads"]] == ["Rohan Mehta"]


@pytest.mark.parametrize(
    ("args", "message"),
    [({"status": "Won"}, "Unknown status"), ({"sort": "random"}, "Unknown sort"), ({"limit": "lots"}, "whole number")],
)
def test_search_tool_rejects_bad_arguments(tools, args, message):
    with pytest.raises(clive.ToolError, match=message):
        tools["search_leads"].run(args)


def test_lead_details_tool_only_sees_own_leads(tools, other_client):
    other = other_client.post(
        "/api/leads",
        json={"name": "Secret Lead", "email": "s@example.org", "phone": "9876543210", "business_name": "Hidden Co"},
    ).json()
    with pytest.raises(clive.ToolError, match="No lead with id"):
        tools["get_lead_details"].run({"lead_id": other["id"]})


def test_trends_tool(tools):
    data = json.loads(tools["get_lead_trends"].run({"days": 7}))
    assert data["leads_created"] == 2
    assert sum(week["leads"] for week in data["weekly_totals"]) == 2


# ---------- a fake Groq client ----------


def reply(text, finish="stop"):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=text, tool_calls=None), finish_reason=finish)]
    )


def tool_call(name, arguments="{}", call_id="call_1"):
    call = SimpleNamespace(id=call_id, type="function", function=SimpleNamespace(name=name, arguments=arguments))
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=None, tool_calls=[call]), finish_reason="tool_calls")]
    )


def bad_request(text):
    request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    return groq.BadRequestError(text, response=httpx.Response(400, request=request), body=None)


@pytest.fixture
def fake_groq(monkeypatch):
    """install([responses or exceptions...]) -> list of the kwargs each call received."""
    calls = []

    def install(script):
        script = list(script)

        def create(**kwargs):
            calls.append({**kwargs, "messages": [dict(m) for m in kwargs["messages"]]})
            item = script.pop(0) if len(script) > 1 else script[0]
            if isinstance(item, Exception):
                raise item
            return item

        fake = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
        monkeypatch.setattr(clive, "_client", lambda: fake)
        monkeypatch.setattr(clive, "assistant_configured", lambda: True)
        return calls

    return install


def ask(client, *contents, tz=330):
    roles = ["user", "assistant"]
    messages = [{"role": roles[i % 2], "content": c} for i, c in enumerate(contents)]
    return client.post("/api/clive/chat", json={"messages": messages, "tz_offset_minutes": tz})


# ---------- the /api/clive endpoints ----------


def test_status_reports_missing_key(client):
    assert client.get("/api/clive/status").json() == {"available": False, "model": "openai/gpt-oss-120b"}


def test_chat_without_key_explains_setup(client):
    response = ask(client, "How many leads do I have?")
    assert response.status_code == 503
    error = response.json()["error"]
    assert error["code"] == "ASSISTANT_UNAVAILABLE"
    assert "GROQ_API_KEY" in error["message"]


def test_chat_runs_tools_against_the_database(client, create_lead, fake_groq):
    create_lead(email="p@example.org", name="Priya Nair", business_name="GreenLeaf Cafe")
    calls = fake_groq([tool_call("search_leads", '{"query": "priya"}'), reply("**Priya Nair** runs GreenLeaf Cafe.")])

    response = ask(client, "Hi", "Hello! How can I help?", "Who is Priya?")

    assert response.status_code == 200
    assert response.json() == {"reply": "**Priya Nair** runs GreenLeaf Cafe.", "tools_used": ["search_leads"]}

    first, second = calls
    assert first["model"] == "openai/gpt-oss-120b"
    assert first["reasoning_effort"] == "medium" and first["tool_choice"] == "auto"
    assert len(first["tools"]) == 4
    assert first["messages"][0]["role"] == "system" and "Olivia Owner" in first["messages"][0]["content"]
    assert [m["role"] for m in first["messages"][1:]] == ["user", "assistant", "user"]

    # The second call carries the model's tool request and the real database result.
    assistant, tool_result = second["messages"][-2:]
    assert assistant["tool_calls"][0]["function"]["name"] == "search_leads"
    assert tool_result["role"] == "tool" and tool_result["tool_call_id"] == "call_1"
    assert json.loads(tool_result["content"])["leads"][0]["business"] == "GreenLeaf Cafe"


def test_bad_tool_arguments_go_back_to_the_model(client, fake_groq):
    calls = fake_groq([tool_call("search_leads", "{not json"), reply("Sorry, let me try that differently.")])
    assert ask(client, "Find leads").status_code == 200
    error = json.loads(calls[1]["messages"][-1]["content"])
    assert error["is_error"] is True and "JSON" in error["error"]


def test_unknown_tool_name_is_reported_not_crashed(client, fake_groq):
    calls = fake_groq([tool_call("delete_everything"), reply("I can only read your leads.")])
    assert ask(client, "Delete all").json()["reply"] == "I can only read your leads."
    assert "Unknown tool" in json.loads(calls[1]["messages"][-1]["content"])["error"]


def test_malformed_tool_call_from_groq_is_retried(client, fake_groq):
    calls = fake_groq([bad_request("tool_use_failed: failed_generation"), reply("You have no leads yet.")])
    assert ask(client, "Summary?").json()["reply"] == "You have no leads yet."
    assert len(calls) == 2


def test_tool_rounds_are_capped(client, fake_groq):
    calls = fake_groq([tool_call("get_pipeline_summary")])  # the model never stops calling tools
    body = ask(client, "Loop forever").json()
    assert "more lookups than I'm allowed" in body["reply"]
    assert len(calls) == clive.MAX_TOOL_ROUNDS + 1


def test_cut_off_answer_is_flagged(client, fake_groq):
    fake_groq([reply("You have many lea", finish="length")])
    assert "cut short" in ask(client, "Summary?").json()["reply"]


def test_network_error_is_a_clean_503(client, fake_groq):
    fake_groq([groq.APIConnectionError(request=httpx.Request("POST", "https://api.groq.com"))])
    response = ask(client, "Hello?")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ASSISTANT_UNAVAILABLE"


@pytest.mark.parametrize(
    "messages",
    [
        [{"role": "assistant", "content": "Hi"}],
        [{"role": "user", "content": "A"}, {"role": "user", "content": "B"}],
        [{"role": "user", "content": "A"}, {"role": "assistant", "content": "B"}],
        [{"role": "user", "content": "x" * 4001}],
        [],
    ],
)
def test_chat_validates_conversation(client, fake_groq, messages):
    fake_groq([reply("ok")])
    assert client.post("/api/clive/chat", json={"messages": messages}).status_code == 422


def test_chat_is_rate_limited_per_user(client, fake_groq):
    fake_groq([reply("ok")])
    statuses = [ask(client, "Hi").status_code for _ in range(31)]
    assert statuses[:30] == [200] * 30
    assert statuses[30] == 429
