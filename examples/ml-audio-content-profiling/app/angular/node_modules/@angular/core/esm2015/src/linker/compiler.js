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
import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
/**
 * Combination of NgModuleFactory and ComponentFactorys.
 *
 * \@publicApi
 * @template T
 */
export class ModuleWithComponentFactories {
    /**
     * @param {?} ngModuleFactory
     * @param {?} componentFactories
     */
    constructor(ngModuleFactory, componentFactories) {
        this.ngModuleFactory = ngModuleFactory;
        this.componentFactories = componentFactories;
    }
}
if (false) {
    /** @type {?} */
    ModuleWithComponentFactories.prototype.ngModuleFactory;
    /** @type {?} */
    ModuleWithComponentFactories.prototype.componentFactories;
}
/**
 * @return {?}
 */
function _throwError() {
    throw new Error(`Runtime compiler is not loaded`);
}
/**
 * Low-level service for running the angular compiler during runtime
 * to create {\@link ComponentFactory}s, which
 * can later be used to create and render a Component instance.
 *
 * Each `\@NgModule` provides an own `Compiler` to its injector,
 * that will use the directives/pipes of the ng module for compilation
 * of components.
 *
 * \@publicApi
 */
export class Compiler {
    /**
     * Compiles the given NgModule and all of its components. All templates of the components listed
     * in `entryComponents` have to be inlined.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleSync(moduleType) { throw _throwError(); }
    /**
     * Compiles the given NgModule and all of its components
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAsync(moduleType) { throw _throwError(); }
    /**
     * Same as {\@link #compileModuleSync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsSync(moduleType) {
        throw _throwError();
    }
    /**
     * Same as {\@link #compileModuleAsync} but also creates ComponentFactories for all components.
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsAsync(moduleType) {
        throw _throwError();
    }
    /**
     * Clears all caches.
     * @return {?}
     */
    clearCache() { }
    /**
     * Clears the cache for the given component/ngModule.
     * @param {?} type
     * @return {?}
     */
    clearCacheFor(type) { }
    /**
     * Returns the id for a given NgModule, if one is defined and known to the compiler.
     * @param {?} moduleType
     * @return {?}
     */
    getModuleId(moduleType) { return undefined; }
}
Compiler.decorators = [
    { type: Injectable }
];
/** @typedef {?} */
var CompilerOptions;
export { CompilerOptions };
/** *
 * Token to provide CompilerOptions in the platform injector.
 *
 * \@publicApi
  @type {?} */
export const COMPILER_OPTIONS = new InjectionToken('compilerOptions');
/**
 * A factory for creating a Compiler
 *
 * \@publicApi
 * @abstract
 */
