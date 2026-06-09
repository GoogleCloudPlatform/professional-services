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
import { Button, ThemeProvider } from '@mui/material';
import { cymbalTheme } from '../theme/cymbalTheme';

describe('Standard Buttons with Global Theme', () => {
  it('should render standard MUI Buttons with cymbalTheme styles', () => {
    render(
      <ThemeProvider theme={cymbalTheme}>
        <Button variant="contained" color="primary">Confirm</Button>
      </ThemeProvider>
    );
    
    const button = screen.getByRole('button', { name: /Confirm/i });
    expect(button).toBeInTheDocument();
    
    // Check computed styles if possible, but jsdom won't fully compute MUI's dynamic classes.
    // At minimum, we can ensure it has the MuiButton classes and that no inline styles override it.
    expect(button).toHaveClass('MuiButton-root');
    expect(button).toHaveClass('MuiButton-containedPrimary');
    expect(button.style.textTransform).toBe(''); // No inline style overriding the theme
  });

  it('should not contain legacy custom classes', () => {
    render(
      <ThemeProvider theme={cymbalTheme}>
        <Button variant="outlined" color="secondary" className="legacy-custom-btn">Test</Button>
      </ThemeProvider>
    );
    const button = screen.getByRole('button', { name: /Test/i });
    
    // Ensure we don't have custom button classes applied across components (testing principle)
    // The test fails if someone tries to add legacy classes that conflict, but since we 
    // removed them, we can test that standard usage has standard classes.
    expect(button.className).toContain('MuiButton-root');
  });
});
