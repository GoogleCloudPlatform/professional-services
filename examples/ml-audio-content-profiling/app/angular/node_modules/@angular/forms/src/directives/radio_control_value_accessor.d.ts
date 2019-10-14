/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, Injector, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ControlValueAccessor } from './control_value_accessor';
import { NgControl } from './ng_control';
export declare const RADIO_VALUE_ACCESSOR: any;
/**
 * @description
 * Class used by Angular to track radio buttons. For internal use only.
 */
export declare class RadioControlRegistry {
    private _accessors;
    /**
     * @description
     * Adds a control to the internal registry. For internal use only.
     */
    add(control: NgControl, accessor: RadioControlValueAccessor): void;
    /**
     * @description
     * Removes a control from the internal registry. For internal use only.
     */
    remove(accessor: RadioControlValueAccessor): void;
    /**
     * @description
     * Selects a radio button. For internal use only.
     */
    select(accessor: RadioControlValueAccessor): void;
    private _isSameGroup;
}
/**
 * @description
 * The `ControlValueAccessor` for writing radio control values and listening to radio control
 * changes. The value accessor is used by the `FormControlDirective`, `FormControlName`, and
 * `NgModel` directives.
 *
 * @usageNotes
 *
 * ### Using radio buttons with reactive form directives
 *
 * The follow example shows how to use radio buttons in a reactive form. When using radio buttons in
 * a reactive form, radio buttons in the same group should have the same `formControlName`.
 * Providing a `name` attribute is optional.
 *
 * {@example forms/ts/reactiveRadioButtons/reactive_radio_button_example.ts region='Reactive'}
 *
 * @ngModule ReactiveFormsModule
 * @ngModule FormsModule
 * @publicApi
 */
export declare class RadioControlValueAccessor implements ControlValueAccessor, OnDestroy, OnInit {
    private _renderer;
    private _elementRef;
    private _registry;
    private _injector;
    /**
     * @description
     * The registered callback function called when a change event occurs on the input element.
     */
    onChange: () => void;
    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    onTouched: () => void;
    /**
     * @description
     * Tracks the name of the radio input element.
     */
    name: string;
    /**
     * @description
     * Tracks the name of the `FormControl` bound to the directive. The name corresponds
     * to a key in the parent `FormGroup` or `FormArray`.
     */
    formControlName: string;
    /**
     * @description
     * Tracks the value of the radio input element
     */
    value: any;
    constructor(_renderer: Renderer2, _elementRef: ElementRef, _registry: RadioControlRegistry, _injector: Injector);
    /**
     * @description
     * A lifecycle method called when the directive is initialized. For internal use only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnInit(): void;
    /**
     * @description
     * Lifecycle method called before the directive's instance is destroyed. For internal use only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnDestroy(): void;
    /**
     * @description
     * Sets the "checked" property value on the radio input element.
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
     * Sets the "value" on the radio input element and unchecks it.
     *
     * @param value
     */
    fireUncheck(value: any): void;
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
    private _checkName;
    private _throwNameError;
}
