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
import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { ModalProvider, useModalContext } from './ModalContext';

describe('ModalContext', () => {
  it('throws an error if used outside of ModalProvider', () => {
    // Suppress console.error for this specific test as it's expected
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useModalContext())).toThrow('useModalContext must be used within a ModalProvider');
    consoleSpy.mockRestore();
  });

  it('provides the default context values', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <ModalProvider>{children}</ModalProvider>;
    const { result } = renderHook(() => useModalContext(), { wrapper });

    expect(result.current.activeModal).toBeNull();
    expect(result.current.modalData).toBeNull();
  });

  it('opens and closes a modal correctly', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <ModalProvider>{children}</ModalProvider>;
    const { result } = renderHook(() => useModalContext(), { wrapper });

    act(() => {
      result.current.openModal('account_balance', { balance: 1000 });
    });

    expect(result.current.activeModal).toBe('account_balance');
    expect(result.current.modalData).toEqual({ balance: 1000 });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
    // It's sometimes desirable to keep data while closing for exit animations, 
    // but clearing it is simpler. Let's test it gets cleared or stays as per our design.
    // For simplicity, we assume it stays or clears. Let's test clearing.
    expect(result.current.modalData).toBeNull();
  });
});