/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, Renderer2 } from '@angular/core';
import { ControlValueAccessor } from './control_value_accessor';
export declare const CHECKBOX_VALUE_ACCESSOR: any;
/**
 * @description
 * A `ControlValueAccessor` for writing a value and listening to changes on a checkbox input
 * element.
 *
 * @usageNotes
 *
 * ### Using a checkbox with a reactive form.
 *
 * The following example shows how to use a checkbox with a reactive form.
 *
 * ```ts
 * const rememberLoginControl = new FormControl();
 * ```
 *
 * ```
 * <input type="checkbox" [formControl]="rememberLoginControl">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class CheckboxControlValueAccessor implements ControlValueAccessor {
    private _renderer;
    private _elementRef;
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
    constructor(_renderer: Renderer2, _elementRef: ElementRef);
    /**
     * Sets the "checked" property on the input element.
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
    registerOnChange(fn: (_: any) => {}): void;
    /**
     * @description
     * Registers a function called when the control is touched.
     *
     * @param fn The callback function
     */
    registerOnTouched(fn: () => {}): void;
    /**
     * Sets the "disabled" property on the input element.
     *
     * @param isDisabled The disabled value
     */
    setDisabledState(isDisabled: boolean): void;
}
