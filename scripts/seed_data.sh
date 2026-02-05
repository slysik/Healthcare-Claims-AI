#!/bin/bash
# Generate and load sample data
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="${PROJECT_DIR}/data"

echo "=== Seeding Demo Data ==="

# Generate claims CSV if not exists
if [ ! -f "${DATA_DIR}/sample_claims.csv" ]; then
    echo "Generating synthetic claims data..."
    cd "${PROJECT_DIR}/backend"
    uv run python "${DATA_DIR}/generate_claims.py"
    echo "Generated: ${DATA_DIR}/sample_claims.csv"
else
    echo "Claims data already exists: ${DATA_DIR}/sample_claims.csv"
fi

# Generate benefits PDF if not exists
if [ ! -f "${DATA_DIR}/bcbs_benefits_summary.pdf" ]; then
    echo "Generating benefits PDF..."
    cd "${PROJECT_DIR}/backend"
    uv run python "${DATA_DIR}/generate_benefits_pdf.py"
    echo "Generated: ${DATA_DIR}/bcbs_benefits_summary.pdf"
else
    echo "Benefits PDF already exists: ${DATA_DIR}/bcbs_benefits_summary.pdf"
fi

echo ""
echo "=== Data Ready ==="
ls -lh "${DATA_DIR}"/sample_claims.csv "${DATA_DIR}"/bcbs_benefits_summary.pdf
