/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, InjectionToken, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '../../model';
import { ControlValueAccessor } from '../control_value_accessor';
import { NgControl } from '../ng_control';
import { AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn } from '../validators';
/**
 * Token to provide to turn off the ngModel warning on formControl and formControlName.
 */
export declare const NG_MODEL_WITH_FORM_CONTROL_WARNING: InjectionToken<{}>;
export declare const formControlBinding: any;
/**
 * @description
 * * Syncs a standalone `FormControl` instance to a form control element.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `FormControl`
 * @see `AbstractControl`
 *
 * @usageNotes
 *
 * ### Registering a single form control
 *
 * The following examples shows how to register a standalone control and set its value.
 *
 * {@example forms/ts/simpleFormControl/simple_form_control_example.ts region='Component'}
 *
 * ### Use with ngModel
 *
 * Support for using the `ngModel` input property and `ngModelChange` event with reactive
 * form directives has been deprecated in Angular v6 and will be removed in Angular v7.
 *
 * Now deprecated:
 *
 * ```html
 * <input [formControl]="control" [(ngModel)]="value">
 * ```
 *
 * ```ts
 * this.value = 'some value';
 * ```
 *
 * This has been deprecated for a few reasons. First, developers have found this pattern
 * confusing. It seems like the actual `ngModel` directive is being used, but in fact it's
 * an input/output property named `ngModel` on the reactive form directive that simply
 * approximates (some of) its behavior. Specifically, it allows getting/setting the value
 * and intercepting value events. However, some of `ngModel`'s other features - like
 * delaying updates with`ngModelOptions` or exporting the directive - simply don't work,
 * which has understandably caused some confusion.
 *
 * In addition, this pattern mixes template-driven and reactive forms strategies, which
 * we generally don't recommend because it doesn't take advantage of the full benefits of
 * either strategy. Setting the value in the template violates the template-agnostic
 * principles behind reactive forms, whereas adding a `FormControl`/`FormGroup` layer in
 * the class removes the convenience of defining forms in the template.
 *
 * To update your code before v7, you'll want to decide whether to stick with reactive form
 * directives (and get/set values using reactive forms patterns) or switch over to
 * template-driven directives.
 *
 * After (choice 1 - use reactive forms):
 *
 * ```html
 * <input [formControl]="control">
 * ```
 *
 * ```ts
 * this.control.setValue('some value');
 * ```
 *
 * After (choice 2 - use template-driven forms):
 *
 * ```html
 * <input [(ngModel)]="value">
 * ```
 *
 * ```ts
 * this.value = 'some value';
 * ```
 *
 * By default, when you use this pattern, you will see a deprecation warning once in dev
 * mode. You can choose to silence this warning by providing a config for
 * `ReactiveFormsModule` at import time:
 *
 * ```ts
 * imports: [
 *   ReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'never'});
 * ]
 * ```
 *
 * Alternatively, you can choose to surface a separate warning for each instance of this
 * pattern with a config value of `"always"`. This may help to track down where in the code
 * the pattern is being used as the code is being updated.
 *
 * @ngModule ReactiveFormsModule
 * @publicApi
 */
export declare class FormControlDirective extends NgControl implements OnChanges {
    private _ngModelWarningConfig;
    /**
     * @description
     * Internal reference to the view model value.
     */
    viewModel: any;
    /**
     * @description
     * Tracks the `FormControl` instance bound to the directive.
     */
    form: FormControl;
    /**
     * @description
     * Triggers a warning that this input should not be used with reactive forms.
     */
    isDisabled: boolean;
    /** @deprecated as of v6 */
    model: any;
    /** @deprecated as of v6 */
    update: EventEmitter<{}>;
    constructor(validators: Array<Validator | ValidatorFn>, asyncValidators: Array<AsyncValidator | AsyncValidatorFn>, valueAccessors: ControlValueAccessor[], _ngModelWarningConfig: string | null);
    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use
     * only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges): void;
    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    readonly path: string[];
    /**
     * @description
     * Synchronous validator function composed of all the synchronous validators
     * registered with this directive.
     */
    readonly validator: ValidatorFn | null;
    /**
     * @description
     * Async validator function composed of all the async validators registered with this
     * directive.
     */
    readonly asyncValidator: AsyncValidatorFn | null;
    /**
     * @description
     * The `FormControl` bound to this directive.
     */
    readonly control: FormControl;
    /**
     * @description
     * Sets the new value for the view model and emits an `ngModelChange` event.
     *
     * @param newValue The new value for the view model.
     */
    viewToModelUpdate(newValue: any): void;
    private _isControlChanged;
}
