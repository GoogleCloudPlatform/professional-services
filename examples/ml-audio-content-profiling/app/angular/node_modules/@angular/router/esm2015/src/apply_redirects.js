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
import { NgModuleRef } from '@angular/core';
import { EmptyError, Observable, from, of } from 'rxjs';
import { catchError, concatAll, first, map, mergeMap } from 'rxjs/operators';
import { LoadedRouterConfig } from './config';
import { PRIMARY_OUTLET, defaultUrlMatcher, navigationCancelingError } from './shared';
import { UrlSegmentGroup, UrlTree } from './url_tree';
import { andObservables, forEach, waitForMap, wrapIntoObservable } from './utils/collection';
class NoMatch {
    /**
     * @param {?=} segmentGroup
     */
    constructor(segmentGroup) { this.segmentGroup = segmentGroup || null; }
}
if (false) {
    /** @type {?} */
    NoMatch.prototype.segmentGroup;
}
class AbsoluteRedirect {
    /**
     * @param {?} urlTree
     */
    constructor(urlTree) {
        this.urlTree = urlTree;
    }
}
if (false) {
    /** @type {?} */
    AbsoluteRedirect.prototype.urlTree;
}
/**
 * @param {?} segmentGroup
 * @return {?}
 */
function noMatch(segmentGroup) {
    return new Observable((obs) => obs.error(new NoMatch(segmentGroup)));
}
/**
 * @param {?} newTree
 * @return {?}
 */
function absoluteRedirect(newTree) {
    return new Observable((obs) => obs.error(new AbsoluteRedirect(newTree)));
}
/**
 * @param {?} redirectTo
 * @return {?}
 */
function namedOutletsRedirect(redirectTo) {
    return new Observable((obs) => obs.error(new Error(`Only absolute redirects can have named outlets. redirectTo: '${redirectTo}'`)));
}
/**
 * @param {?} route
 * @return {?}
 */
function canLoadFails(route) {
    return new Observable((obs) => obs.error(navigationCancelingError(`Cannot load children because the guard of the route "path: '${route.path}'" returned false`)));
}
/**
 * Returns the `UrlTree` with the redirection applied.
 *
 * Lazy modules are loaded along the way.
 * @param {?} moduleInjector
 * @param {?} configLoader
 * @param {?} urlSerializer
 * @param {?} urlTree
 * @param {?} config
 * @return {?}
 */
