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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LiveTranscript } from './LiveTranscript';

describe('LiveTranscript Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock requestAnimationFrame to execute synchronously for the test
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when type is input', () => {
    const { container } = render(<LiveTranscript type="input" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('updates text and opacity when a transcript event is received', () => {
    render(<LiveTranscript type="output" />);
    
    // Initially should be empty and have opacity 0
    const textElement = screen.getByRole('status').querySelector('span');
    expect(textElement?.innerText).toBeUndefined();
    expect(screen.getByRole('status')).toHaveStyle({ opacity: '0' });

    // Dispatch event with text
    act(() => {
      window.dispatchEvent(new CustomEvent('transcript-update-output', { detail: 'Hello world' }));
    });

    expect(textElement?.innerText).toBe('Hello world');
    expect(screen.getByRole('status')).toHaveStyle({ opacity: '1' });
    expect(screen.getByRole('status')).toHaveStyle({ transform: 'translateX(-50%) translateY(0)' });
  });

  it('hides the transcript when an empty event is received', () => {
    render(<LiveTranscript type="output" />);
    
    // Dispatch event with text first
    act(() => {
      window.dispatchEvent(new CustomEvent('transcript-update-output', { detail: 'Hello world' }));
    });

    // Dispatch empty event
    act(() => {
      window.dispatchEvent(new CustomEvent('transcript-update-output', { detail: '' }));
    });

    expect(screen.getByRole('status')).toHaveStyle({ opacity: '0' });
    expect(screen.getByRole('status')).toHaveStyle({ transform: 'translateX(-50%) translateY(10px)' });
  });

  it('safely handles events when unmounted', () => {
    const { unmount } = render(<LiveTranscript type="output" />);
    unmount();
    
    // Dispatching an event after unmount shouldn't throw any errors
    act(() => {
      window.dispatchEvent(new CustomEvent('transcript-update-output', { detail: 'Hello world' }));
    });
  });
});