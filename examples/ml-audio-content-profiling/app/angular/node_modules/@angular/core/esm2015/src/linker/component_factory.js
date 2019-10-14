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
 * Represents a component created by a `ComponentFactory`.
 * Provides access to the component instance and related objects,
 * and provides the means of destroying the instance.
 *
 * \@publicApi
 * @abstract
 * @template C
 */
export class ComponentRef {
}
if (false) {
    /**
     * The host or anchor [element](guide/glossary#element) for this component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.location = function () { };
    /**
     * The [dependency injector](guide/glossary#injector) for this component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.injector = function () { };
    /**
     * This component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.instance = function () { };
    /**
     * The [host view](guide/glossary#view-tree) defined by the template
     * for this component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.hostView = function () { };
    /**
     * The change detector for this component instance.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.changeDetectorRef = function () { };
    /**
     * The component type.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.componentType = function () { };
    /**
     * Destroys the component instance and all of the data structures associated with it.
     * @abstract
     * @return {?}
     */
    ComponentRef.prototype.destroy = function () { };
    /**
     * A lifecycle hook that provides additional developer-defined cleanup
     * functionality for the component.
     * @abstract
     * @param {?} callback A handler function that cleans up developer-defined data
     * associated with this component. Called when the `destroy()` method is invoked.
     * @return {?}
     */
    ComponentRef.prototype.onDestroy = function (callback) { };
}
/**
 * \@publicApi
 * @abstract
 * @template C
 */
export class ComponentFactory {
}
if (false) {
    /**
     * The component's HTML selector.
     * @abstract
     * @return {?}
     */
    ComponentFactory.prototype.selector = function () { };
    /**
     * The component's type
     * @abstract
     * @return {?}
     */
    ComponentFactory.prototype.componentType = function () { };
    /**
     * Selector for all <ng-content> elements in the component.
     * @abstract
     * @return {?}
     */
    ComponentFactory.prototype.ngContentSelectors = function () { };
    /**
     * The inputs of the component.
     * @abstract
     * @return {?}
     */
    ComponentFactory.prototype.inputs = function () { };
    /**
     * The outputs of the component.
     * @abstract
     * @return {?}
     */
    ComponentFactory.prototype.outputs = function () { };
    /**
     * Creates a new component.
     * @abstract
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    ComponentFactory.prototype.create = function (injector, projectableNodes, rootSelectorOrNode, ngModule) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkEsTUFBTSxPQUFnQixZQUFZO0NBNENqQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS0QsTUFBTSxPQUFnQixnQkFBZ0I7Q0EyQnJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4vbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY29tcG9uZW50IGNyZWF0ZWQgYnkgYSBgQ29tcG9uZW50RmFjdG9yeWAuXG4gKiBQcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgcmVsYXRlZCBvYmplY3RzLFxuICogYW5kIHByb3ZpZGVzIHRoZSBtZWFucyBvZiBkZXN0cm95aW5nIHRoZSBpbnN0YW5jZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnRSZWY8Qz4ge1xuICAvKipcbiAgICogVGhlIGhvc3Qgb3IgYW5jaG9yIFtlbGVtZW50XShndWlkZS9nbG9zc2FyeSNlbGVtZW50KSBmb3IgdGhpcyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgbG9jYXRpb24oKTogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogVGhlIFtkZXBlbmRlbmN5IGluamVjdG9yXShndWlkZS9nbG9zc2FyeSNpbmplY3RvcikgZm9yIHRoaXMgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBUaGlzIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICovXG4gIGFic3RyYWN0IGdldCBpbnN0YW5jZSgpOiBDO1xuXG4gIC8qKlxuICAgKiBUaGUgW2hvc3Qgdmlld10oZ3VpZGUvZ2xvc3Nhcnkjdmlldy10cmVlKSBkZWZpbmVkIGJ5IHRoZSB0ZW1wbGF0ZVxuICAgKiBmb3IgdGhpcyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgaG9zdFZpZXcoKTogVmlld1JlZjtcblxuICAvKipcbiAgICogVGhlIGNoYW5nZSBkZXRlY3RvciBmb3IgdGhpcyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgY2hhbmdlRGV0ZWN0b3JSZWYoKTogQ2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgLyoqXG4gICAqIFRoZSBjb21wb25lbnQgdHlwZS5cbiAgICovXG4gIGFic3RyYWN0IGdldCBjb21wb25lbnRUeXBlKCk6IFR5cGU8YW55PjtcblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgYWxsIG9mIHRoZSBkYXRhIHN0cnVjdHVyZXMgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKi9cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBBIGxpZmVjeWNsZSBob29rIHRoYXQgcHJvdmlkZXMgYWRkaXRpb25hbCBkZXZlbG9wZXItZGVmaW5lZCBjbGVhbnVwXG4gICAqIGZ1bmN0aW9uYWxpdHkgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBjYWxsYmFjayBBIGhhbmRsZXIgZnVuY3Rpb24gdGhhdCBjbGVhbnMgdXAgZGV2ZWxvcGVyLWRlZmluZWQgZGF0YVxuICAgKiBhc3NvY2lhdGVkIHdpdGggdGhpcyBjb21wb25lbnQuIENhbGxlZCB3aGVuIHRoZSBgZGVzdHJveSgpYCBtZXRob2QgaXMgaW52b2tlZC5cbiAgICovXG4gIGFic3RyYWN0IG9uRGVzdHJveShjYWxsYmFjazogRnVuY3Rpb24pOiB2b2lkO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnk8Qz4ge1xuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCdzIEhUTUwgc2VsZWN0b3IuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgc2VsZWN0b3IoKTogc3RyaW5nO1xuICAvKipcbiAgICogVGhlIGNvbXBvbmVudCdzIHR5cGVcbiAgICovXG4gIGFic3RyYWN0IGdldCBjb21wb25lbnRUeXBlKCk6IFR5cGU8YW55PjtcbiAgLyoqXG4gICAqIFNlbGVjdG9yIGZvciBhbGwgPG5nLWNvbnRlbnQ+IGVsZW1lbnRzIGluIHRoZSBjb21wb25lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgbmdDb250ZW50U2VsZWN0b3JzKCk6IHN0cmluZ1tdO1xuICAvKipcbiAgICogVGhlIGlucHV0cyBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IGlucHV0cygpOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W107XG4gIC8qKlxuICAgKiBUaGUgb3V0cHV0cyBvZiB0aGUgY29tcG9uZW50LlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IG91dHB1dHMoKToge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdO1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb21wb25lbnQuXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGUoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55LFxuICAgICAgbmdNb2R1bGU/OiBOZ01vZHVsZVJlZjxhbnk+KTogQ29tcG9uZW50UmVmPEM+O1xufVxuIl19