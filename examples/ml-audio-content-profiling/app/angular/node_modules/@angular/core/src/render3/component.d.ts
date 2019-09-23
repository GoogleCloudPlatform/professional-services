/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../core';
import { Injector } from '../di/injector';
import { Sanitizer } from '../sanitization/security';
import { ComponentDef, ComponentType } from './interfaces/definition';
import { PlayerHandler } from './interfaces/player';
import { RElement, RNode, Renderer3, RendererFactory3 } from './interfaces/renderer';
import { LViewData, RootContext } from './interfaces/view';
/** Options that control how the component should be bootstrapped. */
export interface CreateComponentOptions {
    /** Which renderer factory to use. */
    rendererFactory?: RendererFactory3;
    /** A custom sanitizer instance */
    sanitizer?: Sanitizer;
    /** A custom animation player handler */
    playerHandler?: PlayerHandler;
    /**
     * Host element on which the component will be bootstrapped. If not specified,
     * the component definition's `tag` is used to query the existing DOM for the
     * element to bootstrap.
     */
    host?: RElement | string;
    /** Module injector for the component. If unspecified, the injector will be NULL_INJECTOR. */
    injector?: Injector;
    /**
     * List of features to be applied to the created component. Features are simply
     * functions that decorate a component with a certain behavior.
     *
     * Typically, the features in this list are features that cannot be added to the
     * other features list in the component definition because they rely on other factors.
     *
     * Example: `RootLifecycleHooks` is a function that adds lifecycle hook capabilities
     * to root components in a tree-shakable way. It cannot be added to the component
     * features list because there's no way of knowing when the component will be used as
     * a root component.
     */
    hostFeatures?: HostFeature[];
    /**
     * A function which is used to schedule change detection work in the future.
     *
     * When marking components as dirty, it is necessary to schedule the work of
     * change detection in the future. This is done to coalesce multiple
     * {@link markDirty} calls into a single changed detection processing.
     *
     * The default value of the scheduler is the `requestAnimationFrame` function.
     *
     * It is also useful to override this function for testing purposes.
     */
    scheduler?: (work: () => void) => void;
}
/** See CreateComponentOptions.hostFeatures */
declare type HostFeature = (<T>(component: T, componentDef: ComponentDef<T>) => void);
export declare const NULL_INJECTOR: Injector;
/**
 * Bootstraps a Component into an existing host element and returns an instance
 * of the component.
 *
 * Use this function to bootstrap a component into the DOM tree. Each invocation
 * of this function will create a separate tree of components, injectors and
 * change detection cycles and lifetimes. To dynamically insert a new component
 * into an existing tree such that it shares the same injection, change detection
 * and object lifetime, use {@link ViewContainer#createComponent}.
 *
 * @param componentType Component to bootstrap
 * @param options Optional parameters which control bootstrapping
 */
export declare function renderComponent<T>(componentType: ComponentType<T> | Type<T>, opts?: CreateComponentOptions): T;
/**
 * Creates the root component view and the root component node.
 *
 * @param rNode Render host element.
 * @param def ComponentDef
 * @param rootView The parent view where the host node is stored
 * @param renderer The current renderer
 * @param sanitizer The sanitizer, if provided
 *
 * @returns Component view created
 */
export declare function createRootComponentView(rNode: RElement | null, def: ComponentDef<any>, rootView: LViewData, renderer: Renderer3, sanitizer?: Sanitizer | null): LViewData;
/**
 * Creates a root component and sets it up with features and host bindings. Shared by
 * renderComponent() and ViewContainerRef.createComponent().
 */
export declare function createRootComponent<T>(hostRNode: RNode | null, componentView: LViewData, componentDef: ComponentDef<T>, rootView: LViewData, rootContext: RootContext, hostFeatures: HostFeature[] | null): any;
export declare function createRootContext(scheduler: (workFn: () => void) => void, playerHandler?: PlayerHandler | null): RootContext;
/**
 * Used to enable lifecycle hooks on the root component.
 *
 * Include this feature when calling `renderComponent` if the root component
 * you are rendering has lifecycle hooks defined. Otherwise, the hooks won't
 * be called properly.
 *
 * Example:
 *
 * ```
 * renderComponent(AppComponent, {features: [RootLifecycleHooks]});
 * ```
 */
export declare function LifecycleHooksFeature(component: any, def: ComponentDef<any>): void;
/**
 * Retrieve the host element of the component.
 *
 * Use this function to retrieve the host element of the component. The host
 * element is the element which the component is associated with.
 *
 * @param component Component for which the host element should be retrieved.
 */
export declare function getHostElement<T>(component: T): HTMLElement;
/**
 * Retrieves the rendered text for a given component.
 *
 * This function retrieves the host element of a component and
 * and then returns the `textContent` for that element. This implies
 * that the text returned will include re-projected content of
 * the component as well.
 *
 * @param component The component to return the content text for.
 */
export declare function getRenderedText(component: any): string;
/**
 * Wait on component until it is rendered.
 *
 * This function returns a `Promise` which is resolved when the component's
 * change detection is executed. This is determined by finding the scheduler
 * associated with the `component`'s render tree and waiting until the scheduler
 * flushes. If nothing is scheduled, the function returns a resolved promise.
 *
 * Example:
 * ```
 * await whenRendered(myComponent);
 * ```
 *
 * @param component Component to wait upon
 * @returns Promise which resolves when the component is rendered.
 */
export declare function whenRendered(component: any): Promise<null>;
export {};
