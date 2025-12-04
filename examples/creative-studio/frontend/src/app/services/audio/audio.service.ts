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
