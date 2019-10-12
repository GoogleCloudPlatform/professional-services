/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '@angular/core';
import { ChildrenOutletContexts } from '../router_outlet_context';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '../router_state';
export declare class CanActivate {
    path: ActivatedRouteSnapshot[];
    readonly route: ActivatedRouteSnapshot;
    constructor(path: ActivatedRouteSnapshot[]);
}
export declare class CanDeactivate {
    component: Object | null;
    route: ActivatedRouteSnapshot;
    constructor(component: Object | null, route: ActivatedRouteSnapshot);
}
export declare type Checks = {
    canDeactivateChecks: CanDeactivate[];
    canActivateChecks: CanActivate[];
};
export declare function getAllRouteGuards(future: RouterStateSnapshot, curr: RouterStateSnapshot, parentContexts: ChildrenOutletContexts): Checks;
export declare function getCanActivateChild(p: ActivatedRouteSnapshot): {
    node: ActivatedRouteSnapshot;
    guards: any[];
} | null;
export declare function getToken(token: any, snapshot: ActivatedRouteSnapshot, moduleInjector: Injector): any;
