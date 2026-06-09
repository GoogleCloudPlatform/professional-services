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

import { useState, useCallback } from 'react';
import {
  executeMCPTool,
  ActionSuccessDataSchema
} from '../api/tools';
import type { ToolCall, IGeminiLiveClient } from '../services/geminiLiveApi';
import { useModalContext } from '../context/ModalContext';
import { useTelemetryEmit } from './useTelemetryEmit';
import { TelemetryEvent } from '../types/telemetry';
import { useDemoConfig } from '../context/DemoConfigContext';
import { useOverlay } from '../context/OverlayContext';

export type ActiveVisual = {
  toolName: string;
  data: unknown;
} | null;

export function useMCPExecution(
  apiRef: React.MutableRefObject<IGeminiLiveClient | null>, 
  addLog: (level: 'info' | 'error' | 'warn', message: string, details?: unknown) => void,
  connectionState: 'connected' | 'disconnected' | 'error' | 'connecting'
) {
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const [activeVisual, setActiveVisual] = useState<ActiveVisual>(null);
  const { openModal } = useModalContext();
  const { showOverlay } = useOverlay();
  const { emitEvent } = useTelemetryEmit();
  const { selectedPersona, sessionId } = useDemoConfig();

  const clearActiveVisual = useCallback(() => {
    setActiveVisual(null);
  }, []);

  const handleToolCall = useCallback(async (toolCall: ToolCall) => {
    const startTime = Date.now();
    addLog('info', `[Phase: Tool] Gemini requested tool: ${toolCall.functionCall.name}`, toolCall.functionCall.args);
    setIsProcessingTool(true);

    try {
      // 1. Perform the actual background task
      const response = await executeMCPTool(
        toolCall.functionCall.name,
        toolCall.functionCall.args,
        selectedPersona,
        sessionId
      );      
      const latency = Date.now() - startTime;
      emitEvent(TelemetryEvent.TOOL_CALL_END, latency, { toolName: toolCall.functionCall.name });
      
      addLog('info', `[Phase: Tool] Tool executed successfully: ${toolCall.functionCall.name} (${latency.toFixed(2)}ms)`, response);

      // 2. Once data is ready, send the FINAL response to the SDK FIRST.
      // Doing this BEFORE unblocking the pipeline ensures the server gets the data
      // before it hears any new audio from the user (ambient noise, breath, etc).
      if (apiRef.current && connectionState === 'connected') {
        let finalResponse = response;
        if (finalResponse !== undefined && finalResponse !== null) {
          if (Array.isArray(finalResponse)) {
            finalResponse = { items: finalResponse };
          } else if (typeof finalResponse !== 'object') {
            finalResponse = { value: finalResponse };
          }
        }

        apiRef.current.sendToolResponse(
          toolCall.functionCall.name, 
          toolCall.functionCall.id, 
          finalResponse || {}
        );
      }

      // 3. Handle Visual Triggers and Orchestration
      if (response !== undefined) {
        const triggerVisuals = () => {
          console.log(`[useMCPExecution] Triggering visuals for ${toolCall.functionCall.name}`, response);
          
          // If the connection was lost while we were executing, do not trigger visuals
          if (connectionState !== 'connected') return;

          // Set the active visual state for generic inline components
          setActiveVisual({
            toolName: toolCall.functionCall.name,
            data: response
          });

          // Trigger specific modals based on the tool executed
          const data = response as Record<string, unknown>;
          if (toolCall.functionCall.name === 'get_account_balance') {
            openModal('account_balance', data);
          } else if (toolCall.functionCall.name === 'get_recent_transactions') {
            openModal('recent_transactions', data);
          } else if (toolCall.functionCall.name === 'show_appointment_slots') {
            openModal('show_appointment_slots', data);
          } else if (toolCall.functionCall.name === 'get_loan_drawdown_details' || toolCall.functionCall.name === 'initiate_drawdown') {
            showOverlay('loan_drawdown');
          } else if (toolCall.functionCall.name === 'analyze_working_capital' || toolCall.functionCall.name === 'get_liquidity_analysis') {
            showOverlay('working_capital');
          } else if (toolCall.functionCall.name === 'initiate_transfer' || toolCall.functionCall.name === 'send_email') {
            // DEEP DEFENSIVE VALIDATION
            const parsed = ActionSuccessDataSchema.safeParse(response);
            if (parsed.success) {
              openModal('action_success', parsed.data);
            } else {
              console.warn('[useMCPExecution] Invalid schema for action_success modal, falling back...', parsed.error);
              const fallbackData = response as Record<string, unknown>;
              const stringDetails: Record<string, string> = {};
              for (const [k, v] of Object.entries(fallbackData)) {
                  stringDetails[k] = String(v);
              }
              openModal('action_success', {
                title: String(fallbackData.title || 'Success'),
                message: String(fallbackData.message || 'Action completed successfully'),
                details: stringDetails
              });
            }
          } else if (toolCall.functionCall.name === 'send_document_to_app') {
            const dataObj = response as Record<string, unknown>;
            openModal('action_success', {
              title: 'Document Sent',
              message: dataObj.message as string || 'The document has been pushed successfully.',
              details: {
                delivery: dataObj.delivery as string || 'mobile_app_push',
                document_type: dataObj.document_type as string || 'document',
              }
            });
          }
        };

        // Tightly couple UI presentation with the start of the audio stream.
        // This ensures the visual element appears at the exact millisecond the AI
        // begins its spoken explanation of the data.
        await new Promise<void>((resolve) => {
          let triggered = false;
          const syncHandler = () => {
            if (!triggered) {
              triggered = true;
              // UNBLOCK PIPELINE:
              // Only release the microphone once the model has actually started its 
              // audio response. This prevents ambient noise from "interrupting" the 
              // model before it even begins to speak the tool results.
              setIsProcessingTool(false);
              triggerVisuals();
              window.removeEventListener('audio-playback-started', syncHandler);
              resolve();
            }
          };

          window.addEventListener('audio-playback-started', syncHandler);

          // Safety fallback: In case the AI decides to execute a tool but explicitly chooses 
          // to stay silent (or if network latency for TTS is extremely high), we bypass 
          // audio synchronization and force the UI to render after 3.5 seconds.
          setTimeout(() => {
            if (!triggered) {
              triggered = true;
              // UNBLOCK PIPELINE FALLBACK: 
              // Release the microphone if the model didn't start speaking in time.
              setIsProcessingTool(false);
              triggerVisuals();
              window.removeEventListener('audio-playback-started', syncHandler);
              resolve();
            }
          }, 3500);
        });
      } else {
        // If the tool returned no response/undefined, we unblock the microphone immediately
        setIsProcessingTool(false);
      }
    } catch (error: unknown) {
      setIsProcessingTool(false);
      addLog('error', `Failed to execute tool on backend: ${toolCall.functionCall.name}`, { error: error instanceof Error ? error.message : error });
      if (apiRef.current && connectionState === 'connected') {
          apiRef.current.sendToolResponse(
            toolCall.functionCall.name, 
            toolCall.functionCall.id, 
            { error: 'Backend tool execution failed', status: 'ERROR' }
          );
      }
    }
  }, [addLog, apiRef, connectionState, openModal, showOverlay, emitEvent, selectedPersona, sessionId]);

  return {
    isProcessingTool,
    activeVisual,
    handleToolCall,
    clearActiveVisual
  };
}
