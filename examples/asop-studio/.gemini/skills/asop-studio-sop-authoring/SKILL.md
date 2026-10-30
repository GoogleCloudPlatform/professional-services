---
name: asop-studio-sop-authoring
description: Ultimate guide and specification for LLMs to author effective, actionable, optimized, and perfectly designed SOPs in the ASOP Studio YAML (SOP Version 2) format.
---

# ASOP Studio SOP Authoring Skill

This skill is the definitive specification and authoring guide for designing agentic Standard Operating Procedure (SOP) workflows in the ASOP Studio YAML format (SOP Version 2). It provides rules, syntax patterns, best practices, and anti-patterns for generating high-quality, actionable, and testable multi-file SOP projects optimized for graph-guided agent execution.

---

## 1. How Graph-Guided Execution Works

Before generating SOPs, you must understand how they are executed by the underlying runtime engine (`enter_node`). At every turn, the engine executes actions and routes deterministically:

1. **Programmatic Action Execution**: Upon entering a node, the engine sequentially runs all backend tool calls defined in the `actions` block. Their outputs are stored in `action_results` (e.g., `action_results.get_pizza_menu.result`).
2. **Programmatic Condition Evaluation**: The engine then evaluates any `condition_routes`. If a condition evaluates to true (based on variables in session state), the engine **automatically traverses** to the target node *within the same turn* without asking the LLM or user. It repeats steps 1 and 2 for the target node. It does this up to a depth of 10 nodes.
3. **LLM Instruction and Intent Prep**: Traversal pauses only when it reaches a node requiring user interaction (meaning it has `intent_routes` or is `END`). The engine returns the accumulated instructions, the action results, and the available user intent transitions.
4. **LLM Presentation & Input Parsing**: The LLM presents the information to the user using the accumulated instructions and action results. When the user replies, the LLM maps their response to one of the active `intent_routes`. If the route contains `set_variables`, the LLM extracts those parameters into session state, and initiates the next `enter_node` turn at the target node.

---

## 2. SOP Project Structure & Naming Conventions

To keep complex workflows maintainable, clean, and decoupled, ASOP Studio uses a multi-file project directory instead of a single monolithic file.

### Why Decompose Into Sub-flows?
Designing workflow graphs as decomposed sub-flows offers three critical advantages:
1. **Visual Simplicity**: Large monolithic flow graphs are too cluttered to easily read or edit. Sub-flows keep the React Flow canvas layout focused and responsive.
2. **Intent Collision Isolation**: The execution engine only activates intent routes from the currently active sub-flow (plus `main.yml` globals) at any given turn. This prevents unrelated customer queries from accidentally colliding and triggering incorrect paths.
3. **Avoided Duplication**: Decomposing allows developers to write common helper/utility flows (e.g., standard customer wrap-ups, support escalation) once and reuse them by simply routing to them from any other sub-flow.

### Directory Layout
An SOP project is stored in a dedicated directory under `data/sop/` named with lowercase kebab-case. Within the project directory:
*   **`main.yml`** (Required): The entry point of the SOP project. Execution starts at the `root_node_id` of this file. It typically handles global intent routing, initial triage, and general non-order intents (such as checking opening hours).
*   **Sub-flows (`*_flow.yml`)**: Focused, self-contained files representing sub-journeys (e.g., `customize-pizza-flow.yml`, `payment-delivery-flow.yml`).

### Naming Standards
Strict naming standards must be followed to ensure compatibility with code generators and visual layout engines:
*   **Flows, Folders, and Files**: Lowercase kebab-case (e.g., `pizza-order-flow.yml`, `data/sop/pizza-order-flow/`).
*   **Nodes**: Lowercase kebab-case (e.g., `customize-pizza-start`, `calculate-order-price`).
*   **Tools and Actions**: Snake_case (e.g., `get_pizza_menu`, `calculate_total_price`).
*   **Variables**: Snake_case (e.g., `session_customer_phone`, `chosen_pizza`).

### Input Variables Declaration
To ensure all variables given to the agent at the beginning of a conversation are properly declared and initialized with default values (allowing immediate agent testing), define them in the `input_variables` field under the top-level `flow` field in the main flow (`main.yml`). Each declaration must specify a type and a default value. Variables that are dynamically set or declared throughout the flows (e.g. via `set_variables` or `store_result_variable`) do not need to be declared under `input_variables`.

---

