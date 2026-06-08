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

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BottomActionBar } from './BottomActionBar';

// Mock AudioVisualizer
vi.mock('./AudioVisualizer', () => ({
  AudioVisualizer: ({ isActive, variant }: { isActive: boolean, variant: string }) => (
    <div data-testid="audio-visualizer" data-active={isActive} data-variant={variant}>Visualizer</div>
  )
}));

describe('BottomActionBar', () => {
  const defaultProps = {
    isActive: false,
    isAvatarDisabled: false,
    heygenStatus: 'idle',
    connectionState: 'disconnected',
    isMuted: false,
    handleEndSession: vi.fn(),
    handleMicClick: vi.fn(),
  };

  it('renders microphone button', () => {
    render(<BottomActionBar {...defaultProps} />);
    const micButton = screen.getByRole('button');
    expect(micButton).toBeInTheDocument();
  });

  it('triggers handleMicClick when mic button is clicked', () => {
    const handleMicClick = vi.fn();
    render(<BottomActionBar {...defaultProps} handleMicClick={handleMicClick} />);
    
    const micButton = screen.getByRole('button');
    fireEvent.click(micButton);
    expect(handleMicClick).toHaveBeenCalledTimes(1);
  });

  it('shows end session button when connected', () => {
    render(<BottomActionBar {...defaultProps} connectionState="connected" />);
    // There should be two buttons now: End Session (XCircle) and Mic
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('triggers handleEndSession when end session button is clicked', () => {
    const handleEndSession = vi.fn();
    render(<BottomActionBar {...defaultProps} connectionState="connected" handleEndSession={handleEndSession} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(handleEndSession).toHaveBeenCalledTimes(1);
  });

  it('shows AudioVisualizer (bars variant) when active, not disabled, and not error', () => {
    render(<BottomActionBar {...defaultProps} isActive={true} />);
    
    const visualizer = screen.getByTestId('audio-visualizer');
    expect(visualizer).toBeInTheDocument();
    expect(visualizer).toHaveAttribute('data-active', 'true');
    expect(visualizer).toHaveAttribute('data-variant', 'bars');
  });

  it('hides AudioVisualizer when heygenStatus is error', () => {
    render(<BottomActionBar {...defaultProps} isActive={true} heygenStatus="error" />);
    const visualizerContainer = screen.getByTestId('audio-visualizer').parentElement;
    expect(visualizerContainer).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });

  it('shows AudioVisualizer (bars variant) when isAwaitingInput is true', () => {
    render(<BottomActionBar {...defaultProps} isAwaitingInput={true} />);
    
    const visualizer = screen.getByTestId('audio-visualizer');
    expect(visualizer).toBeInTheDocument();
  });
});
