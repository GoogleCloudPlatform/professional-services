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

export type ImagenRequest = {
  prompt: string;
  generationModel: string;
  aspectRatio: string;
  numberOfMedia: number;
  style?: string | null;
  negativePrompt: string | null;
  colorAndTone?: string | null;
  lighting?: string | null;
  composition?: string | null;
  addWatermark: boolean;
  upscaleFactor?: '' | 'x2' | 'x4';
  sourceAssetIds?: number[];
  sourceMediaItems?: SourceMediaItemLink[];
  workspaceId?: string;
  useBrandGuidelines: boolean;
  googleSearch?: boolean;
  resolution?: '1K' | '2K' | '4K';
};

export type SourceMediaItemLink = {
  mediaItemId: number;
  mediaIndex: number;
  role: string;
};

export interface ReferenceImage {
  previewUrl: string;
  sourceAssetId?: number;
  sourceMediaItem?: SourceMediaItemLink;
  isNew?: boolean;
}

export interface ReferenceImageDto {
  assetId: number;
  referenceType: 'ASSET' | 'STYLE';
}

export type VeoRequest = {
  prompt: string;
  generationModel: string;
  aspectRatio: string;
  numberOfMedia?: number;
  style?: string | null;
  lighting?: string | null;
  colorAndTone?: string | null;
  composition?: string | null;
  negativePrompt: string;
  generateAudio: boolean;
  durationSeconds: number;
  startImageAssetId?: number;
  endImageAssetId?: number;
  sourceVideoAssetId?: number;
  sourceMediaItems?: SourceMediaItemLink[];
  workspaceId?: string;
  useBrandGuidelines: boolean;
  referenceImages?: ReferenceImageDto[];
};

export type SearchResponse = {
  summary: any;
  results: SearchResult[];
  totalSize: number;
};

export type SearchResult = {
  document: Document;
};

export type Document = {
  derivedStructData: DocumentData;
};

export type DocumentData = {
  title: string;
  link: string;
  snippets: Snippet[];
  pagemap: PageMap;
};

export type Snippet = {
  snippet: string;
};

export type PageMap = {
  cse_image: ImagesData[];
};

export type ImagesData = {
  src: string;
};

export interface GallerySearchDto {
  limit: number;
  offset?: number;
  startAfter?: string;
  userEmail?: string;
  mimeType?: string;
  model?: string;
  status?: string;
  workspaceId?: string;
}
