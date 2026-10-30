# CLI Capabilities

ASOP Studio features a fully-featured command-line interface (CLI) named `asopcli` that enables users to work with agentic workflows and SOP specifications entirely offline.

## Command-Line Commands

The CLI exposes two primary command groups under the `asopcli` namespace:

### 1. Exporting SOPs

Export a SOP workflow from a source (ZIP file, YAML file, or folder) to a target file in a specific format:
```bash
asopcli export sop [--format <zip|yaml|visualizer>] <SOURCE> <TARGET>
```
* **Arguments**:
  - `source`: Source path to load (directory, `.zip` archive, or unified `.yaml` file).
  - `target`: Output file path.
* **Options**:
  - `-f, --format <format>`: Export format (one of `zip`, `yaml`, `visualizer`). Default is `zip`.

### 2. Exporting Agent Blueprints

Export a SOP workflow from a source (ZIP file, YAML file, or folder) into ADK or CXAS agent blueprints:
```bash
asopcli export agent [--format <adk|cxas>] [--engine <fully-agentic|graph-guided>] <SOURCE> <TARGET>
```
* **Arguments**:
  - `source`: Source path to load (directory, `.zip` archive, or unified `.yaml` file).
  - `target`: Output file path.
* **Options**:
  - `-f, --format <format>`: Export format (one of `adk`, `cxas`). Default is `adk`.
  - `-e, --engine <engine>`: Execution engine / mode (one of `fully-agentic`, `graph-guided`). Default is `fully-agentic`.

### 3. Mounting Sub-Agents to CXAS

Mount a SOP workflow as a sub-agent into an existing CXAS agent (ZIP package or folder):
```bash
asopcli export cxas-mount [--sub-agent <SUBAGENT-NAME>] [--engine <fully-agentic|graph-guided>] [--prefix <PREFIX>] [--agent] [--global-instructions] [--prompt-guard] [--golden-evals] [--scenario-evals] <SOURCE> <TARGET>
```
* **Arguments**:
  - `source`: Source path to the SOP workflow (directory, `.zip` archive, or unified `.yaml` file).
  - `target`: Target path to the existing CXAS agent (directory or `.zip` package).
* **Options**:
  - `-s, --sub-agent <subagent>`: The name of the sub-agent to mount into (created if missing, replaced if present). Defaults to the flow ID / project name from the SOP.
  - `-e, --engine <engine>`: Execution engine (one of `fully-agentic`, `graph-guided`). Default is `fully-agentic`.
  - `-p, --prefix <prefix>`: Prefix for child agents and framework tools to prevent collisions.
  - `--agent`: Mount the SOP subagent itself (subagent files, root agent registration, framework tools, variable declarations).
  - `--global-instructions`: Mount/overwrite global instructions.
  - `--prompt-guard`: Mount/overwrite prompt guardrail.
  - `--golden-evals`: Mount golden evaluation test cases.
  - `--scenario-evals`: Mount scenario evaluation test cases.
  *(Note: By default, all resources are mounted. If at least one selector flag is set, only the selected resources will be mounted.)*

---


## Architectural & Design Decisions

### 1. Reusing Core Format Plugins
To keep import and export logic centralized, the CLI leverages the exact same formatting plugins defined in `src/core/formats/` (e.g. `adk.ts`, `cxas/`, `visualizer.ts`, `yaml.ts`, `zip.ts`, `registry.ts`).

### 2. Transient Workspace Isolation
When processing a single-file SOP (like a unified YAML file or a zipped archive), the CLI spins up a temporary directory using Node's `fs.mkdtempSync` under the OS's temp directory. It then imports the source into this directory to recreate the split flow structure, runs the export format handler on the prepared directory, writes the result to the destination target file, and cleans up the temp directory. Folders are processed directly without generating temporary workspaces.

### 3. Dynamic Package-relative Asset Resolution
Since the CLI can be run from any directory on the user's system, relative template/blueprint lookups using `process.cwd()` fail. To resolve this, a robust asset resolver `getAssetsPath` is implemented in `src/core/formats/utils.ts`. It walks up the file system from the execution module (`import.meta.url`) to find the package root and locate directories like `src/core/assets/` or `dist/` dynamically.

### 4. Bundled Output & Binary Mapping
The CLI is written in TypeScript (`src/cli/cli.ts`), bundled using `esbuild` to `dist-server/cli.js`, and mapped to the `asopcli` binary using the `bin` field in `package.json`.
