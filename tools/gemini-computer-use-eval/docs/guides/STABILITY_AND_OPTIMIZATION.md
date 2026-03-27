# Stability & Optimization Guide

This guide documents the critical execution stability and optimization strategies implemented in the Computer Use Eval framework to support Gemini 2.5 and Gemini 3.0 models.

## 1. Fast Typing Bundles & DOM Race Conditions

### The Optimization ("Fast Path")
To achieve high-performance automation, the framework implements a **Fast Path** for `type_text_at` tool calls. When the model returns multiple typing actions in a single turn, the `ToolExecutor` bundles them and executes a single JavaScript block that instantly updates all target elements.

### The Risk: Race Conditions
Modern web frameworks (React, Angular, Vue) track component state through synthetic events. Instantly mutating 5-10 form fields via JS can cause these frameworks to "lose focus" or drop inputs as validation logic and state updates collide.

*   **Gemini 2.5:** Typically batches 2-3 inputs. Safe for Fast Path.
*   **Gemini 3.0 Flash:** Highly aggressive; often batches 10+ inputs. Frequently triggers race conditions.

### The Solution: `disable_fast_typing_bundles`
We provide a configuration flag in the benchmark YAML to control this behavior:

```yaml
agent:
  context:
    disable_fast_typing_bundles: true  # Recommended for Gemini 3.0 Flash
```

When `true`, the executor bypasses JS injection and executes typing sequentially via standard Playwright mouse/keyboard simulation, ensuring 100% focus fidelity at the cost of execution speed.

---

## 2. Schema Hallucinations & `safety_decision`

### The Issue
Gemini models are trained with high safety alignment. When asked to perform consequential actions (like clicking "Create Order" or "Submit Payment"), the model may attempt to inject a `safety_decision` parameter into the tool call arguments to warn the user.

```json
{
  "name": "click_at",
  "args": {
    "x": 100, "y": 200,
    "safety_decision": { ... } // HALLUCINATION
  }
}
```

### The Crash
Because the Google GenAI SDK and the API validator expect a strict schema, injecting this unknown keyword argument causes a Pydantic validation error or a `400 INVALID_ARGUMENT` crash before the tool ever reaches the browser.

### The Solution: Prompt Constraints
Always include the following constraint in your `system_prompt` for any consequential tasks:

> `NEVER include a "safety_decision" parameter in your tool calls. The framework does not support it.`

---

## 3. The `finish` Tool (Explicit Termination)

### The Problem
The standard Computer Use API terminates when the model returns *zero* function calls. However, when models are asked to provide structured final output (like JSON), they often hallucinate their own termination tools (e.g., `javascript:window.finish()`) to "pass" the data.

### The Solution
We have added a first-class `@tool` called `finish` in `computer_use_eval/custom_tools.py`.

**Usage in YAML Goal:**
> `Use the finish tool to output the extracted Shipment Plan Id: finish(status="success", result_data={"id": "..."})`

**The Implementation:**
The `GeminiAgent` core loop intercepts this tool call. It allows all other actions in the same turn (like observations) to execute first, then gracefully terminates the run with the provided status and data.
