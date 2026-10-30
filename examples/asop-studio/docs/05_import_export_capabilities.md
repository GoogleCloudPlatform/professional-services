# Import & Export Capabilities

This document details the architectural layout, UI components, and API specification for importing and exporting Standard Operating Procedure (SOP) workflow packages.

---

## Architectural Layout

ASOP Studio supports programmatic and user-driven importing/exporting of SOP projects. To avoid running a separate backend process, these capabilities are integrated into a **Vite Dev Server Middleware** via a custom Vite plugin ([vite-api-plugin.ts](../vite-api-plugin.ts)).

The plugin acts as a router that delegates import and export tasks to modular format handlers. Each format handler is implemented as an independent TypeScript module in the [src/server/formats/](../src/server/formats/) directory, registered in the format registry ([src/server/formats/registry.ts](../src/server/formats/registry.ts)), and implements the `FormatModule` interface defined in [src/server/formats/types.ts](../src/server/formats/types.ts).

### Format Handler Interface

Every format handler implements the following signature:

```typescript
export interface FormatModule {
  id: string;
  import?: (options: ImportOptions) => Promise<ImportResult> | ImportResult;
  export?: (options: ExportOptions) => Promise<ExportResult> | ExportResult;
}
```

This makes it extremely straightforward to support a new import/export format by simply creating a new module in the `server/formats/` directory and adding it to the registry.

---

## API Specification

### 1. List Projects
* **Endpoint**: `GET /api/sops`
* **Description**: Scans the `data/sop/` directory. Reads all sub-folders containing `.yml`/`.yaml` files, maps them, identifies the main entrypoint file, and returns them as a structured catalog.
* **Response Format**:
  ```json
  {
    "pizza-order-flow": {
      "mainFile": "main.yml",
      "files": {
        "main.yml": "...raw yaml content...",
        "customize-pizza-flow.yml": "...raw yaml content..."
      }
    }
  }
  ```

### 2. Import Project
* **Endpoint**: `POST /api/sops/import?name=<name>&format=zip|yaml|visualizer|folder`
* **Headers**: `Content-Type: application/octet-stream` (for ZIP/YAML/HTML binary) or `Content-Type: application/json` (for folder imports)
* **Body**: Raw binary data of the ZIP archive/YAML file/HTML visualizer, or a JSON payload of `{ files: { [filename]: content } }` representing a local folder's YAML files.
* **Description**: Sanitizes the provided name, creates/overwrites the folder `data/sop/<name>/`, writes the extracted/uploaded flow files to disk, and runs SOP version consistency validations.
  * **ZIP Extract**: Extracts all entries. If files are wrapped inside a single top-level folder inside the ZIP, it automatically moves them up one level.
  * **YAML Split**: If a unified YAML containing a top-level `flows` block is uploaded, it splits the sub-flows and mounts them as individual files. If a single-flow YAML containing a top-level `flow` block is uploaded, it mounts it as `main.yml`.
  * **Visualizer HTML Extraction**: Reads the uploaded `.html` visualizer file, extracts the embedded unified SOP YAML from the `<script id="sop-data">` element, and delegates to the YAML importer.
  * **Folder Upload**: Processes a list of files sent via JSON, saving only the `.yml` and `.yaml` files into the project directory.

