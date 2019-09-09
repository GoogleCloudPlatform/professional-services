/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { ElementRef, InjectionToken } from '@angular/core';
import { CanColor, CanColorCtor } from '@angular/material/core';
/** Possible mode for a progress spinner. */
export declare type ProgressSpinnerMode = 'determinate' | 'indeterminate';
/** @docs-private */
export declare class MatProgressSpinnerBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatProgressSpinnerMixinBase: CanColorCtor & typeof MatProgressSpinnerBase;
/** Default `mat-progress-spinner` options that can be overridden. */
export interface MatProgressSpinnerDefaultOptions {
    /** Diameter of the spinner. */
    diameter?: number;
    /** Width of the spinner's stroke. */
    strokeWidth?: number;
    /**
     * Whether the animations should be force to be enabled, ignoring if the current environment is
     * using NoopAnimationsModule.
     */
    _forceAnimations?: boolean;
}
/** Injection token to be used to override the default options for `mat-progress-spinner`. */
export declare const MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS: InjectionToken<MatProgressSpinnerDefaultOptions>;
/** @docs-private */
export declare function MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS_FACTORY(): MatProgressSpinnerDefaultOptions;
/**
 * `<mat-progress-spinner>` component.
 */
export declare class MatProgressSpinner extends _MatProgressSpinnerMixinBase implements CanColor {
    _elementRef: ElementRef;
    private _document;
    private animationMode?;
    private defaults?;
    private _value;
    private _strokeWidth;
    private _fallbackAnimation;
    /** Tracks diameters of existing instances to de-dupe generated styles (default d = 100) */
    private static diameters;
    /**
     * Used for storing all of the generated keyframe animations.
     * @dynamic
     */
    private static styleTag;
    /** Whether the _mat-animation-noopable class should be applied, disabling animations.  */
    _noopAnimations: boolean;
    /** The diameter of the progress spinner (will set width and height of svg). */
    diameter: number;
    private _diameter;
    /** Stroke width of the progress spinner. */
    strokeWidth: number;
    /** Mode of the progress circle */
    mode: ProgressSpinnerMode;
    /** Value of the progress circle. */
    value: number;
    constructor(_elementRef: ElementRef, platform: Platform, _document: any, animationMode?: string | undefined, defaults?: MatProgressSpinnerDefaultOptions | undefined);
    /** The radius of the spinner, adjusted for stroke width. */
    readonly _circleRadius: number;
    /** The view box of the spinner's svg element. */
    readonly _viewBox: string;
    /** The stroke circumference of the svg circle. */
    readonly _strokeCircumference: number;
    /** The dash offset of the svg circle. */
    readonly _strokeDashOffset: number | null;
    /** Stroke width of the circle in percent. */
    readonly _circleStrokeWidth: number;
    /** Dynamically generates a style tag containing the correct animation for this diameter. */
    private _attachStyleNode;
    /** Generates animation styles adjusted for the spinner's diameter. */
    private _getAnimationText;
}
/**
 * `<mat-spinner>` component.
 *
 * This is a component definition to be used as a convenience reference to create an
 * indeterminate `<mat-progress-spinner>` instance.
 */
export declare class MatSpinner extends MatProgressSpinner {
    constructor(elementRef: ElementRef, platform: Platform, document: any, animationMode?: string, defaults?: MatProgressSpinnerDefaultOptions);
}
