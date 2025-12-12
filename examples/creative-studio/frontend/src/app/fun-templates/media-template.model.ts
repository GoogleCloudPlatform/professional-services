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

export enum MimeTypeEnum {
  IMAGE = 'image/png',
  VIDEO = 'video/mp4',
  AUDIO = 'audio/mpeg',
}

export enum IndustryEnum {
  AUTOMOTIVE = 'Automotive',
  CONSUMER_GOODS = 'Consumer Goods',
  ART_AND_DESIGN = 'Art & Design',
  ENTERTAINMENT = 'Entertainment',
  HOME_APPLIANCES = 'Home Appliances',
  FASHION_AND_APPAREL = 'Fashion & Apparel',
  FOOD_AND_BEVERAGE = 'Food & Beverage',
  HEALTH_AND_WELLNESS = 'Health & Wellness',
  LUXURY_GOODS = 'Luxury Goods',
  TECHNOLOGY = 'Technology',
  TRAVEL_AND_HOSPITALITY = 'Travel & Hospitality',
  PET_SUPPLIES = 'Pet Supplies',
  OTHER = 'Other',
}

export enum AspectRatioEnum {
  '1:1' = '1:1',
  '16:9' = '16:9',
  '9:16' = '9:16',
  '3:4' = '3:4',
  '4:3' = '4:3',
}

export enum StyleEnum {
  PHOTOREALISTIC = 'Photorealistic',
  CINEMATIC = 'Cinematic',
  MODERN = 'Modern',
  REALISTIC = 'Realistic',
  VINTAGE = 'Vintage',
  MONOCHROME = 'Monochrome',
  FANTASY = 'Fantasy',
  SKETCH = 'Sketch',
}

export enum LightingEnum {
  CINEMATIC = 'Cinematic',
  STUDIO = 'Studio',
  NATURAL = 'Natural',
  DRAMATIC = 'Dramatic',
  AMBIENT = 'Ambient',
  BACKLIGHTING = 'Backlighting',
  DRAMATIC_LIGHT = 'Dramatic Light',
  GOLDEN_HOUR = 'Golden Hour',
  EXPOSURE = 'Exposure',
  LOW_LIGHTING = 'Low Lighting',
  MULTIEXPOSURE = 'Multiexposure',
  STUDIO_LIGHT = 'Studio Light',
}

export enum ColorAndToneEnum {
  VIBRANT = 'Vibrant',
  MUTED = 'Muted',
  WARM = 'Warm',
  COOL = 'Cool',
  MONOCHROME = 'Monochrome',
  BLACK_AND_WHITE = 'Black & White',
  GOLDEN = 'Golden',
  PASTEL = 'Pastel',
  TONED = 'Toned',
}

export enum CompositionEnum {
  CLOSEUP = 'Closeup',
  KNOLLING = 'Knolling',
  LANDSCAPE_PHOTOGRAPHY = 'Landscape photography',
  PHOTOGRAPHED_THROUGH_WINDOW = 'Photographed through window',
  SHALLOW_DEPTH_OF_FIELD = 'Shallow depth of field',
  SHOT_FROM_ABOVE = 'Shot from above',
  SHOT_FROM_BELOW = 'Shot from below',
  SURFACE_DETAIL = 'Surface detail',
  WIDE_ANGLE = 'Wide angle',
}

export enum GenerationModelEnum {
  // Image-Specific Models
  IMAGEN_4 = 'imagen-4.0-generate-001',
  IMAGEN_4_ULTRA = 'imagen-4.0-ultra-generate-001',
  IMAGEN_4_FAST = 'imagen-4.0-fast-generate-001',

  // Video-Specific Models
  VEO_3_1_PREVIEW = 'veo-3.1-generate-preview',
  VEO_3_FAST = 'veo-3.0-fast-generate-001',
  VEO_3_QUALITY = 'veo-3.0-generate-001',
  VEO_2_FAST = 'veo-2.0-fast-generate-001',
  VEO_2_QUALITY = 'veo-2.0-generate-001',
}

// The parameters that can be passed to the generator
export interface GenerationParameters {
  prompt?: string;
  originalPrompt?: string;
  model?: string;
  aspectRatio?: AspectRatioEnum;
  style?: StyleEnum;
  lighting?: LightingEnum;
  colorAndTone?: string;
  composition?: string;
  negativePrompt?: string;
  numMedia?: number;
  durationSeconds?: number;
}

/** This mirrors the backend's `SourceAssetLinkResponse` */
export interface EnrichedSourceAsset {
  assetId: number;
  role: string; // e.g., 'input', 'style_reference'
  presignedUrl: string;
  gcsUri: string;
}

export interface MediaTemplate {
  id: number; // Unique identifier for the template
  name: string;
  description: string;
  mimeType: MimeTypeEnum;
  industry: IndustryEnum;
  brand?: string;
  tags: string[];
  gcsUris?: string[];
  thumbnailUris?: string[];
  presignedUrls: string[];
  presignedThumbnailUrls?: string[];
  enrichedSourceAssets?: EnrichedSourceAsset[];
  generationParameters: GenerationParameters; // All generator settings bundled
}

export interface TemplateFilter {
  industry: string | null;
  mediaType: MimeTypeEnum | null;
  tags: string | null;
  model: string | null;
  name: string | null;
}
