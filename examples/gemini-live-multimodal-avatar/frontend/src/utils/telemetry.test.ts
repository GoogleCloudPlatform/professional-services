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

import { describe, it, expect } from 'vitest';
import { calculateRacetrackSegments, VAD_OVERHEAD } from './telemetry';

describe('calculateRacetrackSegments', () => {
    it('calculates the happy path correctly', () => {
        const metrics = {
            totalTurnLatency: 1200,
            aiProcessingLatency: 400,
        };

        const segments = calculateRacetrackSegments(metrics);
        
        expect(segments.inputDuration).toBe(VAD_OVERHEAD);
        expect(segments.geminiDuration).toBe(400 - VAD_OVERHEAD); // 304
        expect(segments.toolDuration).toBe(0);
        expect(segments.playbackDuration).toBe(1200 - 400 - 0); // 800
        expect(segments.totalResponseTime).toBe(1200);
    });

    it('calculates the tool-heavy path correctly without inflating LLM thinking', () => {
        const metrics = {
            totalTurnLatency: 16000,
            aiProcessingLatency: 1000,
            toolExecutions: [
                { toolName: 'test', latency: 14000, timestamp: 0 }
            ]
        };

        const segments = calculateRacetrackSegments(metrics);

        expect(segments.inputDuration).toBe(VAD_OVERHEAD);
        // geminiDuration now visually encapsulates the total network wait (ttfb + toolDuration)
        expect(segments.geminiDuration).toBe(1000 + 14000 - VAD_OVERHEAD); // 14904
        expect(segments.toolDuration).toBe(14000);
        expect(segments.playbackDuration).toBe(16000 - (1000 + 14000)); // 1000
        expect(segments.totalResponseTime).toBe(16000);
    });

    it('clamps negative paradox values to zero', () => {
        const metrics = {
            totalTurnLatency: 300,
            aiProcessingLatency: 500, // Implies TTFB was somehow greater than total response time
        };

        const segments = calculateRacetrackSegments(metrics);

        expect(segments.inputDuration).toBe(VAD_OVERHEAD);
        expect(segments.geminiDuration).toBe(500 - VAD_OVERHEAD); // 404
        expect(segments.toolDuration).toBe(0);
        // Playback duration should be clamped to 0 since 300 - 500 - 0 = -200
        expect(segments.playbackDuration).toBe(0);
        expect(segments.totalResponseTime).toBe(300);
    });

    it('handles a completely empty state gracefully', () => {
        const metrics = {};

        const segments = calculateRacetrackSegments(metrics);

        expect(segments.inputDuration).toBe(VAD_OVERHEAD);
        // Both ttfb and total will be 0
        expect(segments.geminiDuration).toBe(0); // Math.max(0, 0 - 400) -> 0
        expect(segments.toolDuration).toBe(0);
        expect(segments.playbackDuration).toBe(0); // Since total is 0, defaults to 0
        expect(segments.totalResponseTime).toBe(0);
    });

    it('handles multiple tool executions', () => {
        const metrics = {
            totalTurnLatency: 5000,
            aiProcessingLatency: 500,
            toolExecutions: [
                { toolName: 'tool_1', latency: 1000, timestamp: 0 },
                { toolName: 'tool_2', latency: 1500, timestamp: 0 }
            ]
        };

        const segments = calculateRacetrackSegments(metrics);

        expect(segments.toolDuration).toBe(2500);
        expect(segments.geminiDuration).toBe(500 + 2500 - VAD_OVERHEAD); // 2904
        expect(segments.playbackDuration).toBe(5000 - (500 + 2500)); // 2000
    });
});