# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""ADK optimization patterns for AI-powered analysis.

This module provides curated ADK design patterns and best practices
that are included in the Gemini analysis prompt. The patterns map
evaluation metric signals to actionable ADK-specific fixes.

These patterns are derived from the ADK documentation skills:
  npx skills add google/adk-docs/skills -y -g
"""

ADK_OPTIMIZATION_PATTERNS = """
## ADK Design Patterns & Optimization Guide

Use these patterns to provide actionable, ADK-specific recommendations
when diagnosing agent issues from evaluation metrics.

### Tool Design Patterns

**Problem: Tool returns string errors instead of raising exceptions**
- Signal: High `tool_success_rate` but low `tool_grounded_response` or LLM retries
- Fix: Tools should return structured dicts with `{"status": "error", "error_message": "..."}`
  instead of apologetic strings. The LLM can then handle errors explicitly.
```python
def my_tool(query: str) -> dict:
    if not valid(query):
        return {"status": "error", "error_message": f"Unsupported query: {query}"}
    return {"status": "success", "data": result}
```

**Problem: LLM retries failed tools in loops**
- Signal: High `token_usage.llm_calls`, high `thinking_metrics.reasoning_ratio`, high latency
- Fix: Add `**KNOWN LIMITATIONS**` to tool docstrings so the LLM knows what NOT to attempt.
```python
def get_weather(city: str) -> dict:
    \"\"\"Get current weather for a city.

    **KNOWN LIMITATIONS:**
    - Only supports US cities
    - Does not provide forecasts
    \"\"\"
```

**Problem: Tools return too much data, bloating context**
- Signal: High `token_usage.prompt_tokens`, high `context_saturation.max_total_tokens`
- Fix: Truncate tool output, save full data to state or artifacts, return only a summary.
```python
async def search_docs(query: str, tool_context: ToolContext) -> dict:
    results = api.search(query)
    # Save full results to state, return preview only
    tool_context.state["full_results"] = results
    return {"status": "success", "count": len(results), "preview": results[:3]}
```

### Agent Architecture Patterns

**Problem: Agent takes wrong paths or uses wrong tools**
- Signal: Low `trajectory_accuracy`, wrong tool call sequences
- Fix: Split into specialized sub-agents with clear boundaries (Isolate principle).
```python
root_agent = Agent(
    name="router",
    model="gemini-3-flash-preview",
    instruction="Route to the right specialist. NEVER answer directly.",
    sub_agents=[weather_agent, booking_agent, faq_agent],
)
```

**Problem: High latency on multi-step tasks**
- Signal: High `latency_metrics.total_latency_seconds`, many LLM calls
- Fix: Use SequentialAgent or ParallelAgent for deterministic workflows.
```python
from google.adk.agents import SequentialAgent, ParallelAgent

pipeline = SequentialAgent(
    name="pipeline",
    sub_agents=[research_agent, analysis_agent, report_agent],
)
```

**Problem: Agent fabricates data when tools fail**
- Signal: Low `tool_grounded_response`, low `pipeline_integrity`
- Fix: Add circuit breaker in `after_tool_callback` to stop on failure.
```python
def check_tool_result(callback_context):
    result = callback_context.function_response
    if result.get("status") == "error":
        callback_context.state["pipeline_error"] = result["error_message"]
        # Return a message that stops the agent from continuing
        return {"role": "model", "parts": [{"text": "Tool failed. Cannot proceed."}]}
```

### Prompt Engineering Patterns

**Problem: Agent invents capabilities it doesn't have**
- Signal: Low `capability_honesty`, promises things tools can't do
- Fix: Add explicit constraints to agent instruction.
```python
agent = Agent(
    instruction=\"\"\"You are a weather assistant.

    **YOU CAN ONLY:**
    - Check current weather for US cities
    - Report the current time for San Francisco

    **YOU CANNOT:**
    - Provide forecasts
    - Check weather outside the US
    - Make reservations or bookings

    If asked about something you cannot do, say so clearly.
    DO NOT use your training knowledge as a substitute for tool results.
    \"\"\",
)
```

**Problem: Low cache hit rate, high cost**
- Signal: Low `cache_efficiency.cache_hit_rate`, high `token_usage.estimated_cost_usd`
- Fix: Put static instructions in `global_instruction` (shared prefix = cached).
```python
agent = Agent(
    model="gemini-3-flash-preview",
    global_instruction="[static system prompt that rarely changes]",
    instruction="[dynamic per-session instructions with {state_key} variables]",
)
```

**Problem: Agent doesn't clarify ambiguous requests**
- Signal: Low `general_quality` due to rubric failures on clarification
- Fix: Add clarification rules to instruction, or adjust evaluation rubrics
  to match the desired agent behavior (sometimes being helpful IS correct).

### State & Context Management

**Problem: State not initialized, causing KeyError**
- Fix: Use `before_agent_callback` to set defaults.
```python
def init_state(callback_context):
    state = callback_context.state
    state.setdefault("cart", [])
    state.setdefault("user_preferences", {})
```

**Problem: Context grows unbounded across turns**
- Signal: Rising `context_saturation.max_total_tokens` across turns
- Fix: Compact stale tool outputs using `output_key` and state summarization.
```python
agent = Agent(
    output_key="last_response",  # Only last response kept, not full history
    instruction="Summarize previous findings before proceeding.",
)
```

### Model Configuration

**Problem: Non-deterministic behavior across runs**
- Signal: Large metric variance between identical runs
- Fix: Lower temperature for more consistent results.
```python
from google.genai import types as genai_types

agent = Agent(
    model="gemini-3-flash-preview",
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.1,  # More deterministic
    ),
)
```

### Context Engineering Principles (Optimization Pillars)

When recommending optimizations, frame them using these five pillars:

1. **Offload**: Move deterministic logic out of the LLM into tools/code
   - Example: Use code_executor for calculations instead of asking the LLM
2. **Reduce**: Summarize or compact stale context to prevent "context rot"
   - Example: Compress tool outputs, use output_key
3. **Retrieve**: Replace static knowledge with dynamic retrieval (RAG)
   - Example: Use VertexAiSearchTool or google_search instead of prompt-stuffing
4. **Isolate**: Split monolithic agents into specialized sub-agents
   - Example: Route weather/booking/FAQ to separate agents
5. **Cache**: Restructure prompts so static parts are prefix-cacheable
   - Example: global_instruction for static content, instruction for dynamic
"""
