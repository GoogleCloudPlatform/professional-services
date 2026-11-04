# Editing Capabilities, Snapshots, and History

This document outlines the design decisions and implementation details for editing workflows, snapshots, and undo/redo capabilities within ASOP Studio.

## 1. Core Principles

### Working Copy vs. Baseline
All active edits in the UI (e.g. updating node instructions) are performed directly on the **Working Copy** of the SOP files.
- The working copy is represented by the root YAML files (`main.yml`, etc.) in the project's files map.
- The baseline (original/uploaded files) is saved under a **Snapshot**.

### Snapshots
A snapshot is a read-only frozen state of all files in the SOP at a specific point in time.
- All snapshots are saved under the `_snapshots/` folder inside the project (e.g., `_snapshots/snapshot_original/`, `_snapshots/snapshot_<timestamp>/`).
- A special metadata file `_snapshots/metadata.yml` records the list of snapshots, their names, descriptions, and creation timestamps.
- **Ignore on Upload**: When a ZIP archive is uploaded or loaded, the `_snapshots/` folder is explicitly stripped/ignored to ensure only the latest state (the root files) is active. A new initial snapshot baseline (`snapshot_original`) is then generated automatically from these root files.
- **Include on Export**: When a ZIP archive is exported, the `_snapshots/` folder is included to preserve history.
- **Change Detection**: The UI compares the working copy (root files) against the latest snapshot (defined in `metadata.yml`). If they differ, the working copy is marked as "Modified" (unsaved edits), allowing the user to create a new snapshot.

## 2. Edit History and Undo/Redo

To support multi-turn edits, ASOP Studio implements an Edit History stack (`past` and `future` stacks in the React state):
- Each history entry stores the edit type (`update_instructions` or `update_route`), the file modified, the nodeId or edge selection details, the previous value, and the new value.
- Undoing or redoing an edit applies the corresponding state delta back into the files map.
  - **View Transition & Focus**: 
    - Undoing or redoing an instruction edit automatically selects the node that was modified. If the node's center is not already in the viewport, the canvas runs a "fit view" to display it nicely.
    - Undoing or redoing a route edit automatically selects the route (edge). If the edge midpoint is not already in the viewport, the canvas runs a "fit view" to display it nicely.
    - If the target element resides in another flow file, the active flow file is changed first, and canvas layout updates are awaited before the conditional "fit view" transition is triggered.

### Route Editing UX
- When a node is selected, its outgoing condition and intent routes are listed in the inspector. Each route item features an **Edit (pencil)** button on the right.
- Clicking the pencil button selects that route (which clears the node selection, selects the edge in React Flow, and shows the route details in the inspector).
- When a route is selected, its condition expression (for condition routes) or intent description (for intent routes) can be clicked to start editing. The interface uses a compact, auto-resizing text editor (`EditableInstructions` adapted for route values).

### Global Instructions Editing UX
- Global instructions for both the main agent flow and the current sub-flow (if the active flow differs from the main flow) are editable directly from the SOP Navigator panel on the left.
- Clicking on a global instructions block enters edit mode, swapping it with an auto-resizing textarea (`EditableInstructions` adapted for global instructions).
- Changes are saved via `Ctrl+Enter` / `Cmd+Enter` or by clicking outside (blur). Pressing `Escape` cancels edits and reverts to the original text.
- Saving edits records an `update_global_instructions` action in the history stack, enabling full Undo/Redo support. Undoing or redoing a global instruction edit automatically expands the "Global Instructions" accordion section to ensure the updated value is visible.

