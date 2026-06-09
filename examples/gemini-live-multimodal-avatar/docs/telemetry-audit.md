# Multi-Threaded Latency Profiling & Conversational Telemetry Auditing

## Executive Summary & Design Philosophy

Measuring performance in real-time multi-modal conversational AI pipelines is fundamentally different from auditing standard RESTful systems. Traditional HTTP round-trip-time (RTT) metrics fail when media streams are processed asynchronously across separate execution contexts—specifically, real-time browser AudioWorklets, background WebWorker codecs, regional up-stream proxies, and external stateful WebSocket APIs. 

To achieve transparent observability, this system implements an event-driven telemetry architecture. We measure and audit performance using rigorous, multi-threaded timing anchors to isolate local browser capture latency, network transit times, model cognitive intervals, and downstream presentation rendering delays.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 THE TIMING EVENT RACE                  │
                  ├───────────┬───────────────────┬─────────────┬──────────┤
                  │ Capture   │ Upstream Transit  │ Cognition   │ Render   │
                  │ (VAD RMS) │ (zero-copy post)  │ (JSON-RPC)  │ (MSE)    │
                  ├───────────┴───────────────────┴─────────────┴──────────┤
                  │◄────────────── totalTurnLatency (TTFW) ───────────────►│
                  └────────────────────────────────────────────────────────┘
```

---

## 1. Mathematical Metric Formulations & Dictionary

Every metrics identifier corresponds to a precise mathematical timing interval. The definitions below serve as the authoritative standard for system performance tracking:

### 1.1 Time to First Word (TTFW) / Wait Latency ($totalTurnLatency$)
Perceived user waiting latency (Glass-to-Glass) represents the actual delay between when a user stops speaking and the first millisecond of audio playback or visual motion occurs.
$$totalTurnLatency = T_{\text{playback\_start}} - T_{\text{user\_silence}}$$
*   **$T_{\text{user\_silence}}$:** The millisecond the local browser VAD engine determines speaking has ended, applying retrospective hardware-buffer compensation.
*   **$T_{\text{playback\_start}}$:** The moment the browser's audio context registers the `'audio-playback-started'` event.

### 1.2 Model Cognitive Latency ($aiProcessingLatency$)
Isolates the inference thinking time of the Gemini Live API.
$$aiProcessingLatency = T_{\text{first\_byte\_recv}} - T_{\text{last\_chunk\_sent}}$$
*   **$T_{\text{last\_chunk\_sent}}$:** The timestamp when the final voice packet of an utterance is flushed by the background `networkWorker.ts`.
*   **$T_{\text{first\_byte\_recv}}$:** The timestamp when the Go `ws_proxy` captures the first non-empty audio or text streaming segment from the upstream Vertex API.

### 1.3 Tool Execution Overhead ($toolExecutionLatency$)
Measures the complete lifecycle of a Model Context Protocol (MCP) transaction.
$$toolExecutionLatency = T_{\text{rpc\_result\_sent}} - T_{\text{rpc\_request\_recv}}$$
*   **$T_{\text{rpc\_request\_recv}}$:** The timestamp when the client parses a `toolCall` request from the WebSocket.
*   **$T_{\text{rpc\_result\_sent}}$:** The timestamp when the client finishes POSTing the operation to `/api/mcp` and writes the success envelope back to the WebSocket.

### 1.4 Animation Sync Drift ($animationSyncDrift$)
Tracks visual dubbing accuracy (audio-to-lip alignment).
$$animationSyncDrift = T_{\text{avatar\_lip\_motion}} - T_{\text{audio\_speaker\_render}}$$
*   **$T_{\text{audio\_speaker\_render}}$:** The exact millisecond the local `AudioContext` begins speaker playback.
*   **$T_{\text{avatar\_lip\_motion}}$:** The timestamp of the animation frame painting cycle corresponding to the audio segment. Target: $< 50\text{ms}$.

---

## 2. Token Auditing & Incremental Aggregations

In full-duplex conversational sessions, token metadata is emitted incrementally across persistent stream frames rather than inside a single, terminal JSON response. To accurately capture session costs, the background WebWorker executes the following aggregation rules:

```
  Stream Input Chunks                       Stream Output Chunks
  [Chunk 1: context_size]                  [Chunk 1: response_tokens: 3]
  [Chunk 2: context_size]                  [Chunk 2: response_tokens: 5]
            │                                           │
            ▼ (Peak Selection)                          ▼ (Cumulative Sum)
      Peak Input Context                        Peak Output Cost = Sum(3 + 5)
