/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
/**
 * @description
 *
 * Contains a list of directives
 *
 *
 */
var ROUTER_DIRECTIVES = [RouterOutlet, RouterLink, RouterLinkWithHref, RouterLinkActive, EmptyOutletComponent];
/**
 * @description
 *
 * Is used in DI to configure the router.
 *
 * @publicApi
 */
export var ROUTER_CONFIGURATION = new InjectionToken('ROUTER_CONFIGURATION');
/**
 * @docsNotRequired
 */
export var ROUTER_FORROOT_GUARD = new InjectionToken('ROUTER_FORROOT_GUARD');
export var ROUTER_PROVIDERS = [
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
export function routerNgProbeToken() {
    return new NgProbeToken('Router', Router);
}
/**
 * @usageNotes
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
 * @NgModule({
 *   imports: [RouterModule.forRoot(ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * For submodules and lazy loaded submodules the module should be used as follows:
 *
 * ```
 * @NgModule({
 *   imports: [RouterModule.forChild(ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * @description
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
 * @publicApi
 */
var RouterModule = /** @class */ (function () {
    // Note: We are injecting the Router so it gets created eagerly...
    function RouterModule(guard, router) {
    }
    RouterModule_1 = RouterModule;
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
     */
    RouterModule.forRoot = function (routes, config) {
        return {
            ngModule: RouterModule_1,
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
    };
    /**
     * Creates a module with all the router directives and a provider registering routes.
     */
    RouterModule.forChild = function (routes) {
        return { ngModule: RouterModule_1, providers: [provideRoutes(routes)] };
    };
    var RouterModule_1;
    RouterModule = RouterModule_1 = tslib_1.__decorate([
        NgModule({
            declarations: ROUTER_DIRECTIVES,
            exports: ROUTER_DIRECTIVES,
            entryComponents: [EmptyOutletComponent]
        }),
        tslib_1.__param(0, Optional()), tslib_1.__param(0, Inject(ROUTER_FORROOT_GUARD)), tslib_1.__param(1, Optional()),
        tslib_1.__metadata("design:paramtypes", [Object, Router])
    ], RouterModule);
    return RouterModule;
}());
export { RouterModule };
export function createRouterScroller(router, viewportScroller, config) {
    if (config.scrollOffset) {
        viewportScroller.setOffset(config.scrollOffset);
    }
    return new RouterScroller(router, viewportScroller, config);
}
export function provideLocationStrategy(platformLocationStrategy, baseHref, options) {
    if (options === void 0) { options = {}; }
    return options.useHash ? new HashLocationStrategy(platformLocationStrategy, baseHref) :
        new PathLocationStrategy(platformLocationStrategy, baseHref);
}
export function provideForRootGuard(router) {
    if (router) {
        throw new Error("RouterModule.forRoot() called twice. Lazy loaded modules should use RouterModule.forChild() instead.");
    }
    return 'guarded';
}
/**
 * @description
 *
 * Registers routes.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * @NgModule({
 *   imports: [RouterModule.forChild(ROUTES)],
 *   providers: [provideRoutes(EXTRA_ROUTES)]
 * })
 * class MyNgModule {}
 * ```
 *
 * @publicApi
 */
export function provideRoutes(routes) {
    return [
        { provide: ANALYZE_FOR_ENTRY_COMPONENTS, multi: true, useValue: routes },
        { provide: ROUTES, multi: true, useValue: routes },
    ];
}
export function setupRouter(ref, urlSerializer, contexts, location, injector, loader, compiler, config, opts, urlHandlingStrategy, routeReuseStrategy) {
    if (opts === void 0) { opts = {}; }
    var router = new Router(null, urlSerializer, contexts, location, injector, loader, compiler, flatten(config));
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
        var dom_1 = getDOM();
        router.events.subscribe(function (e) {
            dom_1.logGroup("Router Event: " + e.constructor.name);
            dom_1.log(e.toString());
            dom_1.log(e);
            dom_1.logGroupEnd();
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
var RouterInitializer = /** @class */ (function () {
    function RouterInitializer(injector) {
        this.injector = injector;
        this.initNavigation = false;
        this.resultOfPreactivationDone = new Subject();
    }
    RouterInitializer.prototype.appInitializer = function () {
        var _this = this;
        var p = this.injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
        return p.then(function () {
            var resolve = null;
            var res = new Promise(function (r) { return resolve = r; });
            var router = _this.injector.get(Router);
            var opts = _this.injector.get(ROUTER_CONFIGURATION);
            if (_this.isLegacyDisabled(opts) || _this.isLegacyEnabled(opts)) {
                resolve(true);
            }
            else if (opts.initialNavigation === 'disabled') {
                router.setUpLocationChangeListener();
                resolve(true);
            }
            else if (opts.initialNavigation === 'enabled') {
                router.hooks.afterPreactivation = function () {
                    // only the initial navigation should be delayed
                    if (!_this.initNavigation) {
                        _this.initNavigation = true;
                        resolve(true);
                        return _this.resultOfPreactivationDone;
                        // subsequent navigations should not be delayed
                    }
                    else {
                        return of(null);
                    }
                };
                router.initialNavigation();
            }
            else {
                throw new Error("Invalid initialNavigation options: '" + opts.initialNavigation + "'");
            }
            return res;
        });
    };
    RouterInitializer.prototype.bootstrapListener = function (bootstrappedComponentRef) {
        var opts = this.injector.get(ROUTER_CONFIGURATION);
        var preloader = this.injector.get(RouterPreloader);
        var routerScroller = this.injector.get(RouterScroller);
        var router = this.injector.get(Router);
        var ref = this.injector.get(ApplicationRef);
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
        this.resultOfPreactivationDone.next(null);
        this.resultOfPreactivationDone.complete();
    };
    RouterInitializer.prototype.isLegacyEnabled = function (opts) {
        return opts.initialNavigation === 'legacy_enabled' || opts.initialNavigation === true ||
            opts.initialNavigation === undefined;
    };
    RouterInitializer.prototype.isLegacyDisabled = function (opts) {
        return opts.initialNavigation === 'legacy_disabled' || opts.initialNavigation === false;
    };
    RouterInitializer = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [Injector])
    ], RouterInitializer);
    return RouterInitializer;
}());
export { RouterInitializer };
export function getAppInitializer(r) {
    return r.appInitializer.bind(r);
}
export function getBootstrapListener(r) {
    return r.bootstrapListener.bind(r);
}
/**
 * A token for the router initializer that will be called after the app is bootstrapped.
 *
 * @publicApi
 */
export var ROUTER_INITIALIZER = new InjectionToken('Router Initializer');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX21vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci9zcmMvcm91dGVyX21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNoTCxPQUFPLEVBQUMsNEJBQTRCLEVBQUUsc0JBQXNCLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQWdCLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBdUIsUUFBUSxFQUFFLHFCQUFxQixFQUFFLFlBQVksRUFBRSxRQUFRLEVBQVksUUFBUSxFQUFFLHNCQUFzQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3BULE9BQU8sRUFBQyxPQUFPLElBQUksTUFBTSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDNUQsT0FBTyxFQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFFbEMsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFL0QsT0FBTyxFQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ2pFLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUV4RCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRCxPQUFPLEVBQWUsTUFBTSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSx3QkFB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QUNoRixDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBUFBfQkFTRV9IUkVGLCBIYXNoTG9jYXRpb25TdHJhdGVneSwgTE9DQVRJT05fSU5JVElBTElaRUQsIExvY2F0aW9uLCBMb2NhdGlvblN0cmF0ZWd5LCBQYXRoTG9jYXRpb25TdHJhdGVneSwgUGxhdGZvcm1Mb2NhdGlvbiwgVmlld3BvcnRTY3JvbGxlcn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7QU5BTFlaRV9GT1JfRU5UUllfQ09NUE9ORU5UUywgQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgQVBQX0lOSVRJQUxJWkVSLCBBcHBsaWNhdGlvblJlZiwgQ29tcGlsZXIsIENvbXBvbmVudFJlZiwgSW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZUZhY3RvcnlMb2FkZXIsIE5nUHJvYmVUb2tlbiwgT3B0aW9uYWwsIFByb3ZpZGVyLCBTa2lwU2VsZiwgU3lzdGVtSnNOZ01vZHVsZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge8m1Z2V0RE9NIGFzIGdldERPTX0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5pbXBvcnQge1N1YmplY3QsIG9mIH0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7RW1wdHlPdXRsZXRDb21wb25lbnR9IGZyb20gJy4vY29tcG9uZW50cy9lbXB0eV9vdXRsZXQnO1xuaW1wb3J0IHtSb3V0ZSwgUm91dGVzfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1JvdXRlckxpbmssIFJvdXRlckxpbmtXaXRoSHJlZn0gZnJvbSAnLi9kaXJlY3RpdmVzL3JvdXRlcl9saW5rJztcbmltcG9ydCB7Um91dGVyTGlua0FjdGl2ZX0gZnJvbSAnLi9kaXJlY3RpdmVzL3JvdXRlcl9saW5rX2FjdGl2ZSc7XG5pbXBvcnQge1JvdXRlck91dGxldH0gZnJvbSAnLi9kaXJlY3RpdmVzL3JvdXRlcl9vdXRsZXQnO1xuaW1wb3J0IHtSb3V0ZXJFdmVudH0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IHtSb3V0ZVJldXNlU3RyYXRlZ3l9IGZyb20gJy4vcm91dGVfcmV1c2Vfc3RyYXRlZ3knO1xuaW1wb3J0IHtFcnJvckhhbmRsZXIsIFJvdXRlcn0gZnJvbSAnLi9yb3V0ZXInO1xuaW1wb3J0IHtST1VURVN9IGZyb20gJy4vcm91dGVyX2NvbmZpZ19sb2FkZXInO1xuaW1wb3J0IHtDaGlsZHJlbk91dGxldENvbnRleHRzfSBmcm9tICcuL3JvdXRlcl9vdXRsZXRfY29udGV4dCc7XG5pbXBvcnQge05vUHJlbG9hZGluZywgUHJlbG9hZEFsbE1vZHVsZXMsIFByZWxvYWRpbmdTdHJhdGVneSwgUm91dGVyUHJlbG9hZGVyfSBmcm9tICcuL3JvdXRlcl9wcmVsb2FkZXInO1xuaW1wb3J0IHtSb3V0ZXJTY3JvbGxlcn0gZnJvbSAnLi9yb3V0ZXJfc2Nyb2xsZXInO1xuaW1wb3J0IHtBY3RpdmF0ZWRSb3V0ZX0gZnJvbSAnLi9yb3V0ZXJfc3RhdGUnO1xuaW1wb3J0IHtVcmxIYW5kbGluZ1N0cmF0ZWd5fSBmcm9tICcuL3VybF9oYW5kbGluZ19zdHJhdGVneSc7XG5pbXBvcnQge0RlZmF1bHRVcmxTZXJpYWxpemVyLCBVcmxTZXJpYWxpemVyLCBVcmxUcmVlfSBmcm9tICcuL3VybF90cmVlJztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi91dGlscy9jb2xsZWN0aW9uJztcblxuXG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogQ29udGFpbnMgYSBsaXN0IG9mIGRpcmVjdGl2ZXNcbiAqXG4gKlxuICovXG5jb25zdCBST1VURVJfRElSRUNUSVZFUyA9XG4gICAgW1JvdXRlck91dGxldCwgUm91dGVyTGluaywgUm91dGVyTGlua1dpdGhIcmVmLCBSb3V0ZXJMaW5rQWN0aXZlLCBFbXB0eU91dGxldENvbXBvbmVudF07XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogSXMgdXNlZCBpbiBESSB0byBjb25maWd1cmUgdGhlIHJvdXRlci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBST1VURVJfQ09ORklHVVJBVElPTiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxFeHRyYU9wdGlvbnM+KCdST1VURVJfQ09ORklHVVJBVElPTicpO1xuXG4vKipcbiAqIEBkb2NzTm90UmVxdWlyZWRcbiAqL1xuZXhwb3J0IGNvbnN0IFJPVVRFUl9GT1JST09UX0dVQVJEID0gbmV3IEluamVjdGlvblRva2VuPHZvaWQ+KCdST1VURVJfRk9SUk9PVF9HVUFSRCcpO1xuXG5leHBvcnQgY29uc3QgUk9VVEVSX1BST1ZJREVSUzogUHJvdmlkZXJbXSA9IFtcbiAgTG9jYXRpb24sXG4gIHtwcm92aWRlOiBVcmxTZXJpYWxpemVyLCB1c2VDbGFzczogRGVmYXVsdFVybFNlcmlhbGl6ZXJ9LFxuICB7XG4gICAgcHJvdmlkZTogUm91dGVyLFxuICAgIHVzZUZhY3Rvcnk6IHNldHVwUm91dGVyLFxuICAgIGRlcHM6IFtcbiAgICAgIEFwcGxpY2F0aW9uUmVmLCBVcmxTZXJpYWxpemVyLCBDaGlsZHJlbk91dGxldENvbnRleHRzLCBMb2NhdGlvbiwgSW5qZWN0b3IsXG4gICAgICBOZ01vZHVsZUZhY3RvcnlMb2FkZXIsIENvbXBpbGVyLCBST1VURVMsIFJPVVRFUl9DT05GSUdVUkFUSU9OLFxuICAgICAgW1VybEhhbmRsaW5nU3RyYXRlZ3ksIG5ldyBPcHRpb25hbCgpXSwgW1JvdXRlUmV1c2VTdHJhdGVneSwgbmV3IE9wdGlvbmFsKCldXG4gICAgXVxuICB9LFxuICBDaGlsZHJlbk91dGxldENvbnRleHRzLFxuICB7cHJvdmlkZTogQWN0aXZhdGVkUm91dGUsIHVzZUZhY3Rvcnk6IHJvb3RSb3V0ZSwgZGVwczogW1JvdXRlcl19LFxuICB7cHJvdmlkZTogTmdNb2R1bGVGYWN0b3J5TG9hZGVyLCB1c2VDbGFzczogU3lzdGVtSnNOZ01vZHVsZUxvYWRlcn0sXG4gIFJvdXRlclByZWxvYWRlcixcbiAgTm9QcmVsb2FkaW5nLFxuICBQcmVsb2FkQWxsTW9kdWxlcyxcbiAge3Byb3ZpZGU6IFJPVVRFUl9DT05GSUdVUkFUSU9OLCB1c2VWYWx1ZToge2VuYWJsZVRyYWNpbmc6IGZhbHNlfX0sXG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gcm91dGVyTmdQcm9iZVRva2VuKCkge1xuICByZXR1cm4gbmV3IE5nUHJvYmVUb2tlbignUm91dGVyJywgUm91dGVyKTtcbn1cblxuLyoqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFJvdXRlck1vZHVsZSBjYW4gYmUgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXM6IG9uY2UgcGVyIGxhemlseS1sb2FkZWQgYnVuZGxlLlxuICogU2luY2UgdGhlIHJvdXRlciBkZWFscyB3aXRoIGEgZ2xvYmFsIHNoYXJlZCByZXNvdXJjZS0tbG9jYXRpb24sIHdlIGNhbm5vdCBoYXZlXG4gKiBtb3JlIHRoYW4gb25lIHJvdXRlciBzZXJ2aWNlIGFjdGl2ZS5cbiAqXG4gKiBUaGF0IGlzIHdoeSB0aGVyZSBhcmUgdHdvIHdheXMgdG8gY3JlYXRlIHRoZSBtb2R1bGU6IGBSb3V0ZXJNb2R1bGUuZm9yUm9vdGAgYW5kXG4gKiBgUm91dGVyTW9kdWxlLmZvckNoaWxkYC5cbiAqXG4gKiAqIGBmb3JSb290YCBjcmVhdGVzIGEgbW9kdWxlIHRoYXQgY29udGFpbnMgYWxsIHRoZSBkaXJlY3RpdmVzLCB0aGUgZ2l2ZW4gcm91dGVzLCBhbmQgdGhlIHJvdXRlclxuICogICBzZXJ2aWNlIGl0c2VsZi5cbiAqICogYGZvckNoaWxkYCBjcmVhdGVzIGEgbW9kdWxlIHRoYXQgY29udGFpbnMgYWxsIHRoZSBkaXJlY3RpdmVzIGFuZCB0aGUgZ2l2ZW4gcm91dGVzLCBidXQgZG9lcyBub3RcbiAqICAgaW5jbHVkZSB0aGUgcm91dGVyIHNlcnZpY2UuXG4gKlxuICogV2hlbiByZWdpc3RlcmVkIGF0IHRoZSByb290LCB0aGUgbW9kdWxlIHNob3VsZCBiZSB1c2VkIGFzIGZvbGxvd3NcbiAqXG4gKiBgYGBcbiAqIEBOZ01vZHVsZSh7XG4gKiAgIGltcG9ydHM6IFtSb3V0ZXJNb2R1bGUuZm9yUm9vdChST1VURVMpXVxuICogfSlcbiAqIGNsYXNzIE15TmdNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEZvciBzdWJtb2R1bGVzIGFuZCBsYXp5IGxvYWRlZCBzdWJtb2R1bGVzIHRoZSBtb2R1bGUgc2hvdWxkIGJlIHVzZWQgYXMgZm9sbG93czpcbiAqXG4gKiBgYGBcbiAqIEBOZ01vZHVsZSh7XG4gKiAgIGltcG9ydHM6IFtSb3V0ZXJNb2R1bGUuZm9yQ2hpbGQoUk9VVEVTKV1cbiAqIH0pXG4gKiBjbGFzcyBNeU5nTW9kdWxlIHt9XG4gKiBgYGBcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBBZGRzIHJvdXRlciBkaXJlY3RpdmVzIGFuZCBwcm92aWRlcnMuXG4gKlxuICogTWFuYWdpbmcgc3RhdGUgdHJhbnNpdGlvbnMgaXMgb25lIG9mIHRoZSBoYXJkZXN0IHBhcnRzIG9mIGJ1aWxkaW5nIGFwcGxpY2F0aW9ucy4gVGhpcyBpc1xuICogZXNwZWNpYWxseSB0cnVlIG9uIHRoZSB3ZWIsIHdoZXJlIHlvdSBhbHNvIG5lZWQgdG8gZW5zdXJlIHRoYXQgdGhlIHN0YXRlIGlzIHJlZmxlY3RlZCBpbiB0aGUgVVJMLlxuICogSW4gYWRkaXRpb24sIHdlIG9mdGVuIHdhbnQgdG8gc3BsaXQgYXBwbGljYXRpb25zIGludG8gbXVsdGlwbGUgYnVuZGxlcyBhbmQgbG9hZCB0aGVtIG9uIGRlbWFuZC5cbiAqIERvaW5nIHRoaXMgdHJhbnNwYXJlbnRseSBpcyBub3QgdHJpdmlhbC5cbiAqXG4gKiBUaGUgQW5ndWxhciByb3V0ZXIgc29sdmVzIHRoZXNlIHByb2JsZW1zLiBVc2luZyB0aGUgcm91dGVyLCB5b3UgY2FuIGRlY2xhcmF0aXZlbHkgc3BlY2lmeVxuICogYXBwbGljYXRpb24gc3RhdGVzLCBtYW5hZ2Ugc3RhdGUgdHJhbnNpdGlvbnMgd2hpbGUgdGFraW5nIGNhcmUgb2YgdGhlIFVSTCwgYW5kIGxvYWQgYnVuZGxlcyBvblxuICogZGVtYW5kLlxuICpcbiAqIFtSZWFkIHRoaXMgZGV2ZWxvcGVyIGd1aWRlXShodHRwczovL2FuZ3VsYXIuaW8vZG9jcy90cy9sYXRlc3QvZ3VpZGUvcm91dGVyLmh0bWwpIHRvIGdldCBhblxuICogb3ZlcnZpZXcgb2YgaG93IHRoZSByb3V0ZXIgc2hvdWxkIGJlIHVzZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ATmdNb2R1bGUoe1xuICBkZWNsYXJhdGlvbnM6IFJPVVRFUl9ESVJFQ1RJVkVTLFxuICBleHBvcnRzOiBST1VURVJfRElSRUNUSVZFUyxcbiAgZW50cnlDb21wb25lbnRzOiBbRW1wdHlPdXRsZXRDb21wb25lbnRdXG59KVxuZXhwb3J0IGNsYXNzIFJvdXRlck1vZHVsZSB7XG4gIC8vIE5vdGU6IFdlIGFyZSBpbmplY3RpbmcgdGhlIFJvdXRlciBzbyBpdCBnZXRzIGNyZWF0ZWQgZWFnZXJseS4uLlxuICBjb25zdHJ1Y3RvcihAT3B0aW9uYWwoKSBASW5qZWN0KFJPVVRFUl9GT1JST09UX0dVQVJEKSBndWFyZDogYW55LCBAT3B0aW9uYWwoKSByb3V0ZXI6IFJvdXRlcikge31cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG1vZHVsZSB3aXRoIGFsbCB0aGUgcm91dGVyIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcy4gSXQgYWxzbyBvcHRpb25hbGx5IHNldHMgdXAgYW5cbiAgICogYXBwbGljYXRpb24gbGlzdGVuZXIgdG8gcGVyZm9ybSBhbiBpbml0aWFsIG5hdmlnYXRpb24uXG4gICAqXG4gICAqIE9wdGlvbnMgKHNlZSBgRXh0cmFPcHRpb25zYCk6XG4gICAqICogYGVuYWJsZVRyYWNpbmdgIG1ha2VzIHRoZSByb3V0ZXIgbG9nIGFsbCBpdHMgaW50ZXJuYWwgZXZlbnRzIHRvIHRoZSBjb25zb2xlLlxuICAgKiAqIGB1c2VIYXNoYCBlbmFibGVzIHRoZSBsb2NhdGlvbiBzdHJhdGVneSB0aGF0IHVzZXMgdGhlIFVSTCBmcmFnbWVudCBpbnN0ZWFkIG9mIHRoZSBoaXN0b3J5XG4gICAqIEFQSS5cbiAgICogKiBgaW5pdGlhbE5hdmlnYXRpb25gIGRpc2FibGVzIHRoZSBpbml0aWFsIG5hdmlnYXRpb24uXG4gICAqICogYGVycm9ySGFuZGxlcmAgcHJvdmlkZXMgYSBjdXN0b20gZXJyb3IgaGFuZGxlci5cbiAgICogKiBgcHJlbG9hZGluZ1N0cmF0ZWd5YCBjb25maWd1cmVzIGEgcHJlbG9hZGluZyBzdHJhdGVneSAoc2VlIGBQcmVsb2FkQWxsTW9kdWxlc2ApLlxuICAgKiAqIGBvblNhbWVVcmxOYXZpZ2F0aW9uYCBjb25maWd1cmVzIGhvdyB0aGUgcm91dGVyIGhhbmRsZXMgbmF2aWdhdGlvbiB0byB0aGUgY3VycmVudCBVUkwuIFNlZVxuICAgKiBgRXh0cmFPcHRpb25zYCBmb3IgbW9yZSBkZXRhaWxzLlxuICAgKiAqIGBwYXJhbXNJbmhlcml0YW5jZVN0cmF0ZWd5YCBkZWZpbmVzIGhvdyB0aGUgcm91dGVyIG1lcmdlcyBwYXJhbXMsIGRhdGEgYW5kIHJlc29sdmVkIGRhdGFcbiAgICogZnJvbSBwYXJlbnQgdG8gY2hpbGQgcm91dGVzLlxuICAgKi9cbiAgc3RhdGljIGZvclJvb3Qocm91dGVzOiBSb3V0ZXMsIGNvbmZpZz86IEV4dHJhT3B0aW9ucyk6IE1vZHVsZVdpdGhQcm92aWRlcnM8Um91dGVyTW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBSb3V0ZXJNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgUk9VVEVSX1BST1ZJREVSUyxcbiAgICAgICAgcHJvdmlkZVJvdXRlcyhyb3V0ZXMpLFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogUk9VVEVSX0ZPUlJPT1RfR1VBUkQsXG4gICAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZUZvclJvb3RHdWFyZCxcbiAgICAgICAgICBkZXBzOiBbW1JvdXRlciwgbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpXV1cbiAgICAgICAgfSxcbiAgICAgICAge3Byb3ZpZGU6IFJPVVRFUl9DT05GSUdVUkFUSU9OLCB1c2VWYWx1ZTogY29uZmlnID8gY29uZmlnIDoge319LFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogTG9jYXRpb25TdHJhdGVneSxcbiAgICAgICAgICB1c2VGYWN0b3J5OiBwcm92aWRlTG9jYXRpb25TdHJhdGVneSxcbiAgICAgICAgICBkZXBzOiBbXG4gICAgICAgICAgICBQbGF0Zm9ybUxvY2F0aW9uLCBbbmV3IEluamVjdChBUFBfQkFTRV9IUkVGKSwgbmV3IE9wdGlvbmFsKCldLCBST1VURVJfQ09ORklHVVJBVElPTlxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHByb3ZpZGU6IFJvdXRlclNjcm9sbGVyLFxuICAgICAgICAgIHVzZUZhY3Rvcnk6IGNyZWF0ZVJvdXRlclNjcm9sbGVyLFxuICAgICAgICAgIGRlcHM6IFtSb3V0ZXIsIFZpZXdwb3J0U2Nyb2xsZXIsIFJPVVRFUl9DT05GSUdVUkFUSU9OXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogUHJlbG9hZGluZ1N0cmF0ZWd5LFxuICAgICAgICAgIHVzZUV4aXN0aW5nOiBjb25maWcgJiYgY29uZmlnLnByZWxvYWRpbmdTdHJhdGVneSA/IGNvbmZpZy5wcmVsb2FkaW5nU3RyYXRlZ3kgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE5vUHJlbG9hZGluZ1xuICAgICAgICB9LFxuICAgICAgICB7cHJvdmlkZTogTmdQcm9iZVRva2VuLCBtdWx0aTogdHJ1ZSwgdXNlRmFjdG9yeTogcm91dGVyTmdQcm9iZVRva2VufSxcbiAgICAgICAgcHJvdmlkZVJvdXRlckluaXRpYWxpemVyKCksXG4gICAgICBdLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG1vZHVsZSB3aXRoIGFsbCB0aGUgcm91dGVyIGRpcmVjdGl2ZXMgYW5kIGEgcHJvdmlkZXIgcmVnaXN0ZXJpbmcgcm91dGVzLlxuICAgKi9cbiAgc3RhdGljIGZvckNoaWxkKHJvdXRlczogUm91dGVzKTogTW9kdWxlV2l0aFByb3ZpZGVyczxSb3V0ZXJNb2R1bGU+IHtcbiAgICByZXR1cm4ge25nTW9kdWxlOiBSb3V0ZXJNb2R1bGUsIHByb3ZpZGVyczogW3Byb3ZpZGVSb3V0ZXMocm91dGVzKV19O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb3V0ZXJTY3JvbGxlcihcbiAgICByb3V0ZXI6IFJvdXRlciwgdmlld3BvcnRTY3JvbGxlcjogVmlld3BvcnRTY3JvbGxlciwgY29uZmlnOiBFeHRyYU9wdGlvbnMpOiBSb3V0ZXJTY3JvbGxlciB7XG4gIGlmIChjb25maWcuc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmlld3BvcnRTY3JvbGxlci5zZXRPZmZzZXQoY29uZmlnLnNjcm9sbE9mZnNldCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBSb3V0ZXJTY3JvbGxlcihyb3V0ZXIsIHZpZXdwb3J0U2Nyb2xsZXIsIGNvbmZpZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlTG9jYXRpb25TdHJhdGVneShcbiAgICBwbGF0Zm9ybUxvY2F0aW9uU3RyYXRlZ3k6IFBsYXRmb3JtTG9jYXRpb24sIGJhc2VIcmVmOiBzdHJpbmcsIG9wdGlvbnM6IEV4dHJhT3B0aW9ucyA9IHt9KSB7XG4gIHJldHVybiBvcHRpb25zLnVzZUhhc2ggPyBuZXcgSGFzaExvY2F0aW9uU3RyYXRlZ3kocGxhdGZvcm1Mb2NhdGlvblN0cmF0ZWd5LCBiYXNlSHJlZikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFBhdGhMb2NhdGlvblN0cmF0ZWd5KHBsYXRmb3JtTG9jYXRpb25TdHJhdGVneSwgYmFzZUhyZWYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUZvclJvb3RHdWFyZChyb3V0ZXI6IFJvdXRlcik6IGFueSB7XG4gIGlmIChyb3V0ZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBSb3V0ZXJNb2R1bGUuZm9yUm9vdCgpIGNhbGxlZCB0d2ljZS4gTGF6eSBsb2FkZWQgbW9kdWxlcyBzaG91bGQgdXNlIFJvdXRlck1vZHVsZS5mb3JDaGlsZCgpIGluc3RlYWQuYCk7XG4gIH1cbiAgcmV0dXJuICdndWFyZGVkJztcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBSZWdpc3RlcnMgcm91dGVzLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogQE5nTW9kdWxlKHtcbiAqICAgaW1wb3J0czogW1JvdXRlck1vZHVsZS5mb3JDaGlsZChST1VURVMpXSxcbiAqICAgcHJvdmlkZXJzOiBbcHJvdmlkZVJvdXRlcyhFWFRSQV9ST1VURVMpXVxuICogfSlcbiAqIGNsYXNzIE15TmdNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVSb3V0ZXMocm91dGVzOiBSb3V0ZXMpOiBhbnkge1xuICByZXR1cm4gW1xuICAgIHtwcm92aWRlOiBBTkFMWVpFX0ZPUl9FTlRSWV9DT01QT05FTlRTLCBtdWx0aTogdHJ1ZSwgdXNlVmFsdWU6IHJvdXRlc30sXG4gICAge3Byb3ZpZGU6IFJPVVRFUywgbXVsdGk6IHRydWUsIHVzZVZhbHVlOiByb3V0ZXN9LFxuICBdO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFJlcHJlc2VudHMgYW4gb3B0aW9uIHRvIGNvbmZpZ3VyZSB3aGVuIHRoZSBpbml0aWFsIG5hdmlnYXRpb24gaXMgcGVyZm9ybWVkLlxuICpcbiAqICogJ2VuYWJsZWQnIC0gdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBzdGFydHMgYmVmb3JlIHRoZSByb290IGNvbXBvbmVudCBpcyBjcmVhdGVkLlxuICogVGhlIGJvb3RzdHJhcCBpcyBibG9ja2VkIHVudGlsIHRoZSBpbml0aWFsIG5hdmlnYXRpb24gaXMgY29tcGxldGUuXG4gKiAqICdkaXNhYmxlZCcgLSB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uIGlzIG5vdCBwZXJmb3JtZWQuIFRoZSBsb2NhdGlvbiBsaXN0ZW5lciBpcyBzZXQgdXAgYmVmb3JlXG4gKiB0aGUgcm9vdCBjb21wb25lbnQgZ2V0cyBjcmVhdGVkLlxuICogKiAnbGVnYWN5X2VuYWJsZWQnLSB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uIHN0YXJ0cyBhZnRlciB0aGUgcm9vdCBjb21wb25lbnQgaGFzIGJlZW4gY3JlYXRlZC5cbiAqIFRoZSBib290c3RyYXAgaXMgbm90IGJsb2NrZWQgdW50aWwgdGhlIGluaXRpYWwgbmF2aWdhdGlvbiBpcyBjb21wbGV0ZS4gQGRlcHJlY2F0ZWRcbiAqICogJ2xlZ2FjeV9kaXNhYmxlZCctIHRoZSBpbml0aWFsIG5hdmlnYXRpb24gaXMgbm90IHBlcmZvcm1lZC4gVGhlIGxvY2F0aW9uIGxpc3RlbmVyIGlzIHNldCB1cFxuICogYWZ0ZXIgQGRlcHJlY2F0ZWRcbiAqIHRoZSByb290IGNvbXBvbmVudCBnZXRzIGNyZWF0ZWQuXG4gKiAqIGB0cnVlYCAtIHNhbWUgYXMgJ2xlZ2FjeV9lbmFibGVkJy4gQGRlcHJlY2F0ZWQgc2luY2UgdjRcbiAqICogYGZhbHNlYCAtIHNhbWUgYXMgJ2xlZ2FjeV9kaXNhYmxlZCcuIEBkZXByZWNhdGVkIHNpbmNlIHY0XG4gKlxuICogVGhlICdlbmFibGVkJyBvcHRpb24gc2hvdWxkIGJlIHVzZWQgZm9yIGFwcGxpY2F0aW9ucyB1bmxlc3MgdGhlcmUgaXMgYSByZWFzb24gdG8gaGF2ZVxuICogbW9yZSBjb250cm9sIG92ZXIgd2hlbiB0aGUgcm91dGVyIHN0YXJ0cyBpdHMgaW5pdGlhbCBuYXZpZ2F0aW9uIGR1ZSB0byBzb21lIGNvbXBsZXhcbiAqIGluaXRpYWxpemF0aW9uIGxvZ2ljLiBJbiB0aGlzIGNhc2UsICdkaXNhYmxlZCcgc2hvdWxkIGJlIHVzZWQuXG4gKlxuICogVGhlICdsZWdhY3lfZW5hYmxlZCcgYW5kICdsZWdhY3lfZGlzYWJsZWQnIHNob3VsZCBub3QgYmUgdXNlZCBmb3IgbmV3IGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxOYXZpZ2F0aW9uID1cbiAgICB0cnVlIHwgZmFsc2UgfCAnZW5hYmxlZCcgfCAnZGlzYWJsZWQnIHwgJ2xlZ2FjeV9lbmFibGVkJyB8ICdsZWdhY3lfZGlzYWJsZWQnO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFJlcHJlc2VudHMgb3B0aW9ucyB0byBjb25maWd1cmUgdGhlIHJvdXRlci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXh0cmFPcHRpb25zIHtcbiAgLyoqXG4gICAqIE1ha2VzIHRoZSByb3V0ZXIgbG9nIGFsbCBpdHMgaW50ZXJuYWwgZXZlbnRzIHRvIHRoZSBjb25zb2xlLlxuICAgKi9cbiAgZW5hYmxlVHJhY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgdGhlIGxvY2F0aW9uIHN0cmF0ZWd5IHRoYXQgdXNlcyB0aGUgVVJMIGZyYWdtZW50IGluc3RlYWQgb2YgdGhlIGhpc3RvcnkgQVBJLlxuICAgKi9cbiAgdXNlSGFzaD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIERpc2FibGVzIHRoZSBpbml0aWFsIG5hdmlnYXRpb24uXG4gICAqL1xuICBpbml0aWFsTmF2aWdhdGlvbj86IEluaXRpYWxOYXZpZ2F0aW9uO1xuXG4gIC8qKlxuICAgKiBBIGN1c3RvbSBlcnJvciBoYW5kbGVyLlxuICAgKi9cbiAgZXJyb3JIYW5kbGVyPzogRXJyb3JIYW5kbGVyO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIGEgcHJlbG9hZGluZyBzdHJhdGVneS4gU2VlIGBQcmVsb2FkQWxsTW9kdWxlc2AuXG4gICAqL1xuICBwcmVsb2FkaW5nU3RyYXRlZ3k/OiBhbnk7XG5cbiAgLyoqXG4gICAqIERlZmluZSB3aGF0IHRoZSByb3V0ZXIgc2hvdWxkIGRvIGlmIGl0IHJlY2VpdmVzIGEgbmF2aWdhdGlvbiByZXF1ZXN0IHRvIHRoZSBjdXJyZW50IFVSTC5cbiAgICogQnkgZGVmYXVsdCwgdGhlIHJvdXRlciB3aWxsIGlnbm9yZSB0aGlzIG5hdmlnYXRpb24uIEhvd2V2ZXIsIHRoaXMgcHJldmVudHMgZmVhdHVyZXMgc3VjaFxuICAgKiBhcyBhIFwicmVmcmVzaFwiIGJ1dHRvbi4gVXNlIHRoaXMgb3B0aW9uIHRvIGNvbmZpZ3VyZSB0aGUgYmVoYXZpb3Igd2hlbiBuYXZpZ2F0aW5nIHRvIHRoZVxuICAgKiBjdXJyZW50IFVSTC4gRGVmYXVsdCBpcyAnaWdub3JlJy5cbiAgICovXG4gIG9uU2FtZVVybE5hdmlnYXRpb24/OiAncmVsb2FkJ3wnaWdub3JlJztcblxuICAvKipcbiAgICogQ29uZmlndXJlcyBpZiB0aGUgc2Nyb2xsIHBvc2l0aW9uIG5lZWRzIHRvIGJlIHJlc3RvcmVkIHdoZW4gbmF2aWdhdGluZyBiYWNrLlxuICAgKlxuICAgKiAqICdkaXNhYmxlZCctLWRvZXMgbm90aGluZyAoZGVmYXVsdCkuXG4gICAqICogJ3RvcCctLXNldCB0aGUgc2Nyb2xsIHBvc2l0aW9uIHRvIDAsMC4uXG4gICAqICogJ2VuYWJsZWQnLS1zZXQgdGhlIHNjcm9sbCBwb3NpdGlvbiB0byB0aGUgc3RvcmVkIHBvc2l0aW9uLiBUaGlzIG9wdGlvbiB3aWxsIGJlIHRoZSBkZWZhdWx0IGluXG4gICAqIHRoZSBmdXR1cmUuXG4gICAqXG4gICAqIFdoZW4gZW5hYmxlZCwgdGhlIHJvdXRlciBzdG9yZXMgYW5kIHJlc3RvcmVzIHNjcm9sbCBwb3NpdGlvbnMgZHVyaW5nIG5hdmlnYXRpb24uXG4gICAqIFdoZW4gbmF2aWdhdGluZyBmb3J3YXJkLCB0aGUgc2Nyb2xsIHBvc2l0aW9uIHdpbGwgYmUgc2V0IHRvIFswLCAwXSwgb3IgdG8gdGhlIGFuY2hvclxuICAgKiBpZiBvbmUgaXMgcHJvdmlkZWQuXG4gICAqXG4gICAqIFlvdSBjYW4gaW1wbGVtZW50IGN1c3RvbSBzY3JvbGwgcmVzdG9yYXRpb24gYmVoYXZpb3IgYXMgZm9sbG93cy5cbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBBcHBNb2R1bGUge1xuICAgKiAgY29uc3RydWN0b3Iocm91dGVyOiBSb3V0ZXIsIHZpZXdwb3J0U2Nyb2xsZXI6IFZpZXdwb3J0U2Nyb2xsZXIsIHN0b3JlOiBTdG9yZTxBcHBTdGF0ZT4pIHtcbiAgICogICAgcm91dGVyLmV2ZW50cy5waXBlKGZpbHRlcihlID0+IGUgaW5zdGFuY2VvZiBTY3JvbGwpLCBzd2l0Y2hNYXAoZSA9PiB7XG4gICAqICAgICAgcmV0dXJuIHN0b3JlLnBpcGUoZmlyc3QoKSwgdGltZW91dCgyMDApLCBtYXAoKCkgPT4gZSkpO1xuICAgKiAgICB9KS5zdWJzY3JpYmUoZSA9PiB7XG4gICAqICAgICAgaWYgKGUucG9zaXRpb24pIHtcbiAgICogICAgICAgIHZpZXdwb3J0U2Nyb2xsZXIuc2Nyb2xsVG9Qb3NpdGlvbihlLnBvc2l0aW9uKTtcbiAgICogICAgICB9IGVsc2UgaWYgKGUuYW5jaG9yKSB7XG4gICAqICAgICAgICB2aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvQW5jaG9yKGUuYW5jaG9yKTtcbiAgICogICAgICB9IGVsc2Uge1xuICAgKiAgICAgICAgdmlld3BvcnRTY3JvbGxlci5zY3JvbGxUb1Bvc2l0aW9uKFswLCAwXSk7XG4gICAqICAgICAgfVxuICAgKiAgICB9KTtcbiAgICogIH1cbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogWW91IGNhbiBhbHNvIGltcGxlbWVudCBjb21wb25lbnQtc3BlY2lmaWMgc2Nyb2xsaW5nIGxpa2UgdGhpczpcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBMaXN0Q29tcG9uZW50IHtcbiAgICogICBsaXN0OiBhbnlbXTtcbiAgICogICBjb25zdHJ1Y3Rvcihyb3V0ZXI6IFJvdXRlciwgdmlld3BvcnRTY3JvbGxlcjogVmlld3BvcnRTY3JvbGxlciwgZmV0Y2hlcjogTGlzdEZldGNoZXIpIHtcbiAgICogICAgIGNvbnN0IHNjcm9sbEV2ZW50cyA9IHJvdXRlci5ldmVudHMuZmlsdGVyKGUgPT4gZSBpbnN0YW5jZW9mIFNjcm9sbCk7XG4gICAqICAgICBsaXN0RmV0Y2hlci5mZXRjaCgpLnBpcGUod2l0aExhdGVzdEZyb20oc2Nyb2xsRXZlbnRzKSkuc3Vic2NyaWJlKChbbGlzdCwgZV0pID0+IHtcbiAgICogICAgICAgdGhpcy5saXN0ID0gbGlzdDtcbiAgICogICAgICAgaWYgKGUucG9zaXRpb24pIHtcbiAgICogICAgICAgICB2aWV3cG9ydFNjcm9sbGVyLnNjcm9sbFRvUG9zaXRpb24oZS5wb3NpdGlvbik7XG4gICAqICAgICAgIH0gZWxzZSB7XG4gICAqICAgICAgICAgdmlld3BvcnRTY3JvbGxlci5zY3JvbGxUb1Bvc2l0aW9uKFswLCAwXSk7XG4gICAqICAgICAgIH1cbiAgICogICAgIH0pO1xuICAgKiAgIH1cbiAgICogfVxuICAgKi9cbiAgc2Nyb2xsUG9zaXRpb25SZXN0b3JhdGlvbj86ICdkaXNhYmxlZCd8J2VuYWJsZWQnfCd0b3AnO1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmVzIGlmIHRoZSByb3V0ZXIgc2hvdWxkIHNjcm9sbCB0byB0aGUgZWxlbWVudCB3aGVuIHRoZSB1cmwgaGFzIGEgZnJhZ21lbnQuXG4gICAqXG4gICAqICogJ2Rpc2FibGVkJy0tZG9lcyBub3RoaW5nIChkZWZhdWx0KS5cbiAgICogKiAnZW5hYmxlZCctLXNjcm9sbHMgdG8gdGhlIGVsZW1lbnQuIFRoaXMgb3B0aW9uIHdpbGwgYmUgdGhlIGRlZmF1bHQgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogQW5jaG9yIHNjcm9sbGluZyBkb2VzIG5vdCBoYXBwZW4gb24gJ3BvcHN0YXRlJy4gSW5zdGVhZCwgd2UgcmVzdG9yZSB0aGUgcG9zaXRpb25cbiAgICogdGhhdCB3ZSBzdG9yZWQgb3Igc2Nyb2xsIHRvIHRoZSB0b3AuXG4gICAqL1xuICBhbmNob3JTY3JvbGxpbmc/OiAnZGlzYWJsZWQnfCdlbmFibGVkJztcblxuICAvKipcbiAgICogQ29uZmlndXJlcyB0aGUgc2Nyb2xsIG9mZnNldCB0aGUgcm91dGVyIHdpbGwgdXNlIHdoZW4gc2Nyb2xsaW5nIHRvIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqIFdoZW4gZ2l2ZW4gYSB0dXBsZSB3aXRoIHR3byBudW1iZXJzLCB0aGUgcm91dGVyIHdpbGwgYWx3YXlzIHVzZSB0aGUgbnVtYmVycy5cbiAgICogV2hlbiBnaXZlbiBhIGZ1bmN0aW9uLCB0aGUgcm91dGVyIHdpbGwgaW52b2tlIHRoZSBmdW5jdGlvbiBldmVyeSB0aW1lIGl0IHJlc3RvcmVzIHNjcm9sbFxuICAgKiBwb3NpdGlvbi5cbiAgICovXG4gIHNjcm9sbE9mZnNldD86IFtudW1iZXIsIG51bWJlcl18KCgpID0+IFtudW1iZXIsIG51bWJlcl0pO1xuXG4gIC8qKlxuICAgKiBEZWZpbmVzIGhvdyB0aGUgcm91dGVyIG1lcmdlcyBwYXJhbXMsIGRhdGEgYW5kIHJlc29sdmVkIGRhdGEgZnJvbSBwYXJlbnQgdG8gY2hpbGRcbiAgICogcm91dGVzLiBBdmFpbGFibGUgb3B0aW9ucyBhcmU6XG4gICAqXG4gICAqIC0gYCdlbXB0eU9ubHknYCwgdGhlIGRlZmF1bHQsIG9ubHkgaW5oZXJpdHMgcGFyZW50IHBhcmFtcyBmb3IgcGF0aC1sZXNzIG9yIGNvbXBvbmVudC1sZXNzXG4gICAqICAgcm91dGVzLlxuICAgKiAtIGAnYWx3YXlzJ2AsIGVuYWJsZXMgdW5jb25kaXRpb25hbCBpbmhlcml0YW5jZSBvZiBwYXJlbnQgcGFyYW1zLlxuICAgKi9cbiAgcGFyYW1zSW5oZXJpdGFuY2VTdHJhdGVneT86ICdlbXB0eU9ubHknfCdhbHdheXMnO1xuXG4gIC8qKlxuICAgKiBBIGN1c3RvbSBtYWxmb3JtZWQgdXJpIGVycm9yIGhhbmRsZXIgZnVuY3Rpb24uIFRoaXMgaGFuZGxlciBpcyBpbnZva2VkIHdoZW4gZW5jb2RlZFVSSSBjb250YWluc1xuICAgKiBpbnZhbGlkIGNoYXJhY3RlciBzZXF1ZW5jZXMuIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIGlzIHRvIHJlZGlyZWN0IHRvIHRoZSByb290IHVybCBkcm9wcGluZ1xuICAgKiBhbnkgcGF0aCBvciBwYXJhbSBpbmZvLiBUaGlzIGZ1bmN0aW9uIHBhc3NlcyB0aHJlZSBwYXJhbWV0ZXJzOlxuICAgKlxuICAgKiAtIGAnVVJJRXJyb3InYCAtIEVycm9yIHRocm93biB3aGVuIHBhcnNpbmcgYSBiYWQgVVJMXG4gICAqIC0gYCdVcmxTZXJpYWxpemVyJ2AgLSBVcmxTZXJpYWxpemVyIHRoYXTigJlzIGNvbmZpZ3VyZWQgd2l0aCB0aGUgcm91dGVyLlxuICAgKiAtIGAndXJsJ2AgLSAgVGhlIG1hbGZvcm1lZCBVUkwgdGhhdCBjYXVzZWQgdGhlIFVSSUVycm9yXG4gICAqICovXG4gIG1hbGZvcm1lZFVyaUVycm9ySGFuZGxlcj86XG4gICAgICAoZXJyb3I6IFVSSUVycm9yLCB1cmxTZXJpYWxpemVyOiBVcmxTZXJpYWxpemVyLCB1cmw6IHN0cmluZykgPT4gVXJsVHJlZTtcblxuICAvKipcbiAgICogRGVmaW5lcyB3aGVuIHRoZSByb3V0ZXIgdXBkYXRlcyB0aGUgYnJvd3NlciBVUkwuIFRoZSBkZWZhdWx0IGJlaGF2aW9yIGlzIHRvIHVwZGF0ZSBhZnRlclxuICAgKiBzdWNjZXNzZnVsIG5hdmlnYXRpb24uIEhvd2V2ZXIsIHNvbWUgYXBwbGljYXRpb25zIG1heSBwcmVmZXIgYSBtb2RlIHdoZXJlIHRoZSBVUkwgZ2V0c1xuICAgKiB1cGRhdGVkIGF0IHRoZSBiZWdpbm5pbmcgb2YgbmF2aWdhdGlvbi4gVGhlIG1vc3QgY29tbW9uIHVzZSBjYXNlIHdvdWxkIGJlIHVwZGF0aW5nIHRoZVxuICAgKiBVUkwgZWFybHkgc28gaWYgbmF2aWdhdGlvbiBmYWlscywgeW91IGNhbiBzaG93IGFuIGVycm9yIG1lc3NhZ2Ugd2l0aCB0aGUgVVJMIHRoYXQgZmFpbGVkLlxuICAgKiBBdmFpbGFibGUgb3B0aW9ucyBhcmU6XG4gICAqXG4gICAqIC0gYCdkZWZlcnJlZCdgLCB0aGUgZGVmYXVsdCwgdXBkYXRlcyB0aGUgYnJvd3NlciBVUkwgYWZ0ZXIgbmF2aWdhdGlvbiBoYXMgZmluaXNoZWQuXG4gICAqIC0gYCdlYWdlcidgLCB1cGRhdGVzIGJyb3dzZXIgVVJMIGF0IHRoZSBiZWdpbm5pbmcgb2YgbmF2aWdhdGlvbi5cbiAgICovXG4gIHVybFVwZGF0ZVN0cmF0ZWd5PzogJ2RlZmVycmVkJ3wnZWFnZXInO1xuXG4gIC8qKlxuICAgKiBFbmFibGVzIGEgYnVnIGZpeCB0aGF0IGNvcnJlY3RzIHJlbGF0aXZlIGxpbmsgcmVzb2x1dGlvbiBpbiBjb21wb25lbnRzIHdpdGggZW1wdHkgcGF0aHMuXG4gICAqIEV4YW1wbGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCByb3V0ZXMgPSBbXG4gICAqICAge1xuICAgKiAgICAgcGF0aDogJycsXG4gICAqICAgICBjb21wb25lbnQ6IENvbnRhaW5lckNvbXBvbmVudCxcbiAgICogICAgIGNoaWxkcmVuOiBbXG4gICAqICAgICAgIHsgcGF0aDogJ2EnLCBjb21wb25lbnQ6IEFDb21wb25lbnQgfSxcbiAgICogICAgICAgeyBwYXRoOiAnYicsIGNvbXBvbmVudDogQkNvbXBvbmVudCB9LFxuICAgKiAgICAgXVxuICAgKiAgIH1cbiAgICogXTtcbiAgICogYGBgXG4gICAqXG4gICAqIEZyb20gdGhlIGBDb250YWluZXJDb21wb25lbnRgLCB0aGlzIHdpbGwgbm90IHdvcms6XG4gICAqXG4gICAqIGA8YSBbcm91dGVyTGlua109XCJbJy4vYSddXCI+TGluayB0byBBPC9hPmBcbiAgICpcbiAgICogSG93ZXZlciwgdGhpcyB3aWxsIHdvcms6XG4gICAqXG4gICAqIGA8YSBbcm91dGVyTGlua109XCJbJy4uL2EnXVwiPkxpbmsgdG8gQTwvYT5gXG4gICAqXG4gICAqIEluIG90aGVyIHdvcmRzLCB5b3UncmUgcmVxdWlyZWQgdG8gdXNlIGAuLi9gIHJhdGhlciB0aGFuIGAuL2AuIFRoZSBjdXJyZW50IGRlZmF1bHQgaW4gdjZcbiAgICogaXMgYGxlZ2FjeWAsIGFuZCB0aGlzIG9wdGlvbiB3aWxsIGJlIHJlbW92ZWQgaW4gdjcgdG8gZGVmYXVsdCB0byB0aGUgY29ycmVjdGVkIGJlaGF2aW9yLlxuICAgKi9cbiAgcmVsYXRpdmVMaW5rUmVzb2x1dGlvbj86ICdsZWdhY3knfCdjb3JyZWN0ZWQnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBSb3V0ZXIoXG4gICAgcmVmOiBBcHBsaWNhdGlvblJlZiwgdXJsU2VyaWFsaXplcjogVXJsU2VyaWFsaXplciwgY29udGV4dHM6IENoaWxkcmVuT3V0bGV0Q29udGV4dHMsXG4gICAgbG9jYXRpb246IExvY2F0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IsIGxvYWRlcjogTmdNb2R1bGVGYWN0b3J5TG9hZGVyLCBjb21waWxlcjogQ29tcGlsZXIsXG4gICAgY29uZmlnOiBSb3V0ZVtdW10sIG9wdHM6IEV4dHJhT3B0aW9ucyA9IHt9LCB1cmxIYW5kbGluZ1N0cmF0ZWd5PzogVXJsSGFuZGxpbmdTdHJhdGVneSxcbiAgICByb3V0ZVJldXNlU3RyYXRlZ3k/OiBSb3V0ZVJldXNlU3RyYXRlZ3kpIHtcbiAgY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcihcbiAgICAgIG51bGwsIHVybFNlcmlhbGl6ZXIsIGNvbnRleHRzLCBsb2NhdGlvbiwgaW5qZWN0b3IsIGxvYWRlciwgY29tcGlsZXIsIGZsYXR0ZW4oY29uZmlnKSk7XG5cbiAgaWYgKHVybEhhbmRsaW5nU3RyYXRlZ3kpIHtcbiAgICByb3V0ZXIudXJsSGFuZGxpbmdTdHJhdGVneSA9IHVybEhhbmRsaW5nU3RyYXRlZ3k7XG4gIH1cblxuICBpZiAocm91dGVSZXVzZVN0cmF0ZWd5KSB7XG4gICAgcm91dGVyLnJvdXRlUmV1c2VTdHJhdGVneSA9IHJvdXRlUmV1c2VTdHJhdGVneTtcbiAgfVxuXG4gIGlmIChvcHRzLmVycm9ySGFuZGxlcikge1xuICAgIHJvdXRlci5lcnJvckhhbmRsZXIgPSBvcHRzLmVycm9ySGFuZGxlcjtcbiAgfVxuXG4gIGlmIChvcHRzLm1hbGZvcm1lZFVyaUVycm9ySGFuZGxlcikge1xuICAgIHJvdXRlci5tYWxmb3JtZWRVcmlFcnJvckhhbmRsZXIgPSBvcHRzLm1hbGZvcm1lZFVyaUVycm9ySGFuZGxlcjtcbiAgfVxuXG4gIGlmIChvcHRzLmVuYWJsZVRyYWNpbmcpIHtcbiAgICBjb25zdCBkb20gPSBnZXRET00oKTtcbiAgICByb3V0ZXIuZXZlbnRzLnN1YnNjcmliZSgoZTogUm91dGVyRXZlbnQpID0+IHtcbiAgICAgIGRvbS5sb2dHcm91cChgUm91dGVyIEV2ZW50OiAkeyg8YW55PmUuY29uc3RydWN0b3IpLm5hbWV9YCk7XG4gICAgICBkb20ubG9nKGUudG9TdHJpbmcoKSk7XG4gICAgICBkb20ubG9nKGUpO1xuICAgICAgZG9tLmxvZ0dyb3VwRW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAob3B0cy5vblNhbWVVcmxOYXZpZ2F0aW9uKSB7XG4gICAgcm91dGVyLm9uU2FtZVVybE5hdmlnYXRpb24gPSBvcHRzLm9uU2FtZVVybE5hdmlnYXRpb247XG4gIH1cblxuICBpZiAob3B0cy5wYXJhbXNJbmhlcml0YW5jZVN0cmF0ZWd5KSB7XG4gICAgcm91dGVyLnBhcmFtc0luaGVyaXRhbmNlU3RyYXRlZ3kgPSBvcHRzLnBhcmFtc0luaGVyaXRhbmNlU3RyYXRlZ3k7XG4gIH1cblxuICBpZiAob3B0cy51cmxVcGRhdGVTdHJhdGVneSkge1xuICAgIHJvdXRlci51cmxVcGRhdGVTdHJhdGVneSA9IG9wdHMudXJsVXBkYXRlU3RyYXRlZ3k7XG4gIH1cblxuICBpZiAob3B0cy5yZWxhdGl2ZUxpbmtSZXNvbHV0aW9uKSB7XG4gICAgcm91dGVyLnJlbGF0aXZlTGlua1Jlc29sdXRpb24gPSBvcHRzLnJlbGF0aXZlTGlua1Jlc29sdXRpb247XG4gIH1cblxuICByZXR1cm4gcm91dGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm9vdFJvdXRlKHJvdXRlcjogUm91dGVyKTogQWN0aXZhdGVkUm91dGUge1xuICByZXR1cm4gcm91dGVyLnJvdXRlclN0YXRlLnJvb3Q7XG59XG5cbi8qKlxuICogVG8gaW5pdGlhbGl6ZSB0aGUgcm91dGVyIHByb3Blcmx5IHdlIG5lZWQgdG8gZG8gaW4gdHdvIHN0ZXBzOlxuICpcbiAqIFdlIG5lZWQgdG8gc3RhcnQgdGhlIG5hdmlnYXRpb24gaW4gYSBBUFBfSU5JVElBTElaRVIgdG8gYmxvY2sgdGhlIGJvb3RzdHJhcCBpZlxuICogYSByZXNvbHZlciBvciBhIGd1YXJkcyBleGVjdXRlcyBhc3luY2hyb25vdXNseS4gU2Vjb25kLCB3ZSBuZWVkIHRvIGFjdHVhbGx5IHJ1blxuICogYWN0aXZhdGlvbiBpbiBhIEJPT1RTVFJBUF9MSVNURU5FUi4gV2UgdXRpbGl6ZSB0aGUgYWZ0ZXJQcmVhY3RpdmF0aW9uXG4gKiBob29rIHByb3ZpZGVkIGJ5IHRoZSByb3V0ZXIgdG8gZG8gdGhhdC5cbiAqXG4gKiBUaGUgcm91dGVyIG5hdmlnYXRpb24gc3RhcnRzLCByZWFjaGVzIHRoZSBwb2ludCB3aGVuIHByZWFjdGl2YXRpb24gaXMgZG9uZSwgYW5kIHRoZW5cbiAqIHBhdXNlcy4gSXQgd2FpdHMgZm9yIHRoZSBob29rIHRvIGJlIHJlc29sdmVkLiBXZSB0aGVuIHJlc29sdmUgaXQgb25seSBpbiBhIGJvb3RzdHJhcCBsaXN0ZW5lci5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFJvdXRlckluaXRpYWxpemVyIHtcbiAgcHJpdmF0ZSBpbml0TmF2aWdhdGlvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHJlc3VsdE9mUHJlYWN0aXZhdGlvbkRvbmUgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIGFwcEluaXRpYWxpemVyKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgcDogUHJvbWlzZTxhbnk+ID0gdGhpcy5pbmplY3Rvci5nZXQoTE9DQVRJT05fSU5JVElBTElaRUQsIFByb21pc2UucmVzb2x2ZShudWxsKSk7XG4gICAgcmV0dXJuIHAudGhlbigoKSA9PiB7XG4gICAgICBsZXQgcmVzb2x2ZTogRnVuY3Rpb24gPSBudWxsICE7XG4gICAgICBjb25zdCByZXMgPSBuZXcgUHJvbWlzZShyID0+IHJlc29sdmUgPSByKTtcbiAgICAgIGNvbnN0IHJvdXRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJvdXRlcik7XG4gICAgICBjb25zdCBvcHRzID0gdGhpcy5pbmplY3Rvci5nZXQoUk9VVEVSX0NPTkZJR1VSQVRJT04pO1xuXG4gICAgICBpZiAodGhpcy5pc0xlZ2FjeURpc2FibGVkKG9wdHMpIHx8IHRoaXMuaXNMZWdhY3lFbmFibGVkKG9wdHMpKSB7XG4gICAgICAgIHJlc29sdmUodHJ1ZSk7XG5cbiAgICAgIH0gZWxzZSBpZiAob3B0cy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gJ2Rpc2FibGVkJykge1xuICAgICAgICByb3V0ZXIuc2V0VXBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKCk7XG4gICAgICAgIHJlc29sdmUodHJ1ZSk7XG5cbiAgICAgIH0gZWxzZSBpZiAob3B0cy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gJ2VuYWJsZWQnKSB7XG4gICAgICAgIHJvdXRlci5ob29rcy5hZnRlclByZWFjdGl2YXRpb24gPSAoKSA9PiB7XG4gICAgICAgICAgLy8gb25seSB0aGUgaW5pdGlhbCBuYXZpZ2F0aW9uIHNob3VsZCBiZSBkZWxheWVkXG4gICAgICAgICAgaWYgKCF0aGlzLmluaXROYXZpZ2F0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmluaXROYXZpZ2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXN1bHRPZlByZWFjdGl2YXRpb25Eb25lO1xuXG4gICAgICAgICAgICAvLyBzdWJzZXF1ZW50IG5hdmlnYXRpb25zIHNob3VsZCBub3QgYmUgZGVsYXllZFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb2YgKG51bGwpIGFzIGFueTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJvdXRlci5pbml0aWFsTmF2aWdhdGlvbigpO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW5pdGlhbE5hdmlnYXRpb24gb3B0aW9uczogJyR7b3B0cy5pbml0aWFsTmF2aWdhdGlvbn0nYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG4gIH1cblxuICBib290c3RyYXBMaXN0ZW5lcihib290c3RyYXBwZWRDb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgY29uc3Qgb3B0cyA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJPVVRFUl9DT05GSUdVUkFUSU9OKTtcbiAgICBjb25zdCBwcmVsb2FkZXIgPSB0aGlzLmluamVjdG9yLmdldChSb3V0ZXJQcmVsb2FkZXIpO1xuICAgIGNvbnN0IHJvdXRlclNjcm9sbGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUm91dGVyU2Nyb2xsZXIpO1xuICAgIGNvbnN0IHJvdXRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJvdXRlcik7XG4gICAgY29uc3QgcmVmID0gdGhpcy5pbmplY3Rvci5nZXQ8QXBwbGljYXRpb25SZWY+KEFwcGxpY2F0aW9uUmVmKTtcblxuICAgIGlmIChib290c3RyYXBwZWRDb21wb25lbnRSZWYgIT09IHJlZi5jb21wb25lbnRzWzBdKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNMZWdhY3lFbmFibGVkKG9wdHMpKSB7XG4gICAgICByb3V0ZXIuaW5pdGlhbE5hdmlnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNMZWdhY3lEaXNhYmxlZChvcHRzKSkge1xuICAgICAgcm91dGVyLnNldFVwTG9jYXRpb25DaGFuZ2VMaXN0ZW5lcigpO1xuICAgIH1cblxuICAgIHByZWxvYWRlci5zZXRVcFByZWxvYWRpbmcoKTtcbiAgICByb3V0ZXJTY3JvbGxlci5pbml0KCk7XG4gICAgcm91dGVyLnJlc2V0Um9vdENvbXBvbmVudFR5cGUocmVmLmNvbXBvbmVudFR5cGVzWzBdKTtcbiAgICB0aGlzLnJlc3VsdE9mUHJlYWN0aXZhdGlvbkRvbmUubmV4dChudWxsICEpO1xuICAgIHRoaXMucmVzdWx0T2ZQcmVhY3RpdmF0aW9uRG9uZS5jb21wbGV0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0xlZ2FjeUVuYWJsZWQob3B0czogRXh0cmFPcHRpb25zKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG9wdHMuaW5pdGlhbE5hdmlnYXRpb24gPT09ICdsZWdhY3lfZW5hYmxlZCcgfHwgb3B0cy5pbml0aWFsTmF2aWdhdGlvbiA9PT0gdHJ1ZSB8fFxuICAgICAgICBvcHRzLmluaXRpYWxOYXZpZ2F0aW9uID09PSB1bmRlZmluZWQ7XG4gIH1cblxuICBwcml2YXRlIGlzTGVnYWN5RGlzYWJsZWQob3B0czogRXh0cmFPcHRpb25zKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG9wdHMuaW5pdGlhbE5hdmlnYXRpb24gPT09ICdsZWdhY3lfZGlzYWJsZWQnIHx8IG9wdHMuaW5pdGlhbE5hdmlnYXRpb24gPT09IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBcHBJbml0aWFsaXplcihyOiBSb3V0ZXJJbml0aWFsaXplcikge1xuICByZXR1cm4gci5hcHBJbml0aWFsaXplci5iaW5kKHIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Qm9vdHN0cmFwTGlzdGVuZXIocjogUm91dGVySW5pdGlhbGl6ZXIpIHtcbiAgcmV0dXJuIHIuYm9vdHN0cmFwTGlzdGVuZXIuYmluZChyKTtcbn1cblxuLyoqXG4gKiBBIHRva2VuIGZvciB0aGUgcm91dGVyIGluaXRpYWxpemVyIHRoYXQgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGFwcCBpcyBib290c3RyYXBwZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgUk9VVEVSX0lOSVRJQUxJWkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48KGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkPignUm91dGVyIEluaXRpYWxpemVyJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlUm91dGVySW5pdGlhbGl6ZXIoKSB7XG4gIHJldHVybiBbXG4gICAgUm91dGVySW5pdGlhbGl6ZXIsXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0lOSVRJQUxJWkVSLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICB1c2VGYWN0b3J5OiBnZXRBcHBJbml0aWFsaXplcixcbiAgICAgIGRlcHM6IFtSb3V0ZXJJbml0aWFsaXplcl1cbiAgICB9LFxuICAgIHtwcm92aWRlOiBST1VURVJfSU5JVElBTElaRVIsIHVzZUZhY3Rvcnk6IGdldEJvb3RzdHJhcExpc3RlbmVyLCBkZXBzOiBbUm91dGVySW5pdGlhbGl6ZXJdfSxcbiAgICB7cHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgbXVsdGk6IHRydWUsIHVzZUV4aXN0aW5nOiBST1VURVJfSU5JVElBTElaRVJ9LFxuICBdO1xufVxuIl19