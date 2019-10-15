/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_BASE_HREF, HashLocationStrategy, LOCATION_INITIALIZED, Location, LocationStrategy, PathLocationStrategy, PlatformLocation, ViewportScroller } from '@angular/common';
import { ANALYZE_FOR_ENTRY_COMPONENTS, APP_BOOTSTRAP_LISTENER, APP_INITIALIZER, ApplicationRef, Compiler, Inject, Injectable, InjectionToken, Injector, NgModule, NgModuleFactoryLoader, NgProbeToken, Optional, SkipSelf, SystemJsNgModuleLoader } from '@angular/core';
import { ɵgetDOM as getDOM } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { EmptyOutletComponent } from './components/empty_outlet';
import { RouterLink, RouterLinkWithHref } from './directives/router_link';
import { RouterLinkActive } from './directives/router_link_active';
import { RouterOutlet } from './directives/router_outlet';
import { RouteReuseStrategy } from './route_reuse_strategy';
import { Router } from './router';
import { ROUTES } from './router_config_loader';
import { ChildrenOutletContexts } from './router_outlet_context';
import { NoPreloading, PreloadAllModules, PreloadingStrategy, RouterPreloader } from './router_preloader';
import { RouterScroller } from './router_scroller';
import { ActivatedRoute } from './router_state';
import { UrlHandlingStrategy } from './url_handling_strategy';
import { DefaultUrlSerializer, UrlSerializer } from './url_tree';
import { flatten } from './utils/collection';
/** *
 * \@description
 *
 * Contains a list of directives
 *
 *
  @type {?} */
const ROUTER_DIRECTIVES = [RouterOutlet, RouterLink, RouterLinkWithHref, RouterLinkActive, EmptyOutletComponent];
/** *
 * \@description
 *
 * Is used in DI to configure the router.
 *
 * \@publicApi
  @type {?} */
export const ROUTER_CONFIGURATION = new InjectionToken('ROUTER_CONFIGURATION');
/** *
 * \@docsNotRequired
  @type {?} */
export const ROUTER_FORROOT_GUARD = new InjectionToken('ROUTER_FORROOT_GUARD');
/** @type {?} */
export const ROUTER_PROVIDERS = [
    Location,
    { provide: UrlSerializer, useClass: DefaultUrlSerializer },
    {
        provide: Router,
        useFactory: setupRouter,
        deps: [
            ApplicationRef, UrlSerializer, ChildrenOutletContexts, Location, Injector,
            NgModuleFactoryLoader, Compiler, ROUTES, ROUTER_CONFIGURATION,
            [UrlHandlingStrategy, new Optional()], [RouteReuseStrategy, new Optional()]
        ]
    },
    ChildrenOutletContexts,
    { provide: ActivatedRoute, useFactory: rootRoute, deps: [Router] },
    { provide: NgModuleFactoryLoader, useClass: SystemJsNgModuleLoader },
    RouterPreloader,
    NoPreloading,
    PreloadAllModules,
    { provide: ROUTER_CONFIGURATION, useValue: { enableTracing: false } },
];
/**
 * @return {?}
 */
export function routerNgProbeToken() {
    return new NgProbeToken('Router', Router);
}
/**
 * \@usageNotes
 *
 * RouterModule can be imported multiple times: once per lazily-loaded bundle.
 * Since the router deals with a global shared resource--location, we cannot have
 * more than one router service active.
 *
 * That is why there are two ways to create the module: `RouterModule.forRoot` and
 * `RouterModule.forChild`.
 *
 * * `forRoot` creates a module that contains all the directives, the given routes, and the router
 *   service itself.
 * * `forChild` creates a module that contains all the directives and the given routes, but does not
 *   include the router service.
 *
 * When registered at the root, the module should be used as follows
 *
 * ```
 * \@NgModule({
 *   imports: [RouterModule.forRoot(ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * For submodules and lazy loaded submodules the module should be used as follows:
 *
 * ```
 * \@NgModule({
 *   imports: [RouterModule.forChild(ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * \@description
 *
 * Adds router directives and providers.
 *
 * Managing state transitions is one of the hardest parts of building applications. This is
 * especially true on the web, where you also need to ensure that the state is reflected in the URL.
 * In addition, we often want to split applications into multiple bundles and load them on demand.
 * Doing this transparently is not trivial.
 *
 * The Angular router solves these problems. Using the router, you can declaratively specify
 * application states, manage state transitions while taking care of the URL, and load bundles on
 * demand.
 *
 * [Read this developer guide](https://angular.io/docs/ts/latest/guide/router.html) to get an
 * overview of how the router should be used.
 *
 * \@publicApi
 */
export class RouterModule {
    /**
     * @param {?} guard
     * @param {?} router
     */
    constructor(guard, router) { }
    /**
     * Creates a module with all the router providers and directives. It also optionally sets up an
     * application listener to perform an initial navigation.
     *
     * Options (see `ExtraOptions`):
     * * `enableTracing` makes the router log all its internal events to the console.
     * * `useHash` enables the location strategy that uses the URL fragment instead of the history
     * API.
     * * `initialNavigation` disables the initial navigation.
     * * `errorHandler` provides a custom error handler.
     * * `preloadingStrategy` configures a preloading strategy (see `PreloadAllModules`).
     * * `onSameUrlNavigation` configures how the router handles navigation to the current URL. See
     * `ExtraOptions` for more details.
     * * `paramsInheritanceStrategy` defines how the router merges params, data and resolved data
     * from parent to child routes.
     * @param {?} routes
     * @param {?=} config
     * @return {?}
     */
    static forRoot(routes, config) {
        return {
            ngModule: RouterModule,
            providers: [
                ROUTER_PROVIDERS,
                provideRoutes(routes),
                {
                    provide: ROUTER_FORROOT_GUARD,
                    useFactory: provideForRootGuard,
                    deps: [[Router, new Optional(), new SkipSelf()]]
                },
                { provide: ROUTER_CONFIGURATION, useValue: config ? config : {} },
                {
                    provide: LocationStrategy,
                    useFactory: provideLocationStrategy,
                    deps: [
                        PlatformLocation, [new Inject(APP_BASE_HREF), new Optional()], ROUTER_CONFIGURATION
                    ]
                },
                {
                    provide: RouterScroller,
                    useFactory: createRouterScroller,
                    deps: [Router, ViewportScroller, ROUTER_CONFIGURATION]
                },
                {
                    provide: PreloadingStrategy,
                    useExisting: config && config.preloadingStrategy ? config.preloadingStrategy :
                        NoPreloading
                },
                { provide: NgProbeToken, multi: true, useFactory: routerNgProbeToken },
                provideRouterInitializer(),
            ],
        };
    }
    /**
     * Creates a module with all the router directives and a provider registering routes.
     * @param {?} routes
     * @return {?}
     */
    static forChild(routes) {
        return { ngModule: RouterModule, providers: [provideRoutes(routes)] };
    }
}
RouterModule.decorators = [
    { type: NgModule, args: [{
                declarations: ROUTER_DIRECTIVES,
                exports: ROUTER_DIRECTIVES,
                entryComponents: [EmptyOutletComponent]
            },] }
];
/** @nocollapse */
RouterModule.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Optional }, { type: Inject, args: [ROUTER_FORROOT_GUARD,] }] },
    { type: Router, decorators: [{ type: Optional }] }
];
/**
 * @param {?} router
 * @param {?} viewportScroller
 * @param {?} config
 * @return {?}
 */
export function createRouterScroller(router, viewportScroller, config) {
    if (config.scrollOffset) {
        viewportScroller.setOffset(config.scrollOffset);
    }
    return new RouterScroller(router, viewportScroller, config);
}
/**
 * @param {?} platformLocationStrategy
 * @param {?} baseHref
 * @param {?=} options
 * @return {?}
 */
export function provideLocationStrategy(platformLocationStrategy, baseHref, options = {}) {
    return options.useHash ? new HashLocationStrategy(platformLocationStrategy, baseHref) :
        new PathLocationStrategy(platformLocationStrategy, baseHref);
}
/**
 * @param {?} router
 * @return {?}
 */
export function provideForRootGuard(router) {
    if (router) {
        throw new Error(`RouterModule.forRoot() called twice. Lazy loaded modules should use RouterModule.forChild() instead.`);
    }
    return 'guarded';
}
/**
 * \@description
 *
 * Registers routes.
 *
 * \@usageNotes
 * ### Example
 *
 * ```
 * \@NgModule({
 *   imports: [RouterModule.forChild(ROUTES)],
 *   providers: [provideRoutes(EXTRA_ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * \@publicApi
 * @param {?} routes
 * @return {?}
 */
export function provideRoutes(routes) {
    return [
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, multi: true, useValue: routes },
        { provide: ROUTES, multi: true, useValue: routes },
    ];
}
/** @typedef {?} */
var InitialNavigation;
export { InitialNavigation };
/**
 * \@description
 *
 * Represents options to configure the router.
 *
 * \@publicApi
 * @record
 */
export function ExtraOptions() { }
/**
 * Makes the router log all its internal events to the console.
 * @type {?|undefined}
 */
ExtraOptions.prototype.enableTracing;
/**
 * Enables the location strategy that uses the URL fragment instead of the history API.
 * @type {?|undefined}
 */
ExtraOptions.prototype.useHash;
/**
 * Disables the initial navigation.
 * @type {?|undefined}
 */
ExtraOptions.prototype.initialNavigation;
/**
 * A custom error handler.
 * @type {?|undefined}
 */
ExtraOptions.prototype.errorHandler;
/**
 * Configures a preloading strategy. See `PreloadAllModules`.
 * @type {?|undefined}
 */
ExtraOptions.prototype.preloadingStrategy;
/**
 * Define what the router should do if it receives a navigation request to the current URL.
 * By default, the router will ignore this navigation. However, this prevents features such
 * as a "refresh" button. Use this option to configure the behavior when navigating to the
 * current URL. Default is 'ignore'.
 * @type {?|undefined}
 */
ExtraOptions.prototype.onSameUrlNavigation;
/**
 * Configures if the scroll position needs to be restored when navigating back.
 *
 * * 'disabled'--does nothing (default).
 * * 'top'--set the scroll position to 0,0..
 * * 'enabled'--set the scroll position to the stored position. This option will be the default in
 * the future.
 *
 * When enabled, the router stores and restores scroll positions during navigation.
 * When navigating forward, the scroll position will be set to [0, 0], or to the anchor
 * if one is provided.
 *
 * You can implement custom scroll restoration behavior as follows.
 * ```typescript
 * class AppModule {
 *  constructor(router: Router, viewportScroller: ViewportScroller, store: Store<AppState>) {
 *    router.events.pipe(filter(e => e instanceof Scroll), switchMap(e => {
 *      return store.pipe(first(), timeout(200), map(() => e));
 *    }).subscribe(e => {
 *      if (e.position) {
 *        viewportScroller.scrollToPosition(e.position);
 *      } else if (e.anchor) {
 *        viewportScroller.scrollToAnchor(e.anchor);
 *      } else {
 *        viewportScroller.scrollToPosition([0, 0]);
 *      }
 *    });
 *  }
 * }
 * ```
 *
 * You can also implement component-specific scrolling like this:
 *
 * ```typescript
 * class ListComponent {
 *   list: any[];
 *   constructor(router: Router, viewportScroller: ViewportScroller, fetcher: ListFetcher) {
 *     const scrollEvents = router.events.filter(e => e instanceof Scroll);
 *     listFetcher.fetch().pipe(withLatestFrom(scrollEvents)).subscribe(([list, e]) => {
 *       this.list = list;
 *       if (e.position) {
 *         viewportScroller.scrollToPosition(e.position);
 *       } else {
 *         viewportScroller.scrollToPosition([0, 0]);
 *       }
 *     });
 *   }
 * }
 * @type {?|undefined}
 */
