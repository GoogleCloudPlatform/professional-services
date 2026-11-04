# Floating Edges Implementation

This document describes the architectural design decisions, coordinate calculation math, and implementation details for floating edges in ASOP Studio.

## Background & Rationale

By default, React Flow connects edges to static handle components located at fixed positions on the nodes (e.g., top and bottom center handles). While this works for simple flows, complex workflows with many intersecting paths or parallel routes suffer from handle bottlenecks where all incoming/outgoing lines overlap at the same handle.

Implementing **floating edges** dynamically calculates the connection points on the node boundaries, allowing edges to start and end from any side (Top, Bottom, Left, or Right) depending on the geometry and position of the source and target nodes. This spreads the paths out naturally and makes complex diagrams substantially more readable.

## Architectural Components

We implemented floating edges by introducing the following modules:

1. **Geometry Engine (`src/client/utils/floatingEdge.ts`)**:
   - Calculates the exact boundary intersection coordinate for any line starting at node A's center and heading to node B's center.
   - Dynamically determines the relative position of the edge (Left, Right, Top, or Bottom) on each node to ensure correct path curvature.

2. **Custom React Flow Edge (`src/client/components/FloatingEdge.tsx`)**:
   - Uses `useInternalNode` to inspect the live dimensions and exact absolute coordinates of source and target nodes.
   - Employs XYFlow's `<BaseEdge>` to draw bezier paths from/to the computed floating positions.
   - Employs `<EdgeLabelRenderer>` to render HTML-based, clean floating labels that scale correctly and preserve CSS-based styles.

3. **Vite Application Registry & Styling (`src/client/App.tsx` & `src/client/index.css`)**:
   - Registers the `floating` custom edge type in React Flow.
   - Hides standard node handles by setting `opacity: 0` and `pointer-events: none` on `.react-flow__handle`, preventing visual confusion while preserving React Flow's connectivity tracking.
   - Provides responsive glassmorphic label borders and custom highlighting (using `faded` styles).

## Mathematical Formulation

The dynamic intersection calculation resolves the point at which the line segment connecting the center of `Node A` ($C_A$) and `Node B` ($C_B$) crosses the horizontal boundary lines of `Node A` (restricting candidates to the Top or Bottom edge only):

1. Let $(x_2, y_2)$ be the center of the intersection node, and $w, h$ be half-width and half-height.
2. Let $(x_1, y_1)$ be the center of the target node.
3. Determine if the target is above ($y_1 < y_2$) or below ($y_1 \ge y_2$).
4. The intersection coordinate $y$ is set strictly to the top boundary ($y = y_2 - h$) or bottom boundary ($y = y_2 + h$).
5. Compute the $x$ coordinate using the slope $dy = y_1 - y_2$:
   $$x = x_2 + (y - y_2) \cdot \frac{x_1 - x_2}{y_1 - y_2} \quad \text{for } dy \neq 0$$
6. Clamp $x$ horizontally to node bounds to restrict it strictly to the physical Top or Bottom border of the card:
   $$x_{\text{clamped}} = \max(x_2 - w, \min(x_2 + w, x))$$

This guarantees that all edges start and end vertically (curving cleanly straight up/down) and slide along the horizontal edges to avoid crossing into the side borders.

## Self-loops and Parallel Edges

To prevent overlapping edges when multiple transitions share the same source and target nodes, or when a node routes to itself (self-loop), the `FloatingEdge` component uses dynamic path routing and offset calculations:

### 1. Parallel Edges (Different Nodes)
When multiple edges exist between two nodes, including bidirectional or mutual edges (e.g. A -> B and B -> A):
- We query all edges between the two nodes, regardless of direction, and sort them stably by ID to assign a consistent index.
- A horizontal offset is calculated as:
  $$\text{offset} = \left(\text{index} - \frac{\text{totalEdges} - 1}{2}\right) \cdot 60$$
- The start and end connection points on the node boundaries are slightly spread out by adding $\text{offset} \cdot 0.15$ to the X coordinates, separating the arrowheads.
- The cubic Bezier control points are shifted by $\text{offset}$ horizontally ($cp_{1x} = sx + \text{offset}$, $cp_{2x} = tx + \text{offset}$), which bows the paths out symmetrically while keeping the entry/exit tangents vertical.
- The edge label is positioned at the midpoint of the Bezier curve using standard centering.

### 2. Self-loops (Source === Target)
When a node transitions to itself, drawing a standard vertical path would collapse onto the node. We render custom side loops:
- Loops alternate sides: even-indexed loops go to the right, odd-indexed loops go to the left.
- Loop size (X-offset) increases for each additional loop on that side:
  $$\text{baseOffset} = 60 + \text{sideIndex} \cdot 50$$
- To prevent labels and paths from overlapping, the start and end points are staggered vertically around the center line of the node.
- The label is positioned near the apex of the loop and translated dynamically ($\text{translate}(-100\%, -50\%)$ for left loops, $\text{translate}(0\%, -50\%)$ for right loops) to ensure it sits entirely outside the loop curve without overlapping it.

