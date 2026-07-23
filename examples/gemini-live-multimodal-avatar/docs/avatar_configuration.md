# Multimodal Avatars & Video Playback Integration Blueprints

## Executive Summary & Topology

This document provides the systems engineering blueprints for the real-time visual rendering pipelines within the application. The system supports three distinct multimodal rendering modes: the **Google Native 1P Video Avatar**, the **HeyGen 3P WebRTC Video Avatar**, and the **Voice-Only "Liquid Intelligence" Interactive Orb**. 

As shown in our *Unified Backend Gateway Architecture* (`architecture_diagram.pdf`), all client-to-model interactions are routed through a secure backend proxy (`/api/ws-proxy` or `/api/live-proxy`) that performs silent GCP access token injection and qualifies Vertex model routes before establishing upstream stateful live connections.

---

## 1. Google Native 1P Video Avatar Pipeline

The Google 1P Video Avatar is an end-to-end, native multimodal system. Unlike conventional setups that require intermediate WebRTC signaling servers, the Gemini Live model generates synchronized audio and video frames directly at the model boundary.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GOOGLE 1P AVATAR DATA FLOW                      │
│                                                                        │
│ [Vertex AI Live API] ────(fMP4 / PCM Chunks)───► [Go ws_proxy]         │
│                                                      │                 │
│                                                      ▼ (Relayed)       │
│ [Canvas / Video DOM] ◄────(Render)─── [mpegts.js] ◄──┘ (React Client)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Direct Binary WebSocket Gateway (`/api/ws-proxy`)
*   **Media Multiplexing:** The model multiplexes raw audio frames (PCM) and synchronized video segments formatted as fragmented MP4 (fMP4) directly over the WebSocket connection.
*   **Raw Connection Protocol:** The frontend opens a direct, binary-enabled WebSocket connection directly to `/api/ws-proxy` on the Go backend, bypassing WebWorker serialization layers to ensure zero latency during high-frequency throughput.

### 1.2 Fragmented MP4 (fMP4) Demuxing and Rendering (`mpegts.js`)
*   **The Constraint:** Standard HTML5 `<video>` elements cannot natively ingest raw, disconnected streams of binary fMP4 chunks. Standard WebRTC is also unsuited as there is no remote peer-to-peer signaling server.
*   **The Action:** The frontend utilizes `mpegts.js` (a JavaScript stream transcoder/player) to demux the incoming binary stream.
*   **Playback Buffer Management:**
    1.  The raw binary stream is directed to a Media Source Extensions (MSE) pipeline.
    2.  `mpegts.js` decodes and reconstructs the fMP4 fragments into a continuous H.264 video feed and AAC audio feed.
    3.  The output stream is painted directly onto HTML `<video>` elements or hardware-accelerated `<canvas>` buffers.
*   **Latency & Synchronization:** Because the audio and video frames are generated inside the same stateful model context upstream, lip-sync is perfect and completely immune to local client-side network jitter or thread blocking.

---

## 2. HeyGen 3P Video Avatar Integration

The HeyGen avatar represents a third-party hybrid model where the language generation and audio are handled by Gemini, while the video avatar rendering is offloaded to HeyGen's remote real-time rendering servers over WebRTC.

```
 ┌────────────────────────────────────────────────────────┐
 │                      HEYGEN 3P AVATAR DATA FLOW        │
 │                                                        │
 │   [Gemini Live API] ──► [Go ws_proxy] ──► [React Client]                       │
 │                                                 │ (Intercept Base64)   │
 │                                                 ▼                      │
 │   [HeyGen WebRTC Video] ◄──(repeatAudio)─── [HeyGen SDK]               │
 └────────────────────────────────────────────────────────┘
```

### 2.1 Dynamic Authentication & Token Handshakes
To establish a secure WebRTC media channel to HeyGen's servers without exposing administrative api keys, the Go backend exposes the `/api/heygen-token` endpoint. 
*   The Go controller fetches a short-lived access token from HeyGen using backend environment credentials (`HEYGEN_API_KEY`) and returns it securely to the client.

