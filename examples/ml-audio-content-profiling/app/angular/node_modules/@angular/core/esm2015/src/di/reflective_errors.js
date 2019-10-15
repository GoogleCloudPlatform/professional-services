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
import { wrappedError } from '../error_handler';
import { ERROR_ORIGINAL_ERROR } from '../errors';
import { stringify } from '../util';
/**
 * @param {?} keys
 * @return {?}
 */
function findFirstClosedCycle(keys) {
    /** @type {?} */
    const res = [];
    for (let i = 0; i < keys.length; ++i) {
        if (res.indexOf(keys[i]) > -1) {
            res.push(keys[i]);
            return res;
        }
        res.push(keys[i]);
    }
    return res;
}
/**
 * @param {?} keys
 * @return {?}
 */
function constructResolvingPath(keys) {
    if (keys.length > 1) {
        /** @type {?} */
        const reversed = findFirstClosedCycle(keys.slice().reverse());
        /** @type {?} */
        const tokenStrs = reversed.map(k => stringify(k.token));
        return ' (' + tokenStrs.join(' -> ') + ')';
    }
    return '';
}
/**
 * @record
 */
export function InjectionError() { }
/** @type {?} */
InjectionError.prototype.keys;
/** @type {?} */
InjectionError.prototype.injectors;
/** @type {?} */
InjectionError.prototype.constructResolvingMessage;
/** @type {?} */
InjectionError.prototype.addKey;
/**
 * @param {?} injector
 * @param {?} key
 * @param {?} constructResolvingMessage
 * @param {?=} originalError
 * @return {?}
 */
function injectionError(injector, key, constructResolvingMessage, originalError) {
    /** @type {?} */
    const keys = [key];
    /** @type {?} */
    const errMsg = constructResolvingMessage(keys);
    /** @type {?} */
    const error = /** @type {?} */ ((originalError ? wrappedError(errMsg, originalError) : Error(errMsg)));
    error.addKey = addKey;
    error.keys = keys;
    error.injectors = [injector];
    error.constructResolvingMessage = constructResolvingMessage;
    (/** @type {?} */ (error))[ERROR_ORIGINAL_ERROR] = originalError;
    return error;
}
/**
 * @this {?}
 * @param {?} injector
 * @param {?} key
 * @return {?}
 */
function addKey(injector, key) {
    this.injectors.push(injector);
    this.keys.push(key);
    // Note: This updated message won't be reflected in the `.stack` property
    this.message = this.constructResolvingMessage(this.keys);
}
/**
 * Thrown when trying to retrieve a dependency by key from {\@link Injector}, but the
 * {\@link Injector} does not have a {\@link Provider} for the given key.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * class A {
 *   constructor(b:B) {}
 * }
 *
 * expect(() => Injector.resolveAndCreate([A])).toThrowError();
 * ```
 * @param {?} injector
 * @param {?} key
 * @return {?}
 */
export function noProviderError(injector, key) {
    return injectionError(injector, key, function (keys) {
        /** @type {?} */
        const first = stringify(keys[0].token);
        return `No provider for ${first}!${constructResolvingPath(keys)}`;
    });
}
/**
 * Thrown when dependencies form a cycle.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * var injector = Injector.resolveAndCreate([
 *   {provide: "one", useFactory: (two) => "two", deps: [[new Inject("two")]]},
 *   {provide: "two", useFactory: (one) => "one", deps: [[new Inject("one")]]}
 * ]);
 *
 * expect(() => injector.get("one")).toThrowError();
 * ```
 *
 * Retrieving `A` or `B` throws a `CyclicDependencyError` as the graph above cannot be constructed.
 * @param {?} injector
 * @param {?} key
 * @return {?}
 */
