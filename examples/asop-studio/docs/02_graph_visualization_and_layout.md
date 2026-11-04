# ASOP Studio: Graph Visualization & Auto-layout

This document details the architectural decisions and design patterns chosen to parse and visualize agentic flow specifications on the React Flow canvas.

## Layout Engine & Spacing Decisions

To visualize workflows ranging from simple specifications (`toy_flow_spec.yml`) to highly complex graphs , we integrated a hierarchical layout algorithm:

1. **Auto-layout Library**: We use `@dagrejs/dagre` to compute node coordinates (x, y). Dagre calculates optimal node positioning and ranks transitions to minimize edge crossings.
2. **Direction**: We set rank direction to `TB` (Top to Bottom), which matches the logical progression of agentic states.
3. **Perfect Spacing**:
   - Spacing between nodes on the same rank (horizontal separation) is set to `80px`.
   - Spacing between different ranks (vertical separation) is set to `120px`.
4. **Dynamic Node Height Estimation**:
   To prevent vertical overlaps, the layout calculations dynamically estimate each node's height based on:
   - Length of agent instructions (lines of text).
   - Number of actions/tools defined in the step.
   - Minimum baseline height of `130px`.

## Mapping & Parser Design

The parser (`src/utils/flowParser.ts`) parses the YAML workflow spec and maps it to React Flow elements:

- **Step Steps**: Map standard nodes to custom `sopNode` elements. If the step ID matches `flow.root_node_id`, it is flagged with `isRoot: true`.
- **Global Intents**: Creates a virtual teal-themed step named `GLOBAL_SCOPE` (labeled `* Any State *`) to anchor all global intent routes.
- **Terminal States**: Renders an implicit `END` terminal step (rose-themed octagon) if referenced by routes.
- **Unresolved References**: To prevent canvas crashes and aid developers, any route targeting a step that is not defined in the nodes list is visualized as a "Missing Reference" step (dashed rose border).

## Node Accents & Accent Rules

To make graph navigation highly intuitive, nodes are styled with accent colors reflecting their routing role:

- **Root Node**: Purple accent (`var(--accent-purple)` / `#8b5cf6`), prioritizing root identification over any routes.
- **Intent Nodes**: Blue accent (`#3b82f6`) if the node contains at least one intent route.
- **Condition Nodes**: Orange accent (`#f97316`) if the node only has condition routes (and no intent routes).
- **Subflow Nodes**: Indigo/purple accent (`#6366f1` / `subflow-node`) and no description text displayed inside.
- **Action Steps**: Retain yellow tool lists and badges internally, but their node accent is determined by their routing type (or default purple) rather than overriding it.
- **Default/Other Steps**: Purple accent.

## Edge Styling & Legend

Edges represent transitions and are colored based on their routing method:

- **Condition Route (Data)**: Solid orange lines, labeled with the programmatic condition.
- **Intent Route (LLM)**: Solid blue lines, labeled with the user intent description (truncated if exceeding 30 characters).
- **Global Intent Route**: Dashed aqua/teal lines (`#14b8a6`) starting from the `GLOBAL_SCOPE` step.

A floating **Legend** is overlayed at the bottom-left of the canvas to clarify these edge types and highlights. The global intent route in the legend matches the dashed aqua design.

## Node Navigation & Inspections

1. **Left Sidebar (Flow Navigator)**:
   - Includes real-time statistics (total steps, connections, actions, global routes).
   - Features a search bar allowing users to filter steps by ID.
   - Click-to-focus triggers `useReactFlow().setCenter`, animating the canvas viewport to center and zoom on the selected step.
2. **Right Sidebar (Inspector)**:
   - Shows detailed context when a step or route is selected.
   - For steps: displays step ID, badges, agent instructions, complete actions parameters, incoming/outgoing routes, and a raw YAML view.
   - For transitions: displays source, target, transition expressions, and parameters extracted.

## Theme & Light Mode Support

ASOP Studio supports both Dark Mode (default) and Light Mode across the entire user interface:
- **Top Bar Switch**: A theme toggle switch control is located in the top bar (header actions) directly to the left of the Undo/Redo buttons.
- **Persistence**: User theme choice is stored in `localStorage` under `asop_theme` ('dark' or 'light') so that preference is remembered across sessions.
- **Pre-mount Script**: An inline script in `index.html` sets `data-theme` on the root document element before React mounts to prevent any Flash of Unstyled Content (FOUC).
- **Dynamic Elements**: The React Flow canvas background dots, sidebars, inspector, navigation, edge labels, nodes, and player components seamlessly adapt colors according to the CSS theme variables.

