# BCBS Claims AI - Intelligent Healthcare Claims Assistant

A production-ready demonstration of agentic AI for healthcare claims processing, combining LangGraph routing agents with dual-path intelligence: NL2SQL for data analytics and RAG for policy Q&A. Built with Claude, LangChain, FastAPI, and React.

Built for the BCBS SC AI Agentic Engineer position, showcasing enterprise-grade GenAI capabilities with AWS integration, streaming responses, SQL self-correction, and containerized deployment.

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

Technology choices directly aligned with BCBS SC AI Agentic Engineer job requirements:

| Component | Technology | BCBS Requirement |
|-----------|-----------|------------------|
| **Agent Framework** | LangChain + LangGraph | Required: "LangChain, LangGraph" |
| **LLM** | Claude (Anthropic API or AWS Bedrock) | Required: "Claude, OpenAI, or comparable LLMs" |
| **Backend** | FastAPI + Python 3.12 | Nice-to-have: "FastAPI or Flask" |
| **NL2SQL** | DuckDB (in-process) | Required: "Agentic AI - tool use" |
| **RAG** | BM25 (default) or ChromaDB + FastEmbed | Nice-to-have: "RAG, embeddings, knowledge stores" |
| **Cloud** | AWS (S3, DynamoDB, Bedrock) | Required: "Cloud environments (AWS preferred)" |
| **Containers** | Docker + docker-compose | Required: "Docker, Kubernetes" |
| **Database** | DynamoDB (optional) | Required: "document databases" |
| **Frontend** | React + Vite + TypeScript | Required: "JavaScript / TypeScript" |
| **Streaming** | SSE (Server-Sent Events) | Required: "Production-grade AI solutions" |
| **Data Format** | Parquet (S3 optional) | Enterprise standard |

**Coverage: 10/10 required skills + 4 nice-to-haves**

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
DYNAMODB_TABLE=bcbs-conversations
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
- Eliminates cold-start risk during live demos
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
bcbs/
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
│   └── bcbs_benefits_summary.pdf # 10-page benefits summary
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

- **Claims CSV**: 1,000 synthetic claims (no real PHI) with diagnosis codes (ICD-10), procedure codes (CPT), providers, amounts, statuses (PAID/DENIED/PENDING), denial reasons
- **Benefits PDF**: 10-page BCBS benefits summary generated with fpdf2 (deductibles, copays, covered services, telehealth, prior auth, exclusions)

All data is controlled and synthetic to ensure reliable demo behavior.

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
docker images | grep bcbs

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

Built by [Steve Lysik](https://github.com/slysik) for BCBS SC AI Agentic Engineer interview (February 2026)