export function applyRedirects(moduleInjector, configLoader, urlSerializer, urlTree, config) {
    return new ApplyRedirects(moduleInjector, configLoader, urlSerializer, urlTree, config).apply();
}
class ApplyRedirects {
    /**
     * @param {?} moduleInjector
     * @param {?} configLoader
     * @param {?} urlSerializer
     * @param {?} urlTree
     * @param {?} config
     */
    constructor(moduleInjector, configLoader, urlSerializer, urlTree, config) {
        this.configLoader = configLoader;
        this.urlSerializer = urlSerializer;
        this.urlTree = urlTree;
        this.config = config;
        this.allowRedirects = true;
        this.ngModule = moduleInjector.get(NgModuleRef);
    }
    /**
     * @return {?}
     */
    apply() {
        /** @type {?} */
        const expanded$ = this.expandSegmentGroup(this.ngModule, this.config, this.urlTree.root, PRIMARY_OUTLET);
        /** @type {?} */
        const urlTrees$ = expanded$.pipe(map((rootSegmentGroup) => this.createUrlTree(rootSegmentGroup, this.urlTree.queryParams, /** @type {?} */ ((this.urlTree.fragment)))));
        return urlTrees$.pipe(catchError((e) => {
            if (e instanceof AbsoluteRedirect) {
                // after an absolute redirect we do not apply any more redirects!
                this.allowRedirects = false;
                // we need to run matching, so we can fetch all lazy-loaded modules
                return this.match(e.urlTree);
            }
            if (e instanceof NoMatch) {
                throw this.noMatchError(e);
            }
            throw e;
        }));
    }
    /**
     * @param {?} tree
     * @return {?}
     */
    match(tree) {
        /** @type {?} */
        const expanded$ = this.expandSegmentGroup(this.ngModule, this.config, tree.root, PRIMARY_OUTLET);
        /** @type {?} */
        const mapped$ = expanded$.pipe(map((rootSegmentGroup) => this.createUrlTree(rootSegmentGroup, tree.queryParams, /** @type {?} */ ((tree.fragment)))));
        return mapped$.pipe(catchError((e) => {
            if (e instanceof NoMatch) {
                throw this.noMatchError(e);
            }
            throw e;
        }));
    }
    /**
     * @param {?} e
     * @return {?}
     */
    noMatchError(e) {
        return new Error(`Cannot match any routes. URL Segment: '${e.segmentGroup}'`);
    }
    /**
     * @param {?} rootCandidate
     * @param {?} queryParams
     * @param {?} fragment
     * @return {?}
     */
    createUrlTree(rootCandidate, queryParams, fragment) {
        /** @type {?} */
        const root = rootCandidate.segments.length > 0 ?
            new UrlSegmentGroup([], { [PRIMARY_OUTLET]: rootCandidate }) :
            rootCandidate;
        return new UrlTree(root, queryParams, fragment);
    }
    /**
     * @param {?} ngModule
     * @param {?} routes
     * @param {?} segmentGroup
     * @param {?} outlet
     * @return {?}
     */
    expandSegmentGroup(ngModule, routes, segmentGroup, outlet) {
        if (segmentGroup.segments.length === 0 && segmentGroup.hasChildren()) {
            return this.expandChildren(ngModule, routes, segmentGroup)
                .pipe(map((children) => new UrlSegmentGroup([], children)));
        }
        return this.expandSegment(ngModule, segmentGroup, routes, segmentGroup.segments, outlet, true);
    }
    /**
     * @param {?} ngModule
     * @param {?} routes
     * @param {?} segmentGroup
     * @return {?}
     */
    expandChildren(ngModule, routes, segmentGroup) {
        return waitForMap(segmentGroup.children, (childOutlet, child) => this.expandSegmentGroup(ngModule, routes, child, childOutlet));
    }
    /**
     * @param {?} ngModule
     * @param {?} segmentGroup
     * @param {?} routes
     * @param {?} segments
     * @param {?} outlet
     * @param {?} allowRedirects
     * @return {?}
     */
    expandSegment(ngModule, segmentGroup, routes, segments, outlet, allowRedirects) {
        return of(...routes).pipe(map((r) => {
            /** @type {?} */
            const expanded$ = this.expandSegmentAgainstRoute(ngModule, segmentGroup, routes, r, segments, outlet, allowRedirects);
            return expanded$.pipe(catchError((e) => {
                if (e instanceof NoMatch) {
                    // TODO(i): this return type doesn't match the declared Observable<UrlSegmentGroup> -
                    // talk to Jason
                    return /** @type {?} */ (of(null));
                }
                throw e;
            }));
        }), concatAll(), first((s) => !!s), catchError((e, _) => {
            if (e instanceof EmptyError || e.name === 'EmptyError') {
                if (this.noLeftoversInUrl(segmentGroup, segments, outlet)) {
                    return of(new UrlSegmentGroup([], {}));
                }
                throw new NoMatch(segmentGroup);
            }
            throw e;
        }));
    }
    /**
     * @param {?} segmentGroup
     * @param {?} segments
     * @param {?} outlet
     * @return {?}
     */
    noLeftoversInUrl(segmentGroup, segments, outlet) {
        return segments.length === 0 && !segmentGroup.children[outlet];
    }
    /**
     * @param {?} ngModule
     * @param {?} segmentGroup
     * @param {?} routes
     * @param {?} route
     * @param {?} paths
     * @param {?} outlet
     * @param {?} allowRedirects
     * @return {?}
     */
    expandSegmentAgainstRoute(ngModule, segmentGroup, routes, route, paths, outlet, allowRedirects) {
        if (getOutlet(route) !== outlet) {
            return noMatch(segmentGroup);
        }
        if (route.redirectTo === undefined) {
            return this.matchSegmentAgainstRoute(ngModule, segmentGroup, route, paths);
        }
        if (allowRedirects && this.allowRedirects) {
            return this.expandSegmentAgainstRouteUsingRedirect(ngModule, segmentGroup, routes, route, paths, outlet);
        }
        return noMatch(segmentGroup);
    }
    /**
     * @param {?} ngModule
     * @param {?} segmentGroup
     * @param {?} routes
     * @param {?} route
     * @param {?} segments
     * @param {?} outlet
     * @return {?}
     */
    expandSegmentAgainstRouteUsingRedirect(ngModule, segmentGroup, routes, route, segments, outlet) {
        if (route.path === '**') {
            return this.expandWildCardWithParamsAgainstRouteUsingRedirect(ngModule, routes, route, outlet);
        }
        return this.expandRegularSegmentAgainstRouteUsingRedirect(ngModule, segmentGroup, routes, route, segments, outlet);
    }
    /**
     * @param {?} ngModule
     * @param {?} routes
     * @param {?} route
     * @param {?} outlet
     * @return {?}
     */
    expandWildCardWithParamsAgainstRouteUsingRedirect(ngModule, routes, route, outlet) {
        /** @type {?} */
        const newTree = this.applyRedirectCommands([], /** @type {?} */ ((route.redirectTo)), {});
        if (/** @type {?} */ ((route.redirectTo)).startsWith('/')) {
            return absoluteRedirect(newTree);
        }
        return this.lineralizeSegments(route, newTree).pipe(mergeMap((newSegments) => {
            /** @type {?} */
            const group = new UrlSegmentGroup(newSegments, {});
            return this.expandSegment(ngModule, group, routes, newSegments, outlet, false);
        }));
    }
    /**
     * @param {?} ngModule
     * @param {?} segmentGroup
     * @param {?} routes
     * @param {?} route
     * @param {?} segments
     * @param {?} outlet
     * @return {?}
     */
    expandRegularSegmentAgainstRouteUsingRedirect(ngModule, segmentGroup, routes, route, segments, outlet) {
        const { matched, consumedSegments, lastChild, positionalParamSegments } = match(segmentGroup, route, segments);
        if (!matched)
            return noMatch(segmentGroup);
        /** @type {?} */
        const newTree = this.applyRedirectCommands(consumedSegments, /** @type {?} */ ((route.redirectTo)), /** @type {?} */ (positionalParamSegments));
        if (/** @type {?} */ ((route.redirectTo)).startsWith('/')) {
            return absoluteRedirect(newTree);
        }
        return this.lineralizeSegments(route, newTree).pipe(mergeMap((newSegments) => {
            return this.expandSegment(ngModule, segmentGroup, routes, newSegments.concat(segments.slice(lastChild)), outlet, false);
        }));
    }
    /**
     * @param {?} ngModule
     * @param {?} rawSegmentGroup
     * @param {?} route
     * @param {?} segments
     * @return {?}
     */
    matchSegmentAgainstRoute(ngModule, rawSegmentGroup, route, segments) {
        if (route.path === '**') {
            if (route.loadChildren) {
                return this.configLoader.load(ngModule.injector, route)
                    .pipe(map((cfg) => {
                    route._loadedConfig = cfg;
                    return new UrlSegmentGroup(segments, {});
                }));
            }
            return of(new UrlSegmentGroup(segments, {}));
        }
        const { matched, consumedSegments, lastChild } = match(rawSegmentGroup, route, segments);
        if (!matched)
            return noMatch(rawSegmentGroup);
        /** @type {?} */
        const rawSlicedSegments = segments.slice(lastChild);
        /** @type {?} */
        const childConfig$ = this.getChildConfig(ngModule, route, segments);
        return childConfig$.pipe(mergeMap((routerConfig) => {
            /** @type {?} */
            const childModule = routerConfig.module;
            /** @type {?} */
            const childConfig = routerConfig.routes;
            const { segmentGroup, slicedSegments } = split(rawSegmentGroup, consumedSegments, rawSlicedSegments, childConfig);
            if (slicedSegments.length === 0 && segmentGroup.hasChildren()) {
                /** @type {?} */
                const expanded$ = this.expandChildren(childModule, childConfig, segmentGroup);
                return expanded$.pipe(map((children) => new UrlSegmentGroup(consumedSegments, children)));
            }
            if (childConfig.length === 0 && slicedSegments.length === 0) {
                return of(new UrlSegmentGroup(consumedSegments, {}));
            }
            /** @type {?} */
            const expanded$ = this.expandSegment(childModule, segmentGroup, childConfig, slicedSegments, PRIMARY_OUTLET, true);
            return expanded$.pipe(map((cs) => new UrlSegmentGroup(consumedSegments.concat(cs.segments), cs.children)));
        }));
    }
    /**
     * @param {?} ngModule
     * @param {?} route
     * @param {?} segments
     * @return {?}
     */
    getChildConfig(ngModule, route, segments) {
        if (route.children) {
            // The children belong to the same module
            return of(new LoadedRouterConfig(route.children, ngModule));
        }
        if (route.loadChildren) {
            // lazy children belong to the loaded module
            if (route._loadedConfig !== undefined) {
                return of(route._loadedConfig);
            }
            return runCanLoadGuard(ngModule.injector, route, segments)
                .pipe(mergeMap((shouldLoad) => {
                if (shouldLoad) {
                    return this.configLoader.load(ngModule.injector, route)
                        .pipe(map((cfg) => {
                        route._loadedConfig = cfg;
                        return cfg;
                    }));
                }
                return canLoadFails(route);
            }));
        }
        return of(new LoadedRouterConfig([], ngModule));
    }
    /**
     * @param {?} route
     * @param {?} urlTree
     * @return {?}
     */
    lineralizeSegments(route, urlTree) {
        /** @type {?} */
        let res = [];
        /** @type {?} */
        let c = urlTree.root;
        while (true) {
            res = res.concat(c.segments);
            if (c.numberOfChildren === 0) {
                return of(res);
            }
            if (c.numberOfChildren > 1 || !c.children[PRIMARY_OUTLET]) {
                return namedOutletsRedirect(/** @type {?} */ ((route.redirectTo)));
            }
            c = c.children[PRIMARY_OUTLET];
        }
    }
    /**
     * @param {?} segments
     * @param {?} redirectTo
     * @param {?} posParams
     * @return {?}
     */
    applyRedirectCommands(segments, redirectTo, posParams) {
        return this.applyRedirectCreatreUrlTree(redirectTo, this.urlSerializer.parse(redirectTo), segments, posParams);
    }
    /**
     * @param {?} redirectTo
     * @param {?} urlTree
     * @param {?} segments
     * @param {?} posParams
     * @return {?}
     */
    applyRedirectCreatreUrlTree(redirectTo, urlTree, segments, posParams) {
        /** @type {?} */
        const newRoot = this.createSegmentGroup(redirectTo, urlTree.root, segments, posParams);
        return new UrlTree(newRoot, this.createQueryParams(urlTree.queryParams, this.urlTree.queryParams), urlTree.fragment);
    }
    /**
     * @param {?} redirectToParams
     * @param {?} actualParams
     * @return {?}
     */
    createQueryParams(redirectToParams, actualParams) {
        /** @type {?} */
        const res = {};
        forEach(redirectToParams, (v, k) => {
            /** @type {?} */
            const copySourceValue = typeof v === 'string' && v.startsWith(':');
            if (copySourceValue) {
                /** @type {?} */
                const sourceName = v.substring(1);
                res[k] = actualParams[sourceName];
            }
            else {
                res[k] = v;
            }
        });
        return res;
    }
    /**
     * @param {?} redirectTo
     * @param {?} group
     * @param {?} segments
     * @param {?} posParams
     * @return {?}
     */
    createSegmentGroup(redirectTo, group, segments, posParams) {
        /** @type {?} */
        const updatedSegments = this.createSegments(redirectTo, group.segments, segments, posParams);
        /** @type {?} */
        let children = {};
        forEach(group.children, (child, name) => {
            children[name] = this.createSegmentGroup(redirectTo, child, segments, posParams);
        });
        return new UrlSegmentGroup(updatedSegments, children);
    }
    /**
     * @param {?} redirectTo
     * @param {?} redirectToSegments
     * @param {?} actualSegments
     * @param {?} posParams
     * @return {?}
     */
    createSegments(redirectTo, redirectToSegments, actualSegments, posParams) {
        return redirectToSegments.map(s => s.path.startsWith(':') ? this.findPosParam(redirectTo, s, posParams) :
            this.findOrReturn(s, actualSegments));
    }
    /**
     * @param {?} redirectTo
     * @param {?} redirectToUrlSegment
     * @param {?} posParams
     * @return {?}
     */
    findPosParam(redirectTo, redirectToUrlSegment, posParams) {
        /** @type {?} */
        const pos = posParams[redirectToUrlSegment.path.substring(1)];
        if (!pos)
            throw new Error(`Cannot redirect to '${redirectTo}'. Cannot find '${redirectToUrlSegment.path}'.`);
        return pos;
    }
    /**
     * @param {?} redirectToUrlSegment
     * @param {?} actualSegments
     * @return {?}
     */
    findOrReturn(redirectToUrlSegment, actualSegments) {
        /** @type {?} */
        let idx = 0;
        for (const s of actualSegments) {
            if (s.path === redirectToUrlSegment.path) {
                actualSegments.splice(idx);
                return s;
            }
            idx++;
        }
        return redirectToUrlSegment;
    }
}
if (false) {
    /** @type {?} */
    ApplyRedirects.prototype.allowRedirects;
    /** @type {?} */
    ApplyRedirects.prototype.ngModule;
    /** @type {?} */
    ApplyRedirects.prototype.configLoader;
    /** @type {?} */
    ApplyRedirects.prototype.urlSerializer;
    /** @type {?} */
    ApplyRedirects.prototype.urlTree;
    /** @type {?} */
    ApplyRedirects.prototype.config;
}
/**
 * @param {?} moduleInjector
 * @param {?} route
 * @param {?} segments
 * @return {?}
 */
function runCanLoadGuard(moduleInjector, route, segments) {
    /** @type {?} */
    const canLoad = route.canLoad;
    if (!canLoad || canLoad.length === 0)
        return of(true);
    /** @type {?} */
    const obs = from(canLoad).pipe(map((injectionToken) => {
        /** @type {?} */
        const guard = moduleInjector.get(injectionToken);
        return wrapIntoObservable(guard.canLoad ? guard.canLoad(route, segments) : guard(route, segments));
    }));
    return andObservables(obs);
}
/**
 * @param {?} segmentGroup
 * @param {?} route
 * @param {?} segments
 * @return {?}
 */
