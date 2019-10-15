/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, OnDestroy } from '@angular/core';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { DateAdapter, MatDateFormats, ThemePalette } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatDatepicker } from './datepicker';
/** @docs-private */
export declare const MAT_DATEPICKER_VALUE_ACCESSOR: any;
/** @docs-private */
export declare const MAT_DATEPICKER_VALIDATORS: any;
/**
 * An event used for datepicker input and change events. We don't always have access to a native
 * input or change event because the event may have been triggered by the user clicking on the
 * calendar popup. For consistency, we always use MatDatepickerInputEvent instead.
 */
export declare class MatDatepickerInputEvent<D> {
    /** Reference to the datepicker input component that emitted the event. */
    target: MatDatepickerInput<D>;
    /** Reference to the native input element associated with the datepicker input. */
    targetElement: HTMLElement;
    /** The new value for the target datepicker input. */
    value: D | null;
    constructor(
    /** Reference to the datepicker input component that emitted the event. */
    target: MatDatepickerInput<D>, 
    /** Reference to the native input element associated with the datepicker input. */
    targetElement: HTMLElement);
}
/** Directive used to connect an input to a MatDatepicker. */
export declare class MatDatepickerInput<D> implements ControlValueAccessor, OnDestroy, Validator {
    private _elementRef;
    _dateAdapter: DateAdapter<D>;
    private _dateFormats;
    private _formField;
    /** The datepicker that this input is associated with. */
    matDatepicker: MatDatepicker<D>;
    _datepicker: MatDatepicker<D>;
    /** Function that can be used to filter out dates within the datepicker. */
    matDatepickerFilter: (date: D | null) => boolean;
    _dateFilter: (date: D | null) => boolean;
    /** The value of the input. */
    value: D | null;
    private _value;
    /** The minimum valid date. */
    min: D | null;
    private _min;
    /** The maximum valid date. */
    max: D | null;
    private _max;
    /** Whether the datepicker-input is disabled. */
    disabled: boolean;
    private _disabled;
    /** Emits when a `change` event is fired on this `<input>`. */
    readonly dateChange: EventEmitter<MatDatepickerInputEvent<D>>;
    /** Emits when an `input` event is fired on this `<input>`. */
    readonly dateInput: EventEmitter<MatDatepickerInputEvent<D>>;
    /** Emits when the value changes (either due to user input or programmatic change). */
    _valueChange: EventEmitter<D | null>;
    /** Emits when the disabled state has changed */
    _disabledChange: EventEmitter<boolean>;
    _onTouched: () => void;
    private _cvaOnChange;
    private _validatorOnChange;
    private _datepickerSubscription;
    private _localeSubscription;
    /** The form control validator for whether the input parses. */
    private _parseValidator;
    /** The form control validator for the min date. */
    private _minValidator;
    /** The form control validator for the max date. */
    private _maxValidator;
    /** The form control validator for the date filter. */
    private _filterValidator;
    /** The combined form control validator for this input. */
    private _validator;
    /** Whether the last value set on the input was valid. */
    private _lastValueValid;
    constructor(_elementRef: ElementRef<HTMLInputElement>, _dateAdapter: DateAdapter<D>, _dateFormats: MatDateFormats, _formField: MatFormField);
    ngOnDestroy(): void;
    /** @docs-private */
    registerOnValidatorChange(fn: () => void): void;
    /** @docs-private */
    validate(c: AbstractControl): ValidationErrors | null;
    /**
     * @deprecated
     * @breaking-change 8.0.0 Use `getConnectedOverlayOrigin` instead
     */
    getPopupConnectionElementRef(): ElementRef;
    /**
     * Gets the element that the datepicker popup should be connected to.
     * @return The element to connect the popup to.
     */
    getConnectedOverlayOrigin(): ElementRef;
    writeValue(value: D): void;
    registerOnChange(fn: (value: any) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    _onKeydown(event: KeyboardEvent): void;
    _onInput(value: string): void;
    _onChange(): void;
    /** Returns the palette used by the input's form field, if any. */
    _getThemePalette(): ThemePalette;
    /** Handles blur events on the input. */
    _onBlur(): void;
    /** Formats a value and sets it on the input element. */
    private _formatValue;
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    private _getValidDateOrNull;
}
