/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AbstractControlDirective } from './abstract_control_directive';
import { ControlValueAccessor } from './control_value_accessor';
import { AsyncValidatorFn, ValidatorFn } from './validators';
/**
 * @description
 * A base class that all control `FormControl`-based directives extend. It binds a `FormControl`
 * object to a DOM element.
 *
 * @publicApi
 */
export declare abstract class NgControl extends AbstractControlDirective {
    /**
     * @description
     * The name for the control
     */
    name: string | null;
    /**
     * @description
     * The value accessor for the control
     */
    valueAccessor: ControlValueAccessor | null;
    /**
     * @description
     * The registered synchronous validator function for the control
     *
     * @throws An exception that this method is not implemented
     */
    readonly validator: ValidatorFn | null;
    /**
     * @description
     * The registered async validator function for the control
     *
     * @throws An exception that this method is not implemented
     */
    readonly asyncValidator: AsyncValidatorFn | null;
    /**
     * @description
     * The callback method to update the model from the view when requested
     *
     * @param newValue The new value for the view
     */
    abstract viewToModelUpdate(newValue: any): void;
}
