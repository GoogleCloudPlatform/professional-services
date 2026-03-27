# Benchmark Configuration Guide

Benchmarks are defined using YAML files. This guide explains the structure and available options for configuring an evaluation task.

> **Tip:** For design patterns, robust assertion strategies, and benchmark best practices, see [Creating Robust Benchmarks](CREATING_BENCHMARKS.md).

## Example Configuration

```yaml
name: "Search Verification"
description: "Verify that searching for '42' works."

agent:
  model: "gemini-3.0-flash-preview"
  temperature: 0.1
  # Optional: Configure context memory strategy (Defaults to BALANCED)
  context:
    preset: "BALANCED" 
  system_prompt: |
    {{DEFAULT}}
    
    You are a research assistant.
    Navigate to google.com and search for '42'.
  max_steps: 20

task:
  start_url: "https://www.google.com"
  goal: "Find the meaning of life."

criteria:
  assertions:
    - type: "url"
      condition: "contains"
      value: "google.com/search"
```

## Sandbox Configuration (Agent Engine)

For enterprise-grade benchmarking or testing in isolated environments, you can run the agent in a **Vertex AI Agent Engine Sandbox**. This provides a managed, secure Chromium instance in the cloud.

### Infrastructure Setup
Before using the sandbox, you must provision the long-lived infrastructure. This only needs to be done once per project.

```bash
# Run the setup utility to enable APIs, create a service account, 
# and provision a long-lived Agent Engine.
python scripts/setup_sandbox_infra.py --project MY_PROJECT_ID
```

The script will output several environment variables. Add these to your `.env` file to enable sandbox mode.

### Global Sandbox Settings
These settings are typically defined in your `.env` file (prefixed with `GCP_`):

- **`USE_SANDBOX`**: Boolean. Set to `true` to enable sandbox execution.
- **`SANDBOX_PROJECT_ID`**: Your GCP Project ID.
- **`SANDBOX_LOCATION`**: GCP Region (e.g., `us-central1`).
- **`SANDBOX_SERVICE_ACCOUNT`**: The service account created by the setup script.
- **`SANDBOX_AGENT_ENGINE_NAME`**: The resource path of the long-lived Agent Engine. If omitted, the system will dynamically create a temporary engine for each run (much slower).

### How it Works
1. **Dynamic Routing:** If `USE_SANDBOX` is true, the system connects to the cloud sandbox. If false, it runs locally.
2. **Fail-Fast:** If sandbox mode is enabled but the connection fails, the run **crashes immediately** to prevent accidental local execution of enterprise tests.
3. **Lifecycle Management:** Ephemeral sandboxes are created for each run and automatically destroyed upon completion or interruption (Ctrl+C).

## Schema Details

### `name` (String)
A short, descriptive name for the benchmark.

### `description` (String)
A more detailed explanation of what the benchmark tests.

### `agent` (Object)
Configures the LLM agent's behavior.

- **`model`**: The Gemini model version to use (e.g., `gemini-3.0-flash-preview`).
- **`temperature`**: Controls randomness. Use `0.1` for deterministic evaluation.
- **`system_prompt`**: The core instructions for the agent. This should define the persona and any specific rules for the task.
- **`system_prompt_file`**: (Optional) Path to a Markdown file containing the system prompt. Overrides `system_prompt` if both are present. Path is relative to the benchmark YAML file.
- **`max_steps`**: (Optional) The maximum number of actions the agent can take before the task is marked as failed. Defaults to `50`.
- **`step_delay`**: (Optional) Float for the delay in seconds between agent steps. **Crucial for stability** in React-heavy apps to allow for state transitions and rate limiting.
- **`disable_fast_typing_bundles`**: (Optional) Boolean. If true, the agent types each character individually rather than in high-speed blocks. **Recommended for volatile models** or fields with strict input masks.

