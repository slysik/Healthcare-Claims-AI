# Healthcare Claims AI — Sample Agentic Workflow for Claims & Benefits Automation

A working reference implementation showing how a healthcare operations or analytics team can use an AI agent to answer claims and benefits questions on its own—without writing SQL or searching policy PDFs by hand.

Ask a question in plain English. A LangGraph agent decides whether it is a **data question** (routes to NL2SQL over claims data, with automatic SQL self-correction) or a **policy question** (routes to retrieval over plan documents, with page-level citations), then streams back the answer, the SQL it ran, a chart, and a trace of every step it took.

> **Data notice:** everything here runs on synthetic data—1,000 generated claims and a fictional "Sample Health Plan" benefits booklet. No PHI, no real payer or provider data.

## Why this exists

Claims, revenue-cycle, and member-services teams spend a large share of their day on repeatable lookups: *Which providers have the most denials? What does the plan cover for telehealth? What changed in charges by status this quarter?* Each one usually means a ticket to an analyst or a hunt through a benefits document.

This project is a template for taking that work off the queue:

| Team need | What the workflow does |
|-----------|------------------------|
| Self-serve claims analytics | Turns natural-language questions into SQL, runs it, returns a table and chart |
| Fewer failed queries | Detects SQL errors and rewrites the query automatically (configurable retries) |
| Trustworthy policy answers | Retrieves from plan documents and cites the page and section it used |
| Reviewability | Shows the generated SQL and a node-by-node agent trace for every answer |
| Bring your own data | Upload a CSV (converted to Parquet, loaded into DuckDB) or a PDF (indexed for retrieval) from the UI |
| Portability | Same agent runs on the Anthropic API or AWS Bedrock; local or Docker; AWS services optional |

## How a team would extend it

The pattern is deliberately small so a team can adapt it quickly:

1. **Swap the data** — point DuckDB at your own claims extract, or replace it with Snowflake/Databricks/Redshift behind the same `execute_query` node.
2. **Swap the documents** — drop in your plan booklets, SOPs, or payer policies; switch `RAG_ENGINE=chroma` for larger document sets.
3. **Add a path** — add a new intent to `classify_intent` and a node for it (e.g., prior-auth checklist, denial-appeal letter draft), then wire it into the graph.
4. **Harden for production** — add authentication, role-based access, PHI-safe hosting, audit logging, and an evaluation set of known question/answer pairs before real data touches it.

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + TypeScript + Tailwind)          │
│  ┌──────────────────────────────────────────┐             │
│  │  Header Tabs: [Chat] [Upload]            │             │
│  ├──────────────────────────────────────────┤             │
│  │  Unified Chat Interface (SSE streaming)  │             │
│  │  "Ask anything about claims or plans"    │             │
│  │  ┌──────────────────────────────────┐    │             │
│  │  │ Pre-seeded sample conversation   │    │             │
│  │  └──────────────────────────────────┘    │             │
│  └──────────────────────────────────────────┘             │
└─────────────────────┬─────────────────────────────────────┘
                      │ SSE (text/event-stream)
                      ▼
┌───────────────────────────────────────────────────────────┐
│  Backend (FastAPI + Python)                               │
│                                                            │
│  ┌──────────────────────────────────────────┐             │
│  │  Router Agent (LangGraph)                │             │
│  │                                          │             │
│  │  User Query → classify_intent            │             │
│  │       │                                  │             │
│  │       ├─ "nl2sql" ──→ generate_sql       │             │
│  │       │               ├─ execute_query    │             │
│  │       │               └─ (on error) ──→ fix_sql        │
│  │       ├─ "rag" ─────→ search_docs        │             │
│  │       └─ "clarify" ─→ synthesize         │             │
│  │                                          │             │
│  │  All paths → synthesize → END            │             │
│  │  Each node emits SSE event for trace     │             │
│  └──────────────────────────────────────────┘             │
│                                                            │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐│
│  │ DuckDB  │  │ Parquet  │  │ BM25/    │  │ DynamoDB/  ││
│  │ (local) │  │ (S3 opt) │  │ ChromaDB │  │ In-Memory  ││
│  └─────────┘  └──────────┘  └──────────┘  └────────────┘│
│                                                            │
│  ┌──────────────────────────────────────────┐             │
│  │  Claude LLM (switchable)                  │             │
│  │  anthropic → ChatAnthropic                │             │
│  │  bedrock  → ChatBedrock (AWS)             │             │
│  └──────────────────────────────────────────┘             │
└────────────────────────────────────────────────────────────┘