export function cyclicDependencyError(injector, key) {
    return injectionError(injector, key, function (keys) {
        return `Cannot instantiate cyclic dependency!${constructResolvingPath(keys)}`;
    });
}
/**
 * Thrown when a constructing type returns with an Error.
 *
 * The `InstantiationError` class contains the original error plus the dependency graph which caused
 * this object to be instantiated.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * class A {
 *   constructor() {
 *     throw new Error('message');
 *   }
 * }
 *
 * var injector = Injector.resolveAndCreate([A]);
 * try {
 *   injector.get(A);
 * } catch (e) {
 *   expect(e instanceof InstantiationError).toBe(true);
 *   expect(e.originalException.message).toEqual("message");
 *   expect(e.originalStack).toBeDefined();
 * }
 * ```
 * @param {?} injector
 * @param {?} originalException
 * @param {?} originalStack
 * @param {?} key
 * @return {?}
 */
export function instantiationError(injector, originalException, originalStack, key) {
    return injectionError(injector, key, function (keys) {
        /** @type {?} */
        const first = stringify(keys[0].token);
        return `${originalException.message}: Error during instantiation of ${first}!${constructResolvingPath(keys)}.`;
    }, originalException);
}
/**
 * Thrown when an object other then {\@link Provider} (or `Type`) is passed to {\@link Injector}
 * creation.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * expect(() => Injector.resolveAndCreate(["not a type"])).toThrowError();
 * ```
 * @param {?} provider
 * @return {?}
 */
export function invalidProviderError(provider) {
    return Error(`Invalid provider - only instances of Provider and Type are allowed, got: ${provider}`);
}
/**
 * Thrown when the class has no annotation information.
 *
 * Lack of annotation information prevents the {\@link Injector} from determining which dependencies
 * need to be injected into the constructor.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * class A {
 *   constructor(b) {}
 * }
 *
 * expect(() => Injector.resolveAndCreate([A])).toThrowError();
 * ```
 *
 * This error is also thrown when the class not marked with {\@link Injectable} has parameter types.
 *
 * ```typescript
 * class B {}
 *
 * class A {
 *   constructor(b:B) {} // no information about the parameter types of A is available at runtime.
 * }
 *
 * expect(() => Injector.resolveAndCreate([A,B])).toThrowError();
 * ```
 *
 * @param {?} typeOrFunc
 * @param {?} params
 * @return {?}
 */
export function noAnnotationError(typeOrFunc, params) {
    /** @type {?} */
    const signature = [];
    for (let i = 0, ii = params.length; i < ii; i++) {
        /** @type {?} */
        const parameter = params[i];
        if (!parameter || parameter.length == 0) {
            signature.push('?');
        }
        else {
            signature.push(parameter.map(stringify).join(' '));
        }
    }
    return Error('Cannot resolve all parameters for \'' + stringify(typeOrFunc) + '\'(' +
        signature.join(', ') + '). ' +
        'Make sure that all the parameters are decorated with Inject or have valid type annotations and that \'' +
        stringify(typeOrFunc) + '\' is decorated with Injectable.');
}
/**
 * Thrown when getting an object by index.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * class A {}
 *
 * var injector = Injector.resolveAndCreate([A]);
 *
 * expect(() => injector.getAt(100)).toThrowError();
 * ```
 *
 * @param {?} index
 * @return {?}
 */
export function outOfBoundsError(index) {
    return Error(`Index ${index} is out-of-bounds.`);
}
/**
 * Thrown when a multi provider and a regular provider are bound to the same token.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * expect(() => Injector.resolveAndCreate([
 *   { provide: "Strings", useValue: "string1", multi: true},
 *   { provide: "Strings", useValue: "string2", multi: false}
 * ])).toThrowError();
 * ```
 * @param {?} provider1
 * @param {?} provider2
 * @return {?}
 */
