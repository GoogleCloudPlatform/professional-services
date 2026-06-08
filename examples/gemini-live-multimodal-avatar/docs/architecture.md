# Enterprise Real-Time Conversational AI: System Architecture & Design Blueprints

## Executive Summary & System Overview

This repository houses a production-grade, low-latency conversational AI engine designed for enterprise financial services. The system integrates real-time stateful multi-modal inference (using the Google Vertex AI Gemini Live API) with fully synchronized visual avatars and transactional business operations.

To deliver sub-second response times, secure credentials, and maintain a consistent 60 FPS client rendering thread, the system is designed around four foundational pillars:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE ARCHITECTURAL PILLARS                      │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. SECURE-BY-PROXY AUTHENTICATION │ 2. DUAL-PATHWAY WEBSOCKET ROUTING  │
│    Eliminates client-side GCP key │    Isolates media codecs from main │
│    exposure via secure upstream   │    UI threads; handles direct fMP4 │
│    token-injection proxies.      │    decoding and SDK runtimes.      │
├───────────────────────────────────┼────────────────────────────────────┤
│ 3. CONTEXTUAL SESSION SANDBOXING │ 4. DETACTED TRANSACTION SYNC       │
│    Ensures strict data isolation  │    Bridges the race condition      │
│    across concurrent sessions     │    between instant tool execution  │
│    using Firestore overlay states.│    and spoken model explanations.  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 1. System Topology & Dual-Pathway Communication

The system topology decouples real-time media ingestion and playback from stateless, transactional tool routing. 

```
                                 ┌─────────────────────────────────┐
                                 │       Vertex AI Live API        │
                                 │     (Gemini 2.x WebSockets)     │
                                 └────────────────┬────────────────┘
                                                  ▲
                                                  │ Bidirectional Media
                                                  │ Stream (fMP4 / PCM)
                                                  ▼
   ┌──────────────────┐               ┌────────────────────────────┐
   │  React Frontend  │               │      Go Secure Proxy       │
   │  Client Browser  │               │   (Token & Path Rewrite)   │
   └────────┬─────────┘               └───────────▲────────────────┘
            │                                     │
            │ Establish                           │ Proxied Upstream
            │ Connection                          │ Connection
            └─────────────────────────────────────┘
            
            │
            │ Triggers Tool Call (JSON-RPC 2.0)
            ▼
   ┌───────────────────────────────────────────────────────────────┐
   │                  Go MCP (JSON-RPC 2.0) Server                 │
   ├───────────────────────────────┬───────────────────────────────┤
   │  - Mock Ledger (bank.go)      │  - Semantic Search (Vertex)   │
   │  - Scenario Cache (Firestore) │  - Session Overlays           │
   └───────────────────────────────────────────────────────────────┘
```

When a user initiates an avatar session, the communication is divided into two distinct logical planes:

1.  **The Media & Inference Plane (Upstream WebSockets):** A persistent, full-duplex WebSocket connects the client to the upstream Vertex AI Live API. To optimize resource consumption and protect infrastructure access, this connection is routed through the **Go Secure Proxy Gateway**.
2.  **The Transaction & Operations Plane (Stateless MCP Router):** When the AI model decides to invoke a tool, the execution request is parsed by the client and dispatched as a stateless JSON-RPC 2.0 transaction to the Go backend’s **Model Context Protocol (MCP)** server.

---

## 2. Backend Engineering (Go)

The backend is built in pure Go using `net/http` and `gorilla/websocket` for maximum performance, minimal memory footprints, and low-latency throughput.

### 2.1 Server-Side Authentication & Handshake Proxy (`ws_proxy.go` & `proxy.go`)

Direct web client connections to Google Cloud Vertex AI endpoints are constrained by two primary challenges: browser-side credential disclosure (leakage of private service account keys) and model resource routing formatting. The backend resolves these via a dynamic token-injecting rewrite proxy.

*   **Handshake Interception:** The client initiates standard WebSocket handshakes to local HTTP endpoints `/api/live-proxy` (for standard/HeyGen sessions) or `/api/ws-proxy` (for raw Google 1P Video Avatar streaming).
*   **Upstream Authorization Injector:** The proxy gateway captures the request, leverages server-side **Application Default Credentials (ADC)** to dynamically fetch a short-lived, high-security Google Cloud OAuth2 Access Token, and appends it to the headers of the upstream request.
*   **Model Path Overrides:** The proxy rewrites incoming connection requests to the target Vertex AI model URL, applying the required GCP project and geographic location paths dynamically:
    ```
    wss://{location}-aiplatform.googleapis.com/ws/projects/{project}/locations/{location}/publishers/google/models/{model}:liveConnect
    ```

