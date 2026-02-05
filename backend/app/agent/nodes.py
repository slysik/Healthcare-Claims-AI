"""Agent node functions for LangGraph."""

import json
import re
import time
from typing import Any

from app.agent.llm import get_llm
from app.agent.prompts import (
    CLASSIFY_PROMPT,
    RAG_SYNTHESIS_PROMPT,
    SQL_FIX_PROMPT,
    SQL_GENERATION_PROMPT,
    SYNTHESIZE_PROMPT,
)
from app.agent.state import AgentState


def classify_intent(state: AgentState) -> dict[str, Any]:
    """Classify user intent as nl2sql, rag, or clarify."""
    start_time = time.time()

    try:
        llm = get_llm(streaming=False)

        # Get actual schema and documents from services
        from app.services.database import db_manager
        from app.services.vectorstore import retriever_manager

        schema = db_manager.get_schema() if db_manager.is_ready() else "No tables loaded."
        if retriever_manager.is_ready():
            documents = ", ".join(retriever_manager.list_documents())
        else:
            documents = "No documents loaded."

        prompt = CLASSIFY_PROMPT.format(
            schema=schema,
            documents=documents,
            query=state["query"],
        )

        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        # Parse JSON from response
        json_match = re.search(r"\{.*?\}", content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            intent = result.get("intent", "clarify")
        else:
            intent = "clarify"

        timing_ms = (time.time() - start_time) * 1000

        metadata = state.get("metadata", {})
        metadata["classify_timing_ms"] = timing_ms
        metadata["classify_reasoning"] = (
            result.get("reasoning") if json_match else None
        )

        return {"intent": intent, "metadata": metadata}

    except Exception as e:
        print(f"Error in classify_intent: {e}")
        return {"intent": "clarify", "metadata": state.get("metadata", {})}


def generate_sql(state: AgentState) -> dict[str, Any]:
    """Generate SQL query from natural language."""
    start_time = time.time()

    try:
        llm = get_llm(streaming=False)

        # Lazy import to avoid circular dependency
        from app.services.database import db_manager

        schema = db_manager.get_schema()
        sample_data = db_manager.get_sample_data(limit=5)

        prompt = SQL_GENERATION_PROMPT.format(
            schema=schema, sample_data=sample_data, query=state["query"]
        )

        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        # Extract SQL from markdown code blocks or raw text
        sql_match = re.search(
            r"```sql\s*(.*?)\s*```", content, re.DOTALL | re.IGNORECASE
        )
        if sql_match:
            sql = sql_match.group(1).strip()
        else:
            # Try to find SQL without code blocks
            sql = content.strip()

        timing_ms = (time.time() - start_time) * 1000

        metadata = state.get("metadata", {})
        metadata["sql_generation_timing_ms"] = timing_ms

        return {"sql": sql, "metadata": metadata}

    except Exception as e:
        print(f"Error in generate_sql: {e}")
        return {
            "sql": None,
            "sql_error": f"SQL generation failed: {e!s}",
            "metadata": state.get("metadata", {}),
        }


def execute_query(state: AgentState) -> dict[str, Any]:
    """Execute SQL query against DuckDB."""
    start_time = time.time()

    try:
        # Lazy import to avoid issues if service not ready
        from app.services.database import db_manager

        sql = state.get("sql")
        if not sql:
            return {"sql_error": "No SQL query to execute"}

        result = db_manager.execute_query(sql)

        timing_ms = (time.time() - start_time) * 1000

        metadata = state.get("metadata", {})
        metadata["execute_timing_ms"] = timing_ms

        return {
            "query_results": result,
            "sql_error": None,
            "metadata": metadata,
        }

    except Exception as e:
        error_msg = str(e)
        print(f"Error in execute_query: {error_msg}")

        retry_count = state.get("sql_retry_count", 0)

        return {
            "sql_error": error_msg,
            "sql_retry_count": retry_count + 1,
            "query_results": None,
            "metadata": state.get("metadata", {}),
        }


def fix_sql(state: AgentState) -> dict[str, Any]:
    """Fix SQL query based on error message."""
    start_time = time.time()

    try:
        llm = get_llm(streaming=False)

        # Lazy import
        from app.services.database import db_manager

        schema = db_manager.get_schema()

        prompt = SQL_FIX_PROMPT.format(
            sql=state.get("sql", ""),
            error=state.get("sql_error", ""),
            schema=schema,
        )

        response = llm.invoke(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        # Extract SQL from response
        sql_match = re.search(
            r"```sql\s*(.*?)\s*```", content, re.DOTALL | re.IGNORECASE
        )
        if sql_match:
            sql = sql_match.group(1).strip()
        else:
            sql = content.strip()

        timing_ms = (time.time() - start_time) * 1000

        metadata = state.get("metadata", {})
        metadata["sql_fix_timing_ms"] = timing_ms

        return {"sql": sql, "metadata": metadata}

    except Exception as e:
        print(f"Error in fix_sql: {e}")
        return {"sql": state.get("sql"), "metadata": state.get("metadata", {})}


def search_documents(state: AgentState) -> dict[str, Any]:
    """Search policy documents using RAG."""
    start_time = time.time()

    try:
        # Lazy import
        from app.services.vectorstore import retriever_manager

        results = retriever_manager.search(state["query"])

        timing_ms = (time.time() - start_time) * 1000

        metadata = state.get("metadata", {})
        metadata["search_timing_ms"] = timing_ms

        return {"rag_chunks": results, "metadata": metadata}

    except Exception as e:
        print(f"Error in search_documents: {e}")
        return {"rag_chunks": [], "metadata": state.get("metadata", {})}


def synthesize_answer(state: AgentState) -> dict[str, Any]:
    """Synthesize final answer based on gathered information."""
    start_time = time.time()

    try:
        llm = get_llm(streaming=False)

        intent = state.get("intent", "clarify")
        query = state["query"]

        # Build context based on intent
        if intent == "nl2sql":
            results = state.get("query_results", [])
            sql = state.get("sql", "")

            if results:
                context = f"""SQL Query:
{sql}

Query Results:
{json.dumps(results, indent=2)}
"""
            else:
                context = "No data was retrieved. The query may have failed."

        elif intent == "rag":
            chunks = state.get("rag_chunks", [])
            if chunks:
                context_parts = []
                for i, chunk in enumerate(chunks, 1):
                    page = chunk.get("page", "unknown")
                    text = chunk.get("text", "")
                    context_parts.append(f"[{i}] (Page {page}):\n{text}")
                context = "\n\n".join(context_parts)
            else:
                context = "No relevant documents found."

        else:
            context = "This question requires clarification."

        # Use appropriate prompt
        if intent == "rag":
            prompt = RAG_SYNTHESIS_PROMPT.format(query=query, context=context)
        else:
            prompt = SYNTHESIZE_PROMPT.format(
                query=query, intent=intent, context=context
            )

        response = llm.invoke(prompt)
        answer = response.content if hasattr(response, "content") else str(response)

        timing_ms = (time.time() - start_time) * 1000

        metadata = state.get("metadata", {})
        metadata["synthesize_timing_ms"] = timing_ms

        # Determine chart type for nl2sql results
        chart_type = None
        if intent == "nl2sql" and state.get("query_results"):
            results = state["query_results"]
            if results and len(results) > 0:
                first_row = results[0]
                keys = list(first_row.keys())

                # Simple heuristics for chart type
                if any(
                    word in query.lower()
                    for word in ["over time", "trend", "monthly", "yearly"]
                ):
                    chart_type = "line"
                elif any(word in query.lower() for word in ["percentage", "proportion"]):
                    chart_type = "pie"
                elif len(keys) >= 2:
                    chart_type = "bar"

        # Build citations for RAG
        citations = None
        if intent == "rag" and state.get("rag_chunks"):
            citations = [
                {
                    "text": chunk.get("text", "")[:200],
                    "page": chunk.get("page"),
                    "doc_name": chunk.get("doc_name"),
                    "score": chunk.get("score"),
                }
                for chunk in state["rag_chunks"]
            ]

        return {
            "answer": answer,
            "chart_type": chart_type,
            "citations": citations,
            "metadata": metadata,
        }

    except Exception as e:
        print(f"Error in synthesize_answer: {e}")
        return {
            "answer": "I encountered an error while processing your request.",
            "metadata": state.get("metadata", {}),
        }
