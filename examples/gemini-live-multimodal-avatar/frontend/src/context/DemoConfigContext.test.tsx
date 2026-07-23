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

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DemoConfigProvider, useDemoConfig } from './DemoConfigContext';
import React from 'react';

describe('DemoConfigContext', () => {
  it('provides default values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DemoConfigProvider>{children}</DemoConfigProvider>
    );
    const { result } = renderHook(() => useDemoConfig(), { wrapper });

    expect(result.current.selectedPersona).toBe('cre-advisor');
    expect(result.current.interactionMode).toBe('google_1p');
  });

  it('allows updating selectedPersona', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DemoConfigProvider>{children}</DemoConfigProvider>
    );
    const { result } = renderHook(() => useDemoConfig(), { wrapper });

    act(() => {
      result.current.setSelectedPersona('treasury-advisor');
    });

    expect(result.current.selectedPersona).toBe('treasury-advisor');
  });

  it('allows updating interactionMode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DemoConfigProvider>{children}</DemoConfigProvider>
    );
    const { result } = renderHook(() => useDemoConfig(), { wrapper });

    act(() => {
      result.current.setInteractionMode('heygen');
    });

    expect(result.current.interactionMode).toBe('heygen');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => renderHook(() => useDemoConfig())).toThrow('useDemoConfig must be used within a DemoConfigProvider');
    
    consoleSpy.mockRestore();
  });
});

  it('allows resetting sessionId', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DemoConfigProvider>{children}</DemoConfigProvider>
    );
    const { result } = renderHook(() => useDemoConfig(), { wrapper });

    const initialSessionId = result.current.sessionId;
    expect(initialSessionId).toBeDefined();
    expect(typeof initialSessionId).toBe('string');

    act(() => {
      result.current.resetSessionId();
    });

    expect(result.current.sessionId).not.toBe(initialSessionId);
  });
