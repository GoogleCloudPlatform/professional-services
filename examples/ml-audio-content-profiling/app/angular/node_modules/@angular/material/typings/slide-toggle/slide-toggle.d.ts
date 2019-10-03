/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Platform } from '@angular/cdk/platform';
import { AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { CanColor, CanColorCtor, CanDisable, CanDisableCtor, CanDisableRipple, CanDisableRippleCtor, HammerInput, HasTabIndex, HasTabIndexCtor } from '@angular/material/core';
import { MatSlideToggleDefaultOptions } from './slide-toggle-config';
/** @docs-private */
export declare const MAT_SLIDE_TOGGLE_VALUE_ACCESSOR: any;
/** Change event object emitted by a MatSlideToggle. */
export declare class MatSlideToggleChange {
    /** The source MatSlideToggle of the event. */
    source: MatSlideToggle;
    /** The new `checked` value of the MatSlideToggle. */
    checked: boolean;
    constructor(
    /** The source MatSlideToggle of the event. */
    source: MatSlideToggle, 
    /** The new `checked` value of the MatSlideToggle. */
    checked: boolean);
}
/** @docs-private */
export declare class MatSlideToggleBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatSlideToggleMixinBase: HasTabIndexCtor & CanColorCtor & CanDisableRippleCtor & CanDisableCtor & typeof MatSlideToggleBase;
/** Represents a slidable "switch" toggle that can be moved between on and off. */
export declare class MatSlideToggle extends _MatSlideToggleMixinBase implements OnDestroy, AfterContentInit, ControlValueAccessor, CanDisable, CanColor, HasTabIndex, CanDisableRipple {
    private _focusMonitor;
    private _changeDetectorRef;
    private _ngZone;
    defaults: MatSlideToggleDefaultOptions;
    _animationMode?: string | undefined;
    private _dir?;
    private onChange;
    private onTouched;
    private _uniqueId;
    private _required;
    private _checked;
    /** Whether the thumb is currently being dragged. */
    private _dragging;
    /** Previous checked state before drag started. */
    private _previousChecked;
    /** Width of the thumb bar of the slide-toggle. */
    private _thumbBarWidth;
    /** Percentage of the thumb while dragging. Percentage as fraction of 100. */
    private _dragPercentage;
    /** Reference to the thumb HTMLElement. */
    _thumbEl: ElementRef;
    /** Reference to the thumb bar HTMLElement. */
    _thumbBarEl: ElementRef;
    /** Name value will be applied to the input element if present. */
    name: string | null;
    /** A unique id for the slide-toggle input. If none is supplied, it will be auto-generated. */
    id: string;
    /** Whether the label should appear after or before the slide-toggle. Defaults to 'after'. */
    labelPosition: 'before' | 'after';
    /** Used to set the aria-label attribute on the underlying input element. */
    ariaLabel: string | null;
    /** Used to set the aria-labelledby attribute on the underlying input element. */
    ariaLabelledby: string | null;
    /** Whether the slide-toggle is required. */
    required: boolean;
    /** Whether the slide-toggle element is checked or not. */
    checked: boolean;
    /** An event will be dispatched each time the slide-toggle changes its value. */
    readonly change: EventEmitter<MatSlideToggleChange>;
    /**
     * An event will be dispatched each time the slide-toggle input is toggled.
     * This event is always emitted when the user toggles the slide toggle, but this does not mean
     * the slide toggle's value has changed. The event does not fire when the user drags to change
     * the slide toggle value.
     */
    readonly toggleChange: EventEmitter<void>;
    /**
     * An event will be dispatched each time the slide-toggle is dragged.
     * This event is always emitted when the user drags the slide toggle to make a change greater
     * than 50%. It does not mean the slide toggle's value is changed. The event is not emitted when
     * the user toggles the slide toggle to change its value.
     */
    readonly dragChange: EventEmitter<void>;
    /** Returns the unique id for the visual hidden input. */
    readonly inputId: string;
    /** Reference to the underlying input element. */
    _inputElement: ElementRef<HTMLInputElement>;
    constructor(elementRef: ElementRef, 
    /**
     * @deprecated The `_platform` parameter to be removed.
     * @breaking-change 8.0.0
     */
    _platform: Platform, _focusMonitor: FocusMonitor, _changeDetectorRef: ChangeDetectorRef, tabIndex: string, _ngZone: NgZone, defaults: MatSlideToggleDefaultOptions, _animationMode?: string | undefined, _dir?: Directionality | undefined);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Method being called whenever the underlying input emits a change event. */
    _onChangeEvent(event: Event): void;
    /** Method being called whenever the slide-toggle has been clicked. */
    _onInputClick(event: Event): void;
    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: any): void;
    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: any): void;
    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: any): void;
    /** Implemented as a part of ControlValueAccessor. */
    setDisabledState(isDisabled: boolean): void;
    /** Focuses the slide-toggle. */
    focus(): void;
    /** Toggles the checked state of the slide-toggle. */
    toggle(): void;
    /**
     * Emits a change event on the `change` output. Also notifies the FormControl about the change.
     */
    private _emitChangeEvent;
    /** Retrieves the percentage of thumb from the moved distance. Percentage as fraction of 100. */
    private _getDragPercentage;
    _onDragStart(): void;
    _onDrag(event: HammerInput): void;
    _onDragEnd(): void;
    /** Method being called whenever the label text changes. */
    _onLabelTextChange(): void;
}
