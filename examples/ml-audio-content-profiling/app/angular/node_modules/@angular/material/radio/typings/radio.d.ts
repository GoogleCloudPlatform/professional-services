/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { AfterContentInit, AfterViewInit, ChangeDetectorRef, ElementRef, EventEmitter, OnDestroy, OnInit, QueryList } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { CanColor, CanColorCtor, CanDisableRipple, CanDisableRippleCtor, HasTabIndex, HasTabIndexCtor } from '@angular/material/core';
/**
 * Provider Expression that allows mat-radio-group to register as a ControlValueAccessor. This
 * allows it to support [(ngModel)] and ngControl.
 * @docs-private
 */
export declare const MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR: any;
/** Change event object emitted by MatRadio and MatRadioGroup. */
export declare class MatRadioChange {
    /** The MatRadioButton that emits the change event. */
    source: MatRadioButton;
    /** The value of the MatRadioButton. */
    value: any;
    constructor(
    /** The MatRadioButton that emits the change event. */
    source: MatRadioButton, 
    /** The value of the MatRadioButton. */
    value: any);
}
/**
 * A group of radio buttons. May contain one or more `<mat-radio-button>` elements.
 */
export declare class MatRadioGroup implements AfterContentInit, ControlValueAccessor {
    private _changeDetector;
    /** Selected value for the radio group. */
    private _value;
    /** The HTML name attribute applied to radio buttons in this group. */
    private _name;
    /** The currently selected radio button. Should match value. */
    private _selected;
    /** Whether the `value` has been set to its initial value. */
    private _isInitialized;
    /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
    private _labelPosition;
    /** Whether the radio group is disabled. */
    private _disabled;
    /** Whether the radio group is required. */
    private _required;
    /** The method to be called in order to update ngModel */
    _controlValueAccessorChangeFn: (value: any) => void;
    /**
     * onTouch function registered via registerOnTouch (ControlValueAccessor).
     * @docs-private
     */
    onTouched: () => any;
    /**
     * Event emitted when the group value changes.
     * Change events are only emitted when the value changes due to user interaction with
     * a radio button (the same behavior as `<input type-"radio">`).
     */
    readonly change: EventEmitter<MatRadioChange>;
    /** Child radio buttons. */
    _radios: QueryList<MatRadioButton>;
    /** Name of the radio button group. All radio buttons inside this group will use this name. */
    name: string;
    /** Whether the labels should appear after or before the radio-buttons. Defaults to 'after' */
    labelPosition: 'before' | 'after';
    /**
     * Value for the radio-group. Should equal the value of the selected radio button if there is
     * a corresponding radio button with a matching value. If there is not such a corresponding
     * radio button, this value persists to be applied in case a new radio button is added with a
     * matching value.
     */
    value: any;
    _checkSelectedRadioButton(): void;
    /**
     * The currently selected radio button. If set to a new radio button, the radio group value
     * will be updated to match the new selected button.
     */
    selected: MatRadioButton | null;
    /** Whether the radio group is disabled */
    disabled: boolean;
    /** Whether the radio group is required */
    required: boolean;
    constructor(_changeDetector: ChangeDetectorRef);
    /**
     * Initialize properties once content children are available.
     * This allows us to propagate relevant attributes to associated buttons.
     */
    ngAfterContentInit(): void;
    /**
     * Mark this group as being "touched" (for ngModel). Meant to be called by the contained
     * radio buttons upon their blur.
     */
    _touch(): void;
    private _updateRadioButtonNames;
    /** Updates the `selected` radio button from the internal _value state. */
    private _updateSelectedRadioFromValue;
    /** Dispatch change event with current selection and group value. */
    _emitChangeEvent(): void;
    _markRadiosForCheck(): void;
    /**
     * Sets the model value. Implemented as part of ControlValueAccessor.
     * @param value
     */
    writeValue(value: any): void;
    /**
     * Registers a callback to be triggered when the model value changes.
     * Implemented as part of ControlValueAccessor.
     * @param fn Callback to be registered.
     */
    registerOnChange(fn: (value: any) => void): void;
    /**
     * Registers a callback to be triggered when the control is touched.
     * Implemented as part of ControlValueAccessor.
     * @param fn Callback to be registered.
     */
    registerOnTouched(fn: any): void;
    /**
     * Sets the disabled state of the control. Implemented as a part of ControlValueAccessor.
     * @param isDisabled Whether the control should be disabled.
     */
    setDisabledState(isDisabled: boolean): void;
}
/** @docs-private */
export declare class MatRadioButtonBase {
    _elementRef: ElementRef;
    disabled: boolean;
    constructor(_elementRef: ElementRef);
}
export declare const _MatRadioButtonMixinBase: CanColorCtor & CanDisableRippleCtor & HasTabIndexCtor & typeof MatRadioButtonBase;
/**
 * A Material design radio-button. Typically placed inside of `<mat-radio-group>` elements.
 */
