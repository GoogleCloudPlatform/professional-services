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
import { BehaviorSubject } from 'rxjs';

export interface VideoState {
  prompt: string;
  aspectRatio: string;
  model: string;
  style: string | null;
  colorAndTone: string | null;
  lighting: string | null;
  numberOfMedia: number;
  durationSeconds: number;
  composition: string | null;
  generateAudio: boolean;
  negativePrompt: string;
  useBrandGuidelines: boolean;
  mode: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoStateService {
  private initialState: VideoState = {
    prompt: '',
    aspectRatio: '16:9',
    model: 'veo-3.1-generate-preview',
    style: null,
    colorAndTone: null,
    lighting: null,
    numberOfMedia: 4,
    durationSeconds: 8,
    composition: null,
    generateAudio: true,
    negativePrompt: '',
    useBrandGuidelines: false,
    mode: 'Text to Video'
  };

  private state = new BehaviorSubject<VideoState>(this.initialState);
  state$ = this.state.asObservable();

  updateState(newState: Partial<VideoState>) {
    this.state.next({ ...this.state.value, ...newState });
  }

  getState(): VideoState {
    return this.state.value;
  }

  resetState() {
    this.state.next(this.initialState);
  }
}
