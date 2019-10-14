/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RippleConfig, RippleRenderer } from './ripple-renderer';
/** Possible states for a ripple element. */
export declare enum RippleState {
    FADING_IN = 0,
    VISIBLE = 1,
    FADING_OUT = 2,
    HIDDEN = 3
}
/**
 * Reference to a previously launched ripple element.
 */
export declare class RippleRef {
    private _renderer;
    /** Reference to the ripple HTML element. */
    element: HTMLElement;
    /** Ripple configuration used for the ripple. */
    config: RippleConfig;
    /** Current state of the ripple. */
    state: RippleState;
    constructor(_renderer: RippleRenderer, 
    /** Reference to the ripple HTML element. */
    element: HTMLElement, 
    /** Ripple configuration used for the ripple. */
    config: RippleConfig);
    /** Fades out the ripple element. */
    fadeOut(): void;
}
