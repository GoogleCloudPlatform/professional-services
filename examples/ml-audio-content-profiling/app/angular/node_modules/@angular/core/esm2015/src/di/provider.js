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
/**
 * Configures the `Injector` to return a value for a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ValueSansProvider'}
 *
 * \@publicApi
 * @record
 */
export function ValueSansProvider() { }
/**
 * The value to inject.
 * @type {?}
 */
ValueSansProvider.prototype.useValue;
/**
 * Configures the `Injector` to return a value for a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ValueProvider'}
 *
 * ### Multi-value example
 *
 * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * \@publicApi
 * @record
 */
export function ValueProvider() { }
/**
 * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
 * @type {?}
 */
ValueProvider.prototype.provide;
/**
 * If true, then injector returns an array of instances. This is useful to allow multiple
 * providers spread across many files to provide configuration information to a common token.
 * @type {?|undefined}
 */
ValueProvider.prototype.multi;
/**
 * Configures the `Injector` to return an instance of `useClass` for a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='StaticClassSansProvider'}
 *
 * \@publicApi
 * @record
 */
export function StaticClassSansProvider() { }
/**
 * An optional class to instantiate for the `token`. (If not provided `provide` is assumed to be a
 * class to instantiate)
 * @type {?}
 */
StaticClassSansProvider.prototype.useClass;
/**
 * A list of `token`s which need to be resolved by the injector. The list of values is then
 * used as arguments to the `useClass` constructor.
 * @type {?}
 */
StaticClassSansProvider.prototype.deps;
/**
 * Configures the `Injector` to return an instance of `useClass` for a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='StaticClassProvider'}
 *
 * Note that following two providers are not equal:
 *
 * {\@example core/di/ts/provider_spec.ts region='StaticClassProviderDifference'}
 *
 * ### Multi-value example
 *
 * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 * @record
 */
export function StaticClassProvider() { }
/**
 * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
 * @type {?}
 */
StaticClassProvider.prototype.provide;
/**
 * If true, then injector returns an array of instances. This is useful to allow multiple
 * providers spread across many files to provide configuration information to a common token.
 * @type {?|undefined}
 */
StaticClassProvider.prototype.multi;
/**
 * Configures the `Injector` to return an instance of a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * ```
 * \@Injectable(SomeModule, {deps: []})
 * class MyService {}
 * ```
 *
 * \@publicApi
 * @record
 */
export function ConstructorSansProvider() { }
/**
 * A list of `token`s which need to be resolved by the injector. The list of values is then
 * used as arguments to the `useClass` constructor.
 * @type {?|undefined}
 */
ConstructorSansProvider.prototype.deps;
/**
 * Configures the `Injector` to return an instance of a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
 *
 * ### Multi-value example
 *
 * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 * @record
 */
export function ConstructorProvider() { }
/**
 * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
 * @type {?}
 */
ConstructorProvider.prototype.provide;
/**
 * If true, then injector returns an array of instances. This is useful to allow multiple
 * providers spread across many files to provide configuration information to a common token.
 * @type {?|undefined}
 */
ConstructorProvider.prototype.multi;
/**
 * Configures the `Injector` to return a value of another `useExisting` token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ExistingSansProvider'}
 * @record
 */
export function ExistingSansProvider() { }
/**
 * Existing `token` to return. (equivalent to `injector.get(useExisting)`)
 * @type {?}
 */
ExistingSansProvider.prototype.useExisting;
/**
 * Configures the `Injector` to return a value of another `useExisting` token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ExistingProvider'}
 *
 * ### Multi-value example
 *
 * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * \@publicApi
 * @record
 */
export function ExistingProvider() { }
/**
 * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
 * @type {?}
 */
ExistingProvider.prototype.provide;
/**
 * If true, then injector returns an array of instances. This is useful to allow multiple
 * providers spread across many files to provide configuration information to a common token.
 * @type {?|undefined}
 */
ExistingProvider.prototype.multi;
/**
 * Configures the `Injector` to return a value by invoking a `useFactory` function.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='FactorySansProvider'}
 *
 * \@publicApi
 * @record
 */
export function FactorySansProvider() { }
/**
 * A function to invoke to create a value for this `token`. The function is invoked with
 * resolved values of `token`s in the `deps` field.
 * @type {?}
 */
