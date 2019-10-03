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
import { NG_INJECTABLE_DEF, NG_INJECTOR_DEF } from '../render3/fields';
/**
 * Information about how a type or `InjectionToken` interfaces with the DI system.
 *
 * At a minimum, this includes a `factory` which defines how to create the given type `T`, possibly
 * requesting injection of other types if necessary.
 *
 * Optionally, a `providedIn` parameter specifies that the given type belongs to a particular
 * `InjectorDef`, `NgModule`, or a special scope (e.g. `'root'`). A value of `null` indicates
 * that the injectable does not belong to any scope.
 *
 * NOTE: This is a private type and should not be exported
 * @record
 * @template T
 */
export function InjectableDef() { }
/**
 * Specifies that the given type belongs to a particular injector:
 * - `InjectorType` such as `NgModule`,
 * - `'root'` the root injector
 * - `'any'` all injectors.
 * - `null`, does not belong to any injector. Must be explicitly listed in the injector
 *   `providers`.
 * @type {?}
 */
InjectableDef.prototype.providedIn;
/**
 * Factory method to execute to create an instance of the injectable.
 * @type {?}
 */
InjectableDef.prototype.factory;
/**
 * In a case of no explicit injector, a location where the instance of the injectable is stored.
 * @type {?}
 */
InjectableDef.prototype.value;
/**
 * Information about the providers to be included in an `Injector` as well as how the given type
 * which carries the information should be created by the DI system.
 *
 * An `InjectorDef` can import other types which have `InjectorDefs`, forming a deep nested
 * structure of providers with a defined priority (identically to how `NgModule`s also have
 * an import/dependency structure).
 *
 * NOTE: This is a private type and should not be exported
 * @record
 * @template T
 */
export function InjectorDef() { }
/** @type {?} */
InjectorDef.prototype.factory;
/** @type {?} */
InjectorDef.prototype.providers;
/** @type {?} */
InjectorDef.prototype.imports;
/**
 * A `Type` which has an `InjectableDef` static field.
 *
 * `InjectableDefType`s contain their own Dependency Injection metadata and are usable in an
 * `InjectorDef`-based `StaticInjector.
 *
 * \@publicApi
 * @record
 * @template T
 */
export function InjectableType() { }
/**
 * Opaque type whose structure is highly version dependent. Do not rely on any properties.
 * @type {?}
 */
InjectableType.prototype.ngInjectableDef;
/**
 * A type which has an `InjectorDef` static field.
 *
 * `InjectorDefTypes` can be used to configure a `StaticInjector`.
 *
 * \@publicApi
 * @record
 * @template T
 */
export function InjectorType() { }
/**
 * Opaque type whose structure is highly version dependent. Do not rely on any properties.
 * @type {?}
 */
InjectorType.prototype.ngInjectorDef;
/**
 * Describes the `InjectorDef` equivalent of a `ModuleWithProviders`, an `InjectorDefType` with an
 * associated array of providers.
 *
 * Objects of this type can be listed in the imports section of an `InjectorDef`.
 *
 * NOTE: This is a private type and should not be exported
 * @record
 * @template T
 */
export function InjectorTypeWithProviders() { }
/** @type {?} */
InjectorTypeWithProviders.prototype.ngModule;
/** @type {?|undefined} */
InjectorTypeWithProviders.prototype.providers;
/**
 * Construct an `InjectableDef` which defines how a token will be constructed by the DI system, and
 * in which injectors (if any) it will be available.
 *
 * This should be assigned to a static `ngInjectableDef` field on a type, which will then be an
 * `InjectableType`.
 *
 * Options:
 * * `providedIn` determines which injectors will include the injectable, by either associating it
 *   with an `\@NgModule` or other `InjectorType`, or by specifying that this injectable should be
 *   provided in the `'root'` injector, which will be the application-level injector in most apps.
 * * `factory` gives the zero argument function which will create an instance of the injectable.
 *   The factory can call `inject` to access the `Injector` and request injection of dependencies.
 *
 * \@publicApi
 * @template T
 * @param {?} opts
 * @return {?}
 */
