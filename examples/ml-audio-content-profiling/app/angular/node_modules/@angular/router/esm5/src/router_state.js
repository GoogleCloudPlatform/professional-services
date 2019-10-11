/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PRIMARY_OUTLET, convertToParamMap } from './shared';
import { UrlSegment, equalSegments } from './url_tree';
import { shallowEqual, shallowEqualArrays } from './utils/collection';
import { Tree, TreeNode } from './utils/tree';
/**
 * @description
 *
 * Represents the state of the router.
 *
 * RouterState is a tree of activated routes. Every node in this tree knows about the "consumed" URL
 * segments, the extracted parameters, and the resolved data.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * @Component({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const state: RouterState = router.routerState;
 *     const root: ActivatedRoute = state.root;
 *     const child = root.firstChild;
 *     const id: Observable<string> = child.params.map(p => p.id);
 *     //...
 *   }
 * }
 * ```
 *
 * See `ActivatedRoute` for more information.
 *
 * @publicApi
 */
var RouterState = /** @class */ (function (_super) {
    tslib_1.__extends(RouterState, _super);
    /** @internal */
    function RouterState(root, 
    /** The current snapshot of the router state */
    snapshot) {
        var _this = _super.call(this, root) || this;
        _this.snapshot = snapshot;
        setRouterState(_this, root);
        return _this;
    }
    RouterState.prototype.toString = function () { return this.snapshot.toString(); };
    return RouterState;
}(Tree));
export { RouterState };
export function createEmptyState(urlTree, rootComponent) {
    var snapshot = createEmptyStateSnapshot(urlTree, rootComponent);
    var emptyUrl = new BehaviorSubject([new UrlSegment('', {})]);
    var emptyParams = new BehaviorSubject({});
    var emptyData = new BehaviorSubject({});
    var emptyQueryParams = new BehaviorSubject({});
    var fragment = new BehaviorSubject('');
    var activated = new ActivatedRoute(emptyUrl, emptyParams, emptyQueryParams, fragment, emptyData, PRIMARY_OUTLET, rootComponent, snapshot.root);
    activated.snapshot = snapshot.root;
    return new RouterState(new TreeNode(activated, []), snapshot);
}
export function createEmptyStateSnapshot(urlTree, rootComponent) {
    var emptyParams = {};
    var emptyData = {};
    var emptyQueryParams = {};
    var fragment = '';
    var activated = new ActivatedRouteSnapshot([], emptyParams, emptyQueryParams, fragment, emptyData, PRIMARY_OUTLET, rootComponent, null, urlTree.root, -1, {});
    return new RouterStateSnapshot('', new TreeNode(activated, []));
}
/**
 * @description
 *
 * Contains the information about a route associated with a component loaded in an
 * outlet.  An `ActivatedRoute` can also be used to traverse the router state tree.
 *
 * ```
 * @Component({...})
 * class MyComponent {
 *   constructor(route: ActivatedRoute) {
 *     const id: Observable<string> = route.params.map(p => p.id);
 *     const url: Observable<string> = route.url.map(segments => segments.join(''));
 *     // route.data includes both `data` and `resolve`
 *     const user = route.data.map(d => d.user);
 *   }
 * }
 * ```
 *
 * @publicApi
 */