### Keyboard Shortcuts
ASOP Studio supports keyboard shortcuts to streamline the editing workflow. Key mappings are stored centrally in [shortcuts.ts](file:///src/client/utils/shortcuts.ts) to prepare for future user-configurability:
- **Undo**: `Ctrl+Z` (Windows/Linux) or `Cmd+Z` (macOS)
- **Redo**: `Ctrl+Shift+Z` (Windows/Linux) or `Cmd+Shift+Z` (macOS)
- **Save Edit**: `Ctrl+Enter` or `Cmd+Enter` while editing instructions or route expressions (automatically triggers saving and exits edit mode).
- **Cancel Edit**: `Escape` (reverts to the value before the edit started and exits edit mode).

Global hotkeys (like Undo/Redo) are automatically suppressed when focus is inside text inputs, textareas, or contenteditable elements.

## 3. Developer Guidelines for Future Edits
When extending editing capabilities (e.g. adding routes, modifying node configurations):
1. **Mutate AST**: Always use the `yaml` package to mutate documents via AST (`doc.get`, `doc.set`, etc.) to preserve existing comments, structure, and formatting when saving changes back to the string files.
2. **Delta Records**: Add appropriate entries to the edit history (`past`/`future`) so changes can be reverted cleanly.
3. **Synchronize Selection**: Ensure the React Flow state (`nodes`/`edges`) and the active selected item (`selectedNode`/`selectedEdge`) are updated immediately in the UI after saving or undoing/redoing. Always resolve selection parameters from the latest `nodes`/`edges` state arrays in handlers like `onSelectionChange` to avoid overwriting state with stale component instances from React Flow's internal renders.
4. **Ignore snapshots**: Any files starting with `_snapshots/` must be filtered out in operations listing active flow files or example journeys (e.g., in `parsedFlows` or `exampleJourneys` selectors, and the backend compilation compiler `buildUnifiedSop`).
5. **Shortcuts**: When adding new keyboard shortcuts, add them to `src/client/utils/shortcuts.ts` and use the helper matches functions to bind events.

## 4. Review Requests Management

ASOP Studio provides a built-in feature to track and create review requests on both Nodes (Steps) and Edges (Routes):
- **Always Visible & Expanded**: The "Review Requests" section in the inspector is always displayed for selected nodes and edges, and is expanded by default to ensure immediate visibility of review actions.
- **Layout Position**: In the Node inspector view, the "Review Requests" section is positioned near the top of the details panel, coming before the "Incoming Routes" section.
- **Unified Button Action**: Whether there are no existing requests or several, review request addition is triggered consistently using a full-width button labeled "Add Request" at the bottom of the section (or as the sole item in empty states).
- **Inline Creation**: Clicking "Add Request" opens a form directly inside the inspector.
  - **ID Generation**: The form automatically suggests a default ID of the format `req-XXX` (e.g. `req-001`), choosing the next available sequential number that is unique across the entire SOP project (scanning all active flow files). The ID remains editable until creation.
  - **User Identity (SSO/IAP)**: If Google SSO/IAP user metadata is available (fetched via the backend `/api/user` endpoint which parses GCP IAP identity headers), the "from" field is automatically pre-populated with the user's email.
  - **Memory Persistence**: The last value entered into the "From" input is stored in client-side state/local storage (`asop_last_from_value`) and used as the default for subsequent review request creations.
  - **Topic Classification**: A dropdown restricts the topic to either `DESIGN` (default) or `TECHNICAL`.
  - **Reason**: A required free-text textarea where the developer specifies the reason for the review.
- **AST Insertion**: The review request is inserted into the respective node or route's list of `review_requests` using the AST-preserving `yaml` package modifiers, preserving comments and formatting in files.
- **Resolution & Deletion**:
  - **Resolve & Un-resolve**: Users can resolve a review request directly from its card in the Inspector panel by clicking the Check icon button (setting the request's `resolved` flag to `true` in the underlying YAML file). They can also un-resolve a resolved request by clicking the Undo icon button (setting it back to `false`).
  - **Delete**: Users can delete a review request by clicking the Trash icon button. This triggers a confirmation modal to prevent accidental data loss. Once confirmed, the review request is permanently removed from the list of requests in the YAML file.


