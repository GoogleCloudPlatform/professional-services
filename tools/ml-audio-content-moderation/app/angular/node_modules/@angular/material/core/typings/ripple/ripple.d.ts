/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { ElementRef, InjectionToken, NgZone, OnDestroy, OnInit } from '@angular/core';
import { RippleRef } from './ripple-ref';
import { RippleAnimationConfig, RippleConfig, RippleTarget } from './ripple-renderer';
/** Configurable options for `matRipple`. */
export interface RippleGlobalOptions {
    /**
     * Whether ripples should be disabled. Ripples can be still launched manually by using
     * the `launch()` method. Therefore focus indicators will still show up.
     */
    disabled?: boolean;
    /**
     * Configuration for the animation duration of the ripples. There are two phases with different
     * durations for the ripples. The animation durations will be overwritten if the
     * `NoopAnimationsModule` is being used.
     */
    animation?: RippleAnimationConfig;
    /**
     * Whether ripples should start fading out immediately after the mouse our touch is released. By
     * default, ripples will wait for the enter animation to complete and for mouse or touch release.
     */
    terminateOnPointerUp?: boolean;
}
/** Injection token that can be used to specify the global ripple options. */
export declare const MAT_RIPPLE_GLOBAL_OPTIONS: InjectionToken<RippleGlobalOptions>;
export declare class MatRipple implements OnInit, OnDestroy, RippleTarget {
    private _elementRef;
    /** Custom color for all ripples. */
    color: string;
    /** Whether the ripples should be visible outside the component's bounds. */
    unbounded: boolean;
    /**
     * Whether the ripple always originates from the center of the host element's bounds, rather
     * than originating from the location of the click event.
     */
    centered: boolean;
    /**
     * If set, the radius in pixels of foreground ripples when fully expanded. If unset, the radius
     * will be the distance from the center of the ripple to the furthest corner of the host element's
     * bounding rectangle.
     */
    radius: number;
    /**
     * Configuration for the ripple animation. Allows modifying the enter and exit animation
     * duration of the ripples. The animation durations will be overwritten if the
     * `NoopAnimationsModule` is being used.
     */
    animation: RippleAnimationConfig;
    /**
     * Whether click events will not trigger the ripple. Ripples can be still launched manually
     * by using the `launch()` method.
     */
    disabled: boolean;
    private _disabled;
    /**
     * The element that triggers the ripple when click events are received.
     * Defaults to the directive's host element.
     */
    trigger: HTMLElement;
    private _trigger;
    /** Renderer for the ripple DOM manipulations. */
    private _rippleRenderer;
    /** Options that are set globally for all ripples. */
    private _globalOptions;
    /** Whether ripple directive is initialized and the input bindings are set. */
    private _isInitialized;
    constructor(_elementRef: ElementRef<HTMLElement>, ngZone: NgZone, platform: Platform, globalOptions?: RippleGlobalOptions, animationMode?: string);
    ngOnInit(): void;
    ngOnDestroy(): void;
    /** Fades out all currently showing ripple elements. */
    fadeOutAll(): void;
    /**
     * Ripple configuration from the directive's input values.
     * @docs-private Implemented as part of RippleTarget
     */
    readonly rippleConfig: RippleConfig;
    /**
     * Whether ripples on pointer-down are disabled or not.
     * @docs-private Implemented as part of RippleTarget
     */
    readonly rippleDisabled: boolean;
    /** Sets up the trigger event listeners if ripples are enabled. */
    private _setupTriggerEventsIfEnabled;
    /**
     * Launches a manual ripple using the specified ripple configuration.
     * @param config Configuration for the manual ripple.
     */
    launch(config: RippleConfig): RippleRef;
    /**
     * Launches a manual ripple at the specified coordinates within the element.
     * @param x Coordinate within the element, along the X axis at which to fade-in the ripple.
     * @param y Coordinate within the element, along the Y axis at which to fade-in the ripple.
     * @param config Optional ripple configuration for the manual ripple.
     */
    launch(x: number, y: number, config?: RippleConfig): RippleRef;
}
