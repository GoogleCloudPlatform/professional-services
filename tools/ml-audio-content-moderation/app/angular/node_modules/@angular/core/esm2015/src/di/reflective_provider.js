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
import { reflector } from '../reflection/reflection';
import { Type } from '../type';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { invalidProviderError, mixingMultiProvidersWithRegularProvidersError, noAnnotationError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
/**
 * @record
 */
function NormalizedProvider() { }
/**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
export class ReflectiveDependency {
    /**
     * @param {?} key
     * @param {?} optional
     * @param {?} visibility
     */
    constructor(key, optional, visibility) {
        this.key = key;
        this.optional = optional;
        this.visibility = visibility;
    }
    /**
     * @param {?} key
     * @return {?}
     */
    static fromKey(key) {
        return new ReflectiveDependency(key, false, null);
    }
}
if (false) {
    /** @type {?} */
    ReflectiveDependency.prototype.key;
    /** @type {?} */
    ReflectiveDependency.prototype.optional;
    /** @type {?} */
    ReflectiveDependency.prototype.visibility;
}
/** @type {?} */
const _EMPTY_LIST = [];
/**
 * An internal resolved representation of a `Provider` used by the `Injector`.
 *
 * \@usageNotes
 * This is usually created automatically by `Injector.resolveAndCreate`.
 *
 * It can be created manually, as follows:
 *
 * ### Example
 *
 * ```typescript
 * var resolvedProviders = Injector.resolve([{ provide: 'message', useValue: 'Hello' }]);
 * var injector = Injector.fromResolvedProviders(resolvedProviders);
 *
 * expect(injector.get('message')).toEqual('Hello');
 * ```
 *
 * \@publicApi
 * @record
 */
export function ResolvedReflectiveProvider() { }
/**
 * A key, usually a `Type<any>`.
 * @type {?}
 */
ResolvedReflectiveProvider.prototype.key;
/**
 * Factory function which can return an instance of an object represented by a key.
 * @type {?}
 */
ResolvedReflectiveProvider.prototype.resolvedFactories;
/**
 * Indicates if the provider is a multi-provider or a regular provider.
 * @type {?}
 */
ResolvedReflectiveProvider.prototype.multiProvider;
export class ResolvedReflectiveProvider_ {
    /**
     * @param {?} key
     * @param {?} resolvedFactories
     * @param {?} multiProvider
     */
    constructor(key, resolvedFactories, multiProvider) {
        this.key = key;
        this.resolvedFactories = resolvedFactories;
        this.multiProvider = multiProvider;
        this.resolvedFactory = this.resolvedFactories[0];
    }
}
if (false) {
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.resolvedFactory;
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.key;
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.resolvedFactories;
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.multiProvider;
}
/**
 * An internal resolved representation of a factory function created by resolving `Provider`.
 * \@publicApi
 */
export class ResolvedReflectiveFactory {
    /**
     * @param {?} factory
     * @param {?} dependencies
     */
    constructor(factory, dependencies) {
        this.factory = factory;
        this.dependencies = dependencies;
    }
}
if (false) {
    /**
     * Factory function which can return an instance of an object represented by a key.
     * @type {?}
     */
    ResolvedReflectiveFactory.prototype.factory;
    /**
     * Arguments (dependencies) to the `factory` function.
     * @type {?}
     */
    ResolvedReflectiveFactory.prototype.dependencies;
}
/**
 * Resolve a single provider.
 * @param {?} provider
 * @return {?}
 */
function resolveReflectiveFactory(provider) {
    /** @type {?} */
    let factoryFn;
    /** @type {?} */
    let resolvedDeps;
    if (provider.useClass) {
        /** @type {?} */
        const useClass = resolveForwardRef(provider.useClass);
        factoryFn = reflector.factory(useClass);
        resolvedDeps = _dependenciesFor(useClass);
    }
    else if (provider.useExisting) {
        factoryFn = (aliasInstance) => aliasInstance;
        resolvedDeps = [ReflectiveDependency.fromKey(ReflectiveKey.get(provider.useExisting))];
    }
    else if (provider.useFactory) {
        factoryFn = provider.useFactory;
        resolvedDeps = constructDependencies(provider.useFactory, provider.deps);
    }
    else {
        factoryFn = () => provider.useValue;
        resolvedDeps = _EMPTY_LIST;
    }
    return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
}
/**
 * Converts the `Provider` into `ResolvedProvider`.
 *
 * `Injector` internally only uses `ResolvedProvider`, `Provider` contains convenience provider
 * syntax.
 * @param {?} provider
 * @return {?}
 */