### 2.2 Model Context Protocol (MCP) Router (`mcp.go`)

Our tools implementation uses the open **Model Context Protocol (MCP)** specification. The backend operates a JSON-RPC 2.0 endpoint (`/api/mcp`) that accepts, validates, and executes tool payloads:

```
[Gemini Live Model] ───(JSON Tool Request)───► [React Client]
                                                    │
                                                    ▼ (HTTP POST /api/mcp)
[Active Scenario Overlay] ◄──(Validate)─── [Go MCP Controller]
                                                    │
                                                    ├──► [Ledger Service] (bank.go)
                                                    └──► [Vertex Search Service] (vertex_search.go)
```

1.  **Sandboxed Execution Validation:** When an MCP request is received, the controller queries the **Active Scenario Profile** (e.g., Cashflow, Treasury) stored in Firestore. It verifies if the tool request is registered as permissible for the active advisor. If unauthorized, it terminates execution with a standard JSON-RPC `Method Not Found` (-32601) code to maintain system security.
2.  **Stateless Session Isolator:** Concurrency safety across concurrent threads is anchored by a client-generated UUID (`session_id`). This identifier is passed with every operational tool request. Rather than relying on eventual-consistency indices, the database uses strongly consistent direct document fetches scoped directly to `session_id`, ensuring perfect isolation and preventing data races.

### 2.3 Conversational RAG with Vertex Search (`vertex_search.go`)

For knowledge-grounded advisors (like the CSB Cross-Border Guide or US Managed Portfolios), the backend implements a semantic document retrieval engine powered by Google Vertex AI Search.
*   **Latency-Optimized Retrieval:** To avoid adding latency to conversational turns, the search client strictly limits page-retrieval limits to `PageSize = 2` and extracts brief snippets, effectively halving standard search round-trip latency.
*   **Fallback Grounding:** If Vertex Search encounters network anomalies or returns empty results, the system gracefully degrades to a generic fallback query to maintain the dialogue without throwing uncaught runtime exceptions.

---

## 3. Frontend Engineering (React & TypeScript)

The frontend is a single-page React application powered by TanStack Router and TanStack Query, engineered to handle multi-threaded streaming audio and video operations smoothly.

### 3.1 Background Thread Isolation (`networkWorker.ts` & `useGeminiSocket.ts`)

Handling high-performance real-time media conversion directly on the browser's main JavaScript execution thread can cause UI frame lag or audio stuttering. The frontend implements background thread isolation using a dedicated WebWorker:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              BROWSER UI THREAD                         │
 │                                                                        │
 │  [React State] ◄────(Transferred ArrayBuffers)────┐                    │
 │         │                                         │                    │
 │         ▼                                         │                    │
 │   [AudioWorklet]                                  │                    │
 └─────────┬─────────────────────────────────────────┼────────────────────┘
           │                                         │
           ▼ (Raw Microphone Audio PCM)               │
 ┌───────────────────────────────────────────────────┼────────────────────┐
 │                            BACKGROUND WEB WORKER  │                    │
 │                                                   │                    │
 │   [networkWorker.ts] ───► [@google/genai SDK] ────┘                    │
 │                               │                                        │
 │                               ▼                                        │
 │                       [Go Secure Proxy]                                │
 └────────────────────────────────────────────────────────────────────────┘
