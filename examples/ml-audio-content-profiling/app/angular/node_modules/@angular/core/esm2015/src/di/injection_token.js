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
import { defineInjectable } from './defs';
/**
 * Creates a token that can be used in a DI Provider.
 *
 * Use an `InjectionToken` whenever the type you are injecting is not reified (does not have a
 * runtime representation) such as when injecting an interface, callable type, array or
 * parametrized type.
 *
 * `InjectionToken` is parameterized on `T` which is the type of object which will be returned by
 * the `Injector`. This provides additional level of type safety.
 *
 * ```
 * interface MyInterface {...}
 * var myInterface = injector.get(new InjectionToken<MyInterface>('SomeToken'));
 * // myInterface is inferred to be MyInterface.
 * ```
 *
 * When creating an `InjectionToken`, you can optionally specify a factory function which returns
 * (possibly by creating) a default value of the parameterized type `T`. This sets up the
 * `InjectionToken` using this factory as a provider as if it was defined explicitly in the
 * application's root injector. If the factory function, which takes zero arguments, needs to inject
 * dependencies, it can do so using the `inject` function. See below for an example.
 *
 * Additionally, if a `factory` is specified you can also specify the `providedIn` option, which
 * overrides the above behavior and marks the token as belonging to a particular `\@NgModule`. As
 * mentioned above, `'root'` is the default value for `providedIn`.
 *
 * \@usageNotes
 * ### Basic Example
 *
 * ### Plain InjectionToken
 *
 * {\@example core/di/ts/injector_spec.ts region='InjectionToken'}
 *
 * ### Tree-shakable InjectionToken
 *
 * {\@example core/di/ts/injector_spec.ts region='ShakableInjectionToken'}
 *
 *
 * \@publicApi
 * @template T
 */
export class InjectionToken {
    /**
     * @param {?} _desc
     * @param {?=} options
     */
    constructor(_desc, options) {
        this._desc = _desc;
        /**
         * \@internal
         */
        this.ngMetadataName = 'InjectionToken';
        if (options !== undefined) {
            /** @nocollapse */ this.ngInjectableDef = defineInjectable({
                providedIn: options.providedIn || 'root',
                factory: options.factory,
            });
        }
        else {
            /** @nocollapse */ this.ngInjectableDef = undefined;
        }
    }
    /**
     * @return {?}
     */
    toString() { return `InjectionToken ${this._desc}`; }
}
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    InjectionToken.prototype.ngMetadataName;
    /** @type {?} */
    InjectionToken.prototype.ngInjectableDef;
    /** @type {?} */
    InjectionToken.prototype._desc;
}
/**
 * @record
 * @template T
 */
