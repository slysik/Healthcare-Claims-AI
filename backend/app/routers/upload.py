"""File upload endpoints."""

import logging
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import UploadResponse
from app.services.database import db_manager
from app.services.storage import storage_manager
from app.services.vectorstore import retriever_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and load CSV file into DuckDB."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Save to data directory
        data_dir = Path(settings.DATA_DIR)
        data_dir.mkdir(parents=True, exist_ok=True)
        csv_path = data_dir / file.filename

        with csv_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"Saved CSV: {csv_path}")

        # Convert to parquet
        parquet_path = storage_manager.csv_to_parquet(csv_path)

        # Load into DuckDB (sanitize table name for SQL)
        import re
        table_name = re.sub(r"[^a-zA-Z0-9_]", "_", csv_path.stem)
        row_count = db_manager.load_parquet(parquet_path, table_name)

        return UploadResponse(
            filename=file.filename,
            status="success",
            message=f"Loaded {row_count} rows into table '{table_name}'",
            rows=row_count,
        )

    except Exception as e:
        logger.error(f"CSV upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and ingest PDF file into RAG engine."""
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        # Ingest into RAG
        doc_name = file.filename
        chunk_count = retriever_manager.ingest_pdf(tmp_path, doc_name)

        # Save to data directory
        data_dir = Path(settings.DATA_DIR)
        data_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = data_dir / file.filename
        shutil.move(str(tmp_path), str(pdf_path))

        logger.info(f"Saved and ingested PDF: {pdf_path}")

        return UploadResponse(
            filename=file.filename,
            status="success",
            message=f"Ingested {chunk_count} chunks from '{doc_name}'",
            rows=chunk_count,
        )

    except Exception as e:
        logger.error(f"PDF upload failed: {e}", exc_info=True)
        if tmp_path.exists():
            tmp_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets")
async def list_datasets():
    """List loaded datasets (from storage manager and DuckDB)."""
    files = storage_manager.list_datasets()
    tables = db_manager.get_table_info()

    return {
        "files": files,
        "tables": [
            {"name": name, "row_count": count} for name, count in tables.items()
        ],
    }


@router.get("/documents")
async def list_documents():
    """List ingested PDFs (from retriever manager)."""
    docs = retriever_manager.list_documents()
    doc_count = retriever_manager.document_count()

    return {
        "documents": docs,
        "total": doc_count,
        "engine": retriever_manager.engine_name(),
    }
