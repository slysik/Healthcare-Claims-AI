import logging
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

class StorageManager:
    """Manages data file storage. Local-first, S3 optional."""

    def __init__(self):
        self.data_dir = Path(settings.DATA_DIR)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def csv_to_parquet(self, csv_path: str | Path) -> Path:
        """Convert CSV to Parquet using DuckDB native (no pandas/pyarrow)."""
        import duckdb

        csv_path = Path(csv_path)
        parquet_path = csv_path.with_suffix(".parquet")

        conn = duckdb.connect(":memory:")
        conn.execute(f"""
            COPY (SELECT * FROM read_csv_auto('{csv_path}'))
            TO '{parquet_path}' (FORMAT PARQUET)
        """)
        conn.close()

        logger.info(f"Converted {csv_path} → {parquet_path}")

        # Optionally upload to S3
        if self.is_s3_enabled():
            self.upload_to_s3(parquet_path)

        return parquet_path

    def is_s3_enabled(self) -> bool:
        """Check if S3 is enabled and configured."""
        return settings.ENABLE_AWS and bool(settings.S3_BUCKET)

    def upload_to_s3(self, local_path: Path) -> str | None:
        """Upload file to S3. Returns S3 URI or None."""
        if not self.is_s3_enabled():
            return None

        try:
            import boto3
        except ImportError:
            logger.warning("boto3 not installed. Install with: pip install '.[aws]'")
            return None

        try:
            s3 = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
            )
            key = f"data/{local_path.name}"
            s3.upload_file(str(local_path), settings.S3_BUCKET, key)
            uri = f"s3://{settings.S3_BUCKET}/{key}"
            logger.info(f"Uploaded {local_path} → {uri}")
            return uri
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            return None

    def list_datasets(self) -> list[dict]:
        """List available data files (CSV and Parquet)."""
        files = []
        for ext in ("*.csv", "*.parquet"):
            for f in self.data_dir.glob(ext):
                files.append({
                    "name": f.name,
                    "path": str(f),
                    "size_bytes": f.stat().st_size,
                    "type": f.suffix[1:],  # "csv" or "parquet"
                })
        return sorted(files, key=lambda x: x["name"])


# Singleton instance
storage_manager = StorageManager()
