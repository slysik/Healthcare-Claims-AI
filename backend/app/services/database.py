import logging
from pathlib import Path

import duckdb

logger = logging.getLogger(__name__)

class DatabaseManager:
    """DuckDB in-memory database manager."""

    def __init__(self):
        self.conn = duckdb.connect(":memory:")
        self._tables: dict[str, int] = {}  # table_name -> row_count

    def load_csv(self, path: str | Path, table_name: str = "claims") -> int:
        """Load CSV into DuckDB table. Returns row count."""
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"CSV not found: {path}")

        # DuckDB auto-detects CSV schema
        self.conn.execute(f"""
            CREATE OR REPLACE TABLE {table_name} AS
            SELECT * FROM read_csv_auto('{path}')
        """)
        count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        self._tables[table_name] = count
        logger.info(f"Loaded {count} rows from {path} into {table_name}")
        return count

    def load_parquet(self, path: str | Path, table_name: str = "claims") -> int:
        """Load Parquet file into DuckDB table. Returns row count."""
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Parquet not found: {path}")

        self.conn.execute(f"""
            CREATE OR REPLACE TABLE {table_name} AS
            SELECT * FROM read_parquet('{path}')
        """)
        count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        self._tables[table_name] = count
        logger.info(f"Loaded {count} rows from {path} into {table_name}")
        return count

    def execute_query(self, sql: str) -> list[dict]:
        """Execute SQL query and return results as list of dicts."""
        try:
            result = self.conn.execute(sql)
            columns = [desc[0] for desc in result.description]
            rows = result.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            raise RuntimeError(f"SQL execution error: {str(e)}") from e

    def get_schema(self) -> str:
        """Get CREATE TABLE statements for all loaded tables."""
        schemas = []
        for table_name in self._tables:
            try:
                result = self.conn.execute(f"DESCRIBE {table_name}").fetchall()
                cols = [f"  {row[0]} {row[1]}" for row in result]
                schema = f"CREATE TABLE {table_name} (\n" + ",\n".join(cols) + "\n);"
                schemas.append(schema)
            except Exception as e:
                logger.warning(f"Could not get schema for {table_name}: {e}")
        return "\n\n".join(schemas) if schemas else "No tables loaded."

    def get_sample_data(self, table_name: str = "claims", limit: int = 5) -> str:
        """Get sample rows formatted for prompt context."""
        try:
            result = self.conn.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
            columns = [desc[0] for desc in result.description]
            rows = result.fetchall()

            lines = [" | ".join(columns)]
            lines.append("-" * len(lines[0]))
            for row in rows:
                lines.append(" | ".join(str(v) for v in row))
            return "\n".join(lines)
        except Exception:
            return "No sample data available."

    def get_table_info(self) -> dict:
        """Get info about loaded tables."""
        return dict(self._tables)

    def is_ready(self) -> bool:
        """Check if any tables are loaded."""
        return len(self._tables) > 0


# Singleton instance
db_manager = DatabaseManager()
