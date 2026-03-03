# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-8.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
FastAPI server for the SRE Copilot, designed for a decoupled, streaming-first architecture.
"""

import asyncio
import json
import logging
import uuid
import time
import os
from typing import Any, AsyncGenerator, Dict, Optional

import uvicorn
from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from main import app  # Import the compiled graph
from app.nodes import git_loader

# --- Setup ---
logger = logging.getLogger("api_gateway")
api = FastAPI(
    title="SRE Copilot API",
    description="API for orchestrating the LangGraph-based SRE Copilot workflow.",
)
router = APIRouter()


@api.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Middleware to add processing time header to responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000

    # We do not log streaming events here, just standard request metadata.
    if "text/event-stream" not in response.headers.get("content-type", ""):
        logger.info(
            "API %s %s - %s - %.2fms",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
        )

    return response


# --- CORS ---
# In a production environment, you should restrict this to your frontend's origin
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# --- Pydantic Models ---
class CreateThreadResponse(BaseModel):
    """Response model for thread creation."""

    thread_id: str


class RunRequest(BaseModel):
    """Request to run the workflow from a given state."""

    thread_id: str
    input: Optional[Dict[str, Any]] = None
    # If true, graph runs non-stop. If false, it will pause at interrupts.
    auto_approve: bool = False


class UpdateStateRequest(BaseModel):
    """Request to update the graph's state for a specific thread."""

    values: Dict[str, Any]


# --- Helper for Streaming ---
async def _stream_graph_events(thread_id: str, input_data: Any) -> AsyncGenerator[str, None]:
    """
    Calls the LangGraph app's stream method and yields Server-Sent Events (SSE).
    """
    config = {"configurable": {"thread_id": thread_id}}
    node_start_times = {}
    try:
        # Use astream_events for detailed event tracking
        async for event in app.astream_events(input_data, config=config, version="v1"):
            event_name = event.get("name", "Unknown")
            event_type = event.get("event")

            if event_type == "on_chain_start" and event_name in [
                "git_loader",
                "code_analyst",
                "diagram_generator",
                "slo_specialist",
                "terraform_generator",
                "orchestrator",
            ]:
                node_start_times[event_name] = time.time()

            elif event_type == "on_chain_end" and event_name in node_start_times:
                duration_ms = (time.time() - node_start_times.pop(event_name)) * 1000
                logger.info(
                    json.dumps(
                        {
                            "message": f"Graph Node Executed: {event_name}",
                            "latency_ms": round(duration_ms, 2),
                            "status": "OK",
                        }
                    )
                )

            # Reformat the event into a string suitable for SSE
            # Only send the necessary event metadata to the client to avoid huge raw prompts going over the wire and blowing up logs
            client_event = {
                "event": event_type,
                "name": event_name,
                "data": {},  # Omit the raw massive payloads since the frontend only uses SSE for status tracking
            }
            sse_event = f"event: {event_type}\ndata: {json.dumps(client_event)}\n\n"
            yield sse_event
            # Add a small sleep to prevent overwhelming the client
            await asyncio.sleep(0.01)

    except Exception as e:
        logger.error("Graph execution error for thread %s: %s", thread_id, e)
        error_data = json.dumps({"error": str(e)})
        yield f"event: error\ndata: {error_data}\n\n"


# --- API Endpoints ---
@api.get("/health", tags=["Health"])
async def health_check():
    """A simple health check endpoint."""
    return {"status": "ok"}


@router.post("/threads", response_model=CreateThreadResponse)
async def create_thread():
    """Creates a new, unique thread_id for a session."""
    return {"thread_id": str(uuid.uuid4())}


@router.post("/threads/{thread_id}/run")
async def run_workflow(thread_id: str, request: RunRequest):
    """
    Runs the graph for a given thread, streaming back events.
    This is the primary endpoint for executing workflow steps.
    """
    logger.info(
        "Running workflow for thread %s with auto_approve=%s",
        thread_id,
        request.auto_approve,
    )

    # The 'input' for a resume is None, but for the first run, it contains the repo info
    run_input = request.input

    # This will stream SSE events back to the client
    return StreamingResponse(
        _stream_graph_events(thread_id, run_input),
        media_type="text/event-stream",
    )


@router.get("/threads/{thread_id}/state")
async def get_thread_state(thread_id: str):
    """Fetches the current state of the graph for a given thread."""
    config = {"configurable": {"thread_id": thread_id}}
    try:
        snapshot = app.get_state(config)
        
        # Hydration Logic: If local_repo_path exists in state but is missing from disk, re-clone it
        if "local_repo_path" in snapshot.values:
            repo_path = snapshot.values.get("local_repo_path")
            if repo_path and not os.path.exists(repo_path):
                logger.info("Workspace '%s' not found on disk. Automatically re-cloning repo: %s", repo_path, snapshot.values.get("repo_url"))
                try:
                    # git_loader is a sync function so we must run it in a threadpool to not block the async event loop
                    loader_result = await asyncio.to_thread(git_loader, snapshot.values)
                    # Update state in langgraph with the fresh git_loader results
                    app.update_state(config, loader_result)
                    logger.info("Successfully re-cloned workspace to '%s'", repo_path)
                    
                    # Refresh snapshot after update
                    snapshot = app.get_state(config)
                except Exception as loader_err:
                    logger.error("Failed to auto-restore workspace: %s", loader_err)
                    
        return {"values": snapshot.values, "next": snapshot.next}
    except Exception as e:
        logger.error("Failed to get state for thread %s: %s", thread_id, e)
        raise HTTPException(
            status_code=404,
            detail="Thread not found or state is invalid.",
        ) from e


@router.post("/threads/{thread_id}/state")
async def update_thread_state(thread_id: str, request: UpdateStateRequest):
    """Updates the state of the graph for a given thread."""
    config = {"configurable": {"thread_id": thread_id}}
    try:
        app.update_state(config, request.values)
        return {"status": "success", "thread_id": thread_id}
    except Exception as e:
        logger.error("Failed to update state for thread %s: %s", thread_id, e)
        raise HTTPException(status_code=500, detail="Failed to update state.") from e


api.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run(api, host="0.0.0.0", port=8080)
