"""Data, health, and config endpoints."""

from fastapi import APIRouter

from app.config import settings
from app.models.schemas import ConfigResponse, HealthResponse
from app.services.database import db_manager
from app.services.vectorstore import retriever_manager

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/health")
async def health():
    """Health check endpoint."""
    # Check DuckDB status
    duckdb_status = "ready" if db_manager.is_ready() else "no data loaded"

    # Check vectorstore status
    vectorstore_info = {
        "engine": retriever_manager.engine_name(),
        "document_count": retriever_manager.document_count(),
        "ready": retriever_manager.is_ready(),
    }

    # AWS status
    aws_enabled = settings.ENABLE_AWS

    return HealthResponse(
        status="healthy",
        duckdb=duckdb_status,
        vectorstore=vectorstore_info,
        llm_provider=settings.LLM_PROVIDER,
        aws_enabled=aws_enabled,
        demo_mode=settings.DEMO_MODE,
    )


@router.get("/config")
async def get_config():
    """Get configuration settings."""
    return ConfigResponse(
        llm_provider=settings.LLM_PROVIDER,
        anthropic_model_id=settings.ANTHROPIC_MODEL_ID,
        bedrock_model_id=settings.BEDROCK_MODEL_ID,
        rag_engine=settings.RAG_ENGINE,
        enable_aws=settings.ENABLE_AWS,
        demo_mode=settings.DEMO_MODE,
        sql_max_retries=settings.SQL_MAX_RETRIES,
    )


@router.get("/schema")
async def get_schema():
    """Get current DuckDB table schemas."""
    schema = db_manager.get_schema()
    return {"schema": schema}
