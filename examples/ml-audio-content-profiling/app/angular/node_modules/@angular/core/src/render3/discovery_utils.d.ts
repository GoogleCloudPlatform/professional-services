/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di/injector';
import { LContext } from './interfaces/context';
import { LViewData, RootContext } from './interfaces/view';
/**
 * NOTE: The following functions might not be ideal for core usage in Angular...
 *
 * Each function below is designed
 */
/**
 * Returns the component instance associated with the target.
 *
 * If a DOM is used then it will return the component that
 *    owns the view where the element is situated.
 * If a component instance is used then it will return the
 *    instance of the parent component depending on where
 *    the component instance is exists in a template.
 * If a directive instance is used then it will return the
 *    component that contains that directive in it's template.
 */
export declare function getComponent<T = {}>(target: {}): T | null;
/**
 * Returns the host component instance associated with the target.
 *
 * This will only return a component instance of the DOM node
 * contains an instance of a component on it.
 */
export declare function getHostComponent<T = {}>(target: {}): T | null;
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated.
 */
export declare function getRootContext(target: LViewData | {}): RootContext;
/**
 * Returns a list of all the components in the application
 * that are have been bootstrapped.
 */
export declare function getRootComponents(target: {}): any[];
/**
 * Returns the injector instance that is associated with
 * the element, component or directive.
 */
export declare function getInjector(target: {}): Injector;
/**
 * Returns a list of all the directives that are associated
 * with the underlying target element.
 */
export declare function getDirectives(target: {}): Array<{}>;
/**
 * Returns LContext associated with a target passed as an argument.
 * Throws if a given target doesn't have associated LContext.
 */
export declare function loadContext(target: {}): LContext;
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param componentOrView any component or view
 */
export declare function getRootView(componentOrView: LViewData | {}): LViewData;
/**
 *  Retrieve map of local references (local reference name => element or directive instance).
 */
export declare function getLocalRefs(target: {}): {
    [key: string]: any;
};