FactorySansProvider.prototype.useFactory;
/**
 * A list of `token`s which need to be resolved by the injector. The list of values is then
 * used as arguments to the `useFactory` function.
 * @type {?|undefined}
 */
FactorySansProvider.prototype.deps;
/**
 * Configures the `Injector` to return a value by invoking a `useFactory` function.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='FactoryProvider'}
 *
 * Dependencies can also be marked as optional:
 *
 * {\@example core/di/ts/provider_spec.ts region='FactoryProviderOptionalDeps'}
 *
 * ### Multi-value example
 *
 * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * \@publicApi
 * @record
 */
export function FactoryProvider() { }
/**
 * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
 * @type {?}
 */
FactoryProvider.prototype.provide;
/**
 * If true, then injector returns an array of instances. This is useful to allow multiple
 * providers spread across many files to provide configuration information to a common token.
 * @type {?|undefined}
 */
FactoryProvider.prototype.multi;
/** @typedef {?} */
var StaticProvider;
export { StaticProvider };
/**
 * Configures the `Injector` to return an instance of `Type` when `Type' is used as the token.
 *
 * Create an instance by invoking the `new` operator and supplying additional arguments.
 * This form is a short form of `TypeProvider`;
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='TypeProvider'}
 *
 * \@publicApi
 * @record
 */
export function TypeProvider() { }
/**
 * Configures the `Injector` to return a value by invoking a `useClass` function.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ClassSansProvider'}
 *
 * \@publicApi
 * @record
 */
export function ClassSansProvider() { }
/**
 * Class to instantiate for the `token`.
 * @type {?}
 */
ClassSansProvider.prototype.useClass;
/**
 * Configures the `Injector` to return an instance of `useClass` for a token.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
 *
 * {\@example core/di/ts/provider_spec.ts region='ClassProvider'}
 *
 * Note that following two providers are not equal:
 *
 * {\@example core/di/ts/provider_spec.ts region='ClassProviderDifference'}
 *
 * ### Multi-value example
 *
 * {\@example core/di/ts/provider_spec.ts region='MultiProviderAspect'}
 *
 * \@publicApi
 * @record
 */
export function ClassProvider() { }
/**
 * An injection token. (Typically an instance of `Type` or `InjectionToken`, but can be `any`).
 * @type {?}
 */
ClassProvider.prototype.provide;
/**
 * If true, then injector returns an array of instances. This is useful to allow multiple
 * providers spread across many files to provide configuration information to a common token.
 * @type {?|undefined}
 */