function resolveReflectiveProvider(provider) {
    return new ResolvedReflectiveProvider_(ReflectiveKey.get(provider.provide), [resolveReflectiveFactory(provider)], provider.multi || false);
}
/**
 * Resolve a list of Providers.
 * @param {?} providers
 * @return {?}
 */
export function resolveReflectiveProviders(providers) {
    /** @type {?} */
    const normalized = _normalizeProviders(providers, []);
    /** @type {?} */
    const resolved = normalized.map(resolveReflectiveProvider);
    /** @type {?} */
    const resolvedProviderMap = mergeResolvedReflectiveProviders(resolved, new Map());
    return Array.from(resolvedProviderMap.values());
}
/**
 * Merges a list of ResolvedProviders into a list where each key is contained exactly once and
 * multi providers have been merged.
 * @param {?} providers
 * @param {?} normalizedProvidersMap
 * @return {?}
 */
export function mergeResolvedReflectiveProviders(providers, normalizedProvidersMap) {
    for (let i = 0; i < providers.length; i++) {
        /** @type {?} */
        const provider = providers[i];
        /** @type {?} */
        const existing = normalizedProvidersMap.get(provider.key.id);
        if (existing) {
            if (provider.multiProvider !== existing.multiProvider) {
                throw mixingMultiProvidersWithRegularProvidersError(existing, provider);
            }
            if (provider.multiProvider) {
                for (let j = 0; j < provider.resolvedFactories.length; j++) {
                    existing.resolvedFactories.push(provider.resolvedFactories[j]);
                }
            }
            else {
                normalizedProvidersMap.set(provider.key.id, provider);
            }
        }
        else {
            /** @type {?} */
            let resolvedProvider;
            if (provider.multiProvider) {
                resolvedProvider = new ResolvedReflectiveProvider_(provider.key, provider.resolvedFactories.slice(), provider.multiProvider);
            }
            else {
                resolvedProvider = provider;
            }
            normalizedProvidersMap.set(provider.key.id, resolvedProvider);
        }
    }
    return normalizedProvidersMap;
}
/**
 * @param {?} providers
 * @param {?} res
 * @return {?}
 */
function _normalizeProviders(providers, res) {
    providers.forEach(b => {
        if (b instanceof Type) {
            res.push({ provide: b, useClass: b });
        }
        else if (b && typeof b == 'object' && (/** @type {?} */ (b)).provide !== undefined) {
            res.push(/** @type {?} */ (b));
        }
        else if (b instanceof Array) {
            _normalizeProviders(b, res);
        }
        else {
            throw invalidProviderError(b);
        }
    });
    return res;
}
/**
 * @param {?} typeOrFunc
 * @param {?=} dependencies
 * @return {?}
 */
export function constructDependencies(typeOrFunc, dependencies) {
    if (!dependencies) {
        return _dependenciesFor(typeOrFunc);
    }
    else {
        /** @type {?} */
        const params = dependencies.map(t => [t]);
        return dependencies.map(t => _extractToken(typeOrFunc, t, params));
    }
}
/**
 * @param {?} typeOrFunc
 * @return {?}
 */
function _dependenciesFor(typeOrFunc) {
    /** @type {?} */
    const params = reflector.parameters(typeOrFunc);
    if (!params)
        return [];
    if (params.some(p => p == null)) {
        throw noAnnotationError(typeOrFunc, params);
    }
    return params.map(p => _extractToken(typeOrFunc, p, params));
}
/**
 * @param {?} typeOrFunc
 * @param {?} metadata
 * @param {?} params
 * @return {?}
 */
