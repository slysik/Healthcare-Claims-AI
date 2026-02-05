"""Pydantic request/response models."""

from __future__ import annotations

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Incoming chat request."""

    query: str
    conversation_id: str | None = None


class TraceEvent(BaseModel):
    """A single agent trace event."""

    node: str
    status: str  # "running" | "complete" | "error"
    result: dict | None = None
    timing_ms: float | None = None


class Citation(BaseModel):
    """A RAG source citation."""

    text: str
    page: int | None = None
    doc_name: str | None = None
    score: float | None = None


class AgentResponse(BaseModel):
    """Structured response from the synthesize node."""

    intent: str  # "nl2sql" | "rag" | "clarify"
    answer: str
    sql: str | None = None
    query_results: list[dict] | None = None
    chart_type: str | None = None  # "bar" | "line" | "pie" | None
    citations: list[Citation] | None = None
    agent_trace: list[TraceEvent] = []
    timing_ms: float | None = None
    sql_retries: int = 0


class ChatMessage(BaseModel):
    """A single chat message."""

    role: str  # "user" | "assistant"
    content: str
    response_data: AgentResponse | None = None
    timestamp: str | None = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    duckdb: str
    vectorstore: dict
    llm_provider: str
    aws_enabled: bool
    demo_mode: bool


class ConfigResponse(BaseModel):
    """Configuration response."""

    llm_provider: str
    anthropic_model_id: str
    bedrock_model_id: str
    rag_engine: str
    enable_aws: bool
    demo_mode: bool
    sql_max_retries: int


class UploadResponse(BaseModel):
    """Upload response."""

    filename: str
    status: str
    message: str
    rows: int | None = None