### 3. Export Project
* **Endpoint**: `GET /api/sops/<name>/export?format=zip|yaml|visualizer|adk|cxas`
* **Description**: Packs and returns the target SOP project in the requested format.
  * **`zip` (Raw Files)**: Creates a ZIP archive containing all files from the `data/sop/<name>/` directory.
  * **`yaml` (Unified YAML)**: Merges all sub-flows under a single `flows:` root key in a single YAML file.
  * **`visualizer` (Self-Contained HTML)**: Generates a single self-contained HTML page that embeds the client application (JavaScript and CSS bundled inline), base64-encoded favicon, and the unified SOP YAML data (base64-encoded) within a `<script id="sop-data" type="application/yaml" data-encoding="base64">` block. The page runs fully offline (double-clicked local files) displaying an identical read-only view of ASOP Studio with load/export options hidden.
    * **`adk` (Agent Development Kit)**: Generates a complete, valid Agent Development Kit package in a ZIP. It structures the package with an `adk.json` manifest and an `agent.py` compilation script. It supports two execution engine modes:
      * **Fully Agentic Mode**: Generates a specialized sub-agent for each sub-flow (converting flow nodes into XML-formatted steps inside instructions) and registers them under a root coordinator `Agent`. Peer-to-peer delegation is handled natively by Gemini using `{@AGENT: sub_agent_name}` instructions.
      * **Graph-Guided Mode**: Generates a single `flow_agent` child agent responsible for traversing the graph. Uses the `enter_node` Python function to dynamically track state, evaluate condition routes, run actions, and transition between sub-flows, and the project-specific `start_<FLOW-NAME>_flow` tool to initialize the agent state with an optimized version of the SOP JSON (with redundant `example_journeys` and `global_instructions` stripped to minimize payload size). The `enter_node` tool accepts `node_id`, `flow_id`, and `set_variables`. The `flow_agent` instructions explicitly enforce using `flow_id` for flow transitions. To enable immediate testing of the SOP without requiring users to type trigger phrases like "test the SOP", the coordinator (`main`) agent uses a `before_model_callback` Python callback. This callback automatically runs the start flow tool and triggers an immediate agent transfer to `flow_agent` upon conversation start.
      * **Native Python Literals (WASM Pyodide)**: Mock tool responses and the graph-guided start flow `FLOW_SPEC` are formatted directly as pure Python dictionary literals (`True`, `False`, `None`) via an in-memory WebAssembly Pyodide runtime at export time, removing runtime `json.loads` overhead and redundant imports (`json`, `base64`).
      * **Note**: Guardrails are not supported in ADK exports. If a Prompt Guard is defined in the SOP, a warning banner is shown in the export panel, and the prompt guard will be omitted from the exported ADK package.
    * **`cxas` (CX Agent Studio)**: Generates a complete, valid CX Agent Studio blueprint ZIP package. It structures `app.json`, `environment.json`, and `agents/main/` based on a minimal blueprint.
      * **Graph-Guided Mode**: Supports two architecture variants configurable via the `DEFAULT_CXAS_GRAPH_GUIDED_VARIANT` constant (`'multi-agent-subflows'` by default, with `'single-agent-flow-loader'` preserved as legacy):
        * **Multi-Agent Subflows Architecture (Default)**: Generates one dedicated sub-agent per sub-flow (with root agent `main` implementing the main flow). Each sub-agent is equipped with a dedicated, flow-specific enter node tool (`<flow_name>_enter_node`) that embeds the sub-flow's SOP specification directly as a pure Python dictionary literal alongside a vendorized, self-contained decision tree traversal and condition evaluation engine (isolated below a clear vendor comment header). This eliminates intermediate `tools.enter_node(...)` RPC invocations, avoids clogging the UI traceback with large JSON payloads, speeds up tool execution, and ensures all sub-tools executed during node actions appear clearly in CXAS tracebacks. The agent hierarchy tree is constructed such that `main` connects to flows it directly references and child agents only claim unassigned sub-flows (strictly enforcing the CXAS single-parent tree rule). Inter-flow transfers and first-turn root/target node entries are executed deterministically in `beforeModelCallbacks`: transfers via `Part.from_agent_transfer(agent=target_agent)` whenever a transition points to another flow, and initial/re-entered node executions via `Part.from_function_call(name=<flow>_enter_node, args={"node_id": target_node, "set_variables": {}})` when `int__current_flow_id` is distinct from the active flow ID, removing redundant first-turn LLM inference overhead. Agent instructions strictly enforce that all transitions (including cross-flow transitions) must be performed by calling the active agent's `<flow_name>_enter_node` tool with the target node and flow, explicitly prohibiting manual hard agent transfers when matching transitions exist and designating handoffs to `main` strictly as an unhandled fallback of last resort.
        * **Single-Agent Flow Loader Architecture (Legacy)**: Generates a single `flow_agent` child agent responsible for traversing the whole graph. To enable immediate testing of the SOP without requiring users to type trigger phrases like "test the SOP", the coordinator (`main`) agent is configured with a `beforeModelCallbacks` Python callback. This callback automatically runs the project-specific `start_<FLOW-NAME>_flow` initialization tool (which injects the optimized SOP JSON with `example_journeys` and `global_instructions` stripped to improve performance) and triggers an immediate agent transfer to `flow_agent` upon conversation start.
      * In both modes, if global instructions are defined in the main flow (`main.yaml`), they are exported to a `global_instruction.txt` file and linked in `app.json` via the `globalInstruction` key.
      * If a **Prompt Guard** is defined in `main.yaml`, it is compiled to a GCP AI Guardrail configuration: a reference is added under `guardrails: ["asop_prompt_guardrail"]` in `app.json`, and the guardrail JSON containing the custom security policy and prompt is written to `guardrails/asop_prompt_guardrail/asop_prompt_guardrail.json`. If no Prompt Guard is specified in the SOP, no guardrail files or configurations are exported.
      * In both modes, all generated sub-agents are automatically equipped with the default `end_session` tool to support session termination, and any declared custom tools are dynamically generated as sandboxed python tools. When the `END` node is reached, graph-guided `enter_node` instructions and fully agentic agent step instructions direct the LLM to terminate the conversation, and in CXAS graph-guided exports, `flow_agent` or `<flow>_enter_node` is instructed to invoke `{@TOOL: end_session}`. The generated python tools contain a map of mock responses mapped to the corresponding user journeys defined in the YAML flow specification (formatted as native Python dictionary literals via Pyodide WASM), retrieve the active journey name via the agent's `ui__mock_journey` variable (falling back to the first available key in `mock_responses` if the specified journey is not present in the dictionary), and automatically assign the result to the corresponding runtime session/state variable (e.g. `sop__<store_result_variable>`) if `store_result_variable` is defined on the action.
      * In both export modes (Graph-Guided and Fully Agentic), any defined `example_journeys` in the SOP are compiled and exported as automated evaluation test cases under `evaluations/`:
        * **Golden cases** (stored in `evaluations/golden_<sanitized_name>/golden_<sanitized_name>.json`, with displayName prefixed with `"Golden - "`):
          * In **Graph-Guided Mode**, they assert the exact sequence of user inputs, the expected agent responses, and the target nodes visited via the flow-specific `<flow>_enter_node` tool (including any traversed `intermediate_nodes`). When an example journey reaches the `END` node, an `end_session` tool call expectation is automatically included. Deterministic condition routes (orange) are automatically traversed by `<flow>_enter_node` at runtime and are excluded from expectations unless connected by both intent and condition routes.
          * In **Fully Agentic Mode**, they assert the sequence of user inputs, the expected agent responses, the agent transfers to specialized child flow agents, the explicit invocation of custom business tools defined under node actions, and `end_session` tool call expectations when reaching the `END` node.
          * In both modes, agent messages per turn are grouped cleanly without leaking responses into subsequent turns, and if a step contains the optional `mock_journey` field, the compiled test case will automatically include a "set variable" turn setting the `ui__mock_journey` variable to that mock journey before processing the turn.
        * **Scenario cases** (stored in `evaluations/scenario_<sanitized_name>/scenario_<sanitized_name>.json`, with displayName prefixed with `"Scenario - "`): Work identically in both modes under the hood by providing a single script-replication task prompt to the agent (a static instruction blurb followed by a dialogue script extracted from the journey steps) and checking for semantic compliance over a flexible turn limit (`maxTurns`).
  * **`tools-signatures` (PDF Report)**: Generates a technical PDF documentation report of all tools defined across the SOP project. The PDF clearly displays each tool's name, parameter list, parameter types, return type/variable, mock responses, and a list of all flows and nodes where the tool is used.


