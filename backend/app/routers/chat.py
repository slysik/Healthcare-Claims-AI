"""Chat endpoints with SSE streaming."""

import asyncio
import json
import logging
import time
import uuid

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from app.agent.graph import agent
from app.config import settings
from app.models.schemas import AgentResponse, ChatRequest
from app.services.conversations import conversation_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])

# Canned responses for demo mode
CANNED_RESPONSES = {
    "total charges by claim status": AgentResponse(
        intent="nl2sql",
        answer=(
            "Here's a breakdown of total charges by claim status:\n\n"
            "| Claim Status | Claim Count | Total Charges |\n"
            "|---|---|---|\n"
            "| PROCESSED | 14 | $10,271.35 |\n"
            "| DENIED | 4 | $485.00 |\n\n"
            "14 of 18 claims were processed successfully, totaling $10,271.35. "
            "The 4 denied claims total $485.00 — 3 from Lowcountry Urology Clinics PA "
            "and 1 from Medical Select Inc."
        ),
        sql=(
            "SELECT \"Claim Status\", COUNT(*) as claim_count, "
            "SUM(CAST(REPLACE(REPLACE(\"Total Charges\", '$', ''), ',', '') AS DECIMAL(10,2))) "
            "as total_charges "
            "FROM HealthClaimsList_Feb24_Feb26 "
            "GROUP BY \"Claim Status\" ORDER BY total_charges DESC"
        ),
        query_results=[
            {
                "Claim Status": "PROCESSED",
                "claim_count": 14,
                "total_charges": 10271.35,
            },
            {
                "Claim Status": "DENIED",
                "claim_count": 4,
                "total_charges": 485.00,
            },
        ],
        chart_type="bar",
        agent_trace=[],
        timing_ms=150,
    ),
    "which providers have denied claims": AgentResponse(
        intent="nl2sql",
        answer=(
            "Two providers have denied claims:\n\n"
            "| Provider | Denied Claims | Total Denied |\n"
            "|---|---|---|\n"
            "| Lowcountry Urology Clinics PA | 3 | $450.00 |\n"
            "| Medical Select Inc DBA NEB Doctors of S | 1 | $35.00 |\n\n"
            "Lowcountry Urology accounts for 3 of the 4 denied claims ($450), "
            "all for Steve Lysik. The Medical Select denial was $35 for Noelle Lysik."
        ),
        sql=(
            "SELECT \"Provider\", COUNT(*) as denied_count, "
            "SUM(CAST(REPLACE(REPLACE(\"Total Charges\", '$', ''), ',', '') AS DECIMAL(10,2))) "
            "as total_denied "
            "FROM HealthClaimsList_Feb24_Feb26 "
            "WHERE \"Claim Status\" = 'DENIED' "
            "GROUP BY \"Provider\" ORDER BY denied_count DESC"
        ),
        query_results=[
            {
                "Provider": "LOWCOUNTRY UROLOGY CLINICS PA",
                "denied_count": 3,
                "total_denied": 450.00,
            },
            {
                "Provider": "MEDICAL SELECT INC DBA NEB DOCTORS OF S",
                "denied_count": 1,
                "total_denied": 35.00,
            },
        ],
        chart_type="bar",
        agent_trace=[],
        timing_ms=150,
    ),
    "what is the deductible": AgentResponse(
        intent="rag",
        answer=(
            "Based on the Summary of Benefits Coverage, the overall deductible "
            "for this plan is:\n\n"
            "- **Individual**: $7,900\n"
            "- **Family**: $15,800\n\n"
            "You must pay all costs from providers up to the deductible amount "
            "before the plan begins to pay. However, **preventive care services "
            "and office visits are covered before you meet your deductible**.\n\n"
            "The maximum out-of-pocket limit is **$9,500/individual** and "
            "**$19,000/family**."
        ),
        citations=[
            {
                "text": (
                    "What is the overall deductible? $7,900/individual and "
                    "$15,800/family. Generally, you must pay all the costs from "
                    "providers up to the deductible amount before this plan begins to pay."
                ),
                "page": 1,
                "doc_name": "Summary of Benefits Coverage.pdf",
            },
            {
                "text": (
                    "What is the maximum out-of-pocket limit for this plan? "
                    "$9,500/individual and $19,000/family"
                ),
                "page": 1,
                "doc_name": "Summary of Benefits Coverage.pdf",
            },
        ],
        agent_trace=[],
        timing_ms=120,
    ),
}


def _match_canned(query: str) -> AgentResponse | None:
    """Check if query matches a canned response (case-insensitive partial match)."""
    if not settings.DEMO_MODE:
        return None
    q = query.lower().strip().rstrip("?")
    for key, response in CANNED_RESPONSES.items():
        if key in q or q in key:
            return response
    return None


async def _stream_canned_response(response: AgentResponse, request: Request):
    """Stream a canned response with simulated trace events."""
    # Simulate trace events
    if response.intent == "nl2sql":
        trace_nodes = ["classify", "generate_sql", "execute_query", "synthesize"]
    elif response.intent == "rag":
        trace_nodes = ["classify", "search_documents", "synthesize"]
    else:
        trace_nodes = ["classify", "synthesize"]

    # Send running events
    for node in trace_nodes:
        if await request.is_disconnected():
            return
        yield {
            "event": "trace",
            "data": json.dumps({"node": node, "status": "running"}),
        }
        await asyncio.sleep(0.05)

    # Send complete events
    for node in trace_nodes:
        if await request.is_disconnected():
            return
        yield {
            "event": "trace",
            "data": json.dumps({"node": node, "status": "complete", "timing_ms": 50}),
        }
        await asyncio.sleep(0.05)

    # Stream answer in chunks
    answer = response.answer
    chunk_size = 20
    for i in range(0, len(answer), chunk_size):
        if await request.is_disconnected():
            return
        chunk = answer[i : i + chunk_size]
        yield {
            "event": "answer_chunk",
            "data": chunk,
        }
        await asyncio.sleep(0.02)

    # Send complete response
    yield {
        "event": "complete",
        "data": response.model_dump_json(),
    }


