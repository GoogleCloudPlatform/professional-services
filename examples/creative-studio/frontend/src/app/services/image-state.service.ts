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
    lighting: 'none',
    watermark: false,
    googleSearch: false,
    resolution: '4K',
    style: null,
    colorAndTone: null,
    numberOfMedia: 4,
    composition: null,
    useBrandGuidelines: false
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