Docker: backend + frontend containers via docker-compose
AWS Resources (OPTIONAL, FREE TIER): S3 + DynamoDB + Bedrock
```

### Agent Flow

The LangGraph agent intelligently routes queries through conditional paths with self-correction:

1. **classify_intent** - Determines whether query is data analytics (nl2sql), policy question (rag), or needs clarification
2. **NL2SQL Path** - Generates SQL → executes against DuckDB → self-corrects on errors → returns tabular data + charts
3. **RAG Path** - Searches benefits PDF via BM25/ChromaDB → synthesizes answer with citations
4. **synthesize** - Formats final response with metadata (SQL, charts, citations, agent trace)

All nodes stream real-time progress via Server-Sent Events (SSE).

## Tech Stack

| Component | Technology | Why it is here |
|-----------|-----------|----------------|
| **Agent framework** | LangChain + LangGraph | Explicit, inspectable state graph with conditional routing and retry |
| **LLM** | Claude (Anthropic API or AWS Bedrock) | Switchable by env var; same agent code |
| **Backend** | FastAPI + Python 3.12 | Async streaming, typed request/response models, auto-generated API docs |
| **NL2SQL engine** | DuckDB (in-process) | Fast analytical SQL over Parquet with no database server |
| **Retrieval** | BM25 (default) or ChromaDB + FastEmbed | Zero-download default; vector search when document volume grows |
| **Cloud (optional)** | AWS S3, DynamoDB, Bedrock | Parquet storage, conversation history, managed LLM access |
| **Containers** | Docker + docker-compose | One-command full-stack run |
| **Frontend** | React + Vite + TypeScript + Tailwind | Chat, tables, charts, SQL viewer, agent trace, citations |
| **Streaming** | Server-Sent Events | Live token and agent-step updates |

## Responsible AI & data handling

- **Synthetic data only** in this repository; no PHI.
- **Transparent answers:** every data answer shows the SQL that produced it; every policy answer shows its source citations.
- **Visible reasoning path:** the agent trace shows which route was taken and how long each step ran.
- **Disclaimers and human hand-off** are built into the UI; answers are informational, not medical or benefits advice.
- **Not production-hardened:** real deployments need HIPAA-eligible hosting, a BAA with the LLM provider, access controls, audit logging, and evaluation before use with real data.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+ or Bun
- Docker (optional, for containerized deployment)
- Anthropic API key (or AWS Bedrock access)

### Option 1: Local Development (Fastest)

```bash
# Clone and navigate
git clone https://github.com/slysik/Healthcare-Claims-AI.git
cd Healthcare-Claims-AI

# Copy environment template
cp env.template .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start everything with one command
./scripts/run_demo.sh
```

This starts:
- Backend at http://localhost:8000 (FastAPI + Swagger docs at /docs)
- Frontend at http://localhost:5173

### Option 2: Docker (Production-like)

```bash
# Copy environment template
cp env.template .env
# Edit .env and add your ANTHROPIC_API_KEY

# Build and run
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Option 3: Manual (Step-by-step)

#### Backend

```bash
# Install UV (fast Python package manager)
pip install uv

# Navigate to backend
cd backend

# Install dependencies (default: no AWS deps)
uv pip install -e .

# Optional: Install AWS support
uv pip install -e .[aws]

# Optional: Install ChromaDB RAG engine
uv pip install -e .[chroma]

# Start server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend

# Using npm (universal)
npm install
npm run dev

# Or using Bun (faster alternative)
bun install
bun run dev
```

## Environment Variables

Copy `env.template` to `.env` and configure:

### Required

```bash
# Anthropic API key (get from https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...
```

### LLM Provider

```bash
# Provider: "anthropic" (default) or "bedrock" (AWS)
LLM_PROVIDER=anthropic

# Model IDs (defaults shown)
ANTHROPIC_MODEL_ID=claude-sonnet-4-5-20250929
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-5-20250929-v1:0
```

### RAG Engine

```bash
# RAG engine: "bm25" (default, zero downloads) or "chroma" (production)
RAG_ENGINE=bm25
```

### Agent Tuning

```bash
# SQL self-correction max retries (default 2)
SQL_MAX_RETRIES=2

# Demo mode: returns canned responses for pre-seeded queries (no LLM call)
DEMO_MODE=true
```

