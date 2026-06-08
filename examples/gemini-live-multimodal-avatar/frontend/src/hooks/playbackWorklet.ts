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

interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean;
}

declare let AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (options?: unknown): AudioWorkletProcessor;
};

declare function registerProcessor(name: string, processorCtor: (new (options?: unknown) => AudioWorkletProcessor)): void;

/**
 * PlaybackProcessor
 * 
 * A high-performance Circular Ring Buffer implementation for continuous audio playback.
 * Eliminates Main Thread Garbage Collection (GC) pressure by using a fixed 
 * pre-allocated buffer and modulo arithmetic for O(1) reads/writes.
 */
class PlaybackProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private writeIndex = 0;
  private readIndex = 0;
  private isPlaying = false;
  private bufferLength: number;

  constructor() {
    super();
    // Pre-allocate 15 seconds of 24kHz audio (Gemini output format)
    // 15s is more than enough for any single LLM turn in this demo.
    this.bufferLength = 24000 * 15;
    this.buffer = new Float32Array(this.bufferLength);

    this.port.onmessage = (event) => {
      if (event.data.type === 'FLUSH') {
        this.writeIndex = 0;
        this.readIndex = 0;
        this.isPlaying = false;
        this.buffer.fill(0);
      } else if (event.data.type === 'AUDIO') {
        const floatData = new Float32Array(event.data.payload);
        
        // Write data into the circular buffer
        for (let i = 0; i < floatData.length; i++) {
            this.buffer[this.writeIndex] = floatData[i];
            this.writeIndex = (this.writeIndex + 1) % this.bufferLength;
        }
        
        this.isPlaying = true;
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0];
    const channel = output[0];
    
    // If not playing or buffer is "empty" (read caught up to write)
    if (!this.isPlaying || this.readIndex === this.writeIndex) {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = 0;
      }
      if (this.readIndex === this.writeIndex && this.isPlaying) {
        this.isPlaying = false;
      }
      return true;
    }

    for (let i = 0; i < channel.length; i++) {
      if (this.readIndex !== this.writeIndex) {
        channel[i] = this.buffer[this.readIndex];
        this.readIndex = (this.readIndex + 1) % this.bufferLength;
      } else {
        channel[i] = 0;
      }
    }

    return true;
  }
}

registerProcessor('playback-processor', PlaybackProcessor);
