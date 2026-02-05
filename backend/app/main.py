"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, data, upload
from app.services.database import db_manager
from app.services.vectorstore import retriever_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting BCBS Claims AI Backend")

    # Auto-load sample data
    data_dir = Path(settings.DATA_DIR)
    sample_csv = data_dir / "sample_claims.csv"
    sample_pdf = data_dir / "bcbs_benefits_summary.pdf"

    status_lines = []
    status_lines.append("=" * 60)
    status_lines.append("BCBS Claims AI - Startup Status")
    status_lines.append("=" * 60)

    # Load CSV if present
    if sample_csv.exists():
        try:
            row_count = db_manager.load_csv(sample_csv, "claims")
            status_lines.append(f"✓ Loaded {row_count} claims from {sample_csv.name}")
        except Exception as e:
            status_lines.append(f"✗ Failed to load CSV: {e}")
    else:
        status_lines.append(f"⊗ Sample CSV not found: {sample_csv}")

    # Ingest PDF if present
    if sample_pdf.exists():
        try:
            chunk_count = retriever_manager.ingest_pdf(
                sample_pdf, "bcbs_benefits_summary"
            )
            status_lines.append(
                f"✓ Ingested {chunk_count} chunks from {sample_pdf.name}"
            )
        except Exception as e:
            status_lines.append(f"✗ Failed to ingest PDF: {e}")
    else:
        status_lines.append(f"⊗ Sample PDF not found: {sample_pdf}")

    # Configuration summary
    status_lines.append("")
    status_lines.append("Configuration:")
    status_lines.append(f"  LLM Provider: {settings.LLM_PROVIDER}")
    status_lines.append(f"  RAG Engine: {settings.RAG_ENGINE}")
    status_lines.append(f"  Demo Mode: {settings.DEMO_MODE}")
    status_lines.append(f"  AWS Enabled: {settings.ENABLE_AWS}")

    # Database status
    status_lines.append("")
    status_lines.append("Database Status:")
    if db_manager.is_ready():
        tables = db_manager.get_table_info()
        for table_name, row_count in tables.items():
            status_lines.append(f"  ✓ {table_name}: {row_count} rows")
    else:
        status_lines.append("  ⊗ No tables loaded")

    # Vectorstore status
    status_lines.append("")
    status_lines.append("Vectorstore Status:")
    if retriever_manager.is_ready():
        docs = retriever_manager.list_documents()
        status_lines.append(
            f"  ✓ {len(docs)} document(s) ingested ({settings.RAG_ENGINE})"
        )
        for doc in docs:
            status_lines.append(f"    - {doc}")
    else:
        status_lines.append(f"  ⊗ No documents ingested ({settings.RAG_ENGINE})")

    status_lines.append("=" * 60)
    status_lines.append("Server ready at http://0.0.0.0:8000")
    status_lines.append("API docs: http://0.0.0.0:8000/docs")
    status_lines.append("=" * 60)

    # Print all status lines
    for line in status_lines:
        logger.info(line)

    yield

    logger.info("Shutting down BCBS Claims AI Backend")


# Create FastAPI app
app = FastAPI(
    title="BCBS Claims AI API",
    description="Healthcare claims analysis with NL2SQL and RAG",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ] if not settings.DEMO_MODE else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(chat.router)
app.include_router(upload.router)
app.include_router(data.router)


@app.get("/")
async def root():
    """API info endpoint."""
    return {
        "name": "BCBS Claims AI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/api/health",
    }