- **`context`**: (Optional) Configures the context optimization strategy.
    - **`preset`**: High-level strategy for token management:
        - `ACCURATE`: Keeps **all screenshots**. Best for short, high-precision tasks. (Loop Folding: OFF, Summarization: OFF).
        - `BALANCED`: (Default) Keeps a rolling window of the **last 5 screenshots**. Perfect for medium-length tasks. (Loop Folding: ON, Summarization: OFF).
        - `EFFICIENT`: Keeps initial goal + **last 3 screenshots**. Best for extremely long-running tasks. (Loop Folding: ON, Summarization: ON for middle turns).
        - `AGGRESSIVE`: Maximum context savings. Keeps **only the initial goal and the most recent 1 screenshot**, and forces `medium` image quality (75% scale). Best for bandwidth/token-constrained environments where the agent only needs immediate visual feedback. (Loop Folding: ON, Summarization: ON).
    - **`max_images_in_history`**: (Override) Number of intermediate screenshots to retain. `-1` to keep all.
    - **`image_retention_strategy`**: (Optional) Controls how older images are managed.
        - `aggressive`: (Legacy) Truncates history after `max_images_in_history`.
        - `variable_fidelity`: (Recommended) Keeps recent images at full resolution, but downscales older images to save tokens while preserving context.
        - `full_fidelity`: Keeps all images in history at full resolution.
    - **`image_quality`**: (Optional) Controls the resolution and compression of screenshots sent to the model.
        - `high`: (Default) Full resolution (scaled to max screen width). Best for reading small text but costs more tokens.
        - `medium`: Downscaled by 25% (75% scale) but retains color. Good balance of cost and fidelity.
        - `low`: Downscaled by 50% and converted to grayscale. Drastically reduces token cost (~75% reduction) for long tasks.
    - **`enable_compaction`**: (Override) Boolean to enable/disable lossless loop folding (Collapsing repetitive waits/scrolls).
    - **`enable_summarization`**: (Override) Boolean to enable/disable LLM-based middle-history summarization.
    - **`summarization_model`**: (Override) Model used for semantic summarization.
    - **`summarization_token_threshold`**: (Override) Token count threshold to trigger semantic summarization.
    - **`enable_context_caching`**: (Override) Boolean to enable/disable Vertex AI context caching to reduce Time-to-First-Token.
    - **`reflection_strategy`**: (Override) Enum string to define agent recovery behavior on failure or cyclic loops. 
        - `NONE`: Fail silently without intervention.
        - `NUDGE`: System performs a small, safe action (like a tiny scroll or wait) to try and "wake up" the UI before trying to reflect.
        - `INJECT`: The system automatically detects stalemates and injects semantic context (Aria tree matches and diagnostic supervisor advice) directly into the next turn. This uses a high-speed semantic model to bridge the gap between visual intent and hidden DOM elements, providing a clear explanation of *why* the agent is stuck.
    - **`thinking_level`**: (Optional) Controls the model's internal "thought process" complexity. Options are `LOW`, `MEDIUM`, `HIGH`. Supported by `gemini-3` models.
        - `LOW`: Standard output.
        - `MEDIUM`: Detailed planning.
        - `HIGH`: Deep reasoning and edge-case analysis.
    - **`stalemate_strict_threshold`**: (Override) Integer for the number of explicit action failures (e.g., clicks) before reflection triggers.
    - **`stalemate_loose_threshold`**: (Override) Integer for the number of navigational action failures (e.g., scrolling) before reflection triggers.
    - **`stalemate_history_window`**: (Override) Integer for the number of recent actions analyzed for cyclic loops.
    - **`model_api_retries`**: (Override) Integer for the maximum number of network retries when calling the Gemini API.

### `task` (Object)
Defines the environment and the objective.

- **`start_url`**: The initial URL the browser will navigate to.
- **`goal`**: The specific instruction passed to the agent as the first user message.

### `criteria` (Object)
Defines how success is measured.

#### `assertions` (List)
A list of automated checks performed at the end of the run.

- **`type`**: The type of check:
    - `url`: Checks the current browser URL.
    - `dom`: Checks for the presence or content of a DOM element (requires `selector`).
    - `script`: Executes custom JavaScript and expects a truthy return value (requires `code` or `code_file`).
- **`condition`**: How to evaluate the value:
    - `contains`: Checks if the value is a substring.
    - `matches_regex`: Performs a regular expression match.
    - `equals`: Exact string match.
- **`value`**: The expected value for the condition.
- **`selector`**: (For `dom` type) The CSS selector for the target element.
- **`code`**: (For `script` type) The JavaScript code to execute.
- **`code_file`**: (For `script` type) Path to a `.js` file containing the code. Overrides `code`. Path is relative to the benchmark YAML file.

## Best Practices

1.  **Use External Files:** Keep your YAML clean. Use `system_prompt_file` and `code_file` for long content.
2.  **Keep it Focused:** Each benchmark should test a single logical flow.
3.  **Clear System Prompts:** Be explicit about how the agent should interact with the specific UI.
4.  **Use Unique IDs:** If the task involves creating data, use the `{{UNIQUE_ID}}` placeholder in the `goal` to avoid collisions across runs.