```

*   **Worker-Enclosed SDK (`networkWorker.ts`):** The official `@google/genai` client SDK runs entirely inside a background worker thread. Incoming audio output from Gemini is parsed, decoded, and converted from base64 blocks to Float32 PCM arrays off the main thread.
*   **Zero-Copy ArrayBuffer Transfers:** Decoded audio arrays are transferred to the main thread utilizing high-efficiency `transferable` arrays to eliminate thread-communication latency.
*   **Dual-Pathway Socket Orchestrator (`useGeminiSocket.ts`):**
    *   *Path 1 (SDK Worker Pathway):* For **Voice-Only** and **HeyGen** sessions, the connection is established and managed inside the WebWorker, routing standard JSON data and raw audio arrays.
    *   *Path 2 (Direct Raw WebSocket Pathway):* For the **Google 1P Video Avatar** session, the connection is initiated as a raw browser-level WebSocket. This allows binary fMP4 streaming chunks to bypass worker translation layers, feeding directly into a canvas-based `mpegts.js` player pipeline.

### 3.2 Real-Time Media Rendering & Animation Pipelines

*   **Google 1P Avatar Stream Decoder:** The 1P Avatar returns interleaved raw video segments formatted as fragmented MP4 (fMP4) streams. The frontend utilizes **`mpegts.js`** libraries to demux and decode these binary frames in real-time, painting them onto HTML Canvas surfaces under sub-second Latency-to-First-Frame (TTFF) constraints.
*   **HeyGen (3P) Audio-to-Video Bridge:** The HeyGen avatar utilizes a WebRTC peer-to-peer media pipeline. To synchronize Gemini's speech with HeyGen's video rendering:
    1.  The standard web-audio output from `useGeminiLive.ts` is explicitly muted for the speaker.
    2.  Incoming audio segments from Gemini are intercepted as base64 buffers and pushed directly into HeyGen's `LiveAvatarSession.repeatAudio(chunk)` SDK endpoint.
    3.  HeyGen animates the avatar's lips dynamically to match the audio buffers.

### 3.3 Audio-Visual Synchronization & Interruption (`useMCPExecution.ts`)

A common UX issue with conversational AI is the "modal popup synchronization race." When Gemini requests an MCP tool execution (e.g. *initiating a bank transfer*), the operation completes in milliseconds. If the frontend pops open the "Transfer Success" card immediately, the visual state is rendered **before** the model has spoken the conversational introduction (e.g. *"Certainly, I will process that wire transfer for you now."*).

To solve this, `useMCPExecution.ts` manages an event-driven synchronizer:

```
[Tool Executes] ──► [Buffer UI Modal State (Hidden)]
                            │
                            ▼ (Listen for Events)
                    ['audio-playback-started' Window Event]
                            │
                            ├─► [Event Fired] ───────► [Render UI Modal (Visible)]
                            │
                            └─► [Timeout (3.5s)] ────► [Fallback Display Safe-Guard]
```

1.  **State Buffering:** Upon successful completion of an MCP tool, the resulting UI modal is loaded into local state memory but kept hidden.
2.  **Audio Inception Listener:** The hook registers an event listener for `'audio-playback-started'` (dispatched by the speaker's audio player queue the exact millisecond audio synthesis begins rendering to the browser's audio card).
3.  **Visual Transition:** The visual modal is transitioned to screen on the exact frame audio playback begins, matching the spoken explanation.
4.  **Graceful Degradation:** A `3.5s` safety watchdog timeout triggers the modal to display if the audio pipeline experiences network delay or is muted.
5.  **Interruption Cleanup:** If the user interrupts the model by speaking during audio playback, the frontend clears all local audio player buffers and triggers an interruption packet. This instantly stops HeyGen's visual animations and halts Gemini's upstream inference stream.

---

## 4. End-to-End Execution Lifecycles

This blueprint outlines the path of a complete user conversational loop:

```
[User Speech]
      │
      ▼ (Mic In)
[AudioWorklet (Raw PCM)] ──► [NetworkWorker (Float32)] ──► [Go ws_proxy (Auth Header)]
                                                                   │
                                                                   ▼
                                                         [Vertex AI Live API]
                                                                   │
                                                                   ▼ (Inference Model)
                                                         [JSON Tool Request]
                                                                   │
                                                                   ▼
[Go MCP Server] ◄────────── [HTTP Post /api/mcp] ◄──────── [React Client]
      │
      ├─► [Firestore Scenario Check]
      ├─► [Local Ledger Ledger (bank.go)]
      ▼
[JSON-RPC Success] ───────► [React Client] ────────────────► [Upstream Live API]
                                                                   │
                                                                   ▼ (Synthesis Response)
                                                           [Audio/Video Stream]
                                                                   │
                                                                   ▼
[Render Canvas] ◄───────── [mpegts.js Player] ◄─────────── [React Client]
                                                            (Sync via useMCPExecution)
