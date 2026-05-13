# Guide: Creating Robust Benchmarks

This guide explains how to create reliable, deterministic benchmarks for the Computer Use pipeline. A benchmark is defined by a YAML file in `config/benchmarks/`.

## 1. The Anatomy of a Benchmark

A benchmark YAML file has three critical sections:
1.  **`agent`**: The prompt and persona.
2.  **`task`**: The goal and starting state.
3.  **`criteria`**: The logic used to grade success (without using AI).

## 2. Best Practices for `assertions`

The `criteria.assertions` list is the **Assertion Judge**. It runs a series of checks (URL, DOM, Script). If **all** assertions pass, the task is a hard success (Score: 1.0).

### 🛑 Common Mistakes
*   **Single-line Fragility:** `text_contains: "Success"` is risky. It might match "Success" in a unrelated menu item or footer.
*   **Rigid Selectors:** `selector: "#page > div > div > span"` breaks if the UI layout changes slightly.
*   **Page Dependency:** Assuming the agent ends on the exact same URL every time (agents wander!).

### ✅ Best Practice: The "Smart Scan" Pattern

Use a **Script Assertion** with an IIFE (Immediately Invoked Function Expression) for complex logic.

```yaml
criteria:
  assertions:
    - type: "script"
      code: |
        (() => {
          // 1. Define what we are looking for (using the unique ID from this run)
          const targetName = "test-item-{{UNIQUE_ID}}";
          
          // 2. Scenario A: Agent is on the Item Detail Page
          const title = document.querySelector(".title-text")?.innerText.trim();
          if (title === targetName) {
             // Verify status is green/enabled
             const indicator = document.querySelector(".indicator-pill.green")?.innerText;
             return indicator && indicator.includes("Enabled");
          }

          // 3. Scenario B: Agent navigated back to the List View
          const rows = Array.from(document.querySelectorAll(".list-row"));
          const targetRow = rows.find(r => r.innerText.includes(targetName));
          if (targetRow) {
              return targetRow.innerText.includes("Enabled");
          }

          // 4. Default: Failure
          return false;
        })()
```

### Key Principles for JS Conditions:

1.  **Use `{{UNIQUE_ID}}`:** Never use static names (e.g., "Test Item"). If a previous run failed to clean up, your next run might "succeed" by finding the old item. `{{UNIQUE_ID}}` ensures you verify *this* specific run.
2.  **Use Optional Chaining (`?.`):** Web pages are dynamic. `document.querySelector(".missing")?.innerText` returns `undefined` safely, whereas `.innerText` would crash the script.
3.  **Check Multiple States:** Agents are unpredictable. If your task is "Create Invoice", check:
    *   Is the Invoice open on screen?
    *   OR, is the Invoice listed in the summary table?
4.  **Verify State, Not Just Existence:** Don't just check if the item exists. Check if it is `"Enabled"`, `"Submitted"`, or `"Paid"`.

## 3. Best Practices for Agent Prompts

### The "Critical Rule" Pattern
If a specific UI interaction is known to be flaky (e.g., a React dropdown that ignores fast typing), explicitly instruct the agent on the mechanics.

```yaml
agent:
  system_prompt: |
    You are controlling ERPNext.
    
    CRITICAL RULE for Dropdowns:
    1. Click the field.
    2. Type the value.
    3. WAIT for the suggestion list.
    4. CLICK the suggestion. (Do not just press Enter).
```

### Idempotency
Always use the injected `{{UNIQUE_ID}}` in your task instructions so the agent generates unique data.

```yaml
task:
  goal: |
    Create a new customer named "Customer-{{UNIQUE_ID}}".
```

### Managing Action Batches
The pipeline uses **Smart Batching** to increase speed. By default, the agent is encouraged to perform multiple actions per turn (e.g., filling an entire form).

If your benchmark requires the agent to verify the UI state after *every* single action (e.g., a reactive field that changes the rest of the form), you should:
1.  Instruct the agent in the `system_prompt` to: "Perform only one action at a time and verify the result before proceeding."
2.  Alternatively, the pipeline's **Perception Guards** will automatically cancel a batch if the URL changes or a significant DOM shift occurs.

## 4. URL Assertions
The `url` assertion is a fast-fail check. Make it permissive enough to handle sub-pages.

*   **Bad:** `value: "^https://site.com/app/item/my-item$"` (Fails if query params exist or if on list view).
*   **Good:** `value: ".*app/item.*"` (Matches item list, item details, and sub-settings).

```yaml
criteria:
  assertions:
    - type: "url"
      condition: "matches_regex"
      value: ".*app/item.*"
```

---
**Summary:** A robust benchmark assumes the agent might take a weird path to the right destination. Grade the **outcome**, not the path.
