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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AUDIO_CONFIG, fetchConfig } from './config';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('fetchConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls /config without parameters when none provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { model_name: 'test', use_vertex_ai: false } });
    await fetchConfig();
    expect(apiClient.get).toHaveBeenCalledWith('/config');
  });

  it('includes persona in query string', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { model_name: 'test', use_vertex_ai: false } });
    await fetchConfig('advisor-1');
    expect(apiClient.get).toHaveBeenCalledWith('/config?persona=advisor-1');
  });

  it('includes both persona and lang in query string', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { model_name: 'test', use_vertex_ai: false } });
    await fetchConfig('advisor-1', ['Spanish']);
    expect(apiClient.get).toHaveBeenCalledWith('/config?persona=advisor-1&lang=Spanish');
  });

  it('handles multiple languages in query string', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { model_name: 'test', use_vertex_ai: false } });
    await fetchConfig('advisor-1', ['English', 'Spanish']);
    expect(apiClient.get).toHaveBeenCalledWith('/config?persona=advisor-1&lang=English%2CSpanish');
  });
});

describe('AUDIO_CONFIG', () => {
  it('should use 16kHz for input sample rate to minimize network overhead', () => {
    expect(AUDIO_CONFIG.INPUT_SAMPLE_RATE).toBe(16000);
  });

  it('should use 24kHz for output sample rate as per Google best practices', () => {
    expect(AUDIO_CONFIG.OUTPUT_SAMPLE_RATE).toBe(24000);
  });

  it('should use mono channel config', () => {
    expect(AUDIO_CONFIG.CHANNELS).toBe(1);
  });
});