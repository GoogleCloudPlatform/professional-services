/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Route } from './config';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from './router_state';
/**
 * @description
 *
 * Identifies the trigger of the navigation.
 *
 * * 'imperative'--triggered by `router.navigateByUrl` or `router.navigate`.
 * * 'popstate'--triggered by a popstate event
 * * 'hashchange'--triggered by a hashchange event
 *
 * @publicApi
 */
export declare type NavigationTrigger = 'imperative' | 'popstate' | 'hashchange';
/**
 * @description
 *
 * Base for events the Router goes through, as opposed to events tied to a specific
 * Route. `RouterEvent`s will only be fired one time for any given navigation.
 *
 * Example:
 *
 * ```
 * class MyService {
 *   constructor(public router: Router, logger: Logger) {
 *     router.events.pipe(
 *       filter(e => e instanceof RouterEvent)
 *     ).subscribe(e => {
 *       logger.log(e.id, e.url);
 *     });
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export declare class RouterEvent {
    /** @docsNotRequired */
    id: number;
    /** @docsNotRequired */
    url: string;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string);
}
/**
 * @description
 *
 * Represents an event triggered when a navigation starts.
 *
 * @publicApi
 */
export declare class NavigationStart extends RouterEvent {
    /**
     * Identifies the trigger of the navigation.
     *
     * * 'imperative'--triggered by `router.navigateByUrl` or `router.navigate`.
     * * 'popstate'--triggered by a popstate event
     * * 'hashchange'--triggered by a hashchange event
     */
    navigationTrigger?: 'imperative' | 'popstate' | 'hashchange';
    /**
     * This contains the navigation id that pushed the history record that the router navigates
     * back to. This is not null only when the navigation is triggered by a popstate event.
     *
     * The router assigns a navigationId to every router transition/navigation. Even when the user
     * clicks on the back button in the browser, a new navigation id will be created. So from
     * the perspective of the router, the router never "goes back". By using the `restoredState`
     * and its navigationId, you can implement behavior that differentiates between creating new
     * states
     * and popstate events. In the latter case you can restore some remembered state (e.g., scroll
     * position).
     */
    restoredState?: {
        navigationId: number;
    } | null;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    navigationTrigger?: 'imperative' | 'popstate' | 'hashchange', 
    /** @docsNotRequired */
    restoredState?: {
        navigationId: number;
    } | null);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents an event triggered when a navigation ends successfully.
 *
 * @publicApi
 */
export declare class NavigationEnd extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents an event triggered when a navigation is canceled.
 *
 * @publicApi
 */
export declare class NavigationCancel extends RouterEvent {
    /** @docsNotRequired */
    reason: string;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    reason: string);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents an event triggered when a navigation fails due to an unexpected error.
 *
 * @publicApi
 */
export declare class NavigationError extends RouterEvent {
    /** @docsNotRequired */
    error: any;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    error: any);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents an event triggered when routes are recognized.
 *
 * @publicApi
 */
export declare class RoutesRecognized extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    /** @docsNotRequired */
    toString(): string;
}
/**
 * @description
 *
 * Represents the start of the Guard phase of routing.
 *
 * @publicApi
 */
export declare class GuardsCheckStart extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents the end of the Guard phase of routing.
 *
 * @publicApi
 */
export declare class GuardsCheckEnd extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    /** @docsNotRequired */
    shouldActivate: boolean;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot, 
    /** @docsNotRequired */
    shouldActivate: boolean);
    toString(): string;
}
/**
 * @description
 *
 * Represents the start of the Resolve phase of routing. The timing of this
 * event may change, thus it's experimental. In the current iteration it will run
 * in the "resolve" phase whether there's things to resolve or not. In the future this
 * behavior may change to only run when there are things to be resolved.
 *
 * @publicApi
 */
export declare class ResolveStart extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents the end of the Resolve phase of routing. See note on
 * `ResolveStart` for use of this experimental API.
 *
 * @publicApi
 */
export declare class ResolveEnd extends RouterEvent {
    /** @docsNotRequired */
    urlAfterRedirects: string;
    /** @docsNotRequired */
    state: RouterStateSnapshot;
    constructor(
    /** @docsNotRequired */
    id: number, 
    /** @docsNotRequired */
    url: string, 
    /** @docsNotRequired */
    urlAfterRedirects: string, 
    /** @docsNotRequired */
    state: RouterStateSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents an event triggered before lazy loading a route config.
 *
 * @publicApi
 */
export declare class RouteConfigLoadStart {
    /** @docsNotRequired */
    route: Route;
    constructor(
    /** @docsNotRequired */
    route: Route);
    toString(): string;
}
/**
 * @description
 *
 * Represents an event triggered when a route has been lazy loaded.
 *
 * @publicApi
 */
export declare class RouteConfigLoadEnd {
    /** @docsNotRequired */
    route: Route;
    constructor(
    /** @docsNotRequired */
    route: Route);
    toString(): string;
}
/**
 * @description
 *
 * Represents the start of end of the Resolve phase of routing. See note on
 * `ChildActivationEnd` for use of this experimental API.
 *
 * @publicApi
 */
export declare class ChildActivationStart {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents the start of end of the Resolve phase of routing. See note on
 * `ChildActivationStart` for use of this experimental API.
 *
 * @publicApi
 */
export declare class ChildActivationEnd {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents the start of end of the Resolve phase of routing. See note on
 * `ActivationEnd` for use of this experimental API.
 *
 * @publicApi
 */
export declare class ActivationStart {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents the start of end of the Resolve phase of routing. See note on
 * `ActivationStart` for use of this experimental API.
 *
 * @publicApi
 */
export declare class ActivationEnd {
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot;
    constructor(
    /** @docsNotRequired */
    snapshot: ActivatedRouteSnapshot);
    toString(): string;
}
/**
 * @description
 *
 * Represents a scrolling event.
 *
 * @publicApi
 */
export declare class Scroll {
    /** @docsNotRequired */
    readonly routerEvent: NavigationEnd;
    /** @docsNotRequired */
    readonly position: [number, number] | null;
    /** @docsNotRequired */
    readonly anchor: string | null;
    constructor(
    /** @docsNotRequired */
    routerEvent: NavigationEnd, 
    /** @docsNotRequired */
    position: [number, number] | null, 
    /** @docsNotRequired */
    anchor: string | null);
    toString(): string;
}
/**
 * @description
 *
 * Represents a router event, allowing you to track the lifecycle of the router.
 *
 * The sequence of router events is:
 *
 * - `NavigationStart`,
 * - `RouteConfigLoadStart`,
 * - `RouteConfigLoadEnd`,
 * - `RoutesRecognized`,
 * - `GuardsCheckStart`,
 * - `ChildActivationStart`,
 * - `ActivationStart`,
 * - `GuardsCheckEnd`,
 * - `ResolveStart`,
 * - `ResolveEnd`,
 * - `ActivationEnd`
 * - `ChildActivationEnd`
 * - `NavigationEnd`,
 * - `NavigationCancel`,
 * - `NavigationError`
 * - `Scroll`
 *
 * @publicApi
 */
export declare type Event = RouterEvent | RouteConfigLoadStart | RouteConfigLoadEnd | ChildActivationStart | ChildActivationEnd | ActivationStart | ActivationEnd | Scroll;
