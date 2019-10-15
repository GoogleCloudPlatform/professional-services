/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, InjectionToken, Renderer2 } from '@angular/core';
import { ControlValueAccessor } from './control_value_accessor';
export declare const DEFAULT_VALUE_ACCESSOR: any;
/**
 * Turn this mode on if you want form directives to buffer IME input until compositionend
 * @publicApi
 */
export declare const COMPOSITION_BUFFER_MODE: InjectionToken<boolean>;
/**
 * @description
 * The default `ControlValueAccessor` for writing a value and listening to changes on input
 * elements. The accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @usageNotes
 *
 * ### Using the default value accessor
 *
 * The following example shows how to use an input element that activates the default value accessor
 * (in this case, a text field).
 *
 * ```ts
 * const firstNameControl = new FormControl();
 * ```
 *
 * ```
 * <input type="text" [formControl]="firstNameControl">
 * ```
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class DefaultValueAccessor implements ControlValueAccessor {
    private _renderer;
    private _elementRef;
    private _compositionMode;
    /**
     * @description
     * The registered callback function called when an input event occurs on the input element.
     */
    onChange: (_: any) => void;
    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    onTouched: () => void;
    /** Whether the user is creating a composition string (IME events). */
    private _composing;
    constructor(_renderer: Renderer2, _elementRef: ElementRef, _compositionMode: boolean);
    /**
     * Sets the "value" property on the input element.
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
    registerOnChange(fn: (_: any) => void): void;
    /**
     * @description
     * Registers a function called when the control is touched.
     *
     * @param fn The callback function
     */
    registerOnTouched(fn: () => void): void;
    /**
     * Sets the "disabled" property on the input element.
     *
     * @param isDisabled The disabled value
     */
    setDisabledState(isDisabled: boolean): void;
}