function match(segmentGroup, route, segments) {
    if (route.path === '') {
        if ((route.pathMatch === 'full') && (segmentGroup.hasChildren() || segments.length > 0)) {
            return { matched: false, consumedSegments: [], lastChild: 0, positionalParamSegments: {} };
        }
        return { matched: true, consumedSegments: [], lastChild: 0, positionalParamSegments: {} };
    }
    /** @type {?} */
    const matcher = route.matcher || defaultUrlMatcher;
    /** @type {?} */
    const res = matcher(segments, segmentGroup, route);
    if (!res) {
        return {
            matched: false,
            consumedSegments: /** @type {?} */ ([]),
            lastChild: 0,
            positionalParamSegments: {},
        };
    }
    return {
        matched: true,
        consumedSegments: /** @type {?} */ ((res.consumed)),
        lastChild: /** @type {?} */ ((res.consumed.length)),
        positionalParamSegments: /** @type {?} */ ((res.posParams)),
    };
}
/**
 * @param {?} segmentGroup
 * @param {?} consumedSegments
 * @param {?} slicedSegments
 * @param {?} config
 * @return {?}
 */
function split(segmentGroup, consumedSegments, slicedSegments, config) {
    if (slicedSegments.length > 0 &&
        containsEmptyPathRedirectsWithNamedOutlets(segmentGroup, slicedSegments, config)) {
        /** @type {?} */
        const s = new UrlSegmentGroup(consumedSegments, createChildrenForEmptySegments(config, new UrlSegmentGroup(slicedSegments, segmentGroup.children)));
        return { segmentGroup: mergeTrivialChildren(s), slicedSegments: [] };
    }
    if (slicedSegments.length === 0 &&
        containsEmptyPathRedirects(segmentGroup, slicedSegments, config)) {
        /** @type {?} */
        const s = new UrlSegmentGroup(segmentGroup.segments, addEmptySegmentsToChildrenIfNeeded(segmentGroup, slicedSegments, config, segmentGroup.children));
        return { segmentGroup: mergeTrivialChildren(s), slicedSegments };
    }
    return { segmentGroup, slicedSegments };
}
/**
 * @param {?} s
 * @return {?}
 */
function mergeTrivialChildren(s) {
    if (s.numberOfChildren === 1 && s.children[PRIMARY_OUTLET]) {
        /** @type {?} */
        const c = s.children[PRIMARY_OUTLET];
        return new UrlSegmentGroup(s.segments.concat(c.segments), c.children);
    }
    return s;
}
/**
 * @param {?} segmentGroup
 * @param {?} slicedSegments
 * @param {?} routes
 * @param {?} children
 * @return {?}
 */
function addEmptySegmentsToChildrenIfNeeded(segmentGroup, slicedSegments, routes, children) {
    /** @type {?} */
    const res = {};
    for (const r of routes) {
        if (isEmptyPathRedirect(segmentGroup, slicedSegments, r) && !children[getOutlet(r)]) {
            res[getOutlet(r)] = new UrlSegmentGroup([], {});
        }
    }
    return Object.assign({}, children, res);
}
/**
 * @param {?} routes
 * @param {?} primarySegmentGroup
 * @return {?}
 */
function createChildrenForEmptySegments(routes, primarySegmentGroup) {
    /** @type {?} */
    const res = {};
    res[PRIMARY_OUTLET] = primarySegmentGroup;
    for (const r of routes) {
        if (r.path === '' && getOutlet(r) !== PRIMARY_OUTLET) {
            res[getOutlet(r)] = new UrlSegmentGroup([], {});
        }
    }
    return res;
}
/**
 * @param {?} segmentGroup
 * @param {?} segments
 * @param {?} routes
 * @return {?}
 */
function containsEmptyPathRedirectsWithNamedOutlets(segmentGroup, segments, routes) {
    return routes.some(r => isEmptyPathRedirect(segmentGroup, segments, r) && getOutlet(r) !== PRIMARY_OUTLET);
}
/**
 * @param {?} segmentGroup
 * @param {?} segments
 * @param {?} routes
 * @return {?}
 */
function containsEmptyPathRedirects(segmentGroup, segments, routes) {
    return routes.some(r => isEmptyPathRedirect(segmentGroup, segments, r));
}
/**
 * @param {?} segmentGroup
 * @param {?} segments
 * @param {?} r
 * @return {?}
 */
function isEmptyPathRedirect(segmentGroup, segments, r) {
    if ((segmentGroup.hasChildren() || segments.length > 0) && r.pathMatch === 'full') {
        return false;
    }
    return r.path === '' && r.redirectTo !== undefined;
}
/**
 * @param {?} route
 * @return {?}
 */
