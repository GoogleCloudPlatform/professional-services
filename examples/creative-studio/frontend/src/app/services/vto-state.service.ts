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

export interface VtoState {
  stepperIndex: number;
  modelType: string;
  model: any;
  top: any;
  bottom: any;
  dress: any;
  shoes: any;
}

@Injectable({
  providedIn: 'root'
})
export class VtoStateService {
  private initialState: VtoState = {
    stepperIndex: 0,
    modelType: 'female',
    model: null,
    top: null,
    bottom: null,
    dress: null,
    shoes: null
  };

  private state = new BehaviorSubject<VtoState>(this.initialState);
  state$ = this.state.asObservable();

  updateState(newState: Partial<VtoState>) {
    this.state.next({ ...this.state.value, ...newState });
  }

  getState(): VtoState {
    return this.state.value;
  }

  resetState() {
    this.state.next(this.initialState);
  }
}
