# Live API Demo Frontend

This is the React frontend for the Live API Commercial Banking Demo. It provides a real-time, ultra-low latency WebRTC interface connecting Google's Gemini Live API with HeyGen's LiveAvatar SDK.

## Technology Stack

*   **Framework:** React 19 (via Vite)
*   **Language:** TypeScript
*   **Routing:** TanStack Router (File-based routing)
*   **Data Fetching:** TanStack Query
*   **UI Library:** Material UI (MUI) v6
*   **Audio Processing:** Web Audio API (`AudioWorklet`)
*   **Avatar:** HeyGen LiveAvatar Web SDK
*   **Testing:** Vitest + React Testing Library (100% component coverage)
*   **Linting:** ESLint (Flat Config) + TypeScript Strict Mode

## Key Features

*   **Dual-Mode Interface:** Seamlessly transition between "Avatar Mode" (HeyGen video) and "Voice-Only Mode" (GPU-accelerated "Liquid Intelligence" visualizer orb).
*   **Real-Time Audio Pipeline:** Uses `NetworkWorker` and `AudioWorklet` to stream binary audio data over WebSockets off the main thread, achieving true low-latency interaction under 600ms.
*   **Tool Execution:** Intercepts JSON-RPC tool calls from Gemini and relays them to the Go backend MCP server without interrupting the audio stream.
*   **Cinematic Subtitles:** Live transcripts are rendered with weightless typography and elegant drop shadows for maximum legibility without bulky background containers.
*   **Executive UX:** Contextual suggestion chips, non-blocking side-sheet drawers, and zero layout thrashing.

## Scripts

*   `npm run dev` - Start the Vite development server.
*   `npm run build` - Typecheck and build the production application.
*   `npm run lint` - Run ESLint across the codebase.
*   `npm run typecheck` - Run TypeScript compiler strictly.
*   `npm run test` - Run the Vitest unit/integration test suite.
*   `npx vitest run --coverage` - Generate a V8 coverage report.

## Architecture

For detailed architecture diagrams, WebRTC implementation details, and backend routing, refer to the root `docs/` folder.