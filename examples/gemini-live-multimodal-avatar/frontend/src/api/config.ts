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

export const ConfigResponseSchema = z.object({
  live_api_key: z.string().optional(),
  model_name: z.string(),
  system_prompt: z.string().optional(),
  client_name: z.string().optional(),
  available_appointments: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })).nullish().catch([]),
  use_vertex_ai: z.boolean(),
  vertex_project_id: z.string().optional(),
  vertex_location: z.string().optional(),
  avatar_mode: z.enum(['none', 'heygen', 'google_1p']).optional().default('none'),
  google_1p_avatar_name: z.string().optional(),
  google_1p_voice_name: z.string().optional(),
  vad_silence_duration_ms: z.number().optional().default(400),
})

export type ConfigResponse = z.infer<typeof ConfigResponseSchema>

export const fetchConfig = async (persona?: string, languages?: string[], mode?: string): Promise<ConfigResponse> => {
  const params = new URLSearchParams();
  if (persona) params.append('persona', persona);
  if (languages && languages.length > 0) {
    params.append('lang', languages.join(','));
  }
  if (mode) params.append('mode', mode);
  
  const queryString = params.toString();
  const url = queryString ? `/config?${queryString}` : '/config';
  
  const { data } = await apiClient.get(url)
  return ConfigResponseSchema.parse(data)
}

export const fetchHeygenToken = async (mode: 'LITE' | 'FULL' = 'FULL'): Promise<string> => {
  const { data } = await apiClient.post('/heygen-token', { mode })
  return data.token
}

export const AUDIO_CONFIG = {
  OUTPUT_SAMPLE_RATE: 24000,
  INPUT_SAMPLE_RATE: 16000,
  CHANNELS: 1
} as const;