ExtraOptions.prototype.scrollPositionRestoration;
/**
 * Configures if the router should scroll to the element when the url has a fragment.
 *
 * * 'disabled'--does nothing (default).
 * * 'enabled'--scrolls to the element. This option will be the default in the future.
 *
 * Anchor scrolling does not happen on 'popstate'. Instead, we restore the position
 * that we stored or scroll to the top.
 * @type {?|undefined}
 */
ExtraOptions.prototype.anchorScrolling;
/**
 * Configures the scroll offset the router will use when scrolling to an element.
 *
 * When given a tuple with two numbers, the router will always use the numbers.
 * When given a function, the router will invoke the function every time it restores scroll
 * position.
 * @type {?|undefined}
 */
ExtraOptions.prototype.scrollOffset;
/**
 * Defines how the router merges params, data and resolved data from parent to child
 * routes. Available options are:
 *
 * - `'emptyOnly'`, the default, only inherits parent params for path-less or component-less
 *   routes.
 * - `'always'`, enables unconditional inheritance of parent params.
 * @type {?|undefined}
 */
ExtraOptions.prototype.paramsInheritanceStrategy;
/**
 * A custom malformed uri error handler function. This handler is invoked when encodedURI contains
 * invalid character sequences. The default implementation is to redirect to the root url dropping
 * any path or param info. This function passes three parameters:
 *
 * - `'URIError'` - Error thrown when parsing a bad URL
 * - `'UrlSerializer'` - UrlSerializer that’s configured with the router.
 * - `'url'` -  The malformed URL that caused the URIError
 *
 * @type {?|undefined}
 */
ExtraOptions.prototype.malformedUriErrorHandler;
/**
 * Defines when the router updates the browser URL. The default behavior is to update after
 * successful navigation. However, some applications may prefer a mode where the URL gets
 * updated at the beginning of navigation. The most common use case would be updating the
 * URL early so if navigation fails, you can show an error message with the URL that failed.
 * Available options are:
 *
 * - `'deferred'`, the default, updates the browser URL after navigation has finished.
 * - `'eager'`, updates browser URL at the beginning of navigation.
 * @type {?|undefined}
 */
ExtraOptions.prototype.urlUpdateStrategy;
/**
 * Enables a bug fix that corrects relative link resolution in components with empty paths.
 * Example:
 *
 * ```
 * const routes = [
 *   {
 *     path: '',
 *     component: ContainerComponent,
 *     children: [
 *       { path: 'a', component: AComponent },
 *       { path: 'b', component: BComponent },
 *     ]
 *   }
 * ];
 * ```
 *
 * From the `ContainerComponent`, this will not work:
 *
 * `<a [routerLink]="['./a']">Link to A</a>`
 *
 * However, this will work:
 *
 * `<a [routerLink]="['../a']">Link to A</a>`
 *
 * In other words, you're required to use `../` rather than `./`. The current default in v6
 * is `legacy`, and this option will be removed in v7 to default to the corrected behavior.
 * @type {?|undefined}
 */
ExtraOptions.prototype.relativeLinkResolution;
/**
 * @param {?} ref
 * @param {?} urlSerializer
 * @param {?} contexts
 * @param {?} location
 * @param {?} injector
 * @param {?} loader
 * @param {?} compiler
 * @param {?} config
 * @param {?=} opts
 * @param {?=} urlHandlingStrategy
 * @param {?=} routeReuseStrategy
 * @return {?}
 */
export function setupRouter(ref, urlSerializer, contexts, location, injector, loader, compiler, config, opts = {}, urlHandlingStrategy, routeReuseStrategy) {
    /** @type {?} */
    const router = new Router(null, urlSerializer, contexts, location, injector, loader, compiler, flatten(config));
    if (urlHandlingStrategy) {
        router.urlHandlingStrategy = urlHandlingStrategy;
    }
    if (routeReuseStrategy) {
        router.routeReuseStrategy = routeReuseStrategy;
    }
    if (opts.errorHandler) {
        router.errorHandler = opts.errorHandler;
    }
    if (opts.malformedUriErrorHandler) {
        router.malformedUriErrorHandler = opts.malformedUriErrorHandler;
    }
    if (opts.enableTracing) {
        /** @type {?} */
        const dom = getDOM();
        router.events.subscribe((e) => {
            dom.logGroup(`Router Event: ${((/** @type {?} */ (e.constructor))).name}`);
            dom.log(e.toString());
            dom.log(e);
            dom.logGroupEnd();
        });
    }
    if (opts.onSameUrlNavigation) {
        router.onSameUrlNavigation = opts.onSameUrlNavigation;
    }
    if (opts.paramsInheritanceStrategy) {
        router.paramsInheritanceStrategy = opts.paramsInheritanceStrategy;
    }
    if (opts.urlUpdateStrategy) {
        router.urlUpdateStrategy = opts.urlUpdateStrategy;
    }
    if (opts.relativeLinkResolution) {
        router.relativeLinkResolution = opts.relativeLinkResolution;
    }
    return router;
}
/**
 * @param {?} router
 * @return {?}
 */
export function rootRoute(router) {
    return router.routerState.root;
}
/**
 * To initialize the router properly we need to do in two steps:
 *
 * We need to start the navigation in a APP_INITIALIZER to block the bootstrap if
 * a resolver or a guards executes asynchronously. Second, we need to actually run
 * activation in a BOOTSTRAP_LISTENER. We utilize the afterPreactivation
 * hook provided by the router to do that.
 *
 * The router navigation starts, reaches the point when preactivation is done, and then
 * pauses. It waits for the hook to be resolved. We then resolve it only in a bootstrap listener.
 */
export class RouterInitializer {
    /**
     * @param {?} injector
     */
    constructor(injector) {
        this.injector = injector;
        this.initNavigation = false;
        this.resultOfPreactivationDone = new Subject();
    }
    /**
     * @return {?}
     */
    appInitializer() {
        /** @type {?} */
        const p = this.injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
        return p.then(() => {
            /** @type {?} */
            let resolve = /** @type {?} */ ((null));
            /** @type {?} */
            const res = new Promise(r => resolve = r);
            /** @type {?} */
            const router = this.injector.get(Router);
            /** @type {?} */
            const opts = this.injector.get(ROUTER_CONFIGURATION);
            if (this.isLegacyDisabled(opts) || this.isLegacyEnabled(opts)) {
                resolve(true);
            }
            else if (opts.initialNavigation === 'disabled') {
                router.setUpLocationChangeListener();
                resolve(true);
            }
            else if (opts.initialNavigation === 'enabled') {
                router.hooks.afterPreactivation = () => {
                    // only the initial navigation should be delayed
                    if (!this.initNavigation) {
                        this.initNavigation = true;
                        resolve(true);
                        return this.resultOfPreactivationDone;
                        // subsequent navigations should not be delayed
                    }
                    else {
                        return /** @type {?} */ (of(null));
                    }
                };
                router.initialNavigation();
            }
            else {
                throw new Error(`Invalid initialNavigation options: '${opts.initialNavigation}'`);
            }
            return res;
        });
    }
    /**
     * @param {?} bootstrappedComponentRef
     * @return {?}
     */
    bootstrapListener(bootstrappedComponentRef) {
        /** @type {?} */
        const opts = this.injector.get(ROUTER_CONFIGURATION);
        /** @type {?} */
        const preloader = this.injector.get(RouterPreloader);
        /** @type {?} */
        const routerScroller = this.injector.get(RouterScroller);
        /** @type {?} */
        const router = this.injector.get(Router);
        /** @type {?} */
        const ref = this.injector.get(ApplicationRef);
        if (bootstrappedComponentRef !== ref.components[0]) {
            return;
        }
        if (this.isLegacyEnabled(opts)) {
            router.initialNavigation();
        }
        else if (this.isLegacyDisabled(opts)) {
            router.setUpLocationChangeListener();
        }
        preloader.setUpPreloading();
        routerScroller.init();
        router.resetRootComponentType(ref.componentTypes[0]);
        this.resultOfPreactivationDone.next(/** @type {?} */ ((null)));
        this.resultOfPreactivationDone.complete();
    }
    /**
     * @param {?} opts
     * @return {?}
     */
    isLegacyEnabled(opts) {
        return opts.initialNavigation === 'legacy_enabled' || opts.initialNavigation === true ||
            opts.initialNavigation === undefined;
    }
    /**
     * @param {?} opts
     * @return {?}
     */
    isLegacyDisabled(opts) {
        return opts.initialNavigation === 'legacy_disabled' || opts.initialNavigation === false;
    }
}
RouterInitializer.decorators = [
    { type: Injectable }
];
/** @nocollapse */
RouterInitializer.ctorParameters = () => [
    { type: Injector }
];
if (false) {
    /** @type {?} */
    RouterInitializer.prototype.initNavigation;
    /** @type {?} */
    RouterInitializer.prototype.resultOfPreactivationDone;
    /** @type {?} */
    RouterInitializer.prototype.injector;
}
/**
 * @param {?} r
 * @return {?}
 */
export function getAppInitializer(r) {
    return r.appInitializer.bind(r);
}
/**
 * @param {?} r
 * @return {?}
 */
export function getBootstrapListener(r) {
    return r.bootstrapListener.bind(r);
}
/** *
 * A token for the router initializer that will be called after the app is bootstrapped.
 *
 * \@publicApi
  @type {?} */
export const ROUTER_INITIALIZER = new InjectionToken('Router Initializer');
/**
 * @return {?}
 */
