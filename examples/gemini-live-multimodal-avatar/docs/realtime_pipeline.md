# Real-Time Media Streaming & Conversational Ingress Pipelines

## 1. System-Wide Media Ingress Topology

Maintaining sub-second dialogue responsiveness (latency < 800ms) with stateful multi-modal AI avatars requires a zero-allocation, thread-isolated ingress and egress media pipeline. Standard single-threaded web runtimes are vulnerable to main-thread rendering lag, garbage collection spikes, and buffer underruns. 

Our pipeline enforces rigorous separation of concerns across dedicated browser execution planes, using zero-copy memory transfers and real-time audio analysis.

```
 [Microphone Input]
         │
         ▼ (16kHz / 1-channel / 16-bit PCM)
 ┌────────────────────────────────────────────────────────┐
 │ Real-Time Audio Thread (AudioWorkletProcessor)         │
 │   - High-Frequency Hardware Ingestion (32ms frames)    │
 │   - Fast RMS Energy Voice Activity Detection (VAD)     │
 │   - 3-Frame Squelch & True T0 Compensation             │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼ (ArrayBuffer Ownership Transfer)
 ┌────────────────────────────────────────────────────────┐
 │ Isolated Worker Thread (networkWorker.ts)              │
 │   - Bidirectional Upstream WebSocket Gateway           │
 │   - Base64 Encoding & Payload Serialization            │
 │   - Livekit-Client Audio Injection                     │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼ (TCP Frames)
 ┌────────────────────────────────────────────────────────┐
 │ Go Secure Handshake Proxy & Upstream Vertex Live API    │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Ingress Pipeline Engineering

### 2.1 Hardware-Native Capture & AudioWorklet

The user’s microphone stream is captured at a native sample rate of `16kHz`, mono-channel, 16-bit linear PCM. Instead of utilizing legacy `ScriptProcessorNode` (which blocks the main UI rendering thread), we leverage standard **Web Audio API `AudioWorkletNode`** frameworks.
*   **Buffer Ingestion:** Ingestion occurs in low-level rendering frames of 512 samples, translating to a deterministic window of exactly **32ms** per hardware frame.
*   **Hardware-Native VAD:** To bypass heavy ML models on local CPUs, the worklet executes an energy-based **Root Mean Square (RMS)** analysis on incoming PCM Float32 frames:
    $$\text{RMS} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} x_i^2}$$
    An active threshold of `-50dB` is enforced.

### 2.2 The 3-Frame Squelch & True T0 Retrospective Compensation

To prevent ambient clicks, static pops, or keyboards from triggering spurious barge-in actions, we implement a **3-Frame Squelch Filter**:

```
 [Frame In] ──► [Energy < -50dB?]
                      │
           ┌──────────┴──────────┐
          YES                    NO
           │                     │
           ▼                     ▼
     [Increment Counter]   [Reset Counter]
           │                     │
  [Counter == 3?]                ▼
   (Declare Silence)       [User Active]
