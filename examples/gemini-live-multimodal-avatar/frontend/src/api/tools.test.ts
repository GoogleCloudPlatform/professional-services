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
import { executeMCPTool, fetchMCPTools } from './tools';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('tools API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMCPTools', () => {
    it('fetches tools with the correct persona parameter', async () => {
      const mockResponse = { data: { result: { tools: [{ name: 'test_tool' }] } } };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const personaId = 'cashflow-advisor';
      await fetchMCPTools(personaId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/mcp?persona=${encodeURIComponent(personaId)}`,
        expect.objectContaining({
          method: 'tools/list',
        })
      );
    });
  });

  describe('executeMCPTool', () => {
    it('injects sessionId into arguments when provided', async () => {
      const mockResponse = { data: { result: { content: [{ text: '{"success":true}' }] } } };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const args = { account_id: '123' };
      const personaId = 'test-persona';
      const sessionId = 'test-session-id';

      await executeMCPTool('get_account_balance', args, personaId, sessionId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/mcp?persona=${encodeURIComponent(personaId)}`,
        expect.objectContaining({
          params: expect.objectContaining({
            arguments: {
              account_id: '123',
              session_id: 'test-session-id', // Verify injection
            },
          }),
        })
      );
    });

    it('does not inject sessionId if not provided', async () => {
      const mockResponse = { data: { result: { content: [{ text: '{"success":true}' }] } } };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const args = { account_id: '123' };
      const personaId = 'test-persona';

      await executeMCPTool('get_account_balance', args, personaId);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/mcp?persona=${encodeURIComponent(personaId)}`,
        expect.objectContaining({
          params: expect.objectContaining({
            arguments: {
              account_id: '123',
              // Verify no session_id
            },
          }),
        })
      );
    });
  });
});