export function mixingMultiProvidersWithRegularProvidersError(provider1, provider2) {
    return Error(`Cannot mix multi providers and regular providers, got: ${provider1} ${provider2}`);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yZWZsZWN0aXZlX2Vycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsb0JBQW9CLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBRWpFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7O0FBS2xDLFNBQVMsb0JBQW9CLENBQUMsSUFBVzs7SUFDdkMsTUFBTSxHQUFHLEdBQVUsRUFBRSxDQUFDO0lBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ3BDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUM3QixHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sR0FBRyxDQUFDO1NBQ1o7UUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ25CO0lBQ0QsT0FBTyxHQUFHLENBQUM7Q0FDWjs7Ozs7QUFFRCxTQUFTLHNCQUFzQixDQUFDLElBQVc7SUFDekMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs7UUFDbkIsTUFBTSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7O1FBQzlELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxT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KiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7d3JhcHBlZEVycm9yfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7RVJST1JfT1JJR0lOQUxfRVJST1IsIGdldE9yaWdpbmFsRXJyb3J9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge1JlZmxlY3RpdmVJbmplY3Rvcn0gZnJvbSAnLi9yZWZsZWN0aXZlX2luamVjdG9yJztcbmltcG9ydCB7UmVmbGVjdGl2ZUtleX0gZnJvbSAnLi9yZWZsZWN0aXZlX2tleSc7XG5cbmZ1bmN0aW9uIGZpbmRGaXJzdENsb3NlZEN5Y2xlKGtleXM6IGFueVtdKTogYW55W10ge1xuICBjb25zdCByZXM6IGFueVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgIGlmIChyZXMuaW5kZXhPZihrZXlzW2ldKSA+IC0xKSB7XG4gICAgICByZXMucHVzaChrZXlzW2ldKTtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHJlcy5wdXNoKGtleXNbaV0pO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFJlc29sdmluZ1BhdGgoa2V5czogYW55W10pOiBzdHJpbmcge1xuICBpZiAoa2V5cy5sZW5ndGggPiAxKSB7XG4gICAgY29uc3QgcmV2ZXJzZWQgPSBmaW5kRmlyc3RDbG9zZWRDeWNsZShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKTtcbiAgICBjb25zdCB0b2tlblN0cnMgPSByZXZlcnNlZC5tYXAoayA9PiBzdHJpbmdpZnkoay50b2tlbikpO1xuICAgIHJldHVybiAnICgnICsgdG9rZW5TdHJzLmpvaW4oJyAtPiAnKSArICcpJztcbiAgfVxuXG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmplY3Rpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAga2V5czogUmVmbGVjdGl2ZUtleVtdO1xuICBpbmplY3RvcnM6IFJlZmxlY3RpdmVJbmplY3RvcltdO1xuICBjb25zdHJ1Y3RSZXNvbHZpbmdNZXNzYWdlOiAoa2V5czogUmVmbGVjdGl2ZUtleVtdKSA9PiBzdHJpbmc7XG4gIGFkZEtleShpbmplY3RvcjogUmVmbGVjdGl2ZUluamVjdG9yLCBrZXk6IFJlZmxlY3RpdmVLZXkpOiB2b2lkO1xufVxuXG5mdW5jdGlvbiBpbmplY3Rpb25FcnJvcihcbiAgICBpbmplY3RvcjogUmVmbGVjdGl2ZUluamVjdG9yLCBrZXk6IFJlZmxlY3RpdmVLZXksXG4gICAgY29uc3RydWN0UmVzb2x2aW5nTWVzc2FnZTogKGtleXM6IFJlZmxlY3RpdmVLZXlbXSkgPT4gc3RyaW5nLFxuICAgIG9yaWdpbmFsRXJyb3I/OiBFcnJvcik6IEluamVjdGlvbkVycm9yIHtcbiAgY29uc3Qga2V5cyA9IFtrZXldO1xuICBjb25zdCBlcnJNc2cgPSBjb25zdHJ1Y3RSZXNvbHZpbmdNZXNzYWdlKGtleXMpO1xuICBjb25zdCBlcnJvciA9XG4gICAgICAob3JpZ2luYWxFcnJvciA/IHdyYXBwZWRFcnJvcihlcnJNc2csIG9yaWdpbmFsRXJyb3IpIDogRXJyb3IoZXJyTXNnKSkgYXMgSW5qZWN0aW9uRXJyb3I7XG4gIGVycm9yLmFkZEtleSA9IGFkZEtleTtcbiAgZXJyb3Iua2V5cyA9IGtleXM7XG4gIGVycm9yLmluamVjdG9ycyA9IFtpbmplY3Rvcl07XG4gIGVycm9yLmNvbnN0cnVjdFJlc29sdmluZ01lc3NhZ2UgPSBjb25zdHJ1Y3RSZXNvbHZpbmdNZXNzYWdlO1xuICAoZXJyb3IgYXMgYW55KVtFUlJPUl9PUklHSU5BTF9FUlJPUl0gPSBvcmlnaW5hbEVycm9yO1xuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIGFkZEtleSh0aGlzOiBJbmplY3Rpb25FcnJvciwgaW5qZWN0b3I6IFJlZmxlY3RpdmVJbmplY3Rvciwga2V5OiBSZWZsZWN0aXZlS2V5KTogdm9pZCB7XG4gIHRoaXMuaW5qZWN0b3JzLnB1c2goaW5qZWN0b3IpO1xuICB0aGlzLmtleXMucHVzaChrZXkpO1xuICAvLyBOb3RlOiBUaGlzIHVwZGF0ZWQgbWVzc2FnZSB3b24ndCBiZSByZWZsZWN0ZWQgaW4gdGhlIGAuc3RhY2tgIHByb3BlcnR5XG4gIHRoaXMubWVzc2FnZSA9IHRoaXMuY29uc3RydWN0UmVzb2x2aW5nTWVzc2FnZSh0aGlzLmtleXMpO1xufVxuXG4vKipcbiAqIFRocm93biB3aGVuIHRyeWluZyB0byByZXRyaWV2ZSBhIGRlcGVuZGVuY3kgYnkga2V5IGZyb20ge0BsaW5rIEluamVjdG9yfSwgYnV0IHRoZVxuICoge0BsaW5rIEluamVjdG9yfSBkb2VzIG5vdCBoYXZlIGEge0BsaW5rIFByb3ZpZGVyfSBmb3IgdGhlIGdpdmVuIGtleS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjbGFzcyBBIHtcbiAqICAgY29uc3RydWN0b3IoYjpCKSB7fVxuICogfVxuICpcbiAqIGV4cGVjdCgoKSA9PiBJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtBXSkpLnRvVGhyb3dFcnJvcigpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub1Byb3ZpZGVyRXJyb3IoaW5qZWN0b3I6IFJlZmxlY3RpdmVJbmplY3Rvciwga2V5OiBSZWZsZWN0aXZlS2V5KTogSW5qZWN0aW9uRXJyb3Ige1xuICByZXR1cm4gaW5qZWN0aW9uRXJyb3IoaW5qZWN0b3IsIGtleSwgZnVuY3Rpb24oa2V5czogUmVmbGVjdGl2ZUtleVtdKSB7XG4gICAgY29uc3QgZmlyc3QgPSBzdHJpbmdpZnkoa2V5c1swXS50b2tlbik7XG4gICAgcmV0dXJuIGBObyBwcm92aWRlciBmb3IgJHtmaXJzdH0hJHtjb25zdHJ1Y3RSZXNvbHZpbmdQYXRoKGtleXMpfWA7XG4gIH0pO1xufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGRlcGVuZGVuY2llcyBmb3JtIGEgY3ljbGUuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdmFyIGluamVjdG9yID0gSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbXG4gKiAgIHtwcm92aWRlOiBcIm9uZVwiLCB1c2VGYWN0b3J5OiAodHdvKSA9PiBcInR3b1wiLCBkZXBzOiBbW25ldyBJbmplY3QoXCJ0d29cIildXX0sXG4gKiAgIHtwcm92aWRlOiBcInR3b1wiLCB1c2VGYWN0b3J5OiAob25lKSA9PiBcIm9uZVwiLCBkZXBzOiBbW25ldyBJbmplY3QoXCJvbmVcIildXX1cbiAqIF0pO1xuICpcbiAqIGV4cGVjdCgoKSA9PiBpbmplY3Rvci5nZXQoXCJvbmVcIikpLnRvVGhyb3dFcnJvcigpO1xuICogYGBgXG4gKlxuICogUmV0cmlldmluZyBgQWAgb3IgYEJgIHRocm93cyBhIGBDeWNsaWNEZXBlbmRlbmN5RXJyb3JgIGFzIHRoZSBncmFwaCBhYm92ZSBjYW5ub3QgYmUgY29uc3RydWN0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjeWNsaWNEZXBlbmRlbmN5RXJyb3IoXG4gICAgaW5qZWN0b3I6IFJlZmxlY3RpdmVJbmplY3Rvciwga2V5OiBSZWZsZWN0aXZlS2V5KTogSW5qZWN0aW9uRXJyb3Ige1xuICByZXR1cm4gaW5qZWN0aW9uRXJyb3IoaW5qZWN0b3IsIGtleSwgZnVuY3Rpb24oa2V5czogUmVmbGVjdGl2ZUtleVtdKSB7XG4gICAgcmV0dXJuIGBDYW5ub3QgaW5zdGFudGlhdGUgY3ljbGljIGRlcGVuZGVuY3khJHtjb25zdHJ1Y3RSZXNvbHZpbmdQYXRoKGtleXMpfWA7XG4gIH0pO1xufVxuXG4vKipcbiAqIFRocm93biB3aGVuIGEgY29uc3RydWN0aW5nIHR5cGUgcmV0dXJucyB3aXRoIGFuIEVycm9yLlxuICpcbiAqIFRoZSBgSW5zdGFudGlhdGlvbkVycm9yYCBjbGFzcyBjb250YWlucyB0aGUgb3JpZ2luYWwgZXJyb3IgcGx1cyB0aGUgZGVwZW5kZW5jeSBncmFwaCB3aGljaCBjYXVzZWRcbiAqIHRoaXMgb2JqZWN0IHRvIGJlIGluc3RhbnRpYXRlZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjbGFzcyBBIHtcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgdGhyb3cgbmV3IEVycm9yKCdtZXNzYWdlJyk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiB2YXIgaW5qZWN0b3IgPSBJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtBXSk7XG5cbiAqIHRyeSB7XG4gKiAgIGluamVjdG9yLmdldChBKTtcbiAqIH0gY2F0Y2ggKGUpIHtcbiAqICAgZXhwZWN0KGUgaW5zdGFuY2VvZiBJbnN0YW50aWF0aW9uRXJyb3IpLnRvQmUodHJ1ZSk7XG4gKiAgIGV4cGVjdChlLm9yaWdpbmFsRXhjZXB0aW9uLm1lc3NhZ2UpLnRvRXF1YWwoXCJtZXNzYWdlXCIpO1xuICogICBleHBlY3QoZS5vcmlnaW5hbFN0YWNrKS50b0JlRGVmaW5lZCgpO1xuICogfVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0aW9uRXJyb3IoXG4gICAgaW5qZWN0b3I6IFJlZmxlY3RpdmVJbmplY3Rvciwgb3JpZ2luYWxFeGNlcHRpb246IGFueSwgb3JpZ2luYWxTdGFjazogYW55LFxuICAgIGtleTogUmVmbGVjdGl2ZUtleSk6IEluamVjdGlvbkVycm9yIHtcbiAgcmV0dXJuIGluamVjdGlvbkVycm9yKGluamVjdG9yLCBrZXksIGZ1bmN0aW9uKGtleXM6IFJlZmxlY3RpdmVLZXlbXSkge1xuICAgIGNvbnN0IGZpcnN0ID0gc3RyaW5naWZ5KGtleXNbMF0udG9rZW4pO1xuICAgIHJldHVybiBgJHtvcmlnaW5hbEV4Y2VwdGlvbi5tZXNzYWdlfTogRXJyb3IgZHVyaW5nIGluc3RhbnRpYXRpb24gb2YgJHtmaXJzdH0hJHtjb25zdHJ1Y3RSZXNvbHZpbmdQYXRoKGtleXMpfS5gO1xuICB9LCBvcmlnaW5hbEV4Y2VwdGlvbik7XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gYW4gb2JqZWN0IG90aGVyIHRoZW4ge0BsaW5rIFByb3ZpZGVyfSAob3IgYFR5cGVgKSBpcyBwYXNzZWQgdG8ge0BsaW5rIEluamVjdG9yfVxuICogY3JlYXRpb24uXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogZXhwZWN0KCgpID0+IEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW1wibm90IGEgdHlwZVwiXSkpLnRvVGhyb3dFcnJvcigpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZhbGlkUHJvdmlkZXJFcnJvcihwcm92aWRlcjogYW55KSB7XG4gIHJldHVybiBFcnJvcihcbiAgICAgIGBJbnZhbGlkIHByb3ZpZGVyIC0gb25seSBpbnN0YW5jZXMgb2YgUHJvdmlkZXIgYW5kIFR5cGUgYXJlIGFsbG93ZWQsIGdvdDogJHtwcm92aWRlcn1gKTtcbn1cblxuLyoqXG4gKiBUaHJvd24gd2hlbiB0aGUgY2xhc3MgaGFzIG5vIGFubm90YXRpb24gaW5mb3JtYXRpb24uXG4gKlxuICogTGFjayBvZiBhbm5vdGF0aW9uIGluZm9ybWF0aW9uIHByZXZlbnRzIHRoZSB7QGxpbmsgSW5qZWN0b3J9IGZyb20gZGV0ZXJtaW5pbmcgd2hpY2ggZGVwZW5kZW5jaWVzXG4gKiBuZWVkIHRvIGJlIGluamVjdGVkIGludG8gdGhlIGNvbnN0cnVjdG9yLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNsYXNzIEEge1xuICogICBjb25zdHJ1Y3RvcihiKSB7fVxuICogfVxuICpcbiAqIGV4cGVjdCgoKSA9PiBJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtBXSkpLnRvVGhyb3dFcnJvcigpO1xuICogYGBgXG4gKlxuICogVGhpcyBlcnJvciBpcyBhbHNvIHRocm93biB3aGVuIHRoZSBjbGFzcyBub3QgbWFya2VkIHdpdGgge0BsaW5rIEluamVjdGFibGV9IGhhcyBwYXJhbWV0ZXIgdHlwZXMuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY2xhc3MgQiB7fVxuICpcbiAqIGNsYXNzIEEge1xuICogICBjb25zdHJ1Y3RvcihiOkIpIHt9IC8vIG5vIGluZm9ybWF0aW9uIGFib3V0IHRoZSBwYXJhbWV0ZXIgdHlwZXMgb2YgQSBpcyBhdmFpbGFibGUgYXQgcnVudGltZS5cbiAqIH1cbiAqXG4gKiBleHBlY3QoKCkgPT4gSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbQSxCXSkpLnRvVGhyb3dFcnJvcigpO1xuICogYGBgXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9Bbm5vdGF0aW9uRXJyb3IodHlwZU9yRnVuYzogVHlwZTxhbnk+fCBGdW5jdGlvbiwgcGFyYW1zOiBhbnlbXVtdKTogRXJyb3Ige1xuICBjb25zdCBzaWduYXR1cmU6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGkgPSAwLCBpaSA9IHBhcmFtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgY29uc3QgcGFyYW1ldGVyID0gcGFyYW1zW2ldO1xuICAgIGlmICghcGFyYW1ldGVyIHx8IHBhcmFtZXRlci5sZW5ndGggPT0gMCkge1xuICAgICAgc2lnbmF0dXJlLnB1c2goJz8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2lnbmF0dXJlLnB1c2gocGFyYW1ldGVyLm1hcChzdHJpbmdpZnkpLmpvaW4oJyAnKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBFcnJvcihcbiAgICAgICdDYW5ub3QgcmVzb2x2ZSBhbGwgcGFyYW1ldGVycyBmb3IgXFwnJyArIHN0cmluZ2lmeSh0eXBlT3JGdW5jKSArICdcXCcoJyArXG4gICAgICBzaWduYXR1cmUuam9pbignLCAnKSArICcpLiAnICtcbiAgICAgICdNYWtlIHN1cmUgdGhhdCBhbGwgdGhlIHBhcmFtZXRlcnMgYXJlIGRlY29yYXRlZCB3aXRoIEluamVjdCBvciBoYXZlIHZhbGlkIHR5cGUgYW5ub3RhdGlvbnMgYW5kIHRoYXQgXFwnJyArXG4gICAgICBzdHJpbmdpZnkodHlwZU9yRnVuYykgKyAnXFwnIGlzIGRlY29yYXRlZCB3aXRoIEluamVjdGFibGUuJyk7XG59XG5cbi8qKlxuICogVGhyb3duIHdoZW4gZ2V0dGluZyBhbiBvYmplY3QgYnkgaW5kZXguXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY2xhc3MgQSB7fVxuICpcbiAqIHZhciBpbmplY3RvciA9IEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0FdKTtcbiAqXG4gKiBleHBlY3QoKCkgPT4gaW5qZWN0b3IuZ2V0QXQoMTAwKSkudG9UaHJvd0Vycm9yKCk7XG4gKiBgYGBcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvdXRPZkJvdW5kc0Vycm9yKGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIEVycm9yKGBJbmRleCAke2luZGV4fSBpcyBvdXQtb2YtYm91bmRzLmApO1xufVxuXG4vLyBUT0RPOiBhZGQgYSB3b3JraW5nIGV4YW1wbGUgYWZ0ZXIgYWxwaGEzOCBpcyByZWxlYXNlZFxuLyoqXG4gKiBUaHJvd24gd2hlbiBhIG11bHRpIHByb3ZpZGVyIGFuZCBhIHJlZ3VsYXIgcHJvdmlkZXIgYXJlIGJvdW5kIHRvIHRoZSBzYW1lIHRva2VuLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGV4cGVjdCgoKSA9PiBJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtcbiAqICAgeyBwcm92aWRlOiBcIlN0cmluZ3NcIiwgdXNlVmFsdWU6IFwic3RyaW5nMVwiLCBtdWx0aTogdHJ1ZX0sXG4gKiAgIHsgcHJvdmlkZTogXCJTdHJpbmdzXCIsIHVzZVZhbHVlOiBcInN0cmluZzJcIiwgbXVsdGk6IGZhbHNlfVxuICogXSkpLnRvVGhyb3dFcnJvcigpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtaXhpbmdNdWx0aVByb3ZpZGVyc1dpdGhSZWd1bGFyUHJvdmlkZXJzRXJyb3IoXG4gICAgcHJvdmlkZXIxOiBhbnksIHByb3ZpZGVyMjogYW55KTogRXJyb3Ige1xuICByZXR1cm4gRXJyb3IoYENhbm5vdCBtaXggbXVsdGkgcHJvdmlkZXJzIGFuZCByZWd1bGFyIHByb3ZpZGVycywgZ290OiAke3Byb3ZpZGVyMX0gJHtwcm92aWRlcjJ9YCk7XG59XG4iXX0=