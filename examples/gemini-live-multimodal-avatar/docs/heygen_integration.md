# HeyGen LiveAvatar Integration Guide

This guide explains how the [HeyGen LiveAvatar API](https://docs.liveavatar.com/) is integrated into the Live API Demo, providing real-time lip-syncing for the Gemini AI.

## Prerequisites and Setup

Before the integration can function, you must have a valid HeyGen API key and configure your local environment.

### Securing a HeyGen API Key
1. **Log in** to your [HeyGen account](https://www.liveavatar.com/).
1. Click on your **Profile Name** in the bottom-left corner.
1. Go to **Space Settings**.
...
1. Click **Generate Key** (or copy your existing one).
1. **Important:** Add this key to your local `.env` file as `HEYGEN_API_KEY`.
*Never commit this key to version control.*

> [!NOTE]
> **API Billing:** API usage for the Interactive Avatar is billed from your **API Dashboard Balance**, which is separate from the standard credits used in the HeyGen web interface. Ensure you have a balance in the API section of your settings to avoid "402 Payment Required" errors.

### Setting the Avatar ID
You also need a `HEYGEN_AVATAR_ID` in your `.env`.
You can find this ID in the HeyGen Studio when viewing your custom avatars.

## Architecture Overview

The system creates a low-latency WebRTC pipeline:

1. **Gemini Live API**: Streams real-time audio to our React app.
1. **React Frontend**: Receives this audio and converts it into a LiveKit `LocalAudioTrack`.
1. **LiveKit Room**: A virtual room where the User (our app) and the Participant (HeyGen Avatar) reside.
1. **HeyGen Avatar**: Subscribes to the audio track we publish and generates synchronized video frames.

## Secure Session Initialization

To prevent exposing the `HEYGEN_API_KEY` to the browser, the frontend never directly talks to the HeyGen API to create a session.
Instead:

1. The React app requests a session from our Go backend.
1. The Go backend (`internal/service/heygen.go`) calls `https://api.liveavatar.com/v1/sessions/token` using the secure API key.
1. The backend returns a short-lived `session_token` to the frontend.

## React Implementation

The frontend handles the heavy lifting of managing the avatar session and pushing the audio stream. We use the `@heygen/liveavatar-web-sdk`.

### Initialize and Attach the Session
The frontend uses the SDK to start the session using the token retrieved from the backend.
Instead of manually managing WebRTC video tracks, we use the SDK's built-in `session.attach(videoElement)` method to automatically bind the avatar's video stream to a standard HTML `<video>` tag. To handle React Strict Mode, we implement a 50ms artificial delay before calling `.start()` inside `useHeygenSession.ts` to prevent double-initialization crashes.

### Feeding Gemini Audio to HeyGen (Low-Latency Stream)

Our architecture uses a high-frequency injection pattern to feed Gemini's audio to the avatar with minimal buffer overhead:

1. **Reactive Injection via `repeatAudio`**: We do not wait for the entire Gemini sentence to finish. As soon as the `NetworkWorker` receives a Base64 audio chunk from the WebSocket, it is proxied to the `AvatarDisplay` component, which calls `session.repeatAudio(base64Audio)`.
2. **The First Chunk Trigger**: We use a `hasLoggedChunkRef` to track the exact moment the first chunk of a conversational turn is handed to the HeyGen SDK. This provides a clear "T1" timestamp for telemetry.
3. **Resilient Audio Queuing**: If Gemini starts speaking before the HeyGen session is fully "Ready," the application does not drop the audio. It stores the chunks in a local `audioQueueRef` and automatically flushes them the millisecond the session is attached to the video element.
4. **Sub-Second Synchronization**: By using the SDK's `avatar.speak_started` event, the telemetry system captures the **`animationSyncDrift`**. This measures the precise delay between the start of local audio playback (stored in `window.lastAudioPlaybackStart`) and the avatar's first lip movement, ensuring a seamless experience.

### Voice-Only Fallback
The application is designed to be resilient. If the HeyGen service is permanently unavailable (due to missing API keys or exhausted credits), the app automatically falls back to a "Voice-Only" mode. Users can also manually toggle the avatar visibility using the dropdown in the sidebar. In both cases, the core Gemini Live audio experience remains fully functional.

**Network Resilience:** To handle temporary unreachability (such as `502 Bad Gateway` errors during Cloud Run cold starts), the frontend's `fetchHeygenToken` implementation deliberately allows network errors to bubble up to `@tanstack/react-query`. Instead of immediately downgrading the user to Voice-Only mode upon a transient failure, React Query will pause the UI in the "Initializing Avatar..." state and automatically retry the token fetch using exponential backoff until the backend successfully boots.

### Session Lifecycle
When the user transitions to Voice-Only mode, the `useHeygenSession` hook detects the missing token and forcefully calls `session.stop()` to gracefully terminate the connection, saving concurrency tokens and API credits. 

### Interruptions
When the user interrupts the AI (detected via local Hardware VAD), we immediately call `session.interrupt()`. This clears the avatar's current animation queue and resets the `hasLoggedChunkRef`, allowing the avatar to instantly react to the user's new input.

## Technical Considerations

* **GPU Acceleration:** Always apply CSS rules like `transform: 'translateZ(0)'` and `willChange: 'transform'` to the video element. This forces the browser to render the high-framerate avatar video on a dedicated GPU compositor layer, preventing UI thread starvation.