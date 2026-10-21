# ASOP Studio: Project Scaffolding & Architecture

This document records the design decisions, layout specifications, and scaffolding foundations established during the initialization of the Agentic SOP Studio (ASOP Studio).

## Technical Stack

The core stack is built on modern web development standards matching the guidelines:
1. **Framework**: React 19 (TypeScript) + Vite for rapid HMR (Hot Module Replacement) and optimized bundling.
2. **Styling**: Vanilla CSS with custom property tokens (CSS Variables) supporting custom dark-theme defaults, glassmorphic layout elements, and premium animations.
3. **Graph Engine**: `@xyflow/react` (v12) (formerly React Flow), supporting custom node structures, modular styling, and optimized render cycles.
4. **Icons**: `lucide-react` for clean, consistent UI indicators.

## Design Decisions & Theme System

To ensure a premium feel, the application uses a dark-theme-first palette:
- **Background Palette**: A deep cosmic dark shade (`#08090d`) for the canvas area, combined with subtle glassmorphic elements (`rgba(13, 15, 23, 0.65)`) with `backdrop-filter: blur(16px)` for sidebars and headers.
- **Accent Coloration**: High-contrast, tailored glow gradients utilizing purples (`#8b5cf6`), indigos (`#6366f1`), and teals (`#14b8a6`) rather than basic primaries.
- **Typography**: Inter (for primary text) and Outfit (for headings and titles) loaded from Google Fonts. JetBrains Mono is utilized for tags, code elements, and metadata text.

## Layout Structure

The editor uses a full-viewport layout (`100vw` by `100vh`) structured as:
```
+-------------------------------------------------------------+
| [Sparkles Logo] ASOP Studio                 [Share] [Save]  | <-- Glass Header (64px)
+------------------+------------------------------------------+
|                  |                                          |
|  Flow Navigator  |        [Initialize Session Node]         |
|  (Left Sidebar)  |                                          |
|                  |                 (Canvas)                 | <-- Main Layout (Flexible)
|                  |                                          |
+------------------+------------------------------------------+
```
- **App Header**: Displays brand logo, the selected Active SOP dropdown, and action items.
- **Left Sidebar**: Navigator containing node outlines, counts, and placeholders for upcoming configurations.
- **Canvas Container**: Host for the interactive React Flow viewport, with dots-grid background pattern and customized control elements.

## Component Architecture

### Custom Nodes (`SopNode.tsx`)

Rather than relying on default HTML structures provided by React Flow, a modular custom node `sopNode` has been introduced:
- **Handles**: Located at the Top (Target) and Bottom (Source) of each node to enable a Top-to-Bottom step transition.
- **Header**: Features type-based dynamic coloring and icons (e.g., Play icon for `action`, GitBranch icon for `route` or `condition`, HelpCircle for `input`).
- **Body**: Standardized instruction detail display.
- **Footer**: Includes metadata tags and status indicators with a glowing dot animation for active states.
- **TypeScript Integration**: Custom typed data `SopNodeData` extending the standard index signature requirements of React Flow.

## Next Steps

1. **YAML Parsing**: Implement a helper using the `yaml` library to load, parse, and map YAML files from `project_input/` into structured nodes and edges.
2. **Interactive Node Editor**: Build out the sidebars to allow detail editing, adding new nodes, connecting edges, and configuring instructions.
3. **Layout Auto-routing**: Integrate automatic graph layouts (such as Dagre or ELK) to visually organize nodes imported from raw files.
