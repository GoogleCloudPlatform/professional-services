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
import { stringify } from '../util';
import { ComponentFactory } from './component_factory';
/**
 * @param {?} component
 * @return {?}
 */
export function noComponentFactoryError(component) {
    /** @type {?} */
    const error = Error(`No component factory found for ${stringify(component)}. Did you add it to @NgModule.entryComponents?`);
    (/** @type {?} */ (error))[ERROR_COMPONENT] = component;
    return error;
}
/** @type {?} */
const ERROR_COMPONENT = 'ngComponent';
/**
 * @param {?} error
 * @return {?}
 */
export function getComponent(error) {
    return (/** @type {?} */ (error))[ERROR_COMPONENT];
}
class _NullComponentFactoryResolver {
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        throw noComponentFactoryError(component);
    }
}
/**
 * \@publicApi
 * @abstract
 */
export class ComponentFactoryResolver {
}
ComponentFactoryResolver.NULL = new _NullComponentFactoryResolver();
if (false) {
    /** @type {?} */
    ComponentFactoryResolver.NULL;
    /**
     * @abstract
     * @template T
     * @param {?} component
     * @return {?}
     */
    ComponentFactoryResolver.prototype.resolveComponentFactory = function (component) { };
}
export class CodegenComponentFactoryResolver {
    /**
     * @param {?} factories
     * @param {?} _parent
     * @param {?} _ngModule
     */
    constructor(factories, _parent, _ngModule) {
        this._parent = _parent;
        this._ngModule = _ngModule;
        this._factories = new Map();
        for (let i = 0; i < factories.length; i++) {
            /** @type {?} */
            const factory = factories[i];
            this._factories.set(factory.componentType, factory);
        }
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    resolveComponentFactory(component) {
        /** @type {?} */
        let factory = this._factories.get(component);
        if (!factory && this._parent) {
            factory = this._parent.resolveComponentFactory(component);
        }
        if (!factory) {
            throw noComponentFactoryError(component);
        }
        return new ComponentFactoryBoundToModule(factory, this._ngModule);
    }
}
if (false) {
    /** @type {?} */
    CodegenComponentFactoryResolver.prototype._factories;
    /** @type {?} */
    CodegenComponentFactoryResolver.prototype._parent;
    /** @type {?} */
    CodegenComponentFactoryResolver.prototype._ngModule;
}
/**
 * @template C
 */
export class ComponentFactoryBoundToModule extends ComponentFactory {
    /**
     * @param {?} factory
     * @param {?} ngModule
     */
    constructor(factory, ngModule) {
        super();
        this.factory = factory;
        this.ngModule = ngModule;
        this.selector = factory.selector;
        this.componentType = factory.componentType;
        this.ngContentSelectors = factory.ngContentSelectors;
        this.inputs = factory.inputs;
        this.outputs = factory.outputs;
    }
    /**
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @param {?=} ngModule
     * @return {?}
     */
    create(injector, projectableNodes, rootSelectorOrNode, ngModule) {
        return this.factory.create(injector, projectableNodes, rootSelectorOrNode, ngModule || this.ngModule);
    }
}
if (false) {
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.selector;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.componentType;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.ngContentSelectors;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.inputs;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.outputs;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.factory;
    /** @type {?} */
    ComponentFactoryBoundToModule.prototype.ngModule;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFVQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWxDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBZSxNQUFNLHFCQUFxQixDQUFDOzs7OztBQUduRSxNQUFNLFVBQVUsdUJBQXVCLENBQUMsU0FBbUI7O0lBQ3pELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FDZixrQ0FBa0MsU0FBUyxDQUFDLFNBQVMsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO0lBQzVHLG1CQUFDLEtBQVksRUFBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUM1QyxPQUFPLEtBQUssQ0FBQztDQUNkOztBQUVELE1BQU0sZUFBZSxHQUFHLGFBQWEsQ0FBQzs7Ozs7QUFFdEMsTUFBTSxVQUFVLFlBQVksQ0FBQyxLQUFZO0lBQ3ZDLE9BQU8sbUJBQUMsS0FBWSxFQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7Q0FDeEM7QUFHRCxNQUFNLDZCQUE2Qjs7Ozs7O0lBQ2pDLHVCQUF1QixDQUFJLFNBQW9DO1FBQzdELE1BQU0sdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDMUM7Q0FDRjs7Ozs7QUFLRCxNQUFNLE9BQWdCLHdCQUF3Qjs7QUFDNUMsZ0NBQXdDLElBQUksNkJBQTZCLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7O0FBSTlFLE1BQU0sT0FBTywrQkFBK0I7Ozs7OztJQUcxQyxZQUNJLFNBQWtDLEVBQVUsT0FBaUMsRUFDckU7UUFEb0MsWUFBTyxHQUFQLE9BQU8sQ0FBMEI7UUFDckUsY0FBUyxHQUFULFNBQVM7MEJBSkEsSUFBSSxHQUFHLEVBQThCO1FBS3hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUN6QyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNyRDtLQUNGOzs7Ozs7SUFFRCx1QkFBdUIsQ0FBSSxTQUFvQzs7UUFDN0QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQzVCLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzNEO1FBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0sdUJBQXVCLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDMUM7UUFDRCxPQUFPLElBQUksNkJBQTZCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNuRTtDQUNGOzs7Ozs7Ozs7Ozs7QUFFRCxNQUFNLE9BQU8sNkJBQWlDLFNBQVEsZ0JBQW1COzs7OztJQU92RSxZQUFvQixPQUE0QixFQUFVLFFBQTBCO1FBQ2xGLEtBQUssRUFBRSxDQUFDO1FBRFUsWUFBTyxHQUFQLE9BQU8sQ0FBcUI7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFrQjtRQUVsRixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFDakMsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQzNDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUM7UUFDckQsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztLQUNoQzs7Ozs7Ozs7SUFFRCxNQUFNLENBQ0YsUUFBa0IsRUFBRSxnQkFBMEIsRUFBRSxrQkFBK0IsRUFDL0UsUUFBMkI7UUFDN0IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FDdEIsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDaEY7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4vY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi9uZ19tb2R1bGVfZmFjdG9yeSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBub0NvbXBvbmVudEZhY3RvcnlFcnJvcihjb21wb25lbnQ6IEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGVycm9yID0gRXJyb3IoXG4gICAgICBgTm8gY29tcG9uZW50IGZhY3RvcnkgZm91bmQgZm9yICR7c3RyaW5naWZ5KGNvbXBvbmVudCl9LiBEaWQgeW91IGFkZCBpdCB0byBATmdNb2R1bGUuZW50cnlDb21wb25lbnRzP2ApO1xuICAoZXJyb3IgYXMgYW55KVtFUlJPUl9DT01QT05FTlRdID0gY29tcG9uZW50O1xuICByZXR1cm4gZXJyb3I7XG59XG5cbmNvbnN0IEVSUk9SX0NPTVBPTkVOVCA9ICduZ0NvbXBvbmVudCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21wb25lbnQoZXJyb3I6IEVycm9yKTogVHlwZTxhbnk+IHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX0NPTVBPTkVOVF07XG59XG5cblxuY2xhc3MgX051bGxDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW1wbGVtZW50cyBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogVH0pOiBDb21wb25lbnRGYWN0b3J5PFQ+IHtcbiAgICB0aHJvdyBub0NvbXBvbmVudEZhY3RvcnlFcnJvcihjb21wb25lbnQpO1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgc3RhdGljIE5VTEw6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciA9IG5ldyBfTnVsbENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuICBhYnN0cmFjdCByZXNvbHZlQ29tcG9uZW50RmFjdG9yeTxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGYWN0b3J5PFQ+O1xufVxuXG5leHBvcnQgY2xhc3MgQ29kZWdlbkNvbXBvbmVudEZhY3RvcnlSZXNvbHZlciBpbXBsZW1lbnRzIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciB7XG4gIHByaXZhdGUgX2ZhY3RvcmllcyA9IG5ldyBNYXA8YW55LCBDb21wb25lbnRGYWN0b3J5PGFueT4+KCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBmYWN0b3JpZXM6IENvbXBvbmVudEZhY3Rvcnk8YW55PltdLCBwcml2YXRlIF9wYXJlbnQ6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgIHByaXZhdGUgX25nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWN0b3JpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBmYWN0b3JpZXNbaV07XG4gICAgICB0aGlzLl9mYWN0b3JpZXMuc2V0KGZhY3RvcnkuY29tcG9uZW50VHlwZSwgZmFjdG9yeSk7XG4gICAgfVxuICB9XG5cbiAgcmVzb2x2ZUNvbXBvbmVudEZhY3Rvcnk8VD4oY29tcG9uZW50OiB7bmV3ICguLi5hcmdzOiBhbnlbXSk6IFR9KTogQ29tcG9uZW50RmFjdG9yeTxUPiB7XG4gICAgbGV0IGZhY3RvcnkgPSB0aGlzLl9mYWN0b3JpZXMuZ2V0KGNvbXBvbmVudCk7XG4gICAgaWYgKCFmYWN0b3J5ICYmIHRoaXMuX3BhcmVudCkge1xuICAgICAgZmFjdG9yeSA9IHRoaXMuX3BhcmVudC5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuICAgIH1cbiAgICBpZiAoIWZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5vQ29tcG9uZW50RmFjdG9yeUVycm9yKGNvbXBvbmVudCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGUoZmFjdG9yeSwgdGhpcy5fbmdNb2R1bGUpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5Qm91bmRUb01vZHVsZTxDPiBleHRlbmRzIENvbXBvbmVudEZhY3Rvcnk8Qz4ge1xuICByZWFkb25seSBzZWxlY3Rvcjogc3RyaW5nO1xuICByZWFkb25seSBjb21wb25lbnRUeXBlOiBUeXBlPGFueT47XG4gIHJlYWRvbmx5IG5nQ29udGVudFNlbGVjdG9yczogc3RyaW5nW107XG4gIHJlYWRvbmx5IGlucHV0czoge3Byb3BOYW1lOiBzdHJpbmcsIHRlbXBsYXRlTmFtZTogc3RyaW5nfVtdO1xuICByZWFkb25seSBvdXRwdXRzOiB7cHJvcE5hbWU6IHN0cmluZywgdGVtcGxhdGVOYW1lOiBzdHJpbmd9W107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBmYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCBwcml2YXRlIG5nTW9kdWxlOiBOZ01vZHVsZVJlZjxhbnk+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNlbGVjdG9yID0gZmFjdG9yeS5zZWxlY3RvcjtcbiAgICB0aGlzLmNvbXBvbmVudFR5cGUgPSBmYWN0b3J5LmNvbXBvbmVudFR5cGU7XG4gICAgdGhpcy5uZ0NvbnRlbnRTZWxlY3RvcnMgPSBmYWN0b3J5Lm5nQ29udGVudFNlbGVjdG9ycztcbiAgICB0aGlzLmlucHV0cyA9IGZhY3RvcnkuaW5wdXRzO1xuICAgIHRoaXMub3V0cHV0cyA9IGZhY3Rvcnkub3V0cHV0cztcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW10sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnksXG4gICAgICBuZ01vZHVsZT86IE5nTW9kdWxlUmVmPGFueT4pOiBDb21wb25lbnRSZWY8Qz4ge1xuICAgIHJldHVybiB0aGlzLmZhY3RvcnkuY3JlYXRlKFxuICAgICAgICBpbmplY3RvciwgcHJvamVjdGFibGVOb2Rlcywgcm9vdFNlbGVjdG9yT3JOb2RlLCBuZ01vZHVsZSB8fCB0aGlzLm5nTW9kdWxlKTtcbiAgfVxufVxuIl19