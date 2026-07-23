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

import { apiClient } from './client'
import { z } from 'zod'

export const ActionSuccessDataSchema = z.object({
  title: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.string()).optional(),
}).catchall(z.unknown());

// MCP Definitions
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export const fetchMCPTools = async (personaId: string): Promise<MCPTool[]> => {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  };
  const { data } = await apiClient.post(`/mcp?persona=${encodeURIComponent(personaId)}`, request);
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }
  return data.result.tools;
}

export const executeMCPTool = async (name: string, args: Record<string, unknown>, personaId?: string, sessionId?: string): Promise<unknown> => {
  // Inject session_id into the arguments for backend isolation
  const enrichedArgs = {
    ...args,
    ...(sessionId ? { session_id: sessionId } : {})
  };

  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: name,
      arguments: enrichedArgs,
    }
  };
  
  const url = personaId ? `/mcp?persona=${encodeURIComponent(personaId)}` : '/mcp';
  const { data } = await apiClient.post(url, request);
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }
  
  if (data.result.isError) {
      throw new Error(data.result.content[0]?.text || "Unknown tool error");
  }

  const content = data.result.content[0]?.text;
  if (content) {
    try {
        return JSON.parse(content);
    } catch {
        return content;
    }
  }
  return null;
}
