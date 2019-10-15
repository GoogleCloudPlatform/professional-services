/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('@angular/cdk/platform'), require('rxjs'), require('rxjs/operators'), require('@angular/cdk/coercion')) :
	typeof define === 'function' && define.amd ? define('@angular/cdk/layout', ['exports', '@angular/core', '@angular/cdk/platform', 'rxjs', 'rxjs/operators', '@angular/cdk/coercion'], factory) :
	(factory((global.ng = global.ng || {}, global.ng.cdk = global.ng.cdk || {}, global.ng.cdk.layout = {}),global.ng.core,global.ng.cdk.platform,global.rxjs,global.rxjs.operators,global.ng.cdk.coercion));
}(this, (function (exports,core,platform,rxjs,operators,coercion) { 'use strict';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var LayoutModule = /** @class */ (function () {
    function LayoutModule() {
    }
    LayoutModule.decorators = [
        { type: core.NgModule, args: [{},] },
    ];
    return LayoutModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Global registry for all dynamically-created, injected media queries.
 * @type {?}
 */
var mediaQueriesForWebkitCompatibility = new Set();
/**
 * Style tag that holds all of the dynamically-created media queries.
 * @type {?}
 */
var mediaQueryStyleNode;
/**
 * A utility for calling matchMedia queries.
 */
var MediaMatcher = /** @class */ (function () {
    function MediaMatcher(platform$$1) {
        this.platform = platform$$1;
        this._matchMedia = this.platform.isBrowser && window.matchMedia ?
            // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
            // call it from a different scope.
            window.matchMedia.bind(window) :
            noopMatchMedia;
    }
    /**
     * Evaluates the given media query and returns the native MediaQueryList from which results
     * can be retrieved.
     * Confirms the layout engine will trigger for the selector query provided and returns the
     * MediaQueryList for the query provided.
     */
    /**
     * Evaluates the given media query and returns the native MediaQueryList from which results
     * can be retrieved.
     * Confirms the layout engine will trigger for the selector query provided and returns the
     * MediaQueryList for the query provided.
     * @param {?} query
     * @return {?}
     */
    MediaMatcher.prototype.matchMedia = /**
     * Evaluates the given media query and returns the native MediaQueryList from which results
     * can be retrieved.
     * Confirms the layout engine will trigger for the selector query provided and returns the
     * MediaQueryList for the query provided.
     * @param {?} query
     * @return {?}
     */
    function (query) {
        if (this.platform.WEBKIT) {
            createEmptyStyleRule(query);
        }
        return this._matchMedia(query);
    };
    MediaMatcher.decorators = [
        { type: core.Injectable, args: [{ providedIn: 'root' },] },
    ];
    /** @nocollapse */
    MediaMatcher.ctorParameters = function () { return [
        { type: platform.Platform }
    ]; };
    /** @nocollapse */ MediaMatcher.ngInjectableDef = core.defineInjectable({ factory: function MediaMatcher_Factory() { return new MediaMatcher(core.inject(platform.Platform)); }, token: MediaMatcher, providedIn: "root" });
    return MediaMatcher;
}());
/**
 * For Webkit engines that only trigger the MediaQueryListListener when
 * there is at least one CSS selector for the respective media query.
 * @param {?} query
 * @return {?}
 */
function createEmptyStyleRule(query) {
    if (mediaQueriesForWebkitCompatibility.has(query)) {
        return;
    }
    try {
        if (!mediaQueryStyleNode) {
            mediaQueryStyleNode = document.createElement('style');
            mediaQueryStyleNode.setAttribute('type', 'text/css');
            (/** @type {?} */ (document.head)).appendChild(mediaQueryStyleNode);
        }
        if (mediaQueryStyleNode.sheet) {
            ((/** @type {?} */ (mediaQueryStyleNode.sheet)))
                .insertRule("@media " + query + " {.fx-query-test{ }}", 0);
            mediaQueriesForWebkitCompatibility.add(query);
        }
    }
    catch (e) {
        console.error(e);
    }
}
/**
 * No-op matchMedia replacement for non-browser platforms.
 * @param {?} query
 * @return {?}
 */
function noopMatchMedia(query) {
    // Use `as any` here to avoid adding additional necessary properties for
    // the noop matcher.
    return (/** @type {?} */ ({
        matches: query === 'all' || query === '',
        media: query,
        addListener: function () { },
        removeListener: function () { }
    }));
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * Utility for checking the matching state of \@media queries.
 */
var BreakpointObserver = /** @class */ (function () {
    function BreakpointObserver(mediaMatcher, zone) {
        this.mediaMatcher = mediaMatcher;
        this.zone = zone;
        /**
         * A map of all media queries currently being listened for.
         */
        this._queries = new Map();
        /**
         * A subject for all other observables to takeUntil based on.
         */
        this._destroySubject = new rxjs.Subject();
    }
    /** Completes the active subject, signalling to all other observables to complete. */
    /**
     * Completes the active subject, signalling to all other observables to complete.
     * @return {?}
     */
    BreakpointObserver.prototype.ngOnDestroy = /**
     * Completes the active subject, signalling to all other observables to complete.
     * @return {?}
     */
    function () {
        this._destroySubject.next();
        this._destroySubject.complete();
    };
    /**
     * Whether one or more media queries match the current viewport size.
     * @param value One or more media queries to check.
     * @returns Whether any of the media queries match.
     */
    /**
     * Whether one or more media queries match the current viewport size.
     * @param {?} value One or more media queries to check.
     * @return {?} Whether any of the media queries match.
     */
    BreakpointObserver.prototype.isMatched = /**
     * Whether one or more media queries match the current viewport size.
     * @param {?} value One or more media queries to check.
     * @return {?} Whether any of the media queries match.
     */
    function (value) {
        var _this = this;
        /** @type {?} */
        var queries = splitQueries(coercion.coerceArray(value));
        return queries.some(function (mediaQuery) { return _this._registerQuery(mediaQuery).mql.matches; });
    };
    /**
     * Gets an observable of results for the given queries that will emit new results for any changes
     * in matching of the given queries.
     * @param value One or more media queries to check.
     * @returns A stream of matches for the given queries.
     */
    /**
     * Gets an observable of results for the given queries that will emit new results for any changes
     * in matching of the given queries.
     * @param {?} value One or more media queries to check.
     * @return {?} A stream of matches for the given queries.
     */
    BreakpointObserver.prototype.observe = /**
     * Gets an observable of results for the given queries that will emit new results for any changes
     * in matching of the given queries.
     * @param {?} value One or more media queries to check.
     * @return {?} A stream of matches for the given queries.
     */
    function (value) {
        var _this = this;
        /** @type {?} */
        var queries = splitQueries(coercion.coerceArray(value));
        /** @type {?} */
        var observables = queries.map(function (query) { return _this._registerQuery(query).observable; });
        return rxjs.combineLatest(observables).pipe(operators.debounceTime(0, rxjs.asapScheduler), operators.map(function (breakpointStates) {
            /** @type {?} */
            var response = {
                matches: false,
                breakpoints: {},
            };
            breakpointStates.forEach(function (state) {
                response.matches = response.matches || state.matches;
                response.breakpoints[state.query] = state.matches;
            });
            return response;
        }));
    };
    /** Registers a specific query to be listened for. */
    /**
     * Registers a specific query to be listened for.
     * @private
     * @param {?} query
     * @return {?}
     */
    BreakpointObserver.prototype._registerQuery = /**
     * Registers a specific query to be listened for.
     * @private
     * @param {?} query
     * @return {?}
     */
    function (query) {
        var _this = this;
        // Only set up a new MediaQueryList if it is not already being listened for.
        if (this._queries.has(query)) {
            return (/** @type {?} */ (this._queries.get(query)));
        }
        /** @type {?} */
        var mql = this.mediaMatcher.matchMedia(query);
        // TODO(jelbourn): change this `any` to `MediaQueryListEvent` once Google has upgraded to
        // TypeScript 3.1 (the type is unavailable before then).
        /** @type {?} */
        var queryListener;
        // Create callback for match changes and add it is as a listener.
        /** @type {?} */
        var queryObservable = rxjs.fromEventPattern(
        // Listener callback methods are wrapped to be placed back in ngZone. Callbacks must be placed
        // back into the zone because matchMedia is only included in Zone.js by loading the
        // webapis-media-query.js file alongside the zone.js file.  Additionally, some browsers do not
        // have MediaQueryList inherit from EventTarget, which causes inconsistencies in how Zone.js
        // patches it.
        function (listener) {
            queryListener = function (e) { return _this.zone.run(function () { return listener(e); }); };
            mql.addListener(queryListener);
        }, function () { return mql.removeListener(queryListener); })
            .pipe(operators.startWith(mql), operators.map(function (nextMql) { return ({ query: query, matches: nextMql.matches }); }), operators.takeUntil(this._destroySubject));
        // Add the MediaQueryList to the set of queries.
        /** @type {?} */
        var output = { observable: queryObservable, mql: mql };
        this._queries.set(query, output);
        return output;
    };
    BreakpointObserver.decorators = [
        { type: core.Injectable, args: [{ providedIn: 'root' },] },
    ];
    /** @nocollapse */
    BreakpointObserver.ctorParameters = function () { return [
        { type: MediaMatcher },
        { type: core.NgZone }
    ]; };
    /** @nocollapse */ BreakpointObserver.ngInjectableDef = core.defineInjectable({ factory: function BreakpointObserver_Factory() { return new BreakpointObserver(core.inject(MediaMatcher), core.inject(core.NgZone)); }, token: BreakpointObserver, providedIn: "root" });
    return BreakpointObserver;
}());
/**
 * Split each query string into separate query strings if two queries are provided as comma
 * separated.
 * @param {?} queries
 * @return {?}
 */
function splitQueries(queries) {
    return queries.map(function (query) { return query.split(','); })
        .reduce(function (a1, a2) { return a1.concat(a2); })
        .map(function (query) { return query.trim(); });
}

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// PascalCase is being used as Breakpoints is used like an enum.
// tslint:disable-next-line:variable-name
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 * @type {?}
 */
var Breakpoints = {
    XSmall: '(max-width: 599.99px)',
    Small: '(min-width: 600px) and (max-width: 959.99px)',
    Medium: '(min-width: 960px) and (max-width: 1279.99px)',
    Large: '(min-width: 1280px) and (max-width: 1919.99px)',
    XLarge: '(min-width: 1920px)',
    Handset: '(max-width: 599.99px) and (orientation: portrait), ' +
        '(max-width: 959.99px) and (orientation: landscape)',
    Tablet: '(min-width: 600px) and (max-width: 839.99px) and (orientation: portrait), ' +
        '(min-width: 960px) and (max-width: 1279.99px) and (orientation: landscape)',
    Web: '(min-width: 840px) and (orientation: portrait), ' +
        '(min-width: 1280px) and (orientation: landscape)',
    HandsetPortrait: '(max-width: 599.99px) and (orientation: portrait)',
    TabletPortrait: '(min-width: 600px) and (max-width: 839.99px) and (orientation: portrait)',
    WebPortrait: '(min-width: 840px) and (orientation: portrait)',
    HandsetLandscape: '(max-width: 959.99px) and (orientation: landscape)',
    TabletLandscape: '(min-width: 960px) and (max-width: 1279.99px) and (orientation: landscape)',
    WebLandscape: '(min-width: 1280px) and (orientation: landscape)',
};

exports.LayoutModule = LayoutModule;
exports.BreakpointObserver = BreakpointObserver;
exports.Breakpoints = Breakpoints;
exports.MediaMatcher = MediaMatcher;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=cdk-layout.umd.js.map
