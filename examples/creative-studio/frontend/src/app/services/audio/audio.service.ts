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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MediaItem } from '../../common/models/media-item.model';
import {environment} from '../../../environments/environment';
import {LanguageEnum, VoiceEnum} from '../../audio/audio.constants';

// 1. Define the Enum to match Backend exactly
export enum GenerationModelEnum {
  // Music
  LYRIA_002 = 'lyria-002',

  // Speech
  CHIRP_3 = 'chirp_3',
  GEMINI_2_5_FLASH_TTS = 'gemini-2.5-flash-tts',
  GEMINI_2_5_FLASH_LITE_PREVIEW_TTS = 'gemini-2.5-flash-lite-preview-tts',
  GEMINI_2_5_PRO_TTS = 'gemini-2.5-pro-tts'
}

// 2. Define the Generic Request DTO
export interface CreateAudioDto {
  model: GenerationModelEnum;
  prompt: string;
  workspaceId: string; // Angular standard is camelCase, Pydantic 'alias_generator=to_camel' handles this

  // Lyria Specific
  negativePrompt?: string;
  sampleCount?: number;
  seed?: number;

  // TTS Specific
  languageCode?: LanguageEnum;
  voiceName?: VoiceEnum;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  // Updated endpoint to the generic one
  private apiUrl = `${environment.backendURL}/audios/generate`;

  constructor(private http: HttpClient) { }

  generateAudio(request: CreateAudioDto): Observable<MediaItem> {
    return this.http.post<MediaItem>(this.apiUrl, request);
  }
}
