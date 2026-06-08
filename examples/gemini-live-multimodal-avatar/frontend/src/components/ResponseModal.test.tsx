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
import ResponseModal from './ResponseModal';

describe('ResponseModal', () => {
  it('renders a title, content area, and a close button when open', () => {
    const handleClose = vi.fn();
    
    render(
      <ResponseModal open={true} onClose={handleClose} title="Test Modal">
        <div data-testid="modal-content">Modal Content Area</div>
      </ResponseModal>
    );

    // Should render title
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    
    // Should render content
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    
    // Should render close button
    const closeButton = screen.getByRole('button', { name: /close/i, hidden: true });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    
    render(
      <ResponseModal open={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </ResponseModal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i, hidden: true });
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    const handleClose = vi.fn();
    
    render(
      <ResponseModal open={false} onClose={handleClose} title="Test Modal">
        <div data-testid="hidden-content">Hidden Content</div>
      </ResponseModal>
    );

    expect(screen.queryByTestId('hidden-content')).not.toBeInTheDocument();
  });
});