export function provideRouterInitializer() {
    return [
        RouterInitializer,
        {
            provide: APP_INITIALIZER,
            multi: true,
            useFactory: getAppInitializer,
            deps: [RouterInitializer]
        },
        { provide: ROUTER_INITIALIZER, useFactory: getBootstrapListener, deps: [RouterInitializer] },
        { provide: APP_BOOTSTRAP_LISTENER, multi: true, useExisting: ROUTER_INITIALIZER },
    ];
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX21vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci9zcmMvcm91dGVyX21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDaEwsT0FBTyxFQUFDLDRCQUE0QixFQUFFLHNCQUFzQixFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFnQixNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQXVCLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFZLFFBQVEsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNwVCxPQUFPLEVBQUMsT0FBTyxJQUFJLE1BQU0sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzVELE9BQU8sRUFBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRS9ELE9BQU8sRUFBQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFeEQsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFlLE1BQU0sRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5QyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDL0QsT0FBTyxFQUFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxhQUFhLEVBQVUsTUFBTSxZQUFZLENBQUM7QUFDeEUsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLG9CQUFvQixDQUFDOzs7Ozs7OztBQVczQyxNQUFNLGlCQUFpQixHQUNuQixDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzs7Ozs7Ozs7QUFTM0YsYUFBYSxvQkFBb0IsR0FBRyxJQUFJLGNBQWMsQ0FBZSxzQkFBc0IsQ0FBQyxDQUFDOzs7O0FBSzdGLGFBQWEsb0JBQW9CLEdBQUcsSUFBSSxjQUFjLENBQU8sc0JBQXNCLENBQUMsQ0FBQzs7QUFFckYsYUFBYSxnQkFBZ0IsR0FBZTtJQUMxQyxRQUFRO0lBQ1IsRUFBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBQztJQUN4RDtRQUNFLE9BQU8sRUFBRSxNQUFNO1FBQ2YsVUFBVSxFQUFFLFdBQVc7UUFDdkIsSUFBSSxFQUFFO1lBQ0osY0FBYyxFQUFFLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsUUFBUTtZQUN6RSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLG9CQUFvQjtZQUM3RCxDQUFDLG1CQUFtQixFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLElBQUksUUFBUSxFQUFFLENBQUM7U0FDNUU7S0FDRjtJQUNELHNCQUFzQjtJQUN0QixFQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBQztJQUNoRSxFQUFDLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUM7SUFDbEUsZUFBZTtJQUNmLFlBQVk7SUFDWixpQkFBaUI7SUFDakIsRUFBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLEVBQUMsYUFBYSxFQUFFLEtBQUssRUFBQyxFQUFDO0NBQ2xFLENBQUM7Ozs7QUFFRixNQUFNLFVBQVUsa0JBQWtCO0lBQ2hDLE9BQU8sSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0NBQzNDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMERELE1BQU0sT0FBTyxZQUFZOzs7OztJQUV2QixZQUFzRCxLQUFVLEVBQWMsTUFBYyxLQUFJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWtCaEcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFjLEVBQUUsTUFBcUI7UUFDbEQsT0FBTztZQUNMLFFBQVEsRUFBRSxZQUFZO1lBQ3RCLFNBQVMsRUFBRTtnQkFDVCxnQkFBZ0I7Z0JBQ2hCLGFBQWEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3JCO29CQUNFLE9BQU8sRUFBRSxvQkFBb0I7b0JBQzdCLFVBQVUsRUFBRSxtQkFBbUI7b0JBQy9CLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2lCQUNqRDtnQkFDRCxFQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQztnQkFDL0Q7b0JBQ0UsT0FBTyxFQUFFLGdCQUFnQjtvQkFDekIsVUFBVSxFQUFFLHVCQUF1QjtvQkFDbkMsSUFBSSxFQUFFO3dCQUNKLGdCQUFnQixFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQjtxQkFDcEY7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsT0FBTyxFQUFFLGNBQWM7b0JBQ3ZCLFVBQVUsRUFBRSxvQkFBb0I7b0JBQ2hDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQztpQkFDdkQ7Z0JBQ0Q7b0JBQ0UsT0FBTyxFQUFFLGtCQUFrQjtvQkFDM0IsV0FBVyxFQUFFLE1BQU0sSUFBSSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUMzQixZQUFZO2lCQUNoRTtnQkFDRCxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUM7Z0JBQ3BFLHdCQUF3QixFQUFFO2FBQzNCO1NBQ0YsQ0FBQztLQUNIOzs7Ozs7SUFLRCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQWM7UUFDNUIsT0FBTyxFQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQztLQUNyRTs7O1lBakVGLFFBQVEsU0FBQztnQkFDUixZQUFZLEVBQUUsaUJBQWlCO2dCQUMvQixPQUFPLEVBQUUsaUJBQWlCO2dCQUMxQixlQUFlLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQzthQUN4Qzs7Ozs0Q0FHYyxRQUFRLFlBQUksTUFBTSxTQUFDLG9CQUFvQjtZQXZIaEMsTUFBTSx1QkF1SHlDLFFBQVE7Ozs7Ozs7O0FBNkQ3RSxNQUFNLFVBQVUsb0JBQW9CLENBQ2hDLE1BQWMsRUFBRSxnQkFBa0MsRUFBRSxNQUFvQjtJQUMxRSxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUU7UUFDdkIsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNqRDtJQUNELE9BQU8sSUFBSSxjQUFjLENBQUMsTUFBTSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0NBQzdEOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyx3QkFBMEMsRUFBRSxRQUFnQixFQUFFLFVBQXdCLEVBQUU7SUFDMUYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLG9CQUFvQixDQUFDLHdCQUF3QixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDOUQsSUFBSSxvQkFBb0IsQ0FBQyx3QkFBd0IsRUFBRSxRQUFRLENBQUMsQ0FBQztDQUN2Rjs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBYztJQUNoRCxJQUFJLE1BQU0sRUFBRTtRQUNWLE1BQU0sSUFBSSxLQUFLLENBQ1gsc0dBQXNHLENBQUMsQ0FBQztLQUM3RztJQUNELE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQkQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxNQUFjO0lBQzFDLE9BQU87UUFDTCxFQUFDLE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUM7UUFDdEUsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBQztLQUNqRCxDQUFDO0NBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStNRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixHQUFtQixFQUFFLGFBQTRCLEVBQUUsUUFBZ0MsRUFDbkYsUUFBa0IsRUFBRSxRQUFrQixFQUFFLE1BQTZCLEVBQUUsUUFBa0IsRUFDekYsTUFBaUIsRUFBRSxPQUFxQixFQUFFLEVBQUUsbUJBQXlDLEVBQ3JGLGtCQUF1Qzs7SUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQ3JCLElBQUksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUUxRixJQUFJLG1CQUFtQixFQUFFO1FBQ3ZCLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztLQUNsRDtJQUVELElBQUksa0JBQWtCLEVBQUU7UUFDdEIsTUFBTSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0tBQ2hEO0lBRUQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ3JCLE1BQU0sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztLQUN6QztJQUVELElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFO1FBQ2pDLE1BQU0sQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUM7S0FDakU7SUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7O1FBQ3RCLE1BQU0sR0FBRyxHQUFHLE1BQU0sRUFBRSxDQUFDO1FBQ3JCLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBYyxFQUFFLEVBQUU7WUFDekMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsb0JBQU0sQ0FBQyxDQUFDLFdBQVcsR0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDM0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN0QixHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1gsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ25CLENBQUMsQ0FBQztLQUNKO0lBRUQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7UUFDNUIsTUFBTSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztLQUN2RDtJQUVELElBQUksSUFBSSxDQUFDLHlCQUF5QixFQUFFO1FBQ2xDLE1BQU0sQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUM7S0FDbkU7SUFFRCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtRQUMxQixNQUFNLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO0tBQ25EO0lBRUQsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUU7UUFDL0IsTUFBTSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztLQUM3RDtJQUVELE9BQU8sTUFBTSxDQUFDO0NBQ2Y7Ozs7O0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxNQUFjO0lBQ3RDLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7Q0FDaEM7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sT0FBTyxpQkFBaUI7Ozs7SUFJNUIsWUFBb0IsUUFBa0I7UUFBbEIsYUFBUSxHQUFSLFFBQVEsQ0FBVTs4QkFISixLQUFLO3lDQUNILElBQUksT0FBTyxFQUFRO0tBRWI7Ozs7SUFFMUMsY0FBYzs7UUFDWixNQUFNLENBQUMsR0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3ZGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7O1lBQ2pCLElBQUksT0FBTyxzQkFBYSxJQUFJLEdBQUc7O1lBQy9CLE1BQU0sR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDOztZQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7WUFDekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUVyRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM3RCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFFZjtpQkFBTSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxVQUFVLEVBQUU7Z0JBQ2hELE1BQU0sQ0FBQywyQkFBMkIsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFFZjtpQkFBTSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7Z0JBQy9DLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsR0FBRyxFQUFFOztvQkFFckMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7d0JBQ3hCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO3dCQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ2QsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUM7O3FCQUd2Qzt5QkFBTTt3QkFDTCx5QkFBTyxFQUFFLENBQUUsSUFBSSxDQUFRLEVBQUM7cUJBQ3pCO2lCQUNGLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLGlCQUFpQixFQUFFLENBQUM7YUFFNUI7aUJBQU07Z0JBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQzthQUNuRjtZQUVELE9BQU8sR0FBRyxDQUFDO1NBQ1osQ0FBQyxDQUFDO0tBQ0o7Ozs7O0lBRUQsaUJBQWlCLENBQUMsd0JBQTJDOztRQUMzRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztRQUNyRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQzs7UUFDckQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7O1FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztRQUN6QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBaUIsY0FBYyxDQUFDLENBQUM7UUFFOUQsSUFBSSx3QkFBd0IsS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2xELE9BQU87U0FDUjtRQUVELElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QixNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztTQUM1QjthQUFNLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1NBQ3RDO1FBRUQsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzVCLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QixNQUFNLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLG9CQUFDLElBQUksR0FBRyxDQUFDO1FBQzVDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUMzQzs7Ozs7SUFFTyxlQUFlLENBQUMsSUFBa0I7UUFDeEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEtBQUssZ0JBQWdCLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLElBQUk7WUFDakYsSUFBSSxDQUFDLGlCQUFpQixLQUFLLFNBQVMsQ0FBQzs7Ozs7O0lBR25DLGdCQUFnQixDQUFDLElBQWtCO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixLQUFLLGlCQUFpQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsS0FBSyxLQUFLLENBQUM7Ozs7WUEzRTNGLFVBQVU7Ozs7WUEvZmdKLFFBQVE7Ozs7Ozs7Ozs7Ozs7O0FBOGtCbkssTUFBTSxVQUFVLGlCQUFpQixDQUFDLENBQW9CO0lBQ3BELE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDakM7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLENBQW9CO0lBQ3ZELE9BQU8sQ0FBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNwQzs7Ozs7O0FBT0QsYUFBYSxrQkFBa0IsR0FDM0IsSUFBSSxjQUFjLENBQXVDLG9CQUFvQixDQUFDLENBQUM7Ozs7QUFFbkYsTUFBTSxVQUFVLHdCQUF3QjtJQUN0QyxPQUFPO1FBQ0wsaUJBQWlCO1FBQ2pCO1lBQ0UsT0FBTyxFQUFFLGVBQWU7WUFDeEIsS0FBSyxFQUFFLElBQUk7WUFDWCxVQUFVLEVBQUUsaUJBQWlCO1lBQzdCLElBQUksRUFBRSxDQUFDLGlCQUFpQixDQUFDO1NBQzFCO1FBQ0QsRUFBQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxDQUFDLGlCQUFpQixDQUFDLEVBQUM7UUFDMUYsRUFBQyxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUM7S0FDaEYsQ0FBQztDQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FQUF9CQVNFX0hSRUYsIEhhc2hMb2NhdGlvblN0cmF0ZWd5LCBMT0NBVElPTl9JTklUSUFMSVpFRCwgTG9jYXRpb24sIExvY2F0aW9uU3RyYXRlZ3ksIFBhdGhMb2NhdGlvblN0cmF0ZWd5LCBQbGF0Zm9ybUxvY2F0aW9uLCBWaWV3cG9ydFNjcm9sbGVyfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtBTkFMWVpFX0ZPUl9FTlRSWV9DT01QT05FTlRTLCBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBUFBfSU5JVElBTElaRVIsIEFwcGxpY2F0aW9uUmVmLCBDb21waWxlciwgQ29tcG9uZW50UmVmLCBJbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBJbmplY3RvciwgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRmFjdG9yeUxvYWRlciwgTmdQcm9iZVRva2VuLCBPcHRpb25hbCwgUHJvdmlkZXIsIFNraXBTZWxmLCBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7ybVnZXRET00gYXMgZ2V0RE9NfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbmltcG9ydCB7U3ViamVjdCwgb2YgfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtFbXB0eU91dGxldENvbXBvbmVudH0gZnJvbSAnLi9jb21wb25lbnRzL2VtcHR5X291dGxldCc7XG5pbXBvcnQge1JvdXRlLCBSb3V0ZXN9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7Um91dGVyTGluaywgUm91dGVyTGlua1dpdGhIcmVmfSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX2xpbmsnO1xuaW1wb3J0IHtSb3V0ZXJMaW5rQWN0aXZlfSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX2xpbmtfYWN0aXZlJztcbmltcG9ydCB7Um91dGVyT3V0bGV0fSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX291dGxldCc7XG5pbXBvcnQge1JvdXRlckV2ZW50fSBmcm9tICcuL2V2ZW50cyc7XG5pbXBvcnQge1JvdXRlUmV1c2VTdHJhdGVneX0gZnJvbSAnLi9yb3V0ZV9yZXVzZV9zdHJhdGVneSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlciwgUm91dGVyfSBmcm9tICcuL3JvdXRlcic7XG5pbXBvcnQge1JPVVRFU30gZnJvbSAnLi9yb3V0ZXJfY29uZmlnX2xvYWRlcic7XG5pbXBvcnQge0NoaWxkcmVuT3V0bGV0Q29udGV4dHN9IGZyb20gJy4vcm91dGVyX291dGxldF9jb250ZXh0JztcbmltcG9ydCB7Tm9QcmVsb2FkaW5nLCBQcmVsb2FkQWxsTW9kdWxlcywgUHJlbG9hZGluZ1N0cmF0ZWd5LCBSb3V0ZXJQcmVsb2FkZXJ9IGZyb20gJy4vcm91dGVyX3ByZWxvYWRlcic7XG5pbXBvcnQge1JvdXRlclNjcm9sbGVyfSBmcm9tICcuL3JvdXRlcl9zY3JvbGxlcic7XG5pbXBvcnQge0FjdGl2YXRlZFJvdXRlfSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQge1VybEhhbmRsaW5nU3RyYXRlZ3l9IGZyb20gJy4vdXJsX2hhbmRsaW5nX3N0cmF0ZWd5JztcbmltcG9ydCB7RGVmYXVsdFVybFNlcmlhbGl6ZXIsIFVybFNlcmlhbGl6ZXIsIFVybFRyZWV9IGZyb20gJy4vdXJsX3RyZWUnO1xuaW1wb3J0IHtmbGF0dGVufSBmcm9tICcuL3V0aWxzL2NvbGxlY3Rpb24nO1xuXG5cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBDb250YWlucyBhIGxpc3Qgb2YgZGlyZWN0aXZlc1xuICpcbiAqXG4gKi9cbmNvbnN0IFJPVVRFUl9ESVJFQ1RJVkVTID1cbiAgICBbUm91dGVyT3V0bGV0LCBSb3V0ZXJMaW5rLCBSb3V0ZXJMaW5rV2l0aEhyZWYsIFJvdXRlckxpbmtBY3RpdmUsIEVtcHR5T3V0bGV0Q29tcG9uZW50XTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBJcyB1c2VkIGluIERJIHRvIGNvbmZpZ3VyZSB0aGUgcm91dGVyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFJPVVRFUl9DT05GSUdVUkFUSU9OID0gbmV3IEluamVjdGlvblRva2VuPEV4dHJhT3B0aW9ucz4oJ1JPVVRFUl9DT05GSUdVUkFUSU9OJyk7XG5cbi8qKlxuICogQGRvY3NOb3RSZXF1aXJlZFxuICovXG5leHBvcnQgY29uc3QgUk9VVEVSX0ZPUlJPT1RfR1VBUkQgPSBuZXcgSW5qZWN0aW9uVG9rZW48dm9pZD4oJ1JPVVRFUl9GT1JST09UX0dVQVJEJyk7XG5cbmV4cG9ydCBjb25zdCBST1VURVJfUFJPVklERVJTOiBQcm92aWRlcltdID0gW1xuICBMb2NhdGlvbixcbiAge3Byb3ZpZGU6IFVybFNlcmlhbGl6ZXIsIHVzZUNsYXNzOiBEZWZhdWx0VXJsU2VyaWFsaXplcn0sXG4gIHtcbiAgICBwcm92aWRlOiBSb3V0ZXIsXG4gICAgdXNlRmFjdG9yeTogc2V0dXBSb3V0ZXIsXG4gICAgZGVwczogW1xuICAgICAgQXBwbGljYXRpb25SZWYsIFVybFNlcmlhbGl6ZXIsIENoaWxkcmVuT3V0bGV0Q29udGV4dHMsIExvY2F0aW9uLCBJbmplY3RvcixcbiAgICAgIE5nTW9kdWxlRmFjdG9yeUxvYWRlciwgQ29tcGlsZXIsIFJPVVRFUywgUk9VVEVSX0NPTkZJR1VSQVRJT04sXG4gICAgICBbVXJsSGFuZGxpbmdTdHJhdGVneSwgbmV3IE9wdGlvbmFsKCldLCBbUm91dGVSZXVzZVN0cmF0ZWd5LCBuZXcgT3B0aW9uYWwoKV1cbiAgICBdXG4gIH0sXG4gIENoaWxkcmVuT3V0bGV0Q29udGV4dHMsXG4gIHtwcm92aWRlOiBBY3RpdmF0ZWRSb3V0ZSwgdXNlRmFjdG9yeTogcm9vdFJvdXRlLCBkZXBzOiBbUm91dGVyXX0sXG4gIHtwcm92aWRlOiBOZ01vZHVsZUZhY3RvcnlMb2FkZXIsIHVzZUNsYXNzOiBTeXN0ZW1Kc05nTW9kdWxlTG9hZGVyfSxcbiAgUm91dGVyUHJlbG9hZGVyLFxuICBOb1ByZWxvYWRpbmcsXG4gIFByZWxvYWRBbGxNb2R1bGVzLFxuICB7cHJvdmlkZTogUk9VVEVSX0NPTkZJR1VSQVRJT04sIHVzZVZhbHVlOiB7ZW5hYmxlVHJhY2luZzogZmFsc2V9fSxcbl07XG5cbmV4cG9ydCBmdW5jdGlvbiByb3V0ZXJOZ1Byb2JlVG9rZW4oKSB7XG4gIHJldHVybiBuZXcgTmdQcm9iZVRva2VuKCdSb3V0ZXInLCBSb3V0ZXIpO1xufVxuXG4vKipcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogUm91dGVyTW9kdWxlIGNhbiBiZSBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lczogb25jZSBwZXIgbGF6aWx5LWxvYWRlZCBidW5kbGUuXG4gKiBTaW5jZSB0aGUgcm91dGVyIGRlYWxzIHdpdGggYSBnbG9iYWwgc2hhcmVkIHJlc291cmNlLS1sb2NhdGlvbiwgd2UgY2Fubm90IGhhdmVcbiAqIG1vcmUgdGhhbiBvbmUgcm91dGVyIHNlcnZpY2UgYWN0aXZlLlxuICpcbiAqIFRoYXQgaXMgd2h5IHRoZXJlIGFyZSB0d28gd2F5cyB0byBjcmVhdGUgdGhlIG1vZHVsZTogYFJvdXRlck1vZHVsZS5mb3JSb290YCBhbmRcbiAqIGBSb3V0ZXJNb2R1bGUuZm9yQ2hpbGRgLlxuICpcbiAqICogYGZvclJvb3RgIGNyZWF0ZXMgYSBtb2R1bGUgdGhhdCBjb250YWlucyBhbGwgdGhlIGRpcmVjdGl2ZXMsIHRoZSBnaXZlbiByb3V0ZXMsIGFuZCB0aGUgcm91dGVyXG4gKiAgIHNlcnZpY2UgaXRzZWxmLlxuICogKiBgZm9yQ2hpbGRgIGNyZWF0ZXMgYSBtb2R1bGUgdGhhdCBjb250YWlucyBhbGwgdGhlIGRpcmVjdGl2ZXMgYW5kIHRoZSBnaXZlbiByb3V0ZXMsIGJ1dCBkb2VzIG5vdFxuICogICBpbmNsdWRlIHRoZSByb3V0ZXIgc2VydmljZS5cbiAqXG4gKiBXaGVuIHJlZ2lzdGVyZWQgYXQgdGhlIHJvb3QsIHRoZSBtb2R1bGUgc2hvdWxkIGJlIHVzZWQgYXMgZm9sbG93c1xuICpcbiAqIGBgYFxuICogQE5nTW9kdWxlKHtcbiAqICAgaW1wb3J0czogW1JvdXRlck1vZHVsZS5mb3JSb290KFJPVVRFUyldXG4gKiB9KVxuICogY2xhc3MgTXlOZ01vZHVsZSB7fVxuICogYGBgXG4gKlxuICogRm9yIHN1Ym1vZHVsZXMgYW5kIGxhenkgbG9hZGVkIHN1Ym1vZHVsZXMgdGhlIG1vZHVsZSBzaG91bGQgYmUgdXNlZCBhcyBmb2xsb3dzOlxuICpcbiAqIGBgYFxuICogQE5nTW9kdWxlKHtcbiAqICAgaW1wb3J0czogW1JvdXRlck1vZHVsZS5mb3JDaGlsZChST1VURVMpXVxuICogfSlcbiAqIGNsYXNzIE15TmdNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIEFkZHMgcm91dGVyIGRpcmVjdGl2ZXMgYW5kIHByb3ZpZGVycy5cbiAqXG4gKiBNYW5hZ2luZyBzdGF0ZSB0cmFuc2l0aW9ucyBpcyBvbmUgb2YgdGhlIGhhcmRlc3QgcGFydHMgb2YgYnVpbGRpbmcgYXBwbGljYXRpb25zLiBUaGlzIGlzXG4gKiBlc3BlY2lhbGx5IHRydWUgb24gdGhlIHdlYiwgd2hlcmUgeW91IGFsc28gbmVlZCB0byBlbnN1cmUgdGhhdCB0aGUgc3RhdGUgaXMgcmVmbGVjdGVkIGluIHRoZSBVUkwuXG4gKiBJbiBhZGRpdGlvbiwgd2Ugb2Z0ZW4gd2FudCB0byBzcGxpdCBhcHBsaWNhdGlvbnMgaW50byBtdWx0aXBsZSBidW5kbGVzIGFuZCBsb2FkIHRoZW0gb24gZGVtYW5kLlxuICogRG9pbmcgdGhpcyB0cmFuc3BhcmVudGx5IGlzIG5vdCB0cml2aWFsLlxuICpcbiAqIFRoZSBBbmd1bGFyIHJvdXRlciBzb2x2ZXMgdGhlc2UgcHJvYmxlbXMuIFVzaW5nIHRoZSByb3V0ZXIsIHlvdSBjYW4gZGVjbGFyYXRpdmVseSBzcGVjaWZ5XG4gKiBhcHBsaWNhdGlvbiBzdGF0ZXMsIG1hbmFnZSBzdGF0ZSB0cmFuc2l0aW9ucyB3aGlsZSB0YWtpbmcgY2FyZSBvZiB0aGUgVVJMLCBhbmQgbG9hZCBidW5kbGVzIG9uXG4gKiBkZW1hbmQuXG4gKlxuICogW1JlYWQgdGhpcyBkZXZlbG9wZXIgZ3VpZGVdKGh0dHBzOi8vYW5ndWxhci5pby9kb2NzL3RzL2xhdGVzdC9ndWlkZS9yb3V0ZXIuaHRtbCkgdG8gZ2V0IGFuXG4gKiBvdmVydmlldyBvZiBob3cgdGhlIHJvdXRlciBzaG91bGQgYmUgdXNlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBOZ01vZHVsZSh7XG4gIGRlY2xhcmF0aW9uczogUk9VVEVSX0RJUkVDVElWRVMsXG4gIGV4cG9ydHM6IFJPVVRFUl9ESVJFQ1RJVkVTLFxuICBlbnRyeUNvbXBvbmVudHM6IFtFbXB0eU91dGxldENvbXBvbmVudF1cbn0pXG5leHBvcnQgY2xhc3MgUm91dGVyTW9kdWxlIHtcbiAgLy8gTm90ZTogV2UgYXJlIGluamVjdGluZyB0aGUgUm91dGVyIHNvIGl0IGdldHMgY3JlYXRlZCBlYWdlcmx5Li4uXG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIEBJbmplY3QoUk9VVEVSX0ZPUlJPT1RfR1VBUkQpIGd1YXJkOiBhbnksIEBPcHRpb25hbCgpIHJvdXRlcjogUm91dGVyKSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbW9kdWxlIHdpdGggYWxsIHRoZSByb3V0ZXIgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzLiBJdCBhbHNvIG9wdGlvbmFsbHkgc2V0cyB1cCBhblxuICAgKiBhcHBsaWNhdGlvbiBsaXN0ZW5lciB0byBwZXJmb3JtIGFuIGluaXRpYWwgbmF2aWdhdGlvbi5cbiAgICpcbiAgICogT3B0aW9ucyAoc2VlIGBFeHRyYU9wdGlvbnNgKTpcbiAgICogKiBgZW5hYmxlVHJhY2luZ2AgbWFrZXMgdGhlIHJvdXRlciBsb2cgYWxsIGl0cyBpbnRlcm5hbCBldmVudHMgdG8gdGhlIGNvbnNvbGUuXG4gICAqICogYHVzZUhhc2hgIGVuYWJsZXMgdGhlIGxvY2F0aW9uIHN0cmF0ZWd5IHRoYXQgdXNlcyB0aGUgVVJMIGZyYWdtZW50IGluc3RlYWQgb2YgdGhlIGhpc3RvcnlcbiAgICogQVBJLlxuICAgKiAqIGBpbml0aWFsTmF2aWdhdGlvbmAgZGlzYWJsZXMgdGhlIGluaXRpYWwgbmF2aWdhdGlvbi5cbiAgICogKiBgZXJyb3JIYW5kbGVyYCBwcm92aWRlcyBhIGN1c3RvbSBlcnJvciBoYW5kbGVyLlxuICAgKiAqIGBwcmVsb2FkaW5nU3RyYXRlZ3lgIGNvbmZpZ3VyZXMgYSBwcmVsb2FkaW5nIHN0cmF0ZWd5IChzZWUgYFByZWxvYWRBbGxNb2R1bGVzYCkuXG4gICAqICogYG9uU2FtZVVybE5hdmlnYXRpb25gIGNvbmZpZ3VyZXMgaG93IHRoZSByb3V0ZXIgaGFuZGxlcyBuYXZpZ2F0aW9uIHRvIHRoZSBjdXJyZW50IFVSTC4gU2VlXG4gICAqIGBFeHRyYU9wdGlvbnNgIGZvciBtb3JlIGRldGFpbHMuXG4gICAqICogYHBhcmFtc0luaGVyaXRhbmNlU3RyYXRlZ3lgIGRlZmluZXMgaG93IHRoZSByb3V0ZXIgbWVyZ2VzIHBhcmFtcywgZGF0YSBhbmQgcmVzb2x2ZWQgZGF0YVxuICAgKiBmcm9tIHBhcmVudCB0byBjaGlsZCByb3V0ZXMuXG4gICAqL1xuICBzdGF0aWMgZm9yUm9vdChyb3V0ZXM6IFJvdXRlcywgY29uZmlnPzogRXh0cmFPcHRpb25zKTogTW9kdWxlV2l0aFByb3ZpZGVyczxSb3V0ZXJNb2R1bGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmdNb2R1bGU6IFJvdXRlck1vZHVsZSxcbiAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICBST1VURVJfUFJPVklERVJTLFxuICAgICAgICBwcm92aWRlUm91dGVzKHJvdXRlcyksXG4gICAgICAgIHtcbiAgICAgICAgICBwcm92aWRlOiBST1VURVJfRk9SUk9PVF9HVUFSRCxcbiAgICAgICAgICB1c2VGYWN0b3J5OiBwcm92aWRlRm9yUm9vdEd1YXJkLFxuICAgICAgICAgIGRlcHM6IFtbUm91dGVyLCBuZXcgT3B0aW9uYWwoKSwgbmV3IFNraXBTZWxmKCldXVxuICAgICAgICB9LFxuICAgICAgICB7cHJvdmlkZTogUk9VVEVSX0NPTkZJR1VSQVRJT04sIHVzZVZhbHVlOiBjb25maWcgPyBjb25maWcgOiB7fX0sXG4gICAgICAgIHtcbiAgICAgICAgICBwcm92aWRlOiBMb2NhdGlvblN0cmF0ZWd5LFxuICAgICAgICAgIHVzZUZhY3Rvcnk6IHByb3ZpZGVMb2NhdGlvblN0cmF0ZWd5LFxuICAgICAgICAgIGRlcHM6IFtcbiAgICAgICAgICAgIFBsYXRmb3JtTG9jYXRpb24sIFtuZXcgSW5qZWN0KEFQUF9CQVNFX0hSRUYpLCBuZXcgT3B0aW9uYWwoKV0sIFJPVVRFUl9DT05GSUdVUkFUSU9OXG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogUm91dGVyU2Nyb2xsZXIsXG4gICAgICAgICAgdXNlRmFjdG9yeTogY3JlYXRlUm91dGVyU2Nyb2xsZXIsXG4gICAgICAgICAgZGVwczogW1JvdXRlciwgVmlld3BvcnRTY3JvbGxlciwgUk9VVEVSX0NPTkZJR1VSQVRJT05dXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwcm92aWRlOiBQcmVsb2FkaW5nU3RyYXRlZ3ksXG4gICAgICAgICAgdXNlRXhpc3Rpbmc6IGNvbmZpZyAmJiBjb25maWcucHJlbG9hZGluZ1N0cmF0ZWd5ID8gY29uZmlnLnByZWxvYWRpbmdTdHJhdGVneSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTm9QcmVsb2FkaW5nXG4gICAgICAgIH0sXG4gICAgICAgIHtwcm92aWRlOiBOZ1Byb2JlVG9rZW4sIG11bHRpOiB0cnVlLCB1c2VGYWN0b3J5OiByb3V0ZXJOZ1Byb2JlVG9rZW59LFxuICAgICAgICBwcm92aWRlUm91dGVySW5pdGlhbGl6ZXIoKSxcbiAgICAgIF0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbW9kdWxlIHdpdGggYWxsIHRoZSByb3V0ZXIgZGlyZWN0aXZlcyBhbmQgYSBwcm92aWRlciByZWdpc3RlcmluZyByb3V0ZXMuXG4gICAqL1xuICBzdGF0aWMgZm9yQ2hpbGQocm91dGVzOiBSb3V0ZXMpOiBNb2R1bGVXaXRoUHJvdmlkZXJzPFJvdXRlck1vZHVsZT4ge1xuICAgIHJldHVybiB7bmdNb2R1bGU6IFJvdXRlck1vZHVsZSwgcHJvdmlkZXJzOiBbcHJvdmlkZVJvdXRlcyhyb3V0ZXMpXX07XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlclNjcm9sbGVyKFxuICAgIHJvdXRlcjogUm91dGVyLCB2aWV3cG9ydFNjcm9sbGVyOiBWaWV3cG9ydFNjcm9sbGVyLCBjb25maWc6IEV4dHJhT3B0aW9ucyk6IFJvdXRlclNjcm9sbGVyIHtcbiAgaWYgKGNvbmZpZy5zY3JvbGxPZmZzZXQpIHtcbiAgICB2aWV3cG9ydFNjcm9sbGVyLnNldE9mZnNldChjb25maWcuc2Nyb2xsT2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gbmV3IFJvdXRlclNjcm9sbGVyKHJvdXRlciwgdmlld3BvcnRTY3JvbGxlciwgY29uZmlnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVMb2NhdGlvblN0cmF0ZWd5KFxuICAgIHBsYXRmb3JtTG9jYXRpb25TdHJhdGVneTogUGxhdGZvcm1Mb2NhdGlvbiwgYmFzZUhyZWY6IHN0cmluZywgb3B0aW9uczogRXh0cmFPcHRpb25zID0ge30pIHtcbiAgcmV0dXJuIG9wdGlvbnMudXNlSGFzaCA/IG5ldyBIYXNoTG9jYXRpb25TdHJhdGVneShwbGF0Zm9ybUxvY2F0aW9uU3RyYXRlZ3ksIGJhc2VIcmVmKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgUGF0aExvY2F0aW9uU3RyYXRlZ3kocGxhdGZvcm1Mb2NhdGlvblN0cmF0ZWd5LCBiYXNlSHJlZik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlRm9yUm9vdEd1YXJkKHJvdXRlcjogUm91dGVyKTogYW55IHtcbiAgaWYgKHJvdXRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFJvdXRlck1vZHVsZS5mb3JSb290KCkgY2FsbGVkIHR3aWNlLiBMYXp5IGxvYWRlZCBtb2R1bGVzIHNob3VsZCB1c2UgUm91dGVyTW9kdWxlLmZvckNoaWxkKCkgaW5zdGVhZC5gKTtcbiAgfVxuICByZXR1cm4gJ2d1YXJkZWQnO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFJlZ2lzdGVycyByb3V0ZXMuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBATmdNb2R1bGUoe1xuICogICBpbXBvcnRzOiBbUm91dGVyTW9kdWxlLmZvckNoaWxkKFJPVVRFUyldLFxuICogICBwcm92aWRlcnM6IFtwcm92aWRlUm91dGVzKEVYVFJBX1JPVVRFUyldXG4gKiB9KVxuICogY2xhc3MgTXlOZ01vZHVsZSB7fVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVJvdXRlcyhyb3V0ZXM6IFJvdXRlcyk6IGFueSB7XG4gIHJldHVybiBbXG4gICAge3Byb3ZpZGU6IEFOQUxZWkVfRk9SX0VOVFJZX0NPTVBPTkVOVFMsIG11bHRpOiB0cnVlLCB1c2VWYWx1ZTogcm91dGVzfSxcbiAgICB7cHJvdmlkZTogUk9VVEVTLCBtdWx0aTogdHJ1ZSwgdXNlVmFsdWU6IHJvdXRlc30sXG4gIF07XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogUmVwcmVzZW50cyBhbiBvcHRpb24gdG8gY29uZmlndXJlIHdoZW4gdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBwZXJmb3JtZWQuXG4gKlxuICogKiAnZW5hYmxlZCcgLSB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uIHN0YXJ0cyBiZWZvcmUgdGhlIHJvb3QgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gKiBUaGUgYm9vdHN0cmFwIGlzIGJsb2NrZWQgdW50aWwgdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBjb21wbGV0ZS5cbiAqICogJ2Rpc2FibGVkJyAtIHRoZSBpbml0aWFsIG5hdmlnYXRpb24gaXMgbm90IHBlcmZvcm1lZC4gVGhlIGxvY2F0aW9uIGxpc3RlbmVyIGlzIHNldCB1cCBiZWZvcmVcbiAqIHRoZSByb290IGNvbXBvbmVudCBnZXRzIGNyZWF0ZWQuXG4gKiAqICdsZWdhY3lfZW5hYmxlZCctIHRoZSBpbml0aWFsIG5hdmlnYXRpb24gc3RhcnRzIGFmdGVyIHRoZSByb290IGNvbXBvbmVudCBoYXMgYmVlbiBjcmVhdGVkLlxuICogVGhlIGJvb3RzdHJhcCBpcyBub3QgYmxvY2tlZCB1bnRpbCB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uIGlzIGNvbXBsZXRlLiBAZGVwcmVjYXRlZFxuICogKiAnbGVnYWN5X2Rpc2FibGVkJy0gdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBub3QgcGVyZm9ybWVkLiBUaGUgbG9jYXRpb24gbGlzdGVuZXIgaXMgc2V0IHVwXG4gKiBhZnRlciBAZGVwcmVjYXRlZFxuICogdGhlIHJvb3QgY29tcG9uZW50IGdldHMgY3JlYXRlZC5cbiAqICogYHRydWVgIC0gc2FtZSBhcyAnbGVnYWN5X2VuYWJsZWQnLiBAZGVwcmVjYXRlZCBzaW5jZSB2NFxuICogKiBgZmFsc2VgIC0gc2FtZSBhcyAnbGVnYWN5X2Rpc2FibGVkJy4gQGRlcHJlY2F0ZWQgc2luY2UgdjRcbiAqXG4gKiBUaGUgJ2VuYWJsZWQnIG9wdGlvbiBzaG91bGQgYmUgdXNlZCBmb3IgYXBwbGljYXRpb25zIHVubGVzcyB0aGVyZSBpcyBhIHJlYXNvbiB0byBoYXZlXG4gKiBtb3JlIGNvbnRyb2wgb3ZlciB3aGVuIHRoZSByb3V0ZXIgc3RhcnRzIGl0cyBpbml0aWFsIG5hdmlnYXRpb24gZHVlIHRvIHNvbWUgY29tcGxleFxuICogaW5pdGlhbGl6YXRpb24gbG9naWMuIEluIHRoaXMgY2FzZSwgJ2Rpc2FibGVkJyBzaG91bGQgYmUgdXNlZC5cbiAqXG4gKiBUaGUgJ2xlZ2FjeV9lbmFibGVkJyBhbmQgJ2xlZ2FjeV9kaXNhYmxlZCcgc2hvdWxkIG5vdCBiZSB1c2VkIGZvciBuZXcgYXBwbGljYXRpb25zLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbE5hdmlnYXRpb24gPVxuICAgIHRydWUgfCBmYWxzZSB8ICdlbmFibGVkJyB8ICdkaXNhYmxlZCcgfCAnbGVnYWN5X2VuYWJsZWQnIHwgJ2xlZ2FjeV9kaXNhYmxlZCc7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogUmVwcmVzZW50cyBvcHRpb25zIHRvIGNvbmZpZ3VyZSB0aGUgcm91dGVyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeHRyYU9wdGlvbnMge1xuICAvKipcbiAgICogTWFrZXMgdGhlIHJvdXRlciBsb2cgYWxsIGl0cyBpbnRlcm5hbCBldmVudHMgdG8gdGhlIGNvbnNvbGUuXG4gICAqL1xuICBlbmFibGVUcmFjaW5nPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogRW5hYmxlcyB0aGUgbG9jYXRpb24gc3RyYXRlZ3kgdGhhdCB1c2VzIHRoZSBVUkwgZnJhZ21lbnQgaW5zdGVhZCBvZiB0aGUgaGlzdG9yeSBBUEkuXG4gICAqL1xuICB1c2VIYXNoPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogRGlzYWJsZXMgdGhlIGluaXRpYWwgbmF2aWdhdGlvbi5cbiAgICovXG4gIGluaXRpYWxOYXZpZ2F0aW9uPzogSW5pdGlhbE5hdmlnYXRpb247XG5cbiAgLyoqXG4gICAqIEEgY3VzdG9tIGVycm9yIGhhbmRsZXIuXG4gICAqL1xuICBlcnJvckhhbmRsZXI/OiBFcnJvckhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgYSBwcmVsb2FkaW5nIHN0cmF0ZWd5LiBTZWUgYFByZWxvYWRBbGxNb2R1bGVzYC5cbiAgICovXG4gIHByZWxvYWRpbmdTdHJhdGVneT86IGFueTtcblxuICAvKipcbiAgICogRGVmaW5lIHdoYXQgdGhlIHJvdXRlciBzaG91bGQgZG8gaWYgaXQgcmVjZWl2ZXMgYSBuYXZpZ2F0aW9uIHJlcXVlc3QgdG8gdGhlIGN1cnJlbnQgVVJMLlxuICAgKiBCeSBkZWZhdWx0LCB0aGUgcm91dGVyIHdpbGwgaWdub3JlIHRoaXMgbmF2aWdhdGlvbi4gSG93ZXZlciwgdGhpcyBwcmV2ZW50cyBmZWF0dXJlcyBzdWNoXG4gICAqIGFzIGEgXCJyZWZyZXNoXCIgYnV0dG9uLiBVc2UgdGhpcyBvcHRpb24gdG8gY29uZmlndXJlIHRoZSBiZWhhdmlvciB3aGVuIG5hdmlnYXRpbmcgdG8gdGhlXG4gICAqIGN1cnJlbnQgVVJMLiBEZWZhdWx0IGlzICdpZ25vcmUnLlxuICAgKi9cbiAgb25TYW1lVXJsTmF2aWdhdGlvbj86ICdyZWxvYWQnfCdpZ25vcmUnO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIGlmIHRoZSBzY3JvbGwgcG9zaXRpb24gbmVlZHMgdG8gYmUgcmVzdG9yZWQgd2hlbiBuYXZpZ2F0aW5nIGJhY2suXG4gICAqXG4gICAqICogJ2Rpc2FibGVkJy0tZG9lcyBub3RoaW5nIChkZWZhdWx0KS5cbiAgICogKiAndG9wJy0tc2V0IHRoZSBzY3JvbGwgcG9zaXRpb24gdG8gMCwwLi5cbiAgICogKiAnZW5hYmxlZCctLXNldCB0aGUgc2Nyb2xsIHBvc2l0aW9uIHRvIHRoZSBzdG9yZWQgcG9zaXRpb24uIFRoaXMgb3B0aW9uIHdpbGwgYmUgdGhlIGRlZmF1bHQgaW5cbiAgICogdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogV2hlbiBlbmFibGVkLCB0aGUgcm91dGVyIHN0b3JlcyBhbmQgcmVzdG9yZXMgc2Nyb2xsIHBvc2l0aW9ucyBkdXJpbmcgbmF2aWdhdGlvbi5cbiAgICogV2hlbiBuYXZpZ2F0aW5nIGZvcndhcmQsIHRoZSBzY3JvbGwgcG9zaXRpb24gd2lsbCBiZSBzZXQgdG8gWzAsIDBdLCBvciB0byB0aGUgYW5jaG9yXG4gICAqIGlmIG9uZSBpcyBwcm92aWRlZC5cbiAgICpcbiAgICogWW91IGNhbiBpbXBsZW1lbnQgY3VzdG9tIHNjcm9sbCByZXN0b3JhdGlvbiBiZWhhdmlvciBhcyBmb2xsb3dzLlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIEFwcE1vZHVsZSB7XG4gICAqICBjb25zdHJ1Y3Rvcihyb3V0ZXI6IFJvdXRlciwgdmlld3BvcnRTY3JvbGxlcjogVmlld3BvcnRTY3JvbGxlciwgc3RvcmU6IFN0b3JlPEFwcFN0YXRlPikge1xuICAgKiAgICByb3V0ZXIuZXZlbnRzLnBpcGUoZmlsdGVyKGUgPT4gZSBpbnN0YW5jZW9mIFNjcm9sbCksIHN3aXRjaE1hcChlID0+IHtcbiAgICogICAgICByZXR1cm4gc3RvcmUucGlwZShmaXJzdCgpLCB0aW1lb3V0KDIwMCksIG1hcCgoKSA9PiBlKSk7XG4gICAqICAgIH0pLnN1YnNjcmliZShlID0+IHtcbiAgICogICAgICBpZiAoZS5wb3NpdGlvbikge1xuICAgKiAgICAgICAgdmlld3BvcnRTY3JvbGxlci5zY3JvbGxUb1Bvc2l0aW9uKGUucG9zaXRpb24pO1xuICAgKiAgICAgIH0gZWxzZSBpZiAoZS5hbmNob3IpIHtcbiAgICogICAgICAgIHZpZXdwb3J0U2Nyb2xsZXIuc2Nyb2xsVG9BbmNob3IoZS5hbmNob3IpO1xuICAgKiAgICAgIH0gZWxzZSB7XG4gICAqICAgICAgICB2aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvUG9zaXRpb24oWzAsIDBdKTtcbiAgICogICAgICB9XG4gICAqICAgIH0pO1xuICAgKiAgfVxuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBZb3UgY2FuIGFsc28gaW1wbGVtZW50IGNvbXBvbmVudC1zcGVjaWZpYyBzY3JvbGxpbmcgbGlrZSB0aGlzOlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIExpc3RDb21wb25lbnQge1xuICAgKiAgIGxpc3Q6IGFueVtdO1xuICAgKiAgIGNvbnN0cnVjdG9yKHJvdXRlcjogUm91dGVyLCB2aWV3cG9ydFNjcm9sbGVyOiBWaWV3cG9ydFNjcm9sbGVyLCBmZXRjaGVyOiBMaXN0RmV0Y2hlcikge1xuICAgKiAgICAgY29uc3Qgc2Nyb2xsRXZlbnRzID0gcm91dGVyLmV2ZW50cy5maWx0ZXIoZSA9PiBlIGluc3RhbmNlb2YgU2Nyb2xsKTtcbiAgICogICAgIGxpc3RGZXRjaGVyLmZldGNoKCkucGlwZSh3aXRoTGF0ZXN0RnJvbShzY3JvbGxFdmVudHMpKS5zdWJzY3JpYmUoKFtsaXN0LCBlXSkgPT4ge1xuICAgKiAgICAgICB0aGlzLmxpc3QgPSBsaXN0O1xuICAgKiAgICAgICBpZiAoZS5wb3NpdGlvbikge1xuICAgKiAgICAgICAgIHZpZXdwb3J0U2Nyb2xsZXIuc2Nyb2xsVG9Qb3NpdGlvbihlLnBvc2l0aW9uKTtcbiAgICogICAgICAgfSBlbHNlIHtcbiAgICogICAgICAgICB2aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvUG9zaXRpb24oWzAsIDBdKTtcbiAgICogICAgICAgfVxuICAgKiAgICAgfSk7XG4gICAqICAgfVxuICAgKiB9XG4gICAqL1xuICBzY3JvbGxQb3NpdGlvblJlc3RvcmF0aW9uPzogJ2Rpc2FibGVkJ3wnZW5hYmxlZCd8J3RvcCc7XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZXMgaWYgdGhlIHJvdXRlciBzaG91bGQgc2Nyb2xsIHRvIHRoZSBlbGVtZW50IHdoZW4gdGhlIHVybCBoYXMgYSBmcmFnbWVudC5cbiAgICpcbiAgICogKiAnZGlzYWJsZWQnLS1kb2VzIG5vdGhpbmcgKGRlZmF1bHQpLlxuICAgKiAqICdlbmFibGVkJy0tc2Nyb2xscyB0byB0aGUgZWxlbWVudC4gVGhpcyBvcHRpb24gd2lsbCBiZSB0aGUgZGVmYXVsdCBpbiB0aGUgZnV0dXJlLlxuICAgKlxuICAgKiBBbmNob3Igc2Nyb2xsaW5nIGRvZXMgbm90IGhhcHBlbiBvbiAncG9wc3RhdGUnLiBJbnN0ZWFkLCB3ZSByZXN0b3JlIHRoZSBwb3NpdGlvblxuICAgKiB0aGF0IHdlIHN0b3JlZCBvciBzY3JvbGwgdG8gdGhlIHRvcC5cbiAgICovXG4gIGFuY2hvclNjcm9sbGluZz86ICdkaXNhYmxlZCd8J2VuYWJsZWQnO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIHRoZSBzY3JvbGwgb2Zmc2V0IHRoZSByb3V0ZXIgd2lsbCB1c2Ugd2hlbiBzY3JvbGxpbmcgdG8gYW4gZWxlbWVudC5cbiAgICpcbiAgICogV2hlbiBnaXZlbiBhIHR1cGxlIHdpdGggdHdvIG51bWJlcnMsIHRoZSByb3V0ZXIgd2lsbCBhbHdheXMgdXNlIHRoZSBudW1iZXJzLlxuICAgKiBXaGVuIGdpdmVuIGEgZnVuY3Rpb24sIHRoZSByb3V0ZXIgd2lsbCBpbnZva2UgdGhlIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgaXQgcmVzdG9yZXMgc2Nyb2xsXG4gICAqIHBvc2l0aW9uLlxuICAgKi9cbiAgc2Nyb2xsT2Zmc2V0PzogW251bWJlciwgbnVtYmVyXXwoKCkgPT4gW251bWJlciwgbnVtYmVyXSk7XG5cbiAgLyoqXG4gICAqIERlZmluZXMgaG93IHRoZSByb3V0ZXIgbWVyZ2VzIHBhcmFtcywgZGF0YSBhbmQgcmVzb2x2ZWQgZGF0YSBmcm9tIHBhcmVudCB0byBjaGlsZFxuICAgKiByb3V0ZXMuIEF2YWlsYWJsZSBvcHRpb25zIGFyZTpcbiAgICpcbiAgICogLSBgJ2VtcHR5T25seSdgLCB0aGUgZGVmYXVsdCwgb25seSBpbmhlcml0cyBwYXJlbnQgcGFyYW1zIGZvciBwYXRoLWxlc3Mgb3IgY29tcG9uZW50LWxlc3NcbiAgICogICByb3V0ZXMuXG4gICAqIC0gYCdhbHdheXMnYCwgZW5hYmxlcyB1bmNvbmRpdGlvbmFsIGluaGVyaXRhbmNlIG9mIHBhcmVudCBwYXJhbXMuXG4gICAqL1xuICBwYXJhbXNJbmhlcml0YW5jZVN0cmF0ZWd5PzogJ2VtcHR5T25seSd8J2Fsd2F5cyc7XG5cbiAgLyoqXG4gICAqIEEgY3VzdG9tIG1hbGZvcm1lZCB1cmkgZXJyb3IgaGFuZGxlciBmdW5jdGlvbi4gVGhpcyBoYW5kbGVyIGlzIGludm9rZWQgd2hlbiBlbmNvZGVkVVJJIGNvbnRhaW5zXG4gICAqIGludmFsaWQgY2hhcmFjdGVyIHNlcXVlbmNlcy4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMgdG8gcmVkaXJlY3QgdG8gdGhlIHJvb3QgdXJsIGRyb3BwaW5nXG4gICAqIGFueSBwYXRoIG9yIHBhcmFtIGluZm8uIFRoaXMgZnVuY3Rpb24gcGFzc2VzIHRocmVlIHBhcmFtZXRlcnM6XG4gICAqXG4gICAqIC0gYCdVUklFcnJvcidgIC0gRXJyb3IgdGhyb3duIHdoZW4gcGFyc2luZyBhIGJhZCBVUkxcbiAgICogLSBgJ1VybFNlcmlhbGl6ZXInYCAtIFVybFNlcmlhbGl6ZXIgdGhhdOKAmXMgY29uZmlndXJlZCB3aXRoIHRoZSByb3V0ZXIuXG4gICAqIC0gYCd1cmwnYCAtICBUaGUgbWFsZm9ybWVkIFVSTCB0aGF0IGNhdXNlZCB0aGUgVVJJRXJyb3JcbiAgICogKi9cbiAgbWFsZm9ybWVkVXJpRXJyb3JIYW5kbGVyPzpcbiAgICAgIChlcnJvcjogVVJJRXJyb3IsIHVybFNlcmlhbGl6ZXI6IFVybFNlcmlhbGl6ZXIsIHVybDogc3RyaW5nKSA9PiBVcmxUcmVlO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIHdoZW4gdGhlIHJvdXRlciB1cGRhdGVzIHRoZSBicm93c2VyIFVSTC4gVGhlIGRlZmF1bHQgYmVoYXZpb3IgaXMgdG8gdXBkYXRlIGFmdGVyXG4gICAqIHN1Y2Nlc3NmdWwgbmF2aWdhdGlvbi4gSG93ZXZlciwgc29tZSBhcHBsaWNhdGlvbnMgbWF5IHByZWZlciBhIG1vZGUgd2hlcmUgdGhlIFVSTCBnZXRzXG4gICAqIHVwZGF0ZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBuYXZpZ2F0aW9uLiBUaGUgbW9zdCBjb21tb24gdXNlIGNhc2Ugd291bGQgYmUgdXBkYXRpbmcgdGhlXG4gICAqIFVSTCBlYXJseSBzbyBpZiBuYXZpZ2F0aW9uIGZhaWxzLCB5b3UgY2FuIHNob3cgYW4gZXJyb3IgbWVzc2FnZSB3aXRoIHRoZSBVUkwgdGhhdCBmYWlsZWQuXG4gICAqIEF2YWlsYWJsZSBvcHRpb25zIGFyZTpcbiAgICpcbiAgICogLSBgJ2RlZmVycmVkJ2AsIHRoZSBkZWZhdWx0LCB1cGRhdGVzIHRoZSBicm93c2VyIFVSTCBhZnRlciBuYXZpZ2F0aW9uIGhhcyBmaW5pc2hlZC5cbiAgICogLSBgJ2VhZ2VyJ2AsIHVwZGF0ZXMgYnJvd3NlciBVUkwgYXQgdGhlIGJlZ2lubmluZyBvZiBuYXZpZ2F0aW9uLlxuICAgKi9cbiAgdXJsVXBkYXRlU3RyYXRlZ3k/OiAnZGVmZXJyZWQnfCdlYWdlcic7XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgYSBidWcgZml4IHRoYXQgY29ycmVjdHMgcmVsYXRpdmUgbGluayByZXNvbHV0aW9uIGluIGNvbXBvbmVudHMgd2l0aCBlbXB0eSBwYXRocy5cbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IHJvdXRlcyA9IFtcbiAgICogICB7XG4gICAqICAgICBwYXRoOiAnJyxcbiAgICogICAgIGNvbXBvbmVudDogQ29udGFpbmVyQ29tcG9uZW50LFxuICAgKiAgICAgY2hpbGRyZW46IFtcbiAgICogICAgICAgeyBwYXRoOiAnYScsIGNvbXBvbmVudDogQUNvbXBvbmVudCB9LFxuICAgKiAgICAgICB7IHBhdGg6ICdiJywgY29tcG9uZW50OiBCQ29tcG9uZW50IH0sXG4gICAqICAgICBdXG4gICAqICAgfVxuICAgKiBdO1xuICAgKiBgYGBcbiAgICpcbiAgICogRnJvbSB0aGUgYENvbnRhaW5lckNvbXBvbmVudGAsIHRoaXMgd2lsbCBub3Qgd29yazpcbiAgICpcbiAgICogYDxhIFtyb3V0ZXJMaW5rXT1cIlsnLi9hJ11cIj5MaW5rIHRvIEE8L2E+YFxuICAgKlxuICAgKiBIb3dldmVyLCB0aGlzIHdpbGwgd29yazpcbiAgICpcbiAgICogYDxhIFtyb3V0ZXJMaW5rXT1cIlsnLi4vYSddXCI+TGluayB0byBBPC9hPmBcbiAgICpcbiAgICogSW4gb3RoZXIgd29yZHMsIHlvdSdyZSByZXF1aXJlZCB0byB1c2UgYC4uL2AgcmF0aGVyIHRoYW4gYC4vYC4gVGhlIGN1cnJlbnQgZGVmYXVsdCBpbiB2NlxuICAgKiBpcyBgbGVnYWN5YCwgYW5kIHRoaXMgb3B0aW9uIHdpbGwgYmUgcmVtb3ZlZCBpbiB2NyB0byBkZWZhdWx0IHRvIHRoZSBjb3JyZWN0ZWQgYmVoYXZpb3IuXG4gICAqL1xuICByZWxhdGl2ZUxpbmtSZXNvbHV0aW9uPzogJ2xlZ2FjeSd8J2NvcnJlY3RlZCc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFJvdXRlcihcbiAgICByZWY6IEFwcGxpY2F0aW9uUmVmLCB1cmxTZXJpYWxpemVyOiBVcmxTZXJpYWxpemVyLCBjb250ZXh0czogQ2hpbGRyZW5PdXRsZXRDb250ZXh0cyxcbiAgICBsb2NhdGlvbjogTG9jYXRpb24sIGluamVjdG9yOiBJbmplY3RvciwgbG9hZGVyOiBOZ01vZHVsZUZhY3RvcnlMb2FkZXIsIGNvbXBpbGVyOiBDb21waWxlcixcbiAgICBjb25maWc6IFJvdXRlW11bXSwgb3B0czogRXh0cmFPcHRpb25zID0ge30sIHVybEhhbmRsaW5nU3RyYXRlZ3k/OiBVcmxIYW5kbGluZ1N0cmF0ZWd5LFxuICAgIHJvdXRlUmV1c2VTdHJhdGVneT86IFJvdXRlUmV1c2VTdHJhdGVneSkge1xuICBjb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKFxuICAgICAgbnVsbCwgdXJsU2VyaWFsaXplciwgY29udGV4dHMsIGxvY2F0aW9uLCBpbmplY3RvciwgbG9hZGVyLCBjb21waWxlciwgZmxhdHRlbihjb25maWcpKTtcblxuICBpZiAodXJsSGFuZGxpbmdTdHJhdGVneSkge1xuICAgIHJvdXRlci51cmxIYW5kbGluZ1N0cmF0ZWd5ID0gdXJsSGFuZGxpbmdTdHJhdGVneTtcbiAgfVxuXG4gIGlmIChyb3V0ZVJldXNlU3RyYXRlZ3kpIHtcbiAgICByb3V0ZXIucm91dGVSZXVzZVN0cmF0ZWd5ID0gcm91dGVSZXVzZVN0cmF0ZWd5O1xuICB9XG5cbiAgaWYgKG9wdHMuZXJyb3JIYW5kbGVyKSB7XG4gICAgcm91dGVyLmVycm9ySGFuZGxlciA9IG9wdHMuZXJyb3JIYW5kbGVyO1xuICB9XG5cbiAgaWYgKG9wdHMubWFsZm9ybWVkVXJpRXJyb3JIYW5kbGVyKSB7XG4gICAgcm91dGVyLm1hbGZvcm1lZFVyaUVycm9ySGFuZGxlciA9IG9wdHMubWFsZm9ybWVkVXJpRXJyb3JIYW5kbGVyO1xuICB9XG5cbiAgaWYgKG9wdHMuZW5hYmxlVHJhY2luZykge1xuICAgIGNvbnN0IGRvbSA9IGdldERPTSgpO1xuICAgIHJvdXRlci5ldmVudHMuc3Vic2NyaWJlKChlOiBSb3V0ZXJFdmVudCkgPT4ge1xuICAgICAgZG9tLmxvZ0dyb3VwKGBSb3V0ZXIgRXZlbnQ6ICR7KDxhbnk+ZS5jb25zdHJ1Y3RvcikubmFtZX1gKTtcbiAgICAgIGRvbS5sb2coZS50b1N0cmluZygpKTtcbiAgICAgIGRvbS5sb2coZSk7XG4gICAgICBkb20ubG9nR3JvdXBFbmQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChvcHRzLm9uU2FtZVVybE5hdmlnYXRpb24pIHtcbiAgICByb3V0ZXIub25TYW1lVXJsTmF2aWdhdGlvbiA9IG9wdHMub25TYW1lVXJsTmF2aWdhdGlvbjtcbiAgfVxuXG4gIGlmIChvcHRzLnBhcmFtc0luaGVyaXRhbmNlU3RyYXRlZ3kpIHtcbiAgICByb3V0ZXIucGFyYW1zSW5oZXJpdGFuY2VTdHJhdGVneSA9IG9wdHMucGFyYW1zSW5oZXJpdGFuY2VTdHJhdGVneTtcbiAgfVxuXG4gIGlmIChvcHRzLnVybFVwZGF0ZVN0cmF0ZWd5KSB7XG4gICAgcm91dGVyLnVybFVwZGF0ZVN0cmF0ZWd5ID0gb3B0cy51cmxVcGRhdGVTdHJhdGVneTtcbiAgfVxuXG4gIGlmIChvcHRzLnJlbGF0aXZlTGlua1Jlc29sdXRpb24pIHtcbiAgICByb3V0ZXIucmVsYXRpdmVMaW5rUmVzb2x1dGlvbiA9IG9wdHMucmVsYXRpdmVMaW5rUmVzb2x1dGlvbjtcbiAgfVxuXG4gIHJldHVybiByb3V0ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByb290Um91dGUocm91dGVyOiBSb3V0ZXIpOiBBY3RpdmF0ZWRSb3V0ZSB7XG4gIHJldHVybiByb3V0ZXIucm91dGVyU3RhdGUucm9vdDtcbn1cblxuLyoqXG4gKiBUbyBpbml0aWFsaXplIHRoZSByb3V0ZXIgcHJvcGVybHkgd2UgbmVlZCB0byBkbyBpbiB0d28gc3RlcHM6XG4gKlxuICogV2UgbmVlZCB0byBzdGFydCB0aGUgbmF2aWdhdGlvbiBpbiBhIEFQUF9JTklUSUFMSVpFUiB0byBibG9jayB0aGUgYm9vdHN0cmFwIGlmXG4gKiBhIHJlc29sdmVyIG9yIGEgZ3VhcmRzIGV4ZWN1dGVzIGFzeW5jaHJvbm91c2x5LiBTZWNvbmQsIHdlIG5lZWQgdG8gYWN0dWFsbHkgcnVuXG4gKiBhY3RpdmF0aW9uIGluIGEgQk9PVFNUUkFQX0xJU1RFTkVSLiBXZSB1dGlsaXplIHRoZSBhZnRlclByZWFjdGl2YXRpb25cbiAqIGhvb2sgcHJvdmlkZWQgYnkgdGhlIHJvdXRlciB0byBkbyB0aGF0LlxuICpcbiAqIFRoZSByb3V0ZXIgbmF2aWdhdGlvbiBzdGFydHMsIHJlYWNoZXMgdGhlIHBvaW50IHdoZW4gcHJlYWN0aXZhdGlvbiBpcyBkb25lLCBhbmQgdGhlblxuICogcGF1c2VzLiBJdCB3YWl0cyBmb3IgdGhlIGhvb2sgdG8gYmUgcmVzb2x2ZWQuIFdlIHRoZW4gcmVzb2x2ZSBpdCBvbmx5IGluIGEgYm9vdHN0cmFwIGxpc3RlbmVyLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgUm91dGVySW5pdGlhbGl6ZXIge1xuICBwcml2YXRlIGluaXROYXZpZ2F0aW9uOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgcmVzdWx0T2ZQcmVhY3RpdmF0aW9uRG9uZSA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgYXBwSW5pdGlhbGl6ZXIoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBwOiBQcm9taXNlPGFueT4gPSB0aGlzLmluamVjdG9yLmdldChMT0NBVElPTl9JTklUSUFMSVpFRCwgUHJvbWlzZS5yZXNvbHZlKG51bGwpKTtcbiAgICByZXR1cm4gcC50aGVuKCgpID0+IHtcbiAgICAgIGxldCByZXNvbHZlOiBGdW5jdGlvbiA9IG51bGwgITtcbiAgICAgIGNvbnN0IHJlcyA9IG5ldyBQcm9taXNlKHIgPT4gcmVzb2x2ZSA9IHIpO1xuICAgICAgY29uc3Qgcm91dGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUm91dGVyKTtcbiAgICAgIGNvbnN0IG9wdHMgPSB0aGlzLmluamVjdG9yLmdldChST1VURVJfQ09ORklHVVJBVElPTik7XG5cbiAgICAgIGlmICh0aGlzLmlzTGVnYWN5RGlzYWJsZWQob3B0cykgfHwgdGhpcy5pc0xlZ2FjeUVuYWJsZWQob3B0cykpIHtcbiAgICAgICAgcmVzb2x2ZSh0cnVlKTtcblxuICAgICAgfSBlbHNlIGlmIChvcHRzLmluaXRpYWxOYXZpZ2F0aW9uID09PSAnZGlzYWJsZWQnKSB7XG4gICAgICAgIHJvdXRlci5zZXRVcExvY2F0aW9uQ2hhbmdlTGlzdGVuZXIoKTtcbiAgICAgICAgcmVzb2x2ZSh0cnVlKTtcblxuICAgICAgfSBlbHNlIGlmIChvcHRzLmluaXRpYWxOYXZpZ2F0aW9uID09PSAnZW5hYmxlZCcpIHtcbiAgICAgICAgcm91dGVyLmhvb2tzLmFmdGVyUHJlYWN0aXZhdGlvbiA9ICgpID0+IHtcbiAgICAgICAgICAvLyBvbmx5IHRoZSBpbml0aWFsIG5hdmlnYXRpb24gc2hvdWxkIGJlIGRlbGF5ZWRcbiAgICAgICAgICBpZiAoIXRoaXMuaW5pdE5hdmlnYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdE5hdmlnYXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc3VsdE9mUHJlYWN0aXZhdGlvbkRvbmU7XG5cbiAgICAgICAgICAgIC8vIHN1YnNlcXVlbnQgbmF2aWdhdGlvbnMgc2hvdWxkIG5vdCBiZSBkZWxheWVkXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBvZiAobnVsbCkgYXMgYW55O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcm91dGVyLmluaXRpYWxOYXZpZ2F0aW9uKCk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpbml0aWFsTmF2aWdhdGlvbiBvcHRpb25zOiAnJHtvcHRzLmluaXRpYWxOYXZpZ2F0aW9ufSdgKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcbiAgfVxuXG4gIGJvb3RzdHJhcExpc3RlbmVyKGJvb3RzdHJhcHBlZENvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBvcHRzID0gdGhpcy5pbmplY3Rvci5nZXQoUk9VVEVSX0NPTkZJR1VSQVRJT04pO1xuICAgIGNvbnN0IHByZWxvYWRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJvdXRlclByZWxvYWRlcik7XG4gICAgY29uc3Qgcm91dGVyU2Nyb2xsZXIgPSB0aGlzLmluamVjdG9yLmdldChSb3V0ZXJTY3JvbGxlcik7XG4gICAgY29uc3Qgcm91dGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUm91dGVyKTtcbiAgICBjb25zdCByZWYgPSB0aGlzLmluamVjdG9yLmdldDxBcHBsaWNhdGlvblJlZj4oQXBwbGljYXRpb25SZWYpO1xuXG4gICAgaWYgKGJvb3RzdHJhcHBlZENvbXBvbmVudFJlZiAhPT0gcmVmLmNvbXBvbmVudHNbMF0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0xlZ2FjeUVuYWJsZWQob3B0cykpIHtcbiAgICAgIHJvdXRlci5pbml0aWFsTmF2aWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5pc0xlZ2FjeURpc2FibGVkKG9wdHMpKSB7XG4gICAgICByb3V0ZXIuc2V0VXBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKCk7XG4gICAgfVxuXG4gICAgcHJlbG9hZGVyLnNldFVwUHJlbG9hZGluZygpO1xuICAgIHJvdXRlclNjcm9sbGVyLmluaXQoKTtcbiAgICByb3V0ZXIucmVzZXRSb290Q29tcG9uZW50VHlwZShyZWYuY29tcG9uZW50VHlwZXNbMF0pO1xuICAgIHRoaXMucmVzdWx0T2ZQcmVhY3RpdmF0aW9uRG9uZS5uZXh0KG51bGwgISk7XG4gICAgdGhpcy5yZXN1bHRPZlByZWFjdGl2YXRpb25Eb25lLmNvbXBsZXRlKCk7XG4gIH1cblxuICBwcml2YXRlIGlzTGVnYWN5RW5hYmxlZChvcHRzOiBFeHRyYU9wdGlvbnMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gb3B0cy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gJ2xlZ2FjeV9lbmFibGVkJyB8fCBvcHRzLmluaXRpYWxOYXZpZ2F0aW9uID09PSB0cnVlIHx8XG4gICAgICAgIG9wdHMuaW5pdGlhbE5hdmlnYXRpb24gPT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHByaXZhdGUgaXNMZWdhY3lEaXNhYmxlZChvcHRzOiBFeHRyYU9wdGlvbnMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gb3B0cy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gJ2xlZ2FjeV9kaXNhYmxlZCcgfHwgb3B0cy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFwcEluaXRpYWxpemVyKHI6IFJvdXRlckluaXRpYWxpemVyKSB7XG4gIHJldHVybiByLmFwcEluaXRpYWxpemVyLmJpbmQocik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCb290c3RyYXBMaXN0ZW5lcihyOiBSb3V0ZXJJbml0aWFsaXplcikge1xuICByZXR1cm4gci5ib290c3RyYXBMaXN0ZW5lci5iaW5kKHIpO1xufVxuXG4vKipcbiAqIEEgdG9rZW4gZm9yIHRoZSByb3V0ZXIgaW5pdGlhbGl6ZXIgdGhhdCB3aWxsIGJlIGNhbGxlZCBhZnRlciB0aGUgYXBwIGlzIGJvb3RzdHJhcHBlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBST1VURVJfSU5JVElBTElaRVIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjwoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQ+KCdSb3V0ZXIgSW5pdGlhbGl6ZXInKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVSb3V0ZXJJbml0aWFsaXplcigpIHtcbiAgcmV0dXJuIFtcbiAgICBSb3V0ZXJJbml0aWFsaXplcixcbiAgICB7XG4gICAgICBwcm92aWRlOiBBUFBfSU5JVElBTElaRVIsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICAgIHVzZUZhY3Rvcnk6IGdldEFwcEluaXRpYWxpemVyLFxuICAgICAgZGVwczogW1JvdXRlckluaXRpYWxpemVyXVxuICAgIH0sXG4gICAge3Byb3ZpZGU6IFJPVVRFUl9JTklUSUFMSVpFUiwgdXNlRmFjdG9yeTogZ2V0Qm9vdHN0cmFwTGlzdGVuZXIsIGRlcHM6IFtSb3V0ZXJJbml0aWFsaXplcl19LFxuICAgIHtwcm92aWRlOiBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBtdWx0aTogdHJ1ZSwgdXNlRXhpc3Rpbmc6IFJPVVRFUl9JTklUSUFMSVpFUn0sXG4gIF07XG59XG4iXX0=