async def _stream_agent_response(
    query: str, conversation_history: list[dict], request: Request
):
    """Stream live agent execution with trace events."""
    start_time = time.time()
    trace_events = []

    try:
        # Stream trace events as agent runs
        async for event in agent.astream_events(
            {
                "query": query,
                "metadata": {},
                "conversation_history": conversation_history,
                "sql_retry_count": 0,
            },
            version="v1",
        ):
            if await request.is_disconnected():
                return

            event_type = event.get("event")

            # Node start
            if event_type == "on_chain_start":
                node_name = event.get("name", "")
                if node_name and node_name != "LangGraph":
                    yield {
                        "event": "trace",
                        "data": json.dumps({"node": node_name, "status": "running"}),
                    }
                    trace_events.append(
                        {"node": node_name, "status": "running", "result": None, "timing_ms": None}
                    )

            # Node end
            elif event_type == "on_chain_end":
                node_name = event.get("name", "")
                if node_name and node_name != "LangGraph":
                    node_time = time.time() - start_time
                    yield {
                        "event": "trace",
                        "data": json.dumps(
                            {
                                "node": node_name,
                                "status": "complete",
                                "timing_ms": int(node_time * 1000),
                            }
                        ),
                    }

        # Get final state
        final_state = await agent.ainvoke(
            {
                "query": query,
                "metadata": {},
                "conversation_history": conversation_history,
                "sql_retry_count": 0,
            }
        )

        # Build response
        total_time = time.time() - start_time
        response = AgentResponse(
            intent=final_state.get("intent", "clarify"),
            answer=final_state.get("answer", ""),
            sql=final_state.get("sql"),
            query_results=final_state.get("query_results"),
            chart_type=final_state.get("chart_type"),
            citations=final_state.get("citations"),
            agent_trace=trace_events,
            timing_ms=int(total_time * 1000),
            sql_retries=final_state.get("sql_retry_count", 0),
        )

        # Stream answer in chunks
        answer = response.answer
        chunk_size = 20
        for i in range(0, len(answer), chunk_size):
            if await request.is_disconnected():
                return
            chunk = answer[i : i + chunk_size]
            yield {
                "event": "answer_chunk",
                "data": chunk,
            }
            await asyncio.sleep(0.01)

        # Send complete response
        yield {
            "event": "complete",
            "data": response.model_dump_json(),
        }

    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        yield {
            "event": "error",
            "data": json.dumps({"message": str(e), "recoverable": True}),
        }


@router.post("/stream")
async def chat_stream(request: Request, chat_request: ChatRequest):
    """SSE streaming chat endpoint."""
    conversation_id = chat_request.conversation_id or str(uuid.uuid4())
    query = chat_request.query

    logger.info(f"Stream request: {query} (conversation: {conversation_id})")

    # Get conversation history
    history = conversation_store.get_history(conversation_id)

    # Save user message
    conversation_store.save_message(conversation_id, "user", query)

    async def event_generator():
        last_heartbeat = time.time()
        response_obj = None

        # Check for canned response
        canned = _match_canned(query)
        if canned:
            async for event in _stream_canned_response(canned, request):
                yield event
                if event["event"] == "complete":
                    response_obj = AgentResponse.model_validate_json(event["data"])
        else:
            async for event in _stream_agent_response(query, history, request):
                yield event
                if event["event"] == "complete":
                    response_obj = AgentResponse.model_validate_json(event["data"])

                # Send heartbeat every 15s
                if time.time() - last_heartbeat > 15:
                    yield {"event": "heartbeat", "data": "{}"}
                    last_heartbeat = time.time()

        # Save assistant response
        if response_obj:
            conversation_store.save_message(
                conversation_id,
                "assistant",
                response_obj.answer,
                response_data=response_obj.model_dump(),
            )

    return EventSourceResponse(event_generator())


@router.post("")
async def chat(chat_request: ChatRequest):
    """Non-streaming chat endpoint."""
    conversation_id = chat_request.conversation_id or str(uuid.uuid4())
    query = chat_request.query

    logger.info(f"Chat request: {query} (conversation: {conversation_id})")

    # Get conversation history
    history = conversation_store.get_history(conversation_id)

    # Save user message
    conversation_store.save_message(conversation_id, "user", query)

    # Check for canned response
    canned = _match_canned(query)
    if canned:
        response = canned
    else:
        # Run agent
        from app.agent.graph import run_agent

        start_time = time.time()
        final_state = run_agent(query, history)

        # Build response
        total_time = time.time() - start_time
        response = AgentResponse(
            intent=final_state.get("intent", "clarify"),
            answer=final_state.get("answer", ""),
            sql=final_state.get("sql"),
            query_results=final_state.get("query_results"),
            chart_type=final_state.get("chart_type"),
            citations=final_state.get("citations"),
            agent_trace=[],
            timing_ms=int(total_time * 1000),
            sql_retries=final_state.get("sql_retry_count", 0),
        )

    # Save assistant response
    conversation_store.save_message(
        conversation_id,
        "assistant",
        response.answer,
        response_data=response.model_dump(),
    )

    return response


@router.get("/history/{conversation_id}")
async def get_history(conversation_id: str):
    """Get conversation history."""
    history = conversation_store.get_history(conversation_id)
    return {"conversation_id": conversation_id, "messages": history}
