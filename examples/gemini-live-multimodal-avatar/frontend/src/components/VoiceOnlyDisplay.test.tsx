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

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceOnlyDisplay } from './VoiceOnlyDisplay';

// Mock child components
vi.mock('./AudioVisualizer', () => ({
  AudioVisualizer: ({ isActive, isThinking, isAwaitingInput }: { isActive: boolean, isThinking?: boolean, isAwaitingInput?: boolean }) => (
    <div data-testid="audio-visualizer" data-active={isActive} data-thinking={isThinking} data-awaiting={isAwaitingInput}>Visualizer</div>
  )
}));

vi.mock('./LiveTranscript', () => ({
  LiveTranscript: ({ type }: { type: string }) => (
    <div data-testid={`live-transcript-${type}`}>{type}</div>
  )
}));

describe('VoiceOnlyDisplay', () => {
  it('renders correctly when inactive', () => {
    render(<VoiceOnlyDisplay isActive={false} />);
    
    expect(screen.getByTestId('audio-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('audio-visualizer')).toHaveAttribute('data-active', 'false');

    expect(screen.getByTestId('live-transcript-input')).toBeInTheDocument();    expect(screen.getByTestId('live-transcript-output')).toBeInTheDocument();
  });

  it('renders correctly when active', () => {
    render(<VoiceOnlyDisplay isActive={true} />);
    
    expect(screen.getByTestId('audio-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('audio-visualizer')).toHaveAttribute('data-active', 'true');
    
    expect(screen.getByTestId('live-transcript-input')).toBeInTheDocument();
    expect(screen.getByTestId('live-transcript-output')).toBeInTheDocument();
  });

  it('renders correctly when awaiting input', () => {
    render(<VoiceOnlyDisplay isActive={false} isAwaitingInput={true} />);
    
    expect(screen.getByTestId('audio-visualizer')).toBeInTheDocument();
    expect(screen.getByTestId('audio-visualizer')).toHaveAttribute('data-awaiting', 'true');
  });
});
