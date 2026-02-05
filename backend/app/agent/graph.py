"""LangGraph state graph for BCBS Claims AI agent."""

from langgraph.graph import END, StateGraph

from app.agent.nodes import (
    classify_intent,
    execute_query,
    fix_sql,
    generate_sql,
    search_documents,
    synthesize_answer,
)
from app.agent.state import AgentState
from app.config import settings


def route_by_intent(state: AgentState) -> str:
    """Route to appropriate node based on classified intent."""
    intent = state.get("intent", "clarify")

    if intent == "nl2sql":
        return "generate_sql"
    elif intent == "rag":
        return "search_documents"
    else:
        return "synthesize"


def route_after_execute(state: AgentState) -> str:
    """Route after SQL execution based on success/failure."""
    if state.get("sql_error"):
        retry_count = state.get("sql_retry_count", 0)
        if retry_count < settings.SQL_MAX_RETRIES:
            return "fix_sql"

    return "synthesize"


# Build the state graph
graph = StateGraph(AgentState)

# Add all nodes
graph.add_node("classify", classify_intent)
graph.add_node("generate_sql", generate_sql)
graph.add_node("execute_query", execute_query)
graph.add_node("fix_sql", fix_sql)
graph.add_node("search_documents", search_documents)
graph.add_node("synthesize", synthesize_answer)

# Set entry point
graph.set_entry_point("classify")

# Add conditional edge after classification
graph.add_conditional_edges(
    "classify",
    route_by_intent,
    {
        "generate_sql": "generate_sql",
        "search_documents": "search_documents",
        "synthesize": "synthesize",
    },
)

# NL2SQL path: generate → execute
graph.add_edge("generate_sql", "execute_query")

# After execution: either fix or synthesize
graph.add_conditional_edges(
    "execute_query",
    route_after_execute,
    {"fix_sql": "fix_sql", "synthesize": "synthesize"},
)

# After fix: retry execution
graph.add_edge("fix_sql", "execute_query")

# RAG path: search → synthesize
graph.add_edge("search_documents", "synthesize")

# Final step: synthesize → END
graph.add_edge("synthesize", END)

# Compile the graph
agent = graph.compile()


def run_agent(
    query: str, conversation_history: list[dict] | None = None
) -> AgentState:
    """
    Run the agent on a user query.

    Args:
        query: User's question
        conversation_history: Optional conversation history

    Returns:
        Final agent state with answer and metadata
    """
    initial_state: AgentState = {
        "query": query,
        "metadata": {},
        "conversation_history": conversation_history or [],
        "sql_retry_count": 0,
    }

    final_state = agent.invoke(initial_state)
    return final_state
