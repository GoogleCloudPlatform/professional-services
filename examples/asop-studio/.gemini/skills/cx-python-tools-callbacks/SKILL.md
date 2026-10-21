---
name: cx-python-tools-callbacks
description: Procedural guide for building, wrapping, and testing sandboxed Python tools and pre-agent execution callbacks in CX Agent Studio. Use this skill when adding new functional tools, implementing safe try/catch wrappers, interacting with the global callback context, and invoking other tools.
---

# CX Agent Studio Python Tools & Callbacks: Comprehensive Guide and Best Practices

## Overview
CX Agent Studio supports extending agent functionality through sandboxed Python 3 script executions. These scripts operate in two primary contexts:
1. **Python Function Tools**: Invoked by the model mid-conversation to perform computations, fetch APIs, or query data sources.
2. **Pre-agent Callbacks (`beforeAgentCallbacks`)**: Executed prior to prompt processing to perform event detection, message parsing, or prepare the conversation state.

This skill provides the strict templates, wrapper error patterns, state access paths, and registration files required to implement custom sandboxed logic without errors.

Key capabilities covered:
- **Tool Configuration Mapping**: Associating a JSON tool descriptor with a python file.
- **Standard Non-Invasive Wrapper Pattern**: Catching and surfacing exceptions safely in sandboxed runtimes.
- **State Manipulation**: Interacting with `context.state` and `callback_context.state`.
- **Inter-Tool Execution**: Calling other defined tools via the global `tools` instance.
- **Pre-agent Callback Architecture**: Hooking into the conversation flow to inspect user messages.

---

## Critical Rules (Always Apply)

> [!IMPORTANT]
> Sandboxed execution environments can swallow python exceptions, returning generic errors to the agent console. Always follow the wrapper pattern to preserve tracebacks.

- **The Try/Except Wrapper Pattern is Mandatory:** Never implement core tool logic directly in the entry-point function. Use a `_wrapped` function sibling and return `tool_exception(exc)` inside a catch block.
- **Meaningful Entry-Point Docstrings:** CX Agent Studio feeds the entry-point function's docstring directly to the LLM as the tool's specification. It MUST clearly describe the tool's purpose and the semantic meaning of its arguments. Never use meaningless generic placeholders.
- **Do Not Alter Original Logic for Exception Handling:** The wrapping structure must be a non-invasive drop-in so that reviewers can easily inspect the logic.
- **State Namespace Access:** Inside sandboxed tools, access state via `context.state.get()`. Inside pre-execution callbacks, access state via `callback_context.state[]`.
- **Global Tools Handler:** Inter-tool calling is fully supported. Call other tools by referencing the global `tools` object: `tools.my_other_tool_name(payload)`.

---

## Core Architecture / Data Model

```
[Agent Platform Tool Call]
         │
         ▼
  my_tool(...) (Entry Point)
         │
   ┌─────┴──────────┐
   ▼                ▼
 [Try Block]    [Except Exception as exc]
   │                │
   ▼                ▼
my_tool_wrapped()  tool_exception(exc)
 (Actual Logic)    (Surfaces traceback safely)
```

---

## Quick Start / Minimum Viable Code

### 1. Registering a Python Function Tool (`my_tool.json`)
Create a folder and a configuration descriptor at `data/agent/tools/my_tool/my_tool.json`:

```json
{
  "name": "my-tool",
  "pythonFunction": {
    "name": "my_tool",
    "pythonCode": "tools/my_tool/python_function/python_code.py",
    "description": "Performs a specific business utility. Returns a JSON dict."
  },
  "executionType": "SYNCHRONOUS",
  "displayName": "my_tool"
}
```

### 2. Standard Safe Tool Implementation (`python_code.py`)
Create the script file at `data/agent/tools/my_tool/python_function/python_code.py`:

```python
import traceback
from typing import Dict, Any

def my_tool(arg1: str) -> Dict[str, Any]:
    """
    Performs a specific business utility by processing the input argument.
    
    Args:
        arg1: The unique identifier string to be processed.
    """
    try:
        return my_tool_wrapped(arg1)
    except Exception as exc:
        return tool_exception(exc)

def my_tool_wrapped(arg1: str) -> Dict[str, Any]:
    """Core business logic implementation."""
    if not arg1:
        raise ValueError("Input argument 'arg1' cannot be empty or None.")
    
    # Perform work
    result = f"Successfully processed: {arg1}"
    
    return {
        "status": "success",
        "result": result
    }

def tool_exception(exc: Exception) -> dict:
    """Standardized error reporting helper ensuring sandboxed traceback viability."""
    import traceback
    return {
        "status": "error",
        "exception": str(type(exc).__name__) + ": " + str(exc),
        "traceback": traceback.format_stack()
    }
```