### Optional AWS Integration

All AWS services are optional and use free tier:

```bash
# Enable AWS features (S3, DynamoDB, Bedrock)
ENABLE_AWS=false

# AWS credentials (only needed if ENABLE_AWS=true)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# S3 bucket for Parquet storage (optional)
S3_BUCKET=

# DynamoDB table for conversation persistence (optional)
DYNAMODB_TABLE=claims-ai-conversations
```

**Without AWS**: App uses local Parquet files and in-memory conversation storage.

**With AWS**: Run `./scripts/setup_aws.sh` to create S3 bucket, DynamoDB table, and IAM user (free tier eligible).

## Features

### LangGraph Intelligent Routing Agent

- Conditional state machine with 6 nodes: classify, generate_sql, execute_query, fix_sql, search_docs, synthesize
- Intent classification: routes queries to NL2SQL (data analytics) vs RAG (policy questions)
- Real-time agent trace visualization in UI shows node execution path and timing
- Production-ready error handling and graceful degradation

### NL2SQL with SQL Self-Correction

- Generates DuckDB-compatible SQL from natural language queries
- Executes against 1,000 synthetic healthcare claims (no PHI)
- If SQL fails, agent automatically analyzes error and generates corrected SQL (configurable retry limit)
- Returns tabular results + agent-chosen chart type (bar/line/pie)
- Example: "What are the top 5 diagnosis codes by claim count?" → bar chart

### RAG with Dual Engine

- **BM25 (default)**: Pure Python, ~20KB, zero model downloads, instant startup - ideal for small PDFs
- **ChromaDB (optional)**: FastEmbed embeddings, production-grade vector search - better for large document sets
- Switch engines via `RAG_ENGINE` env var (no code changes)
- Chunks benefits PDF with page metadata, returns answers with source citations
- Example: "What is the deductible for in-network services?" → answer with page numbers

### SSE Streaming with Real-time Agent Trace

- Server-Sent Events (SSE) stream response tokens as agent processes
- UI shows live agent trace: nodes light up with timing as they execute
- Heartbeat keepalive (15s) prevents proxy timeouts
- Client disconnect detection aborts inflight work (no wasted LLM calls)
- Retry button on errors, cancel button during streaming

### Demo Mode with Canned Responses

- `DEMO_MODE=true`: First 2 pre-seeded queries return instant canned responses (no LLM call)
- Gives a reliable first-run experience with no API key or cold start
- Configurable via env var, transparent to user

### Switchable LLM Provider

- `LLM_PROVIDER=anthropic`: Direct Anthropic API (faster, simpler)
- `LLM_PROVIDER=bedrock`: AWS Bedrock (multi-region, enterprise governance)
- Same agent code, different backend - demonstrates cloud portability

### DynamoDB Conversation Persistence

- Stores conversation history in DynamoDB (optional)
- Falls back to in-memory storage if AWS disabled
- Partition key: `conversation_id`, sort key: `timestamp`
- AWS free tier: 25GB storage, 25 WCU/RCU

### Docker Containerization

- `docker-compose up --build` runs full stack
- Backend image: <800MB (Python 3.12-slim, UV package manager, no PyTorch)
- Frontend image: nginx-alpine serving static Vite build
- Health checks ensure proper startup order

### AI Opportunities tab (concept prototypes)

A feature-flagged tab with four clickable concepts—**Ask My Claims**, **Ask My Plan Documents**, **Health Spend Insights**, and **AI Workflows** (step-by-step guidance for appeals, prior authorization, cost comparison, and benefits checks). These are **front-end prototypes on mock data** used to explore where the same agent pattern could go next; they do not call the backend.

## API Endpoints

### Chat

- `POST /api/chat/stream` - Streaming chat with SSE (recommended)
- `POST /api/chat` - Non-streaming fallback (full JSON response)
- `GET /api/chat/history/{conversation_id}` - Conversation history

### Upload

- `POST /api/upload/csv` - Upload CSV, convert to Parquet, load into DuckDB
- `POST /api/upload/pdf` - Upload PDF, ingest into RAG engine
- `GET /api/datasets` - List loaded datasets
- `GET /api/documents` - List ingested documents

### Data & Health