## 3. Core Specification Schema (SOP Version 2)

Each YAML file in the SOP project starts with the top-level `flow` element. Version 2 is required for projects utilizing typed variables or review requests.

```yaml
flow:
  id: <flow-id-matching-filename-without-extension>
  version: 2
  root_node_id: <starting-node-id>
  global_instructions: |
    # Global Behavioral Rules
    - Adapt tone based on customer sentiment.
    - Adapt instructions for accessibility.
  global_intent_routes: [...]
  input_variables: # Defined in main.yml to declare initial input parameters with defaults
    - name: <variable-name>
      type: <type, e.g. string, int, float, bool, enum[...] >
      default: <default-value>
  nodes:
    - id: <node-id>
      agent_instructions: <instructions-for-llm-relaying-results>
      actions: [...]
      condition_routes: [...]
      intent_routes: [...]
      review_requests: [...]

# Optional sibling at the root level of the main YAML file (e.g. main.yml)
example_journeys:
  - name: <journey-name>
    steps:
      - user_says: <utterance-text>
        agent_says: <agent-text>
        notes: <explanation-notes>
        current_flow: <flow-filename-or-id>
        current_node: <node-id>
        intermediate_nodes: [<node-id-1>, <node-id-2>] # Optional: list of node IDs traversed before reaching current_node
```

### Node Fields Reference

| Field | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `string` | Unique identifier for the node. The special reserved ID `"END"` terminates the process. |
| **`agent_instructions`** | `string` | Verbatim instructions for the LLM detailing what to tell the user and how to present tool results. |
| **`actions`** | `list` | Programmatic actions executed sequentially by the engine *before* routes are evaluated. |
| **`condition_routes`** | `list` | Rules evaluated programmatically against active variables. Traversals are resolved immediately. |
| **`intent_routes`** | `list` | Transitions evaluated by the LLM based on user response, including parameter extraction. |
| **`review_requests`** | `list` | Design or technical review metadata embedded directly in the workflow. |

---

## 4. Action Blocks & Mock Responses

In ASOP Studio, backend tool execution is driven programmatically by the state machine controller, **not** by the LLM. The LLM never directly executes tool calls. 

Therefore, actions must be defined strictly in the `actions` array of a node, never in the `agent_instructions`.

### Action Block Structure
```yaml
actions:
  - type: tool
    tool_name: get_order_status
    tool_params:
      phone: session_customer_phone
      order_id: order_id
    store_result_variable: order_info
    mock_responses:
      default: {"order_found": false, "status": "none", "eta": ""}
      active_delivery: {"order_found": true, "status": "out_for_delivery", "eta": "12 minutes"}
```

### Key Rules for Actions:
1.  **Mock Journeys**: Mock responses are crucial for testing. The engine falls back to `default` if the active journey ID is not found. Model multiple testing scenarios consistently across nodes using the same journey IDs (e.g., `active_delivery`, `active_pickup`) to simulate coherent end-to-end paths.
2.  **Mock Payload Envelope**: When running, tool results are enclosed in a `{"result": ...}` envelope. Mock responses must also reflect this structure.
3.  **Clean Parameters**: Map tool argument names (keys) to session variables (values). Always ensure the mapped session variable has been initialized or assigned before this action runs.
4.  **Storing Action Results**: By default, tool results are only visible to the LLM in the turn they are called (returned as part of tool execution output) but are *not* preserved in session state and cannot be referenced in subsequent condition routes. To reference tool outputs in downstream `condition_routes`, you **must** assign them to a variable using the **`store_result_variable`** field in the action definition.
5.  **Nested Fields / Dot Notation**: When a tool result (which is typically a JSON object/dictionary) is stored in a session variable via `store_result_variable` (e.g. `order_info`), downstream conditions can query its fields using a JQ-like dot notation (e.g., `order_info.order_found == true` or `order_info.status == 'out_for_delivery'`).

---

## 5. Transitions & Routing Rules

Transitions between different flow files or nodes are defined directly inside route definitions using the following rules:

### Destination Resolution
1.  **`target_flow` only**: Transition to the target flow file. Execution starts at the target flow's defined `root_node_id`.
    ```yaml
    - intent: "Customer wants to customize their pizza"
      target_flow: customize-pizza-flow.yml
    ```
2.  **`target_flow` and `target_node`**: Transition to the target flow file, bypassing its root node and starting execution directly at the specified `target_node`.
    ```yaml
    - condition: "order_info.order_found == true"
      target_flow: main.yml
      target_node: explain-order-status
    ```
