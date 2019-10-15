/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterViewInit, EventEmitter } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormHooks } from '../model';
import { ControlContainer } from './control_container';
import { Form } from './form_interface';
import { NgControl } from './ng_control';
import { NgModel } from './ng_model';
import { NgModelGroup } from './ng_model_group';
export declare const formDirectiveProvider: any;
/**
 * @description
 *
 * Creates a top-level `FormGroup` instance and binds it to a form
 * to track aggregate form value and validation status.
 *
 * As soon as you import the `FormsModule`, this directive becomes active by default on
 * all `<form>` tags.  You don't need to add a special selector.
 *
 * You can export the directive into a local template variable using `ngForm` as the key
 * (ex: `#myForm="ngForm"`). This is optional, but useful.  Many properties from the underlying
 * `FormGroup` instance are duplicated on the directive itself, so a reference to it
 * will give you access to the aggregate value and validity status of the form, as well as
 * user interaction properties like `dirty` and `touched`.
 *
 * To register child controls with the form, you'll want to use `NgModel` with a
 * `name` attribute.  You can also use `NgModelGroup` if you'd like to create
 * sub-groups within the form.
 *
 * You can listen to the directive's `ngSubmit` event to be notified when the user has
 * triggered a form submission. The `ngSubmit` event will be emitted with the original form
 * submission event.
 *
 * In template driven forms, all `<form>` tags are automatically tagged as `NgForm`.
 * If you want to import the `FormsModule` but skip its usage in some forms,
 * for example, to use native HTML5 validation, you can add `ngNoForm` and the `<form>`
 * tags won't create an `NgForm` directive. In reactive forms, using `ngNoForm` is
 * unnecessary because the `<form>` tags are inert. In that case, you would
 * refrain from using the `formGroup` directive.
 *
 * Support for using `ngForm` element selector has been deprecated in Angular v6 and will be removed
 * in Angular v9.
 *
 * This has been deprecated to keep selectors consistent with other core Angular selectors,
 * as element selectors are typically written in kebab-case.
 *
 * Now deprecated:
 * ```html
 * <ngForm #myForm="ngForm">
 * ```
 *
 * After:
 * ```html
 * <ng-form #myForm="ngForm">
 * ```
 *
 * {@example forms/ts/simpleForm/simple_form_example.ts region='Component'}
 *
 * @ngModule FormsModule
 * @publicApi
 */
export declare class NgForm extends ControlContainer implements Form, AfterViewInit {
    readonly submitted: boolean;
    private _directives;
    form: FormGroup;
    ngSubmit: EventEmitter<{}>;
    /**
     * Options for the `NgForm` instance. Accepts the following properties:
     *
     * **updateOn**: Serves as the default `updateOn` value for all child `NgModels` below it
     * (unless a child has explicitly set its own value for this in `ngModelOptions`).
     * Potential values: `'change'` | `'blur'` | `'submit'`
     *
     * ```html
     * <form [ngFormOptions]="{updateOn: 'blur'}">
     *    <input name="one" ngModel>  <!-- this ngModel will update on blur -->
     * </form>
     * ```
     *
     */
    options: {
        updateOn?: FormHooks;
    };
    constructor(validators: any[], asyncValidators: any[]);
    ngAfterViewInit(): void;
    readonly formDirective: Form;
    readonly control: FormGroup;
    readonly path: string[];
    readonly controls: {
        [key: string]: AbstractControl;
    };
    addControl(dir: NgModel): void;
    getControl(dir: NgModel): FormControl;
    removeControl(dir: NgModel): void;
    addFormGroup(dir: NgModelGroup): void;
    removeFormGroup(dir: NgModelGroup): void;
    getFormGroup(dir: NgModelGroup): FormGroup;
    updateModel(dir: NgControl, value: any): void;
    setValue(value: {
        [key: string]: any;
    }): void;
    onSubmit($event: Event): boolean;
    onReset(): void;
    resetForm(value?: any): void;
    private _setUpdateStrategy;
}