- `GET /api/health` - Service health (DuckDB, RAG engine, LLM provider, AWS status)
- `GET /api/config` - Feature flags (LLM provider, RAG engine, demo mode, model IDs)
- `GET /api/schema` - DuckDB table schemas

Full API documentation: http://localhost:8000/docs (Swagger UI)

## Project Structure

```
Healthcare-Claims-AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + startup health checks
│   │   ├── config.py            # Pydantic settings (env vars)
│   │   ├── routers/
│   │   │   ├── chat.py          # SSE streaming endpoint
│   │   │   ├── upload.py        # CSV/PDF upload
│   │   │   └── data.py          # Health, schema, config
│   │   ├── agent/
│   │   │   ├── graph.py         # LangGraph StateGraph (with retry)
│   │   │   ├── nodes.py         # All 6 node functions
│   │   │   ├── state.py         # AgentState TypedDict
│   │   │   ├── prompts.py       # System prompts per node
│   │   │   └── llm.py           # LLM factory (Anthropic/Bedrock)
│   │   ├── services/
│   │   │   ├── database.py      # DuckDB manager
│   │   │   ├── storage.py       # S3 + Parquet (local fallback)
│   │   │   ├── conversations.py # DynamoDB (in-memory fallback)
│   │   │   └── vectorstore.py   # BM25/ChromaDB (dual engine)
│   │   └── models/
│   │       └── schemas.py       # Pydantic request/response models
│   └── pyproject.toml           # Python deps (UV)
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Header + tabs
│   │   │   ├── ChatPanel.tsx     # Chat UI with SSE streaming
│   │   │   ├── MessageBubble.tsx # Message with sub-components
│   │   │   ├── UploadPanel.tsx   # Drag-and-drop upload
│   │   │   ├── ResultsTable.tsx  # Sortable data table
│   │   │   ├── ChartView.tsx     # Recharts (bar/line/pie)
│   │   │   ├── AgentTrace.tsx    # LangGraph path visualization
│   │   │   ├── SqlViewer.tsx     # Collapsible SQL display
│   │   │   └── Citations.tsx     # RAG source citations
│   │   ├── hooks/
│   │   │   └── useChat.ts        # SSE streaming + state
│   │   └── lib/
│   │       └── api.ts            # Typed API client
│   └── package.json              # npm deps (Vite + React)
├── data/
│   ├── generate_claims.py        # Synthetic data generator
│   ├── generate_benefits_pdf.py  # Benefits PDF generator
│   ├── sample_claims.csv         # 1,000 synthetic claims
│   └── sample_benefits_summary.pdf # 10-page benefits summary
├── scripts/
│   ├── run_demo.sh               # Start backend + frontend
│   ├── setup_aws.sh              # Optional AWS resource creation
│   └── seed_data.sh              # Load sample data
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── env.template
└── README.md
```

## Sample Data

- **Claims CSV**: 1,000 synthetic claims (no PHI) with ICD-10 diagnosis codes, CPT procedure codes, providers, amounts, statuses (PAID/DENIED/PENDING), and denial reasons — generated by `data/generate_claims.py`
- **Benefits PDF**: 10-page benefits booklet for a fictional "Sample Health Plan" (deductibles, copays, covered services, telehealth, prior auth, exclusions) — generated by `data/generate_benefits_pdf.py`

## Development

### Backend

```bash
# Type check (via pyright)
cd backend && uv run pyright app/

# Lint
cd backend && uv run ruff check app/

# Auto-fix
cd backend && uv run ruff check --fix app/
```

### Frontend

```bash
# Type check
cd frontend && npm run build  # includes tsc -b
cd frontend && npx tsc --noEmit

# Using Bun
cd frontend && bun run build
```

### Docker

```bash
# Build images
docker-compose build

# Check image size (should be <800MB for backend)
docker images | grep healthcare-claims-ai

# Run with logs
docker-compose up

# Run detached
docker-compose up -d

# Stop
docker-compose down
```

## Powered By

- [Claude](https://www.anthropic.com/claude) - Anthropic's frontier AI model
- [LangGraph](https://langchain-ai.github.io/langgraph/) - Stateful agent orchestration
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI framework
- [DuckDB](https://duckdb.org/) - In-process analytical database
- [shadcn/ui](https://ui.shadcn.com/) - Tailwind component library
- [Recharts](https://recharts.org/) - React charting library

---

Built by [Steve Lysik](https://github.com/slysik) as a sample healthcare AI workflow.
