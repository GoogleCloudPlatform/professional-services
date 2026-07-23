# 🎙️ Cymbal Conversational AI: Low-Latency Multimodal Avatars & Stateful Ingress Pipelines

### *The Enterprise Blueprint for Digital Humans and Real-Time Transactional Tool Calling*

[![React](https://img.shields.io/badge/Frontend-React_19_|_TypeScript_5-blue?logo=react&logoColor=white)](https://react.dev/)
[![Go](https://img.shields.io/badge/Backend-Go_1.25_|_gorilla--websocket-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![Gemini](https://img.shields.io/badge/Inference-Gemini_Live_API-orange?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![MUI](https://img.shields.io/badge/UI-Material_UI-007FFF?logo=mui&logoColor=white)](https://mui.com/)

This repository showcases an enterprise-grade, ultra-low latency real-time digital human advisor built for complex, transactional financial workflows. By integrating the stateful **Google Vertex AI Gemini Live API** with synchronized media streaming pipelines (supporting both **Google Native 1P Avatars** and **HeyGen 3P WebRTC Avatars**), the platform demonstrates natural voice interaction, sub-second responses, and safe transactional operations.

---

## 🏗️ Core System Topology & Architecture

To achieve sub-second human dialogue response thresholds ($TTFW < 800\text{ms}$) while keeping the rendering thread completely clear (constant 60 FPS), the system is divided into two distinct communication planes, as illustrated below and in our detailed [System Architecture Guide](docs/architecture.md):

```
                       ┌─────────────────────────────────────┐
                       │        Vertex AI Live API           │
                       │      (Gemini Stateful Socket)       │
                       └──────────────────┬──────────────────┘
                                          ▲
                                          │ Bidirectional Media Stream
                                          │ (fMP4 Video / Linear PCM Audio)
                                          ▼
┌──────────────────┐          ┌──────────────────────────────┐
│  React Frontend  │          │   Go Secure Auth Proxy       │
│  Client Browser  │◄────────►│   - Server-Side ADC Auth     │
│                  │          │   - regional Endpoint Routing│
└────────┬─────────┘          └──────────────────────────────┘
         │
         │ Executes Transaction (JSON-RPC 2.0)
         ▼
┌──────────────────────────────────────────────────────────────┐
│                Go MCP (JSON-RPC 2.0) Server                  │
├──────────────────────────────┬───────────────────────────────┤
│  - Mock Ledger (bank.go)     │  - Scenario Engine (Firestore)│
│  - Document Search (Vertex)  │  - Context Handlers           │
└──────────────────────────────┴───────────────────────────────┘
```

1.  **The Media & Inference Plane (Bidirectional WebSocket):** Direct client-to-upstream Vertex connections are managed via a high-performance, server-side **Go Handshake Proxy**. The proxy intercepts the socket connection, generates short-lived Google Cloud OAuth access tokens server-side using **Application Default Credentials (ADC)**, and rewrites URLs with project-specific path formatting, eliminating client-side API key leakage.
2.  **The Transaction & Operations Plane (Stateless MCP HTTP):** To keep the frontend a stateless, presentation-only rendering layer, **all transactional and business logic is isolated and executed solely on the Go backend**. When Gemini initiates tool operations (such as ledger transfers or scheduling), the frontend acts simply as a dumb router—relaying the JSON-RPC 2.0 tool envelope via an HTTP POST to the backend's secure **Model Context Protocol (MCP)** server, which performs the actual execution.

---

## ⚡ Technical Breakthroughs & Core Pillars

### 1. Multi-Threaded Audio Ingress & Codecs
To prevent JavaScript heap allocations and main-thread rendering lag, the frontend isolates raw audio capture. An **`AudioWorkletProcessor`** captures raw PCM microphone input in small 32ms frames (512 samples at 16kHz, mono) and dispatches them as zero-copy **Transferable Objects** (transferring memory buffer ownership without cloning) to a dedicated background **WebWorker**.

### 2. Hardware-Native VAD & Squelch
Voice activity detection (VAD) is executed directly on raw audio buffers inside the real-time audio thread using a Root Mean Square (RMS) energy-based squelch filter. To filter keyboard clicks and ambient noise, a **3-frame squelch rule** is enforced (requiring 96ms of consecutive quiet before declaring silence). The telemetry pipeline retrospectively subtracts 96ms from the True T0 timestamp to provide highly accurate latency metrics.

### 3. Dynamic Audio Gating
Stateful LLM WebSockets are sensitive to ambient noise during processing cycles. If noise reaches the socket while Gemini is waiting for an MCP tool result, the model can prematurely abort. Our client-side orchestrator actively implements an **Audio Gate** that drops incoming microphone frames and pushes padded silence buffers while `isProcessingTool` is active, ensuring robust execution.

### 4. Audio-Visual Presentation Syncer (`useMCPExecution.ts`)
Standard tool calling displays transactional results on-screen immediately, creating a race condition where the visual card is rendered before the avatar finishes verbally explaining the action. Our event-driven synchronizer holds back modal states and monitors the Web Audio API speaker stream, rendering the UI changes at the exact millisecond the `'audio-playback-started'` event triggers.

---

## 🛠️ System Technology Stack

*   **Backend Services:** Pure Go (v1.25) using `gorilla/websocket` routing and Firestore-first repository layers.
*   **Frontend Interfaces:** React 19 SPA, TypeScript 5, TanStack Router (type-safe routing), and TanStack Query (server state synchronization).
*   **Media Processing & Decoders:** `mpegts.js` for multiplexed fMP4 binary demuxing and decoding on HTML5 canvas contexts.
*   **Infrastructure Management:** Terraform blueprints, Google Cloud Run servers, Secret Manager keys, and Vertex AI Search (grounding knowledge base).

---

## 🏁 Quickstart Deployment Blueprints

### Recommended: 1-Click Bootstrap

If you want to rapidly deploy the infrastructure, securely store your API keys, and seed the knowledge base in a single automated flow, use the bootstrap command. 

```bash
gcloud config set project YOUR_PROJECT_ID
make auth
make bootstrap
```
*Note: During `make bootstrap`, you will be prompted to enter your Gemini and HeyGen API keys. To bypass the interactive prompts in a CI/CD environment, you can pass them inline: `make bootstrap GEMINI_KEY=xyz HEYGEN_KEY=abc`*

---

### Alternative: Step-by-Step Manual Deployment

If you prefer to run the setup manually to understand the underlying infrastructure, follow these steps:

#### Step 1: Provision Infrastructure
Deploy your Google Cloud resources (Cloud Run, Firestore, Vertex AI) using Terraform:
```bash
make deploy
```

#### Step 2: Store Secrets securely
Add your API keys to GCP Secret Manager:
```bash
make secrets
```

#### Step 3: Package Installations & Knowledge Base Seeding
Install dependencies and populate Firestore and the Vertex AI Search datastore with the provided PDF knowledge base guides:
```bash
make install
make seed
```

---

### Local Development vs Remote Testing

Once deployed, you have two distinct ways to run the application locally depending on your goal.

#### Option A: Local Development (`make dev`)
Launch both the Go server and the Vite React frontend locally with hot-reloading enabled. **Use this workflow if you are modifying the code.**
```bash
make dev
```
Open your browser to `http://localhost:5173`. 

#### Option B: Remote Proxy (`make proxy`)
Start a local authenticated proxy that routes traffic directly to your **deployed** Cloud Run service. **Use this workflow to test the cloud infrastructure locally without needing to use the public Cloud Run URL.**
```bash
make proxy
```
Open your browser to `http://localhost:8081`. 

*(To stop the background proxy later, run `make stop-proxy`)*

---

## 🎭 Client Presentation & Demonstration Guide

To demonstrate the capabilities of this system to enterprise clients or stakeholders, highlight these three key moments:

1.  **Natural Voice Interruption (Barge-In):** Speak over the avatar while it is talking. Our local, hardware-native RMS VAD will immediately detect the voice activity, clear the local audio buffers, and send an interruption packet upstream. The avatar will freeze its lip movements and listen instantly.
2.  **The Latency "Racetrack" Visualizer:** Open the telemetry panel during the conversation. Point to the millisecond-precision breakdown showing Upstream Transit, Inference Cognition, and true Human-Perceived Time to First Word (TTFW), demonstrating enterprise performance.
3.  **Real-Time Guardrail Manipulation:** In the sidebar, select a new scenario profile or update the master system prompt guidelines. The backend Firestore overlay will dynamically merge and inject the new instructions into the master model handshake prompt, changing the advisor's behavior instantly.

---

## Onboarding & Systems Library

For a detailed systems-level deep-dive into each sub-module of the codebase, refer to our onboarding documentation:

*   🏗️ **[Core System Architecture Guide](docs/architecture.md)** – Detailed proxy structures, dual-pathway routing sockets, and MCP server schemas.
*   ⚡ **[Media Ingress & Coding Pipelines](docs/realtime_pipeline.md)** – Advanced AudioWorklet pipelines, zero-copy buffer transfers, and RMS VAD filters.
*   🎭 **[Multimodal Avatars & Playback Blueprints](docs/avatar_configuration.md)** – Playback rendering, fMP4 segment demuxing via `mpegts.js`, and HeyGen repeatAudio integrations.
*   🗣️ **[Persona & Conversational Guidelines](docs/persona_guidelines.md)** – Detailed capabilities, query types, and conversational paths for the specialized AI advisors (e.g., Treasury, CRE, Cashflow).
*   📊 **[Telemetry, Metrics & Observability](docs/telemetry-audit.md)** – Comprehensive performance auditing, timing event schemas, and token usage profiling.
*   🔥 **[Firebase & OAuth Manual Setup Guide](docs/firebase_setup.md)** – Step-by-step instructions to configure Firebase Auth, OAuth Consent Screen, and redirect URIs manually.
*   🧪 **[Testing & Development Workflows](docs/testing_tooling.md)** – Running the frontend and backend testing frameworks and verifying compilation correctness.
*   🔄 **[Project Structure Sheet](docs/project_structure.md)** – Workspace hierarchy map and folder-level ownership guidelines.