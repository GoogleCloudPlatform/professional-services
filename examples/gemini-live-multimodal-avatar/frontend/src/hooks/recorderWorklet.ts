/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This is a vanilla JS/TS file that will be loaded as an AudioWorklet.
// It cannot easily import external modules in many build setups without configuration.
// We include the conversion logic directly here for the background thread.

interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare let AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new(): AudioWorkletProcessor;
};

declare function registerProcessor(name: string, processorCtor: (new (options?: unknown) => AudioWorkletProcessor)): void;

declare const sampleRate: number;

class RecorderProcessor extends AudioWorkletProcessor {
  private bufferSize = 512; // ~32ms at 16kHz
  private buffer = new Float32Array(this.bufferSize);
  private bufferIndex = 0;
  private isMuted = false;

  // VAD (Voice Activity Detection) tracking
  private silenceFrames = 0;
  private isSpeaking = false;
  private energyThreshold = 0.005; // Adjust based on background noise
  private silenceThresholdFrames = 3; // 3 frames * 32ms = ~96ms of silence required to trigger EoU

  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data.type === 'SET_MUTED') {
        this.isMuted = event.data.payload;
        if (this.isMuted) {
          // Clear buffer on mute to prevent stale audio being sent on unmute
          this.buffer.fill(0);
          this.bufferIndex = 0;
          if (this.isSpeaking) {
            this.isSpeaking = false;
            // Calculate EXACT latency overhead based on hardware environment
            const exactDelayMs = (this.bufferSize / sampleRate) * 1000 * this.silenceThresholdFrames;
            this.port.postMessage({ type: 'VAD_SILENCE', delayMs: exactDelayMs });
          }
        }
      }
    };
  }

  process(inputs: Float32Array[][]): boolean {
    if (this.isMuted) return true;

    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputChannel = input[0];
    
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];
      
      if (this.bufferIndex >= this.bufferSize) {
        this.processVAD();
        this.sendBuffer();
        this.bufferIndex = 0;
      }
    }

    return true;
  }

  private processVAD() {
    // Calculate RMS energy of the current buffer
    let sumSquares = 0;
    for (let i = 0; i < this.bufferSize; i++) {
        sumSquares += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.bufferSize);

    if (rms > this.energyThreshold) {
        // Voice detected
        if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.port.postMessage({ type: 'VAD_START' });
        }
        this.silenceFrames = 0;
    } else {
        // Silence detected
        if (this.isSpeaking) {
            this.silenceFrames++;
            if (this.silenceFrames >= this.silenceThresholdFrames) {
                this.isSpeaking = false;
                // Calculate EXACT latency overhead based on hardware environment
                // sampleRate is globally available in AudioWorkletGlobalScope
                const exactDelayMs = (this.bufferSize / sampleRate) * 1000 * this.silenceThresholdFrames;
                this.port.postMessage({ type: 'VAD_SILENCE', delayMs: exactDelayMs });
            }
        }
    }
  }

  private sendBuffer() {
    // 1. Convert Float32 to Int16
    const pcmData = new Int16Array(this.buffer.length);
    for (let i = 0; i < this.buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, this.buffer[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // 2. Post to main thread using TRANSFERABLES for zero-copy performance
    // We send the underlying buffer. The Worklet thread yields ownership.
    this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