var ActivatedRoute = /** @class */ (function () {
    /** @internal */
    function ActivatedRoute(
    /** An observable of the URL segments matched by this route */
    url, 
    /** An observable of the matrix parameters scoped to this route */
    params, 
    /** An observable of the query parameters shared by all the routes */
    queryParams, 
    /** An observable of the URL fragment shared by all the routes */
    fragment, 
    /** An observable of the static and resolved data of this route. */
    data, 
    /** The outlet name of the route. It's a constant */
    outlet, 
    /** The component of the route. It's a constant */
    // TODO(vsavkin): remove |string
    component, futureSnapshot) {
        this.url = url;
        this.params = params;
        this.queryParams = queryParams;
        this.fragment = fragment;
        this.data = data;
        this.outlet = outlet;
        this.component = component;
        this._futureSnapshot = futureSnapshot;
    }
    Object.defineProperty(ActivatedRoute.prototype, "routeConfig", {
        /** The configuration used to match this route */
        get: function () { return this._futureSnapshot.routeConfig; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "root", {
        /** The root of the router state */
        get: function () { return this._routerState.root; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "parent", {
        /** The parent of this route in the router state tree */
        get: function () { return this._routerState.parent(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "firstChild", {
        /** The first child of this route in the router state tree */
        get: function () { return this._routerState.firstChild(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "children", {
        /** The children of this route in the router state tree */
        get: function () { return this._routerState.children(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "pathFromRoot", {
        /** The path from the root of the router state tree to this route */
        get: function () { return this._routerState.pathFromRoot(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "paramMap", {
        get: function () {
            if (!this._paramMap) {
                this._paramMap = this.params.pipe(map(function (p) { return convertToParamMap(p); }));
            }
            return this._paramMap;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRoute.prototype, "queryParamMap", {
        get: function () {
            if (!this._queryParamMap) {
                this._queryParamMap =
                    this.queryParams.pipe(map(function (p) { return convertToParamMap(p); }));
            }
            return this._queryParamMap;
        },
        enumerable: true,
        configurable: true
    });
    ActivatedRoute.prototype.toString = function () {
        return this.snapshot ? this.snapshot.toString() : "Future(" + this._futureSnapshot + ")";
    };
    return ActivatedRoute;
}());
export { ActivatedRoute };
/**
 * Returns the inherited params, data, and resolve for a given route.
 * By default, this only inherits values up to the nearest path-less or component-less route.
 * @internal
 */
export function inheritedParamsDataResolve(route, paramsInheritanceStrategy) {
    if (paramsInheritanceStrategy === void 0) { paramsInheritanceStrategy = 'emptyOnly'; }
    var pathFromRoot = route.pathFromRoot;
    var inheritingStartingFrom = 0;
    if (paramsInheritanceStrategy !== 'always') {
        inheritingStartingFrom = pathFromRoot.length - 1;
        while (inheritingStartingFrom >= 1) {
            var current = pathFromRoot[inheritingStartingFrom];
            var parent_1 = pathFromRoot[inheritingStartingFrom - 1];
            // current route is an empty path => inherits its parent's params and data
            if (current.routeConfig && current.routeConfig.path === '') {
                inheritingStartingFrom--;
                // parent is componentless => current route should inherit its params and data
            }
            else if (!parent_1.component) {
                inheritingStartingFrom--;
            }
            else {
                break;
            }
        }
    }
    return flattenInherited(pathFromRoot.slice(inheritingStartingFrom));
}
/** @internal */
function flattenInherited(pathFromRoot) {
    return pathFromRoot.reduce(function (res, curr) {
        var params = tslib_1.__assign({}, res.params, curr.params);
        var data = tslib_1.__assign({}, res.data, curr.data);
        var resolve = tslib_1.__assign({}, res.resolve, curr._resolvedData);
        return { params: params, data: data, resolve: resolve };
    }, { params: {}, data: {}, resolve: {} });
}
/**
 * @description
 *
 * Contains the information about a route associated with a component loaded in an
 * outlet at a particular moment in time. ActivatedRouteSnapshot can also be used to
 * traverse the router state tree.
 *
 * ```
 * @Component({templateUrl:'./my-component.html'})
 * class MyComponent {
 *   constructor(route: ActivatedRoute) {
 *     const id: string = route.snapshot.params.id;
 *     const url: string = route.snapshot.url.join('');
 *     const user = route.snapshot.data.user;
 *   }
 * }
 * ```
 *
 * @publicApi
 */
var ActivatedRouteSnapshot = /** @class */ (function () {
    /** @internal */
    function ActivatedRouteSnapshot(
    /** The URL segments matched by this route */
    url, 
    /** The matrix parameters scoped to this route */
    params, 
    /** The query parameters shared by all the routes */
    queryParams, 
    /** The URL fragment shared by all the routes */
    fragment, 
    /** The static and resolved data of this route */
    data, 
    /** The outlet name of the route */
    outlet, 
    /** The component of the route */
    component, routeConfig, urlSegment, lastPathIndex, resolve) {
        this.url = url;
        this.params = params;
        this.queryParams = queryParams;
        this.fragment = fragment;
        this.data = data;
        this.outlet = outlet;
        this.component = component;
        this.routeConfig = routeConfig;
        this._urlSegment = urlSegment;
        this._lastPathIndex = lastPathIndex;
        this._resolve = resolve;
    }
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "root", {
        /** The root of the router state */
        get: function () { return this._routerState.root; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "parent", {
        /** The parent of this route in the router state tree */
        get: function () { return this._routerState.parent(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "firstChild", {
        /** The first child of this route in the router state tree */
        get: function () { return this._routerState.firstChild(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "children", {
        /** The children of this route in the router state tree */
        get: function () { return this._routerState.children(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "pathFromRoot", {
        /** The path from the root of the router state tree to this route */
        get: function () { return this._routerState.pathFromRoot(this); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "paramMap", {
        get: function () {
            if (!this._paramMap) {
                this._paramMap = convertToParamMap(this.params);
            }
            return this._paramMap;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ActivatedRouteSnapshot.prototype, "queryParamMap", {
        get: function () {
            if (!this._queryParamMap) {
                this._queryParamMap = convertToParamMap(this.queryParams);
            }
            return this._queryParamMap;
        },
        enumerable: true,
        configurable: true
    });
    ActivatedRouteSnapshot.prototype.toString = function () {
        var url = this.url.map(function (segment) { return segment.toString(); }).join('/');
        var matched = this.routeConfig ? this.routeConfig.path : '';
        return "Route(url:'" + url + "', path:'" + matched + "')";
    };
    return ActivatedRouteSnapshot;
}());
export { ActivatedRouteSnapshot };
/**
 * @description
 *
 * Represents the state of the router at a moment in time.
 *
 * This is a tree of activated route snapshots. Every node in this tree knows about
 * the "consumed" URL segments, the extracted parameters, and the resolved data.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * @Component({templateUrl:'template.html'})
 * class MyComponent {
 *   constructor(router: Router) {
 *     const state: RouterState = router.routerState;
 *     const snapshot: RouterStateSnapshot = state.snapshot;
 *     const root: ActivatedRouteSnapshot = snapshot.root;
 *     const child = root.firstChild;
 *     const id: Observable<string> = child.params.map(p => p.id);
 *     //...
 *   }
 * }
 * ```
 *
 * @publicApi
 */
var RouterStateSnapshot = /** @class */ (function (_super) {
    tslib_1.__extends(RouterStateSnapshot, _super);
    /** @internal */
    function RouterStateSnapshot(
    /** The url from which this snapshot was created */
    url, root) {
        var _this = _super.call(this, root) || this;
        _this.url = url;
        setRouterState(_this, root);
        return _this;
    }
    RouterStateSnapshot.prototype.toString = function () { return serializeNode(this._root); };
    return RouterStateSnapshot;
}(Tree));
export { RouterStateSnapshot };
function setRouterState(state, node) {
    node.value._routerState = state;
    node.children.forEach(function (c) { return setRouterState(state, c); });
}
function serializeNode(node) {
    var c = node.children.length > 0 ? " { " + node.children.map(serializeNode).join(', ') + " } " : '';
    return "" + node.value + c;
}
/**
 * The expectation is that the activate route is created with the right set of parameters.
 * So we push new values into the observables only when they are not the initial values.
 * And we detect that by checking if the snapshot field is set.
 */
export function advanceActivatedRoute(route) {
    if (route.snapshot) {
        var currentSnapshot = route.snapshot;
        var nextSnapshot = route._futureSnapshot;
        route.snapshot = nextSnapshot;
        if (!shallowEqual(currentSnapshot.queryParams, nextSnapshot.queryParams)) {
            route.queryParams.next(nextSnapshot.queryParams);
        }
        if (currentSnapshot.fragment !== nextSnapshot.fragment) {
            route.fragment.next(nextSnapshot.fragment);
        }
        if (!shallowEqual(currentSnapshot.params, nextSnapshot.params)) {
            route.params.next(nextSnapshot.params);
        }
        if (!shallowEqualArrays(currentSnapshot.url, nextSnapshot.url)) {
            route.url.next(nextSnapshot.url);
        }
        if (!shallowEqual(currentSnapshot.data, nextSnapshot.data)) {
            route.data.next(nextSnapshot.data);
        }
    }
    else {
        route.snapshot = route._futureSnapshot;
        // this is for resolved data
        route.data.next(route._futureSnapshot.data);
    }
}
export function equalParamsAndUrlSegments(a, b) {
    var equalUrlParams = shallowEqual(a.params, b.params) && equalSegments(a.url, b.url);
    var parentsMismatch = !a.parent !== !b.parent;
    return equalUrlParams && !parentsMismatch &&
        (!a.parent || equalParamsAndUrlSegments(a.parent, b.parent));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX3N0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9yb3V0ZXJfc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUdILE9BQU8sRUFBQyxlQUFlLEVBQWEsTUFBTSxNQUFNLENBQUM7QUFDakQsT0FBTyxFQUFDLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR25DLE9BQU8sRUFBQyxjQUFjLEVBQW9CLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdFLE9BQU8sRUFBQyxVQUFVLEVBQTRCLGFBQWEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMvRSxPQUFPLEVBQUMsWUFBWSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDcEUsT0FBTyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFJNUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJCRztBQUNIO0lBQWlDLHVDQUFvQjtJQUNuRCxnQkFBZ0I7SUFDaEIscUJBQ0ksSUFBOEI7SUFDOUIsK0NBQStDO0lBQ3hDLFFBQTZCO1FBSHhDLFlBSUUsa0JBQU0sSUFBSSxDQUFDLFNBRVo7UUFIVSxjQUFRLEdBQVIsUUFBUSxDQUFxQjtRQUV0QyxjQUFjLENBQWMsS0FBSSxFQUFFLElBQUksQ0FBQyxDQUFDOztJQUMxQyxDQUFDO0lBRUQsOEJBQVEsR0FBUixjQUFxQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3pELGtCQUFDO0FBQUQsQ0FBQyxBQVhELENBQWlDLElBQUksR0FXcEM7O0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLE9BQWdCLEVBQUUsYUFBOEI7SUFDL0UsSUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FB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QyxHQUFHLENBQUMsRUFBRTtZQUN4RCxLQUFLLENBQUMsR0FBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekM7UUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BELEtBQUssQ0FBQyxJQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQztLQUNGO1NBQU07UUFDTCxLQUFLLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7UUFFdkMsNEJBQTRCO1FBQ3RCLEtBQUssQ0FBQyxJQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDcEQ7QUFDSCxDQUFDO0FBR0QsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxDQUF5QixFQUFFLENBQXlCO0lBQ3RELElBQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkYsSUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUVoRCxPQUFPLGNBQWMsSUFBSSxDQUFDLGVBQWU7UUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUkseUJBQXlCLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFBUSxDQUFDLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtCZWhhdmlvclN1YmplY3QsIE9ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtEYXRhLCBSZXNvbHZlRGF0YSwgUm91dGV9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7UFJJTUFSWV9PVVRMRVQsIFBhcmFtTWFwLCBQYXJhbXMsIGNvbnZlcnRUb1BhcmFtTWFwfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQge1VybFNlZ21lbnQsIFVybFNlZ21lbnRHcm91cCwgVXJsVHJlZSwgZXF1YWxTZWdtZW50c30gZnJvbSAnLi91cmxfdHJlZSc7XG5pbXBvcnQge3NoYWxsb3dFcXVhbCwgc2hhbGxvd0VxdWFsQXJyYXlzfSBmcm9tICcuL3V0aWxzL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtUcmVlLCBUcmVlTm9kZX0gZnJvbSAnLi91dGlscy90cmVlJztcblxuXG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogUmVwcmVzZW50cyB0aGUgc3RhdGUgb2YgdGhlIHJvdXRlci5cbiAqXG4gKiBSb3V0ZXJTdGF0ZSBpcyBhIHRyZWUgb2YgYWN0aXZhdGVkIHJvdXRlcy4gRXZlcnkgbm9kZSBpbiB0aGlzIHRyZWUga25vd3MgYWJvdXQgdGhlIFwiY29uc3VtZWRcIiBVUkxcbiAqIHNlZ21lbnRzLCB0aGUgZXh0cmFjdGVkIHBhcmFtZXRlcnMsIGFuZCB0aGUgcmVzb2x2ZWQgZGF0YS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe3RlbXBsYXRlVXJsOid0ZW1wbGF0ZS5odG1sJ30pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKHJvdXRlcjogUm91dGVyKSB7XG4gKiAgICAgY29uc3Qgc3RhdGU6IFJvdXRlclN0YXRlID0gcm91dGVyLnJvdXRlclN0YXRlO1xuICogICAgIGNvbnN0IHJvb3Q6IEFjdGl2YXRlZFJvdXRlID0gc3RhdGUucm9vdDtcbiAqICAgICBjb25zdCBjaGlsZCA9IHJvb3QuZmlyc3RDaGlsZDtcbiAqICAgICBjb25zdCBpZDogT2JzZXJ2YWJsZTxzdHJpbmc+ID0gY2hpbGQucGFyYW1zLm1hcChwID0+IHAuaWQpO1xuICogICAgIC8vLi4uXG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIFNlZSBgQWN0aXZhdGVkUm91dGVgIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIFJvdXRlclN0YXRlIGV4dGVuZHMgVHJlZTxBY3RpdmF0ZWRSb3V0ZT4ge1xuICAvKiogQGludGVybmFsICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcm9vdDogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGU+LFxuICAgICAgLyoqIFRoZSBjdXJyZW50IHNuYXBzaG90IG9mIHRoZSByb3V0ZXIgc3RhdGUgKi9cbiAgICAgIHB1YmxpYyBzbmFwc2hvdDogUm91dGVyU3RhdGVTbmFwc2hvdCkge1xuICAgIHN1cGVyKHJvb3QpO1xuICAgIHNldFJvdXRlclN0YXRlKDxSb3V0ZXJTdGF0ZT50aGlzLCByb290KTtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLnNuYXBzaG90LnRvU3RyaW5nKCk7IH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3RhdGUodXJsVHJlZTogVXJsVHJlZSwgcm9vdENvbXBvbmVudDogVHlwZTxhbnk+fCBudWxsKTogUm91dGVyU3RhdGUge1xuICBjb25zdCBzbmFwc2hvdCA9IGNyZWF0ZUVtcHR5U3RhdGVTbmFwc2hvdCh1cmxUcmVlLCByb290Q29tcG9uZW50KTtcbiAgY29uc3QgZW1wdHlVcmwgPSBuZXcgQmVoYXZpb3JTdWJqZWN0KFtuZXcgVXJsU2VnbWVudCgnJywge30pXSk7XG4gIGNvbnN0IGVtcHR5UGFyYW1zID0gbmV3IEJlaGF2aW9yU3ViamVjdCh7fSk7XG4gIGNvbnN0IGVtcHR5RGF0YSA9IG5ldyBCZWhhdmlvclN1YmplY3Qoe30pO1xuICBjb25zdCBlbXB0eVF1ZXJ5UGFyYW1zID0gbmV3IEJlaGF2aW9yU3ViamVjdCh7fSk7XG4gIGNvbnN0IGZyYWdtZW50ID0gbmV3IEJlaGF2aW9yU3ViamVjdCgnJyk7XG4gIGNvbnN0IGFjdGl2YXRlZCA9IG5ldyBBY3RpdmF0ZWRSb3V0ZShcbiAgICAgIGVtcHR5VXJsLCBlbXB0eVBhcmFtcywgZW1wdHlRdWVyeVBhcmFtcywgZnJhZ21lbnQsIGVtcHR5RGF0YSwgUFJJTUFSWV9PVVRMRVQsIHJvb3RDb21wb25lbnQsXG4gICAgICBzbmFwc2hvdC5yb290KTtcbiAgYWN0aXZhdGVkLnNuYXBzaG90ID0gc25hcHNob3Qucm9vdDtcbiAgcmV0dXJuIG5ldyBSb3V0ZXJTdGF0ZShuZXcgVHJlZU5vZGU8QWN0aXZhdGVkUm91dGU+KGFjdGl2YXRlZCwgW10pLCBzbmFwc2hvdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbXB0eVN0YXRlU25hcHNob3QoXG4gICAgdXJsVHJlZTogVXJsVHJlZSwgcm9vdENvbXBvbmVudDogVHlwZTxhbnk+fCBudWxsKTogUm91dGVyU3RhdGVTbmFwc2hvdCB7XG4gIGNvbnN0IGVtcHR5UGFyYW1zID0ge307XG4gIGNvbnN0IGVtcHR5RGF0YSA9IHt9O1xuICBjb25zdCBlbXB0eVF1ZXJ5UGFyYW1zID0ge307XG4gIGNvbnN0IGZyYWdtZW50ID0gJyc7XG4gIGNvbnN0IGFjdGl2YXRlZCA9IG5ldyBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KFxuICAgICAgW10sIGVtcHR5UGFyYW1zLCBlbXB0eVF1ZXJ5UGFyYW1zLCBmcmFnbWVudCwgZW1wdHlEYXRhLCBQUklNQVJZX09VVExFVCwgcm9vdENvbXBvbmVudCwgbnVsbCxcbiAgICAgIHVybFRyZWUucm9vdCwgLTEsIHt9KTtcbiAgcmV0dXJuIG5ldyBSb3V0ZXJTdGF0ZVNuYXBzaG90KCcnLCBuZXcgVHJlZU5vZGU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD4oYWN0aXZhdGVkLCBbXSkpO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIENvbnRhaW5zIHRoZSBpbmZvcm1hdGlvbiBhYm91dCBhIHJvdXRlIGFzc29jaWF0ZWQgd2l0aCBhIGNvbXBvbmVudCBsb2FkZWQgaW4gYW5cbiAqIG91dGxldC4gIEFuIGBBY3RpdmF0ZWRSb3V0ZWAgY2FuIGFsc28gYmUgdXNlZCB0byB0cmF2ZXJzZSB0aGUgcm91dGVyIHN0YXRlIHRyZWUuXG4gKlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHsuLi59KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3Rvcihyb3V0ZTogQWN0aXZhdGVkUm91dGUpIHtcbiAqICAgICBjb25zdCBpZDogT2JzZXJ2YWJsZTxzdHJpbmc+ID0gcm91dGUucGFyYW1zLm1hcChwID0+IHAuaWQpO1xuICogICAgIGNvbnN0IHVybDogT2JzZXJ2YWJsZTxzdHJpbmc+ID0gcm91dGUudXJsLm1hcChzZWdtZW50cyA9PiBzZWdtZW50cy5qb2luKCcnKSk7XG4gKiAgICAgLy8gcm91dGUuZGF0YSBpbmNsdWRlcyBib3RoIGBkYXRhYCBhbmQgYHJlc29sdmVgXG4gKiAgICAgY29uc3QgdXNlciA9IHJvdXRlLmRhdGEubWFwKGQgPT4gZC51c2VyKTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQWN0aXZhdGVkUm91dGUge1xuICAvKiogVGhlIGN1cnJlbnQgc25hcHNob3Qgb2YgdGhpcyByb3V0ZSAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgc25hcHNob3QgITogQWN0aXZhdGVkUm91dGVTbmFwc2hvdDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZnV0dXJlU25hcHNob3Q6IEFjdGl2YXRlZFJvdXRlU25hcHNob3Q7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF9yb3V0ZXJTdGF0ZSAhOiBSb3V0ZXJTdGF0ZTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgX3BhcmFtTWFwICE6IE9ic2VydmFibGU8UGFyYW1NYXA+O1xuICAvKiogQGludGVybmFsICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfcXVlcnlQYXJhbU1hcCAhOiBPYnNlcnZhYmxlPFBhcmFtTWFwPjtcblxuICAvKiogQGludGVybmFsICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIEFuIG9ic2VydmFibGUgb2YgdGhlIFVSTCBzZWdtZW50cyBtYXRjaGVkIGJ5IHRoaXMgcm91dGUgKi9cbiAgICAgIHB1YmxpYyB1cmw6IE9ic2VydmFibGU8VXJsU2VnbWVudFtdPixcbiAgICAgIC8qKiBBbiBvYnNlcnZhYmxlIG9mIHRoZSBtYXRyaXggcGFyYW1ldGVycyBzY29wZWQgdG8gdGhpcyByb3V0ZSAqL1xuICAgICAgcHVibGljIHBhcmFtczogT2JzZXJ2YWJsZTxQYXJhbXM+LFxuICAgICAgLyoqIEFuIG9ic2VydmFibGUgb2YgdGhlIHF1ZXJ5IHBhcmFtZXRlcnMgc2hhcmVkIGJ5IGFsbCB0aGUgcm91dGVzICovXG4gICAgICBwdWJsaWMgcXVlcnlQYXJhbXM6IE9ic2VydmFibGU8UGFyYW1zPixcbiAgICAgIC8qKiBBbiBvYnNlcnZhYmxlIG9mIHRoZSBVUkwgZnJhZ21lbnQgc2hhcmVkIGJ5IGFsbCB0aGUgcm91dGVzICovXG4gICAgICBwdWJsaWMgZnJhZ21lbnQ6IE9ic2VydmFibGU8c3RyaW5nPixcbiAgICAgIC8qKiBBbiBvYnNlcnZhYmxlIG9mIHRoZSBzdGF0aWMgYW5kIHJlc29sdmVkIGRhdGEgb2YgdGhpcyByb3V0ZS4gKi9cbiAgICAgIHB1YmxpYyBkYXRhOiBPYnNlcnZhYmxlPERhdGE+LFxuICAgICAgLyoqIFRoZSBvdXRsZXQgbmFtZSBvZiB0aGUgcm91dGUuIEl0J3MgYSBjb25zdGFudCAqL1xuICAgICAgcHVibGljIG91dGxldDogc3RyaW5nLFxuICAgICAgLyoqIFRoZSBjb21wb25lbnQgb2YgdGhlIHJvdXRlLiBJdCdzIGEgY29uc3RhbnQgKi9cbiAgICAgIC8vIFRPRE8odnNhdmtpbik6IHJlbW92ZSB8c3RyaW5nXG4gICAgICBwdWJsaWMgY29tcG9uZW50OiBUeXBlPGFueT58c3RyaW5nfG51bGwsIGZ1dHVyZVNuYXBzaG90OiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KSB7XG4gICAgdGhpcy5fZnV0dXJlU25hcHNob3QgPSBmdXR1cmVTbmFwc2hvdDtcbiAgfVxuXG4gIC8qKiBUaGUgY29uZmlndXJhdGlvbiB1c2VkIHRvIG1hdGNoIHRoaXMgcm91dGUgKi9cbiAgZ2V0IHJvdXRlQ29uZmlnKCk6IFJvdXRlfG51bGwgeyByZXR1cm4gdGhpcy5fZnV0dXJlU25hcHNob3Qucm91dGVDb25maWc7IH1cblxuICAvKiogVGhlIHJvb3Qgb2YgdGhlIHJvdXRlciBzdGF0ZSAqL1xuICBnZXQgcm9vdCgpOiBBY3RpdmF0ZWRSb3V0ZSB7IHJldHVybiB0aGlzLl9yb3V0ZXJTdGF0ZS5yb290OyB9XG5cbiAgLyoqIFRoZSBwYXJlbnQgb2YgdGhpcyByb3V0ZSBpbiB0aGUgcm91dGVyIHN0YXRlIHRyZWUgKi9cbiAgZ2V0IHBhcmVudCgpOiBBY3RpdmF0ZWRSb3V0ZXxudWxsIHsgcmV0dXJuIHRoaXMuX3JvdXRlclN0YXRlLnBhcmVudCh0aGlzKTsgfVxuXG4gIC8qKiBUaGUgZmlyc3QgY2hpbGQgb2YgdGhpcyByb3V0ZSBpbiB0aGUgcm91dGVyIHN0YXRlIHRyZWUgKi9cbiAgZ2V0IGZpcnN0Q2hpbGQoKTogQWN0aXZhdGVkUm91dGV8bnVsbCB7IHJldHVybiB0aGlzLl9yb3V0ZXJTdGF0ZS5maXJzdENoaWxkKHRoaXMpOyB9XG5cbiAgLyoqIFRoZSBjaGlsZHJlbiBvZiB0aGlzIHJvdXRlIGluIHRoZSByb3V0ZXIgc3RhdGUgdHJlZSAqL1xuICBnZXQgY2hpbGRyZW4oKTogQWN0aXZhdGVkUm91dGVbXSB7IHJldHVybiB0aGlzLl9yb3V0ZXJTdGF0ZS5jaGlsZHJlbih0aGlzKTsgfVxuXG4gIC8qKiBUaGUgcGF0aCBmcm9tIHRoZSByb290IG9mIHRoZSByb3V0ZXIgc3RhdGUgdHJlZSB0byB0aGlzIHJvdXRlICovXG4gIGdldCBwYXRoRnJvbVJvb3QoKTogQWN0aXZhdGVkUm91dGVbXSB7IHJldHVybiB0aGlzLl9yb3V0ZXJTdGF0ZS5wYXRoRnJvbVJvb3QodGhpcyk7IH1cblxuICBnZXQgcGFyYW1NYXAoKTogT2JzZXJ2YWJsZTxQYXJhbU1hcD4ge1xuICAgIGlmICghdGhpcy5fcGFyYW1NYXApIHtcbiAgICAgIHRoaXMuX3BhcmFtTWFwID0gdGhpcy5wYXJhbXMucGlwZShtYXAoKHA6IFBhcmFtcyk6IFBhcmFtTWFwID0+IGNvbnZlcnRUb1BhcmFtTWFwKHApKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wYXJhbU1hcDtcbiAgfVxuXG4gIGdldCBxdWVyeVBhcmFtTWFwKCk6IE9ic2VydmFibGU8UGFyYW1NYXA+IHtcbiAgICBpZiAoIXRoaXMuX3F1ZXJ5UGFyYW1NYXApIHtcbiAgICAgIHRoaXMuX3F1ZXJ5UGFyYW1NYXAgPVxuICAgICAgICAgIHRoaXMucXVlcnlQYXJhbXMucGlwZShtYXAoKHA6IFBhcmFtcyk6IFBhcmFtTWFwID0+IGNvbnZlcnRUb1BhcmFtTWFwKHApKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9xdWVyeVBhcmFtTWFwO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zbmFwc2hvdCA/IHRoaXMuc25hcHNob3QudG9TdHJpbmcoKSA6IGBGdXR1cmUoJHt0aGlzLl9mdXR1cmVTbmFwc2hvdH0pYDtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBQYXJhbXNJbmhlcml0YW5jZVN0cmF0ZWd5ID0gJ2VtcHR5T25seScgfCAnYWx3YXlzJztcblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IHR5cGUgSW5oZXJpdGVkID0ge1xuICBwYXJhbXM6IFBhcmFtcyxcbiAgZGF0YTogRGF0YSxcbiAgcmVzb2x2ZTogRGF0YSxcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5oZXJpdGVkIHBhcmFtcywgZGF0YSwgYW5kIHJlc29sdmUgZm9yIGEgZ2l2ZW4gcm91dGUuXG4gKiBCeSBkZWZhdWx0LCB0aGlzIG9ubHkgaW5oZXJpdHMgdmFsdWVzIHVwIHRvIHRoZSBuZWFyZXN0IHBhdGgtbGVzcyBvciBjb21wb25lbnQtbGVzcyByb3V0ZS5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5oZXJpdGVkUGFyYW1zRGF0YVJlc29sdmUoXG4gICAgcm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gICAgcGFyYW1zSW5oZXJpdGFuY2VTdHJhdGVneTogUGFyYW1zSW5oZXJpdGFuY2VTdHJhdGVneSA9ICdlbXB0eU9ubHknKTogSW5oZXJpdGVkIHtcbiAgY29uc3QgcGF0aEZyb21Sb290ID0gcm91dGUucGF0aEZyb21Sb290O1xuXG4gIGxldCBpbmhlcml0aW5nU3RhcnRpbmdGcm9tID0gMDtcbiAgaWYgKHBhcmFtc0luaGVyaXRhbmNlU3RyYXRlZ3kgIT09ICdhbHdheXMnKSB7XG4gICAgaW5oZXJpdGluZ1N0YXJ0aW5nRnJvbSA9IHBhdGhGcm9tUm9vdC5sZW5ndGggLSAxO1xuXG4gICAgd2hpbGUgKGluaGVyaXRpbmdTdGFydGluZ0Zyb20gPj0gMSkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHBhdGhGcm9tUm9vdFtpbmhlcml0aW5nU3RhcnRpbmdGcm9tXTtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHBhdGhGcm9tUm9vdFtpbmhlcml0aW5nU3RhcnRpbmdGcm9tIC0gMV07XG4gICAgICAvLyBjdXJyZW50IHJvdXRlIGlzIGFuIGVtcHR5IHBhdGggPT4gaW5oZXJpdHMgaXRzIHBhcmVudCdzIHBhcmFtcyBhbmQgZGF0YVxuICAgICAgaWYgKGN1cnJlbnQucm91dGVDb25maWcgJiYgY3VycmVudC5yb3V0ZUNvbmZpZy5wYXRoID09PSAnJykge1xuICAgICAgICBpbmhlcml0aW5nU3RhcnRpbmdGcm9tLS07XG5cbiAgICAgICAgLy8gcGFyZW50IGlzIGNvbXBvbmVudGxlc3MgPT4gY3VycmVudCByb3V0ZSBzaG91bGQgaW5oZXJpdCBpdHMgcGFyYW1zIGFuZCBkYXRhXG4gICAgICB9IGVsc2UgaWYgKCFwYXJlbnQuY29tcG9uZW50KSB7XG4gICAgICAgIGluaGVyaXRpbmdTdGFydGluZ0Zyb20tLTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZsYXR0ZW5Jbmhlcml0ZWQocGF0aEZyb21Sb290LnNsaWNlKGluaGVyaXRpbmdTdGFydGluZ0Zyb20pKTtcbn1cblxuLyoqIEBpbnRlcm5hbCAqL1xuZnVuY3Rpb24gZmxhdHRlbkluaGVyaXRlZChwYXRoRnJvbVJvb3Q6IEFjdGl2YXRlZFJvdXRlU25hcHNob3RbXSk6IEluaGVyaXRlZCB7XG4gIHJldHVybiBwYXRoRnJvbVJvb3QucmVkdWNlKChyZXMsIGN1cnIpID0+IHtcbiAgICBjb25zdCBwYXJhbXMgPSB7Li4ucmVzLnBhcmFtcywgLi4uY3Vyci5wYXJhbXN9O1xuICAgIGNvbnN0IGRhdGEgPSB7Li4ucmVzLmRhdGEsIC4uLmN1cnIuZGF0YX07XG4gICAgY29uc3QgcmVzb2x2ZSA9IHsuLi5yZXMucmVzb2x2ZSwgLi4uY3Vyci5fcmVzb2x2ZWREYXRhfTtcbiAgICByZXR1cm4ge3BhcmFtcywgZGF0YSwgcmVzb2x2ZX07XG4gIH0sIDxhbnk+e3BhcmFtczoge30sIGRhdGE6IHt9LCByZXNvbHZlOiB7fX0pO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIENvbnRhaW5zIHRoZSBpbmZvcm1hdGlvbiBhYm91dCBhIHJvdXRlIGFzc29jaWF0ZWQgd2l0aCBhIGNvbXBvbmVudCBsb2FkZWQgaW4gYW5cbiAqIG91dGxldCBhdCBhIHBhcnRpY3VsYXIgbW9tZW50IGluIHRpbWUuIEFjdGl2YXRlZFJvdXRlU25hcHNob3QgY2FuIGFsc28gYmUgdXNlZCB0b1xuICogdHJhdmVyc2UgdGhlIHJvdXRlciBzdGF0ZSB0cmVlLlxuICpcbiAqIGBgYFxuICogQENvbXBvbmVudCh7dGVtcGxhdGVVcmw6Jy4vbXktY29tcG9uZW50Lmh0bWwnfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3Iocm91dGU6IEFjdGl2YXRlZFJvdXRlKSB7XG4gKiAgICAgY29uc3QgaWQ6IHN0cmluZyA9IHJvdXRlLnNuYXBzaG90LnBhcmFtcy5pZDtcbiAqICAgICBjb25zdCB1cmw6IHN0cmluZyA9IHJvdXRlLnNuYXBzaG90LnVybC5qb2luKCcnKTtcbiAqICAgICBjb25zdCB1c2VyID0gcm91dGUuc25hcHNob3QuZGF0YS51c2VyO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90IHtcbiAgLyoqIFRoZSBjb25maWd1cmF0aW9uIHVzZWQgdG8gbWF0Y2ggdGhpcyByb3V0ZSAqKi9cbiAgcHVibGljIHJlYWRvbmx5IHJvdXRlQ29uZmlnOiBSb3V0ZXxudWxsO1xuICAvKiogQGludGVybmFsICoqL1xuICBfdXJsU2VnbWVudDogVXJsU2VnbWVudEdyb3VwO1xuICAvKiogQGludGVybmFsICovXG4gIF9sYXN0UGF0aEluZGV4OiBudW1iZXI7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3Jlc29sdmU6IFJlc29sdmVEYXRhO1xuICAvKiogQGludGVybmFsICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfcmVzb2x2ZWREYXRhICE6IERhdGE7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF9yb3V0ZXJTdGF0ZSAhOiBSb3V0ZXJTdGF0ZVNuYXBzaG90O1xuICAvKiogQGludGVybmFsICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfcGFyYW1NYXAgITogUGFyYW1NYXA7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIF9xdWVyeVBhcmFtTWFwICE6IFBhcmFtTWFwO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICAvKiogVGhlIFVSTCBzZWdtZW50cyBtYXRjaGVkIGJ5IHRoaXMgcm91dGUgKi9cbiAgICAgIHB1YmxpYyB1cmw6IFVybFNlZ21lbnRbXSxcbiAgICAgIC8qKiBUaGUgbWF0cml4IHBhcmFtZXRlcnMgc2NvcGVkIHRvIHRoaXMgcm91dGUgKi9cbiAgICAgIHB1YmxpYyBwYXJhbXM6IFBhcmFtcyxcbiAgICAgIC8qKiBUaGUgcXVlcnkgcGFyYW1ldGVycyBzaGFyZWQgYnkgYWxsIHRoZSByb3V0ZXMgKi9cbiAgICAgIHB1YmxpYyBxdWVyeVBhcmFtczogUGFyYW1zLFxuICAgICAgLyoqIFRoZSBVUkwgZnJhZ21lbnQgc2hhcmVkIGJ5IGFsbCB0aGUgcm91dGVzICovXG4gICAgICBwdWJsaWMgZnJhZ21lbnQ6IHN0cmluZyxcbiAgICAgIC8qKiBUaGUgc3RhdGljIGFuZCByZXNvbHZlZCBkYXRhIG9mIHRoaXMgcm91dGUgKi9cbiAgICAgIHB1YmxpYyBkYXRhOiBEYXRhLFxuICAgICAgLyoqIFRoZSBvdXRsZXQgbmFtZSBvZiB0aGUgcm91dGUgKi9cbiAgICAgIHB1YmxpYyBvdXRsZXQ6IHN0cmluZyxcbiAgICAgIC8qKiBUaGUgY29tcG9uZW50IG9mIHRoZSByb3V0ZSAqL1xuICAgICAgcHVibGljIGNvbXBvbmVudDogVHlwZTxhbnk+fHN0cmluZ3xudWxsLCByb3V0ZUNvbmZpZzogUm91dGV8bnVsbCwgdXJsU2VnbWVudDogVXJsU2VnbWVudEdyb3VwLFxuICAgICAgbGFzdFBhdGhJbmRleDogbnVtYmVyLCByZXNvbHZlOiBSZXNvbHZlRGF0YSkge1xuICAgIHRoaXMucm91dGVDb25maWcgPSByb3V0ZUNvbmZpZztcbiAgICB0aGlzLl91cmxTZWdtZW50ID0gdXJsU2VnbWVudDtcbiAgICB0aGlzLl9sYXN0UGF0aEluZGV4ID0gbGFzdFBhdGhJbmRleDtcbiAgICB0aGlzLl9yZXNvbHZlID0gcmVzb2x2ZTtcbiAgfVxuXG4gIC8qKiBUaGUgcm9vdCBvZiB0aGUgcm91dGVyIHN0YXRlICovXG4gIGdldCByb290KCk6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QgeyByZXR1cm4gdGhpcy5fcm91dGVyU3RhdGUucm9vdDsgfVxuXG4gIC8qKiBUaGUgcGFyZW50IG9mIHRoaXMgcm91dGUgaW4gdGhlIHJvdXRlciBzdGF0ZSB0cmVlICovXG4gIGdldCBwYXJlbnQoKTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdHxudWxsIHsgcmV0dXJuIHRoaXMuX3JvdXRlclN0YXRlLnBhcmVudCh0aGlzKTsgfVxuXG4gIC8qKiBUaGUgZmlyc3QgY2hpbGQgb2YgdGhpcyByb3V0ZSBpbiB0aGUgcm91dGVyIHN0YXRlIHRyZWUgKi9cbiAgZ2V0IGZpcnN0Q2hpbGQoKTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdHxudWxsIHsgcmV0dXJuIHRoaXMuX3JvdXRlclN0YXRlLmZpcnN0Q2hpbGQodGhpcyk7IH1cblxuICAvKiogVGhlIGNoaWxkcmVuIG9mIHRoaXMgcm91dGUgaW4gdGhlIHJvdXRlciBzdGF0ZSB0cmVlICovXG4gIGdldCBjaGlsZHJlbigpOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90W10geyByZXR1cm4gdGhpcy5fcm91dGVyU3RhdGUuY2hpbGRyZW4odGhpcyk7IH1cblxuICAvKiogVGhlIHBhdGggZnJvbSB0aGUgcm9vdCBvZiB0aGUgcm91dGVyIHN0YXRlIHRyZWUgdG8gdGhpcyByb3V0ZSAqL1xuICBnZXQgcGF0aEZyb21Sb290KCk6IEFjdGl2YXRlZFJvdXRlU25hcHNob3RbXSB7IHJldHVybiB0aGlzLl9yb3V0ZXJTdGF0ZS5wYXRoRnJvbVJvb3QodGhpcyk7IH1cblxuICBnZXQgcGFyYW1NYXAoKTogUGFyYW1NYXAge1xuICAgIGlmICghdGhpcy5fcGFyYW1NYXApIHtcbiAgICAgIHRoaXMuX3BhcmFtTWFwID0gY29udmVydFRvUGFyYW1NYXAodGhpcy5wYXJhbXMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcGFyYW1NYXA7XG4gIH1cblxuICBnZXQgcXVlcnlQYXJhbU1hcCgpOiBQYXJhbU1hcCB7XG4gICAgaWYgKCF0aGlzLl9xdWVyeVBhcmFtTWFwKSB7XG4gICAgICB0aGlzLl9xdWVyeVBhcmFtTWFwID0gY29udmVydFRvUGFyYW1NYXAodGhpcy5xdWVyeVBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9xdWVyeVBhcmFtTWFwO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCB1cmwgPSB0aGlzLnVybC5tYXAoc2VnbWVudCA9PiBzZWdtZW50LnRvU3RyaW5nKCkpLmpvaW4oJy8nKTtcbiAgICBjb25zdCBtYXRjaGVkID0gdGhpcy5yb3V0ZUNvbmZpZyA/IHRoaXMucm91dGVDb25maWcucGF0aCA6ICcnO1xuICAgIHJldHVybiBgUm91dGUodXJsOicke3VybH0nLCBwYXRoOicke21hdGNoZWR9JylgO1xuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKlxuICogUmVwcmVzZW50cyB0aGUgc3RhdGUgb2YgdGhlIHJvdXRlciBhdCBhIG1vbWVudCBpbiB0aW1lLlxuICpcbiAqIFRoaXMgaXMgYSB0cmVlIG9mIGFjdGl2YXRlZCByb3V0ZSBzbmFwc2hvdHMuIEV2ZXJ5IG5vZGUgaW4gdGhpcyB0cmVlIGtub3dzIGFib3V0XG4gKiB0aGUgXCJjb25zdW1lZFwiIFVSTCBzZWdtZW50cywgdGhlIGV4dHJhY3RlZCBwYXJhbWV0ZXJzLCBhbmQgdGhlIHJlc29sdmVkIGRhdGEuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHt0ZW1wbGF0ZVVybDondGVtcGxhdGUuaHRtbCd9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3Rvcihyb3V0ZXI6IFJvdXRlcikge1xuICogICAgIGNvbnN0IHN0YXRlOiBSb3V0ZXJTdGF0ZSA9IHJvdXRlci5yb3V0ZXJTdGF0ZTtcbiAqICAgICBjb25zdCBzbmFwc2hvdDogUm91dGVyU3RhdGVTbmFwc2hvdCA9IHN0YXRlLnNuYXBzaG90O1xuICogICAgIGNvbnN0IHJvb3Q6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QgPSBzbmFwc2hvdC5yb290O1xuICogICAgIGNvbnN0IGNoaWxkID0gcm9vdC5maXJzdENoaWxkO1xuICogICAgIGNvbnN0IGlkOiBPYnNlcnZhYmxlPHN0cmluZz4gPSBjaGlsZC5wYXJhbXMubWFwKHAgPT4gcC5pZCk7XG4gKiAgICAgLy8uLi5cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgUm91dGVyU3RhdGVTbmFwc2hvdCBleHRlbmRzIFRyZWU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD4ge1xuICAvKiogQGludGVybmFsICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgLyoqIFRoZSB1cmwgZnJvbSB3aGljaCB0aGlzIHNuYXBzaG90IHdhcyBjcmVhdGVkICovXG4gICAgICBwdWJsaWMgdXJsOiBzdHJpbmcsIHJvb3Q6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlU25hcHNob3Q+KSB7XG4gICAgc3VwZXIocm9vdCk7XG4gICAgc2V0Um91dGVyU3RhdGUoPFJvdXRlclN0YXRlU25hcHNob3Q+dGhpcywgcm9vdCk7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gc2VyaWFsaXplTm9kZSh0aGlzLl9yb290KTsgfVxufVxuXG5mdW5jdGlvbiBzZXRSb3V0ZXJTdGF0ZTxVLCBUIGV4dGVuZHN7X3JvdXRlclN0YXRlOiBVfT4oc3RhdGU6IFUsIG5vZGU6IFRyZWVOb2RlPFQ+KTogdm9pZCB7XG4gIG5vZGUudmFsdWUuX3JvdXRlclN0YXRlID0gc3RhdGU7XG4gIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChjID0+IHNldFJvdXRlclN0YXRlKHN0YXRlLCBjKSk7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbGl6ZU5vZGUobm9kZTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD4pOiBzdHJpbmcge1xuICBjb25zdCBjID0gbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwID8gYCB7ICR7bm9kZS5jaGlsZHJlbi5tYXAoc2VyaWFsaXplTm9kZSkuam9pbignLCAnKX0gfSBgIDogJyc7XG4gIHJldHVybiBgJHtub2RlLnZhbHVlfSR7Y31gO1xufVxuXG4vKipcbiAqIFRoZSBleHBlY3RhdGlvbiBpcyB0aGF0IHRoZSBhY3RpdmF0ZSByb3V0ZSBpcyBjcmVhdGVkIHdpdGggdGhlIHJpZ2h0IHNldCBvZiBwYXJhbWV0ZXJzLlxuICogU28gd2UgcHVzaCBuZXcgdmFsdWVzIGludG8gdGhlIG9ic2VydmFibGVzIG9ubHkgd2hlbiB0aGV5IGFyZSBub3QgdGhlIGluaXRpYWwgdmFsdWVzLlxuICogQW5kIHdlIGRldGVjdCB0aGF0IGJ5IGNoZWNraW5nIGlmIHRoZSBzbmFwc2hvdCBmaWVsZCBpcyBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZHZhbmNlQWN0aXZhdGVkUm91dGUocm91dGU6IEFjdGl2YXRlZFJvdXRlKTogdm9pZCB7XG4gIGlmIChyb3V0ZS5zbmFwc2hvdCkge1xuICAgIGNvbnN0IGN1cnJlbnRTbmFwc2hvdCA9IHJvdXRlLnNuYXBzaG90O1xuICAgIGNvbnN0IG5leHRTbmFwc2hvdCA9IHJvdXRlLl9mdXR1cmVTbmFwc2hvdDtcbiAgICByb3V0ZS5zbmFwc2hvdCA9IG5leHRTbmFwc2hvdDtcbiAgICBpZiAoIXNoYWxsb3dFcXVhbChjdXJyZW50U25hcHNob3QucXVlcnlQYXJhbXMsIG5leHRTbmFwc2hvdC5xdWVyeVBhcmFtcykpIHtcbiAgICAgICg8YW55PnJvdXRlLnF1ZXJ5UGFyYW1zKS5uZXh0KG5leHRTbmFwc2hvdC5xdWVyeVBhcmFtcyk7XG4gICAgfVxuICAgIGlmIChjdXJyZW50U25hcHNob3QuZnJhZ21lbnQgIT09IG5leHRTbmFwc2hvdC5mcmFnbWVudCkge1xuICAgICAgKDxhbnk+cm91dGUuZnJhZ21lbnQpLm5leHQobmV4dFNuYXBzaG90LmZyYWdtZW50KTtcbiAgICB9XG4gICAgaWYgKCFzaGFsbG93RXF1YWwoY3VycmVudFNuYXBzaG90LnBhcmFtcywgbmV4dFNuYXBzaG90LnBhcmFtcykpIHtcbiAgICAgICg8YW55PnJvdXRlLnBhcmFtcykubmV4dChuZXh0U25hcHNob3QucGFyYW1zKTtcbiAgICB9XG4gICAgaWYgKCFzaGFsbG93RXF1YWxBcnJheXMoY3VycmVudFNuYXBzaG90LnVybCwgbmV4dFNuYXBzaG90LnVybCkpIHtcbiAgICAgICg8YW55PnJvdXRlLnVybCkubmV4dChuZXh0U25hcHNob3QudXJsKTtcbiAgICB9XG4gICAgaWYgKCFzaGFsbG93RXF1YWwoY3VycmVudFNuYXBzaG90LmRhdGEsIG5leHRTbmFwc2hvdC5kYXRhKSkge1xuICAgICAgKDxhbnk+cm91dGUuZGF0YSkubmV4dChuZXh0U25hcHNob3QuZGF0YSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJvdXRlLnNuYXBzaG90ID0gcm91dGUuX2Z1dHVyZVNuYXBzaG90O1xuXG4gICAgLy8gdGhpcyBpcyBmb3IgcmVzb2x2ZWQgZGF0YVxuICAgICg8YW55PnJvdXRlLmRhdGEpLm5leHQocm91dGUuX2Z1dHVyZVNuYXBzaG90LmRhdGEpO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsUGFyYW1zQW5kVXJsU2VnbWVudHMoXG4gICAgYTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgYjogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IGJvb2xlYW4ge1xuICBjb25zdCBlcXVhbFVybFBhcmFtcyA9IHNoYWxsb3dFcXVhbChhLnBhcmFtcywgYi5wYXJhbXMpICYmIGVxdWFsU2VnbWVudHMoYS51cmwsIGIudXJsKTtcbiAgY29uc3QgcGFyZW50c01pc21hdGNoID0gIWEucGFyZW50ICE9PSAhYi5wYXJlbnQ7XG5cbiAgcmV0dXJuIGVxdWFsVXJsUGFyYW1zICYmICFwYXJlbnRzTWlzbWF0Y2ggJiZcbiAgICAgICghYS5wYXJlbnQgfHwgZXF1YWxQYXJhbXNBbmRVcmxTZWdtZW50cyhhLnBhcmVudCwgYi5wYXJlbnQgISkpO1xufVxuIl19