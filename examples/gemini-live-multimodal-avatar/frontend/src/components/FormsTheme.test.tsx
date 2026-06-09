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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select, MenuItem, ToggleButton, ThemeProvider } from '@mui/material';
import { cymbalTheme } from '../theme/cymbalTheme';

describe('Standard Forms with Global Theme', () => {
  it('should render MUI Select with global theme styling', () => {
    render(
      <ThemeProvider theme={cymbalTheme}>
        <Select value="1">
          <MenuItem value="1">Option 1</MenuItem>
        </Select>
      </ThemeProvider>
    );
    
    // We check that it renders correctly without inline sx overrides
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // We shouldn't need custom classes to apply typography adjustments if the theme works
    expect(select).toHaveClass('MuiSelect-select');
    expect(select.style.fontSize).toBe('');
  });

  it('should render MUI ToggleButton with global theme styling', () => {
    render(
      <ThemeProvider theme={cymbalTheme}>
        <ToggleButton value="on" aria-label="Toggle">On</ToggleButton>
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button', { name: /Toggle/i });
    expect(button).toBeInTheDocument();
    expect(button.style.fontSize).toBe('');
  });
});
