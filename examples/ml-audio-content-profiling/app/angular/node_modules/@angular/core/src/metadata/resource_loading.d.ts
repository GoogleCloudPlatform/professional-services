/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Component } from './directives';
/**
 * Used to resolve resource URLs on `@Component` when used with JIT compilation.
 *
 * Example:
 * ```
 * @Component({
 *   selector: 'my-comp',
 *   templateUrl: 'my-comp.html', // This requires asynchronous resolution
 * })
 * class MyComponnent{
 * }
 *
 * // Calling `renderComponent` will fail because `MyComponent`'s `@Compenent.templateUrl`
 * // needs to be resolved because `renderComponent` is synchronous process.
 * // renderComponent(MyComponent);
 *
 * // Calling `resolveComponentResources` will resolve `@Compenent.templateUrl` into
 * // `@Compenent.template`, which would allow `renderComponent` to proceed in synchronous manner.
 * // Use browser's `fetch` function as the default resource resolution strategy.
 * resolveComponentResources(fetch).then(() => {
 *   // After resolution all URLs have been converted into strings.
 *   renderComponent(MyComponent);
 * });
 *
 * ```
 *
 * NOTE: In AOT the resolution happens during compilation, and so there should be no need
 * to call this method outside JIT mode.
 *
 * @param resourceResolver a function which is responsible to returning a `Promise` of the resolved
 * URL. Browser's `fetch` method is a good default implementation.
 */
export declare function resolveComponentResources(resourceResolver: (url: string) => (Promise<string | {
    text(): Promise<string>;
}>)): Promise<null>;
export declare function maybeQueueResolutionOfComponentResources(metadata: Component): void;
export declare function componentNeedsResolution(component: Component): string | number | undefined;
export declare function clearResolutionOfComponentResourcesQueue(): void;
