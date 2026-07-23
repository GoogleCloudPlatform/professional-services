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

import type { TelemetryMetrics, NumericTelemetryMetric } from '../types/telemetry';

/**
 * TelemetryService
 * 
 * A high-performance, strictly typed timer utility for accurate latency tracking
 * across Web Workers and the main UI thread. Uses Date.now() for 
 * universal epoch timestamp synchronization across threads.
 */
export class TelemetryService {
    private timers: Map<string, number> = new Map();

    /**
     * Starts or restarts a timer for the given key.
     */
    public startTimer(key: NumericTelemetryMetric) {
        this.timers.set(key, Date.now());
    }

    /**
     * Sets a timer for the given key with a specific start time.
     */
    public setTimer(key: NumericTelemetryMetric, startTime: number) {
        this.timers.set(key, startTime);
    }

    /**
     * Stops the timer and returns the elapsed time in milliseconds.
     * Returns undefined if the timer was never started.
     */
    public stopTimer(key: NumericTelemetryMetric): number | undefined {
        const start = this.timers.get(key);
        if (start === undefined) return undefined;
        
        const elapsed = Date.now() - start;
        this.timers.delete(key);
        return elapsed;
    }

    /**
     * Clears a timer without returning its value.
     */
    public clearTimer(key: NumericTelemetryMetric) {
        this.timers.delete(key);
    }

    /**
     * Returns the elapsed time in milliseconds without stopping/deleting the timer.
     * Useful for checking intermediate milestones (like TTFB) while waiting for 
     * a final milestone (like G2G).
     */
    public getElapsed(key: NumericTelemetryMetric): number | undefined {
        const start = this.timers.get(key);
        if (start === undefined) return undefined;
        
        return Date.now() - start;
    }
}

// Export a singleton instance for use across the application
export const telemetry = new TelemetryService();

/**
 * UI Utilities for telemetry data formatting and styling.
 */

export type LatencyColorType = 'success.main' | 'warning.main' | 'error.main' | 'text.secondary' | 'text.disabled';

/**
 * Returns the theme color key for a given latency value based on business thresholds.
 */
export const getLatencyColorName = (latency?: number, isStale?: boolean): LatencyColorType => {
  if (isStale) return 'text.disabled';
  if (latency === undefined || latency === 0) return 'text.secondary';
  if (latency <= 3000) return 'success.main';
  if (latency <= 5000) return 'warning.main';
  return 'error.main';
};

/**
 * Formats a numeric latency value (in ms) into a rounded string with units.
 * Returns '--' if the value is undefined.
 */
export const formatLatency = (latency?: number): string => {
  return latency !== undefined ? `${Math.round(latency)}ms` : '--';
};

export const VAD_OVERHEAD = 96; // 3 audio chunks * 32ms per chunk (Local hardware batching)

export interface RacetrackSegments {
  inputDuration: number;
  geminiDuration: number;
  toolDuration: number;
  playbackDuration: number;
  totalResponseTime: number;
  interruptionLatency?: number;
}

/**
 * Calculates the logical latency segments for the Telemetry Racetrack visualization.
 */
export const calculateRacetrackSegments = (metrics: Partial<TelemetryMetrics>): RacetrackSegments => {
  const total = metrics.totalTurnLatency || 0;
  const ttfb = metrics.aiProcessingLatency || 0;
  const toolDuration = metrics.toolExecutions?.reduce((acc, te) => acc + (te.latency || 0), 0) || 0;
  const vadOverhead = metrics.vadOverhead ?? VAD_OVERHEAD;
  
  // 1. Input: VAD (dynamic local buffer based on hardware, fallback to ~3 frames)
  // We keep this separate for the visual bar, but the UI will group it logically into "Processing & Pacing"
  const inputDuration = vadOverhead;
  
  // 2. LLM: The Green Bar (Gemini Processing + Tool Waiting)
  // Because the LLM pauses while the tool executes, the total time we waited for the network is ttfb + toolDuration.
  // The visual striped overlay is drawn INSIDE this green bar.
  const totalNetworkWait = ttfb + toolDuration;
  const geminiDuration = Math.max(0, totalNetworkWait - vadOverhead);
  
  // 3. Rendering Overhead: Time after the network returns the first audio byte until the avatar actually moves.
  const playbackDuration = total > 0 ? Math.max(0, total - totalNetworkWait) : 0;
  
  return {
    inputDuration,
    geminiDuration,
    toolDuration,
    playbackDuration,
    totalResponseTime: total,
    interruptionLatency: metrics.interruptionLatency,
  };
};
