/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Manages the scroll position.
 *
 * @publicApi
 */
export declare abstract class ViewportScroller {
    /** @nocollapse */
    static ngInjectableDef: never;
    /**
     * Configures the top offset used when scrolling to an anchor.
     *
     * When given a tuple with two number, the service will always use the numbers.
     * When given a function, the service will invoke the function every time it restores scroll
     * position.
     */
    abstract setOffset(offset: [number, number] | (() => [number, number])): void;
    /**
     * Returns the current scroll position.
     */
    abstract getScrollPosition(): [number, number];
    /**
     * Sets the scroll position.
     */
    abstract scrollToPosition(position: [number, number]): void;
    /**
     * Scrolls to the provided anchor.
     */
    abstract scrollToAnchor(anchor: string): void;
    /**
     *
     * Disables automatic scroll restoration provided by the browser.
     *
     * See also [window.history.scrollRestoration
     * info](https://developers.google.com/web/updates/2015/09/history-api-scroll-restoration)
     */
    abstract setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void;
}
/**
 * Manages the scroll position.
 */
export declare class BrowserViewportScroller implements ViewportScroller {
    private document;
    private window;
    private offset;
    constructor(document: any, window: any);
    /**
     * Configures the top offset used when scrolling to an anchor.
     *
     * * When given a number, the service will always use the number.
     * * When given a function, the service will invoke the function every time it restores scroll
     * position.
     */
    setOffset(offset: [number, number] | (() => [number, number])): void;
    /**
     * Returns the current scroll position.
     */
    getScrollPosition(): [number, number];
    /**
     * Sets the scroll position.
     */
    scrollToPosition(position: [number, number]): void;
    /**
     * Scrolls to the provided anchor.
     */
    scrollToAnchor(anchor: string): void;
    /**
     * Disables automatic scroll restoration provided by the browser.
     */
    setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void;
    private scrollToElement;
    /**
     * We only support scroll restoration when we can get a hold of window.
     * This means that we do not support this behavior when running in a web worker.
     *
     * Lifting this restriction right now would require more changes in the dom adapter.
     * Since webworkers aren't widely used, we will lift it once RouterScroller is
     * battle-tested.
     */
    private supportScrollRestoration;
}
/**
 * Provides an empty implementation of the viewport scroller. This will
 * live in @angular/common as it will be used by both platform-server and platform-webworker.
 */
export declare class NullViewportScroller implements ViewportScroller {
    /**
     * Empty implementation
     */
    setOffset(offset: [number, number] | (() => [number, number])): void;
    /**
     * Empty implementation
     */
    getScrollPosition(): [number, number];
    /**
     * Empty implementation
     */
    scrollToPosition(position: [number, number]): void;
    /**
     * Empty implementation
     */
    scrollToAnchor(anchor: string): void;
    /**
     * Empty implementation
     */
    setHistoryScrollRestoration(scrollRestoration: 'auto' | 'manual'): void;
}
