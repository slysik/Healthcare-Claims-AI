# BCBS Claims AI - Interview Demo Script

Step-by-step walkthrough for BCBS SC AI Agentic Engineer interview (Monday 2/9/2026 at 9am ET).

**Total demo time: 7-8 minutes**

---

## Pre-Demo Setup (5 minutes before call)

### 1. Start the Application

```bash
cd /Users/slysik/bcbs

# Option A: Local development (recommended for demo)
./scripts/run_demo.sh

# Option B: Docker (if asked about deployment)
docker-compose up --build
```

Verify:
- Backend running at http://localhost:8000
- Frontend at http://localhost:5173 (or 3000 if Docker)
- Check http://localhost:8000/docs (Swagger UI loads)

### 2. Open Browser Windows

Arrange screen for screenshare:
1. **Main window**: Frontend at http://localhost:5173
2. **Side window**: Backend logs in terminal (for showing agent trace)
3. **Optional**: Swagger UI at http://localhost:8000/docs

### 3. Verify Pre-seeded Data

Refresh frontend - should show 2-3 pre-loaded sample messages. If not, check backend logs for data loading errors.

### 4. Prepare Talking Points Cheat Sheet

Have this file open on second monitor (not shared).

---

## Scene 1: App Overview (30 seconds)

### What to Show

1. App loads with pre-seeded conversation already visible
2. Point to suggested query chips at top
3. Hover over different UI elements

### What to Say

> "This is BCBS Claims AI - an intelligent routing agent that decides between NL2SQL for data analytics and RAG for policy questions. I pre-loaded 1,000 synthetic claims and a 10-page benefits summary PDF, so we can jump right into queries."

> "Notice the pre-seeded conversation - in demo mode, the first few queries return instant canned responses, which eliminates the cold-start risk when showing this live. But we'll do real queries in a moment."

### Talking Points

- **Architecture**: LangGraph routing agent with conditional state machine
- **Data**: 1,000 synthetic claims (no real PHI) + generated benefits PDF
- **Demo mode**: Configurable via env var, transparent to user

---

## Scene 2: NL2SQL Path with Agent Trace (3 minutes)

### Query 1: Top Diagnosis Codes

**Type**: "What are the top 5 diagnosis codes by claim count?"

**What to Show**:
1. Watch agent trace light up in real-time: classify → generate_sql → execute_query → synthesize
2. Answer streams in token-by-token (SSE)
3. Results appear as table
4. Bar chart auto-renders (agent chose chart type)
5. Click to expand SQL viewer (collapsible)

**What to Say**:

> "I'm asking a data analytics question. Watch the agent trace - this is LangGraph streaming events in real-time via Server-Sent Events."

> "See how it routes: classify determines this is an NL2SQL query, generates SQL against the DuckDB schema, executes, and synthesizes the answer. The agent also chose 'bar chart' as the visualization type - that's in the response metadata."

> "The SQL is collapsible here - you can see exactly what it generated."

**Talking Points**:
- LangGraph conditional routing (required skill)
- SSE streaming for real-time UX
- DuckDB for in-process analytics
- Agent-chosen chart type (bar/line/pie in metadata)

### Query 2: Monthly Trend

**Type**: "Show me the monthly trend of claims over ten thousand dollars"

**What to Show**:
1. Agent trace follows same path (nl2sql)
2. Different SQL generated
3. Line chart renders (agent chose different chart type)

**What to Say**:

> "Same agent, different query. It routes to NL2SQL again, but this time chooses a line chart because it's a trend over time. The agent is making UX decisions for us."

**Talking Points**:
- Natural language flexibility
- Context-aware visualization choices
- DuckDB handles complex filters and aggregations

### Query 3: SQL Self-Correction (if time permits)

**Type**: "Which providers have the highest denial rate?"

**What to Show**:
1. Agent generates SQL
2. If SQL fails (unlikely with correct schema, but could manually trigger), watch fix_sql node activate
3. Agent analyzes error and corrects
4. Re-executes successfully

**What to Say**:

> "This demonstrates the self-correction capability. If the SQL fails - maybe a column name typo or unsupported function - the agent has a retry loop. It analyzes the DuckDB error message and generates corrected SQL. Max retries is configurable via env var."

> "This is agentic AI: reasoning, tool use, and error recovery. Required skill for this role."

**Talking Points**:
- SQL self-correction node in LangGraph
- Error handling and resilience
- Configurable retry limit (SQL_MAX_RETRIES)

---

## Scene 3: RAG Path with Citations (2 minutes)

### Query 4: Policy Question

**Type**: "What is the deductible for in-network services?"

**What to Show**:
1. Agent trace: classify → search_docs → synthesize
2. Answer streams in with markdown formatting
3. Citations appear with page numbers
4. Click to expand citation text (collapsible)

**What to Say**:

> "Now a policy question. The agent classifies this as RAG - it's not asking for data, it's asking about plan rules."

