# Prompting Guide for Gemini Computer Use

This guide explains how to effectively prompt the Gemini agent for browser automation tasks, including customization, optimization, and best practices.

## 1. Customizing the System Prompt

The default system prompt is designed to encourage efficiency (batching) and accuracy. You can override it in your benchmark YAML file.

### Overriding in YAML

In your benchmark configuration, add an `agent` section with a `system_prompt`. You can use the `{{DEFAULT}}` placeholder to append or prepend your custom instructions to the core rules.

> **💡 Prompting Best Practice for Gemini 3.0:** Always wrap your custom instructions in XML tags (e.g., `<strategy>`, `<rule>`). The Gemini 3.0 models are highly tuned to differentiate between instructions and data when demarcated with XML.

```yaml
agent:
  system_prompt: |
    {{DEFAULT}}
    
    <project_rules>
    <rule>Always use "SHIP_TEST" as the default shipper if not specified.</rule>
    <rule>If you see an 'Unsupported Browser' warning, ignore it and continue.</rule>
    </project_rules>
```

If you omit `{{DEFAULT}}`, your prompt will **replace** the entire system instruction.

### Reference: The Default System Prompt
For transparency, here is the built-in system prompt (as of `computer_use_eval/prompts.py`). It utilizes strict XML-style tags (`<role>`, `<instructions>`, `<constraints>`), which is the recommended best practice for Gemini 3.0 Flash:

```text
<role>
You are a high-performance browser automation agent powered by Gemini 3.0 Flash. 
You control a Chromium browser using a 1440x900 viewport.
</role>

<instructions>
1.  **BATCHING & LATENCY (CRITICAL):**
    -   **Max Speed:** Execute ALL visible field interactions in one turn. Do not wait for a screenshot between filling fields if both are visible.
    -   **Stop Condition:** Break a batch ONLY when an action triggers a full page load, a modal popup, or a critical UI delta.
    -   Minimize turns! Group 5-20 actions if the UI state allows.

2.  **SPATIAL AWARENESS (1000-POINT GRID):**
    -   **Canvas:** The browser viewport is exactly 1440x900 pixels.
    -   **Coordinates:** All function arguments (x, y) MUST be on a 0-1000 scale. 
    -   **Translation:** The system automatically maps your 0-1000 coordinate to the 1440x900 canvas. (e.g., 500,500 maps to pixel 720,450).
    -   **Precision:** If an element is at the extreme edge, use 999 to ensure the click hits the hitbox.

3.  **VISUAL DELTA VERIFICATION:**
    -   **NO EXPLICIT WAITS:** The framework automatically waits for network idle and element stability.
    -   **Zero Delta:** If you take an action and the next screenshot is identical (Zero Delta), it means your action was ineffective.
    -   **Stuck:** If the screen still does not change after waiting, use `search_browser_state` immediately to inspect the DOM for hidden blockers.

4.  **STRICT TOOL USAGE:**
    -   **FORBIDDEN:** You are strictly forbidden from outputting the `open_web_browser` function. If you need to navigate, use `navigate`.
    -   **Focus:** Use the `active_element` and `url` metadata in the `function_response` turn to verify state. If `active_element` indicates focus is lost, re-click the target element.

5.  **STALEMATE RECOVERY:**
    -   If "Stagnation Detected" or "Repeated Action Failure" appears, you MUST switch strategies.
    -   Use `search_browser_state` with element-specific keywords (e.g. "Submit", "location") to debug coordinate drift or obscured elements.

6.  **EMPIRICAL CONCLUSIONS:**
    -   **Verification Required:** Never state a task is "Complete" based only on an action you just took.
    -   **Outcome Observation:** You MUST observe the resulting state in the NEXT screenshot to confirm the action succeeded before generating your final summary.
    -   **Evidence-Based:** Your final conclusion must be grounded in the visible state of the final screen.
</instructions>

<constraints>
- **ZERO NARRATION:** Zero-text policy. Your response should ideally consist of ONLY function calls. The "native" computer-use reasoning is handled by the harness; do not repeat it in text.
- **NO GUESSING:** You are strictly forbidden from guessing (x, y) coordinates.
- **Search First:** For every new screen or complex menu, you MUST call `search_browser_state` with relevant keywords to retrieve exact bounding boxes.
- **Grounding:** Every `click_at` and `type_text_at` call must be based on coordinates found in a tool response or clearly visible in a screenshot.
</constraints>

<format>
- Your response must consist of one or more function calls.
- If the task is complete, output a concise final summary as a text part in the final turn.
</format>
```

