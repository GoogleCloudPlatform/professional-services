/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OnDestroy, OnInit } from '@angular/core';
import { FormArray } from '../../model';
import { AbstractFormGroupDirective } from '../abstract_form_group_directive';
import { ControlContainer } from '../control_container';
import { AsyncValidatorFn, ValidatorFn } from '../validators';
import { FormGroupDirective } from './form_group_directive';
export declare const formGroupNameProvider: any;
/**
 * @description
 *
 * Syncs a nested `FormGroup` to a DOM element.
 *
 * This directive can only be used with a parent `FormGroupDirective`.
 *
 * It accepts the string name of the nested `FormGroup` to link, and
 * looks for a `FormGroup` registered with that name in the parent
 * `FormGroup` instance you passed into `FormGroupDirective`.
 *
 * Use nested form groups to validate a sub-group of a
 * form separately from the rest or to group the values of certain
 * controls into their own nested object.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 *
 * @usageNotes
 *
 * ### Access the group by name
 *
 * The following example uses the {@link AbstractControl#get get} method to access the
 * associated `FormGroup`
 *
 * ```ts
 *   this.form.get('name');
 * ```
 *
 * ### Access individual controls in the group
 *
 * The following example uses the {@link AbstractControl#get get} method to access
 * individual controls within the group using dot syntax.
 *
 * ```ts
 *   this.form.get('name.first');
 * ```
 *
 * ### Register a nested `FormGroup`.
 *
 * The following example registers a nested *name* `FormGroup` within an existing `FormGroup`,
 * and provides methods to retrieve the nested `FormGroup` and individual controls.
 *
 * {@example forms/ts/nestedFormGroup/nested_form_group_example.ts region='Component'}
 *
 * @ngModule ReactiveFormsModule
 * @publicApi
 */
export declare class FormGroupName extends AbstractFormGroupDirective implements OnInit, OnDestroy {
    /**
     * @description
     * Tracks the name of the `FormGroup` bound to the directive. The name corresponds
     * to a key in the parent `FormGroup` or `FormArray`.
     */
    name: string;
    constructor(parent: ControlContainer, validators: any[], asyncValidators: any[]);
}
export declare const formArrayNameProvider: any;
/**
 * @description
 *
 * Syncs a nested `FormArray` to a DOM element.
 *
 * This directive is designed to be used with a parent `FormGroupDirective` (selector:
 * `[formGroup]`).
 *
 * It accepts the string name of the nested `FormArray` you want to link, and
 * will look for a `FormArray` registered with that name in the parent
 * `FormGroup` instance you passed into `FormGroupDirective`.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `AbstractControl`
 *
 * @usageNotes
 *
 * ### Example
 *
 * {@example forms/ts/nestedFormArray/nested_form_array_example.ts region='Component'}
 *
 * @ngModule ReactiveFormsModule
 * @publicApi
 */
export declare class FormArrayName extends ControlContainer implements OnInit, OnDestroy {
    /**
     * @description
     * Tracks the name of the `FormArray` bound to the directive. The name corresponds
     * to a key in the parent `FormGroup` or `FormArray`.
     */
    name: string;
    constructor(parent: ControlContainer, validators: any[], asyncValidators: any[]);
    /**
     * @description
     * A lifecycle method called when the directive's inputs are initialized. For internal use only.
     *
     * @throws If the directive does not have a valid parent.
     */
    ngOnInit(): void;
    /**
     * @description
     * A lifecycle method called before the directive's instance is destroyed. For internal use only.
     */
    ngOnDestroy(): void;
    /**
     * @description
     * The `FormArray` bound to this directive.
     */
    readonly control: FormArray;
    /**
     * @description
     * The top-level directive for this group if present, otherwise null.
     */
    readonly formDirective: FormGroupDirective | null;
    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    readonly path: string[];
    /**
     * @description
     * Synchronous validator function composed of all the synchronous validators registered with this
     * directive.
     */
    readonly validator: ValidatorFn | null;
    /**
     * @description
     * Async validator function composed of all the async validators registered with this directive.
     */
    readonly asyncValidator: AsyncValidatorFn | null;
    private _checkParentType;
}
