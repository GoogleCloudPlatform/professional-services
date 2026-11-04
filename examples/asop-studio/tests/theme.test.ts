// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, it, expect, beforeEach } from 'vitest';

describe('Theme Mode Persistence and Toggle', () => {
  const THEME_STORAGE_KEY = 'asop_theme';

  class MockLocalStorage {
    private store: Record<string, string> = {};

    getItem(key: string): string | null {
      return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
      this.store[key] = value;
    }

    removeItem(key: string): void {
      delete this.store[key];
    }

    clear(): void {
      this.store = {};
    }
  }

  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
  });

  it('should default to dark theme when no preference is saved', () => {
    const savedTheme = mockStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    expect(initialTheme).toBe('dark');
  });

  it('should retrieve light theme when light mode is saved in localStorage', () => {
    mockStorage.setItem(THEME_STORAGE_KEY, 'light');
    const savedTheme = mockStorage.getItem(THEME_STORAGE_KEY);
    const theme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
    expect(theme).toBe('light');
  });

  it('should toggle theme from dark to light and update storage', () => {
    let currentTheme: 'dark' | 'light' = 'dark';
    mockStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    // Toggle theme
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    mockStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    expect(mockStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    // Toggle back to dark
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    mockStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    expect(mockStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