## 2. Action Batching (Efficiency)

The agent is instructed to group related actions into a single turn whenever possible. This is critical because each model turn (prediction) takes 5-10 seconds.

### Examples of Good Batching
*   **Form Filling:** Click and type in multiple fields in one turn.
    *   `click_at(x1, y1)`, `type_text_at(x1, y1, "Name")`, `click_at(x2, y2)`, `type_text_at(x2, y2, "Email")`
*   **Dropdown Selection:** Click the dropdown and then click the option.
    *   `click_at(dropdown_x, dropdown_y)`, `click_at(option_x, option_y)`

### When NOT to Batch
*   **Navigation:** `navigate(url)` should be its own turn, as the page must load before subsequent actions can be calculated.
*   **Dynamic UI:** If an action causes a modal to open or the page to reflow significantly, wait for the next turn.

## 3. Smart Input Handling

The pipeline includes specialized logic for complex HTML elements that standard "type" actions often struggle with.

### Time Fields (HH:MM)
When the agent detects a time value (e.g., "12:00"), it automatically triggers a "Smart Type" sequence:
1.  Clicks to focus the field.
2.  Clears the field using JavaScript.
3.  Types the digits sequentially.
This ensures that pre-populated values or masked inputs don't interfere with the entry.

## 4. Navigation & Scrolling

### Horizontal Scrolling
For wide tables (common in ERP systems), the agent should look for horizontal scrollbars.
*   **Tip:** Provide the agent with the specific (x, y) coordinates of the scrollbar track and instruct it to use `scroll_at(direction="right")`.

**Strategy 1:** 
Encourage the agent to rely on the framework's native `wait_until="networkidle"` capabilities instead of manual wait loops for page loading or success toasts.

## 5. Token Optimization

The pipeline automatically optimizes the context window to keep latency low:
*   **Screenshot Scrubbing:** Intermediate screenshots are removed from the history. Only the initial state and the current state are sent to the model.
*   **History Summarization:** Consecutive repetitive actions (like multiple scrolls) are condensed into a single text summary.

## 6. Porting to New Environments

The default system prompt is optimized for typical web forms (ERP). When porting to a new environment (e.g., a Desktop App via VNC, a Mobile App via Appium, or a Game), you should override the prompt to reflect the specific interaction patterns of that domain.

### Example: Porting to a Desktop App
In `config/benchmarks/desktop_app.yaml`:
```yaml
agent:
  system_prompt: |
    {{DEFAULT}}
    
    # DESKTOP APP SPECIFICS
    -   **Right-Click Menus:** Unlike web dropdowns, desktop context menus appear instantly. ALWAYS batch the right-click and the menu selection.
    -   **Double-Click:** Use `click_at(count=2)` for opening folders.
    -   **Waiting:** Desktop apps are faster than web pages. The framework automatically handles standard wait states, but long loading bars may require custom wait strategies.
```

### Key Principles for Portability
1.  **Identify Bottlenecks:** Is the app slow (Web) or fast (Native)? Adjust waiting rules accordingly.
2.  **Define Batching Logic:** What actions are "atomic" in your app? (e.g., In a terminal, `type_text` + `press_enter` is one unit).
3.  **Visual Cues:** Tell the agent what success looks like (e.g., "Wait for the green checkmark", "Wait for the prompt to reappear").

## 7. Managing Latency vs. Reliability

You asked: *"How do we make sure we are not adding too much latency with explicit wait states?"*

The answer lies in **Targeted Waiting**.

### The Problem
If the agent waits 5 seconds after every click "just to be safe", a 50-step task gains **4 minutes** of idle time.

### The Solution (Prompt Engineering)
Instruct the agent to wait **ONLY** when a specific condition is met:
*   **BAD:** "Wait after clicking buttons." (Too broad)
*   **GOOD:** "Wait after clicking 'Submit' or 'Save' to allow the backend to process."
*   **GOOD:** "Wait if you see a spinner or loading bar."

### The Solution (Code)
If you have access to the environment code (`playwright_env.py`), you can implement smarter waits:
*   `wait_for_load_state('networkidle')` (Web)
*   `wait_for_selector('.success-toast')` (Web)
*   Visual diffing (Wait until pixels stop changing)

By default, the `GeminiAgent` relies on visual observation. The system prompt should encourage it to **trust** that simple interactions (typing, clicking navigational links) are handled by the system's implicit micro-waits.
