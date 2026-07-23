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

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { TelemetryMetrics, TelemetryMetricKey } from '../types/telemetry';
import { apiClient } from '../api/client';

interface TelemetryState {
    metrics: TelemetryMetrics;
    history: TelemetryMetrics[];
    currentTurnId?: string;
    modelName?: string;
}

type TelemetryAction = 
    | { type: 'START_TURN'; turnId: string }
    | { type: 'CANCEL_TURN' }
    | { type: 'RECORD_METRIC'; key: TelemetryMetricKey; value: number | string; metadata?: Record<string, unknown>; audioMode?: string }
    | { type: 'CLEAR_HISTORY' }
    | { type: 'SET_MODEL_NAME'; modelName: string };

interface TelemetryContextType {
    metrics: TelemetryMetrics;
    history: TelemetryMetrics[];
    currentTurnId?: string;
    modelName?: string;
    startTurn: (turnId: string) => void;
    cancelTurn: () => void;
    recordMetric: (key: TelemetryMetricKey, value: number | string, metadata?: Record<string, unknown>) => void;
    clearHistory: () => void;
    setModelName: (modelName: string) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

const telemetryReducer = (state: TelemetryState, action: TelemetryAction): TelemetryState => {
    switch (action.type) {
        case 'START_TURN':
            return {
                ...state,
                currentTurnId: action.turnId,
                metrics: {}, // Reset current metrics for the new turn
            };
        case 'CANCEL_TURN':
            // Remove the active turn from history if it's currently pending
            return {
                ...state,
                currentTurnId: undefined,
                metrics: {},
                history: state.history.filter(h => h.turnId !== state.currentTurnId)
            };
        case 'CLEAR_HISTORY':
            localStorage.removeItem('telemetry_history');
            return {
                ...state,
                metrics: {},
                history: [],
                currentTurnId: undefined
            };
        case 'SET_MODEL_NAME':
            return {
                ...state,
                modelName: action.modelName
            };
        case 'RECORD_METRIC': {
            const updatedMetrics = { 
                ...state.metrics, 
                [action.key]: action.value 
            };
            const updatedHistory = [...state.history];

            // Helper to create tool execution object if applicable
            const makeToolExecution = (value: number | string, meta?: Record<string, unknown>) => {
                 if (action.key === 'toolExecutionLatency' && typeof value === 'number' && meta && meta.toolName) {
                     return {
                         toolName: meta.toolName as string,
                         latency: value,
                         timestamp: Date.now()
                     };
                 }
                 return null;
            };

            const toolExec = makeToolExecution(action.value, action.metadata);

            const createEntry = (turnId: string | undefined): TelemetryMetrics => {
                const entry = {
                    [action.key]: action.value,
                    turnId,
                    audioMode: action.audioMode,
                    modelName: state.modelName,
                    timestamp: Date.now()
                } as TelemetryMetrics;
                if (toolExec) {
                    entry.toolExecutions = [toolExec];
                }
                return entry;
            };

            if (!state.currentTurnId) {
                // One-off event
                updatedHistory.push(createEntry(undefined));
            } else if (updatedHistory.length > 0 && updatedHistory[updatedHistory.length - 1].turnId === state.currentTurnId) {
                // Same turn! Merge the metrics into the same history slot!
                const lastEntry = { ...updatedHistory[updatedHistory.length - 1] };
                
                const key = action.key;
                const val = action.value;

                if (key === 'aiProcessingLatency' && typeof val === 'number') {
                    lastEntry.aiProcessingLatency = (lastEntry.aiProcessingLatency || 0) + val;
                } else if (key === 'totalTurnLatency' && typeof val === 'number') {
                    lastEntry.totalTurnLatency = Math.max(lastEntry.totalTurnLatency || 0, val);
                } else if ((key === 'outputTokens' || key === 'totalTokens' || key === 'inputTokens') && typeof val === 'number') {
                    // Capture peak token sizes (cumulative across chunks within a single turn)
                    lastEntry[key] = Math.max(lastEntry[key] as number || 0, val);
                } else {
                    // Generic fallback for all other keys (including string keys like userText/modelText)
                    const entry = lastEntry as Record<string, unknown>;
                    entry[key] = val;
                }
                if (action.audioMode) lastEntry.audioMode = action.audioMode;
                if (state.modelName) lastEntry.modelName = state.modelName;
                if (toolExec) {
                    lastEntry.toolExecutions = lastEntry.toolExecutions || [];
                    lastEntry.toolExecutions.push(toolExec);
                }
                updatedHistory[updatedHistory.length - 1] = lastEntry;
            } else {
                // New turn entry
                updatedHistory.push(createEntry(state.currentTurnId));
            }

            // Filter out 'empty' turns from history array before pushing to UI
            // We ALWAYS preserve the current active turn so partial metrics aren't wiped out before completion.
            let cleanHistory = updatedHistory.filter(h => 
                h.turnId === state.currentTurnId ||
                (h.totalTurnLatency !== undefined && h.totalTurnLatency >= 0) || 
                (h.aiProcessingLatency !== undefined && h.aiProcessingLatency >= 0)
            );

            if (cleanHistory.length > 20) {
                cleanHistory = cleanHistory.slice(cleanHistory.length - 20);
            }

            // Dump to localStorage for persistence
            localStorage.setItem('telemetry_history', JSON.stringify(cleanHistory));

            // Log a receipt to the console for easy validation
            // Only log if the turn is effectively "complete" with a turnEndTimestamp
            if (action.key === 'turnEndTimestamp') {
                const finalEntry = cleanHistory[cleanHistory.length - 1];
                if (finalEntry) {
                    console.log(`[Telemetry] [Turn Receipt] ${state.currentTurnId}`);
                    // Filter out metadata to keep the table focused on latencies
                    const displayMetrics: Partial<TelemetryMetrics> = { ...finalEntry };
                    delete displayMetrics.turnId;
                    delete displayMetrics.timestamp;
                    delete displayMetrics.audioMode;
                    delete displayMetrics.modelName;
                    delete displayMetrics.toolExecutions;
                    console.table(displayMetrics);
                }
            }

            // Push to backend (Throttled via Fire-and-Forget, let server deduplicate if needed, 
            // but we only really care about completed turns for persistent logs)
            if (action.key === 'turnEndTimestamp') {
                try {
                    apiClient.post('/telemetry', { history: cleanHistory }).catch((e: Error) => console.error('[Telemetry] Failed to sync to backend', e));
                } catch (e) {
                    console.error('[Telemetry] Failed to sync to backend', e);
                }
            }

            return {
                ...state,
                metrics: updatedMetrics,
                history: cleanHistory,
                currentTurnId: state.currentTurnId
            };
        }
        default:
            return state;
    }
};

const initialState: TelemetryState = {
    metrics: {},
    history: [],
    currentTurnId: undefined,
};

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(telemetryReducer, initialState);

