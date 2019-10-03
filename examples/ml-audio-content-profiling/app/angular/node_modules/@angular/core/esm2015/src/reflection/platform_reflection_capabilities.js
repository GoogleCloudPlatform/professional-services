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
 * @record
 */
export function PlatformReflectionCapabilities() { }
/** @type {?} */
PlatformReflectionCapabilities.prototype.isReflectionEnabled;
/** @type {?} */
PlatformReflectionCapabilities.prototype.factory;
/** @type {?} */
PlatformReflectionCapabilities.prototype.hasLifecycleHook;
/** @type {?} */
PlatformReflectionCapabilities.prototype.guards;
/**
 * Return a list of annotations/types for constructor parameters
 * @type {?}
 */
PlatformReflectionCapabilities.prototype.parameters;
/**
 * Return a list of annotations declared on the class
 * @type {?}
 */
PlatformReflectionCapabilities.prototype.annotations;
/**
 * Return a object literal which describes the annotations on Class fields/properties.
 * @type {?}
 */
PlatformReflectionCapabilities.prototype.propMetadata;
/** @type {?} */
PlatformReflectionCapabilities.prototype.getter;
/** @type {?} */
PlatformReflectionCapabilities.prototype.setter;
/** @type {?} */
PlatformReflectionCapabilities.prototype.method;
/** @type {?} */
PlatformReflectionCapabilities.prototype.importUri;
/** @type {?} */
PlatformReflectionCapabilities.prototype.resourceUri;
/** @type {?} */
PlatformReflectionCapabilities.prototype.resolveIdentifier;
/** @type {?} */
PlatformReflectionCapabilities.prototype.resolveEnum;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm1fcmVmbGVjdGlvbl9jYXBhYmlsaXRpZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZWZsZWN0aW9uL3BsYXRmb3JtX3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge0dldHRlckZuLCBNZXRob2RGbiwgU2V0dGVyRm59IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBsYXRmb3JtUmVmbGVjdGlvbkNhcGFiaWxpdGllcyB7XG4gIGlzUmVmbGVjdGlvbkVuYWJsZWQoKTogYm9vbGVhbjtcbiAgZmFjdG9yeSh0eXBlOiBUeXBlPGFueT4pOiBGdW5jdGlvbjtcbiAgaGFzTGlmZWN5Y2xlSG9vayh0eXBlOiBhbnksIGxjUHJvcGVydHk6IHN0cmluZyk6IGJvb2xlYW47XG4gIGd1YXJkcyh0eXBlOiBhbnkpOiB7W2tleTogc3RyaW5nXTogYW55fTtcblxuICAvKipcbiAgICogUmV0dXJuIGEgbGlzdCBvZiBhbm5vdGF0aW9ucy90eXBlcyBmb3IgY29uc3RydWN0b3IgcGFyYW1ldGVyc1xuICAgKi9cbiAgcGFyYW1ldGVycyh0eXBlOiBUeXBlPGFueT4pOiBhbnlbXVtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBsaXN0IG9mIGFubm90YXRpb25zIGRlY2xhcmVkIG9uIHRoZSBjbGFzc1xuICAgKi9cbiAgYW5ub3RhdGlvbnModHlwZTogVHlwZTxhbnk+KTogYW55W107XG5cbiAgLyoqXG4gICAqIFJldHVybiBhIG9iamVjdCBsaXRlcmFsIHdoaWNoIGRlc2NyaWJlcyB0aGUgYW5ub3RhdGlvbnMgb24gQ2xhc3MgZmllbGRzL3Byb3BlcnRpZXMuXG4gICAqL1xuICBwcm9wTWV0YWRhdGEodHlwZU9yRnVuYzogVHlwZTxhbnk+KToge1trZXk6IHN0cmluZ106IGFueVtdfTtcbiAgZ2V0dGVyKG5hbWU6IHN0cmluZyk6IEdldHRlckZuO1xuICBzZXR0ZXIobmFtZTogc3RyaW5nKTogU2V0dGVyRm47XG4gIG1ldGhvZChuYW1lOiBzdHJpbmcpOiBNZXRob2RGbjtcbiAgaW1wb3J0VXJpKHR5cGU6IFR5cGU8YW55Pik6IHN0cmluZztcbiAgcmVzb3VyY2VVcmkodHlwZTogVHlwZTxhbnk+KTogc3RyaW5nO1xuICByZXNvbHZlSWRlbnRpZmllcihuYW1lOiBzdHJpbmcsIG1vZHVsZVVybDogc3RyaW5nLCBtZW1iZXJzOiBzdHJpbmdbXSwgcnVudGltZTogYW55KTogYW55O1xuICByZXNvbHZlRW51bShlbnVtSWRlbnRpZmllcjogYW55LCBuYW1lOiBzdHJpbmcpOiBhbnk7XG59XG4iXX0=