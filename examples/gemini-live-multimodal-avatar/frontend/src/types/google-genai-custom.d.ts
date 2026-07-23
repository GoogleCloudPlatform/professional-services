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

import '@google/genai';

declare module '@google/genai' {
  // We retain ONLY the GoogleGenAIPatch interface. 
  // Modality, LiveConnectConfig, and Part extensions are now natively 
  // supported in @google/genai v2.2.0.

  /**
   * Interface for patching the SDK's internal client to support Vertex AI 
   * via our backend WebSocket proxy without triggering browser-side 
   * project/location security blocks.
   */
  export interface GoogleGenAIPatch {
    apiClient: {
      isVertexAI?: () => boolean;
      getProject?: () => string;
      getLocation?: () => string;
    };
  }
}
