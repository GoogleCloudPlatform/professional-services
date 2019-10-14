/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusableOption } from '@angular/cdk/a11y';
import { Platform } from '@angular/cdk/platform';
import { ElementRef, EventEmitter, NgZone, OnDestroy } from '@angular/core';
import { CanColor, CanColorCtor, CanDisable, CanDisableCtor, CanDisableRipple, CanDisableRippleCtor, RippleConfig, RippleGlobalOptions, RippleTarget } from '@angular/material/core';
import { Subject } from 'rxjs';
/** Represents an event fired on an individual `mat-chip`. */
export interface MatChipEvent {
    /** The chip the event was fired on. */
    chip: MatChip;
}
/** Event object emitted by MatChip when selected or deselected. */
export declare class MatChipSelectionChange {
    /** Reference to the chip that emitted the event. */
    source: MatChip;
    /** Whether the chip that emitted the event is selected. */
    selected: boolean;
    /** Whether the selection change was a result of a user interaction. */
    isUserInput: boolean;
    constructor(
    /** Reference to the chip that emitted the event. */
    source: MatChip, 
    /** Whether the chip that emitted the event is selected. */
    selected: boolean, 
    /** Whether the selection change was a result of a user interaction. */
    isUserInput?: boolean);
}
/** @docs-private */
export declare class MatChipBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatChipMixinBase: CanColorCtor & CanDisableRippleCtor & CanDisableCtor & typeof MatChipBase;
/**
 * Dummy directive to add CSS class to chip avatar.
 * @docs-private
 */
export declare class MatChipAvatar {
}
/**
 * Dummy directive to add CSS class to chip trailing icon.
 * @docs-private
 */
export declare class MatChipTrailingIcon {
}
/**
 * Material design styled Chip component. Used inside the MatChipList component.
 */
export declare class MatChip extends _MatChipMixinBase implements FocusableOption, OnDestroy, CanColor, CanDisable, CanDisableRipple, RippleTarget {
    _elementRef: ElementRef;
    private _ngZone;
    /** Reference to the RippleRenderer for the chip. */
    private _chipRipple;
    /**
     * Ripple configuration for ripples that are launched on pointer down. The ripple config
     * is set to the global ripple options since we don't have any configurable options for
     * the chip ripples.
     * @docs-private
     */
    rippleConfig: RippleConfig & RippleGlobalOptions;
    /**
     * Whether ripples are disabled on interaction
     * @docs-private
     */
    readonly rippleDisabled: boolean;
    /** Whether the chip has focus. */
    _hasFocus: boolean;
    /** Whether the chip list is selectable */
    chipListSelectable: boolean;
    /** Whether the chip list is in multi-selection mode. */
    _chipListMultiple: boolean;
    /** The chip avatar */
    avatar: MatChipAvatar;
    /** The chip's trailing icon. */
    trailingIcon: MatChipTrailingIcon;
    /** The chip's remove toggler. */
    removeIcon: MatChipRemove;
    /** Whether the chip is selected. */
    selected: boolean;
    protected _selected: boolean;
    /** The value of the chip. Defaults to the content inside `<mat-chip>` tags. */
    value: any;
    protected _value: any;
    /**
     * Whether or not the chip is selectable. When a chip is not selectable,
     * changes to its selected state are always ignored. By default a chip is
     * selectable, and it becomes non-selectable if its parent chip list is
     * not selectable.
     */
    selectable: boolean;
    protected _selectable: boolean;
    /**
     * Determines whether or not the chip displays the remove styling and emits (removed) events.
     */
    removable: boolean;
    protected _removable: boolean;
    /** Emits when the chip is focused. */
    readonly _onFocus: Subject<MatChipEvent>;
    /** Emits when the chip is blured. */
    readonly _onBlur: Subject<MatChipEvent>;
    /** Emitted when the chip is selected or deselected. */
    readonly selectionChange: EventEmitter<MatChipSelectionChange>;
    /** Emitted when the chip is destroyed. */
    readonly destroyed: EventEmitter<MatChipEvent>;
    /** Emitted when a chip is to be removed. */
    readonly removed: EventEmitter<MatChipEvent>;
    /** The ARIA selected applied to the chip. */
    readonly ariaSelected: string | null;
    constructor(_elementRef: ElementRef, _ngZone: NgZone, platform: Platform, globalRippleOptions: RippleGlobalOptions | null);
    _addHostClassName(): void;
    ngOnDestroy(): void;
    /** Selects the chip. */
    select(): void;
    /** Deselects the chip. */
    deselect(): void;
    /** Select this chip and emit selected event */
    selectViaInteraction(): void;
    /** Toggles the current selected state of this chip. */
    toggleSelected(isUserInput?: boolean): boolean;
    /** Allows for programmatic focusing of the chip. */
    focus(): void;
    /**
     * Allows for programmatic removal of the chip. Called by the MatChipList when the DELETE or
     * BACKSPACE keys are pressed.
     *
     * Informs any listeners of the removal request. Does not remove the chip from the DOM.
     */
    remove(): void;
    /** Handles click events on the chip. */
    _handleClick(event: Event): void;
    /** Handle custom key presses. */
    _handleKeydown(event: KeyboardEvent): void;
    _blur(): void;
    private _dispatchSelectionChange;
}
/**
 * Applies proper (click) support and adds styling for use with the Material Design "cancel" icon
 * available at https://material.io/icons/#ic_cancel.
 *
 * Example:
 *
 *     `<mat-chip>
 *       <mat-icon matChipRemove>cancel</mat-icon>
 *     </mat-chip>`
 *
 * You *may* use a custom icon, but you may need to override the `mat-chip-remove` positioning
 * styles to properly center the icon within the chip.
 */
export declare class MatChipRemove {
    protected _parentChip: MatChip;
    constructor(_parentChip: MatChip);
    /** Calls the parent chip's public `remove()` method if applicable. */
    _handleClick(event: Event): void;
}
