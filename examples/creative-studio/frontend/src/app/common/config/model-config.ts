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

export type GenerationType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export type GenerationMode =
  | 'Text to Image'
  | 'Ingredients to Image'
  | 'Text to Video'
  | 'Frames to Video'
  | 'Ingredients to Video'
  | 'Text to Audio';

export interface ModelCapability {
  supportedModes: GenerationMode[];
  maxReferenceImages: number; // Max images for ingredients/frames modes
  supportedAspectRatios: string[]; // e.g., ['16:9', '1:1']
  supportsAudio?: boolean; // For video
  supportsNegativePrompt?: boolean;
  supportsGoogleSearch?: boolean;
}

export interface GenerationModelConfig {
  value: string; // API value
  viewValue: string; // Display name
  type: GenerationType;
  icon?: string; // Material icon name
  imageSrc?: string; // For custom image icons (like banana)
  isSvg?: boolean; // If icon is an SVG
  isImage?: boolean; // If icon is an image
  capabilities: ModelCapability;
}

export const MODEL_CONFIGS: GenerationModelConfig[] = [
  // --- Image Models ---
  {
    value: 'gemini-3-pro-image-preview',
    viewValue: 'Nano Banana Pro',
    type: 'IMAGE',
    imageSrc: 'assets/images/banana-peel.png',
    isImage: true,
    capabilities: {
      supportedModes: ['Text to Image', 'Ingredients to Image'],
      maxReferenceImages: 14,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3', '2:3', '3:2', '4:5', '5:4', '21:9'], // All
      supportsGoogleSearch: true,
    },
  },
  {
    value: 'gemini-2.5-flash-image-preview',
    viewValue: 'Nano Banana',
    type: 'IMAGE',
    imageSrc: 'assets/images/banana-peel.png',
    isImage: true,
    capabilities: {
      supportedModes: ['Text to Image', 'Ingredients to Image'],
      maxReferenceImages: 2,
      supportedAspectRatios: ['1:1'],
    },
  },
  {
    value: 'imagen-4.0-generate-001',
    viewValue: 'Imagen 4',
    type: 'IMAGE',
    icon: 'gemini-spark-icon',
    isSvg: true,
    capabilities: {
      supportedModes: ['Text to Image'], // No ingredients support yet?
      maxReferenceImages: 0,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    },
  },
  {
    value: 'imagen-4.0-ultra-generate-001',
    viewValue: 'Imagen 4 Ultra',
    type: 'IMAGE',
    icon: 'gemini-spark-icon',
    isSvg: true,
    capabilities: {
      supportedModes: ['Text to Image'],
      maxReferenceImages: 0,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    },
  },
  {
    value: 'imagen-4.0-fast-generate-001',
    viewValue: 'Imagen 4 Fast',
    type: 'IMAGE',
    icon: 'gemini-spark-icon',
    isSvg: true,
    capabilities: {
      supportedModes: ['Text to Image'],
      maxReferenceImages: 0,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    },
  },
  {
    value: 'imagen-3.0-generate-002',
    viewValue: 'Imagen 3',
    type: 'IMAGE',
    icon: 'auto_awesome',
    capabilities: {
      supportedModes: ['Text to Image', 'Ingredients to Image'],
      maxReferenceImages: 2,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    },
  },
  {
    value: 'imagen-3.0-fast-generate-001',
    viewValue: 'Imagen 3 Fast',
    type: 'IMAGE',
    icon: 'auto_awesome',
    capabilities: {
      supportedModes: ['Text to Image', 'Ingredients to Image'],
      maxReferenceImages: 2,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
    },
  },

  // --- Video Models ---
  {
    value: 'veo-3.1-generate-preview',
    viewValue: 'Veo 3.1 \n (Beta Audio)',
    type: 'VIDEO',
    icon: 'volume_up',
    capabilities: {
      supportedModes: ['Text to Video', 'Ingredients to Video'], // Assuming ingredients = image-to-video
      maxReferenceImages: 3,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsAudio: true,
    },
  },
  {
    value: 'veo-3.0-generate-001',
    viewValue: 'Veo 3 Quality \n (Beta Audio)',
    type: 'VIDEO',
    icon: 'volume_up',
    capabilities: {
      supportedModes: ['Text to Video', 'Ingredients to Video'],
      maxReferenceImages: 3,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsAudio: true,
    },
  },
  {
    value: 'veo-3.0-fast-generate-001',
    viewValue: 'Veo 3 Fast \n (Beta Audio)',
    type: 'VIDEO',
    icon: 'volume_up',
    capabilities: {
      supportedModes: ['Text to Video', 'Ingredients to Video'],
      maxReferenceImages: 3,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsAudio: true,
    },
  },
  {
    value: 'veo-2.0-generate-001',
    viewValue: 'Veo 2 Quality \n (No Audio)',
    type: 'VIDEO',
    icon: 'videocam_off',
    capabilities: {
      supportedModes: ['Text to Video', 'Ingredients to Video'],
      maxReferenceImages: 3,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsAudio: false,
    },
  },
  {
    value: 'veo-2.0-fast-generate-001',
    viewValue: 'Veo 2 Fast \n (No Audio)',
    type: 'VIDEO',
    icon: 'videocam_off',
    capabilities: {
      supportedModes: ['Text to Video', 'Ingredients to Video'],
      maxReferenceImages: 3,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsAudio: false,
    },
  },
  {
    value: 'veo-2.0-generate-exp',
    viewValue: 'Veo 2 Exp \n (Reference Image)',
    type: 'VIDEO',
    icon: 'image',
    capabilities: {
      supportedModes: ['Text to Video', 'Ingredients to Video'],
      maxReferenceImages: 3,
      supportedAspectRatios: ['16:9', '9:16'],
      supportsAudio: false,
    },
  },
  // --- Audio Models ---
  {
    value: 'lyria-002',
    viewValue: 'Lyria',
    type: 'AUDIO',
    icon: 'music_note',
    capabilities: {
      supportedModes: ['Text to Audio'],
      maxReferenceImages: 0,
      supportedAspectRatios: [],
    },
  },
  {
    value: 'gemini-2.5-flash-tts',
    viewValue: 'Gemini TTS',
    type: 'AUDIO',
    icon: 'record_voice_over',
    capabilities: {
      supportedModes: ['Text to Audio'],
      maxReferenceImages: 0,
      supportedAspectRatios: [],
    },
  },
  {
    value: 'chirp_3',
    viewValue: 'Chirp',
    type: 'AUDIO',
    icon: 'music_note',
    capabilities: {
      supportedModes: ['Text to Audio'],
      maxReferenceImages: 0,
      supportedAspectRatios: [],
    },
  },
];