ClassProvider.prototype.multi;
/** @typedef {?} */
var Provider;
export { Provider };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIGBJbmplY3RvcmAgdG8gcmV0dXJuIGEgdmFsdWUgZm9yIGEgdG9rZW4uXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J1ZhbHVlU2Fuc1Byb3ZpZGVyJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWVTYW5zUHJvdmlkZXIge1xuICAvKipcbiAgICogVGhlIHZhbHVlIHRvIGluamVjdC5cbiAgICovXG4gIHVzZVZhbHVlOiBhbnk7XG59XG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgYEluamVjdG9yYCB0byByZXR1cm4gYSB2YWx1ZSBmb3IgYSB0b2tlbi5cbiAqXG4gKiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFtcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nVmFsdWVQcm92aWRlcid9XG4gKlxuICogIyMjIE11bHRpLXZhbHVlIGV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nTXVsdGlQcm92aWRlckFzcGVjdCd9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFZhbHVlUHJvdmlkZXIgZXh0ZW5kcyBWYWx1ZVNhbnNQcm92aWRlciB7XG4gIC8qKlxuICAgKiBBbiBpbmplY3Rpb24gdG9rZW4uIChUeXBpY2FsbHkgYW4gaW5zdGFuY2Ugb2YgYFR5cGVgIG9yIGBJbmplY3Rpb25Ub2tlbmAsIGJ1dCBjYW4gYmUgYGFueWApLlxuICAgKi9cbiAgcHJvdmlkZTogYW55O1xuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCB0aGVuIGluamVjdG9yIHJldHVybnMgYW4gYXJyYXkgb2YgaW5zdGFuY2VzLiBUaGlzIGlzIHVzZWZ1bCB0byBhbGxvdyBtdWx0aXBsZVxuICAgKiBwcm92aWRlcnMgc3ByZWFkIGFjcm9zcyBtYW55IGZpbGVzIHRvIHByb3ZpZGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBhIGNvbW1vbiB0b2tlbi5cbiAgICovXG4gIG11bHRpPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSBgSW5qZWN0b3JgIHRvIHJldHVybiBhbiBpbnN0YW5jZSBvZiBgdXNlQ2xhc3NgIGZvciBhIHRva2VuLlxuICpcbiAqIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgW1wiRGVwZW5kZW5jeSBJbmplY3Rpb24gR3VpZGVcIl0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24pLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdTdGF0aWNDbGFzc1NhbnNQcm92aWRlcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyIHtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGNsYXNzIHRvIGluc3RhbnRpYXRlIGZvciB0aGUgYHRva2VuYC4gKElmIG5vdCBwcm92aWRlZCBgcHJvdmlkZWAgaXMgYXNzdW1lZCB0byBiZSBhXG4gICAqIGNsYXNzIHRvIGluc3RhbnRpYXRlKVxuICAgKi9cbiAgdXNlQ2xhc3M6IFR5cGU8YW55PjtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGB0b2tlbmBzIHdoaWNoIG5lZWQgdG8gYmUgcmVzb2x2ZWQgYnkgdGhlIGluamVjdG9yLiBUaGUgbGlzdCBvZiB2YWx1ZXMgaXMgdGhlblxuICAgKiB1c2VkIGFzIGFyZ3VtZW50cyB0byB0aGUgYHVzZUNsYXNzYCBjb25zdHJ1Y3Rvci5cbiAgICovXG4gIGRlcHM6IGFueVtdO1xufVxuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIGBJbmplY3RvcmAgdG8gcmV0dXJuIGFuIGluc3RhbmNlIG9mIGB1c2VDbGFzc2AgZm9yIGEgdG9rZW4uXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J1N0YXRpY0NsYXNzUHJvdmlkZXInfVxuICpcbiAqIE5vdGUgdGhhdCBmb2xsb3dpbmcgdHdvIHByb3ZpZGVycyBhcmUgbm90IGVxdWFsOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdTdGF0aWNDbGFzc1Byb3ZpZGVyRGlmZmVyZW5jZSd9XG4gKlxuICogIyMjIE11bHRpLXZhbHVlIGV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nTXVsdGlQcm92aWRlckFzcGVjdCd9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RhdGljQ2xhc3NQcm92aWRlciBleHRlbmRzIFN0YXRpY0NsYXNzU2Fuc1Byb3ZpZGVyIHtcbiAgLyoqXG4gICAqIEFuIGluamVjdGlvbiB0b2tlbi4gKFR5cGljYWxseSBhbiBpbnN0YW5jZSBvZiBgVHlwZWAgb3IgYEluamVjdGlvblRva2VuYCwgYnV0IGNhbiBiZSBgYW55YCkuXG4gICAqL1xuICBwcm92aWRlOiBhbnk7XG5cbiAgLyoqXG4gICAqIElmIHRydWUsIHRoZW4gaW5qZWN0b3IgcmV0dXJucyBhbiBhcnJheSBvZiBpbnN0YW5jZXMuIFRoaXMgaXMgdXNlZnVsIHRvIGFsbG93IG11bHRpcGxlXG4gICAqIHByb3ZpZGVycyBzcHJlYWQgYWNyb3NzIG1hbnkgZmlsZXMgdG8gcHJvdmlkZSBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uIHRvIGEgY29tbW9uIHRva2VuLlxuICAgKi9cbiAgbXVsdGk/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIGBJbmplY3RvcmAgdG8gcmV0dXJuIGFuIGluc3RhbmNlIG9mIGEgdG9rZW4uXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBASW5qZWN0YWJsZShTb21lTW9kdWxlLCB7ZGVwczogW119KVxuICogY2xhc3MgTXlTZXJ2aWNlIHt9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIge1xuICAvKipcbiAgICogQSBsaXN0IG9mIGB0b2tlbmBzIHdoaWNoIG5lZWQgdG8gYmUgcmVzb2x2ZWQgYnkgdGhlIGluamVjdG9yLiBUaGUgbGlzdCBvZiB2YWx1ZXMgaXMgdGhlblxuICAgKiB1c2VkIGFzIGFyZ3VtZW50cyB0byB0aGUgYHVzZUNsYXNzYCBjb25zdHJ1Y3Rvci5cbiAgICovXG4gIGRlcHM/OiBhbnlbXTtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSBgSW5qZWN0b3JgIHRvIHJldHVybiBhbiBpbnN0YW5jZSBvZiBhIHRva2VuLlxuICpcbiAqIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgW1wiRGVwZW5kZW5jeSBJbmplY3Rpb24gR3VpZGVcIl0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24pLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAqXG4gKiAjIyMgTXVsdGktdmFsdWUgZXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdNdWx0aVByb3ZpZGVyQXNwZWN0J31cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb25zdHJ1Y3RvclByb3ZpZGVyIGV4dGVuZHMgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIge1xuICAvKipcbiAgICogQW4gaW5qZWN0aW9uIHRva2VuLiAoVHlwaWNhbGx5IGFuIGluc3RhbmNlIG9mIGBUeXBlYCBvciBgSW5qZWN0aW9uVG9rZW5gLCBidXQgY2FuIGJlIGBhbnlgKS5cbiAgICovXG4gIHByb3ZpZGU6IFR5cGU8YW55PjtcblxuICAvKipcbiAgICogSWYgdHJ1ZSwgdGhlbiBpbmplY3RvciByZXR1cm5zIGFuIGFycmF5IG9mIGluc3RhbmNlcy4gVGhpcyBpcyB1c2VmdWwgdG8gYWxsb3cgbXVsdGlwbGVcbiAgICogcHJvdmlkZXJzIHNwcmVhZCBhY3Jvc3MgbWFueSBmaWxlcyB0byBwcm92aWRlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gYSBjb21tb24gdG9rZW4uXG4gICAqL1xuICBtdWx0aT86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgYEluamVjdG9yYCB0byByZXR1cm4gYSB2YWx1ZSBvZiBhbm90aGVyIGB1c2VFeGlzdGluZ2AgdG9rZW4uXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J0V4aXN0aW5nU2Fuc1Byb3ZpZGVyJ31cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIC8qKlxuICAgKiBFeGlzdGluZyBgdG9rZW5gIHRvIHJldHVybi4gKGVxdWl2YWxlbnQgdG8gYGluamVjdG9yLmdldCh1c2VFeGlzdGluZylgKVxuICAgKi9cbiAgdXNlRXhpc3Rpbmc6IGFueTtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSBgSW5qZWN0b3JgIHRvIHJldHVybiBhIHZhbHVlIG9mIGFub3RoZXIgYHVzZUV4aXN0aW5nYCB0b2tlbi5cbiAqXG4gKiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFtcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nRXhpc3RpbmdQcm92aWRlcid9XG4gKlxuICogIyMjIE11bHRpLXZhbHVlIGV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nTXVsdGlQcm92aWRlckFzcGVjdCd9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV4aXN0aW5nUHJvdmlkZXIgZXh0ZW5kcyBFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIC8qKlxuICAgKiBBbiBpbmplY3Rpb24gdG9rZW4uIChUeXBpY2FsbHkgYW4gaW5zdGFuY2Ugb2YgYFR5cGVgIG9yIGBJbmplY3Rpb25Ub2tlbmAsIGJ1dCBjYW4gYmUgYGFueWApLlxuICAgKi9cbiAgcHJvdmlkZTogYW55O1xuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCB0aGVuIGluamVjdG9yIHJldHVybnMgYW4gYXJyYXkgb2YgaW5zdGFuY2VzLiBUaGlzIGlzIHVzZWZ1bCB0byBhbGxvdyBtdWx0aXBsZVxuICAgKiBwcm92aWRlcnMgc3ByZWFkIGFjcm9zcyBtYW55IGZpbGVzIHRvIHByb3ZpZGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvbiB0byBhIGNvbW1vbiB0b2tlbi5cbiAgICovXG4gIG11bHRpPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSBgSW5qZWN0b3JgIHRvIHJldHVybiBhIHZhbHVlIGJ5IGludm9raW5nIGEgYHVzZUZhY3RvcnlgIGZ1bmN0aW9uLlxuICpcbiAqIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgW1wiRGVwZW5kZW5jeSBJbmplY3Rpb24gR3VpZGVcIl0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24pLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdGYWN0b3J5U2Fuc1Byb3ZpZGVyJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmFjdG9yeVNhbnNQcm92aWRlciB7XG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHRvIGludm9rZSB0byBjcmVhdGUgYSB2YWx1ZSBmb3IgdGhpcyBgdG9rZW5gLiBUaGUgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoXG4gICAqIHJlc29sdmVkIHZhbHVlcyBvZiBgdG9rZW5gcyBpbiB0aGUgYGRlcHNgIGZpZWxkLlxuICAgKi9cbiAgdXNlRmFjdG9yeTogRnVuY3Rpb247XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBgdG9rZW5gcyB3aGljaCBuZWVkIHRvIGJlIHJlc29sdmVkIGJ5IHRoZSBpbmplY3Rvci4gVGhlIGxpc3Qgb2YgdmFsdWVzIGlzIHRoZW5cbiAgICogdXNlZCBhcyBhcmd1bWVudHMgdG8gdGhlIGB1c2VGYWN0b3J5YCBmdW5jdGlvbi5cbiAgICovXG4gIGRlcHM/OiBhbnlbXTtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSBgSW5qZWN0b3JgIHRvIHJldHVybiBhIHZhbHVlIGJ5IGludm9raW5nIGEgYHVzZUZhY3RvcnlgIGZ1bmN0aW9uLlxuICpcbiAqIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgW1wiRGVwZW5kZW5jeSBJbmplY3Rpb24gR3VpZGVcIl0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24pLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdGYWN0b3J5UHJvdmlkZXInfVxuICpcbiAqIERlcGVuZGVuY2llcyBjYW4gYWxzbyBiZSBtYXJrZWQgYXMgb3B0aW9uYWw6XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J0ZhY3RvcnlQcm92aWRlck9wdGlvbmFsRGVwcyd9XG4gKlxuICogIyMjIE11bHRpLXZhbHVlIGV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nTXVsdGlQcm92aWRlckFzcGVjdCd9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZhY3RvcnlQcm92aWRlciBleHRlbmRzIEZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICAvKipcbiAgICogQW4gaW5qZWN0aW9uIHRva2VuLiAoVHlwaWNhbGx5IGFuIGluc3RhbmNlIG9mIGBUeXBlYCBvciBgSW5qZWN0aW9uVG9rZW5gLCBidXQgY2FuIGJlIGBhbnlgKS5cbiAgICovXG4gIHByb3ZpZGU6IGFueTtcblxuICAvKipcbiAgICogSWYgdHJ1ZSwgdGhlbiBpbmplY3RvciByZXR1cm5zIGFuIGFycmF5IG9mIGluc3RhbmNlcy4gVGhpcyBpcyB1c2VmdWwgdG8gYWxsb3cgbXVsdGlwbGVcbiAgICogcHJvdmlkZXJzIHNwcmVhZCBhY3Jvc3MgbWFueSBmaWxlcyB0byBwcm92aWRlIGNvbmZpZ3VyYXRpb24gaW5mb3JtYXRpb24gdG8gYSBjb21tb24gdG9rZW4uXG4gICAqL1xuICBtdWx0aT86IGJvb2xlYW47XG59XG5cbi8qKlxuICogRGVzY3JpYmVzIGhvdyB0aGUgYEluamVjdG9yYCBzaG91bGQgYmUgY29uZmlndXJlZCBpbiBhIHN0YXRpYyB3YXkgKFdpdGhvdXQgcmVmbGVjdGlvbikuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHNlZSBgVmFsdWVQcm92aWRlcmBcbiAqIEBzZWUgYEV4aXN0aW5nUHJvdmlkZXJgXG4gKiBAc2VlIGBGYWN0b3J5UHJvdmlkZXJgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBTdGF0aWNQcm92aWRlciA9IFZhbHVlUHJvdmlkZXIgfCBFeGlzdGluZ1Byb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlciB8XG4gICAgQ29uc3RydWN0b3JQcm92aWRlciB8IEZhY3RvcnlQcm92aWRlciB8IGFueVtdO1xuXG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgYEluamVjdG9yYCB0byByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgYFR5cGVgIHdoZW4gYFR5cGUnIGlzIHVzZWQgYXMgdGhlIHRva2VuLlxuICpcbiAqIENyZWF0ZSBhbiBpbnN0YW5jZSBieSBpbnZva2luZyB0aGUgYG5ld2Agb3BlcmF0b3IgYW5kIHN1cHBseWluZyBhZGRpdGlvbmFsIGFyZ3VtZW50cy5cbiAqIFRoaXMgZm9ybSBpcyBhIHNob3J0IGZvcm0gb2YgYFR5cGVQcm92aWRlcmA7XG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J1R5cGVQcm92aWRlcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFR5cGVQcm92aWRlciBleHRlbmRzIFR5cGU8YW55PiB7fVxuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIGBJbmplY3RvcmAgdG8gcmV0dXJuIGEgdmFsdWUgYnkgaW52b2tpbmcgYSBgdXNlQ2xhc3NgIGZ1bmN0aW9uLlxuICpcbiAqIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgW1wiRGVwZW5kZW5jeSBJbmplY3Rpb24gR3VpZGVcIl0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24pLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDbGFzc1NhbnNQcm92aWRlcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENsYXNzU2Fuc1Byb3ZpZGVyIHtcbiAgLyoqXG4gICAqIENsYXNzIHRvIGluc3RhbnRpYXRlIGZvciB0aGUgYHRva2VuYC5cbiAgICovXG4gIHVzZUNsYXNzOiBUeXBlPGFueT47XG59XG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgYEluamVjdG9yYCB0byByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgYHVzZUNsYXNzYCBmb3IgYSB0b2tlbi5cbiAqXG4gKiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFtcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nQ2xhc3NQcm92aWRlcid9XG4gKlxuICogTm90ZSB0aGF0IGZvbGxvd2luZyB0d28gcHJvdmlkZXJzIGFyZSBub3QgZXF1YWw6XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J0NsYXNzUHJvdmlkZXJEaWZmZXJlbmNlJ31cbiAqXG4gKiAjIyMgTXVsdGktdmFsdWUgZXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdNdWx0aVByb3ZpZGVyQXNwZWN0J31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NQcm92aWRlciBleHRlbmRzIENsYXNzU2Fuc1Byb3ZpZGVyIHtcbiAgLyoqXG4gICAqIEFuIGluamVjdGlvbiB0b2tlbi4gKFR5cGljYWxseSBhbiBpbnN0YW5jZSBvZiBgVHlwZWAgb3IgYEluamVjdGlvblRva2VuYCwgYnV0IGNhbiBiZSBgYW55YCkuXG4gICAqL1xuICBwcm92aWRlOiBhbnk7XG5cbiAgLyoqXG4gICAqIElmIHRydWUsIHRoZW4gaW5qZWN0b3IgcmV0dXJucyBhbiBhcnJheSBvZiBpbnN0YW5jZXMuIFRoaXMgaXMgdXNlZnVsIHRvIGFsbG93IG11bHRpcGxlXG4gICAqIHByb3ZpZGVycyBzcHJlYWQgYWNyb3NzIG1hbnkgZmlsZXMgdG8gcHJvdmlkZSBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uIHRvIGEgY29tbW9uIHRva2VuLlxuICAgKi9cbiAgbXVsdGk/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBob3cgdGhlIGBJbmplY3RvcmAgc2hvdWxkIGJlIGNvbmZpZ3VyZWQuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHNlZSBgVHlwZVByb3ZpZGVyYFxuICogQHNlZSBgQ2xhc3NQcm92aWRlcmBcbiAqIEBzZWUgYFN0YXRpY1Byb3ZpZGVyYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgUHJvdmlkZXIgPSBUeXBlUHJvdmlkZXIgfCBWYWx1ZVByb3ZpZGVyIHwgQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfFxuICAgIEV4aXN0aW5nUHJvdmlkZXIgfCBGYWN0b3J5UHJvdmlkZXIgfCBhbnlbXTtcbiJdfQ==