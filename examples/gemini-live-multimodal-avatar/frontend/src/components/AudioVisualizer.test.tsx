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

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AudioVisualizer } from './AudioVisualizer';

describe('AudioVisualizer', () => {
  it('renders the default orb variant correctly', () => {
    const { container } = render(<AudioVisualizer isActive={false} />);
    // The orb variant has a large Box (300x300) and multiple inner boxes for the layers
    expect(container.firstChild).toBeInTheDocument();
    // Inactive state should not have the active animations, but we just verify it renders
  });

  it('renders the orb variant in active state', () => {
    const { container } = render(<AudioVisualizer isActive={true} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the bars variant correctly', () => {
    const { container } = render(<AudioVisualizer isActive={false} variant="bars" />);
    expect(container.firstChild).toBeInTheDocument();
    // The bars variant creates 5 inner boxes
    expect(container.firstChild?.childNodes.length).toBe(5);
  });

  it('renders the bars variant in active state', () => {
    const { container } = render(<AudioVisualizer isActive={true} variant="bars" />);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild?.childNodes.length).toBe(5);
  });
});
