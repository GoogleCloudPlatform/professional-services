/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { DoCheck, ElementRef, NgZone, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { CanUpdateErrorState, CanUpdateErrorStateCtor, ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
/** @docs-private */
export declare class MatInputBase {
    _defaultErrorStateMatcher: ErrorStateMatcher;
    _parentForm: NgForm;
    _parentFormGroup: FormGroupDirective;
    /** @docs-private */
    ngControl: NgControl;
    constructor(_defaultErrorStateMatcher: ErrorStateMatcher, _parentForm: NgForm, _parentFormGroup: FormGroupDirective, 
    /** @docs-private */
    ngControl: NgControl);
}
export declare const _MatInputMixinBase: CanUpdateErrorStateCtor & typeof MatInputBase;
/** Directive that allows a native input to work inside a `MatFormField`. */
export declare class MatInput extends _MatInputMixinBase implements MatFormFieldControl<any>, OnChanges, OnDestroy, OnInit, DoCheck, CanUpdateErrorState {
    protected _elementRef: ElementRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
    protected _platform: Platform;
    /** @docs-private */
    ngControl: NgControl;
    private _autofillMonitor;
    protected _uid: string;
    protected _previousNativeValue: any;
    private _inputValueAccessor;
    /** The aria-describedby attribute on the input for improved a11y. */
    _ariaDescribedby: string;
    /** Whether the component is being rendered on the server. */
    _isServer: boolean;
    /** Whether the component is a native html select. */
    _isNativeSelect: boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    focused: boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    readonly stateChanges: Subject<void>;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    controlType: string;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    autofilled: boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    disabled: boolean;
    protected _disabled: boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    id: string;
    protected _id: string;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    placeholder: string;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    required: boolean;
    protected _required: boolean;
    /** Input type of the element. */
    type: string;
    protected _type: string;
    /** An object used to control when error messages are shown. */
    errorStateMatcher: ErrorStateMatcher;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    value: string;
    /** Whether the element is readonly. */
    readonly: boolean;
    private _readonly;
    protected _neverEmptyInputTypes: string[];
    constructor(_elementRef: ElementRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, _platform: Platform, 
    /** @docs-private */
    ngControl: NgControl, _parentForm: NgForm, _parentFormGroup: FormGroupDirective, _defaultErrorStateMatcher: ErrorStateMatcher, inputValueAccessor: any, _autofillMonitor: AutofillMonitor, ngZone: NgZone);
    ngOnInit(): void;
    ngOnChanges(): void;
    ngOnDestroy(): void;
    ngDoCheck(): void;
    /** Focuses the input. */
    focus(): void;
    /** Callback for the cases where the focused state of the input changes. */
    _focusChanged(isFocused: boolean): void;
    _onInput(): void;
    /** Does some manual dirty checking on the native input `value` property. */
    protected _dirtyCheckNativeValue(): void;
    /** Make sure the input is a supported type. */
    protected _validateType(): void;
    /** Checks whether the input type is one of the types that are never empty. */
    protected _isNeverEmpty(): boolean;
    /** Checks whether the input is invalid based on the native validation. */
    protected _isBadInput(): boolean;
    /** Determines if the component host is a textarea. */
    protected _isTextarea(): boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    readonly empty: boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    readonly shouldLabelFloat: boolean;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    setDescribedByIds(ids: string[]): void;
    /**
     * Implemented as part of MatFormFieldControl.
     * @docs-private
     */
    onContainerClick(): void;
}