function _extractToken(typeOrFunc, metadata, params) {
    /** @type {?} */
    let token = null;
    /** @type {?} */
    let optional = false;
    if (!Array.isArray(metadata)) {
        if (metadata instanceof Inject) {
            return _createDependency(metadata.token, optional, null);
        }
        else {
            return _createDependency(metadata, optional, null);
        }
    }
    /** @type {?} */
    let visibility = null;
    for (let i = 0; i < metadata.length; ++i) {
        /** @type {?} */
        const paramMetadata = metadata[i];
        if (paramMetadata instanceof Type) {
            token = paramMetadata;
        }
        else if (paramMetadata instanceof Inject) {
            token = paramMetadata.token;
        }
        else if (paramMetadata instanceof Optional) {
            optional = true;
        }
        else if (paramMetadata instanceof Self || paramMetadata instanceof SkipSelf) {
            visibility = paramMetadata;
        }
        else if (paramMetadata instanceof InjectionToken) {
            token = paramMetadata;
        }
    }
    token = resolveForwardRef(token);
    if (token != null) {
        return _createDependency(token, optional, visibility);
    }
    else {
        throw noAnnotationError(typeOrFunc, params);
    }
}
/**
 * @param {?} token
 * @param {?} optional
 * @param {?} visibility
 * @return {?}
 */
