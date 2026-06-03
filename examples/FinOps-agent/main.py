import os
import uvicorn
import json
import logging
import asyncio
import contextvars
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, Body, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse

from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from google.genai.types import Content, Part
from google.cloud import logging as google_cloud_logging

# Load environment variables
load_dotenv(override=True)

#from agent.sub_agents.struct_data.agent import struct_data_agent as root_agent

from agent.agent import root_agent

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

APP_NAME = "finops_optimizer"
USER_ID = "default_user"

# Context variable for streaming traces to the UI
trace_queue_var = contextvars.ContextVar("trace_queue", default=None)

def emit_trace(event_name: str, data: str):
    """Utility to push a trace event into the current request's queue."""
    queue = trace_queue_var.get()
    if queue:
        queue.put_nowait({'type': 'callback', 'event': event_name, 'data': data})

from enum import Enum
def json_serializable(obj):
    """Fallback function for json.dumps to handle non-serializable types."""
    if isinstance(obj, Enum):
        return obj.value
    if hasattr(obj, 'model_dump'): 
        return obj.model_dump()
    return str(obj)

def create_callbacks(agent_name):
    async def before_tool_callback(tool, args, tool_context):
        payload = {"tool": tool.name, "args": args, "agent": agent_name}
        emit_trace("before_tool", json.dumps(payload, default=json_serializable))
        print(f"🛠 [EVENT: before_tool] [{agent_name}] Called {tool.name}")
        return None

    async def after_tool_callback(tool, args, tool_context, tool_response):
        payload = {"tool": tool.name, "response": tool_response, "agent": agent_name}
        emit_trace("after_tool", json.dumps(payload, default=json_serializable))
        print(f"[EVENT: after_tool] [{agent_name}] Tool '{tool.name}' returned result.")
        return None
    return before_tool_callback, after_tool_callback

def register_callbacks(agent):
    agent_name = getattr(agent, "name", "unknown_agent")
    
    if not hasattr(agent, "_is_wrapped"):
        original_run_async = agent.run_async
        async def wrapped_run_async(*args, **kwargs):
            emit_trace("agent_start", agent_name)
            try:
                async for result in original_run_async(*args, **kwargs):
                    if not hasattr(result, "_agent_info"):
                        try: result._agent_info = agent_name
                        except: pass
                    yield result
            finally:
                emit_trace("agent_stop", agent_name)
        object.__setattr__(agent, 'run_async', wrapped_run_async)
        object.__setattr__(agent, '_is_wrapped', True)

    before_tool, after_tool = create_callbacks(agent_name)
    object.__setattr__(agent, "before_tool_callback", before_tool)
    object.__setattr__(agent, "after_tool_callback", after_tool)

register_callbacks(root_agent)

app = FastAPI(title="FinOps Agent Optimizer")
session_service = InMemorySessionService()
runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)

@app.post("/chat")
async def chat(query: str = Body(..., embed=True), session_id: str = Body("finops_run", embed=True)):
    async def event_generator():
        queue = asyncio.Queue()
        token = trace_queue_var.set(queue)
        try:
            await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session_id)
            user_content = Content(role="user", parts=[Part(text=query)])
            agent_gen = runner.run_async(user_id=USER_ID, session_id=session_id, new_message=user_content)
            
            agent_task = asyncio.create_task(agent_gen.__anext__())
            queue_task = asyncio.create_task(queue.get())
            
            while True:
                done, _ = await asyncio.wait([agent_task, queue_task], return_when=asyncio.FIRST_COMPLETED)
                
                if queue_task in done:
                    trace = queue_task.result()
                    yield f"data: {json.dumps(trace)}\n\n"
                    queue_task = asyncio.create_task(queue.get())
                
                if agent_task in done:
                    try:
                        event = agent_task.result()
                        for fc in event.get_function_calls():
                            yield f"data: {json.dumps({'type': 'tool_call', 'name': fc.name, 'args': fc.args}, default=json_serializable)}\n\n"
                        for fr in event.get_function_responses():
                            yield f"data: {json.dumps({'type': 'tool_response', 'name': fr.name, 'response': fr.response}, default=json_serializable)}\n\n"
                        
                        if event.content and event.content.parts:
                            current_agent = getattr(event, "_agent_info", "unknown")
                            for part in event.content.parts:
                                if hasattr(part, 'thought') and part.thought:
                                    yield f"data: {json.dumps({'type': 'thought', 'text': part.thought, 'agent': current_agent})}\n\n"
                                if part.text:
                                    payload = {'type': 'final' if event.is_final_response() else 'thinking', 'text': part.text, 'agent': current_agent}
                                    yield f"data: {json.dumps(payload, default=json_serializable)}\n\n"
                        
                        agent_task = asyncio.create_task(agent_gen.__anext__())
                    except StopAsyncIteration:
                        while not queue.empty():
                            yield f"data: {json.dumps(queue.get_nowait())}\n\n"
                        break
        finally:
            if not agent_task.done(): agent_task.cancel()
            if not queue_task.done(): queue_task.cancel()
            trace_queue_var.reset(token)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/")
async def root():
    return {"message": "FinOps Agent is active. Use the /chat endpoint to optimize workloads."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), reload=True)