> "It searches the benefits PDF using BM25 by default - that's a pure Python ranking algorithm, about 20 kilobytes, zero model downloads. For a 10-page PDF, it's perfectly adequate and starts instantly."

> "The citations show page numbers and source chunks. If you needed production-grade vector search, you'd switch to ChromaDB with FastEmbed via an env var - same agent code, different retrieval backend."

**Talking Points**:
- Dual RAG engine: BM25 (default) vs ChromaDB (optional)
- BM25: pure Python, ~20KB, zero downloads, instant startup
- ChromaDB: FastEmbed, production-grade, better for large doc sets
- Switch via RAG_ENGINE env var (no code changes)
- Citations with page metadata (PyMuPDF extraction)

### Query 5: Another Policy Question

**Type**: "Is telehealth covered under this plan?"

**What to Show**:
1. Same RAG path
2. Different citations (different page)
3. Answer formatted as markdown with bullet points

**What to Say**:

> "Same interface, different question. The agent routes correctly every time. This is the value of LangGraph - you define the state machine once, and it handles all the conditional logic."

**Talking Points**:
- Markdown rendering (react-markdown + remark-gfm)
- Chunk strategy: 500 chars, 100 overlap, page metadata

---

## Scene 4: The "Wow" Moment - Seamless Routing (1 minute)

### Query 6: Data Question about Telehealth

**Type**: "How many telehealth claims were filed last quarter?"

**What to Show**:
1. Agent routes to NL2SQL (not RAG)
2. Returns count

**What to Say**:

> "Now I'm asking 'how many' - that's a data question. Same topic (telehealth), but the agent knows this needs data, not policy."

### Query 7: Policy Question about Telehealth

**Type**: "What does the plan say about telehealth coverage?"

**What to Show**:
1. Agent routes to RAG (not NL2SQL)
2. Returns policy text

**What to Say**:

> "And now 'what does the plan say' - that's policy, so it routes to RAG. Same chat, same conversation, agent decides. This is agentic AI."

**Talking Points**:
- Intelligent routing eliminates need for separate interfaces
- Users don't need to know which backend to use
- LangGraph handles complexity

---

## Scene 5: Architecture & Tech Stack Walkthrough (1 minute)

### What to Show

1. Navigate to http://localhost:8000/docs (Swagger UI)
2. Show `/api/health` endpoint (expand response)
3. Show `/api/config` endpoint (feature flags)
4. Briefly show backend terminal logs (structured logging with node timing)

### What to Say

> "Let me show you the backend real quick. This is FastAPI with auto-generated Swagger docs."

> "The `/api/health` endpoint shows per-service status: DuckDB, RAG engine, LLM provider, AWS toggles. This is what you'd wire into a Kubernetes readiness probe."

> "The `/api/config` endpoint reflects all feature flags: LLM provider, RAG engine, demo mode, model IDs. Everything is configurable via environment variables - twelve-factor app pattern."

> "For the LLM, you can switch between direct Anthropic API or AWS Bedrock with one env var. Same agent code, different backend. This demonstrates cloud portability."

> "The whole thing runs with `docker-compose up` - backend and frontend containers with health checks. The backend image is under 800MB because we avoided PyTorch and other heavy dependencies. BM25 is pure Python."

### What to Show (if time)

Open `.env` file or reference it verbally.

### What to Say

> "Everything is configured via env vars. For AWS, all the services are optional and free tier: S3 for Parquet storage, DynamoDB for conversation persistence, Bedrock for Claude access. Without AWS, it uses local Parquet files and in-memory conversation storage. Local-first design."

**Talking Points**:
- FastAPI with auto-docs (required skill)
- Switchable LLM provider (Anthropic vs Bedrock)
- Optional AWS integration (S3, DynamoDB, Bedrock)
- Docker containerization (required skill)
- Health checks and feature flags
- Structured logging with correlation IDs
- DuckDB CSV-to-Parquet conversion (no pandas/pyarrow)

---

## Fallback Plan (If Something Breaks)

### Backend Won't Start

**Symptoms**: Port 8000 not responding
**Fix**: Check `.env` has `ANTHROPIC_API_KEY`, restart backend
**Talking point**: "This would normally be in AWS Secrets Manager or Parameter Store in production."

### SSE Stream Hangs

**Symptoms**: Agent trace doesn't update
**Fix**: Refresh page, use non-streaming endpoint (`POST /api/chat`)
**Talking point**: "The fallback endpoint works without SSE if there are proxy issues."

### Chart Doesn't Render

**Symptoms**: Table appears but no chart
**Fix**: Point to the agent_response metadata where `chart_type` is set
**Talking point**: "The chart type is in the response - if the frontend component had an issue, you can still see the data in the table."

### No Pre-seeded Conversation

**Symptoms**: Empty chat on load
**Fix**: Just start with a query - pre-seed is cosmetic
**Talking point**: "Demo mode is optional - the agent works the same either way."

### DuckDB or RAG Error

**Symptoms**: Error toast appears in UI
**Fix**: Show retry button, re-submit query
**Talking point**: "Notice the retry UX - errors are recoverable. The error message gives context."

