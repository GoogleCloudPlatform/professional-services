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

import { useState, useCallback, useRef, useEffect } from 'react';

export type Message = {
  text: string;
  sender: 'user' | 'model';
  id: string;
};

export interface UseTranscriptionOptions {
  onModelTextChunk?: (text: string) => void;
  onTranscriptionComplete?: (text: string, sender: 'user' | 'model') => void;
  isAudioActive?: boolean;
}

export function useTranscription({ onModelTextChunk, onTranscriptionComplete, isAudioActive = false }: UseTranscriptionOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const textBufferRef = useRef<string>('');
  const inputBufferRef = useRef<string[]>([]);
  const outputBufferRef = useRef<string[]>([]);
  const activeInputRef = useRef<string>('');
  const activeOutputRef = useRef<string>('');
  
  const onModelTextChunkRef = useRef(onModelTextChunk);
  const onTranscriptionCompleteRef = useRef(onTranscriptionComplete);
  const isAudioActiveRef = useRef(isAudioActive);

  useEffect(() => { onModelTextChunkRef.current = onModelTextChunk; }, [onModelTextChunk]);
  useEffect(() => { onTranscriptionCompleteRef.current = onTranscriptionComplete; }, [onTranscriptionComplete]);
  useEffect(() => { isAudioActiveRef.current = isAudioActive; }, [isAudioActive]);

  const dispatchTranscriptEvent = useCallback((type: 'input' | 'output', text: string) => {
    window.dispatchEvent(new CustomEvent(`transcript-update-${type}`, { detail: text }));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    textBufferRef.current = '';
    inputBufferRef.current = [];
    outputBufferRef.current = [];
    activeInputRef.current = '';
    activeOutputRef.current = '';
    dispatchTranscriptEvent('input', '');
    dispatchTranscriptEvent('output', '');
  }, [dispatchTranscriptEvent]);

  const postProcessText = useCallback((text: string) => {
    // Strip strictly formatted tool-call-like strings (e.g. get_account_balance{"session_id"...}) 
    // Requires at least one underscore in the prefix to avoid matching normal English words before braces.
    const cleaned = text.replace(/\b[a-z]+_[a-z_]+\s*\{[^}]*\}/gi, '');
    return cleaned.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
  }, []);

  const flushBufferToMessages = useCallback((sender: 'user' | 'model', isInterrupted: boolean = false) => {
    const buffer = sender === 'user' ? inputBufferRef.current : outputBufferRef.current;
    if (buffer.length === 0) return;

    const fullText = postProcessText(buffer.join(''));
    
    if (fullText) {
        setMessages((prev) => [
            ...prev,
            {
                text: fullText + (isInterrupted ? '...' : ''),
                sender,
                id: Math.random().toString(36).substring(7)
            }
        ]);

        console.log(`[useTranscription] Final ${sender} transcript: "${fullText.substring(0, 50)}${fullText.length > 50 ? '...' : ''}"`);
        if (onTranscriptionCompleteRef.current) {
            onTranscriptionCompleteRef.current(fullText, sender);
        }
    }

    if (sender === 'user') {
      inputBufferRef.current = [];
      activeInputRef.current = '';
      dispatchTranscriptEvent('input', '');
    } else {
      outputBufferRef.current = [];
      // Do NOT clear activeOutputRef and dispatch empty here.
      // We want the cinematic text to remain on screen while the audio plays
      // and until the user starts speaking again or the session is interrupted.
    }
  }, [postProcessText, dispatchTranscriptEvent]);

  const flushTextBuffer = useCallback(() => {
    if (!onModelTextChunkRef.current) return;

    const lastPunctuation = Math.max(
      textBufferRef.current.lastIndexOf('.'),
      textBufferRef.current.lastIndexOf('?'),
      textBufferRef.current.lastIndexOf('!')
    );
    
    if (lastPunctuation !== -1) {
      const sentence = textBufferRef.current.substring(0, lastPunctuation + 1).trim();
      if (sentence) {
        const cleaned = postProcessText(sentence);
        if (cleaned) {
            onModelTextChunkRef.current(cleaned);
        }
      }
      textBufferRef.current = textBufferRef.current.substring(lastPunctuation + 1).trimStart();
    }
  }, [postProcessText]);

  const handleTranscription = useCallback((transcription: { text: string; type: 'input' | 'output'; finished?: boolean }) => {
    if (!transcription.text) return;
    
    if (transcription.type === 'output') {
      if (onModelTextChunkRef.current) {
        textBufferRef.current += transcription.text;
        if (isAudioActiveRef.current) {
          flushTextBuffer();
        }
      }
      if (isAudioActiveRef.current) {
        outputBufferRef.current.push(transcription.text);
        activeOutputRef.current = postProcessText(outputBufferRef.current.join(''));
        dispatchTranscriptEvent('output', activeOutputRef.current);
        if (transcription.finished) {
          flushBufferToMessages('model');
        }
      }
    } else {
      if (isAudioActiveRef.current) {
        inputBufferRef.current.push(transcription.text);
        activeInputRef.current = postProcessText(inputBufferRef.current.join(''));
        dispatchTranscriptEvent('input', activeInputRef.current);
        if (transcription.finished) {
          flushBufferToMessages('user');
        }
      }
    }
  }, [flushTextBuffer, flushBufferToMessages, dispatchTranscriptEvent, postProcessText]);

  return {
    messages,
    textBufferRef,
    outputBufferRef,
    clearMessages,
    handleTranscription,
    flushBufferToMessages,
    flushTextBuffer,
    dispatchTranscriptEvent
  };
}