export function defineInjectable(opts) {
    return /** @type {?} */ ((/** @type {?} */ ({
        providedIn: /** @type {?} */ (opts.providedIn) || null, factory: opts.factory, value: undefined,
    })));
}
/**
 * Construct an `InjectorDef` which configures an injector.
 *
 * This should be assigned to a static `ngInjectorDef` field on a type, which will then be an
 * `InjectorType`.
 *
 * Options:
 *
 * * `factory`: an `InjectorType` is an instantiable type, so a zero argument `factory` function to
 *   create the type must be provided. If that factory function needs to inject arguments, it can
 *   use the `inject` function.
 * * `providers`: an optional array of providers to add to the injector. Each provider must
 *   either have a factory or point to a type which has an `ngInjectableDef` static property (the
 *   type must be an `InjectableType`).
 * * `imports`: an optional array of imports of other `InjectorType`s or `InjectorTypeWithModule`s
 *   whose providers will also be added to the injector. Locally provided types will override
 *   providers from imports.
 *
 * \@publicApi
 * @param {?} options
 * @return {?}
 */
export function defineInjector(options) {
    return /** @type {?} */ ((/** @type {?} */ ({
        factory: options.factory, providers: options.providers || [], imports: options.imports || [],
    })));
}
/**
 * Read the `ngInjectableDef` type in a way which is immune to accidentally reading inherited value.
 *
 * @template T
 * @param {?} type type which may have `ngInjectableDef`
 * @return {?}
 */
export function getInjectableDef(type) {
    return type.hasOwnProperty(NG_INJECTABLE_DEF) ? (/** @type {?} */ (type))[NG_INJECTABLE_DEF] : null;
}
/**
 * Read the `ngInjectorDef` type in a way which is immune to accidentally reading inherited value.
 *
 * @template T
 * @param {?} type type which may have `ngInjectorDef`
 * @return {?}
 */