### 3. Pre-execution Callback Code Template (`python_code.py`)
Registered inside an agent's json definition (e.g. `main.json`) under `"beforeAgentCallbacks"`. The script must reside at the target path:

```python
from typing import Optional
import re

def before_agent_callback(callback_context: CallbackContext) -> Optional[Content]:
  """
  This callback executes *before* the agent begins its main prompt-llm processing.
  Use this to detect incoming events, parse XML payload envelopes, or set defaults.
  """
  last_user_message = None

  # 1. Extract the user's message text
  if callback_context.user_content and callback_context.user_content.parts:
    last_user_message = callback_context.user_content.parts[0].text

  if not last_user_message or not isinstance(last_user_message, str):
    print("No active user message string found in callback context.")
    return

  # 2. Perform Event Detection via regular expression (e.g., detecting <event>WELCOME</event>)
  event_match = re.search(r"<event>(.*?)</event>", last_user_message)
  event_type = event_match.group(1) if event_match else None

  if event_type == "PROACTIVE_WELCOME_EVENT":
    print("Proactive welcome event captured inside pre-execution callback.")
    # 3. Save event code to the global variable state
    callback_context.state["internal__event_type"] = "PROACTIVE_WELCOME"
    return

  return
```

---

## Advanced Patterns & Best Practices

### 1. Accessing and Interacting with Global State Variables
Sandboxed Python tools can read and write global state variables that were declared in `app.json`:

```python
def my_tool_wrapped(query_input: str) -> dict:
    # Read variable
    brand_code = context.state.get("ui__brand_code", "cymbal")
    
    # Write variable dynamically to change conversational flow downstream
    context.state["ui__brand_name"] = "Dynamic Brand Inc."
    
    return {"brand_filtered": brand_code}
```

### 2. Triggering Dynamic Inter-Tool Calls
When invoking another tool programmatically inside a custom python script via the global `tools` object, the execution is routed through an external RPC proxy. Strictly enforce these rules:

1. **Pass Input as a Single Dictionary**: Always map input parameters inside a single dictionary representing the payload request body. Never unpack arguments as keyword args with `**kwargs`.
2. **Parse the `ExternalResponse` Object**: Calling `tools.target_tool(payload)` always returns an `ExternalResponse` proxy object. You must call `.json()` on it to extract the data.
3. **Payload Structure Nuances**:
   - For **Python functions**, `.json()` wraps the result in `{"result": <actual return value>}`.
   - For **OpenAPI tools**, `.json()` returns the direct API response payload.

```python
def smart_search_wrapped(question: str) -> dict:
    # 1. Construct payload matching target tool expectations as a single dict
    payload = {
        "query": question
    }
    
    if brand_code := context.state.get("ui__brand_code"):
        payload["filter"] = f'brand_code: ANY("{brand_code}")'
        
    # 2. Execute tool (returns an ExternalResponse object)
    raw_response = tools.kb_data_store(payload)
    
    # 3. Extract payload via .json()
    search_data = raw_response.json()
    
    # Note: If calling a custom Python tool, unpack the envelope:
    # actual_result = raw_response.json().get("result")
    
    return {
        "status": "success",
        "data": search_data
    }
```

---

## Comprehensive Error Handling & Inter-Tool Retry Guidelines

To make this skill self-contained, the core principles from our internal tool wrapper and exception handling standards are documented below:

### 1. The Mandatory Non-Invasive Wrapper Pattern
Sandboxed Python runtimes on the platform often suppress raw script exceptions, making debugging extremely difficult. To preserve stack trace integrity:
- **Rule:** Never write execution logic directly inside the platform-invoked function signature.
- **Entry-Point Docstrings for LLM Context:** CX Agent Studio uses the entry-point function's docstring as the tool specification for the LLM. This docstring MUST clearly describe the tool's utility and the exact meaning of its arguments.
- **Implementation:** The primary entry point must serve exclusively as a lightweight routing shell containing a `try/except` block that delegates directly to a sibling function suffixed with `_wrapped`.
- **Standardized Sinking:** If an exception is caught, it must be funneled to the `tool_exception(exc)` helper, returning a structured dictionary containing `status: "error"`, the stringified exception name, and the complete `traceback.format_stack()`.

### 2. Inter-Tool Invocation & Retry Patterns
When a Python tool programmatically invokes another tool or toolset using the global `tools` object (e.g., `tools.kb_data_store(payload)`), the request passes through an intermediate network RPC proxy layer. To ensure resilience against transient proxy timeouts:
- **Centralized Retry Logic:** Wrap critical external tool calls in an exponential backoff retry block.
- **Envelope Verification:** Remember that calling `.json()` on an `ExternalResponse` object wrapping another Python function yields a doubly wrapped response envelope (`{"result": ...}`). Always defensively unpack using `.get("result", {})`.