export declare class MatRadioButton extends _MatRadioButtonMixinBase implements OnInit, AfterViewInit, OnDestroy, CanColor, CanDisableRipple, HasTabIndex {
    private _changeDetector;
    private _focusMonitor;
    private _radioDispatcher;
    _animationMode?: string | undefined;
    private _uniqueId;
    /** The unique ID for the radio button. */
    id: string;
    /** Analog to HTML 'name' attribute used to group radios for unique selection. */
    name: string;
    /** Used to set the 'aria-label' attribute on the underlying input element. */
    ariaLabel: string;
    /** The 'aria-labelledby' attribute takes precedence as the element's text alternative. */
    ariaLabelledby: string;
    /** The 'aria-describedby' attribute is read after the element's label and field type. */
    ariaDescribedby: string;
    /** Whether this radio button is checked. */
    checked: boolean;
    /** The value of this radio button. */
    value: any;
    /** Whether the label should appear after or before the radio button. Defaults to 'after' */
    labelPosition: 'before' | 'after';
    private _labelPosition;
    /** Whether the radio button is disabled. */
    disabled: boolean;
    /** Whether the radio button is required. */
    required: boolean;
    /**
     * Event emitted when the checked state of this radio button changes.
     * Change events are only emitted when the value changes due to user interaction with
     * the radio button (the same behavior as `<input type-"radio">`).
     */
    readonly change: EventEmitter<MatRadioChange>;
    /** The parent radio group. May or may not be present. */
    radioGroup: MatRadioGroup;
    /** ID of the native input element inside `<mat-radio-button>` */
    readonly inputId: string;
    /** Whether this radio is checked. */
    private _checked;
    /** Whether this radio is disabled. */
    private _disabled;
    /** Whether this radio is required. */
    private _required;
    /** Value assigned to this radio. */
    private _value;
    /** Unregister function for _radioDispatcher */
    private _removeUniqueSelectionListener;
    /** The native `<input type=radio>` element */
    _inputElement: ElementRef<HTMLInputElement>;
    constructor(radioGroup: MatRadioGroup, elementRef: ElementRef, _changeDetector: ChangeDetectorRef, _focusMonitor: FocusMonitor, _radioDispatcher: UniqueSelectionDispatcher, _animationMode?: string | undefined);
    /** Focuses the radio button. */
    focus(): void;
    /**
     * Marks the radio button as needing checking for change detection.
     * This method is exposed because the parent radio group will directly
     * update bound properties of the radio button.
     */
    _markForCheck(): void;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /** Dispatch change event with current value. */
    private _emitChangeEvent;
    _isRippleDisabled(): boolean;
    _onInputClick(event: Event): void;
    /**
     * Triggered when the radio button received a click or the input recognized any change.
     * Clicking on a label element, will trigger a change event on the associated input.
     */
    _onInputChange(event: Event): void;
}