    const startTurn = useCallback((turnId: string) => {
        dispatch({ type: 'START_TURN', turnId });
    }, []);

    const cancelTurn = useCallback(() => {
        dispatch({ type: 'CANCEL_TURN' });
    }, []);

    const recordMetric = useCallback((key: TelemetryMetricKey, value: number | string, metadata?: Record<string, unknown>) => {
        dispatch({ type: 'RECORD_METRIC', key, value, metadata, audioMode: 'Gemini Audio' });
    }, []);

    const clearHistory = useCallback(() => {
        dispatch({ type: 'CLEAR_HISTORY' });
    }, []);

    const setModelName = useCallback((modelName: string) => {
        dispatch({ type: 'SET_MODEL_NAME', modelName });
    }, []);

    const value = useMemo(() => ({
        metrics: state.metrics,
        history: state.history,
        currentTurnId: state.currentTurnId,
        modelName: state.modelName,
        startTurn,
        cancelTurn,
        recordMetric,
        clearHistory,
        setModelName
    }), [
        state.metrics,
        state.history,
        state.currentTurnId,
        state.modelName,
        startTurn,
        cancelTurn,
        recordMetric,
        clearHistory,
        setModelName
    ]);

    return (
        <TelemetryContext.Provider value={value}>
            {children}
        </TelemetryContext.Provider>
    );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useTelemetry = (): TelemetryContextType => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error('useTelemetry must be used within a TelemetryProvider');
    }
    return context;
};
