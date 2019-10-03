/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { InjectFlags, Injector } from '../di/injector';
import { Type } from '../type';
import { DirectiveDef } from './interfaces/definition';
import { TContainerNode, TElementContainerNode, TElementNode, TNode } from './interfaces/node';
import { LViewData, TData, TView } from './interfaces/view';
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injectorIndex The index of the node injector where this token should be registered
 * @param tView The TView for the injector's bloom filters
 * @param type The directive token to register
 */
export declare function bloomAdd(injectorIndex: number, tView: TView, type: Type<any>): void;
export declare function getOrCreateNodeInjector(): number;
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param tNode for which an injector should be retrieved / created.
 * @param hostView View where the node is stored
 * @returns Node injector
 */
export declare function getOrCreateNodeInjectorForNode(tNode: TElementNode | TContainerNode | TElementContainerNode, hostView: LViewData): number;
export declare function getInjectorIndex(tNode: TNode, hostView: LViewData): number;
/**
 * Finds the index of the parent injector, with a view offset if applicable. Used to set the
 * parent injector initially.
 */
export declare function getParentInjectorLocation(tNode: TNode, view: LViewData): number;
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the view is found that contains the parent
 * injector.
 *
 * @param location The location of the parent injector, which contains the view offset
 * @param startView The LViewData instance from which to start walking up the view tree
 * @returns The LViewData instance that contains the parent injector
 */
export declare function getParentInjectorView(location: number, startView: LViewData): LViewData;
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param di The node injector in which a directive will be added
 * @param def The definition of the directive to be made public
 */
export declare function diPublicInInjector(injectorIndex: number, view: LViewData, def: DirectiveDef<any>): void;
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param def The definition of the directive to be made public
 */
export declare function diPublic(def: DirectiveDef<any>): void;
/**
 * Returns the value associated to the given token from the injectors.
 *
 * `directiveInject` is intended to be used for directive, component and pipe factories.
 *  All other injection use `inject` which does not walk the node injector tree.
 *
 * Usage example (in factory function):
 *
 * class SomeDirective {
 *   constructor(directive: DirectiveA) {}
 *
 *   static ngDirectiveDef = defineDirective({
 *     type: SomeDirective,
 *     factory: () => new SomeDirective(directiveInject(DirectiveA))
 *   });
 * }
 *
 * @param token the type or token to inject
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export declare function directiveInject<T>(token: Type<T> | InjectionToken<T>): T;
export declare function directiveInject<T>(token: Type<T> | InjectionToken<T>, flags: InjectFlags): T;
/**
 * Inject static attribute value into directive constructor.
 *
 * This method is used with `factory` functions which are generated as part of
 * `defineDirective` or `defineComponent`. The method retrieves the static value
 * of an attribute. (Dynamic attributes are not supported since they are not resolved
 *  at the time of injection and can change over time.)
 *
 * # Example
 * Given:
 * ```
 * @Component(...)
 * class MyComponent {
 *   constructor(@Attribute('title') title: string) { ... }
 * }
 * ```
 * When instantiated with
 * ```
 * <my-component title="Hello"></my-component>
 * ```
 *
 * Then factory method generated is:
 * ```
 * MyComponent.ngComponentDef = defineComponent({
 *   factory: () => new MyComponent(injectAttribute('title'))
 *   ...
 * })
 * ```
 *
 * @publicApi
 */
export declare function injectAttribute(attrNameToInject: string): string | undefined;
/**
 * Returns the value associated to the given token from the injectors.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * @param nodeInjector Node injector where the search should start
 * @param token The token to look for
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export declare function getOrCreateInjectable<T>(hostTNode: TElementNode | TContainerNode | TElementContainerNode, hostView: LViewData, token: Type<T> | InjectionToken<T>, flags?: InjectFlags): T | null;
/**
 * Returns the bit in an injector's bloom filter that should be used to determine whether or not
 * the directive might be provided by the injector.
 *
 * When a directive is public, it is added to the bloom filter and given a unique ID that can be
 * retrieved on the Type. When the directive isn't public or the token is not a directive `null`
 * is returned as the node injector can not possibly provide that token.
 *
 * @param token the injection token
 * @returns the matching bit to check in the bloom filter or `null` if the token is not known.
 */
export declare function bloomHashBitOrFactory(token: Type<any> | InjectionToken<any>): number | Function | undefined;
export declare function injectorHasToken(bloomHash: number, injectorIndex: number, injectorView: LViewData | TData): boolean;
export declare class NodeInjector implements Injector {
    private _tNode;
    private _hostView;
    private _injectorIndex;
    constructor(_tNode: TElementNode | TContainerNode | TElementContainerNode, _hostView: LViewData);
    get(token: any): any;
}
export declare function getFactoryOf<T>(type: Type<any>): ((type?: Type<T>) => T) | null;
export declare function getInheritedFactory<T>(type: Type<any>): (type: Type<T>) => T;
