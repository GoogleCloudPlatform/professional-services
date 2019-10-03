/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AsyncValidatorFn, ValidatorFn } from './directives/validators';
import { FormArray, FormControl, FormGroup } from './model';
/**
 * @description
 * Creates an `AbstractControl` from a user-specified configuration.
 *
 * The `FormBuilder` provides syntactic sugar that shortens creating instances of a `FormControl`,
 * `FormGroup`, or `FormArray`. It reduces the amount of boilerplate needed to build complex
 * forms.
 *
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 *
 * @publicApi
 */
export declare class FormBuilder {
    /**
     * @description
     * Construct a new `FormGroup` instance.
     *
     * @param controlsConfig A collection of child controls. The key for each child is the name
     * under which it is registered.
     *
     * @param extra An object of configuration options for the `FormGroup`.
     * * `validator`: A synchronous validator function, or an array of validator functions
     * * `asyncValidator`: A single async validator or array of async validator functions
     *
     */
    group(controlsConfig: {
        [key: string]: any;
    }, extra?: {
        [key: string]: any;
    } | null): FormGroup;
    /**
     * @description
     * Construct a new `FormControl` instance.
     *
     * @param formState Initializes the control with an initial value,
     * or an object that defines the initial value and disabled state.
     *
     * @param validator A synchronous validator function, or an array of synchronous validator
     * functions.
     *
     * @param asyncValidator A single async validator or array of async validator functions
     *
     * @usageNotes
     *
     * ### Initialize a control as disabled
     *
     * The following example returns a control with an initial value in a disabled state.
     *
     * <code-example path="forms/ts/formBuilder/form_builder_example.ts"
     *   linenums="false" region="disabled-control">
     * </code-example>
     *
     */
    control(formState: any, validator?: ValidatorFn | ValidatorFn[] | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null): FormControl;
    /**
     * @description
     * Construct a new `FormArray` instance.
     *
     * @param controlsConfig An array of child controls. The key for each child control is its index
     * in the array.
     *
     * @param validator A synchronous validator function, or an array of synchronous validator
     * functions.
     *
     * @param asyncValidator A single async validator or array of async validator functions
     */
    array(controlsConfig: any[], validator?: ValidatorFn | ValidatorFn[] | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null): FormArray;
}
