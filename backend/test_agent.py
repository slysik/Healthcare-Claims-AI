"""Test agent query to debug SQL generation issues."""

from app.services.database import db_manager

# Load data
db_manager.load_parquet(
    "../data/HealthClaimsList_Feb24-Feb26.parquet", "HealthClaimsList_Feb24_Feb26"
)

# Run agent
from app.agent.graph import run_agent

queries = [
    "When was my last urologist visit?",
    "Show all denied claims",
    "How much have I spent on healthcare in 2025?",
]
for q in queries:
    print(f"\n{'=' * 60}")
    print(f"Query: {q}")
    print("=" * 60)
    result = run_agent(q)
    print(f"Intent: {result.get('intent')}")
    print(f"SQL: {result.get('sql')}")
    print(f"Error: {result.get('sql_error')}")
    print(f"Results: {result.get('query_results')}")
    print(f"Answer: {result.get('answer', '')[:300]}")
