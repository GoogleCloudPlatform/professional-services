/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, OnDestroy, Renderer2, StaticProvider } from '@angular/core';
import { ControlValueAccessor } from './control_value_accessor';
export declare const SELECT_MULTIPLE_VALUE_ACCESSOR: StaticProvider;
/**
 * @description
 * The `ControlValueAccessor` for writing multi-select control values and listening to multi-select control
 * changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and `NgModel`
 * directives.
 *
 * @see `SelectControlValueAccessor`
 *
 * @usageNotes
 *
 * ### Using a multi-select control
 *
 * The follow example shows you how to use a multi-select control with a reactive form.
 *
 * ```ts
 * const countryControl = new FormControl();
 * ```
 *
 * ```
 * <select multiple name="countries" [formControl]="countryControl">
 *   <option *ngFor="let country of countries" [ngValue]="country">
 *     {{ country.name }}
 *   </option>
 * </select>
 * ```
 *
 * ### Customizing option selection
 *
 * To customize the default option comparison algorithm, `<select>` supports `compareWith` input.
 * See the `SelectControlValueAccessor` for usage.
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class SelectMultipleControlValueAccessor implements ControlValueAccessor {
    private _renderer;
    private _elementRef;
    /**
     * @description
     * The current value
     */
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
     * @description
     * Sets the "value" property on one or of more
     * of the select's options.
     *
     * @param value The value
     */
    writeValue(value: any): void;
    /**
     * @description
     * Registers a function called when the control value changes
     * and writes an array of the selected options.
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
 * @see `SelectMultipleControlValueAccessor`
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class NgSelectMultipleOption implements OnDestroy {
    private _element;
    private _renderer;
    private _select;
    id: string;
    constructor(_element: ElementRef, _renderer: Renderer2, _select: SelectMultipleControlValueAccessor);
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
