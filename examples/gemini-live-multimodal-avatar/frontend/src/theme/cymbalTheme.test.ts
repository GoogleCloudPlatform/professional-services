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
import { cymbalTheme } from './cymbalTheme';

describe('cymbalTheme', () => {
  it('should define the primary color as #064e3b', () => {
    expect(cymbalTheme.palette.primary.main).toBe('#064e3b');
  });

  it('should use Inter as the primary font family', () => {
    expect(cymbalTheme.typography.fontFamily).toMatch(/Inter/);
  });
  
  it('should define button variants', () => {
    // Basic check to ensure components overrides are present
    expect(cymbalTheme.components?.MuiButton).toBeDefined();
  });
});
