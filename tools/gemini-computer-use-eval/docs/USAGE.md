# Usage Guide: Computer Use Evaluation

This guide covers how to execute, configure, and analyze Computer Use evaluations using the CLI.

## 1. Running Evaluations

The primary entry point is the `computer-eval` command.

### Basic Run
Run a specific benchmark task defined in a YAML file.

```bash
uv run computer-eval --benchmark config/benchmarks/google_search.yaml
```

### Specifying Models (`-m`)
You can override the default model defined in `.env` or the YAML config using the `-m` flag.

```bash
uv run computer-eval \
  --benchmark config/benchmarks/google_search.yaml \
  --model gemini-3.0-flash-preview
```

### Matrix Testing (`--resolutions`)
Test the agent's robustness across different screen sizes. The pipeline will run the benchmark for each resolution specified.

```bash
uv run computer-eval \
  --benchmark config/benchmarks/responsive_design.yaml \
  --resolutions 1920x1080,1280x720,1024x768
```

### Safety Modes (`--safety-mode`)
Control how the agent handles "High Stakes" safety warnings from the model.

*   `interactive` (Default): Pauses execution and asks the user for Y/N confirmation.
*   `auto-approve`: Automatically confirms all actions. **Use for CI/CD.**
*   `auto-deny`: Automatically rejects all actions. Use for testing safety triggers (Red Teaming).
*   `auto`: Automatically selects `auto-approve` if running in headless mode, otherwise uses `interactive`.

```bash
# Run in CI mode (no human interaction)
uv run computer-eval \
  --benchmark config/benchmarks/risky_task.yaml \
  --safety-mode auto-approve
```

### Batching with Batch ID (`--batch-id`)
Group related runs together for analytics. This is especially useful for tracking experiments or nightly builds.

```bash
uv run computer-eval \
  --benchmark config/benchmarks/google_search.yaml \
  --batch-id nightly_run_01
```

## 2. Running Batch Suites (`computer-batch`)

The `computer-batch` command allows you to run multiple benchmarks in a single session. It automatically groups them under a unique `batch-id`.

```bash
# Run all benchmarks in the config folder
uv run computer-batch "config/benchmarks/*.yaml"
```

### Customizing the Batch ID
```bash
uv run computer-batch "config/benchmarks/*.yaml" --batch-id experiment_v2
```

## 3. Customizing Context

The quality of the "Computer Use" agent depends heavily on the context provided in the System Prompt.

### Using Project-Specific Context Files
You can inject dynamic context into your benchmark definitions using **Jinja2 templating**.

**1. Define Context in Environment**
Set variables in your `.env` file or export them in your shell.
```bash
export COMPANY_POLICY_CONTEXT="Always use the corporate VPN for internal tools."
```

**2. Reference in Benchmark YAML**
```yaml
agent:
  system_prompt: |
    You are an IT support agent.
    
    POLICY CONTEXT:
    {{COMPANY_POLICY_CONTEXT}}
    
    Execute the following task...
```

## 4. Analyzing Results

Results are saved to `artifacts/<task_name>/<run_id>/`.

### Output Files
1.  **`result.json` (Executive Summary):** A lightweight summary of the run, containing success status, judge scores, and metadata. This is the primary file for reporting and dashboarding.
2.  **`history.json` (Detailed Trace):** Contains the full conversation history, including reasoning, actions, and tool responses. Use this for deep debugging.
3.  **`videos/`:** Screen recordings of the task execution (WebM).
4.  **`trace.zip` (Optional):** Playwright execution trace for low-level environment debugging.

### Success Metrics
The pipeline uses three primary metrics to determine performance:

1.  **`global_success` (Boolean):** The "Hard Pass." True only if the agent succeeded in **every** resolution tested in the matrix.
2.  **`adaptability_score` (Float 0-1):** The percentage of resolutions that passed. Measures how sensitive the agent is to screen size changes.
3.  **`autonomy_score` (Float 0-1):** The percentage of steps completed without human intervention.
4.  **`aggregates` (Object):** The average quality scores across all resolutions for each judge (Assertion, Visual). This provides a "Resolution-Agnostic" view of the agent's logic.

### Hybrid Success Logic
An individual run (within a resolution) is marked as `success: true` if:
*   The **Assertion Judge** passes (1.0) **OR**
*   The **Video Judge** passes (>= 0.8).

### Example `result.json`
```json
{
  "run_id": "run_20260106_120000",
  "batch_id": "nightly_run_01",
  "timestamp": "2026-01-06T12:00:00.000000",
  "benchmark": "config/benchmarks/google_search.yaml",
  "name": "google-search",
  "config_snapshot": { ... },
  "global_success": true,
  "adaptability_score": 1.0,
  "autonomy_score": 1.0,
  "total_input_tokens": 15400,
  "total_output_tokens": 450,
  "safety_trigger_count": 0,
  "intervention_count": 0,
  "aggregates": {
    "assertion": 1.0,
    "visual": 0.9
  },
  "resolutions": {
    "1280x720": {
      "success": true,
      "judges": {
        "assertion": {
          "score": 1.0,
          "reasoning": "PASS: URL matched..."
        },
        "visual": {
          "score": 0.9,
          "reasoning": "Agent interaction was smooth.",
          "ux": "Good efficiency."
        },
        "trace": {
          "reasoning": "Auto-Evaluation Score: 5/5",
          "failure_analysis": "None",
          "fix_prompt": "None"
        }
      }
    }
  }
}
```

## 5. Benchmark Configuration Guide

Benchmarks are defined in YAML files. Here is the schema reference.

### Structure

```yaml
name: "Task Name" # Appears in reports
description: "Human-readable description"

# Agent Configuration
agent:
  model: "gemini-3.0-flash-preview" # Optional override
  temperature: 0.1
  system_prompt: |
    You are a helpful assistant...
    TASK: ...
  context:
    preset: "BALANCED"
    reflection_strategy: "INJECT" # NONE, NUDGE, or INJECT
    thinking_level: "MEDIUM"     # LOW, MEDIUM, or HIGH
  # Optional: Register custom Python tools
  custom_tools:
    - "path/to/my_tools.py:my_tool_function"

# Task Configuration
task:
  start_url: "https://www.google.com" # Optional: Navigates here before agent starts
  goal: "Search for X and verify Y." # The prompt sent to the agent

# Hooks Configuration (Optional)
hooks:
  before_run: "path/to/hooks.py:log_start"
  after_step: "path/to/hooks.py:check_safety"

# Judge Criteria (The Source of Truth)
criteria:
  assertions:
    - type: "url"
      condition: "matches_regex"
      value: "google\\.com/search"
    
    - type: "dom"
      selector: "#result-stats"
      condition: "exists"
      
    - type: "script"
      code: "return document.body.innerText.includes('Result')"

  # 2. Video/LLM Judge Keys (Visual/Logic Validation)
  # The entire dictionary is passed to the LLM. You can add extra instructions here.
  visual_success_criteria: "The results page must be fully loaded."
  forbidden_actions: "Do not click on Ads."
```

## 6. Advanced Usage & Extensibility

For complex scenarios, you can extend the evaluation pipeline with custom Python logic.

*   **Custom Tools:** Register your own Python functions as tools for the agent.
*   **Hooks:** Run custom code before the run, after each step, or after the run.
*   **Dynamic Config:** Use a Python script to generate configuration at runtime.

See the full guide: [Extending Computer Use Eval](guides/EXTENDING.md).

For deep customization (modifying core actions or middleware), see [Extending Core](guides/EXTENDING_CORE.md).
