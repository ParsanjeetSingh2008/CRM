"""Request and response shapes for Clive, the AI assistant."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

MAX_MESSAGES = 30
MAX_MESSAGE_CHARS = 4000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)


class ChatRequest(BaseModel):
    """The conversation so far (the browser keeps it; the server is stateless)."""

    messages: list[ChatMessage] = Field(min_length=1, max_length=MAX_MESSAGES)
    tz_offset_minutes: int = Field(default=0, ge=-840, le=840)

    @model_validator(mode="after")
    def check_turn_order(self) -> "ChatRequest":
        if self.messages[0].role != "user" or self.messages[-1].role != "user":
            raise ValueError("The conversation must start and end with a user message.")
        for previous, current in zip(self.messages, self.messages[1:]):
            if previous.role == current.role:
                raise ValueError("Messages must alternate between user and assistant.")
        if not self.messages[-1].content.strip():
            raise ValueError("Ask Clive something first.")
        return self


class ChatReply(BaseModel):
    reply: str
    tools_used: list[str] = Field(description="Which lookups Clive ran, for transparency in the UI.")


class AssistantStatus(BaseModel):
    available: bool
    model: str
