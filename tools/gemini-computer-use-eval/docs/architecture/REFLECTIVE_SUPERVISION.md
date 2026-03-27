# Reflective Supervision Middleware

The **Reflective Supervision Middleware** is a reliability layer that sits between the Agent and the Tool Executor. Its primary goal is to detect when the agent is stuck in a failure loop or an unproductive state and provide "meta-cognitive" feedback (Reflection) to help the agent recover autonomously.

## Core Concepts

### 1. Reflect & Retry
When an action fails (e.g., `Element not found`), the middleware doesn't just return the error. It:
1.  **Counts Failures:** Tracks consecutive failures for the specific action.
2.  **Injects Guidance:** Appends a `reflection_guidance` field to the result.
3.  **Escalates:**
    *   **Attempts 1-2:** Encourages retry or parameter adjustment.
    *   **Max Retries:** Suggests a complete strategy shift (e.g., "Try searching instead of clicking").

### 2. Cyclic Loop Detection (Stalemate)
Agents often get stuck in "Oscillating Loops" where they repeat a sequence of actions that results in no net progress (e.g., Scroll Down -> Wait -> Scroll Up -> Wait).

To solve this mathematically, the middleware implements two advanced algorithms instead of naively matching action strings:

**1. State-Action Transition Graph (State Cycle Detection):**
We treat the session as a directed graph where nodes are hashed UI states (ARIA hashes) and edges are the actions taken. The middleware tracks a `state_history` of cryptographic hashes of the DOM state. 
If the agent transitions `State A -> Action X -> State B -> Action Y -> State A`, the system detects that it has returned to a previously seen state and triggers a cycle intervention. This natively understands that repeating an action is fine as long as the state is progressing, but returning to an old state means the agent is stuck in a loop.

**2. Information Gain (Entropy) Delta (Stagnation Detection):**
Instead of looking at the actions, we look at the delta of the observation space. The middleware uses a **Mutation-Gated Native Accessibility Snapshot** approach to compute Information Gain:
*   A fast Javascript `MutationObserver` runs in the browser. If the DOM hasn't mutated (`window.ui_changed == false`), the snapshot is skipped entirely ($O(1)$ overhead), and Information Gain is instantly calculated as $0$ (Stagnation).
*   If the DOM *did* mutate, the framework calls Playwright's native C++ accessibility tree (`accessibility.snapshot()`) and hashes it (ignoring transient noise like cursors or volatile timestamps).
*   If `Hash(Before) == Hash(After)`, the Information Gain is $0$.
*   If the agent issues $N$ actions in a row with $0$ Information Gain, it is stuck, regardless of what actions it is spamming (e.g., clicking an unclickable element repeatedly).

When a loop or stagnation is detected, the middleware **modifies the Tool Output** returned to the model. Instead of a standard success message, the agent sees a structured XML warning:

```xml
<system_warning>
<type>State Stagnation Detected</type>
<details>The UI state has not changed after a loop of 2 consecutive actions.</details>
<analysis>Oscillating behavior detected: You are repeating the same sequence of actions without progress.</analysis>
<directive>You MUST verify your current state and attempt a COMPLETELY DIFFERENT strategy to proceed.</directive>
</system_warning>
```

**Mechanism of Action:**
1.  **Intervention:** The middleware intercepts the tool result before it reaches the agent's context window.
2.  **Injection:** It appends the `stalemate_warning` string to the observation.
3.  **Persuasion:** This system message acts as a strong "stop sign," breaking the agent's internal chain-of-thought and prompting it to re-evaluate its plan (e.g., switching from "Scroll" to "Search").

## Configuration

Reflective Supervision is set to **`NONE` by default** to ensure standard benchmarks fail fast without interference. To enable it, update your benchmark YAML configuration:

```yaml
agent:
  context:
    reflection_strategy: "INJECT" # Options: NONE, NUDGE, INJECT
    
    # Optional Tuning:
    stalemate_strict_threshold: 5  # Trigger after 3 failed explicit actions (clicks, types)
    stalemate_loose_threshold: 15  # Trigger after 10 failed navigational actions (scrolls)
```

### Reflection Strategies

The framework offers a spectrum of strategies to break an agent out of a stalemate, ranging from zero-intervention to advanced semantic extraction.

#### 1. Baseline & Psychological Strategies
*   **`NONE`**: The middleware is completely disabled. The agent is left to figure it out on its own. Use this for strict baseline benchmarks.
*   **`NUDGE`**: The system performs a small, safe action (like a tiny scroll or wait) to try and "wake up" the UI. This is often enough to trigger a re-render or finish an async load.

#### 2. Auto-Injection (INJECT)
Visual agents often ignore complex developer tools because using them breaks their internal "I am a standard user clicking a website" persona. 

**Auto-Injection (`INJECT`)** solves this transparently. When the agent fails or loops, the middleware automatically captures the hidden Playwright ARIA tree and uses a high-speed semantic model (Gemini 2.5 Flash Lite) to analyze the failure.

This purely semantic approach provides two critical pieces of information:

1.  **Supervisor Advice:** A diagnostic explanation of *why* the agent is stuck (e.g., "The button is disabled because the form is incomplete" or "The element is currently obscured by a loading spinner").
2.  **Semantic Search:** It bridges the "Vision-DOM Gap" by finding elements that match the agent's *intent*, even if the text labels are different (e.g., matching "Login" to a button labeled "Continue").

The injected context also includes **Semantic Location Hints** (e.g., `[Location: Off-screen below (requires scrolling DOWN)]`) to help the agent accurately target elements.

> The **`INJECT`** strategy is highly effective for overcoming structural barriers but may carry a minor latency cost compared to `NONE` or `NUDGE`. It provides resilience by giving the agent both the meta-cognitive "why" and the technical "what" it needs to course-correct.

## Architecture

The logic resides in `computer_use_eval/core/middleware/stalemate_detection.py`.

```python
class StalemateDetectionMiddleware(ActionMiddleware):
    def after_action(self, action, args, result):
        # 1. Check for Error
        if result['error']:
            return self.inject_reflection(result)

        # 2. Check for State Cycles and Stagnation
        cycle_len = self._detect_state_cycle()
        if cycle_len > 0 or self.stagnation_counter >= self.stagnation_threshold:
            return self.inject_stalemate_warning(result)

        return result
```

## Troubleshooting & Observability

When the middleware triggers, it logs warnings to the console/file:

```
WARNING - 🔔 [NUDGE] Injected stalemate warning into function response: <system_warning>...
```

If you see this in your logs, it means the system successfully identified a stuck agent and attempted to intervene.