---

## UI Components

1. **Header Load Dropdown**: Replaces the old project selector. Displays the active SOP project name (or "None Loaded" if fresh) along with a "Load SOP" button. Clicking the button opens a glassmorphic dropdown offering two choices:
   * **File**: Triggers a file browser accepting `.yml`, `.yaml`, or `.zip` files.
   * **Folder**: Triggers a folder browser (using `webkitdirectory`) allowing the user to upload a directory of flow specs.
2. **Canvas Welcome Overlay**: Shown when no active SOP is loaded. Offers a premium centered dashboard with direct action buttons to load files or folders, prompting the user with supported file formats.
3. **Export Side Panel**: Displays inside the right sidebar container (replacing the Inspector). Organized into three categories via interactive accordion items:
   * **SOP**: Export as raw ZIP archive, unified single YAML file, or offline standalone visualizer HTML.
   * **Agent**: Export as CX Agent Studio blueprint or ADK package with execution engine modes (Fully Agentic, Graph-guided).
   * **Reports**: Select report types (currently "Tools and signatures") to generate technical PDF documentation reports listing all tools, parameters, parameter types, return types, and their usage locations across flows and nodes.
4. **Auto-Switching Panel Focus**: Selecting a canvas node or edge will automatically toggle the right panel back to the Inspector view, ensuring a seamless visual workflow.

---

## Automated Testing

### 1. Unit Testing
Automated unit tests for core import, export, and sub-agent mounting functionalities are powered by [Vitest](https://vitest.dev/) and located in `tests/`:

* `tests/import.test.ts`: Tests single YAML, unified SOP YAML, ZIP (including folder unwrapping), and Visualizer HTML parsing and validation logic.
* `tests/export_sop.test.ts`: Tests ZIP, Unified YAML (with fixture snapshot structure matching and V2 metadata validation), and Visualizer HTML export generation (with asset inlining assertions), alongside losslessness roundtrip import testing.
* `tests/export_agent.test.ts`: Tests ADK and CXAS agent blueprint export generation in both `fully-agentic` and `graph-guided` execution modes.
* `tests/export_reports.test.ts`: Tests tool extraction, parameter typing, return type resolution, node usage mapping, and PDF report generation for "Tools and signatures".
* `tests/mount_agent.test.ts`: Tests mounting sub-agents into CXAS targets, validating tool consistency errors on targets missing required tools and successful mounting on targets with tools.

Run unit tests using:
```bash
npm test
```

### 2. End-to-End (E2E) Testing
To verify that exported self-contained visualizer HTML files can be opened and parsed by a real browser without syntax, CORS, or asset loading errors, browser-based E2E tests are powered by [Playwright](https://playwright.dev/):

* `tests/visualizer.e2e.ts`: Generates a standalone offline visualizer, opens it using Chromium via the `file://` protocol, and asserts that no console/syntax errors are thrown, the React Flow canvas renders correctly with graph nodes, and the Inspector panel updates successfully when a node is clicked.

Run E2E tests using:
```bash
npm run test:e2e
```

> [!NOTE]
> Make sure the project has been built (`npm run build`) before running the E2E tests, as the tests verify offline visualizer rendering using the generated templates in the `dist/` directory.
