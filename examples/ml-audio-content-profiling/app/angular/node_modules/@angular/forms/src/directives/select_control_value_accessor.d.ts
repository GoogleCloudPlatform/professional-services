/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, OnDestroy, Renderer2, StaticProvider } from '@angular/core';
import { ControlValueAccessor } from './control_value_accessor';
export declare const SELECT_VALUE_ACCESSOR: StaticProvider;
/**
 * @description
 * The `ControlValueAccessor` for writing select control values and listening to select control
 * changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @usageNotes
 *
 * ### Using select controls in a reactive form
 *
 * The following examples show how to use a select control in a reactive form.
 *
 * {@example forms/ts/reactiveSelectControl/reactive_select_control_example.ts region='Component'}
 *
 * ### Using select controls in a template-driven form
 *
 * To use a select in a template-driven form, simply add an `ngModel` and a `name`
 * attribute to the main `<select>` tag.
 *
 * {@example forms/ts/selectControl/select_control_example.ts region='Component'}
 *
 * ### Customizing option selection
 *
 * Angular uses object identity to select option. It's possible for the identities of items
 * to change while the data does not. This can happen, for example, if the items are produced
 * from an RPC to the server, and that RPC is re-run. Even if the data hasn't changed, the
 * second response will produce objects with different identities.
 *
 * To customize the default option comparison algorithm, `<select>` supports `compareWith` input.
 * `compareWith` takes a **function** which has two arguments: `option1` and `option2`.
 * If `compareWith` is given, Angular selects option by the return value of the function.
 *
 * ```ts
 * const selectedCountriesControl = new FormControl();
 * ```
 *
 * ```
 * <select [compareWith]="compareFn"  [formControl]="selectedCountriesControl">
 *     <option *ngFor="let country of countries" [ngValue]="country">
 *         {{country.name}}
 *     </option>
 * </select>
 *
 * compareFn(c1: Country, c2: Country): boolean {
 *     return c1 && c2 ? c1.id === c2.id : c1 === c2;
 * }
 * ```
 *
 * **Note:** We listen to the 'change' event because 'input' events aren't fired
 * for selects in Firefox and IE:
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1024350
 * https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/4660045/
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class SelectControlValueAccessor implements ControlValueAccessor {
    private _renderer;
    private _elementRef;
    value: any;
    /**
     * @description
     * The registered callback function called when a change event occurs on the input element.
     */
    onChange: (_: any) => void;
    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    onTouched: () => void;
    /**
     * @description
     * Tracks the option comparison algorithm for tracking identities when
     * checking for changes.
     */
    compareWith: (o1: any, o2: any) => boolean;
    private _compareWith;
    constructor(_renderer: Renderer2, _elementRef: ElementRef);
    /**
     * Sets the "value" property on the input element. The "selectedIndex"
     * property is also set if an ID is provided on the option element.
     *
     * @param value The checked value
     */
    writeValue(value: any): void;
    /**
     * @description
     * Registers a function called when the control value changes.
     *
     * @param fn The callback function
     */
    registerOnChange(fn: (value: any) => any): void;
    /**
     * @description
     * Registers a function called when the control is touched.
     *
     * @param fn The callback function
     */
    registerOnTouched(fn: () => any): void;
    /**
     * Sets the "disabled" property on the select input element.
     *
     * @param isDisabled The disabled value
     */
    setDisabledState(isDisabled: boolean): void;
}
/**
 * @description
 * Marks `<option>` as dynamic, so Angular can be notified when options change.
 *
 * @see `SelectControlValueAccessor`
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class NgSelectOption implements OnDestroy {
    private _element;
    private _renderer;
    private _select;
    /**
     * @description
     * ID of the option element
     */
    id: string;
    constructor(_element: ElementRef, _renderer: Renderer2, _select: SelectControlValueAccessor);
    /**
     * @description
     * Tracks the value bound to the option element. Unlike the value binding,
     * ngValue supports binding to objects.
     */
    ngValue: any;
    /**
     * @description
     * Tracks simple string values bound to the option element.
     * For objects, use the `ngValue` input binding.
     */
    value: any;
    /**
     * @description
     * Lifecycle method called before the directive's instance is destroyed. For internal use only.
     */
    ngOnDestroy(): void;
}
