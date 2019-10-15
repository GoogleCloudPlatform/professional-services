/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, InjectionToken, NgZone } from '@angular/core';
/**
 * Interface for a a MatInkBar positioner method, defining the positioning and width of the ink
 * bar in a set of tabs.
 */
export interface _MatInkBarPositioner {
    (element: HTMLElement): {
        left: string;
        width: string;
    };
}
/** Injection token for the MatInkBar's Positioner. */
export declare const _MAT_INK_BAR_POSITIONER: InjectionToken<_MatInkBarPositioner>;
/**
 * The default positioner function for the MatInkBar.
 * @docs-private
 */
export declare function _MAT_INK_BAR_POSITIONER_FACTORY(): _MatInkBarPositioner;
/**
 * The ink-bar is used to display and animate the line underneath the current active tab label.
 * @docs-private
 */
export declare class MatInkBar {
    private _elementRef;
    private _ngZone;
    private _inkBarPositioner;
    constructor(_elementRef: ElementRef<HTMLElement>, _ngZone: NgZone, _inkBarPositioner: _MatInkBarPositioner);
    /**
     * Calculates the styles from the provided element in order to align the ink-bar to that element.
     * Shows the ink bar if previously set as hidden.
     * @param element
     */
    alignToElement(element: HTMLElement): void;
    /** Shows the ink bar. */
    show(): void;
    /** Hides the ink bar. */
    hide(): void;
    /**
     * Sets the proper styles to the ink bar element.
     * @param element
     */
    private _setStyles;
}
