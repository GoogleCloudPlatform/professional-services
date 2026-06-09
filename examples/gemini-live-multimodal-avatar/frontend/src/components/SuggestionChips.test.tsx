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
import { SuggestionChips } from './SuggestionChips';

describe('SuggestionChips', () => {
  const suggestions = ['Option 1', 'Option 2'];
  const onSuggestionClick = vi.fn();

  it('renders visible chips and handles clicks', () => {
    render(<SuggestionChips visible={true} suggestions={suggestions} onSuggestionClick={onSuggestionClick} />);
    const chip1 = screen.getByText('Option 1');
    expect(chip1).toBeInTheDocument();
    
    fireEvent.click(chip1);
    expect(onSuggestionClick).toHaveBeenCalledWith('Option 1');
  });

  it('applies hidden styles when visible is false', () => {
    const { container } = render(<SuggestionChips visible={false} suggestions={suggestions} onSuggestionClick={onSuggestionClick} />);
    const box = container.firstChild as HTMLElement;
    expect(box).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });
});