3.  **`target_node` only**: Standard local transition to another node within the *same* flow file.
    ```yaml
    - intent: "Customer asks about today's opening hours"
      target_node: explain-hours
    ```

### Global Intent Routes
To make main triage options (such as ordering a pizza, tracking an order, or transferring to support) active at every turn throughout the conversation, define them in the **`global_intent_routes`** array at the top level of the flow in the **`main.yml`** file. 
*   **Automatic Inheritance**: The runtime engine automatically inherits `global_intent_routes` from the main flow (`main.yml`) and makes them active in all other sub-flows.
*   **Do NOT Duplicate**: Do not define these main triage routes locally in the start nodes of every sub-flow. That creates redundant visual elements, increases code duplication, and causes routing errors.

---

## 6. Strict Variable Typing (SOP V2)

SOP Version 2 enforces strict typing for session parameters extracted via `set_variables` in intent routes. This guarantees that conditional state evaluations do not fail due to formatting inconsistencies.

### Supported Types:
*   `int`: Integer values.
*   `float`: Decimal/floating-point values.
*   `bool`: Boolean values (`true` or `false`).
*   `string`: Free-text values. **CRITICAL:** Use `string` *only* for unstructured values that will not be evaluated in downstream condition routes.
*   `enum[val1,val2,...]`: A predefined set of expected string values.

> [!IMPORTANT]
> **Enum vs. String**: Any variable that is evaluated in downstream `condition_routes` (e.g., `payment_method == 'card'`) **must** be typed as an `enum` containing all possible conditions. This prevents the LLM from extracting inconsistent formats (e.g., extracting "Card" instead of "card").

```yaml
intent_routes:
  - intent: "Customer specifies a payment method"
    target_node: confirm-card-payment
    set_variables:
      - name: payment_method
        type: "enum[card,cash]"
```

---

## 7. Review Requests Metadata

SOP Version 2 supports embedding review requests on nodes, actions, and routes to track technical or design feedback directly in the codebase.

> [!IMPORTANT]
> **Strict Enum Type**: The `topic` field is restricted by the schema to be either `"TECHNICAL"` or `"DESIGN"`. No other values (such as custom topics) are permitted.

```yaml
review_requests:
  - id: "rev-cust-01"
    date: "2026-06-16T15:30:00Z"
    topic: DESIGN # Must be either DESIGN or TECHNICAL
    from: "UX Design Team"
    reason: "Confirm if toppings should be selected via multi-select rather than conversational loop."
    resolved: false
```

---

## 8. Interactive Example Journeys

To validate and test SOP routing paths and behavior immediately within ASOP Studio, authors are strongly encouraged to define **Interactive Example Journeys**. 

Example journeys serve as test suites that model end-to-end conversation flows. They are visualized in ASOP Studio via a player control panel and a step-by-step chat conversation log. Clicking on an example allows users to step forward/backward through turns, while the visualizer automatically focuses on the relevant nodes and switches active sub-flow files.

### Schema Definition
The `example_journeys` block is defined as a list at the root level of the main YAML file (sibling to `flow:`).

```yaml
example_journeys:
  - name: "Description of the Journey (e.g. Pizza Customization Journey)"
    steps:
      - agent_says: "What the agent responds or does at this turn (optional)"
        user_says: "What the user says at this turn (optional)"
        notes: "Explanation of what is happening or why this transition was made"
        current_flow: name-of-the-flow-file-or-id (e.g. main.yml)
        current_node: target-node-id (e.g. welcome-node)
      - agent_says: "Welcome to Luigi's Pizza! How can I help you today?"
        user_says: "Yes, I want to order a new pizza"
        notes: "Matches intent route to customize-pizza-flow.yml"
        current_flow: customize-pizza-flow.yml
        current_node: customize-pizza-start
        mock_journey: "active_delivery" # Optional: mock journey to configure mock tool responses
```

