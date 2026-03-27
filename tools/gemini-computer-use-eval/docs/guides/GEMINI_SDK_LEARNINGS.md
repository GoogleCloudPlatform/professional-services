# Gemini SDK & API Learnings

During the integration of the `gemini-3-flash-preview` model and the `computer_use` tool, we discovered two critical behaviors in the Google GenAI SDK and the Gemini API backend that dictate how the framework must be structured.

## 1. Automatic Function Calling (AFC) and `maximum_remote_calls`

When supplying tools to the Gemini `GenerateContentConfig`, there is an `automatic_function_calling` dictionary.

**The Discovery:**
Setting `{"disable": True}` is **insufficient** to stop the Python SDK from attempting to automatically execute tools. If `maximum_remote_calls` is left unset (which defaults to 10), the SDK will still intercept the tool call loop before returning control to the caller.

**The Code Evidence:**
In the SDK's `google/genai/_extra_utils.py`, the `should_disable_afc` function is responsible for turning off AFC.
It checks if `maximum_remote_calls` is `<= 0`. If it is, it forcibly disables AFC:

```python
# google/genai/_extra_utils.py (lines 425-433)
  if (
      config_model
      and config_model.automatic_function_calling
      and config_model.automatic_function_calling.maximum_remote_calls
      is not None
      and int(config_model.automatic_function_calling.maximum_remote_calls) <= 0
  ):
    logger.warning('max_remote_calls... is less than or equal to 0. Disabling automatic function calling.')
    return True
```

However, if `disable` is set to `True` but `maximum_remote_calls` is positive, it logs a warning and **leaves AFC enabled** (or acts unpredictably based on the tools provided). Because we execute actions manually via Playwright (and our tools aren't simple Python callables injected into the SDK), the SDK crashes if it tries to execute them. 

**The Solution:**
We must explicitly set `"maximum_remote_calls": 0` alongside `"disable": True` to guarantee the SDK yields the raw `FunctionCall` to our framework.

## 2. The `computer_use` Tool and Sequential Validation

Gemini 3.0 Flash often attempts **parallel function calling** (e.g., returning multiple `type_text_at` calls in a single turn's `parts` array) to speed up tasks.

**The Discovery:**
The backend validation schema for the built-in `computer_use` tool is strictly sequential. If we execute those parallel calls and return a single User turn containing an array of `FunctionResponse` objects, the Gemini API backend throws a `400 INVALID_ARGUMENT` error:
`Each Function Response must be matched to a Function Call by name.`

The backend expects a strict 1:1 conversation ping-pong (`Model -> User -> Model -> User`) when dealing with `computer_use` state, unlike standard tools which allow parallel arrays.

**The Solution (History Linearization):**
We retain parallel *execution* for speed (batching multiple inputs in Playwright), but when we record the actions into the `HistoryManager`, we "unroll" them into a sequential timeline. 
For a turn where the model outputs `[Call A, Call B]`, we record:
1. Model (Call A)
2. User (Response A)
3. Model (Call B)
4. User (Response B)

This perfectly satisfies the backend validator while keeping agent execution fast.

## 3. High-Concurrency Models and DOM Race Conditions

The framework implements a "Fast Path" execution optimization: if the model outputs multiple `type_text_at` commands in a single batch, the framework intercepts them and injects custom JavaScript to set all the form values simultaneously without waiting for individual typing animations.

**The Discovery:**
While this works perfectly on static HTML forms, it causes severe DOM race conditions in modern reactive frameworks (like React or Angular). When multiple fields are mutated instantly via JavaScript, React's virtual DOM reconciliation loop can crash or randomly drop inputs. This is especially prevalent with high-speed, highly concurrent models like `gemini-3.0-flash` which aggressively output parallel tool calls to maximize speed.

**The Solution:**
We introduced the `disable_fast_typing_bundles: true` configuration flag. When enabled, the framework bypasses the Fast Path optimization. Instead of injecting JavaScript to set values simultaneously, it strictly executes each `type_text_at` command sequentially, physically typing the characters into the browser. This provides the necessary "breathing room" for React's state management to process each input individually, stabilizing form entry at the cost of a few milliseconds of latency.