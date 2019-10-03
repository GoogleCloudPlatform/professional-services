/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, OnChanges } from '@angular/core';
import { MatChipsDefaultOptions } from './chip-default-options';
import { MatChipList } from './chip-list';
import { MatChipTextControl } from './chip-text-control';
/** Represents an input event on a `matChipInput`. */
export interface MatChipInputEvent {
    /** The native `<input>` element that the event is being fired for. */
    input: HTMLInputElement;
    /** The value of the input. */
    value: string;
}
/**
 * Directive that adds chip-specific behaviors to an input element inside `<mat-form-field>`.
 * May be placed inside or outside of an `<mat-chip-list>`.
 */
export declare class MatChipInput implements MatChipTextControl, OnChanges {
    protected _elementRef: ElementRef<HTMLInputElement>;
    private _defaultOptions;
    /** Whether the control is focused. */
    focused: boolean;
    _chipList: MatChipList;
    /** Register input for chip list */
    chipList: MatChipList;
    /**
     * Whether or not the chipEnd event will be emitted when the input is blurred.
     */
    addOnBlur: boolean;
    _addOnBlur: boolean;
    /**
     * The list of key codes that will trigger a chipEnd event.
     *
     * Defaults to `[ENTER]`.
     */
    separatorKeyCodes: number[] | Set<number>;
    /** Emitted when a chip is to be added. */
    chipEnd: EventEmitter<MatChipInputEvent>;
    /** The input's placeholder text. */
    placeholder: string;
    /** Unique id for the input. */
    id: string;
    /** Whether the input is disabled. */
    disabled: boolean;
    private _disabled;
    /** Whether the input is empty. */
    readonly empty: boolean;
    /** The native input element to which this directive is attached. */
    protected _inputElement: HTMLInputElement;
    constructor(_elementRef: ElementRef<HTMLInputElement>, _defaultOptions: MatChipsDefaultOptions);
    ngOnChanges(): void;
    /** Utility method to make host definition/tests more clear. */
    _keydown(event?: KeyboardEvent): void;
    /** Checks to see if the blur should emit the (chipEnd) event. */
    _blur(): void;
    _focus(): void;
    /** Checks to see if the (chipEnd) event needs to be emitted. */
    _emitChipEnd(event?: KeyboardEvent): void;
    _onInput(): void;
    /** Focuses the input. */
    focus(): void;
    /** Checks whether a keycode is one of the configured separators. */
    private _isSeparatorKey;
}
