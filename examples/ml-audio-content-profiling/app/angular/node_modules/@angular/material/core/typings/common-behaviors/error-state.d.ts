/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { ErrorStateMatcher } from '../error/error-options';
import { Constructor } from './constructor';
/** @docs-private */
export interface CanUpdateErrorState {
    updateErrorState(): void;
    readonly stateChanges: Subject<void>;
    errorState: boolean;
    errorStateMatcher: ErrorStateMatcher;
}
/** @docs-private */
export declare type CanUpdateErrorStateCtor = Constructor<CanUpdateErrorState>;
/** @docs-private */
export interface HasErrorState {
    _parentFormGroup: FormGroupDirective;
    _parentForm: NgForm;
    _defaultErrorStateMatcher: ErrorStateMatcher;
    ngControl: NgControl;
}
/**
 * Mixin to augment a directive with updateErrorState method.
 * For component with `errorState` and need to update `errorState`.
 */
export declare function mixinErrorState<T extends Constructor<HasErrorState>>(base: T): CanUpdateErrorStateCtor & T;