```

1.  **User Ingestion:** Microphone audio is sliced, captured as raw PCM via `AudioWorklet`, converted to Float32 inside the isolated WebWorker thread, and transmitted via WebSocket through the Go `ws_proxy` directly to Gemini on Vertex AI.
2.  **Upstream Processing:** The stateful Gemini model performs real-time audio evaluation. Recognizing a structured trigger (e.g., "Transfer $50 to savings"), it halts audio output and dispatches an RPC tool invocation back to the client over the socket.
3.  **Downstream Delegation:** The React client interceptor captures the RPC, appends the active sandbox `session_id`, and POSTs the transaction to the Go backend's `/api/mcp` endpoint.
4.  **Backend Execution:** The Go backend validates tool authorization against the active scenario profile, executes the banking ledger operation, and returns a JSON-RPC success envelope.
5.  **Inference Completion:** The client returns the success details back to the Gemini Live API WebSocket connection. Gemini evaluates the response, starts generating the verbal confirmation stream ("I have completed that transfer..."), and sends the media frames downstream.
6.  **Synchronized Delivery:** The React app receives the media. The visual rendering frames are fed to the canvas, but the transaction results screen is held back. The instant the speaker audio context triggers the play callback, the transaction confirmation card renders on screen in perfect synchronization.

---

## 5. REST API Endpoint Reference & WebSocket Proxy Splits

The Go backend gateway unifies stateful streaming connections and stateless transaction requests across the following registered routing endpoints:

```
                      ┌─────────────────────────────────┐
                      │      Go HTTP Router Gateway     │
                      ├────────────────┬────────────────┤
                      │ WebSocket      │ REST HTTP      │
                      │ Proxy Routing  │ Services       │
                      └───────┬────────┴────────┬───────┘
                              │                 │
         ┌────────────────────┴────┐   ┌────────┴──────────────────────────┐
         ▼                         ▼   ▼                                   ▼
  /api/live-avatar/         /api/ws-proxy   /api/config        /api/v1/scenarios
  (WebWorker Session)      (1P fMP4 Raw)   /api/heygen-token  /api/telemetry
                                           /api/mcp           /api/tools/execute
```

### 5.1 WebSocket Proxy Gateway Split

To maximize performance, the system splits its WebSocket routing into two distinct gateway handlers:

1.  **`/api/live-avatar/` (Handler: `handleLiveAvatarProxy`):**
    *   **Client Context:** Opened by the background `networkWorker.ts` thread running the `@google/genai` SDK.
    *   **Functionality:** Relays standard JSON audio messages, translates OAuth headers server-side via ADC, and modifies path names for standard Voice-Only and HeyGen sessions.
2.  **`/api/ws-proxy` (Handler: `handleWSProxy`):**
    *   **Client Context:** Opened directly by the browser thread's `useGeminiSocket.ts` hook.
    *   **Functionality:** Relays high-frequency binary fMP4 video packets directly to the main thread's `mpegts.js` decoders, bypassing WebWorker deserialization overhead.

### 5.2 REST HTTP Endpoint Specifications

1.  **`GET /api/config`**
    *   **Purpose:** Fetches active runtime parameters (endpoints, locations, active modalities).
    *   **Parameters:** Supports `mode` query parameter (e.g., `?mode=google_1p`) and `lang` parameter (e.g., `?lang=English,Spanish`) to trigger dynamic backend overrides.
2.  **`GET /api/v1/scenarios`**
    *   **Purpose:** Loads and returns the collection of active scenario summaries (ID and Name) to populate the frontend advisor picker. Integrates our local directory file overlays.
3.  **`POST /api/mcp`**
    *   **Purpose:** The standard Model Context Protocol gateway. Accepts JSON-RPC 2.0 payloads representing `tools/list` (returning sandboxed available schemas) and `tools/call` (executing ledger/search operations).
4.  **`POST /api/tools/execute`**
    *   **Purpose:** A REST shortcut executor. Bypasses standard JSON-RPC 2.0 envelope wrappers, executing tools directly with standard JSON body payloads.
5.  **`GET /api/heygen-token`**
    *   **Purpose:** Fetches a short-lived WebRTC media tunnel authentication token from HeyGen's servers, hiding backend API keys.
6.  **`POST /api/telemetry`**
    *   **Purpose:** Accepts batch latencies and Peak/Cumulative token reports from the frontend, persisting them locally to `telemetry_logs.csv` at the close of each conversational turn.