export function InjectableDefToken() { }
/** @type {?} */
InjectableDefToken.prototype.ngInjectableDef;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0aW9uX3Rva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGkvaW5qZWN0aW9uX3Rva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQ3hDLE1BQU0sT0FBTyxjQUFjOzs7OztJQU16QixZQUFzQixLQUFhLEVBQUUsT0FHcEM7UUFIcUIsVUFBSyxHQUFMLEtBQUssQ0FBUTs7OztRQUpuQyxzQkFBMEIsZ0JBQWdCLENBQUM7UUFRekMsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxlQUFlLEdBQUcsZ0JBQWdCLENBQUM7Z0JBQ3RDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxJQUFJLE1BQU07Z0JBQ3hDLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTzthQUN6QixDQUFDLENBQUM7U0FDSjthQUFNO1lBQ0wsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7U0FDbEM7S0FDRjs7OztJQUVELFFBQVEsS0FBYSxPQUFPLGtCQUFrQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRTtDQUM5RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHtkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuL2RlZnMnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB0b2tlbiB0aGF0IGNhbiBiZSB1c2VkIGluIGEgREkgUHJvdmlkZXIuXG4gKlxuICogVXNlIGFuIGBJbmplY3Rpb25Ub2tlbmAgd2hlbmV2ZXIgdGhlIHR5cGUgeW91IGFyZSBpbmplY3RpbmcgaXMgbm90IHJlaWZpZWQgKGRvZXMgbm90IGhhdmUgYVxuICogcnVudGltZSByZXByZXNlbnRhdGlvbikgc3VjaCBhcyB3aGVuIGluamVjdGluZyBhbiBpbnRlcmZhY2UsIGNhbGxhYmxlIHR5cGUsIGFycmF5IG9yXG4gKiBwYXJhbWV0cml6ZWQgdHlwZS5cbiAqXG4gKiBgSW5qZWN0aW9uVG9rZW5gIGlzIHBhcmFtZXRlcml6ZWQgb24gYFRgIHdoaWNoIGlzIHRoZSB0eXBlIG9mIG9iamVjdCB3aGljaCB3aWxsIGJlIHJldHVybmVkIGJ5XG4gKiB0aGUgYEluamVjdG9yYC4gVGhpcyBwcm92aWRlcyBhZGRpdGlvbmFsIGxldmVsIG9mIHR5cGUgc2FmZXR5LlxuICpcbiAqIGBgYFxuICogaW50ZXJmYWNlIE15SW50ZXJmYWNlIHsuLi59XG4gKiB2YXIgbXlJbnRlcmZhY2UgPSBpbmplY3Rvci5nZXQobmV3IEluamVjdGlvblRva2VuPE15SW50ZXJmYWNlPignU29tZVRva2VuJykpO1xuICogLy8gbXlJbnRlcmZhY2UgaXMgaW5mZXJyZWQgdG8gYmUgTXlJbnRlcmZhY2UuXG4gKiBgYGBcbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGFuIGBJbmplY3Rpb25Ub2tlbmAsIHlvdSBjYW4gb3B0aW9uYWxseSBzcGVjaWZ5IGEgZmFjdG9yeSBmdW5jdGlvbiB3aGljaCByZXR1cm5zXG4gKiAocG9zc2libHkgYnkgY3JlYXRpbmcpIGEgZGVmYXVsdCB2YWx1ZSBvZiB0aGUgcGFyYW1ldGVyaXplZCB0eXBlIGBUYC4gVGhpcyBzZXRzIHVwIHRoZVxuICogYEluamVjdGlvblRva2VuYCB1c2luZyB0aGlzIGZhY3RvcnkgYXMgYSBwcm92aWRlciBhcyBpZiBpdCB3YXMgZGVmaW5lZCBleHBsaWNpdGx5IGluIHRoZVxuICogYXBwbGljYXRpb24ncyByb290IGluamVjdG9yLiBJZiB0aGUgZmFjdG9yeSBmdW5jdGlvbiwgd2hpY2ggdGFrZXMgemVybyBhcmd1bWVudHMsIG5lZWRzIHRvIGluamVjdFxuICogZGVwZW5kZW5jaWVzLCBpdCBjYW4gZG8gc28gdXNpbmcgdGhlIGBpbmplY3RgIGZ1bmN0aW9uLiBTZWUgYmVsb3cgZm9yIGFuIGV4YW1wbGUuXG4gKlxuICogQWRkaXRpb25hbGx5LCBpZiBhIGBmYWN0b3J5YCBpcyBzcGVjaWZpZWQgeW91IGNhbiBhbHNvIHNwZWNpZnkgdGhlIGBwcm92aWRlZEluYCBvcHRpb24sIHdoaWNoXG4gKiBvdmVycmlkZXMgdGhlIGFib3ZlIGJlaGF2aW9yIGFuZCBtYXJrcyB0aGUgdG9rZW4gYXMgYmVsb25naW5nIHRvIGEgcGFydGljdWxhciBgQE5nTW9kdWxlYC4gQXNcbiAqIG1lbnRpb25lZCBhYm92ZSwgYCdyb290J2AgaXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIGBwcm92aWRlZEluYC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEJhc2ljIEV4YW1wbGVcbiAqXG4gKiAjIyMgUGxhaW4gSW5qZWN0aW9uVG9rZW5cbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nSW5qZWN0aW9uVG9rZW4nfVxuICpcbiAqICMjIyBUcmVlLXNoYWthYmxlIEluamVjdGlvblRva2VuXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J1NoYWthYmxlSW5qZWN0aW9uVG9rZW4nfVxuICpcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3Rpb25Ub2tlbjxUPiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcmVhZG9ubHkgbmdNZXRhZGF0YU5hbWUgPSAnSW5qZWN0aW9uVG9rZW4nO1xuXG4gIHJlYWRvbmx5IG5nSW5qZWN0YWJsZURlZjogbmV2ZXJ8dW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBfZGVzYzogc3RyaW5nLCBvcHRpb25zPzoge1xuICAgIHByb3ZpZGVkSW4/OiBUeXBlPGFueT58ICdyb290JyB8IG51bGwsXG4gICAgZmFjdG9yeTogKCkgPT4gVFxuICB9KSB7XG4gICAgaWYgKG9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5uZ0luamVjdGFibGVEZWYgPSBkZWZpbmVJbmplY3RhYmxlKHtcbiAgICAgICAgcHJvdmlkZWRJbjogb3B0aW9ucy5wcm92aWRlZEluIHx8ICdyb290JyxcbiAgICAgICAgZmFjdG9yeTogb3B0aW9ucy5mYWN0b3J5LFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubmdJbmplY3RhYmxlRGVmID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiBgSW5qZWN0aW9uVG9rZW4gJHt0aGlzLl9kZXNjfWA7IH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmplY3RhYmxlRGVmVG9rZW48VD4gZXh0ZW5kcyBJbmplY3Rpb25Ub2tlbjxUPiB7IG5nSW5qZWN0YWJsZURlZjogbmV2ZXI7IH1cbiJdfQ==