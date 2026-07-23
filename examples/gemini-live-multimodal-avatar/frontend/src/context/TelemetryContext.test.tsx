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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useTelemetry, TelemetryProvider } from './TelemetryContext';
import { apiClient } from '../api/client';

vi.mock('../api/client', () => ({
    apiClient: {
        post: vi.fn().mockResolvedValue({}),
    }
}));

describe('TelemetryContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('provides the default empty telemetry metrics and empty history', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <TelemetryProvider>{children}</TelemetryProvider>;
        const { result } = renderHook(() => useTelemetry(), { wrapper });

        expect(result.current.metrics).toEqual({});
        expect(result.current.history).toEqual([]);
    });

    it('allows updating the telemetry metrics and appends to history', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <TelemetryProvider>{children}</TelemetryProvider>;
        const { result } = renderHook(() => useTelemetry(), { wrapper });

        act(() => {
            result.current.startTurn('turn_1');
            result.current.recordMetric('ttsProcessingLatency', 120);
            result.current.recordMetric('networkPing', 15);
            result.current.recordMetric('aiProcessingLatency', 50);
        });

        expect(result.current.metrics.ttsProcessingLatency).toBe(120);
        expect(result.current.metrics.networkPing).toBe(15);
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].ttsProcessingLatency).toBe(120);

        act(() => {
            result.current.recordMetric('totalTurnLatency', 100);
        });

        expect(result.current.metrics.ttsProcessingLatency).toBe(120);
        expect(result.current.metrics.totalTurnLatency).toBe(100);
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].totalTurnLatency).toBe(100);
    });

    it('accumulates token metrics correctly during a streaming turn', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <TelemetryProvider>{children}</TelemetryProvider>;
        const { result } = renderHook(() => useTelemetry(), { wrapper });

        act(() => {
            result.current.startTurn('streaming_turn');
            // First chunk of the turn (e.g., initial prompt to tool call)
            result.current.recordMetric('inputTokens', 1000);
            result.current.recordMetric('outputTokens', 50);
            result.current.recordMetric('totalTokens', 1050); // Total is just replaced
            result.current.recordMetric('aiProcessingLatency', 100);
            result.current.recordMetric('userText', 'Hello, how are you?');
            result.current.recordMetric('modelText', 'I am doing well.');
        });

        expect(result.current.history[0].inputTokens).toBe(1000);
        expect(result.current.history[0].outputTokens).toBe(50);
        expect(result.current.history[0].totalTokens).toBe(1050);
        expect(result.current.history[0].userText).toBe('Hello, how are you?');
        expect(result.current.history[0].modelText).toBe('I am doing well.');

        act(() => {
            // Second chunk of the turn (e.g., tool response to final generation)
            // Input tokens grow (context window expands)
            result.current.recordMetric('inputTokens', 1500); 
            // Model generates more text (we should TAKE PEAK output tokens, not sum)
            result.current.recordMetric('outputTokens', 120);
            // SDK sends total cumulative count for this chunk (1500 + 120) = 1620
            result.current.recordMetric('totalTokens', 1620);
            // In a real scenario, the transcript is usually updated with the full text at the end
            result.current.recordMetric('modelText', 'I am doing well. Can I help you with anything else?');
        });

        // Verify the Math.max logic for inputTokens (it took the peak size)
        expect(result.current.history[0].inputTokens).toBe(1500);
        
        // Verify the Math.max logic for outputTokens (took 120 instead of summing 50 + 120)
        expect(result.current.history[0].outputTokens).toBe(120);

        // Verify total is Math.max (took 1620)
        expect(result.current.history[0].totalTokens).toBe(1620);

        // Verify the latest text is kept
        expect(result.current.history[0].modelText).toBe('I am doing well. Can I help you with anything else?');
    });

    it('limits history to the last 20 items', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <TelemetryProvider>{children}</TelemetryProvider>;
        const { result } = renderHook(() => useTelemetry(), { wrapper });

        act(() => {
            for (let i = 0; i < 25; i++) {
                result.current.startTurn(`turn_${i}`);
                result.current.recordMetric('ttsProcessingLatency', i);
                result.current.recordMetric('aiProcessingLatency', i + 1);
            }
        });

        expect(result.current.history).toHaveLength(20);
        // The last item should have ttsProcessingLatency: 24
        expect(result.current.history[19]).toEqual(expect.objectContaining({ ttsProcessingLatency: 24 }));
        // The first item should have ttsProcessingLatency: 5
        expect(result.current.history[0]).toEqual(expect.objectContaining({ ttsProcessingLatency: 5 }));
    });

    it('throttles backend sync to only fire when turnEndTimestamp is recorded', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <TelemetryProvider>{children}</TelemetryProvider>;
        const { result } = renderHook(() => useTelemetry(), { wrapper });

        act(() => {
            result.current.startTurn('turn_sync_test');
            result.current.recordMetric('userSilenceTimestamp', 100);
            result.current.recordMetric('aiProcessingLatency', 200);
            result.current.recordMetric('toolExecutionLatency', 50, { toolName: 'test_tool' });
        });

        // Backend API should NOT have been called yet
        expect(apiClient.post).not.toHaveBeenCalled();

        act(() => {
            result.current.recordMetric('turnEndTimestamp', 1000);
        });

        // Backend API should now be called exactly once
        expect(apiClient.post).toHaveBeenCalledTimes(1);
        expect(apiClient.post).toHaveBeenCalledWith('/telemetry', expect.any(Object));
    });

    it('throws an error if useTelemetry is used outside of TelemetryProvider', () => {
        const originalError = console.error;
        console.error = () => {};
        
        expect(() => {
            renderHook(() => useTelemetry());
        }).toThrow('useTelemetry must be used within a TelemetryProvider');
        
        console.error = originalError;
    });
});
