/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Type } from '../type';
import { InjectionToken } from './injection_token';
import { StaticProvider } from './provider';
export declare const SOURCE = "__source";
export declare const THROW_IF_NOT_FOUND: Object;
/**
 * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
 *
 * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
 * project.
 *
 * @publicApi
 */
export declare const INJECTOR: InjectionToken<Injector>;
export declare class NullInjector implements Injector {
    get(token: any, notFoundValue?: any): any;
}
/**
 * Concrete injectors implement this interface.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * @usageNotes
 * ### Example
 *
 * {@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector` returns itself when given `Injector` as a token:
 *
 * {@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 * @publicApi
 */
export declare abstract class Injector {
    static THROW_IF_NOT_FOUND: Object;
    static NULL: Injector;
    /**
     * Retrieves an instance from the injector based on the provided token.
     * @returns The instance from the injector if defined, otherwise the `notFoundValue`.
     * @throws When the `notFoundValue` is `undefined` or `Injector.THROW_IF_NOT_FOUND`.
     */
    abstract get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
    /**
     * @deprecated from v4.0.0 use Type<T> or InjectionToken<T>
     * @suppress {duplicate}
     */
    abstract get(token: any, notFoundValue?: any): any;
    /**
     * @deprecated from v5 use the new signature Injector.create(options)
     */
    static create(providers: StaticProvider[], parent?: Injector): Injector;
    static create(options: {
        providers: StaticProvider[];
        parent?: Injector;
        name?: string;
    }): Injector;
    static ngInjectableDef: never;
}
export declare const USE_VALUE: string;
export declare class StaticInjector implements Injector {
    readonly parent: Injector;
    readonly source: string | null;
    private _records;
    constructor(providers: StaticProvider[], parent?: Injector, source?: string | null);
    get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
    get(token: any, notFoundValue?: any): any;
    toString(): string;
}
/**
 * Injection flags for DI.
 *
 * @publicApi
 */
export declare const enum InjectFlags {
    Default = 0,
    /**
     * Specifies that an injector should retrieve a dependency from any injector until reaching the
     * host element of the current component. (Only used with Element Injector)
     */
    Host = 1,
    /** Don't descend into ancestors of the node requesting injection. */
    Self = 2,
    /** Skip the node that is requesting injection. */
    SkipSelf = 4,
    /** Inject `defaultValue` instead if token not found. */
    Optional = 8
}
export declare function setCurrentInjector(injector: Injector | null | undefined): Injector | undefined | null;
/**
 * Injects a token from the currently active injector.
 *
 * This function must be used in the context of a factory function such as one defined for an
 * `InjectionToken`, and will throw an error if not called from such a context.
 *
 * @usageNotes
 * ### Example
 *
 * {@example core/di/ts/injector_spec.ts region='ShakeableInjectionToken'}
 *
 * Within such a factory function `inject` is utilized to request injection of a dependency, instead
 * of providing an additional array of dependencies as was common to do with `useFactory` providers.
 * `inject` is faster and more type-safe.
 *
 * @publicApi
 */
export declare function inject<T>(token: Type<T> | InjectionToken<T>): T;
export declare function inject<T>(token: Type<T> | InjectionToken<T>, flags?: InjectFlags): T | null;
export declare function injectArgs(types: (Type<any> | InjectionToken<any> | any[])[]): any[];
