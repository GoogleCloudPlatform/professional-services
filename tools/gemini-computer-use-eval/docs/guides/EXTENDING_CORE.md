# Extending the Core Pipeline

This guide is for developers who want to modify or extend the internal mechanics of the `computer-use-eval` framework (e.g., adding new core browser actions, custom judges, or middleware).

> **Note:** For adding business logic, custom tools, or hooks *without* modifying core code, see the [Extending Guide](EXTENDING.md).

## 1. Overview

The core execution system follows a decoupled architecture:
*   **`BaseAction` (Interface):** Abstract base class for all browser interactions.
*   **`ActionExecutor` (Registry):** Maps tool names to actions and supports **Middleware**.
*   **`ToolExecutor` (Facade):** A unified executor that handles both Browser Actions and Custom Python Tools.

## 2. Custom Browser Actions

Core browser actions (like `click`, `type`) are implemented in `computer_use_eval/actions/__init__.py`.

### Step 1: Create the Action Class

Inherit from `BaseAction`. You can use `self.denormalize` to convert the model's 0-999 coordinates into pixel values based on the current viewport.

```python
from typing import Dict, Any
from computer_use_eval.actions.base import BaseAction
from computer_use_eval.browser.playwright_env import PlaywrightEnv

class HoverAction(BaseAction):
    async def execute(self, env: PlaywrightEnv, args: Dict[str, Any]) -> Dict[str, Any]:
        # Convert normalized coordinates to pixels
        x, y = self.denormalize(args["x"], args["y"], env.viewport_size)
        
        await env.page.mouse.move(x, y)
        return {"status": "ok"}
```

### Step 2: Register the Action

Add your new action to the `ActionExecutor` registry in `computer_use_eval/actions/__init__.py` or load it dynamically via `agent.custom_actions` in the YAML configuration.

```python
class ActionExecutor:
    def __init__(self):
        self.actions = {
            "click_at": ClickAction(),
            "hover_at": HoverAction(), # Your new action
        }
```

### Step 3: Expose the Schema to the Model (CRITICAL)

Even though your new action is registered in the engine, the Gemini model won't know it exists unless it's in the tool schema! 

To bridge this gap with zero friction:

1. Create a "dummy" Python function with the exact same name and argument names, decorated with `@tool`. 
2. The framework parses the docstrings and type hints to generate the JSON schema.
3. Because browser actions take precedence in `ToolExecutor`, the real `HoverAction` will be executed instead of the dummy Python function.

Add this to `computer_use_eval/custom_tools.py` (or your own custom tools file):

```python
from computer_use_eval.custom_tools import tool

@tool
def hover_at(x: int, y: int) -> str:
    """
    Hovers the mouse at the specified x, y coordinates (0-1000 scale).
    """
    pass
```

4. Finally, make sure the tool is enabled in your benchmark YAML:

```yaml
agent:
  custom_tools:
    - "computer_use_eval.custom_tools:hover_at"
```

## 3. Middleware

Middleware allows you to intercept actions before and after they execute. This is used for cross-cutting concerns like Safety, Logging, and Dialog handling.

### Implementing Middleware

Inherit from `ActionMiddleware` in `computer_use_eval/core/middleware/base.py`.

```python
from computer_use_eval.core.middleware.base import ActionMiddleware

class MyLoggingMiddleware(ActionMiddleware):
    async def before_action(self, action_name, args):
        print(f"About to run {action_name}...")
        return action_name, args, True  # Return True to continue execution

    async def after_action(self, action_name, args, result):
        print(f"Finished {action_name}")
        return result
```

## 4. Custom Judges

Judges evaluate the outcome of a benchmark run.

### Create the Judge Class

Inherit from `BaseJudge` in `computer_use_eval/evaluation/judge.py`.

```python
from computer_use_eval.evaluation.judge import BaseJudge
from computer_use_eval.browser.playwright_env import PlaywrightEnv

class MyDatabaseJudge(BaseJudge):
    async def evaluate(self, env: PlaywrightEnv, criteria: dict) -> dict:
        # Check database state here...
        return {"score": 1.0, "explanation": "Success"}
```

## 5. Plugin Discovery (Advanced)

The framework also supports loading actions via `entry_points`. If you are developing a separate package, add this to your `pyproject.toml`:

```toml
[project.entry-points."computer_use.actions"]
my_custom_tool = "my_package.module:MyCustomAction"
```

The pipeline will automatically discover and load this action on startup.
