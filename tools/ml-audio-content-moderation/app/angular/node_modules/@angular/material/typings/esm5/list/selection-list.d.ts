/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusableOption, FocusKeyManager } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, OnDestroy, OnInit, QueryList, SimpleChanges, OnChanges } from '@angular/core';
import { CanDisableRipple, CanDisableRippleCtor, MatLine } from '@angular/material/core';
import { ControlValueAccessor } from '@angular/forms';
import { MatListAvatarCssMatStyler, MatListIconCssMatStyler } from './list';
/** @docs-private */
export declare class MatSelectionListBase {
}
export declare const _MatSelectionListMixinBase: CanDisableRippleCtor & typeof MatSelectionListBase;
/** @docs-private */
export declare class MatListOptionBase {
}
export declare const _MatListOptionMixinBase: CanDisableRippleCtor & typeof MatListOptionBase;
/** @docs-private */
export declare const MAT_SELECTION_LIST_VALUE_ACCESSOR: any;
/** Change event that is being fired whenever the selected state of an option changes. */
export declare class MatSelectionListChange {
    /** Reference to the selection list that emitted the event. */
    source: MatSelectionList;
    /** Reference to the option that has been changed. */
    option: MatListOption;
    constructor(
    /** Reference to the selection list that emitted the event. */
    source: MatSelectionList, 
    /** Reference to the option that has been changed. */
    option: MatListOption);
}
/**
 * Component for list-options of selection-list. Each list-option can automatically
 * generate a checkbox and can put current item into the selectionModel of selection-list
 * if the current item is selected.
 */
export declare class MatListOption extends _MatListOptionMixinBase implements AfterContentInit, OnDestroy, OnInit, FocusableOption, CanDisableRipple {
    private _element;
    private _changeDetector;
    /** @docs-private */
    selectionList: MatSelectionList;
    private _selected;
    private _disabled;
    private _hasFocus;
    _avatar: MatListAvatarCssMatStyler;
    _icon: MatListIconCssMatStyler;
    _lines: QueryList<MatLine>;
    /** DOM element containing the item's text. */
    _text: ElementRef;
    /** Whether the label should appear before or after the checkbox. Defaults to 'after' */
    checkboxPosition: 'before' | 'after';
    /** Value of the option */
    value: any;
    private _value;
    /** Whether the option is disabled. */
    disabled: any;
    /** Whether the option is selected. */
    selected: boolean;
    constructor(_element: ElementRef<HTMLElement>, _changeDetector: ChangeDetectorRef, 
    /** @docs-private */
    selectionList: MatSelectionList);
    ngOnInit(): void;
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Toggles the selection state of the option. */
    toggle(): void;
    /** Allows for programmatic focusing of the option. */
    focus(): void;
    /**
     * Returns the list item's text label. Implemented as a part of the FocusKeyManager.
     * @docs-private
     */
    getLabel(): any;
    /** Whether this list item should show a ripple effect when clicked. */
    _isRippleDisabled(): any;
    _handleClick(): void;
    _handleFocus(): void;
    _handleBlur(): void;
    /** Retrieves the DOM element of the component host. */
    _getHostElement(): HTMLElement;
    /** Sets the selected state of the option. Returns whether the value has changed. */
    _setSelected(selected: boolean): boolean;
    /**
     * Notifies Angular that the option needs to be checked in the next change detection run. Mainly
     * used to trigger an update of the list option if the disabled state of the selection list
     * changed.
     */
    _markForCheck(): void;
}
/**
 * Material Design list component where each item is a selectable option. Behaves as a listbox.
 */
export declare class MatSelectionList extends _MatSelectionListMixinBase implements FocusableOption, CanDisableRipple, AfterContentInit, ControlValueAccessor, OnDestroy, OnChanges {
    private _element;
    /** The FocusKeyManager which handles focus. */
    _keyManager: FocusKeyManager<MatListOption>;
    /** The option components contained within this selection-list. */
    options: QueryList<MatListOption>;
    /** Emits a change event whenever the selected state of an option changes. */
    readonly selectionChange: EventEmitter<MatSelectionListChange>;
    /** Tabindex of the selection list. */
    tabIndex: number;
    /**
     * Function used for comparing an option against the selected value when determining which
     * options should appear as selected. The first argument is the value of an options. The second
     * one is a value from the selected value. A boolean must be returned.
     */
    compareWith: (o1: any, o2: any) => boolean;
    /** Whether the selection list is disabled. */
    disabled: boolean;
    private _disabled;
    /** The currently selected options. */
    selectedOptions: SelectionModel<MatListOption>;
    /** View to model callback that should be called whenever the selected options change. */
    private _onChange;
    /** Used for storing the values that were assigned before the options were initialized. */
    private _tempValues;
    /** Subscription to sync value changes in the SelectionModel back to the SelectionList. */
    private _modelChanges;
    /** View to model callback that should be called if the list or its options lost focus. */
    _onTouched: () => void;
    constructor(_element: ElementRef<HTMLElement>, tabIndex: string);
    ngAfterContentInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    /** Focuses the selection list. */
    focus(): void;
    /** Selects all of the options. */
    selectAll(): void;
    /** Deselects all of the options. */
    deselectAll(): void;
    /** Sets the focused option of the selection-list. */
    _setFocusedOption(option: MatListOption): void;
    /**
     * Removes an option from the selection list and updates the active item.
     * @returns Currently-active item.
     */
    _removeOptionFromList(option: MatListOption): MatListOption | null;
    /** Passes relevant key presses to our key manager. */
    _keydown(event: KeyboardEvent): void;
    /** Reports a value change to the ControlValueAccessor */
    _reportValueChange(): void;
    /** Emits a change event if the selected state of an option changed. */
    _emitChangeEvent(option: MatListOption): void;
    /** Implemented as part of ControlValueAccessor. */
    writeValue(values: string[]): void;
    /** Implemented as a part of ControlValueAccessor. */
    setDisabledState(isDisabled: boolean): void;
    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: (value: any) => void): void;
    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: () => void): void;
    /** Sets the selected options based on the specified values. */
    private _setOptionsFromValues;
    /** Returns the values of the selected options. */
    private _getSelectedOptionValues;
    /** Toggles the state of the currently focused option if enabled. */
    private _toggleFocusedOption;
    /**
     * Sets the selected state on all of the options
     * and emits an event if anything changed.
     */
    private _setAllOptionsSelected;
    /**
     * Utility to ensure all indexes are valid.
     * @param index The index to be checked.
     * @returns True if the index is valid for our list of options.
     */
    private _isValidIndex;
    /** Returns the index of the specified list option. */
    private _getOptionIndex;
    /** Marks all the options to be checked in the next change detection run. */
    private _markOptionsForCheck;
}