```

*   **The Squelch Window:** The pipeline requires 3 consecutive frames of silence (totaling **96ms**) before declaring the user has stopped speaking.
*   **True T0 Compensation:** Due to the squelch window, the client-side system only "knows" the user stopped speaking 96ms *after* the physical pause. To prevent this local hardware buffer time from inflating **Time to First Word (TTFW)** metrics, the telemetry module applies a retrospective correction:
    $$T_{\text{True\_Silence}} = T_{\text{Detected}} - 96\text{ms}$$
    This True T0 timestamp forms the starting anchor for all downstream latency profiling.

---

## 3. Concurrency, Codecs & Thread-Isolation Model

### 3.1 Zero-Copy Memory Transfers (`Transferable Objects`)

Under standard JavaScript mechanics, passing typed arrays (like `Int16Array` audio buffers) between workers clones the raw byte structures. This causes frequent allocations, heavy memory churn, and garbage collection pauses that disrupt real-time playback.

The pipeline utilizes **Transferable Objects** to maintain zero-copy efficiency. When transferring raw PCM buffers from the `AudioWorkletProcessor` to the `NetworkWorker`, we pass ownership of the underlying `ArrayBuffer` directly:

```typescript
// Zero-Allocation Buffer Dispatch
this.port.postMessage({
  type: 'AUDIO_CHUNK',
  buffer: audioBuffer.buffer
}, [audioBuffer.buffer]); // Explict transfer list passes memory pointer, avoiding allocation copies.
```
Once transferred, the source context loses read/write access to the buffer, ensuring true concurrency-safe memory management.

### 3.2 Dual-Pathway Socket Routing

Our connection layer (`useGeminiSocket.ts`) dynamically alters its communication model depending on the avatar mode selected:

#### Pathway A: WebWorker-Isolated SDK Client
*   **Isolation Plane:** The official `@google/genai` client SDK runs entirely inside the isolated `networkWorker.ts` WebWorker thread.
*   **SDK Handshake Overrides:** To enable regional routing in browser environments, the worker monkeypatches the standard `WebSocket` constructor. This is necessary because the official SDK prevents initializing with a custom regional endpoint while utilizing local GCP access credentials.
*   **Schema Conversions:** Standard client-side JSON tool declarations are programmatically upper-cased by the worker before transmission, bypassing strict Vertex AI schemas that otherwise trigger upstream `1007 Invalid Argument` errors.

#### Pathway B: Raw Direct Socket Pipeline (Google 1P Video Avatar)
*   **Isolation Plane:** The Google 1P Video Avatar returns multiplexed, fragmented MP4 (fMP4) video segments in tandem with audio streams. Bypassing the worker, the socket connects directly to our Go `ws_proxy` using a raw WebSocket pipeline.
*   **Codec Integration:** The received fMP4 chunks are routed directly to **`mpegts.js`** players on the main thread, feeding the canvas media pipeline directly with zero intermediate formatting steps.

---

## 4. State-Machine Audio Gating & Barge-In Squelch

During conversational exchanges, the Gemini Live API maintains an active state-machine that is sensitive to real-time inputs. A critical failure mode arises during **Asynchronous Tool Execution** (MCP operations).

If background audio (e.g. ambient coughs or keyboard typing) streams into the WebSocket while Gemini is waiting for a database check or ledger transaction to complete, the upstream Live API is vulnerable to **Spurious Cancellation Loops**. The incoming audio frames trigger a model interrupt, causing Gemini to abort the pending transaction mid-flight and restart its thinking cycle.

To prevent this, the client-side orchestrator enforces a robust **State-Machine Audio Gate**:

```
      State: [isProcessingTool == true]
                       │
                       ▼ (Microphone Ingress)
              [Audio Ingestion Gate]
                       │
             ┌─────────┴─────────┐
            YES                  NO
             │                   │
             ▼                   ▼
     [Silent Frame Drop]   [Pass to Worker]
             │
             ▼ (Drop Frame)
   (Prevent Spurious Barge-In)
```

While `isProcessingTool` is active:
1.  Incoming microphone buffers are strictly discarded at the entry point of `useGeminiLive.ts`.
2.  The `NetworkWorker` socket queue is filled with zero-padded silent frames rather than raw microphone audio.
3.  The model executes its operations in a clean, silent, sandboxed environment, preventing premature interruption loops.

---

## 5. Real-Time Telemetry & The Latency Racetrack

To measure execution delays, we collect high-resolution timestamps ($t$) throughout the entire round-trip conversational loop:

```
──────────────────────────────────────────────────────────────────────────────────────────
[t0] User Stopped Speaking (True T0)
 └── [t1] Audio Packet Sent Upstream (networkWorker.ts)
      └── [t2] First Byte Received from Upstream (Go ws_proxy)
           └── [t3] Speaker Output Initialized ('audio-playback-started' Event)
──────────────────────────────────────────────────────────────────────────────────────────
```

Using these anchors, the Telemetry pipeline measures and visualizes:
1.  **Upstream Transit Latency:** ($t_1 - t_0$) measures client-to-server buffer dispatch latency.
2.  **Inference Thinking Time:** ($t_2 - t_1$) isolates the model's cognitive latency (reduced by enforcing minimal thinking configurations).
3.  **Time to First Word (TTFW):** ($t_3 - t_0$) represents the definitive human-perceived system responsiveness metric.

This data is packaged into structured telemetry messages, transferred to the UI thread, and updated dynamically inside the **Racetrack Visualization** sidebar. This provides a transparent, live breakdown of system efficiency.