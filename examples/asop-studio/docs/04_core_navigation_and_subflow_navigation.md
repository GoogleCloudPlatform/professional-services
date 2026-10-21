# Core Navigation and Sub-flow Navigation

This document explains the implementation and architecture of core SOP project navigation and interactive sub-flow linking in ASOP Studio.

## Architecture & Implementation Overview

To support modular agentic workflows, large Standard Operating Procedures (SOPs) are decomposed into a directory representing an **SOP Project** containing a required `main.yaml`/`main.yml` and multiple sub-flow files (e.g. `customize-pizza-flow.yml`).

### 1. Dynamic SOP Directory Loading

The application dynamically lists and parses the files under `data/sop/` at runtime:
- **Vite Glob Imports**: We use Vite's `import.meta.glob('../data/sop/**/*.y*ml', { query: '?raw', eager: true })` to read files on-disk.
- **SOP Project Grouping**: Files are grouped by their parent directory name (the SOP name). Any directory lacking a `main.yaml` or `main.yml` is ignored as an invalid SOP.
- **Dynamic Selection**: The user selects the active SOP via the dropdown in the header, which automatically loads its entrypoint (`main.yaml` or `main.yml`).

### 2. SOP Navigator Sidebar (Accordion Layout)

The flat step navigator is upgraded to the **SOP Navigator**:
- **Resizable Width**: Users can dynamically resize the width of the SOP Navigator sidebar by dragging its right edge handle.
- **Accordion Design**: Each file in the current SOP is rendered as an accordion panel. The active file is automatically expanded by default.
- **Constituent Node List**: Expanding an accordion reveals the list of steps/nodes defined in that specific YAML file.
- **Cross-file Navigation**: Clicking a node in the active flow focuses and centers it on the canvas. Clicking a node in a collapsed/non-active flow switches the active canvas to that flow and then focuses/selects the node.
- **Search Filtering**: Typing in the search bar filters nodes across all flows. Accordion panels containing matching nodes are automatically expanded for easy discovery.
- **Global Instructions Display**: A persistent section at the bottom of the navigator displays both the global instructions from `main` (always visible in every agent) and the ones from the current active flow (empty if not set).
- **Review Requests List**: A persistent 'Review Requests' section at the very bottom of the navigator aggregates all unresolved review requests across all flow files in the SOP. Clicking a review request item switches the active canvas to the respective flow file (if different) and zooms in/selects the corresponding node.


### 3. Sub-flow Nodes & Inspector Links

When a route (condition, intent, or global route) transitions to another file (e.g., `target_flow: customize-pizza-flow.yml`):
- **Graph Node Representation**: The destination sub-flow is rendered on the canvas as a custom node of type `sub_flow` (styled in Indigo with an `ExternalLink` icon).
- **Inspector Handoff**: Selecting a `sub_flow` node inside the canvas hides all step-specific parameters (such as instructions, actions) and instead displays a clean card with a link/button to **Open Flow Diagram**.
- **Interactive Transition**: Clicking this button loads the target sub-flow file on the canvas with no specific node selected, enabling smooth traversal of modular sub-journeys.

### 4. Inspector Route Navigation (Zoom-without-Selection)

To enhance graph exploration, route target buttons (links to source/target step nodes of condition or intent routes) in the Inspector panel support non-selecting viewport adjustments:
- **Inspection Continuity**: Clicking a route target node ID centers and zooms the viewport to the target node but does **not** change the selected node. This keeps the active node's details in the Inspector panel.
- **Temporary Focus Highlight**: The focused target node is temporarily styled with a pulsing border highlight class (`temp-focused-highlight`, which adds a pulsing blue glow effect for 2 seconds) so the user can easily locate it even if other nodes are faded.

