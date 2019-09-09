/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { MonoTypeOperatorFunction } from 'rxjs';
import { Event } from '../events';
import { RouteReuseStrategy } from '../route_reuse_strategy';
import { NavigationTransition } from '../router';
import { ChildrenOutletContexts } from '../router_outlet_context';
import { RouterState } from '../router_state';
export declare const activateRoutes: (rootContexts: ChildrenOutletContexts, routeReuseStrategy: RouteReuseStrategy, forwardEvent: (evt: Event) => void) => MonoTypeOperatorFunction<NavigationTransition>;
export declare class ActivateRoutes {
    private routeReuseStrategy;
    private futureState;
    private currState;
    private forwardEvent;
    constructor(routeReuseStrategy: RouteReuseStrategy, futureState: RouterState, currState: RouterState, forwardEvent: (evt: Event) => void);
    activate(parentContexts: ChildrenOutletContexts): void;
    private deactivateChildRoutes;
    private deactivateRoutes;
    private deactivateRouteAndItsChildren;
    private detachAndStoreRouteSubtree;
    private deactivateRouteAndOutlet;
    private activateChildRoutes;
    private activateRoutes;
}
