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
 * Provides access to reflection data about symbols. Used internally by Angular
 * to power dependency injection and compilation.
 */
export class Reflector {
    /**
     * @param {?} reflectionCapabilities
     */
    constructor(reflectionCapabilities) {
        this.reflectionCapabilities = reflectionCapabilities;
    }
    /**
     * @param {?} caps
     * @return {?}
     */
    updateCapabilities(caps) { this.reflectionCapabilities = caps; }
    /**
     * @param {?} type
     * @return {?}
     */
    factory(type) { return this.reflectionCapabilities.factory(type); }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    parameters(typeOrFunc) {
        return this.reflectionCapabilities.parameters(typeOrFunc);
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    annotations(typeOrFunc) {
        return this.reflectionCapabilities.annotations(typeOrFunc);
    }
    /**
     * @param {?} typeOrFunc
     * @return {?}
     */
    propMetadata(typeOrFunc) {
        return this.reflectionCapabilities.propMetadata(typeOrFunc);
    }
    /**
     * @param {?} type
     * @param {?} lcProperty
     * @return {?}
     */
    hasLifecycleHook(type, lcProperty) {
        return this.reflectionCapabilities.hasLifecycleHook(type, lcProperty);
    }
    /**
     * @param {?} name
     * @return {?}
     */
    getter(name) { return this.reflectionCapabilities.getter(name); }
    /**
     * @param {?} name
     * @return {?}
     */
    setter(name) { return this.reflectionCapabilities.setter(name); }
    /**
     * @param {?} name
     * @return {?}
     */
    method(name) { return this.reflectionCapabilities.method(name); }
    /**
     * @param {?} type
     * @return {?}
     */
    importUri(type) { return this.reflectionCapabilities.importUri(type); }
    /**
     * @param {?} type
     * @return {?}
     */
    resourceUri(type) { return this.reflectionCapabilities.resourceUri(type); }
    /**
     * @param {?} name
     * @param {?} moduleUrl
     * @param {?} members
     * @param {?} runtime
     * @return {?}
     */
    resolveIdentifier(name, moduleUrl, members, runtime) {
        return this.reflectionCapabilities.resolveIdentifier(name, moduleUrl, members, runtime);
    }
    /**
     * @param {?} identifier
     * @param {?} name
     * @return {?}
     */
    resolveEnum(identifier, name) {
        return this.reflectionCapabilities.resolveEnum(identifier, name);
    }
}
if (false) {
    /** @type {?} */
    Reflector.prototype.reflectionCapabilities;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVmbGVjdGlvbi9yZWZsZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLE1BQU0sT0FBTyxTQUFTOzs7O0lBQ3BCLFlBQW1CLHNCQUFzRDtRQUF0RCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQWdDO0tBQUk7Ozs7O0lBRTdFLGtCQUFrQixDQUFDLElBQW9DLElBQUksSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxFQUFFOzs7OztJQUVoRyxPQUFPLENBQUMsSUFBZSxJQUFjLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7OztJQUV4RixVQUFVLENBQUMsVUFBcUI7UUFDOUIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzNEOzs7OztJQUVELFdBQVcsQ0FBQyxVQUFxQjtRQUMvQixPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDNUQ7Ozs7O0lBRUQsWUFBWSxDQUFDLFVBQXFCO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUM3RDs7Ozs7O0lBRUQsZ0JBQWdCLENBQUMsSUFBUyxFQUFFLFVBQWtCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN2RTs7Ozs7SUFFRCxNQUFNLENBQUMsSUFBWSxJQUFjLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7OztJQUVuRixNQUFNLENBQUMsSUFBWSxJQUFjLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7OztJQUVuRixNQUFNLENBQUMsSUFBWSxJQUFjLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7OztJQUVuRixTQUFTLENBQUMsSUFBUyxJQUFZLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7OztJQUVwRixXQUFXLENBQUMsSUFBUyxJQUFZLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7Ozs7OztJQUV4RixpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsU0FBaUIsRUFBRSxPQUFpQixFQUFFLE9BQVk7UUFDaEYsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDekY7Ozs7OztJQUVELFdBQVcsQ0FBQyxVQUFlLEVBQUUsSUFBWTtRQUN2QyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ2xFO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge1BsYXRmb3JtUmVmbGVjdGlvbkNhcGFiaWxpdGllc30gZnJvbSAnLi9wbGF0Zm9ybV9yZWZsZWN0aW9uX2NhcGFiaWxpdGllcyc7XG5pbXBvcnQge0dldHRlckZuLCBNZXRob2RGbiwgU2V0dGVyRm59IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQge1BsYXRmb3JtUmVmbGVjdGlvbkNhcGFiaWxpdGllc307XG5leHBvcnQge0dldHRlckZuLCBNZXRob2RGbiwgU2V0dGVyRm59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGFjY2VzcyB0byByZWZsZWN0aW9uIGRhdGEgYWJvdXQgc3ltYm9scy4gVXNlZCBpbnRlcm5hbGx5IGJ5IEFuZ3VsYXJcbiAqIHRvIHBvd2VyIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGFuZCBjb21waWxhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlZmxlY3RvciB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyByZWZsZWN0aW9uQ2FwYWJpbGl0aWVzOiBQbGF0Zm9ybVJlZmxlY3Rpb25DYXBhYmlsaXRpZXMpIHt9XG5cbiAgdXBkYXRlQ2FwYWJpbGl0aWVzKGNhcHM6IFBsYXRmb3JtUmVmbGVjdGlvbkNhcGFiaWxpdGllcykgeyB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMgPSBjYXBzOyB9XG5cbiAgZmFjdG9yeSh0eXBlOiBUeXBlPGFueT4pOiBGdW5jdGlvbiB7IHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMuZmFjdG9yeSh0eXBlKTsgfVxuXG4gIHBhcmFtZXRlcnModHlwZU9yRnVuYzogVHlwZTxhbnk+KTogYW55W11bXSB7XG4gICAgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wYXJhbWV0ZXJzKHR5cGVPckZ1bmMpO1xuICB9XG5cbiAgYW5ub3RhdGlvbnModHlwZU9yRnVuYzogVHlwZTxhbnk+KTogYW55W10ge1xuICAgIHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMuYW5ub3RhdGlvbnModHlwZU9yRnVuYyk7XG4gIH1cblxuICBwcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogVHlwZTxhbnk+KToge1trZXk6IHN0cmluZ106IGFueVtdfSB7XG4gICAgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5wcm9wTWV0YWRhdGEodHlwZU9yRnVuYyk7XG4gIH1cblxuICBoYXNMaWZlY3ljbGVIb29rKHR5cGU6IGFueSwgbGNQcm9wZXJ0eTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5oYXNMaWZlY3ljbGVIb29rKHR5cGUsIGxjUHJvcGVydHkpO1xuICB9XG5cbiAgZ2V0dGVyKG5hbWU6IHN0cmluZyk6IEdldHRlckZuIHsgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5nZXR0ZXIobmFtZSk7IH1cblxuICBzZXR0ZXIobmFtZTogc3RyaW5nKTogU2V0dGVyRm4geyByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnNldHRlcihuYW1lKTsgfVxuXG4gIG1ldGhvZChuYW1lOiBzdHJpbmcpOiBNZXRob2RGbiB7IHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMubWV0aG9kKG5hbWUpOyB9XG5cbiAgaW1wb3J0VXJpKHR5cGU6IGFueSk6IHN0cmluZyB7IHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMuaW1wb3J0VXJpKHR5cGUpOyB9XG5cbiAgcmVzb3VyY2VVcmkodHlwZTogYW55KTogc3RyaW5nIHsgcmV0dXJuIHRoaXMucmVmbGVjdGlvbkNhcGFiaWxpdGllcy5yZXNvdXJjZVVyaSh0eXBlKTsgfVxuXG4gIHJlc29sdmVJZGVudGlmaWVyKG5hbWU6IHN0cmluZywgbW9kdWxlVXJsOiBzdHJpbmcsIG1lbWJlcnM6IHN0cmluZ1tdLCBydW50aW1lOiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnJlZmxlY3Rpb25DYXBhYmlsaXRpZXMucmVzb2x2ZUlkZW50aWZpZXIobmFtZSwgbW9kdWxlVXJsLCBtZW1iZXJzLCBydW50aW1lKTtcbiAgfVxuXG4gIHJlc29sdmVFbnVtKGlkZW50aWZpZXI6IGFueSwgbmFtZTogc3RyaW5nKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5yZWZsZWN0aW9uQ2FwYWJpbGl0aWVzLnJlc29sdmVFbnVtKGlkZW50aWZpZXIsIG5hbWUpO1xuICB9XG59XG4iXX0=