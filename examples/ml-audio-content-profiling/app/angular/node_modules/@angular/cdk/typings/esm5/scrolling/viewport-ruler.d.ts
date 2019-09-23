/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { NgZone, OnDestroy, Optional } from '@angular/core';
import { Observable } from 'rxjs';
/** Time in ms to throttle the resize events by default. */
export declare const DEFAULT_RESIZE_TIME = 20;
/** Object that holds the scroll position of the viewport in each direction. */
export interface ViewportScrollPosition {
    top: number;
    left: number;
}
/**
 * Simple utility for getting the bounds of the browser viewport.
 * @docs-private
 */
export declare class ViewportRuler implements OnDestroy {
    private _platform;
    /** Cached viewport dimensions. */
    private _viewportSize;
    /** Stream of viewport change events. */
    private _change;
    /** Subscription to streams that invalidate the cached viewport dimensions. */
    private _invalidateCache;
    constructor(_platform: Platform, ngZone: NgZone);
    ngOnDestroy(): void;
    /** Returns the viewport's width and height. */
    getViewportSize(): Readonly<{
        width: number;
        height: number;
    }>;
    /** Gets a ClientRect for the viewport's bounds. */
    getViewportRect(): ClientRect;
    /** Gets the (top, left) scroll position of the viewport. */
    getViewportScrollPosition(): ViewportScrollPosition;
    /**
     * Returns a stream that emits whenever the size of the viewport changes.
     * @param throttleTime Time in milliseconds to throttle the stream.
     */
    change(throttleTime?: number): Observable<Event>;
    /** Updates the cached viewport size. */
    private _updateViewportSize;
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export declare function VIEWPORT_RULER_PROVIDER_FACTORY(parentRuler: ViewportRuler, platform: Platform, ngZone: NgZone): ViewportRuler;
/** @docs-private @deprecated @breaking-change 8.0.0 */
export declare const VIEWPORT_RULER_PROVIDER: {
    provide: typeof ViewportRuler;
    deps: (Optional[] | typeof NgZone | typeof Platform)[];
    useFactory: typeof VIEWPORT_RULER_PROVIDER_FACTORY;
};
