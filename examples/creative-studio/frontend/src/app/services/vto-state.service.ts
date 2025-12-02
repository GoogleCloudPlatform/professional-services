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