export class CompilerFactory {
}
if (false) {
    /**
     * @abstract
     * @param {?=} options
     * @return {?}
     */
    CompilerFactory.prototype.createCompiler = function (options) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcGlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7O0FBZ0JyRCxNQUFNLE9BQU8sNEJBQTRCOzs7OztJQUN2QyxZQUNXLGlCQUNBO1FBREEsb0JBQWUsR0FBZixlQUFlO1FBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQjtLQUE2QjtDQUMzRDs7Ozs7Ozs7OztBQUdELFNBQVMsV0FBVztJQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7Q0FDbkQ7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sT0FBTyxRQUFROzs7Ozs7OztJQUtuQixpQkFBaUIsQ0FBSSxVQUFtQixJQUF3QixNQUFNLFdBQVcsRUFBRSxDQUFDLEVBQUU7Ozs7Ozs7SUFLdEYsa0JBQWtCLENBQUksVUFBbUIsSUFBaUMsTUFBTSxXQUFXLEVBQUUsQ0FBQyxFQUFFOzs7Ozs7O0lBS2hHLGlDQUFpQyxDQUFJLFVBQW1CO1FBQ3RELE1BQU0sV0FBVyxFQUFFLENBQUM7S0FDckI7Ozs7Ozs7SUFLRCxrQ0FBa0MsQ0FBSSxVQUFtQjtRQUV2RCxNQUFNLFdBQVcsRUFBRSxDQUFDO0tBQ3JCOzs7OztJQUtELFVBQVUsTUFBVzs7Ozs7O0lBS3JCLGFBQWEsQ0FBQyxJQUFlLEtBQUk7Ozs7OztJQUtqQyxXQUFXLENBQUMsVUFBcUIsSUFBc0IsT0FBTyxTQUFTLENBQUMsRUFBRTs7O1lBekMzRSxVQUFVOzs7Ozs7Ozs7O0FBOERYLGFBQWEsZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQW9CLGlCQUFpQixDQUFDLENBQUM7Ozs7Ozs7QUFPekYsTUFBTSxPQUFnQixlQUFlO0NBRXBDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7U3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uL2RpL3Byb3ZpZGVyJztcbmltcG9ydCB7TWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3l9IGZyb20gJy4uL2kxOG4vdG9rZW5zJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5cblxuXG4vKipcbiAqIENvbWJpbmF0aW9uIG9mIE5nTW9kdWxlRmFjdG9yeSBhbmQgQ29tcG9uZW50RmFjdG9yeXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIG5nTW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PFQ+LFxuICAgICAgcHVibGljIGNvbXBvbmVudEZhY3RvcmllczogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pIHt9XG59XG5cblxuZnVuY3Rpb24gX3Rocm93RXJyb3IoKSB7XG4gIHRocm93IG5ldyBFcnJvcihgUnVudGltZSBjb21waWxlciBpcyBub3QgbG9hZGVkYCk7XG59XG5cbi8qKlxuICogTG93LWxldmVsIHNlcnZpY2UgZm9yIHJ1bm5pbmcgdGhlIGFuZ3VsYXIgY29tcGlsZXIgZHVyaW5nIHJ1bnRpbWVcbiAqIHRvIGNyZWF0ZSB7QGxpbmsgQ29tcG9uZW50RmFjdG9yeX1zLCB3aGljaFxuICogY2FuIGxhdGVyIGJlIHVzZWQgdG8gY3JlYXRlIGFuZCByZW5kZXIgYSBDb21wb25lbnQgaW5zdGFuY2UuXG4gKlxuICogRWFjaCBgQE5nTW9kdWxlYCBwcm92aWRlcyBhbiBvd24gYENvbXBpbGVyYCB0byBpdHMgaW5qZWN0b3IsXG4gKiB0aGF0IHdpbGwgdXNlIHRoZSBkaXJlY3RpdmVzL3BpcGVzIG9mIHRoZSBuZyBtb2R1bGUgZm9yIGNvbXBpbGF0aW9uXG4gKiBvZiBjb21wb25lbnRzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIENvbXBpbGVyIHtcbiAgLyoqXG4gICAqIENvbXBpbGVzIHRoZSBnaXZlbiBOZ01vZHVsZSBhbmQgYWxsIG9mIGl0cyBjb21wb25lbnRzLiBBbGwgdGVtcGxhdGVzIG9mIHRoZSBjb21wb25lbnRzIGxpc3RlZFxuICAgKiBpbiBgZW50cnlDb21wb25lbnRzYCBoYXZlIHRvIGJlIGlubGluZWQuXG4gICAqL1xuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHsgdGhyb3cgX3Rocm93RXJyb3IoKTsgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gTmdNb2R1bGUgYW5kIGFsbCBvZiBpdHMgY29tcG9uZW50c1xuICAgKi9cbiAgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4geyB0aHJvdyBfdGhyb3dFcnJvcigpOyB9XG5cbiAgLyoqXG4gICAqIFNhbWUgYXMge0BsaW5rICNjb21waWxlTW9kdWxlU3luY30gYnV0IGFsc28gY3JlYXRlcyBDb21wb25lbnRGYWN0b3JpZXMgZm9yIGFsbCBjb21wb25lbnRzLlxuICAgKi9cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgICB0aHJvdyBfdGhyb3dFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNhbWUgYXMge0BsaW5rICNjb21waWxlTW9kdWxlQXN5bmN9IGJ1dCBhbHNvIGNyZWF0ZXMgQ29tcG9uZW50RmFjdG9yaWVzIGZvciBhbGwgY29tcG9uZW50cy5cbiAgICovXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICB0aHJvdyBfdGhyb3dFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbGwgY2FjaGVzLlxuICAgKi9cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgLyoqXG4gICAqIENsZWFycyB0aGUgY2FjaGUgZm9yIHRoZSBnaXZlbiBjb21wb25lbnQvbmdNb2R1bGUuXG4gICAqL1xuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pikge31cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgZm9yIGEgZ2l2ZW4gTmdNb2R1bGUsIGlmIG9uZSBpcyBkZWZpbmVkIGFuZCBrbm93biB0byB0aGUgY29tcGlsZXIuXG4gICAqL1xuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxufVxuXG4vKipcbiAqIE9wdGlvbnMgZm9yIGNyZWF0aW5nIGEgY29tcGlsZXJcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIENvbXBpbGVyT3B0aW9ucyA9IHtcbiAgdXNlSml0PzogYm9vbGVhbixcbiAgZGVmYXVsdEVuY2Fwc3VsYXRpb24/OiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgcHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSxcbiAgbWlzc2luZ1RyYW5zbGF0aW9uPzogTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3ksXG4gIHByZXNlcnZlV2hpdGVzcGFjZXM/OiBib29sZWFuLFxufTtcblxuLyoqXG4gKiBUb2tlbiB0byBwcm92aWRlIENvbXBpbGVyT3B0aW9ucyBpbiB0aGUgcGxhdGZvcm0gaW5qZWN0b3IuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQ09NUElMRVJfT1BUSU9OUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxDb21waWxlck9wdGlvbnNbXT4oJ2NvbXBpbGVyT3B0aW9ucycpO1xuXG4vKipcbiAqIEEgZmFjdG9yeSBmb3IgY3JlYXRpbmcgYSBDb21waWxlclxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBpbGVyRmFjdG9yeSB7XG4gIGFic3RyYWN0IGNyZWF0ZUNvbXBpbGVyKG9wdGlvbnM/OiBDb21waWxlck9wdGlvbnNbXSk6IENvbXBpbGVyO1xufVxuIl19