### Specifying Dialog Turns
An example journey is built as a sequential series of dialog turns. Inside each turn/step:
* **`agent_says`** (string, optional): The utterance showing what the agent says or executes at this node (e.g. greeting, result, or prompting choices).
* **`user_says`** (string, optional): The customer response at this step that matches one of the defined intent routes from the current node.
* **`notes`** (string, optional): Commentary detailing what happens behind the scenes (e.g. tool execution parameters or state evaluations).
* **`current_flow`** (string, required): The flow file name or flow ID where this turn takes place.
* **`current_node`** (string, required): The exact node ID where this turn resides.
* **`intermediate_nodes`** (list of strings, optional): List of node IDs expected to be traversed before reaching the `current_node` (useful if a programmatic transition traverses multiple nodes in a single turn).
* **`mock_journey`** (string, optional): The mock journey ID expected for configuring mock tool responses. When present, it tells the exporter to set the `ui__mock_journey` variable at this turn.

By specifying both `agent_says` and `user_says` at each step, you create a rich, double-sided conversation transcript that is played back dynamically inside the ASOP Studio Player.

### Key Authoring Rules for Example Journeys:
1. **Always Add Journeys**: You should include at least one positive (success) journey and one negative/escalation journey to verify all parts of your SOP.
2. **Path Accuracy**: Make sure that the `current_flow` and `current_node` properties in every step match actual file names and node IDs defined within the SOP.
3. **Step Sequentiality**: Steps should represent chronological turns in a conversation. Keep the utterances (`user_says` and `agent_says`) realistic.
4. **Mock Journeys Alignment**: Whenever a mock journey includes nodes that run actions, it is good practice to specify which mock journey to follow via the `mock_journey` field, and make sure that mock responses are defined accordingly. The typical case is for the mock journey to be set in the first turn only, so that it covers the whole test case. Sophisticated journeys (e.g. when it is needed to call the same tool twice, each with different responses, may change the mock journey in the intermediate steps to fulfill the purpose).

---

## 9. Best Practices for Graph-Guided SOPs

To write perfectly designed, clean, and highly optimized SOPs, follow these rules:

### Rule 1: Never Instruct the LLM to Run Tools
The engine runs the tool *before* the LLM sees the node. Instructions must only guide the LLM on how to present the results.
> [!CAUTION]
> **Incorrect:**
> `agent_instructions: "Call calculate_total_price() to calculate the total price."`
> 
> **Correct:**
> `agent_instructions: "Review the action_results. Inform the customer of the total price: {{action_results.calculate_total_price.result.total_price}}"`

### Rule 2: Programmatic Branching Must Use Condition Routes
Any logic checking tool results or state variables (e.g., whether `order_info.order_found == true`, `placement_status.success == true`) **must** be implemented as a `condition_routes` block on the node.
*   **Do NOT encode branching instructions in text**: Stating "If the order fails, tell the user and transfer to support" in the `agent_instructions` without a programmatic condition route is a critical error. The engine will not transition, leaving the agent in a broken state.
*   **Automatic Traversal**: Using condition routes allows the engine to immediately transition to the correct node, accumulating instructions, and presenting a unified response to the user.

### Rule 3: Condition Expressions Must Follow Strict Syntax
Conditions are evaluated programmatically by a Python expression parser. They must be syntactically valid and cannot contain free text.
*   **Supported Syntax**: `variable == value`, `variable != value`, `variable > value`, `variable IS NULL`, `variable IS NOT NULL`, `true`, `false`, and logical joins (`AND`, `OR`).
*   **Nested Path Dot Notation**: Downstream condition routes can query fields of dictionaries stored using `store_result_variable` using dot-notation (e.g., `order_info.order_found == true` or `price_details.total_price > 15`).
*   **No Free Text**: Conditions like `condition: "if the order was successfully placed"` are invalid and will crash the parser. Use proper comparisons like `condition: "placement_status.success == true"` or `condition: "order_info.order_found == false"`.

### Rule 4: All Input Variables Must Be Predefined in Input Variables
Every initial conversation input variable referenced in a condition or in `tool_params` must be declared and initialized under `input_variables` in the main flow (`main.yml`) with a default value.
*   Declare them with a valid `type` and a sensible `default` value (e.g. `""`, `0`, `false`).
*   Variables that are declared and populated throughout the flows (e.g. via `set_variables` in preceding intent routes, or stored via `store_result_variable` in tool actions) do NOT need to be declared under `input_variables` in `main.yml`.
*   Ensure any variable referenced in a condition or tool parameter is either defined in `input_variables` or initialized/assigned prior to being used.

### Rule 5: Combine Actions and Instructions in a Single Node
Avoid separating tool execution and LLM responses into distinct consecutive nodes (e.g., a "fetch-data" node transitioning via `condition: "true"` to a "tell-data" node).
*   Because the controller executes actions before the LLM takes its turn, a single node should contain both the `actions` and `agent_instructions` for displaying them. This simplifies the graph and prevents redundant execution turns.

