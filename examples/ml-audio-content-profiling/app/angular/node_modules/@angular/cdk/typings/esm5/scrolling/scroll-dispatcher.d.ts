/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Platform } from '@angular/cdk/platform';
import { ElementRef, NgZone, OnDestroy, Optional } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { CdkScrollable } from './scrollable';
/** Time in ms to throttle the scrolling events by default. */
export declare const DEFAULT_SCROLL_TIME = 20;
/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 */
export declare class ScrollDispatcher implements OnDestroy {
    private _ngZone;
    private _platform;
    constructor(_ngZone: NgZone, _platform: Platform);
    /** Subject for notifying that a registered scrollable reference element has been scrolled. */
    private _scrolled;
    /** Keeps track of the global `scroll` and `resize` subscriptions. */
    _globalSubscription: Subscription | null;
    /** Keeps track of the amount of subscriptions to `scrolled`. Used for cleaning up afterwards. */
    private _scrolledCount;
    /**
     * Map of all the scrollable references that are registered with the service and their
     * scroll event subscriptions.
     */
    scrollContainers: Map<CdkScrollable, Subscription>;
    /**
     * Registers a scrollable instance with the service and listens for its scrolled events. When the
     * scrollable is scrolled, the service emits the event to its scrolled observable.
     * @param scrollable Scrollable instance to be registered.
     */
    register(scrollable: CdkScrollable): void;
    /**
     * Deregisters a Scrollable reference and unsubscribes from its scroll event observable.
     * @param scrollable Scrollable instance to be deregistered.
     */
    deregister(scrollable: CdkScrollable): void;
    /**
     * Returns an observable that emits an event whenever any of the registered Scrollable
     * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
     * to override the default "throttle" time.
     *
     * **Note:** in order to avoid hitting change detection for every scroll event,
     * all of the events emitted from this stream will be run outside the Angular zone.
     * If you need to update any data bindings as a result of a scroll event, you have
     * to run the callback using `NgZone.run`.
     */
    scrolled(auditTimeInMs?: number): Observable<CdkScrollable | void>;
    ngOnDestroy(): void;
    /**
     * Returns an observable that emits whenever any of the
     * scrollable ancestors of an element are scrolled.
     * @param elementRef Element whose ancestors to listen for.
     * @param auditTimeInMs Time to throttle the scroll events.
     */
    ancestorScrolled(elementRef: ElementRef, auditTimeInMs?: number): Observable<CdkScrollable | void>;
    /** Returns all registered Scrollables that contain the provided element. */
    getAncestorScrollContainers(elementRef: ElementRef): CdkScrollable[];
    /** Returns true if the element is contained within the provided Scrollable. */
    private _scrollableContainsElement;
    /** Sets up the global scroll listeners. */
    private _addGlobalListener;
    /** Cleans up the global scroll listener. */
    private _removeGlobalListener;
}
/** @docs-private @deprecated @breaking-change 8.0.0 */
export declare function SCROLL_DISPATCHER_PROVIDER_FACTORY(parentDispatcher: ScrollDispatcher, ngZone: NgZone, platform: Platform): ScrollDispatcher;
/** @docs-private @deprecated @breaking-change 8.0.0 */
export declare const SCROLL_DISPATCHER_PROVIDER: {
    provide: typeof ScrollDispatcher;
    deps: (Optional[] | typeof NgZone | typeof Platform)[];
    useFactory: typeof SCROLL_DISPATCHER_PROVIDER_FACTORY;
};