function _createDependency(token, optional, visibility) {
    return new ReflectiveDependency(ReflectiveKey.get(token), optional, visibility);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbkQsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU3QixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFNUQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZDQUE2QyxFQUFFLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0gsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDOzs7Ozs7Ozs7QUFVL0MsTUFBTSxPQUFPLG9CQUFvQjs7Ozs7O0lBQy9CLFlBQ1csS0FBMkIsUUFBaUIsRUFBUyxVQUE4QjtRQUFuRixRQUFHLEdBQUgsR0FBRztRQUF3QixhQUFRLEdBQVIsUUFBUSxDQUFTO1FBQVMsZUFBVSxHQUFWLFVBQVUsQ0FBb0I7S0FBSTs7Ozs7SUFFbEcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFrQjtRQUMvQixPQUFPLElBQUksb0JBQW9CLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNuRDtDQUNGOzs7Ozs7Ozs7O0FBRUQsTUFBTSxXQUFXLEdBQVUsRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0M5QixNQUFNLE9BQU8sMkJBQTJCOzs7Ozs7SUFHdEMsWUFDVyxL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QVUsR0FBRyxhQUFhLENBQUM7U0FDNUI7YUFBTSxJQUFJLGFBQWEsWUFBWSxjQUFjLEVBQUU7WUFDbEQsS0FBSyxHQUFHLGFBQWEsQ0FBQztTQUN2QjtLQUNGO0lBRUQsS0FBSyxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWpDLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtRQUNqQixPQUFPLGlCQUFpQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdkQ7U0FBTTtRQUNMLE1BQU0saUJBQWlCLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzdDO0NBQ0Y7Ozs7Ozs7QUFFRCxTQUFTLGlCQUFpQixDQUN0QixLQUFVLEVBQUUsUUFBaUIsRUFBRSxVQUFrQztJQUNuRSxPQUFPLElBQUksb0JBQW9CLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7Q0FDakYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7cmVmbGVjdG9yfSBmcm9tICcuLi9yZWZsZWN0aW9uL3JlZmxlY3Rpb24nO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdCwgT3B0aW9uYWwsIFNlbGYsIFNraXBTZWxmfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBQcm92aWRlciwgVHlwZVByb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCB7aW52YWxpZFByb3ZpZGVyRXJyb3IsIG1peGluZ011bHRpUHJvdmlkZXJzV2l0aFJlZ3VsYXJQcm92aWRlcnNFcnJvciwgbm9Bbm5vdGF0aW9uRXJyb3J9IGZyb20gJy4vcmVmbGVjdGl2ZV9lcnJvcnMnO1xuaW1wb3J0IHtSZWZsZWN0aXZlS2V5fSBmcm9tICcuL3JlZmxlY3RpdmVfa2V5JztcblxuXG5pbnRlcmZhY2UgTm9ybWFsaXplZFByb3ZpZGVyIGV4dGVuZHMgVHlwZVByb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBDbGFzc1Byb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLFxuICAgIEZhY3RvcnlQcm92aWRlciB7fVxuXG4vKipcbiAqIGBEZXBlbmRlbmN5YCBpcyB1c2VkIGJ5IHRoZSBmcmFtZXdvcmsgdG8gZXh0ZW5kIERJLlxuICogVGhpcyBpcyBpbnRlcm5hbCB0byBBbmd1bGFyIGFuZCBzaG91bGQgbm90IGJlIHVzZWQgZGlyZWN0bHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZWZsZWN0aXZlRGVwZW5kZW5jeSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGtleTogUmVmbGVjdGl2ZUtleSwgcHVibGljIG9wdGlvbmFsOiBib29sZWFuLCBwdWJsaWMgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsKSB7fVxuXG4gIHN0YXRpYyBmcm9tS2V5KGtleTogUmVmbGVjdGl2ZUtleSk6IFJlZmxlY3RpdmVEZXBlbmRlbmN5IHtcbiAgICByZXR1cm4gbmV3IFJlZmxlY3RpdmVEZXBlbmRlbmN5KGtleSwgZmFsc2UsIG51bGwpO1xuICB9XG59XG5cbmNvbnN0IF9FTVBUWV9MSVNUOiBhbnlbXSA9IFtdO1xuXG4vKipcbiAqIEFuIGludGVybmFsIHJlc29sdmVkIHJlcHJlc2VudGF0aW9uIG9mIGEgYFByb3ZpZGVyYCB1c2VkIGJ5IHRoZSBgSW5qZWN0b3JgLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBUaGlzIGlzIHVzdWFsbHkgY3JlYXRlZCBhdXRvbWF0aWNhbGx5IGJ5IGBJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlYC5cbiAqXG4gKiBJdCBjYW4gYmUgY3JlYXRlZCBtYW51YWxseSwgYXMgZm9sbG93czpcbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHZhciByZXNvbHZlZFByb3ZpZGVycyA9IEluamVjdG9yLnJlc29sdmUoW3sgcHJvdmlkZTogJ21lc3NhZ2UnLCB1c2VWYWx1ZTogJ0hlbGxvJyB9XSk7XG4gKiB2YXIgaW5qZWN0b3IgPSBJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMocmVzb2x2ZWRQcm92aWRlcnMpO1xuICpcbiAqIGV4cGVjdChpbmplY3Rvci5nZXQoJ21lc3NhZ2UnKSkudG9FcXVhbCgnSGVsbG8nKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciB7XG4gIC8qKlxuICAgKiBBIGtleSwgdXN1YWxseSBhIGBUeXBlPGFueT5gLlxuICAgKi9cbiAga2V5OiBSZWZsZWN0aXZlS2V5O1xuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHdoaWNoIGNhbiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgYW4gb2JqZWN0IHJlcHJlc2VudGVkIGJ5IGEga2V5LlxuICAgKi9cbiAgcmVzb2x2ZWRGYWN0b3JpZXM6IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnlbXTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBwcm92aWRlciBpcyBhIG11bHRpLXByb3ZpZGVyIG9yIGEgcmVndWxhciBwcm92aWRlci5cbiAgICovXG4gIG11bHRpUHJvdmlkZXI6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcl8gaW1wbGVtZW50cyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciB7XG4gIHJlYWRvbmx5IHJlc29sdmVkRmFjdG9yeTogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBrZXk6IFJlZmxlY3RpdmVLZXksIHB1YmxpYyByZXNvbHZlZEZhY3RvcmllczogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeVtdLFxuICAgICAgcHVibGljIG11bHRpUHJvdmlkZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnJlc29sdmVkRmFjdG9yeSA9IHRoaXMucmVzb2x2ZWRGYWN0b3JpZXNbMF07XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBpbnRlcm5hbCByZXNvbHZlZCByZXByZXNlbnRhdGlvbiBvZiBhIGZhY3RvcnkgZnVuY3Rpb24gY3JlYXRlZCBieSByZXNvbHZpbmcgYFByb3ZpZGVyYC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIFJlc29sdmVkUmVmbGVjdGl2ZUZhY3Rvcnkge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogRmFjdG9yeSBmdW5jdGlvbiB3aGljaCBjYW4gcmV0dXJuIGFuIGluc3RhbmNlIG9mIGFuIG9iamVjdCByZXByZXNlbnRlZCBieSBhIGtleS5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGZhY3Rvcnk6IEZ1bmN0aW9uLFxuXG4gICAgICAvKipcbiAgICAgICAqIEFyZ3VtZW50cyAoZGVwZW5kZW5jaWVzKSB0byB0aGUgYGZhY3RvcnlgIGZ1bmN0aW9uLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgZGVwZW5kZW5jaWVzOiBSZWZsZWN0aXZlRGVwZW5kZW5jeVtdKSB7fVxufVxuXG5cbi8qKlxuICogUmVzb2x2ZSBhIHNpbmdsZSBwcm92aWRlci5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVJlZmxlY3RpdmVGYWN0b3J5KHByb3ZpZGVyOiBOb3JtYWxpemVkUHJvdmlkZXIpOiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5IHtcbiAgbGV0IGZhY3RvcnlGbjogRnVuY3Rpb247XG4gIGxldCByZXNvbHZlZERlcHM6IFJlZmxlY3RpdmVEZXBlbmRlbmN5W107XG4gIGlmIChwcm92aWRlci51c2VDbGFzcykge1xuICAgIGNvbnN0IHVzZUNsYXNzID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlQ2xhc3MpO1xuICAgIGZhY3RvcnlGbiA9IHJlZmxlY3Rvci5mYWN0b3J5KHVzZUNsYXNzKTtcbiAgICByZXNvbHZlZERlcHMgPSBfZGVwZW5kZW5jaWVzRm9yKHVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmIChwcm92aWRlci51c2VFeGlzdGluZykge1xuICAgIGZhY3RvcnlGbiA9IChhbGlhc0luc3RhbmNlOiBhbnkpID0+IGFsaWFzSW5zdGFuY2U7XG4gICAgcmVzb2x2ZWREZXBzID0gW1JlZmxlY3RpdmVEZXBlbmRlbmN5LmZyb21LZXkoUmVmbGVjdGl2ZUtleS5nZXQocHJvdmlkZXIudXNlRXhpc3RpbmcpKV07XG4gIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSkge1xuICAgIGZhY3RvcnlGbiA9IHByb3ZpZGVyLnVzZUZhY3Rvcnk7XG4gICAgcmVzb2x2ZWREZXBzID0gY29uc3RydWN0RGVwZW5kZW5jaWVzKHByb3ZpZGVyLnVzZUZhY3RvcnksIHByb3ZpZGVyLmRlcHMpO1xuICB9IGVsc2Uge1xuICAgIGZhY3RvcnlGbiA9ICgpID0+IHByb3ZpZGVyLnVzZVZhbHVlO1xuICAgIHJlc29sdmVkRGVwcyA9IF9FTVBUWV9MSVNUO1xuICB9XG4gIHJldHVybiBuZXcgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeShmYWN0b3J5Rm4sIHJlc29sdmVkRGVwcyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIGBQcm92aWRlcmAgaW50byBgUmVzb2x2ZWRQcm92aWRlcmAuXG4gKlxuICogYEluamVjdG9yYCBpbnRlcm5hbGx5IG9ubHkgdXNlcyBgUmVzb2x2ZWRQcm92aWRlcmAsIGBQcm92aWRlcmAgY29udGFpbnMgY29udmVuaWVuY2UgcHJvdmlkZXJcbiAqIHN5bnRheC5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcihwcm92aWRlcjogTm9ybWFsaXplZFByb3ZpZGVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICByZXR1cm4gbmV3IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyXyhcbiAgICAgIFJlZmxlY3RpdmVLZXkuZ2V0KHByb3ZpZGVyLnByb3ZpZGUpLCBbcmVzb2x2ZVJlZmxlY3RpdmVGYWN0b3J5KHByb3ZpZGVyKV0sXG4gICAgICBwcm92aWRlci5tdWx0aSB8fCBmYWxzZSk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIGxpc3Qgb2YgUHJvdmlkZXJzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBfbm9ybWFsaXplUHJvdmlkZXJzKHByb3ZpZGVycywgW10pO1xuICBjb25zdCByZXNvbHZlZCA9IG5vcm1hbGl6ZWQubWFwKHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXIpO1xuICBjb25zdCByZXNvbHZlZFByb3ZpZGVyTWFwID0gbWVyZ2VSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMocmVzb2x2ZWQsIG5ldyBNYXAoKSk7XG4gIHJldHVybiBBcnJheS5mcm9tKHJlc29sdmVkUHJvdmlkZXJNYXAudmFsdWVzKCkpO1xufVxuXG4vKipcbiAqIE1lcmdlcyBhIGxpc3Qgb2YgUmVzb2x2ZWRQcm92aWRlcnMgaW50byBhIGxpc3Qgd2hlcmUgZWFjaCBrZXkgaXMgY29udGFpbmVkIGV4YWN0bHkgb25jZSBhbmRcbiAqIG11bHRpIHByb3ZpZGVycyBoYXZlIGJlZW4gbWVyZ2VkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMoXG4gICAgcHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdLFxuICAgIG5vcm1hbGl6ZWRQcm92aWRlcnNNYXA6IE1hcDxudW1iZXIsIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyPik6XG4gICAgTWFwPG51bWJlciwgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXI+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlciA9IHByb3ZpZGVyc1tpXTtcbiAgICBjb25zdCBleGlzdGluZyA9IG5vcm1hbGl6ZWRQcm92aWRlcnNNYXAuZ2V0KHByb3ZpZGVyLmtleS5pZCk7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGlQcm92aWRlciAhPT0gZXhpc3RpbmcubXVsdGlQcm92aWRlcikge1xuICAgICAgICB0aHJvdyBtaXhpbmdNdWx0aVByb3ZpZGVyc1dpdGhSZWd1bGFyUHJvdmlkZXJzRXJyb3IoZXhpc3RpbmcsIHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChwcm92aWRlci5tdWx0aVByb3ZpZGVyKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBleGlzdGluZy5yZXNvbHZlZEZhY3Rvcmllcy5wdXNoKHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzW2pdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9ybWFsaXplZFByb3ZpZGVyc01hcC5zZXQocHJvdmlkZXIua2V5LmlkLCBwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCByZXNvbHZlZFByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcjtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aVByb3ZpZGVyKSB7XG4gICAgICAgIHJlc29sdmVkUHJvdmlkZXIgPSBuZXcgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJfKFxuICAgICAgICAgICAgcHJvdmlkZXIua2V5LCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllcy5zbGljZSgpLCBwcm92aWRlci5tdWx0aVByb3ZpZGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmVkUHJvdmlkZXIgPSBwcm92aWRlcjtcbiAgICAgIH1cbiAgICAgIG5vcm1hbGl6ZWRQcm92aWRlcnNNYXAuc2V0KHByb3ZpZGVyLmtleS5pZCwgcmVzb2x2ZWRQcm92aWRlcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBub3JtYWxpemVkUHJvdmlkZXJzTWFwO1xufVxuXG5mdW5jdGlvbiBfbm9ybWFsaXplUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXSwgcmVzOiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gIHByb3ZpZGVycy5mb3JFYWNoKGIgPT4ge1xuICAgIGlmIChiIGluc3RhbmNlb2YgVHlwZSkge1xuICAgICAgcmVzLnB1c2goe3Byb3ZpZGU6IGIsIHVzZUNsYXNzOiBifSk7XG5cbiAgICB9IGVsc2UgaWYgKGIgJiYgdHlwZW9mIGIgPT0gJ29iamVjdCcgJiYgKGIgYXMgYW55KS5wcm92aWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJlcy5wdXNoKGIgYXMgTm9ybWFsaXplZFByb3ZpZGVyKTtcblxuICAgIH0gZWxzZSBpZiAoYiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBfbm9ybWFsaXplUHJvdmlkZXJzKGIsIHJlcyk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgaW52YWxpZFByb3ZpZGVyRXJyb3IoYik7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3RydWN0RGVwZW5kZW5jaWVzKFxuICAgIHR5cGVPckZ1bmM6IGFueSwgZGVwZW5kZW5jaWVzPzogYW55W10pOiBSZWZsZWN0aXZlRGVwZW5kZW5jeVtdIHtcbiAgaWYgKCFkZXBlbmRlbmNpZXMpIHtcbiAgICByZXR1cm4gX2RlcGVuZGVuY2llc0Zvcih0eXBlT3JGdW5jKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwYXJhbXM6IGFueVtdW10gPSBkZXBlbmRlbmNpZXMubWFwKHQgPT4gW3RdKTtcbiAgICByZXR1cm4gZGVwZW5kZW5jaWVzLm1hcCh0ID0+IF9leHRyYWN0VG9rZW4odHlwZU9yRnVuYywgdCwgcGFyYW1zKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2RlcGVuZGVuY2llc0Zvcih0eXBlT3JGdW5jOiBhbnkpOiBSZWZsZWN0aXZlRGVwZW5kZW5jeVtdIHtcbiAgY29uc3QgcGFyYW1zID0gcmVmbGVjdG9yLnBhcmFtZXRlcnModHlwZU9yRnVuYyk7XG5cbiAgaWYgKCFwYXJhbXMpIHJldHVybiBbXTtcbiAgaWYgKHBhcmFtcy5zb21lKHAgPT4gcCA9PSBudWxsKSkge1xuICAgIHRocm93IG5vQW5ub3RhdGlvbkVycm9yKHR5cGVPckZ1bmMsIHBhcmFtcyk7XG4gIH1cbiAgcmV0dXJuIHBhcmFtcy5tYXAocCA9PiBfZXh0cmFjdFRva2VuKHR5cGVPckZ1bmMsIHAsIHBhcmFtcykpO1xufVxuXG5mdW5jdGlvbiBfZXh0cmFjdFRva2VuKFxuICAgIHR5cGVPckZ1bmM6IGFueSwgbWV0YWRhdGE6IGFueVtdIHwgYW55LCBwYXJhbXM6IGFueVtdW10pOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSB7XG4gIGxldCB0b2tlbjogYW55ID0gbnVsbDtcbiAgbGV0IG9wdGlvbmFsID0gZmFsc2U7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KG1ldGFkYXRhKSkge1xuICAgIGlmIChtZXRhZGF0YSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgcmV0dXJuIF9jcmVhdGVEZXBlbmRlbmN5KG1ldGFkYXRhLnRva2VuLCBvcHRpb25hbCwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBfY3JlYXRlRGVwZW5kZW5jeShtZXRhZGF0YSwgb3B0aW9uYWwsIG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIGxldCB2aXNpYmlsaXR5OiBTZWxmfFNraXBTZWxmfG51bGwgPSBudWxsO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWV0YWRhdGEubGVuZ3RoOyArK2kpIHtcbiAgICBjb25zdCBwYXJhbU1ldGFkYXRhID0gbWV0YWRhdGFbaV07XG5cbiAgICBpZiAocGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgIHRva2VuID0gcGFyYW1NZXRhZGF0YTtcblxuICAgIH0gZWxzZSBpZiAocGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgdG9rZW4gPSBwYXJhbU1ldGFkYXRhLnRva2VuO1xuXG4gICAgfSBlbHNlIGlmIChwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgT3B0aW9uYWwpIHtcbiAgICAgIG9wdGlvbmFsID0gdHJ1ZTtcblxuICAgIH0gZWxzZSBpZiAocGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIFNlbGYgfHwgcGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIFNraXBTZWxmKSB7XG4gICAgICB2aXNpYmlsaXR5ID0gcGFyYW1NZXRhZGF0YTtcbiAgICB9IGVsc2UgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbikge1xuICAgICAgdG9rZW4gPSBwYXJhbU1ldGFkYXRhO1xuICAgIH1cbiAgfVxuXG4gIHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYodG9rZW4pO1xuXG4gIGlmICh0b2tlbiAhPSBudWxsKSB7XG4gICAgcmV0dXJuIF9jcmVhdGVEZXBlbmRlbmN5KHRva2VuLCBvcHRpb25hbCwgdmlzaWJpbGl0eSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbm9Bbm5vdGF0aW9uRXJyb3IodHlwZU9yRnVuYywgcGFyYW1zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfY3JlYXRlRGVwZW5kZW5jeShcbiAgICB0b2tlbjogYW55LCBvcHRpb25hbDogYm9vbGVhbiwgdmlzaWJpbGl0eTogU2VsZiB8IFNraXBTZWxmIHwgbnVsbCk6IFJlZmxlY3RpdmVEZXBlbmRlbmN5IHtcbiAgcmV0dXJuIG5ldyBSZWZsZWN0aXZlRGVwZW5kZW5jeShSZWZsZWN0aXZlS2V5LmdldCh0b2tlbiksIG9wdGlvbmFsLCB2aXNpYmlsaXR5KTtcbn1cbiJdfQ==