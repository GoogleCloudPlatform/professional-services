# Extending Computer Use Eval: Custom Tools & Hooks

This guide explains how to extend the Computer Use Evaluation Pipeline with custom logic, tools, and lifecycle hooks *without* modifying the core codebase. This is ideal for adding business logic, complex validations, or integrations with external systems.

## 1. Overview

The framework supports three main extension points:
1.  **Custom Tools:** Allow the agent to call arbitrary Python functions (e.g., `calculate_tax`, `lookup_user`).
2.  **Lifecycle Hooks:** Run custom code at specific points (`before_run`, `after_step`, `after_run`).
3.  **Dynamic Configuration:** Modify the benchmark configuration at runtime using a Python script.

## 2. Custom Tools

Custom tools are standard Python functions that the agent can invoke. They are automatically converted into tool definitions for the LLM.

### Defining a Tool

Create a Python file (e.g., `my_tools.py`) and define your function. **Type hints and docstrings are required**, as they are used to generate the tool schema for the model.

```python
# my_tools.py

def calculate_shipping(zip_code: str, weight: float) -> float:
    """
    Calculates shipping cost based on zip code and weight.
    
    Args:
        zip_code: The 5-digit destination zip code.
        weight: Package weight in lbs.
    """
    if zip_code.startswith("9"):
        return weight * 1.5
    return weight * 1.0
```

### Registering the Tool

In your `benchmark.yaml`, add the function path to the `agent.custom_tools` list:

```yaml
agent:
  custom_tools:
    - "my_tools.py:calculate_shipping"
```

The format is `path/to/file.py:function_name`.

## 3. Lifecycle Hooks

Hooks allow you to execute code at specific stages of the evaluation process.

### Available Hooks

| Hook Name | Signature | Description |
| :--- | :--- | :--- |
| **`before_run`** | `(config: dict) -> None` | Called before the benchmark starts. Can modify the configuration in place. |
| **`after_step`** | `(step: int, history: list) -> None` | Called after each agent step. Useful for monitoring or safety checks. |
| **`after_run`** | `(result: dict) -> None` | Called after the benchmark completes. Useful for custom reporting or cleanup. |

### Implementing Hooks

Create a Python file (e.g., `my_hooks.py`):

```python
# my_hooks.py

def validate_safety(step: int, history: list):
    """
    Example: Check if the agent navigated to a forbidden URL.
    """
    if not history:
        return
        
    last_turn = history[-1]
    # ... (inspect history for URL or actions)
    print(f"Step {step} validated.")

def log_start(config: dict):
    print(f"Starting benchmark: {config.get('name')}")
```

### Registering Hooks

In your `benchmark.yaml`, add the hook paths to the `hooks` section:

```yaml
hooks:
  before_run: "my_hooks.py:log_start"
  after_step: "my_hooks.py:validate_safety"
```

## 4. Dynamic Configuration

Sometimes static YAML isn't enough (e.g., you need to generate a unique ID, fetch a secret, or derive parameters). You can use a **Config Script** to modify the configuration at runtime.

### Implementing a Config Loader

Create a Python file (e.g., `config_loader.py`):

```python
# config_loader.py
import os
import uuid

def load_dynamic_config(config: dict) -> dict:
    """
    Receives the loaded YAML config and returns a dictionary to merge.
    """
    return {
        "task": {
            "start_url": os.environ.get("START_URL", "https://default.com"),
            "unique_run_id": str(uuid.uuid4())
        }
    }
```

### Usage

Run the benchmark with the `--script` argument:

```bash
uv run computer-eval \
  --benchmark my_benchmark.yaml \
  --script config_loader.py:load_dynamic_config
```

The returned dictionary will be merged into the base configuration.

> **Tip:** You can also use the `{{UNIQUE_ID}}` environment variable in your YAML or Python scripts. This variable is automatically generated for every run (e.g., `0120_a1b2`) to help you create unique resources.

## 5. Deeper Customization

If you need to add new browser actions or change how the agent thinks, see [Extending the Core Pipeline](EXTENDING_CORE.md).

## 6. Examples

See the `examples/custom_hooks_demo/` directory for a complete, runnable example that demonstrates all these features in action.
