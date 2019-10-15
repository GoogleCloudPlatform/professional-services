/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { AbstractControl } from '../model';
import { ValidationErrors } from './validators';
/**
 * @description
 * Base class for control directives.
 *
 * This class is only used internally in the `ReactiveFormsModule` and the `FormsModule`.
 *
 * @publicApi
 */
export declare abstract class AbstractControlDirective {
    /**
     * @description
     * A reference to the underlying control.
     *
     * @returns the control that backs this directive. Most properties fall through to that instance.
     */
    abstract readonly control: AbstractControl | null;
    /**
     * @description
     * Reports the value of the control if it is present, otherwise null.
     */
    readonly value: any;
    /**
     * @description
     * Reports whether the control is valid. A control is considered valid if no
     * validation errors exist with the current value.
     * If the control is not present, null is returned.
     */
    readonly valid: boolean | null;
    /**
     * @description
     * Reports whether the control is invalid, meaning that an error exists in the input value.
     * If the control is not present, null is returned.
     */
    readonly invalid: boolean | null;
    /**
     * @description
     * Reports whether a control is pending, meaning that that async validation is occurring and
     * errors are not yet available for the input value. If the control is not present, null is
     * returned.
     */
    readonly pending: boolean | null;
    /**
     * @description
     * Reports whether the control is disabled, meaning that the control is disabled
     * in the UI and is exempt from validation checks and excluded from aggregate
     * values of ancestor controls. If the control is not present, null is returned.
     */
    readonly disabled: boolean | null;
    /**
     * @description
     * Reports whether the control is enabled, meaning that the control is included in ancestor
     * calculations of validity or value. If the control is not present, null is returned.
     */
    readonly enabled: boolean | null;
    /**
     * @description
     * Reports the control's validation errors. If the control is not present, null is returned.
     */
    readonly errors: ValidationErrors | null;
    /**
     * @description
     * Reports whether the control is pristine, meaning that the user has not yet changed
     * the value in the UI. If the control is not present, null is returned.
     */
    readonly pristine: boolean | null;
    /**
     * @description
     * Reports whether the control is dirty, meaning that the user has changed
     * the value in the UI. If the control is not present, null is returned.
     */
    readonly dirty: boolean | null;
    /**
     * @description
     * Reports whether the control is touched, meaning that the user has triggered
     * a `blur` event on it. If the control is not present, null is returned.
     */
    readonly touched: boolean | null;
    /**
     * @description
     * Reports the validation status of the control. Possible values include:
     * 'VALID', 'INVALID', 'DISABLED', and 'PENDING'.
     * If the control is not present, null is returned.
     */
    readonly status: string | null;
    /**
     * @description
     * Reports whether the control is untouched, meaning that the user has not yet triggered
     * a `blur` event on it. If the control is not present, null is returned.
     */
    readonly untouched: boolean | null;
    /**
     * @description
     * Returns a multicasting observable that emits a validation status whenever it is
     * calculated for the control. If the control is not present, null is returned.
     */
    readonly statusChanges: Observable<any> | null;
    /**
     * @description
     * Returns a multicasting observable of value changes for the control that emits every time the
     * value of the control changes in the UI or programmatically.
     * If the control is not present, null is returned.
     */
    readonly valueChanges: Observable<any> | null;
    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    readonly path: string[] | null;
    /**
     * @description
     * Resets the control with the provided value if the control is present.
     */
    reset(value?: any): void;
    /**
     * @description
     * Reports whether the control with the given path has the error specified.
     * If no path is given, it checks for the error on the present control.
     * If the control is not present, false is returned.
     */
    hasError(errorCode: string, path?: string[]): boolean;
    /**
     * @description
     * Reports error data for the control with the given path.
     * If the control is not present, null is returned.
     */
    getError(errorCode: string, path?: string[]): any;
}