### 2.2 Audio Inception & `repeatAudio` Pipeline
*   **The Constraint:** Standard WebRTC streaming relies on capturing the client’s microphone and sending it to the server. To animate a third-party avatar using Gemini's output, we must feed Gemini's audio directly into HeyGen's visual pipeline.
*   **The Action:** The frontend intercepts raw audio frames received from the Gemini Live API.
*   **Buffer Bridging:**
    1.  Standard client speaker playback inside `useGeminiLive.ts` is temporarily muted when HeyGen mode is active.
    2.  The raw base64-encoded audio frames received from Gemini are extracted and passed directly to the HeyGen WebRTC SDK's client instance:
        ```typescript
        heygenSession.repeatAudio(chunk);
        ```
    3.  HeyGen's upstream rendering nodes parse the incoming audio chunks, compute visual phoneme lip-sync positions, and stream back real-time video frames over the established WebRTC peer connection.

### 2.3 User Interruption Synchronization
*   **Trigger Event:** If the user speaks during playback, the local VAD engine registers an active state and dispatches an interrupt event.
*   **Visual Freezing:** In addition to clearing the local audio queues and informing Gemini, the client immediately calls the HeyGen SDK's interrupt handler:
    ```typescript
    heygenSession.interrupt();
    ```
    This freezes the avatar's lips and returns the model to a neutral idle state instantly, preventing visual "ghost speech."

---

## 3. Voice-Only "Liquid Intelligence" Interactive Orb

In Voice-Only mode, the system focuses strictly on low-latency audio transmission, rendering a responsive visual "Voice Orb" on screen.

### 3.1 Real-Time Fast Fourier Transform (FFT) Analysis
*   The raw PCM Float32 audio chunks generated by the upstream Gemini model are fed into a browser-level Web Audio API `AnalyserNode`.
*   An active **Fast Fourier Transform (FFT)** is executed on each frame to extract the frequency domain representation:
    $$\text{FFT}(k) = \sum_{n=0}^{N-1} x(n) \cdot e^{-i 2\pi k n / N}$$

### 3.2 GPU-Accelerated Dynamic Animations
*   The extracted frequency values are mapped directly to WebGL canvas or CSS variables representing scale, radial blur, opacity, and turbulence.
*   The visual orb expands, contracts, and changes color in real-time, matching the model's vocal energy and frequency spectrum.
*   By executing these calculations entirely within an isolated audio node and offloading rendering to the GPU, the main UI thread remains fluid and responsive (constant 60 FPS).

---

## 4. Configuration and Selection Mechanics

### 4.1 Defensive Configuration Overrides
The backend router (`router.go`) enforces strict defensive overrides when building connection parameters:
*   If `AVATAR_MODE` is configured as `google_1p`, the backend automatically overrides the config, forcing `USE_VERTEX_AI=true` and locking the model to the whitelisted 1P avatar target:
    `publishers/google/models/gemini-3.1-flash-live-preview-04-2026`
*   This prevents invalid configurations that would otherwise cause socket handshakes to fail.

### 4.2 Switch and Reset Sequence
When a user switches interaction modes in the sidebar UI:
1.  The active WebSocket session is closed, and any active audio/video players are destroyed.
2.  The frontend makes a call to `/api/config?mode={new_mode}` to retrieve the region and authentication parameters matching the new mode.
3.  The frontend redirects the router to the corresponding page and establishes a clean upstream session from the Lobby.

---

## 5. HeyGen Server-Side Inactivity Timeouts & WebRTC Recovery

When utilizing third-party interactive streams, developers must account for external hosting bounds:

### 5.1 The Inactivity Timeout Constraint
To preserve rendering GPU cluster resources, HeyGen's streaming servers enforce a strict **inactivity timeout (typically 2 to 3 minutes)**. If the user does not speak and no voice buffers are dispatched via `repeatAudio(chunk)` within this window, the remote server terminates the WebRTC peer connection, freezing the avatar's rendering on-screen.

### 5.2 Client-Side Resiliency & Handshake Recovery
To maintain a high-quality presentation, the frontend implements an automated WebRTC recovery state machine:
1.  **Connection Monitor:** The client hooks into the WebRTC `peerConnection.onconnectionstatechange` listener.
2.  **State Cleansing:** If the connection transitions to `failed`, `disconnected`, or `closed`, the client automatically sets a soft reconnection warning.
3.  **Dynamic Session Rebuilding:** When user speech is re-detected, the client:
    *   Tears down the expired WebRTC media streams and closes the peer connection context.
    *   Requests a fresh short-lived session token via `GET /api/heygen-token`.
    *   Initiates a fresh WebRTC session handshake with the rendering node.
    *   Seamlessly re-binds the media stream, allowing the avatar to resume conversation without losing conversational history or forcing a manual browser reload.