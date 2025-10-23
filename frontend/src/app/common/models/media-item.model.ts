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

import {PaginatedResponse} from './paginated-response.model';
import {SourceMediaItemLink} from './search.model';

export interface EnrichedSourceAsset {
  sourceAssetId: string;
  presignedUrl: string;
  presignedThumbnailUrl: string;
  gcsUri: string;
}

export interface EnrichedSourceMediaItem extends SourceMediaItemLink {
  presignedUrl: string;
  presignedThumbnailUrl: string;
  gcsUri: string;
}

/**
 * Defines the states for a long-running generation job.
 */
export enum JobStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Represents a single media item, mirroring the Pydantic model from the backend.
 */
export interface MediaItem {
  id: string;
  userEmail?: string;
  createdAt?: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string

  // Common fields across media types
  prompt?: string;
  originalPrompt?: string;
  rewrittenPrompt?: string;
  numMedia?: number;
  model?: string;
  mimeType?: string;
  generationTime?: number;
  error_message?: string;
  enrichedSourceAssets?: EnrichedSourceAsset[];
  enrichedSourceMediaItems?: EnrichedSourceMediaItem[];

  // URI and URL fields
  gcsUris: string[];
  sourceImagesGcs?: string[];
  presignedUrls?: string[];
  presignedThumbnailUrls?: string[];

  // Video specific
  aspect?: string; // Note: 'aspect' is used for video, 'aspectRatio' for image
  duration?: number;
  referenceImage?: string;
  lastReferenceImage?: string;
  enhancedPromptUsed?: boolean;
  comment?: string;
  status?: JobStatus; // Tracks the state of the generation job

  // Image specific
  modifiers?: string[];
  aspectRatio?: string;
  style?: string;
  lighting?: string;
  colorAndTone?: string;
  composition?: string;
  negativePrompt?: string;
  seed?: number;
  critique?: string;
  addWatermark?: boolean;

  // Music specific
  audioAnalysis?: Record<string, any>;

  // Debugging field
  rawData?: Record<string, any>;
  errorMessage?: string;
}

/**
 * Defines the response structure for a paginated gallery query,
 * mirroring the Pydantic model from the backend.
 */
export type PaginatedGalleryResponse = PaginatedResponse<MediaItem>;
