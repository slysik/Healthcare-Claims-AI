"""Agent state definition for LangGraph."""

from typing import Literal, TypedDict


class AgentState(TypedDict, total=False):
    """State maintained throughout the agent execution."""

    query: str
    intent: Literal["nl2sql", "rag", "clarify"]
    sql: str | None
    sql_error: str | None
    sql_retry_count: int
    query_results: list[dict] | None
    rag_chunks: list[dict] | None
    answer: str
    chart_type: str | None  # "bar", "line", "pie", or None
    citations: list[dict] | None
    metadata: dict
    conversation_history: list[dict]