function getOutlet(route) {
    return route.outlet || PRIMARY_OUTLET;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHlfcmVkaXJlY3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9hcHBseV9yZWRpcmVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQVcsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFZLElBQUksRUFBRSxFQUFFLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUzRSxPQUFPLEVBQUMsa0JBQWtCLEVBQWdCLE1BQU0sVUFBVSxDQUFDO0FBRTNELE9BQU8sRUFBQyxjQUFjLEVBQVUsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0YsT0FBTyxFQUFhLGVBQWUsRUFBaUIsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQy9FLE9BQU8sRUFBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTNGLE1BQU0sT0FBTzs7OztJQUdYLFlBQVksWUFBOEIsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksSUFBSSxJQUFJLENBQUMsRUFBRTtDQUMxRjs7Ozs7QUFFRCxNQUFNLGdCQUFnQjs7OztJQUNwQixZQUFtQixPQUFnQjtRQUFoQixZQUFPLEdBQVAsT0FBTyxDQUFTO0tBQUk7Q0FDeEM7Ozs7Ozs7OztBQUVELFNBQVMsT0FBTyxDQUFDLFlBQTZCO0lBQzVDLE9BQU8sSUFBSSxVQUFVLENBQ2pCLENBQUMsR0FBOEIsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxD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Ozs7OztBQUVELFNBQVMsMENBQTBDLENBQy9DLFlBQTZCLEVBQUUsUUFBc0IsRUFBRSxNQUFlO0lBQ3hFLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FDZCxDQUFDLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLGNBQWMsQ0FBQyxDQUFDO0NBQzdGOzs7Ozs7O0FBRUQsU0FBUywwQkFBMEIsQ0FDL0IsWUFBNkIsRUFBRSxRQUFzQixFQUFFLE1BQWU7SUFDeEUsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3pFOzs7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FDeEIsWUFBNkIsRUFBRSxRQUFzQixFQUFFLENBQVE7SUFDakUsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEtBQUssTUFBTSxFQUFFO1FBQ2pGLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUFDO0NBQ3BEOzs7OztBQUVELFNBQVMsU0FBUyxDQUFDLEtBQVk7SUFDN0IsT0FBTyxLQUFLLENBQUMsTUFBTSxJQUFJLGNBQWMsQ0FBQztDQUN2QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RvciwgTmdNb2R1bGVSZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtFbXB0eUVycm9yLCBPYnNlcnZhYmxlLCBPYnNlcnZlciwgZnJvbSwgb2YgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7Y2F0Y2hFcnJvciwgY29uY2F0QWxsLCBmaXJzdCwgbWFwLCBtZXJnZU1hcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0xvYWRlZFJvdXRlckNvbmZpZywgUm91dGUsIFJvdXRlc30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHtSb3V0ZXJDb25maWdMb2FkZXJ9IGZyb20gJy4vcm91dGVyX2NvbmZpZ19sb2FkZXInO1xuaW1wb3J0IHtQUklNQVJZX09VVExFVCwgUGFyYW1zLCBkZWZhdWx0VXJsTWF0Y2hlciwgbmF2aWdhdGlvbkNhbmNlbGluZ0Vycm9yfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQge1VybFNlZ21lbnQsIFVybFNlZ21lbnRHcm91cCwgVXJsU2VyaWFsaXplciwgVXJsVHJlZX0gZnJvbSAnLi91cmxfdHJlZSc7XG5pbXBvcnQge2FuZE9ic2VydmFibGVzLCBmb3JFYWNoLCB3YWl0Rm9yTWFwLCB3cmFwSW50b09ic2VydmFibGV9IGZyb20gJy4vdXRpbHMvY29sbGVjdGlvbic7XG5cbmNsYXNzIE5vTWF0Y2gge1xuICBwdWJsaWMgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXB8bnVsbDtcblxuICBjb25zdHJ1Y3RvcihzZWdtZW50R3JvdXA/OiBVcmxTZWdtZW50R3JvdXApIHsgdGhpcy5zZWdtZW50R3JvdXAgPSBzZWdtZW50R3JvdXAgfHwgbnVsbDsgfVxufVxuXG5jbGFzcyBBYnNvbHV0ZVJlZGlyZWN0IHtcbiAgY29uc3RydWN0b3IocHVibGljIHVybFRyZWU6IFVybFRyZWUpIHt9XG59XG5cbmZ1bmN0aW9uIG5vTWF0Y2goc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXApOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRHcm91cD4ge1xuICByZXR1cm4gbmV3IE9ic2VydmFibGU8VXJsU2VnbWVudEdyb3VwPihcbiAgICAgIChvYnM6IE9ic2VydmVyPFVybFNlZ21lbnRHcm91cD4pID0+IG9icy5lcnJvcihuZXcgTm9NYXRjaChzZWdtZW50R3JvdXApKSk7XG59XG5cbmZ1bmN0aW9uIGFic29sdXRlUmVkaXJlY3QobmV3VHJlZTogVXJsVHJlZSk6IE9ic2VydmFibGU8YW55PiB7XG4gIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxVcmxTZWdtZW50R3JvdXA+KFxuICAgICAgKG9iczogT2JzZXJ2ZXI8VXJsU2VnbWVudEdyb3VwPikgPT4gb2JzLmVycm9yKG5ldyBBYnNvbHV0ZVJlZGlyZWN0KG5ld1RyZWUpKSk7XG59XG5cbmZ1bmN0aW9uIG5hbWVkT3V0bGV0c1JlZGlyZWN0KHJlZGlyZWN0VG86IHN0cmluZyk6IE9ic2VydmFibGU8YW55PiB7XG4gIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxVcmxTZWdtZW50R3JvdXA+KFxuICAgICAgKG9iczogT2JzZXJ2ZXI8VXJsU2VnbWVudEdyb3VwPikgPT4gb2JzLmVycm9yKG5ldyBFcnJvcihcbiAgICAgICAgICBgT25seSBhYnNvbHV0ZSByZWRpcmVjdHMgY2FuIGhhdmUgbmFtZWQgb3V0bGV0cy4gcmVkaXJlY3RUbzogJyR7cmVkaXJlY3RUb30nYCkpKTtcbn1cblxuZnVuY3Rpb24gY2FuTG9hZEZhaWxzKHJvdXRlOiBSb3V0ZSk6IE9ic2VydmFibGU8TG9hZGVkUm91dGVyQ29uZmlnPiB7XG4gIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxMb2FkZWRSb3V0ZXJDb25maWc+KFxuICAgICAgKG9iczogT2JzZXJ2ZXI8TG9hZGVkUm91dGVyQ29uZmlnPikgPT4gb2JzLmVycm9yKG5hdmlnYXRpb25DYW5jZWxpbmdFcnJvcihcbiAgICAgICAgICBgQ2Fubm90IGxvYWQgY2hpbGRyZW4gYmVjYXVzZSB0aGUgZ3VhcmQgb2YgdGhlIHJvdXRlIFwicGF0aDogJyR7cm91dGUucGF0aH0nXCIgcmV0dXJuZWQgZmFsc2VgKSkpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBVcmxUcmVlYCB3aXRoIHRoZSByZWRpcmVjdGlvbiBhcHBsaWVkLlxuICpcbiAqIExhenkgbW9kdWxlcyBhcmUgbG9hZGVkIGFsb25nIHRoZSB3YXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVJlZGlyZWN0cyhcbiAgICBtb2R1bGVJbmplY3RvcjogSW5qZWN0b3IsIGNvbmZpZ0xvYWRlcjogUm91dGVyQ29uZmlnTG9hZGVyLCB1cmxTZXJpYWxpemVyOiBVcmxTZXJpYWxpemVyLFxuICAgIHVybFRyZWU6IFVybFRyZWUsIGNvbmZpZzogUm91dGVzKTogT2JzZXJ2YWJsZTxVcmxUcmVlPiB7XG4gIHJldHVybiBuZXcgQXBwbHlSZWRpcmVjdHMobW9kdWxlSW5qZWN0b3IsIGNvbmZpZ0xvYWRlciwgdXJsU2VyaWFsaXplciwgdXJsVHJlZSwgY29uZmlnKS5hcHBseSgpO1xufVxuXG5jbGFzcyBBcHBseVJlZGlyZWN0cyB7XG4gIHByaXZhdGUgYWxsb3dSZWRpcmVjdHM6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgbW9kdWxlSW5qZWN0b3I6IEluamVjdG9yLCBwcml2YXRlIGNvbmZpZ0xvYWRlcjogUm91dGVyQ29uZmlnTG9hZGVyLFxuICAgICAgcHJpdmF0ZSB1cmxTZXJpYWxpemVyOiBVcmxTZXJpYWxpemVyLCBwcml2YXRlIHVybFRyZWU6IFVybFRyZWUsIHByaXZhdGUgY29uZmlnOiBSb3V0ZXMpIHtcbiAgICB0aGlzLm5nTW9kdWxlID0gbW9kdWxlSW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgfVxuXG4gIGFwcGx5KCk6IE9ic2VydmFibGU8VXJsVHJlZT4ge1xuICAgIGNvbnN0IGV4cGFuZGVkJCA9XG4gICAgICAgIHRoaXMuZXhwYW5kU2VnbWVudEdyb3VwKHRoaXMubmdNb2R1bGUsIHRoaXMuY29uZmlnLCB0aGlzLnVybFRyZWUucm9vdCwgUFJJTUFSWV9PVVRMRVQpO1xuICAgIGNvbnN0IHVybFRyZWVzJCA9IGV4cGFuZGVkJC5waXBlKFxuICAgICAgICBtYXAoKHJvb3RTZWdtZW50R3JvdXA6IFVybFNlZ21lbnRHcm91cCkgPT4gdGhpcy5jcmVhdGVVcmxUcmVlKFxuICAgICAgICAgICAgICAgIHJvb3RTZWdtZW50R3JvdXAsIHRoaXMudXJsVHJlZS5xdWVyeVBhcmFtcywgdGhpcy51cmxUcmVlLmZyYWdtZW50ICEpKSk7XG4gICAgcmV0dXJuIHVybFRyZWVzJC5waXBlKGNhdGNoRXJyb3IoKGU6IGFueSkgPT4ge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBBYnNvbHV0ZVJlZGlyZWN0KSB7XG4gICAgICAgIC8vIGFmdGVyIGFuIGFic29sdXRlIHJlZGlyZWN0IHdlIGRvIG5vdCBhcHBseSBhbnkgbW9yZSByZWRpcmVjdHMhXG4gICAgICAgIHRoaXMuYWxsb3dSZWRpcmVjdHMgPSBmYWxzZTtcbiAgICAgICAgLy8gd2UgbmVlZCB0byBydW4gbWF0Y2hpbmcsIHNvIHdlIGNhbiBmZXRjaCBhbGwgbGF6eS1sb2FkZWQgbW9kdWxlc1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChlLnVybFRyZWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIE5vTWF0Y2gpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5ub01hdGNoRXJyb3IoZSk7XG4gICAgICB9XG5cbiAgICAgIHRocm93IGU7XG4gICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaCh0cmVlOiBVcmxUcmVlKTogT2JzZXJ2YWJsZTxVcmxUcmVlPiB7XG4gICAgY29uc3QgZXhwYW5kZWQkID1cbiAgICAgICAgdGhpcy5leHBhbmRTZWdtZW50R3JvdXAodGhpcy5uZ01vZHVsZSwgdGhpcy5jb25maWcsIHRyZWUucm9vdCwgUFJJTUFSWV9PVVRMRVQpO1xuICAgIGNvbnN0IG1hcHBlZCQgPSBleHBhbmRlZCQucGlwZShcbiAgICAgICAgbWFwKChyb290U2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXApID0+XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVVcmxUcmVlKHJvb3RTZWdtZW50R3JvdXAsIHRyZWUucXVlcnlQYXJhbXMsIHRyZWUuZnJhZ21lbnQgISkpKTtcbiAgICByZXR1cm4gbWFwcGVkJC5waXBlKGNhdGNoRXJyb3IoKGU6IGFueSk6IE9ic2VydmFibGU8VXJsVHJlZT4gPT4ge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBOb01hdGNoKSB7XG4gICAgICAgIHRocm93IHRoaXMubm9NYXRjaEVycm9yKGUpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgbm9NYXRjaEVycm9yKGU6IE5vTWF0Y2gpOiBhbnkge1xuICAgIHJldHVybiBuZXcgRXJyb3IoYENhbm5vdCBtYXRjaCBhbnkgcm91dGVzLiBVUkwgU2VnbWVudDogJyR7ZS5zZWdtZW50R3JvdXB9J2ApO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVVcmxUcmVlKHJvb3RDYW5kaWRhdGU6IFVybFNlZ21lbnRHcm91cCwgcXVlcnlQYXJhbXM6IFBhcmFtcywgZnJhZ21lbnQ6IHN0cmluZyk6XG4gICAgICBVcmxUcmVlIHtcbiAgICBjb25zdCByb290ID0gcm9vdENhbmRpZGF0ZS5zZWdtZW50cy5sZW5ndGggPiAwID9cbiAgICAgICAgbmV3IFVybFNlZ21lbnRHcm91cChbXSwge1tQUklNQVJZX09VVExFVF06IHJvb3RDYW5kaWRhdGV9KSA6XG4gICAgICAgIHJvb3RDYW5kaWRhdGU7XG4gICAgcmV0dXJuIG5ldyBVcmxUcmVlKHJvb3QsIHF1ZXJ5UGFyYW1zLCBmcmFnbWVudCk7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFNlZ21lbnRHcm91cChcbiAgICAgIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByb3V0ZXM6IFJvdXRlW10sIHNlZ21lbnRHcm91cDogVXJsU2VnbWVudEdyb3VwLFxuICAgICAgb3V0bGV0OiBzdHJpbmcpOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRHcm91cD4ge1xuICAgIGlmIChzZWdtZW50R3JvdXAuc2VnbWVudHMubGVuZ3RoID09PSAwICYmIHNlZ21lbnRHcm91cC5oYXNDaGlsZHJlbigpKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmRDaGlsZHJlbihuZ01vZHVsZSwgcm91dGVzLCBzZWdtZW50R3JvdXApXG4gICAgICAgICAgLnBpcGUobWFwKChjaGlsZHJlbjogYW55KSA9PiBuZXcgVXJsU2VnbWVudEdyb3VwKFtdLCBjaGlsZHJlbikpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5leHBhbmRTZWdtZW50KG5nTW9kdWxlLCBzZWdtZW50R3JvdXAsIHJvdXRlcywgc2VnbWVudEdyb3VwLnNlZ21lbnRzLCBvdXRsZXQsIHRydWUpO1xuICB9XG5cbiAgLy8gUmVjdXJzaXZlbHkgZXhwYW5kIHNlZ21lbnQgZ3JvdXBzIGZvciBhbGwgdGhlIGNoaWxkIG91dGxldHNcbiAgcHJpdmF0ZSBleHBhbmRDaGlsZHJlbihcbiAgICAgIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByb3V0ZXM6IFJvdXRlW10sXG4gICAgICBzZWdtZW50R3JvdXA6IFVybFNlZ21lbnRHcm91cCk6IE9ic2VydmFibGU8e1tuYW1lOiBzdHJpbmddOiBVcmxTZWdtZW50R3JvdXB9PiB7XG4gICAgcmV0dXJuIHdhaXRGb3JNYXAoXG4gICAgICAgIHNlZ21lbnRHcm91cC5jaGlsZHJlbixcbiAgICAgICAgKGNoaWxkT3V0bGV0LCBjaGlsZCkgPT4gdGhpcy5leHBhbmRTZWdtZW50R3JvdXAobmdNb2R1bGUsIHJvdXRlcywgY2hpbGQsIGNoaWxkT3V0bGV0KSk7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFNlZ21lbnQoXG4gICAgICBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55Piwgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHJvdXRlczogUm91dGVbXSxcbiAgICAgIHNlZ21lbnRzOiBVcmxTZWdtZW50W10sIG91dGxldDogc3RyaW5nLFxuICAgICAgYWxsb3dSZWRpcmVjdHM6IGJvb2xlYW4pOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRHcm91cD4ge1xuICAgIHJldHVybiBvZiAoLi4ucm91dGVzKS5waXBlKFxuICAgICAgICBtYXAoKHI6IGFueSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGV4cGFuZGVkJCA9IHRoaXMuZXhwYW5kU2VnbWVudEFnYWluc3RSb3V0ZShcbiAgICAgICAgICAgICAgbmdNb2R1bGUsIHNlZ21lbnRHcm91cCwgcm91dGVzLCByLCBzZWdtZW50cywgb3V0bGV0LCBhbGxvd1JlZGlyZWN0cyk7XG4gICAgICAgICAgcmV0dXJuIGV4cGFuZGVkJC5waXBlKGNhdGNoRXJyb3IoKGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBOb01hdGNoKSB7XG4gICAgICAgICAgICAgIC8vIFRPRE8oaSk6IHRoaXMgcmV0dXJuIHR5cGUgZG9lc24ndCBtYXRjaCB0aGUgZGVjbGFyZWQgT2JzZXJ2YWJsZTxVcmxTZWdtZW50R3JvdXA+IC1cbiAgICAgICAgICAgICAgLy8gdGFsayB0byBKYXNvblxuICAgICAgICAgICAgICByZXR1cm4gb2YgKG51bGwpIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgfSkpO1xuICAgICAgICB9KSxcbiAgICAgICAgY29uY2F0QWxsKCksIGZpcnN0KChzOiBhbnkpID0+ICEhcyksIGNhdGNoRXJyb3IoKGU6IGFueSwgXzogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFbXB0eUVycm9yIHx8IGUubmFtZSA9PT0gJ0VtcHR5RXJyb3InKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ub0xlZnRvdmVyc0luVXJsKHNlZ21lbnRHcm91cCwgc2VnbWVudHMsIG91dGxldCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG9mIChuZXcgVXJsU2VnbWVudEdyb3VwKFtdLCB7fSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IE5vTWF0Y2goc2VnbWVudEdyb3VwKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBub0xlZnRvdmVyc0luVXJsKHNlZ21lbnRHcm91cDogVXJsU2VnbWVudEdyb3VwLCBzZWdtZW50czogVXJsU2VnbWVudFtdLCBvdXRsZXQ6IHN0cmluZyk6XG4gICAgICBib29sZWFuIHtcbiAgICByZXR1cm4gc2VnbWVudHMubGVuZ3RoID09PSAwICYmICFzZWdtZW50R3JvdXAuY2hpbGRyZW5bb3V0bGV0XTtcbiAgfVxuXG4gIHByaXZhdGUgZXhwYW5kU2VnbWVudEFnYWluc3RSb3V0ZShcbiAgICAgIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCBzZWdtZW50R3JvdXA6IFVybFNlZ21lbnRHcm91cCwgcm91dGVzOiBSb3V0ZVtdLCByb3V0ZTogUm91dGUsXG4gICAgICBwYXRoczogVXJsU2VnbWVudFtdLCBvdXRsZXQ6IHN0cmluZywgYWxsb3dSZWRpcmVjdHM6IGJvb2xlYW4pOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRHcm91cD4ge1xuICAgIGlmIChnZXRPdXRsZXQocm91dGUpICE9PSBvdXRsZXQpIHtcbiAgICAgIHJldHVybiBub01hdGNoKHNlZ21lbnRHcm91cCk7XG4gICAgfVxuXG4gICAgaWYgKHJvdXRlLnJlZGlyZWN0VG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMubWF0Y2hTZWdtZW50QWdhaW5zdFJvdXRlKG5nTW9kdWxlLCBzZWdtZW50R3JvdXAsIHJvdXRlLCBwYXRocyk7XG4gICAgfVxuXG4gICAgaWYgKGFsbG93UmVkaXJlY3RzICYmIHRoaXMuYWxsb3dSZWRpcmVjdHMpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cGFuZFNlZ21lbnRBZ2FpbnN0Um91dGVVc2luZ1JlZGlyZWN0KFxuICAgICAgICAgIG5nTW9kdWxlLCBzZWdtZW50R3JvdXAsIHJvdXRlcywgcm91dGUsIHBhdGhzLCBvdXRsZXQpO1xuICAgIH1cblxuICAgIHJldHVybiBub01hdGNoKHNlZ21lbnRHcm91cCk7XG4gIH1cblxuICBwcml2YXRlIGV4cGFuZFNlZ21lbnRBZ2FpbnN0Um91dGVVc2luZ1JlZGlyZWN0KFxuICAgICAgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIHNlZ21lbnRHcm91cDogVXJsU2VnbWVudEdyb3VwLCByb3V0ZXM6IFJvdXRlW10sIHJvdXRlOiBSb3V0ZSxcbiAgICAgIHNlZ21lbnRzOiBVcmxTZWdtZW50W10sIG91dGxldDogc3RyaW5nKTogT2JzZXJ2YWJsZTxVcmxTZWdtZW50R3JvdXA+IHtcbiAgICBpZiAocm91dGUucGF0aCA9PT0gJyoqJykge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kV2lsZENhcmRXaXRoUGFyYW1zQWdhaW5zdFJvdXRlVXNpbmdSZWRpcmVjdChcbiAgICAgICAgICBuZ01vZHVsZSwgcm91dGVzLCByb3V0ZSwgb3V0bGV0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5leHBhbmRSZWd1bGFyU2VnbWVudEFnYWluc3RSb3V0ZVVzaW5nUmVkaXJlY3QoXG4gICAgICAgIG5nTW9kdWxlLCBzZWdtZW50R3JvdXAsIHJvdXRlcywgcm91dGUsIHNlZ21lbnRzLCBvdXRsZXQpO1xuICB9XG5cbiAgcHJpdmF0ZSBleHBhbmRXaWxkQ2FyZFdpdGhQYXJhbXNBZ2FpbnN0Um91dGVVc2luZ1JlZGlyZWN0KFxuICAgICAgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIHJvdXRlczogUm91dGVbXSwgcm91dGU6IFJvdXRlLFxuICAgICAgb3V0bGV0OiBzdHJpbmcpOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRHcm91cD4ge1xuICAgIGNvbnN0IG5ld1RyZWUgPSB0aGlzLmFwcGx5UmVkaXJlY3RDb21tYW5kcyhbXSwgcm91dGUucmVkaXJlY3RUbyAhLCB7fSk7XG4gICAgaWYgKHJvdXRlLnJlZGlyZWN0VG8gIS5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgIHJldHVybiBhYnNvbHV0ZVJlZGlyZWN0KG5ld1RyZWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmxpbmVyYWxpemVTZWdtZW50cyhyb3V0ZSwgbmV3VHJlZSkucGlwZShtZXJnZU1hcCgobmV3U2VnbWVudHM6IFVybFNlZ21lbnRbXSkgPT4ge1xuICAgICAgY29uc3QgZ3JvdXAgPSBuZXcgVXJsU2VnbWVudEdyb3VwKG5ld1NlZ21lbnRzLCB7fSk7XG4gICAgICByZXR1cm4gdGhpcy5leHBhbmRTZWdtZW50KG5nTW9kdWxlLCBncm91cCwgcm91dGVzLCBuZXdTZWdtZW50cywgb3V0bGV0LCBmYWxzZSk7XG4gICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBleHBhbmRSZWd1bGFyU2VnbWVudEFnYWluc3RSb3V0ZVVzaW5nUmVkaXJlY3QoXG4gICAgICBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55Piwgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHJvdXRlczogUm91dGVbXSwgcm91dGU6IFJvdXRlLFxuICAgICAgc2VnbWVudHM6IFVybFNlZ21lbnRbXSwgb3V0bGV0OiBzdHJpbmcpOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRHcm91cD4ge1xuICAgIGNvbnN0IHttYXRjaGVkLCBjb25zdW1lZFNlZ21lbnRzLCBsYXN0Q2hpbGQsIHBvc2l0aW9uYWxQYXJhbVNlZ21lbnRzfSA9XG4gICAgICAgIG1hdGNoKHNlZ21lbnRHcm91cCwgcm91dGUsIHNlZ21lbnRzKTtcbiAgICBpZiAoIW1hdGNoZWQpIHJldHVybiBub01hdGNoKHNlZ21lbnRHcm91cCk7XG5cbiAgICBjb25zdCBuZXdUcmVlID0gdGhpcy5hcHBseVJlZGlyZWN0Q29tbWFuZHMoXG4gICAgICAgIGNvbnN1bWVkU2VnbWVudHMsIHJvdXRlLnJlZGlyZWN0VG8gISwgPGFueT5wb3NpdGlvbmFsUGFyYW1TZWdtZW50cyk7XG4gICAgaWYgKHJvdXRlLnJlZGlyZWN0VG8gIS5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgIHJldHVybiBhYnNvbHV0ZVJlZGlyZWN0KG5ld1RyZWUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmxpbmVyYWxpemVTZWdtZW50cyhyb3V0ZSwgbmV3VHJlZSkucGlwZShtZXJnZU1hcCgobmV3U2VnbWVudHM6IFVybFNlZ21lbnRbXSkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kU2VnbWVudChcbiAgICAgICAgICBuZ01vZHVsZSwgc2VnbWVudEdyb3VwLCByb3V0ZXMsIG5ld1NlZ21lbnRzLmNvbmNhdChzZWdtZW50cy5zbGljZShsYXN0Q2hpbGQpKSwgb3V0bGV0LFxuICAgICAgICAgIGZhbHNlKTtcbiAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoU2VnbWVudEFnYWluc3RSb3V0ZShcbiAgICAgIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+LCByYXdTZWdtZW50R3JvdXA6IFVybFNlZ21lbnRHcm91cCwgcm91dGU6IFJvdXRlLFxuICAgICAgc2VnbWVudHM6IFVybFNlZ21lbnRbXSk6IE9ic2VydmFibGU8VXJsU2VnbWVudEdyb3VwPiB7XG4gICAgaWYgKHJvdXRlLnBhdGggPT09ICcqKicpIHtcbiAgICAgIGlmIChyb3V0ZS5sb2FkQ2hpbGRyZW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnTG9hZGVyLmxvYWQobmdNb2R1bGUuaW5qZWN0b3IsIHJvdXRlKVxuICAgICAgICAgICAgLnBpcGUobWFwKChjZmc6IExvYWRlZFJvdXRlckNvbmZpZykgPT4ge1xuICAgICAgICAgICAgICByb3V0ZS5fbG9hZGVkQ29uZmlnID0gY2ZnO1xuICAgICAgICAgICAgICByZXR1cm4gbmV3IFVybFNlZ21lbnRHcm91cChzZWdtZW50cywge30pO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gb2YgKG5ldyBVcmxTZWdtZW50R3JvdXAoc2VnbWVudHMsIHt9KSk7XG4gICAgfVxuXG4gICAgY29uc3Qge21hdGNoZWQsIGNvbnN1bWVkU2VnbWVudHMsIGxhc3RDaGlsZH0gPSBtYXRjaChyYXdTZWdtZW50R3JvdXAsIHJvdXRlLCBzZWdtZW50cyk7XG4gICAgaWYgKCFtYXRjaGVkKSByZXR1cm4gbm9NYXRjaChyYXdTZWdtZW50R3JvdXApO1xuXG4gICAgY29uc3QgcmF3U2xpY2VkU2VnbWVudHMgPSBzZWdtZW50cy5zbGljZShsYXN0Q2hpbGQpO1xuICAgIGNvbnN0IGNoaWxkQ29uZmlnJCA9IHRoaXMuZ2V0Q2hpbGRDb25maWcobmdNb2R1bGUsIHJvdXRlLCBzZWdtZW50cyk7XG5cbiAgICByZXR1cm4gY2hpbGRDb25maWckLnBpcGUobWVyZ2VNYXAoKHJvdXRlckNvbmZpZzogTG9hZGVkUm91dGVyQ29uZmlnKSA9PiB7XG4gICAgICBjb25zdCBjaGlsZE1vZHVsZSA9IHJvdXRlckNvbmZpZy5tb2R1bGU7XG4gICAgICBjb25zdCBjaGlsZENvbmZpZyA9IHJvdXRlckNvbmZpZy5yb3V0ZXM7XG5cbiAgICAgIGNvbnN0IHtzZWdtZW50R3JvdXAsIHNsaWNlZFNlZ21lbnRzfSA9XG4gICAgICAgICAgc3BsaXQocmF3U2VnbWVudEdyb3VwLCBjb25zdW1lZFNlZ21lbnRzLCByYXdTbGljZWRTZWdtZW50cywgY2hpbGRDb25maWcpO1xuXG4gICAgICBpZiAoc2xpY2VkU2VnbWVudHMubGVuZ3RoID09PSAwICYmIHNlZ21lbnRHcm91cC5oYXNDaGlsZHJlbigpKSB7XG4gICAgICAgIGNvbnN0IGV4cGFuZGVkJCA9IHRoaXMuZXhwYW5kQ2hpbGRyZW4oY2hpbGRNb2R1bGUsIGNoaWxkQ29uZmlnLCBzZWdtZW50R3JvdXApO1xuICAgICAgICByZXR1cm4gZXhwYW5kZWQkLnBpcGUoXG4gICAgICAgICAgICBtYXAoKGNoaWxkcmVuOiBhbnkpID0+IG5ldyBVcmxTZWdtZW50R3JvdXAoY29uc3VtZWRTZWdtZW50cywgY2hpbGRyZW4pKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGlsZENvbmZpZy5sZW5ndGggPT09IDAgJiYgc2xpY2VkU2VnbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBvZiAobmV3IFVybFNlZ21lbnRHcm91cChjb25zdW1lZFNlZ21lbnRzLCB7fSkpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBleHBhbmRlZCQgPSB0aGlzLmV4cGFuZFNlZ21lbnQoXG4gICAgICAgICAgY2hpbGRNb2R1bGUsIHNlZ21lbnRHcm91cCwgY2hpbGRDb25maWcsIHNsaWNlZFNlZ21lbnRzLCBQUklNQVJZX09VVExFVCwgdHJ1ZSk7XG4gICAgICByZXR1cm4gZXhwYW5kZWQkLnBpcGUoXG4gICAgICAgICAgbWFwKChjczogVXJsU2VnbWVudEdyb3VwKSA9PlxuICAgICAgICAgICAgICAgICAgbmV3IFVybFNlZ21lbnRHcm91cChjb25zdW1lZFNlZ21lbnRzLmNvbmNhdChjcy5zZWdtZW50cyksIGNzLmNoaWxkcmVuKSkpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q2hpbGRDb25maWcobmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT4sIHJvdXRlOiBSb3V0ZSwgc2VnbWVudHM6IFVybFNlZ21lbnRbXSk6XG4gICAgICBPYnNlcnZhYmxlPExvYWRlZFJvdXRlckNvbmZpZz4ge1xuICAgIGlmIChyb3V0ZS5jaGlsZHJlbikge1xuICAgICAgLy8gVGhlIGNoaWxkcmVuIGJlbG9uZyB0byB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIHJldHVybiBvZiAobmV3IExvYWRlZFJvdXRlckNvbmZpZyhyb3V0ZS5jaGlsZHJlbiwgbmdNb2R1bGUpKTtcbiAgICB9XG5cbiAgICBpZiAocm91dGUubG9hZENoaWxkcmVuKSB7XG4gICAgICAvLyBsYXp5IGNoaWxkcmVuIGJlbG9uZyB0byB0aGUgbG9hZGVkIG1vZHVsZVxuICAgICAgaWYgKHJvdXRlLl9sb2FkZWRDb25maWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gb2YgKHJvdXRlLl9sb2FkZWRDb25maWcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcnVuQ2FuTG9hZEd1YXJkKG5nTW9kdWxlLmluamVjdG9yLCByb3V0ZSwgc2VnbWVudHMpXG4gICAgICAgICAgLnBpcGUobWVyZ2VNYXAoKHNob3VsZExvYWQ6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgIGlmIChzaG91bGRMb2FkKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ0xvYWRlci5sb2FkKG5nTW9kdWxlLmluamVjdG9yLCByb3V0ZSlcbiAgICAgICAgICAgICAgICAgIC5waXBlKG1hcCgoY2ZnOiBMb2FkZWRSb3V0ZXJDb25maWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcm91dGUuX2xvYWRlZENvbmZpZyA9IGNmZztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNmZztcbiAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYW5Mb2FkRmFpbHMocm91dGUpO1xuICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2YgKG5ldyBMb2FkZWRSb3V0ZXJDb25maWcoW10sIG5nTW9kdWxlKSk7XG4gIH1cblxuICBwcml2YXRlIGxpbmVyYWxpemVTZWdtZW50cyhyb3V0ZTogUm91dGUsIHVybFRyZWU6IFVybFRyZWUpOiBPYnNlcnZhYmxlPFVybFNlZ21lbnRbXT4ge1xuICAgIGxldCByZXM6IFVybFNlZ21lbnRbXSA9IFtdO1xuICAgIGxldCBjID0gdXJsVHJlZS5yb290O1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXMgPSByZXMuY29uY2F0KGMuc2VnbWVudHMpO1xuICAgICAgaWYgKGMubnVtYmVyT2ZDaGlsZHJlbiA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb2YgKHJlcyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjLm51bWJlck9mQ2hpbGRyZW4gPiAxIHx8ICFjLmNoaWxkcmVuW1BSSU1BUllfT1VUTEVUXSkge1xuICAgICAgICByZXR1cm4gbmFtZWRPdXRsZXRzUmVkaXJlY3Qocm91dGUucmVkaXJlY3RUbyAhKTtcbiAgICAgIH1cblxuICAgICAgYyA9IGMuY2hpbGRyZW5bUFJJTUFSWV9PVVRMRVRdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlSZWRpcmVjdENvbW1hbmRzKFxuICAgICAgc2VnbWVudHM6IFVybFNlZ21lbnRbXSwgcmVkaXJlY3RUbzogc3RyaW5nLCBwb3NQYXJhbXM6IHtbazogc3RyaW5nXTogVXJsU2VnbWVudH0pOiBVcmxUcmVlIHtcbiAgICByZXR1cm4gdGhpcy5hcHBseVJlZGlyZWN0Q3JlYXRyZVVybFRyZWUoXG4gICAgICAgIHJlZGlyZWN0VG8sIHRoaXMudXJsU2VyaWFsaXplci5wYXJzZShyZWRpcmVjdFRvKSwgc2VnbWVudHMsIHBvc1BhcmFtcyk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UmVkaXJlY3RDcmVhdHJlVXJsVHJlZShcbiAgICAgIHJlZGlyZWN0VG86IHN0cmluZywgdXJsVHJlZTogVXJsVHJlZSwgc2VnbWVudHM6IFVybFNlZ21lbnRbXSxcbiAgICAgIHBvc1BhcmFtczoge1trOiBzdHJpbmddOiBVcmxTZWdtZW50fSk6IFVybFRyZWUge1xuICAgIGNvbnN0IG5ld1Jvb3QgPSB0aGlzLmNyZWF0ZVNlZ21lbnRHcm91cChyZWRpcmVjdFRvLCB1cmxUcmVlLnJvb3QsIHNlZ21lbnRzLCBwb3NQYXJhbXMpO1xuICAgIHJldHVybiBuZXcgVXJsVHJlZShcbiAgICAgICAgbmV3Um9vdCwgdGhpcy5jcmVhdGVRdWVyeVBhcmFtcyh1cmxUcmVlLnF1ZXJ5UGFyYW1zLCB0aGlzLnVybFRyZWUucXVlcnlQYXJhbXMpLFxuICAgICAgICB1cmxUcmVlLmZyYWdtZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUXVlcnlQYXJhbXMocmVkaXJlY3RUb1BhcmFtczogUGFyYW1zLCBhY3R1YWxQYXJhbXM6IFBhcmFtcyk6IFBhcmFtcyB7XG4gICAgY29uc3QgcmVzOiBQYXJhbXMgPSB7fTtcbiAgICBmb3JFYWNoKHJlZGlyZWN0VG9QYXJhbXMsICh2OiBhbnksIGs6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgY29weVNvdXJjZVZhbHVlID0gdHlwZW9mIHYgPT09ICdzdHJpbmcnICYmIHYuc3RhcnRzV2l0aCgnOicpO1xuICAgICAgaWYgKGNvcHlTb3VyY2VWYWx1ZSkge1xuICAgICAgICBjb25zdCBzb3VyY2VOYW1lID0gdi5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHJlc1trXSA9IGFjdHVhbFBhcmFtc1tzb3VyY2VOYW1lXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc1trXSA9IHY7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU2VnbWVudEdyb3VwKFxuICAgICAgcmVkaXJlY3RUbzogc3RyaW5nLCBncm91cDogVXJsU2VnbWVudEdyb3VwLCBzZWdtZW50czogVXJsU2VnbWVudFtdLFxuICAgICAgcG9zUGFyYW1zOiB7W2s6IHN0cmluZ106IFVybFNlZ21lbnR9KTogVXJsU2VnbWVudEdyb3VwIHtcbiAgICBjb25zdCB1cGRhdGVkU2VnbWVudHMgPSB0aGlzLmNyZWF0ZVNlZ21lbnRzKHJlZGlyZWN0VG8sIGdyb3VwLnNlZ21lbnRzLCBzZWdtZW50cywgcG9zUGFyYW1zKTtcblxuICAgIGxldCBjaGlsZHJlbjoge1tuOiBzdHJpbmddOiBVcmxTZWdtZW50R3JvdXB9ID0ge307XG4gICAgZm9yRWFjaChncm91cC5jaGlsZHJlbiwgKGNoaWxkOiBVcmxTZWdtZW50R3JvdXAsIG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgY2hpbGRyZW5bbmFtZV0gPSB0aGlzLmNyZWF0ZVNlZ21lbnRHcm91cChyZWRpcmVjdFRvLCBjaGlsZCwgc2VnbWVudHMsIHBvc1BhcmFtcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFVybFNlZ21lbnRHcm91cCh1cGRhdGVkU2VnbWVudHMsIGNoaWxkcmVuKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU2VnbWVudHMoXG4gICAgICByZWRpcmVjdFRvOiBzdHJpbmcsIHJlZGlyZWN0VG9TZWdtZW50czogVXJsU2VnbWVudFtdLCBhY3R1YWxTZWdtZW50czogVXJsU2VnbWVudFtdLFxuICAgICAgcG9zUGFyYW1zOiB7W2s6IHN0cmluZ106IFVybFNlZ21lbnR9KTogVXJsU2VnbWVudFtdIHtcbiAgICByZXR1cm4gcmVkaXJlY3RUb1NlZ21lbnRzLm1hcChcbiAgICAgICAgcyA9PiBzLnBhdGguc3RhcnRzV2l0aCgnOicpID8gdGhpcy5maW5kUG9zUGFyYW0ocmVkaXJlY3RUbywgcywgcG9zUGFyYW1zKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZE9yUmV0dXJuKHMsIGFjdHVhbFNlZ21lbnRzKSk7XG4gIH1cblxuICBwcml2YXRlIGZpbmRQb3NQYXJhbShcbiAgICAgIHJlZGlyZWN0VG86IHN0cmluZywgcmVkaXJlY3RUb1VybFNlZ21lbnQ6IFVybFNlZ21lbnQsXG4gICAgICBwb3NQYXJhbXM6IHtbazogc3RyaW5nXTogVXJsU2VnbWVudH0pOiBVcmxTZWdtZW50IHtcbiAgICBjb25zdCBwb3MgPSBwb3NQYXJhbXNbcmVkaXJlY3RUb1VybFNlZ21lbnQucGF0aC5zdWJzdHJpbmcoMSldO1xuICAgIGlmICghcG9zKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgcmVkaXJlY3QgdG8gJyR7cmVkaXJlY3RUb30nLiBDYW5ub3QgZmluZCAnJHtyZWRpcmVjdFRvVXJsU2VnbWVudC5wYXRofScuYCk7XG4gICAgcmV0dXJuIHBvcztcbiAgfVxuXG4gIHByaXZhdGUgZmluZE9yUmV0dXJuKHJlZGlyZWN0VG9VcmxTZWdtZW50OiBVcmxTZWdtZW50LCBhY3R1YWxTZWdtZW50czogVXJsU2VnbWVudFtdKTogVXJsU2VnbWVudCB7XG4gICAgbGV0IGlkeCA9IDA7XG4gICAgZm9yIChjb25zdCBzIG9mIGFjdHVhbFNlZ21lbnRzKSB7XG4gICAgICBpZiAocy5wYXRoID09PSByZWRpcmVjdFRvVXJsU2VnbWVudC5wYXRoKSB7XG4gICAgICAgIGFjdHVhbFNlZ21lbnRzLnNwbGljZShpZHgpO1xuICAgICAgICByZXR1cm4gcztcbiAgICAgIH1cbiAgICAgIGlkeCsrO1xuICAgIH1cbiAgICByZXR1cm4gcmVkaXJlY3RUb1VybFNlZ21lbnQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gcnVuQ2FuTG9hZEd1YXJkKFxuICAgIG1vZHVsZUluamVjdG9yOiBJbmplY3Rvciwgcm91dGU6IFJvdXRlLCBzZWdtZW50czogVXJsU2VnbWVudFtdKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gIGNvbnN0IGNhbkxvYWQgPSByb3V0ZS5jYW5Mb2FkO1xuICBpZiAoIWNhbkxvYWQgfHwgY2FuTG9hZC5sZW5ndGggPT09IDApIHJldHVybiBvZiAodHJ1ZSk7XG5cbiAgY29uc3Qgb2JzID0gZnJvbShjYW5Mb2FkKS5waXBlKG1hcCgoaW5qZWN0aW9uVG9rZW46IGFueSkgPT4ge1xuICAgIGNvbnN0IGd1YXJkID0gbW9kdWxlSW5qZWN0b3IuZ2V0KGluamVjdGlvblRva2VuKTtcbiAgICByZXR1cm4gd3JhcEludG9PYnNlcnZhYmxlKFxuICAgICAgICBndWFyZC5jYW5Mb2FkID8gZ3VhcmQuY2FuTG9hZChyb3V0ZSwgc2VnbWVudHMpIDogZ3VhcmQocm91dGUsIHNlZ21lbnRzKSk7XG4gIH0pKTtcblxuICByZXR1cm4gYW5kT2JzZXJ2YWJsZXMob2JzKTtcbn1cblxuZnVuY3Rpb24gbWF0Y2goc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHJvdXRlOiBSb3V0ZSwgc2VnbWVudHM6IFVybFNlZ21lbnRbXSk6IHtcbiAgbWF0Y2hlZDogYm9vbGVhbixcbiAgY29uc3VtZWRTZWdtZW50czogVXJsU2VnbWVudFtdLFxuICBsYXN0Q2hpbGQ6IG51bWJlcixcbiAgcG9zaXRpb25hbFBhcmFtU2VnbWVudHM6IHtbazogc3RyaW5nXTogVXJsU2VnbWVudH1cbn0ge1xuICBpZiAocm91dGUucGF0aCA9PT0gJycpIHtcbiAgICBpZiAoKHJvdXRlLnBhdGhNYXRjaCA9PT0gJ2Z1bGwnKSAmJiAoc2VnbWVudEdyb3VwLmhhc0NoaWxkcmVuKCkgfHwgc2VnbWVudHMubGVuZ3RoID4gMCkpIHtcbiAgICAgIHJldHVybiB7bWF0Y2hlZDogZmFsc2UsIGNvbnN1bWVkU2VnbWVudHM6IFtdLCBsYXN0Q2hpbGQ6IDAsIHBvc2l0aW9uYWxQYXJhbVNlZ21lbnRzOiB7fX07XG4gICAgfVxuXG4gICAgcmV0dXJuIHttYXRjaGVkOiB0cnVlLCBjb25zdW1lZFNlZ21lbnRzOiBbXSwgbGFzdENoaWxkOiAwLCBwb3NpdGlvbmFsUGFyYW1TZWdtZW50czoge319O1xuICB9XG5cbiAgY29uc3QgbWF0Y2hlciA9IHJvdXRlLm1hdGNoZXIgfHwgZGVmYXVsdFVybE1hdGNoZXI7XG4gIGNvbnN0IHJlcyA9IG1hdGNoZXIoc2VnbWVudHMsIHNlZ21lbnRHcm91cCwgcm91dGUpO1xuXG4gIGlmICghcmVzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZWQ6IGZhbHNlLFxuICAgICAgY29uc3VtZWRTZWdtZW50czogPGFueVtdPltdLFxuICAgICAgbGFzdENoaWxkOiAwLFxuICAgICAgcG9zaXRpb25hbFBhcmFtU2VnbWVudHM6IHt9LFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG1hdGNoZWQ6IHRydWUsXG4gICAgY29uc3VtZWRTZWdtZW50czogcmVzLmNvbnN1bWVkICEsXG4gICAgbGFzdENoaWxkOiByZXMuY29uc3VtZWQubGVuZ3RoICEsXG4gICAgcG9zaXRpb25hbFBhcmFtU2VnbWVudHM6IHJlcy5wb3NQYXJhbXMgISxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc3BsaXQoXG4gICAgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIGNvbnN1bWVkU2VnbWVudHM6IFVybFNlZ21lbnRbXSwgc2xpY2VkU2VnbWVudHM6IFVybFNlZ21lbnRbXSxcbiAgICBjb25maWc6IFJvdXRlW10pIHtcbiAgaWYgKHNsaWNlZFNlZ21lbnRzLmxlbmd0aCA+IDAgJiZcbiAgICAgIGNvbnRhaW5zRW1wdHlQYXRoUmVkaXJlY3RzV2l0aE5hbWVkT3V0bGV0cyhzZWdtZW50R3JvdXAsIHNsaWNlZFNlZ21lbnRzLCBjb25maWcpKSB7XG4gICAgY29uc3QgcyA9IG5ldyBVcmxTZWdtZW50R3JvdXAoXG4gICAgICAgIGNvbnN1bWVkU2VnbWVudHMsIGNyZWF0ZUNoaWxkcmVuRm9yRW1wdHlTZWdtZW50cyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZywgbmV3IFVybFNlZ21lbnRHcm91cChzbGljZWRTZWdtZW50cywgc2VnbWVudEdyb3VwLmNoaWxkcmVuKSkpO1xuICAgIHJldHVybiB7c2VnbWVudEdyb3VwOiBtZXJnZVRyaXZpYWxDaGlsZHJlbihzKSwgc2xpY2VkU2VnbWVudHM6IFtdfTtcbiAgfVxuXG4gIGlmIChzbGljZWRTZWdtZW50cy5sZW5ndGggPT09IDAgJiZcbiAgICAgIGNvbnRhaW5zRW1wdHlQYXRoUmVkaXJlY3RzKHNlZ21lbnRHcm91cCwgc2xpY2VkU2VnbWVudHMsIGNvbmZpZykpIHtcbiAgICBjb25zdCBzID0gbmV3IFVybFNlZ21lbnRHcm91cChcbiAgICAgICAgc2VnbWVudEdyb3VwLnNlZ21lbnRzLCBhZGRFbXB0eVNlZ21lbnRzVG9DaGlsZHJlbklmTmVlZGVkKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50R3JvdXAsIHNsaWNlZFNlZ21lbnRzLCBjb25maWcsIHNlZ21lbnRHcm91cC5jaGlsZHJlbikpO1xuICAgIHJldHVybiB7c2VnbWVudEdyb3VwOiBtZXJnZVRyaXZpYWxDaGlsZHJlbihzKSwgc2xpY2VkU2VnbWVudHN9O1xuICB9XG5cbiAgcmV0dXJuIHtzZWdtZW50R3JvdXAsIHNsaWNlZFNlZ21lbnRzfTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VUcml2aWFsQ2hpbGRyZW4oczogVXJsU2VnbWVudEdyb3VwKTogVXJsU2VnbWVudEdyb3VwIHtcbiAgaWYgKHMubnVtYmVyT2ZDaGlsZHJlbiA9PT0gMSAmJiBzLmNoaWxkcmVuW1BSSU1BUllfT1VUTEVUXSkge1xuICAgIGNvbnN0IGMgPSBzLmNoaWxkcmVuW1BSSU1BUllfT1VUTEVUXTtcbiAgICByZXR1cm4gbmV3IFVybFNlZ21lbnRHcm91cChzLnNlZ21lbnRzLmNvbmNhdChjLnNlZ21lbnRzKSwgYy5jaGlsZHJlbik7XG4gIH1cblxuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gYWRkRW1wdHlTZWdtZW50c1RvQ2hpbGRyZW5JZk5lZWRlZChcbiAgICBzZWdtZW50R3JvdXA6IFVybFNlZ21lbnRHcm91cCwgc2xpY2VkU2VnbWVudHM6IFVybFNlZ21lbnRbXSwgcm91dGVzOiBSb3V0ZVtdLFxuICAgIGNoaWxkcmVuOiB7W25hbWU6IHN0cmluZ106IFVybFNlZ21lbnRHcm91cH0pOiB7W25hbWU6IHN0cmluZ106IFVybFNlZ21lbnRHcm91cH0ge1xuICBjb25zdCByZXM6IHtbbmFtZTogc3RyaW5nXTogVXJsU2VnbWVudEdyb3VwfSA9IHt9O1xuICBmb3IgKGNvbnN0IHIgb2Ygcm91dGVzKSB7XG4gICAgaWYgKGlzRW1wdHlQYXRoUmVkaXJlY3Qoc2VnbWVudEdyb3VwLCBzbGljZWRTZWdtZW50cywgcikgJiYgIWNoaWxkcmVuW2dldE91dGxldChyKV0pIHtcbiAgICAgIHJlc1tnZXRPdXRsZXQocildID0gbmV3IFVybFNlZ21lbnRHcm91cChbXSwge30pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gey4uLmNoaWxkcmVuLCAuLi5yZXN9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDaGlsZHJlbkZvckVtcHR5U2VnbWVudHMoXG4gICAgcm91dGVzOiBSb3V0ZVtdLCBwcmltYXJ5U2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXApOiB7W25hbWU6IHN0cmluZ106IFVybFNlZ21lbnRHcm91cH0ge1xuICBjb25zdCByZXM6IHtbbmFtZTogc3RyaW5nXTogVXJsU2VnbWVudEdyb3VwfSA9IHt9O1xuICByZXNbUFJJTUFSWV9PVVRMRVRdID0gcHJpbWFyeVNlZ21lbnRHcm91cDtcbiAgZm9yIChjb25zdCByIG9mIHJvdXRlcykge1xuICAgIGlmIChyLnBhdGggPT09ICcnICYmIGdldE91dGxldChyKSAhPT0gUFJJTUFSWV9PVVRMRVQpIHtcbiAgICAgIHJlc1tnZXRPdXRsZXQocildID0gbmV3IFVybFNlZ21lbnRHcm91cChbXSwge30pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5mdW5jdGlvbiBjb250YWluc0VtcHR5UGF0aFJlZGlyZWN0c1dpdGhOYW1lZE91dGxldHMoXG4gICAgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHNlZ21lbnRzOiBVcmxTZWdtZW50W10sIHJvdXRlczogUm91dGVbXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gcm91dGVzLnNvbWUoXG4gICAgICByID0+IGlzRW1wdHlQYXRoUmVkaXJlY3Qoc2VnbWVudEdyb3VwLCBzZWdtZW50cywgcikgJiYgZ2V0T3V0bGV0KHIpICE9PSBQUklNQVJZX09VVExFVCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zRW1wdHlQYXRoUmVkaXJlY3RzKFxuICAgIHNlZ21lbnRHcm91cDogVXJsU2VnbWVudEdyb3VwLCBzZWdtZW50czogVXJsU2VnbWVudFtdLCByb3V0ZXM6IFJvdXRlW10pOiBib29sZWFuIHtcbiAgcmV0dXJuIHJvdXRlcy5zb21lKHIgPT4gaXNFbXB0eVBhdGhSZWRpcmVjdChzZWdtZW50R3JvdXAsIHNlZ21lbnRzLCByKSk7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHlQYXRoUmVkaXJlY3QoXG4gICAgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHNlZ21lbnRzOiBVcmxTZWdtZW50W10sIHI6IFJvdXRlKTogYm9vbGVhbiB7XG4gIGlmICgoc2VnbWVudEdyb3VwLmhhc0NoaWxkcmVuKCkgfHwgc2VnbWVudHMubGVuZ3RoID4gMCkgJiYgci5wYXRoTWF0Y2ggPT09ICdmdWxsJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiByLnBhdGggPT09ICcnICYmIHIucmVkaXJlY3RUbyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBnZXRPdXRsZXQocm91dGU6IFJvdXRlKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJvdXRlLm91dGxldCB8fCBQUklNQVJZX09VVExFVDtcbn1cbiJdfQ==