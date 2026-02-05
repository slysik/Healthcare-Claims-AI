#!/bin/bash
# Start the BCBS Claims AI demo (backend + frontend)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== BCBS Claims AI Demo ==="
echo "Project: ${PROJECT_DIR}"

# Check for .env file
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    echo "No .env file found. Copying from env.template..."
    cp "${PROJECT_DIR}/env.template" "${PROJECT_DIR}/.env"
    echo "Please edit ${PROJECT_DIR}/.env with your ANTHROPIC_API_KEY"
    echo "Then re-run this script."
    exit 1
fi

# Start backend
echo ""
echo "--- Starting Backend (port 8000) ---"
cd "${PROJECT_DIR}/backend"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "Backend is ready!"
        break
    fi
    sleep 1
done

# Start frontend
echo ""
echo "--- Starting Frontend (port 5173) ---"
cd "${PROJECT_DIR}/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Demo Running ==="
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