```

1.  **Context Size (Input Tokens):** Emitted as `promptTokenCount` in each packet. Because this value can grow mid-turn due to tool injections, we apply **Peak Value Extraction**:
    $$\text{Total Input} = \max(x_1, x_2, \dots, x_n)$$
2.  **Generation Cost (Output Tokens):** Emitted incrementally as `responseTokenCount`. We apply **Cumulative Summation** to compute total generation weights:
    $$\text{Total Output} = \sum_{i=1}^{n} \text{responseTokenCount}_i$$

---

## 3. Conversational Telemetry Routing & Logging Taxonomy

To minimize performance overhead during real-time media rendering, the application enforces an **Event-Buffered Routing Pipeline**:

```
[AudioWorklet / WebWorker] ────(PostMessage)────► [React TelemetryContext]
                                                            │
                                                            │ (Buffer in Local Memory)
                                                            ▼
[Local CSV File / Cloud Logging] ◄────(POST /api/telemetry)─┘ (Triggered on Turn End)
```

1.  **High-Frequency Buffering:** Latency events and token counts are buffered inside the browser thread's `TelemetryContext` memory, preventing network calls during active model generation.
2.  **Batch Flushes:** The buffered metrics payload is flushed to the Go backend via `POST /api/telemetry` exactly once per turn, triggered by the `turnEndTimestamp` event.

### 3.1 Console Taxonomy
Debugging logs follow a strict `[Phase: X]` taxonomy inside the browser terminal, allowing developers to trace turns sequentially:

```text
[Telemetry] [Phase: Input] USER_STOPPED_SPEAKING (True T0 established)
[Telemetry] [Phase: Tool] Gemini requested tool: initiate_transfer
[Telemetry] [Phase: Tool] TOOL_CALL_END (Value: 145.00ms)
[Telemetry] [Phase: LLM] LLM_FIRST_BYTE (Value: 395.00ms)
[Telemetry] [Phase: Playback] AUDIO_PLAYBACK_START (Value: 540.00ms)
```

### 3.2 Turn Receipts
Upon turn completion, a structured `console.table` "Turn Receipt" is printed in the terminal, aggregating performance and token metrics:

```text
[Telemetry] [Turn Receipt] session_id_a89bc
┌────────────────────────┬──────────┐
│        (index)         │  Values  │
├────────────────────────┼──────────┤
│   totalTurnLatency     │  540.00  │
│  aiProcessingLatency   │  395.00  │
│  toolExecutionLatency  │  145.00  │
│  inputTokens           │  1580    │
│  outputTokens          │  124     │
└────────────────────────┴──────────┘
```

---

## 4. Local Persistence & Auditing (`telemetry_logs.csv`)

The backend automatically persists metrics to a flat CSV file, `telemetry_logs.csv`, located at the workspace root, formatted with the following columns:

```csv
TurnID,Timestamp,AudioMode,MetricKey,MetricValue,ToolName,UserText,ModelText
t_9281a,2026-06-04T13:42:01Z,google_1p,totalTurnLatency,540.00,initiate_transfer,"Transfer $50 to savings","Completed"
```

*   **Local Development:** Saved locally to disk, allowing developers to run historical latency analysis and performance profiling.
*   **GCP Cloud Run Deployments:** Written to the container's **ephemeral filesystem**. Note that Cloud Run containers are stateless and scale down dynamically, meaning this CSV file will be reset when instances scale down. For production environments, route telemetry data to GCP BigQuery or Cloud Monitoring.

---

## 5. Temporal Math & Squelch Compansations

To ensure high-precision telemetry, we account for hardware and filtering lag when calculating response times:

1.  **VAD Detection Delay:** The local VAD engine in `recorderWorklet.ts` reads 16kHz PCM audio in 32ms chunks (512 samples) and applies a 3-frame silence rule (96ms) to filter noise.
2.  **Retrospective Correction:** To isolate true latency from this detection window, the starting anchor ($T_{\text{user\_silence}}$) is computed retrospectively:
    $$T_{\text{user\_silence}} = T_{\text{VAD\_trigger}} - 96\text{ms}$$
    This math ensures the True T0 accurately reflects the physical pause in user speech.