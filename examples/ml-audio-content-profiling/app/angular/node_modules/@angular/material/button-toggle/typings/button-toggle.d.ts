/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import { AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, OnDestroy, OnInit, QueryList, InjectionToken } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { CanDisableRipple, CanDisableRippleCtor } from '@angular/material/core';
/** Acceptable types for a button toggle. */
export declare type ToggleType = 'checkbox' | 'radio';
/** Possible appearance styles for the button toggle. */
export declare type MatButtonToggleAppearance = 'legacy' | 'standard';
/**
 * Represents the default options for the button toggle that can be configured
 * using the `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` injection token.
 */
export interface MatButtonToggleDefaultOptions {
    appearance?: MatButtonToggleAppearance;
}
/**
 * Injection token that can be used to configure the
 * default options for all button toggles within an app.
 */
export declare const MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS: InjectionToken<MatButtonToggleDefaultOptions>;
/**
 * Provider Expression that allows mat-button-toggle-group to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 * @docs-private
 */
export declare const MAT_BUTTON_TOGGLE_GROUP_VALUE_ACCESSOR: any;
/**
 * @deprecated Use `MatButtonToggleGroup` instead.
 * @breaking-change 8.0.0
 */
export declare class MatButtonToggleGroupMultiple {
}
/** Change event object emitted by MatButtonToggle. */
export declare class MatButtonToggleChange {
    /** The MatButtonToggle that emits the event. */
    source: MatButtonToggle;
    /** The value assigned to the MatButtonToggle. */
    value: any;
    constructor(
    /** The MatButtonToggle that emits the event. */
    source: MatButtonToggle, 
    /** The value assigned to the MatButtonToggle. */
    value: any);
}
/** Exclusive selection button toggle group that behaves like a radio-button group. */
export declare class MatButtonToggleGroup implements ControlValueAccessor, OnInit, AfterContentInit {
    private _changeDetector;
    private _vertical;
    private _multiple;
    private _disabled;
    private _selectionModel;
    /**
     * Reference to the raw value that the consumer tried to assign. The real
     * value will exclude any values from this one that don't correspond to a
     * toggle. Useful for the cases where the value is assigned before the toggles
     * have been initialized or at the same that they're being swapped out.
     */
    private _rawValue;
    /**
     * The method to be called in order to update ngModel.
     * Now `ngModel` binding is not supported in multiple selection mode.
     */
    _controlValueAccessorChangeFn: (value: any) => void;
    /** onTouch function registered via registerOnTouch (ControlValueAccessor). */
    _onTouched: () => any;
    /** Child button toggle buttons. */
    _buttonToggles: QueryList<MatButtonToggle>;
    /** The appearance for all the buttons in the group. */
    appearance: MatButtonToggleAppearance;
    /** `name` attribute for the underlying `input` element. */
    name: string;
    private _name;
    /** Whether the toggle group is vertical. */
    vertical: boolean;
    /** Value of the toggle group. */
    value: any;
    /**
     * Event that emits whenever the value of the group changes.
     * Used to facilitate two-way data binding.
     * @docs-private
     */
    readonly valueChange: EventEmitter<any>;
    /** Selected button toggles in the group. */
    readonly selected: MatButtonToggle | MatButtonToggle[];
    /** Whether multiple button toggles can be selected. */
    multiple: boolean;
    /** Whether multiple button toggle group is disabled. */
    disabled: boolean;
    /** Event emitted when the group's value changes. */
    readonly change: EventEmitter<MatButtonToggleChange>;
    constructor(_changeDetector: ChangeDetectorRef, defaultOptions?: MatButtonToggleDefaultOptions);
    ngOnInit(): void;
    ngAfterContentInit(): void;
    /**
     * Sets the model value. Implemented as part of ControlValueAccessor.
     * @param value Value to be set to the model.
     */
    writeValue(value: any): void;
    registerOnChange(fn: (value: any) => void): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    /** Dispatch change event with current selection and group value. */
    _emitChangeEvent(): void;
    /**
     * Syncs a button toggle's selected state with the model value.
     * @param toggle Toggle to be synced.
     * @param select Whether the toggle should be selected.
     * @param isUserInput Whether the change was a result of a user interaction.
     */
    _syncButtonToggle(toggle: MatButtonToggle, select: boolean, isUserInput?: boolean): void;
    /** Checks whether a button toggle is selected. */
    _isSelected(toggle: MatButtonToggle): boolean;
    /** Determines whether a button toggle should be checked on init. */
    _isPrechecked(toggle: MatButtonToggle): boolean;
    /** Updates the selection state of the toggles in the group based on a value. */
    private _setSelectionByValue;
    /** Clears the selected toggles. */
    private _clearSelection;
    /** Selects a value if there's a toggle that corresponds to it. */
    private _selectValue;
}
/** @docs-private */
export declare class MatButtonToggleBase {
}
export declare const _MatButtonToggleMixinBase: CanDisableRippleCtor & typeof MatButtonToggleBase;
/** Single button inside of a toggle group. */
export declare class MatButtonToggle extends _MatButtonToggleMixinBase implements OnInit, CanDisableRipple, OnDestroy {
    private _changeDetectorRef;
    private _elementRef;
    private _focusMonitor;
    private _isSingleSelector;
    private _checked;
    /**
     * Attached to the aria-label attribute of the host element. In most cases, arial-labelledby will
     * take precedence so this may be omitted.
     */
    ariaLabel: string;
    /**
     * Users can specify the `aria-labelledby` attribute which will be forwarded to the input element
     */
    ariaLabelledby: string | null;
    /** Type of the button toggle. Either 'radio' or 'checkbox'. */
    _type: ToggleType;
    _buttonElement: ElementRef<HTMLButtonElement>;
    /** The parent button toggle group (exclusive selection). Optional. */
    buttonToggleGroup: MatButtonToggleGroup;
    /** Unique ID for the underlying `button` element. */
    readonly buttonId: string;
    /** The unique ID for this button toggle. */
    id: string;
    /** HTML's 'name' attribute used to group radios for unique selection. */
    name: string;
    /** MatButtonToggleGroup reads this to assign its own value. */
    value: any;
    /** Tabindex for the toggle. */
    tabIndex: number | null;
    /** The appearance style of the button. */
    appearance: MatButtonToggleAppearance;
    private _appearance;
    /** Whether the button is checked. */
    checked: boolean;
    /** Whether the button is disabled. */
    disabled: boolean;
    private _disabled;
    /** Event emitted when the group value changes. */
    readonly change: EventEmitter<MatButtonToggleChange>;
    constructor(toggleGroup: MatButtonToggleGroup, _changeDetectorRef: ChangeDetectorRef, _elementRef: ElementRef<HTMLElement>, _focusMonitor: FocusMonitor, defaultTabIndex: string, defaultOptions?: MatButtonToggleDefaultOptions);
    ngOnInit(): void;
    ngOnDestroy(): void;
    /** Focuses the button. */
    focus(): void;
    /** Checks the button toggle due to an interaction with the underlying native button. */
    _onButtonClick(): void;
    /**
     * Marks the button toggle as needing checking for change detection.
     * This method is exposed because the parent button toggle group will directly
     * update bound properties of the radio button.
     */
    _markForCheck(): void;
}
