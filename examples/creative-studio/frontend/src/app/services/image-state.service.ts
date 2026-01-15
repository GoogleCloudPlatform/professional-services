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

export interface ImageState {
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  model: string;
  lighting: string | null;
  watermark: boolean;
  googleSearch: boolean;
  resolution: string;
  style: string | null;
  colorAndTone: string | null;
  numberOfMedia: number;
  composition: string | null;
  useBrandGuidelines: boolean;
  mode: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageStateService {
  private initialState: ImageState = {
    prompt: '',
    negativePrompt: '',
    aspectRatio: '1:1',
    model: 'gemini-3-pro-image-preview',
    lighting: '',
    watermark: false,
    googleSearch: false,
    resolution: '4K',
    style: null,
    colorAndTone: null,
    numberOfMedia: 4,
    composition: null,
    useBrandGuidelines: false,
    mode: 'Text to Image'
  };

  private state = new BehaviorSubject<ImageState>(this.initialState);
  state$ = this.state.asObservable();

  updateState(newState: Partial<ImageState>) {
    this.state.next({ ...this.state.value, ...newState });
  }

  getState(): ImageState {
    return this.state.value;
  }

  resetState() {
    this.state.next(this.initialState);
  }
}