### Rule 6: Avoid Legacy Bot or IVR Terminology
This is a modern generative AI virtual assistant. Do not use terminology from telephone keypad (IVR) or button-based bots.
*   **Incorrect**: "Customer wants to return to the main menu", "Go back to start menu", etc.
*   **Correct**: "Customer wants to order another pizza", "Customer wants to ask about a different option", etc.

### Rule 7: Do Not Repeat Intent Lists in Instructions
Do not list all possible user choices or intents inside the `agent_instructions` text block. The LLM dynamically receives the defined `intent_routes` for the node. Duplicating them in text leads to prompt bloat, inconsistency, and confusion.

### Rule 8: Clean Lifecycle Terminations
Ensure every conversational thread reaches a definitive exit:
*   Transitioning to the `"END"` node to close the interaction.
*   Looping back to the main flow triage node when a sub-task is successfully resolved, allowing the user to ask for help with other issues.

### Rule 9: Design Reusable Sub-flows for Common Utility Patterns
Rather than duplicating wrap-up, feedback, or manager escalation instructions across multiple specialized sub-flows, extract them into dedicated utility flows (e.g., `wrap-up-flow.yml` or `support-flow.yml`).
*   When a specialized journey finishes, route it directly to the utility flow via `target_flow: wrap-up-flow.yml`.
*   Within the utility flow, handle the common logic (e.g., asking if there's anything else) and transition back to `main.yml` if the customer has additional requests, or to `END` if they do not.

---

## 10. Ultimate SOP Authoring Checklist

Use this checklist to validate any authored SOP file before publishing:
- [ ] Every flow starts with a top-level `flow` element (not `sop`).
- [ ] Filenames, flow IDs, and folder names are in lowercase kebab-case.
- [ ] Nodes are in lowercase kebab-case.
- [ ] Action names, tool names, and variables are in snake_case.
- [ ] Version is set to `2` if utilizing typed variables or review requests.
- [ ] No `agent_instructions` contain directives to call or run tools/methods.
- [ ] Any logic checking tool results or state parameters is represented as a `condition_routes` block, NOT just as text inside `agent_instructions`.
- [ ] All condition expressions are syntactically valid (no free text) and parseable by the engine.
- [ ] All initial conversation input variables are declared under `input_variables` in the main flow (`main.yml`) with default values. Variables declared dynamically throughout the flows do not need to be declared there.
- [ ] Downstream conditional variables are typed as `enum[...]` rather than `string`.
- [ ] Global/cross-flow routing (such as ordering a pizza, tracking an order, or transferring to support) is defined as `global_intent_routes` in the main flow (`main.yml`) and not duplicated inside sub-flows.
- [ ] No legacy IVR or keypad-bot terminology like "main menu" is used in intent descriptions.
- [ ] `agent_instructions` do not redundantly list the available intent routes/options.
- [ ] No empty "fetch-only" nodes exist; actions and instructions are consolidated into single combined nodes.
- [ ] Action blocks contain `mock_responses` with consistently named testing journeys, including a `default` fallback.
- [ ] Any `review_requests` elements have the `topic` field set strictly to `"TECHNICAL"` or `"DESIGN"`.
- [ ] Common utility flows (wrap-ups, manager escalations) are extracted into reusable sub-flow files rather than duplicated across specialized flows.
- [ ] Optional `example_journeys` block is defined at the root level of the main flow to provide interactive walkthrough test suites.
- [ ] All step references (`current_flow`, `current_node`, and optional `intermediate_nodes`) inside the example journeys point to existing files and node IDs.

---

## 11. Comprehensive Example SOP Project

Here is a complete, fully compliant three-file SOP project demonstrating all the above specifications. The source files are stored in the skill directory:
*   [main.yml](file:///Users/dariochi/work/google/asop-studio/.gemini/skills/asop-studio-sop-authoring/main.yml)
*   [customize-pizza-flow.yml](file:///Users/dariochi/work/google/asop-studio/.gemini/skills/asop-studio-sop-authoring/customize-pizza-flow.yml)
*   [payment-delivery-flow.yml](file:///Users/dariochi/work/google/asop-studio/.gemini/skills/asop-studio-sop-authoring/payment-delivery-flow.yml)
