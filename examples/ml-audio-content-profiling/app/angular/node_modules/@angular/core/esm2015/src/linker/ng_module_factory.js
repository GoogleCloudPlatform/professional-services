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
 * Represents an instance of an NgModule created via a {\@link NgModuleFactory}.
 *
 * `NgModuleRef` provides access to the NgModule Instance as well other objects related to this
 * NgModule Instance.
 *
 * \@publicApi
 * @abstract
 * @template T
 */
export class NgModuleRef {
}
if (false) {
    /**
     * The injector that contains all of the providers of the NgModule.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.injector = function () { };
    /**
     * The ComponentFactoryResolver to get hold of the ComponentFactories
     * declared in the `entryComponents` property of the module.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.componentFactoryResolver = function () { };
    /**
     * The NgModule instance.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.instance = function () { };
    /**
     * Destroys the module instance and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    NgModuleRef.prototype.destroy = function () { };
    /**
     * Allows to register a callback that will be called when the module is destroyed.
     * @abstract
     * @param {?} callback
     * @return {?}
     */
    NgModuleRef.prototype.onDestroy = function (callback) { };
}
/**
 * @record
 * @template T
 */
export function InternalNgModuleRef() { }
/** @type {?} */
InternalNgModuleRef.prototype._bootstrapComponents;
/**
 * \@publicApi
 * @abstract
 * @template T
 */
export class NgModuleFactory {
}
if (false) {
    /**
     * @abstract
     * @return {?}
     */
    NgModuleFactory.prototype.moduleType = function () { };
    /**
     * @abstract
     * @param {?} parentInjector
     * @return {?}
     */
    NgModuleFactory.prototype.create = function (parentInjector) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfbW9kdWxlX2ZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLE1BQU0sT0FBZ0IsV0FBVztDQTBCaEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxPQUFnQixlQUFlO0NBR3BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuIGluc3RhbmNlIG9mIGFuIE5nTW9kdWxlIGNyZWF0ZWQgdmlhIGEge0BsaW5rIE5nTW9kdWxlRmFjdG9yeX0uXG4gKlxuICogYE5nTW9kdWxlUmVmYCBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIE5nTW9kdWxlIEluc3RhbmNlIGFzIHdlbGwgb3RoZXIgb2JqZWN0cyByZWxhdGVkIHRvIHRoaXNcbiAqIE5nTW9kdWxlIEluc3RhbmNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5nTW9kdWxlUmVmPFQ+IHtcbiAgLyoqXG4gICAqIFRoZSBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGFsbCBvZiB0aGUgcHJvdmlkZXJzIG9mIHRoZSBOZ01vZHVsZS5cbiAgICovXG4gIGFic3RyYWN0IGdldCBpbmplY3RvcigpOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogVGhlIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB0byBnZXQgaG9sZCBvZiB0aGUgQ29tcG9uZW50RmFjdG9yaWVzXG4gICAqIGRlY2xhcmVkIGluIHRoZSBgZW50cnlDb21wb25lbnRzYCBwcm9wZXJ0eSBvZiB0aGUgbW9kdWxlLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBOZ01vZHVsZSBpbnN0YW5jZS5cbiAgICovXG4gIGFic3RyYWN0IGdldCBpbnN0YW5jZSgpOiBUO1xuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgbW9kdWxlIGluc3RhbmNlIGFuZCBhbGwgb2YgdGhlIGRhdGEgc3RydWN0dXJlcyBhc3NvY2lhdGVkIHdpdGggaXQuXG4gICAqL1xuICBhYnN0cmFjdCBkZXN0cm95KCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEFsbG93cyB0byByZWdpc3RlciBhIGNhbGxiYWNrIHRoYXQgd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgbW9kdWxlIGlzIGRlc3Ryb3llZC5cbiAgICovXG4gIGFic3RyYWN0IG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxOZ01vZHVsZVJlZjxUPiBleHRlbmRzIE5nTW9kdWxlUmVmPFQ+IHtcbiAgLy8gTm90ZTogd2UgYXJlIHVzaW5nIHRoZSBwcmVmaXggXyBhcyBOZ01vZHVsZURhdGEgaXMgYW4gTmdNb2R1bGVSZWYgYW5kIHRoZXJlZm9yZSBkaXJlY3RseVxuICAvLyBleHBvc2VkIHRvIHRoZSB1c2VyLlxuICBfYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W107XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgYWJzdHJhY3QgZ2V0IG1vZHVsZVR5cGUoKTogVHlwZTxUPjtcbiAgYWJzdHJhY3QgY3JlYXRlKHBhcmVudEluamVjdG9yOiBJbmplY3RvcnxudWxsKTogTmdNb2R1bGVSZWY8VD47XG59XG4iXX0=