---

## Questions to Ask (Save for End)

### Question 1: Success Metrics

> "What does success look like in the first 90 days for this role?"

**Why**: Shows you're outcome-oriented, sets expectations

### Question 2: AI Use Cases

> "What AI use cases has the team already identified as highest priority? Claims processing, prior auth, fraud detection, member support?"

**Why**: Shows strategic thinking, domain knowledge (you researched BCBS)

### Question 3: Mentorship

> "I noticed this is BCBS's first dedicated AI Engineer hire. What does the mentorship structure look like, and how does the team plan to grow AI capabilities internally?"

**Why**: Stephanie mentioned mentorship matters, shows long-term thinking

### Question 4: Claude/Bedrock

> "I built this with Claude because the job listing mentioned it specifically. Is the team already using Claude via Bedrock, or is this a greenfield decision?"

**Why**: Shows attention to detail, clarifies tech stack expectations

---

## Post-Demo Talking Points

### Map Features to Job Requirements

Be ready to connect demo to job posting:

| Demo Feature | Job Requirement | Type |
|-------------|----------------|------|
| LangGraph routing agent | "LangChain, LangGraph" | REQUIRED |
| Agentic routing + self-correction | "Agentic AI (reasoning, planning, tool use)" | REQUIRED |
| FastAPI + SSE | "FastAPI or Flask" | NICE-TO-HAVE |
| Claude (Anthropic/Bedrock) | "Claude, OpenAI, or comparable LLMs" | REQUIRED |
| NL2SQL | "Prompt engineering, autonomous agents" | REQUIRED |
| RAG pipeline | "RAG, embeddings, knowledge stores" | NICE-TO-HAVE |
| AWS Bedrock | "Cloud environments (AWS preferred)" | REQUIRED |
| S3 + Parquet | "Cloud environments (AWS preferred)" | REQUIRED |
| DynamoDB | "document databases" | REQUIRED |
| Docker | "Docker, Kubernetes" | REQUIRED |
| React + TypeScript | "JavaScript / TypeScript" | REQUIRED |
| RESTful API + SSE | "RESTful API development" | REQUIRED |
| SQL self-correction | "Agentic AI - reasoning, error recovery" | BONUS |
| Dual RAG engine | "Adaptable architecture" | BONUS |

### BCBS Context (from Research)

- $3B revenue, 13,000 employees, 20+ subsidiaries
- Processes 20% of all Medicare claims (200M+/year, growing to 500M)
- This is their FIRST dedicated AI Engineer hire - greenfield opportunity
- CTO: Ravi Ravindra; CEO: Ed Sellers (growth-oriented)

### Claude Code Development Process (If Asked)

> "I used Claude Code for this build - it's Anthropic's official CLI. I have a production hooks system that validates code quality, blocks dangerous operations, and provides AI-generated completion summaries. The hooks are UV single-file Python scripts that integrate with the Claude lifecycle. Happy to show that repo separately."

### Architecture Decisions (If Asked)

**Why BM25 default?**
> "For a 10-page PDF, BM25 is perfectly adequate and starts instantly. No 250MB model downloads, no scipy/sklearn, no GPU. For production with 1000+ pages, you'd switch to ChromaDB - same agent code, env var change."

**Why DuckDB?**
> "In-process, reads Parquet natively, does CSV-to-Parquet conversion without pandas. It's fast, lightweight, and perfect for analytical queries. For production scale, you'd swap to Snowflake or Redshift with minimal code changes."

**Why SSE over WebSockets?**
> "SSE is simpler - one-way server-to-client, works with standard HTTP/2, easier to debug, and supported by all proxies. WebSockets are bidirectional, which I didn't need here. If the agent needed user input mid-stream, I'd use WebSockets."

**Why FastAPI over Flask?**
> "FastAPI has built-in async support, auto-generated OpenAPI docs, Pydantic validation, and better performance. Flask is great for simple apps, but FastAPI is more modern."

---

## Rehearsal Checklist

- [ ] Run through all 7 queries in order
- [ ] Time yourself (target: 7-8 minutes total)
- [ ] Practice transitioning between scenes smoothly
- [ ] Test fallback endpoints (non-streaming chat)
- [ ] Verify demo mode canned responses work
- [ ] Check backend logs are readable (no debug spam)
- [ ] Confirm Docker build works (in case asked)
- [ ] Review job posting and map to demo features

---

## Day-of Checklist (9am ET Monday 2/9)

- [ ] Start app 5 minutes before call
- [ ] Verify frontend loads with pre-seeded data
- [ ] Check Swagger UI loads
- [ ] Test one NL2SQL query, one RAG query
- [ ] Open DEMO_SCRIPT.md on second monitor
- [ ] Close all unrelated browser tabs
- [ ] Silence notifications
- [ ] Have `.env` file ready to show (hide API key)
- [ ] Have docker-compose.yml ready to show

---

Good luck, Steve. You've got this.
