/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { AfterContentChecked, AfterContentInit, AfterViewInit, ChangeDetectorRef, ElementRef, InjectionToken, NgZone, QueryList, OnDestroy } from '@angular/core';
import { CanColor, CanColorCtor, FloatLabelType, LabelOptions } from '@angular/material/core';
import { MatError } from './error';
import { MatFormFieldControl } from './form-field-control';
import { MatHint } from './hint';
import { MatLabel } from './label';
import { MatPlaceholder } from './placeholder';
import { MatPrefix } from './prefix';
import { MatSuffix } from './suffix';
import { Platform } from '@angular/cdk/platform';
import { NgControl } from '@angular/forms';
/**
 * Boilerplate for applying mixins to MatFormField.
 * @docs-private
 */
export declare class MatFormFieldBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
/**
 * Base class to which we're applying the form field mixins.
 * @docs-private
 */
export declare const _MatFormFieldMixinBase: CanColorCtor & typeof MatFormFieldBase;
/** Possible appearance styles for the form field. */
export declare type MatFormFieldAppearance = 'legacy' | 'standard' | 'fill' | 'outline';
/**
 * Represents the default options for the form field that can be configured
 * using the `MAT_FORM_FIELD_DEFAULT_OPTIONS` injection token.
 */
export interface MatFormFieldDefaultOptions {
    appearance?: MatFormFieldAppearance;
}
/**
 * Injection token that can be used to configure the
 * default options for all form field within an app.
 */
export declare const MAT_FORM_FIELD_DEFAULT_OPTIONS: InjectionToken<MatFormFieldDefaultOptions>;
/** Container for form controls that applies Material Design styling and behavior. */
export declare class MatFormField extends _MatFormFieldMixinBase implements AfterContentInit, AfterContentChecked, AfterViewInit, OnDestroy, CanColor {
    _elementRef: ElementRef;
    private _changeDetectorRef;
    private _dir;
    private _defaults;
    private _platform?;
    private _ngZone?;
    private _labelOptions;
    /**
     * Whether the outline gap needs to be calculated
     * immediately on the next change detection run.
     */
    private _outlineGapCalculationNeededImmediately;
    /** Whether the outline gap needs to be calculated next time the zone has stabilized. */
    private _outlineGapCalculationNeededOnStable;
    private _destroyed;
    /** The form-field appearance style. */
    appearance: MatFormFieldAppearance;
    _appearance: MatFormFieldAppearance;
    /** Whether the required marker should be hidden. */
    hideRequiredMarker: boolean;
    private _hideRequiredMarker;
    /** Override for the logic that disables the label animation in certain cases. */
    private _showAlwaysAnimate;
    /** Whether the floating label should always float or not. */
    readonly _shouldAlwaysFloat: boolean;
    /** Whether the label can float or not. */
    readonly _canLabelFloat: boolean;
    /** State of the mat-hint and mat-error animations. */
    _subscriptAnimationState: string;
    /** Text for the form field hint. */
    hintLabel: string;
    private _hintLabel;
    _hintLabelId: string;
    _labelId: string;
    /**
     * Whether the label should always float, never float or float as the user types.
     *
     * Note: only the legacy appearance supports the `never` option. `never` was originally added as a
     * way to make the floating label emulate the behavior of a standard input placeholder. However
     * the form field now supports both floating labels and placeholders. Therefore in the non-legacy
     * appearances the `never` option has been disabled in favor of just using the placeholder.
     */
    floatLabel: FloatLabelType;
    private _floatLabel;
    /** Whether the Angular animations are enabled. */
    _animationsEnabled: boolean;
    /**
     * @deprecated
     * @breaking-change 8.0.0
     */
    underlineRef: ElementRef;
    _connectionContainerRef: ElementRef;
    _inputContainerRef: ElementRef;
    private _label;
    _control: MatFormFieldControl<any>;
    _placeholderChild: MatPlaceholder;
    _labelChild: MatLabel;
    _errorChildren: QueryList<MatError>;
    _hintChildren: QueryList<MatHint>;
    _prefixChildren: QueryList<MatPrefix>;
    _suffixChildren: QueryList<MatSuffix>;
    constructor(_elementRef: ElementRef, _changeDetectorRef: ChangeDetectorRef, labelOptions: LabelOptions, _dir: Directionality, _defaults: MatFormFieldDefaultOptions, _platform?: Platform | undefined, _ngZone?: NgZone | undefined, _animationMode?: string);
    /**
     * Gets an ElementRef for the element that a overlay attached to the form-field should be
     * positioned relative to.
     */
    getConnectedOverlayOrigin(): ElementRef;
    ngAfterContentInit(): void;
    ngAfterContentChecked(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /** Determines whether a class from the NgControl should be forwarded to the host element. */
    _shouldForward(prop: keyof NgControl): boolean;
    _hasPlaceholder(): boolean;
    _hasLabel(): boolean;
    _shouldLabelFloat(): boolean;
    _hideControlPlaceholder(): boolean;
    _hasFloatingLabel(): boolean;
    /** Determines whether to display hints or errors. */
    _getDisplayedMessages(): 'error' | 'hint';
    /** Animates the placeholder up and locks it in position. */
    _animateAndLockLabel(): void;
    /**
     * Ensure that there is only one placeholder (either `placeholder` attribute on the child control
     * or child element with the `mat-placeholder` directive).
     */
    private _validatePlaceholders;
    /** Does any extra processing that is required when handling the hints. */
    private _processHints;
    /**
     * Ensure that there is a maximum of one of each `<mat-hint>` alignment specified, with the
     * attribute being considered as `align="start"`.
     */
    private _validateHints;
    /**
     * Sets the list of element IDs that describe the child control. This allows the control to update
     * its `aria-describedby` attribute accordingly.
     */
    private _syncDescribedByIds;
    /** Throws an error if the form field's control is missing. */
    protected _validateControlChild(): void;
    /**
     * Updates the width and position of the gap in the outline. Only relevant for the outline
     * appearance.
     */
    updateOutlineGap(): void;
    /** Gets the start end of the rect considering the current directionality. */
    private _getStartEnd;
    /**
     * Updates the outline gap the new time the zone stabilizes.
     * @breaking-change 7.0.0 Remove this method and only set the property once `_ngZone` is required.
     */
    private _updateOutlineGapOnStable;
}
