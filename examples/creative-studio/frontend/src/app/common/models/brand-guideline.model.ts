/**
 * Copyright 2025 Google LLC
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

import {JobStatus} from './media-item.model';

export interface BrandGuidelineModel {
  id: number;
  name: string;
  workspaceId: number;
  sourcePdfGcsUris: string[];
  colorPalette: string[];
  logoAssetId?: string;
  toneOfVoiceSummary?: string;
  visualStyleSummary?: string;
  presignedSourcePdfUrls?: string[];
  status: JobStatus;
  errorMessage?: string;
}

/**
 * DTO for the response from the generate-upload-url endpoint.
 */
export interface GenerateUploadUrlResponse {
  uploadUrl: string;
  gcsUri: string;
}