export function getInjectorDef(type) {
    return type.hasOwnProperty(NG_INJECTOR_DEF) ? (/** @type {?} */ (type))[NG_INJECTOR_DEF] : null;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2RlZnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsZUFBZSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdIckUsTUFBTSxVQUFVLGdCQUFnQixDQUFJLElBR25DO0lBQ0MseUJBQU8sbUJBQUM7UUFDTixVQUFVLG9CQUFFLElBQUksQ0FBQyxVQUFpQixLQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUztLQUNoRSxFQUFVLEVBQUM7Q0FDakM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JELE1BQU0sVUFBVSxjQUFjLENBQUMsT0FBaUU7SUFFOUYseUJBQU8sbUJBQUM7UUFDTixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRTtLQUN6RSxFQUFVLEVBQUM7Q0FDakM7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLGdCQUFnQixDQUFJLElBQVM7SUFDM0MsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFDLElBQVcsRUFBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztDQUN6Rjs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsY0FBYyxDQUFJLElBQVM7SUFDekMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQyxJQUFXLEVBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0NBQ3JGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05HX0lOSkVDVEFCTEVfREVGLCBOR19JTkpFQ1RPUl9ERUZ9IGZyb20gJy4uL3JlbmRlcjMvZmllbGRzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ2xhc3NTYW5zUHJvdmlkZXIsIENvbnN0cnVjdG9yUHJvdmlkZXIsIENvbnN0cnVjdG9yU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBGYWN0b3J5U2Fuc1Byb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuXG4vKipcbiAqIEluZm9ybWF0aW9uIGFib3V0IGhvdyBhIHR5cGUgb3IgYEluamVjdGlvblRva2VuYCBpbnRlcmZhY2VzIHdpdGggdGhlIERJIHN5c3RlbS5cbiAqXG4gKiBBdCBhIG1pbmltdW0sIHRoaXMgaW5jbHVkZXMgYSBgZmFjdG9yeWAgd2hpY2ggZGVmaW5lcyBob3cgdG8gY3JlYXRlIHRoZSBnaXZlbiB0eXBlIGBUYCwgcG9zc2libHlcbiAqIHJlcXVlc3RpbmcgaW5qZWN0aW9uIG9mIG90aGVyIHR5cGVzIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBPcHRpb25hbGx5LCBhIGBwcm92aWRlZEluYCBwYXJhbWV0ZXIgc3BlY2lmaWVzIHRoYXQgdGhlIGdpdmVuIHR5cGUgYmVsb25ncyB0byBhIHBhcnRpY3VsYXJcbiAqIGBJbmplY3RvckRlZmAsIGBOZ01vZHVsZWAsIG9yIGEgc3BlY2lhbCBzY29wZSAoZS5nLiBgJ3Jvb3QnYCkuIEEgdmFsdWUgb2YgYG51bGxgIGluZGljYXRlc1xuICogdGhhdCB0aGUgaW5qZWN0YWJsZSBkb2VzIG5vdCBiZWxvbmcgdG8gYW55IHNjb3BlLlxuICpcbiAqIE5PVEU6IFRoaXMgaXMgYSBwcml2YXRlIHR5cGUgYW5kIHNob3VsZCBub3QgYmUgZXhwb3J0ZWRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbmplY3RhYmxlRGVmPFQ+IHtcbiAgLyoqXG4gICAqIFNwZWNpZmllcyB0aGF0IHRoZSBnaXZlbiB0eXBlIGJlbG9uZ3MgdG8gYSBwYXJ0aWN1bGFyIGluamVjdG9yOlxuICAgKiAtIGBJbmplY3RvclR5cGVgIHN1Y2ggYXMgYE5nTW9kdWxlYCxcbiAgICogLSBgJ3Jvb3QnYCB0aGUgcm9vdCBpbmplY3RvclxuICAgKiAtIGAnYW55J2AgYWxsIGluamVjdG9ycy5cbiAgICogLSBgbnVsbGAsIGRvZXMgbm90IGJlbG9uZyB0byBhbnkgaW5qZWN0b3IuIE11c3QgYmUgZXhwbGljaXRseSBsaXN0ZWQgaW4gdGhlIGluamVjdG9yXG4gICAqICAgYHByb3ZpZGVyc2AuXG4gICAqL1xuICBwcm92aWRlZEluOiBJbmplY3RvclR5cGU8YW55Pnwncm9vdCd8J2FueSd8bnVsbDtcblxuICAvKipcbiAgICogRmFjdG9yeSBtZXRob2QgdG8gZXhlY3V0ZSB0byBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGluamVjdGFibGUuXG4gICAqL1xuICBmYWN0b3J5OiAoKSA9PiBUO1xuXG4gIC8qKlxuICAgKiBJbiBhIGNhc2Ugb2Ygbm8gZXhwbGljaXQgaW5qZWN0b3IsIGEgbG9jYXRpb24gd2hlcmUgdGhlIGluc3RhbmNlIG9mIHRoZSBpbmplY3RhYmxlIGlzIHN0b3JlZC5cbiAgICovXG4gIHZhbHVlOiBUfHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgcHJvdmlkZXJzIHRvIGJlIGluY2x1ZGVkIGluIGFuIGBJbmplY3RvcmAgYXMgd2VsbCBhcyBob3cgdGhlIGdpdmVuIHR5cGVcbiAqIHdoaWNoIGNhcnJpZXMgdGhlIGluZm9ybWF0aW9uIHNob3VsZCBiZSBjcmVhdGVkIGJ5IHRoZSBESSBzeXN0ZW0uXG4gKlxuICogQW4gYEluamVjdG9yRGVmYCBjYW4gaW1wb3J0IG90aGVyIHR5cGVzIHdoaWNoIGhhdmUgYEluamVjdG9yRGVmc2AsIGZvcm1pbmcgYSBkZWVwIG5lc3RlZFxuICogc3RydWN0dXJlIG9mIHByb3ZpZGVycyB3aXRoIGEgZGVmaW5lZCBwcmlvcml0eSAoaWRlbnRpY2FsbHkgdG8gaG93IGBOZ01vZHVsZWBzIGFsc28gaGF2ZVxuICogYW4gaW1wb3J0L2RlcGVuZGVuY3kgc3RydWN0dXJlKS5cbiAqXG4gKiBOT1RFOiBUaGlzIGlzIGEgcHJpdmF0ZSB0eXBlIGFuZCBzaG91bGQgbm90IGJlIGV4cG9ydGVkXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5qZWN0b3JEZWY8VD4ge1xuICBmYWN0b3J5OiAoKSA9PiBUO1xuXG4gIC8vIFRPRE8oYWx4aHViKTogTmFycm93IGRvd24gdGhlIHR5cGUgaGVyZSBvbmNlIGRlY29yYXRvcnMgcHJvcGVybHkgY2hhbmdlIHRoZSByZXR1cm4gdHlwZSBvZiB0aGVcbiAgLy8gY2xhc3MgdGhleSBhcmUgZGVjb3JhdGluZyAodG8gYWRkIHRoZSBuZ0luamVjdGFibGVEZWYgcHJvcGVydHkgZm9yIGV4YW1wbGUpLlxuICBwcm92aWRlcnM6IChUeXBlPGFueT58VmFsdWVQcm92aWRlcnxFeGlzdGluZ1Byb3ZpZGVyfEZhY3RvcnlQcm92aWRlcnxDb25zdHJ1Y3RvclByb3ZpZGVyfFxuICAgICAgICAgICAgICBTdGF0aWNDbGFzc1Byb3ZpZGVyfENsYXNzUHJvdmlkZXJ8YW55W10pW107XG5cbiAgaW1wb3J0czogKEluamVjdG9yVHlwZTxhbnk+fEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PilbXTtcbn1cblxuLyoqXG4gKiBBIGBUeXBlYCB3aGljaCBoYXMgYW4gYEluamVjdGFibGVEZWZgIHN0YXRpYyBmaWVsZC5cbiAqXG4gKiBgSW5qZWN0YWJsZURlZlR5cGVgcyBjb250YWluIHRoZWlyIG93biBEZXBlbmRlbmN5IEluamVjdGlvbiBtZXRhZGF0YSBhbmQgYXJlIHVzYWJsZSBpbiBhblxuICogYEluamVjdG9yRGVmYC1iYXNlZCBgU3RhdGljSW5qZWN0b3IuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEluamVjdGFibGVUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7XG4gIC8qKlxuICAgKiBPcGFxdWUgdHlwZSB3aG9zZSBzdHJ1Y3R1cmUgaXMgaGlnaGx5IHZlcnNpb24gZGVwZW5kZW50LiBEbyBub3QgcmVseSBvbiBhbnkgcHJvcGVydGllcy5cbiAgICovXG4gIG5nSW5qZWN0YWJsZURlZjogbmV2ZXI7XG59XG5cbi8qKlxuICogQSB0eXBlIHdoaWNoIGhhcyBhbiBgSW5qZWN0b3JEZWZgIHN0YXRpYyBmaWVsZC5cbiAqXG4gKiBgSW5qZWN0b3JEZWZUeXBlc2AgY2FuIGJlIHVzZWQgdG8gY29uZmlndXJlIGEgYFN0YXRpY0luamVjdG9yYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5qZWN0b3JUeXBlPFQ+IGV4dGVuZHMgVHlwZTxUPiB7XG4gIC8qKlxuICAgKiBPcGFxdWUgdHlwZSB3aG9zZSBzdHJ1Y3R1cmUgaXMgaGlnaGx5IHZlcnNpb24gZGVwZW5kZW50LiBEbyBub3QgcmVseSBvbiBhbnkgcHJvcGVydGllcy5cbiAgICovXG4gIG5nSW5qZWN0b3JEZWY6IG5ldmVyO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyB0aGUgYEluamVjdG9yRGVmYCBlcXVpdmFsZW50IG9mIGEgYE1vZHVsZVdpdGhQcm92aWRlcnNgLCBhbiBgSW5qZWN0b3JEZWZUeXBlYCB3aXRoIGFuXG4gKiBhc3NvY2lhdGVkIGFycmF5IG9mIHByb3ZpZGVycy5cbiAqXG4gKiBPYmplY3RzIG9mIHRoaXMgdHlwZSBjYW4gYmUgbGlzdGVkIGluIHRoZSBpbXBvcnRzIHNlY3Rpb24gb2YgYW4gYEluamVjdG9yRGVmYC5cbiAqXG4gKiBOT1RFOiBUaGlzIGlzIGEgcHJpdmF0ZSB0eXBlIGFuZCBzaG91bGQgbm90IGJlIGV4cG9ydGVkXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxUPiB7XG4gIG5nTW9kdWxlOiBJbmplY3RvclR5cGU8VD47XG4gIHByb3ZpZGVycz86IChUeXBlPGFueT58VmFsdWVQcm92aWRlcnxFeGlzdGluZ1Byb3ZpZGVyfEZhY3RvcnlQcm92aWRlcnxDb25zdHJ1Y3RvclByb3ZpZGVyfFxuICAgICAgICAgICAgICAgU3RhdGljQ2xhc3NQcm92aWRlcnxDbGFzc1Byb3ZpZGVyfGFueVtdKVtdO1xufVxuXG5cbi8qKlxuICogQ29uc3RydWN0IGFuIGBJbmplY3RhYmxlRGVmYCB3aGljaCBkZWZpbmVzIGhvdyBhIHRva2VuIHdpbGwgYmUgY29uc3RydWN0ZWQgYnkgdGhlIERJIHN5c3RlbSwgYW5kXG4gKiBpbiB3aGljaCBpbmplY3RvcnMgKGlmIGFueSkgaXQgd2lsbCBiZSBhdmFpbGFibGUuXG4gKlxuICogVGhpcyBzaG91bGQgYmUgYXNzaWduZWQgdG8gYSBzdGF0aWMgYG5nSW5qZWN0YWJsZURlZmAgZmllbGQgb24gYSB0eXBlLCB3aGljaCB3aWxsIHRoZW4gYmUgYW5cbiAqIGBJbmplY3RhYmxlVHlwZWAuXG4gKlxuICogT3B0aW9uczpcbiAqICogYHByb3ZpZGVkSW5gIGRldGVybWluZXMgd2hpY2ggaW5qZWN0b3JzIHdpbGwgaW5jbHVkZSB0aGUgaW5qZWN0YWJsZSwgYnkgZWl0aGVyIGFzc29jaWF0aW5nIGl0XG4gKiAgIHdpdGggYW4gYEBOZ01vZHVsZWAgb3Igb3RoZXIgYEluamVjdG9yVHlwZWAsIG9yIGJ5IHNwZWNpZnlpbmcgdGhhdCB0aGlzIGluamVjdGFibGUgc2hvdWxkIGJlXG4gKiAgIHByb3ZpZGVkIGluIHRoZSBgJ3Jvb3QnYCBpbmplY3Rvciwgd2hpY2ggd2lsbCBiZSB0aGUgYXBwbGljYXRpb24tbGV2ZWwgaW5qZWN0b3IgaW4gbW9zdCBhcHBzLlxuICogKiBgZmFjdG9yeWAgZ2l2ZXMgdGhlIHplcm8gYXJndW1lbnQgZnVuY3Rpb24gd2hpY2ggd2lsbCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGluamVjdGFibGUuXG4gKiAgIFRoZSBmYWN0b3J5IGNhbiBjYWxsIGBpbmplY3RgIHRvIGFjY2VzcyB0aGUgYEluamVjdG9yYCBhbmQgcmVxdWVzdCBpbmplY3Rpb24gb2YgZGVwZW5kZW5jaWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUluamVjdGFibGU8VD4ob3B0czoge1xuICBwcm92aWRlZEluPzogVHlwZTxhbnk+fCAncm9vdCcgfCAnYW55JyB8IG51bGwsXG4gIGZhY3Rvcnk6ICgpID0+IFQsXG59KTogbmV2ZXIge1xuICByZXR1cm4gKHtcbiAgICBwcm92aWRlZEluOiBvcHRzLnByb3ZpZGVkSW4gYXMgYW55IHx8IG51bGwsIGZhY3Rvcnk6IG9wdHMuZmFjdG9yeSwgdmFsdWU6IHVuZGVmaW5lZCxcbiAgfSBhcyBJbmplY3RhYmxlRGVmPFQ+KSBhcyBuZXZlcjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3QgYW4gYEluamVjdG9yRGVmYCB3aGljaCBjb25maWd1cmVzIGFuIGluamVjdG9yLlxuICpcbiAqIFRoaXMgc2hvdWxkIGJlIGFzc2lnbmVkIHRvIGEgc3RhdGljIGBuZ0luamVjdG9yRGVmYCBmaWVsZCBvbiBhIHR5cGUsIHdoaWNoIHdpbGwgdGhlbiBiZSBhblxuICogYEluamVjdG9yVHlwZWAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAqIGBmYWN0b3J5YDogYW4gYEluamVjdG9yVHlwZWAgaXMgYW4gaW5zdGFudGlhYmxlIHR5cGUsIHNvIGEgemVybyBhcmd1bWVudCBgZmFjdG9yeWAgZnVuY3Rpb24gdG9cbiAqICAgY3JlYXRlIHRoZSB0eXBlIG11c3QgYmUgcHJvdmlkZWQuIElmIHRoYXQgZmFjdG9yeSBmdW5jdGlvbiBuZWVkcyB0byBpbmplY3QgYXJndW1lbnRzLCBpdCBjYW5cbiAqICAgdXNlIHRoZSBgaW5qZWN0YCBmdW5jdGlvbi5cbiAqICogYHByb3ZpZGVyc2A6IGFuIG9wdGlvbmFsIGFycmF5IG9mIHByb3ZpZGVycyB0byBhZGQgdG8gdGhlIGluamVjdG9yLiBFYWNoIHByb3ZpZGVyIG11c3RcbiAqICAgZWl0aGVyIGhhdmUgYSBmYWN0b3J5IG9yIHBvaW50IHRvIGEgdHlwZSB3aGljaCBoYXMgYW4gYG5nSW5qZWN0YWJsZURlZmAgc3RhdGljIHByb3BlcnR5ICh0aGVcbiAqICAgdHlwZSBtdXN0IGJlIGFuIGBJbmplY3RhYmxlVHlwZWApLlxuICogKiBgaW1wb3J0c2A6IGFuIG9wdGlvbmFsIGFycmF5IG9mIGltcG9ydHMgb2Ygb3RoZXIgYEluamVjdG9yVHlwZWBzIG9yIGBJbmplY3RvclR5cGVXaXRoTW9kdWxlYHNcbiAqICAgd2hvc2UgcHJvdmlkZXJzIHdpbGwgYWxzbyBiZSBhZGRlZCB0byB0aGUgaW5qZWN0b3IuIExvY2FsbHkgcHJvdmlkZWQgdHlwZXMgd2lsbCBvdmVycmlkZVxuICogICBwcm92aWRlcnMgZnJvbSBpbXBvcnRzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUluamVjdG9yKG9wdGlvbnM6IHtmYWN0b3J5OiAoKSA9PiBhbnksIHByb3ZpZGVycz86IGFueVtdLCBpbXBvcnRzPzogYW55W119KTpcbiAgICBuZXZlciB7XG4gIHJldHVybiAoe1xuICAgIGZhY3Rvcnk6IG9wdGlvbnMuZmFjdG9yeSwgcHJvdmlkZXJzOiBvcHRpb25zLnByb3ZpZGVycyB8fCBbXSwgaW1wb3J0czogb3B0aW9ucy5pbXBvcnRzIHx8IFtdLFxuICB9IGFzIEluamVjdG9yRGVmPGFueT4pIGFzIG5ldmVyO1xufVxuXG4vKipcbiAqIFJlYWQgdGhlIGBuZ0luamVjdGFibGVEZWZgIHR5cGUgaW4gYSB3YXkgd2hpY2ggaXMgaW1tdW5lIHRvIGFjY2lkZW50YWxseSByZWFkaW5nIGluaGVyaXRlZCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdHlwZSB0eXBlIHdoaWNoIG1heSBoYXZlIGBuZ0luamVjdGFibGVEZWZgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RhYmxlRGVmPFQ+KHR5cGU6IGFueSk6IEluamVjdGFibGVEZWY8VD58bnVsbCB7XG4gIHJldHVybiB0eXBlLmhhc093blByb3BlcnR5KE5HX0lOSkVDVEFCTEVfREVGKSA/ICh0eXBlIGFzIGFueSlbTkdfSU5KRUNUQUJMRV9ERUZdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBSZWFkIHRoZSBgbmdJbmplY3RvckRlZmAgdHlwZSBpbiBhIHdheSB3aGljaCBpcyBpbW11bmUgdG8gYWNjaWRlbnRhbGx5IHJlYWRpbmcgaW5oZXJpdGVkIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0eXBlIHR5cGUgd2hpY2ggbWF5IGhhdmUgYG5nSW5qZWN0b3JEZWZgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvckRlZjxUPih0eXBlOiBhbnkpOiBJbmplY3RvckRlZjxUPnxudWxsIHtcbiAgcmV0dXJuIHR5cGUuaGFzT3duUHJvcGVydHkoTkdfSU5KRUNUT1JfREVGKSA/ICh0eXBlIGFzIGFueSlbTkdfSU5KRUNUT1JfREVGXSA6IG51bGw7XG59Il19