/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormControl, FormHooks } from '../model';
import { ControlContainer } from './control_container';
import { ControlValueAccessor } from './control_value_accessor';
import { NgControl } from './ng_control';
import { AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn } from './validators';
export declare const formControlBinding: any;
/**
 * @description
 *
 * Creates a `FormControl` instance from a domain model and binds it
 * to a form control element.
 *
 * The `FormControl` instance will track the value, user interaction, and
 * validation status of the control and keep the view synced with the model. If used
 * within a parent form, the directive will also register itself with the form as a child
 * control.
 *
 * This directive can be used by itself or as part of a larger form. All you need is the
 * `ngModel` selector to activate it.
 *
 * It accepts a domain model as an optional `Input`. If you have a one-way binding
 * to `ngModel` with `[]` syntax, changing the value of the domain model in the component
 * class will set the value in the view. If you have a two-way binding with `[()]` syntax
 * (also known as 'banana-box syntax'), the value in the UI will always be synced back to
 * the domain model in your class as well.
 *
 * If you wish to inspect the properties of the associated `FormControl` (like
 * validity state), you can also export the directive into a local template variable using
 * `ngModel` as the key (ex: `#myVar="ngModel"`). You can then access the control using the
 * directive's `control` property, but most properties you'll need (like `valid` and `dirty`)
 * will fall through to the control anyway, so you can access them directly. You can see a
 * full list of properties directly available in `AbstractControlDirective`.
 *
 * The following is an example of a simple standalone control using `ngModel`:
 *
 * {@example forms/ts/simpleNgModel/simple_ng_model_example.ts region='Component'}
 *
 * When using the `ngModel` within `<form>` tags, you'll also need to supply a `name` attribute
 * so that the control can be registered with the parent form under that name.
 *
 * It's worth noting that in the context of a parent form, you often can skip one-way or
 * two-way binding because the parent form will sync the value for you. You can access
 * its properties by exporting it into a local template variable using `ngForm` (ex:
 * `#f="ngForm"`). Then you can pass it where it needs to go on submit.
 *
 * If you do need to populate initial values into your form, using a one-way binding for
 * `ngModel` tends to be sufficient as long as you use the exported form's value rather
 * than the domain model's value on submit.
 *
 * Take a look at an example of using `ngModel` within a form:
 *
 * {@example forms/ts/simpleForm/simple_form_example.ts region='Component'}
 *
 * To see `ngModel` examples with different form control types, see:
 *
 * * Radio buttons: `RadioControlValueAccessor`
 * * Selects: `SelectControlValueAccessor`
 *
 * @ngModule FormsModule
 * @publicApi
 */
export declare class NgModel extends NgControl implements OnChanges, OnDestroy {
    readonly control: FormControl;
    viewModel: any;
    name: string;
    isDisabled: boolean;
    model: any;
    /**
     * Options object for this `ngModel` instance. You can configure the following properties:
     *
     * **name**: An alternative to setting the name attribute on the form control element.
     * Sometimes, especially with custom form components, the name attribute might be used
     * as an `@Input` property for a different purpose. In cases like these, you can configure
     * the `ngModel` name through this option.
     *
     * ```html
     * <form>
     *   <my-person-control name="Nancy" ngModel [ngModelOptions]="{name: 'user'}">
     *   </my-person-control>
     * </form>
     * <!-- form value: {user: ''} -->
     * ```
     *
     * **standalone**: Defaults to false. If this is set to true, the `ngModel` will not
     * register itself with its parent form, and will act as if it's not in the form. This
     * can be handy if you have form meta-controls, a.k.a. form elements nested in
     * the `<form>` tag that control the display of the form, but don't contain form data.
     *
     * ```html
     * <form>
     *   <input name="login" ngModel placeholder="Login">
     *   <input type="checkbox" ngModel [ngModelOptions]="{standalone: true}"> Show more options?
     * </form>
     * <!-- form value: {login: ''} -->
     * ```
     *
     * **updateOn**: Defaults to `'change'`. Defines the event upon which the form control
     * value and validity will update. Also accepts `'blur'` and `'submit'`.
     *
     * ```html
     * <input [(ngModel)]="firstName" [ngModelOptions]="{updateOn: 'blur'}">
     * ```
     *
     */
    options: {
        name?: string;
        standalone?: boolean;
        updateOn?: FormHooks;
    };
    update: EventEmitter<{}>;
    constructor(parent: ControlContainer, validators: Array<Validator | ValidatorFn>, asyncValidators: Array<AsyncValidator | AsyncValidatorFn>, valueAccessors: ControlValueAccessor[]);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    readonly path: string[];
    readonly formDirective: any;
    readonly validator: ValidatorFn | null;
    readonly asyncValidator: AsyncValidatorFn | null;
    viewToModelUpdate(newValue: any): void;
    private _setUpControl;
    private _setUpdateStrategy;
    private _isStandalone;
    private _setUpStandalone;
    private _checkForErrors;
    private _checkParentType;
    private _checkName;
    private _updateValue;
    private _updateDisabled;
}
