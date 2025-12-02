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
