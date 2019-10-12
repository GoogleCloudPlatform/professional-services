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
/** *
 * \@description
 *
 * Name of the primary outlet.
 *
 * \@publicApi
  @type {?} */
export const PRIMARY_OUTLET = 'primary';
/** @typedef {?} */
var Params;
export { Params };
/**
 * Matrix and Query parameters.
 *
 * `ParamMap` makes it easier to work with parameters as they could have either a single value or
 * multiple value. Because this should be known by the user, calling `get` or `getAll` returns the
 * correct type (either `string` or `string[]`).
 *
 * The API is inspired by the URLSearchParams interface.
 * see https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
 *
 * \@publicApi
 * @record
 */
export function ParamMap() { }
/** @type {?} */
ParamMap.prototype.has;
/**
 * Return a single value for the given parameter name:
 * - the value when the parameter has a single value,
 * - the first value if the parameter has multiple values,
 * - `null` when there is no such parameter.
 * @type {?}
 */
ParamMap.prototype.get;
/**
 * Return an array of values for the given parameter name.
 *
 * If there is no such parameter, an empty array is returned.
 * @type {?}
 */
ParamMap.prototype.getAll;
/**
 * Name of the parameters
 * @type {?}
 */
ParamMap.prototype.keys;
class ParamsAsMap {
    /**
     * @param {?} params
     */
    constructor(params) { this.params = params || {}; }
    /**
     * @param {?} name
     * @return {?}
     */
    has(name) { return this.params.hasOwnProperty(name); }
    /**
     * @param {?} name
     * @return {?}
     */
    get(name) {
        if (this.has(name)) {
            /** @type {?} */
            const v = this.params[name];
            return Array.isArray(v) ? v[0] : v;
        }
        return null;
    }
    /**
     * @param {?} name
     * @return {?}
     */
    getAll(name) {
        if (this.has(name)) {
            /** @type {?} */
            const v = this.params[name];
            return Array.isArray(v) ? v : [v];
        }
        return [];
    }
    /**
     * @return {?}
     */
    get keys() { return Object.keys(this.params); }
}
if (false) {
    /** @type {?} */
    ParamsAsMap.prototype.params;
}
/**
 * Convert a `Params` instance to a `ParamMap`.
 *
 * \@publicApi
 * @param {?} params
 * @return {?}
 */
export function convertToParamMap(params) {
    return new ParamsAsMap(params);
}
/** @type {?} */
const NAVIGATION_CANCELING_ERROR = 'ngNavigationCancelingError';
/**
 * @param {?} message
 * @return {?}
 */
export function navigationCancelingError(message) {
    /** @type {?} */
    const error = Error('NavigationCancelingError: ' + message);
    (/** @type {?} */ (error))[NAVIGATION_CANCELING_ERROR] = true;
    return error;
}
/**
 * @param {?} error
 * @return {?}
 */
export function isNavigationCancelingError(error) {
    return error && (/** @type {?} */ (error))[NAVIGATION_CANCELING_ERROR];
}
/**
 * @param {?} segments
 * @param {?} segmentGroup
 * @param {?} route
 * @return {?}
 */
export function defaultUrlMatcher(segments, segmentGroup, route) {
    /** @type {?} */
    const parts = /** @type {?} */ ((route.path)).split('/');
    if (parts.length > segments.length) {
        // The actual URL is shorter than the config, no match
        return null;
    }
    if (route.pathMatch === 'full' &&
        (segmentGroup.hasChildren() || parts.length < segments.length)) {
        // The config is longer than the actual URL but we are looking for a full match, return null
        return null;
    }
    /** @type {?} */
    const posParams = {};
    // Check each config part against the actual URL
    for (let index = 0; index < parts.length; index++) {
        /** @type {?} */
        const part = parts[index];
        /** @type {?} */
        const segment = segments[index];
        /** @type {?} */
        const isParameter = part.startsWith(':');
        if (isParameter) {
            posParams[part.substring(1)] = segment;
        }
        else if (part !== segment.path) {
            // The actual URL part does not match the config, no match
            return null;
        }
    }
    return { consumed: segments.slice(0, parts.length), posParams };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcm91dGVyL3NyYy9zaGFyZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLGFBQWEsY0FBYyxHQUFHLFNBQVMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJDeEMsTUFBTSxXQUFXOzs7O0lBR2YsWUFBWSxNQUFjLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDLEVBQUU7Ozs7O0lBRTNELEdBQUcsQ0FBQyxJQUFZLElBQWEsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFOzs7OztJQUV2RSxHQUFHLENBQUMsSUFBWTtRQUNkLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTs7WUFDbEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BDO1FBRUQsT0FBTyxJQUFJLENBQUM7S0FDYjs7Ozs7SUFFRCxNQUFNLENBQUMsSUFBWTtRQUNqQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7O1lBQ2xCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkM7UUFFRCxPQUFPLEVBQUUsQ0FBQztLQUNYOzs7O0lBRUQsSUFBSSxJQUFJLEtBQWUsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO0NBQzFEOzs7Ozs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsTUFBYztJQUM5QyxPQUFPLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQ2hDOztBQUVELE1BQU0sMEJBQTBCLEdBQUcsNEJBQTRCLENBQUM7Ozs7O0FBRWhFLE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxPQUFlOztJQUN0RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsNEJBQTRCLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFDNUQsbUJBQUMsS0FBWSxFQUFDLENBQUMsMEJBQTBCLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEQsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7QUFFRCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsS0FBWTtJQUNyRCxPQUFPLEtBQUssSUFBSSxtQkFBQyxLQUFZLEVBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0NBQzVEOzs7Ozs7O0FBR0QsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixRQUFzQixFQUFFLFlBQTZCLEVBQUUsS0FBWTs7SUFDckUsTUFBTSxLQUFLLHNCQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUV0QyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRTs7UUFFbEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELElBQUksS0FBSyxDQUFDLFNBQVMsS0FBSyxNQUFNO1FBQzFCLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFOztRQUVsRSxPQUFPLElBQUksQ0FBQztLQUNiOztJQUVELE1BQU0sU0FBUyxHQUFnQyxFQUFFLENBQUM7O0lBR2xELEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFOztRQUNqRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBQzFCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7UUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QyxJQUFJLFdBQVcsRUFBRTtZQUNmLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO1NBQ3hDO2FBQU0sSUFBSSxJQUFJLEtBQUssT0FBTyxDQUFDLElBQUksRUFBRTs7WUFFaEMsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0lBRUQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFDLENBQUM7Q0FDL0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Um91dGUsIFVybE1hdGNoUmVzdWx0fSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1VybFNlZ21lbnQsIFVybFNlZ21lbnRHcm91cH0gZnJvbSAnLi91cmxfdHJlZSc7XG5cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBOYW1lIG9mIHRoZSBwcmltYXJ5IG91dGxldC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBQUklNQVJZX09VVExFVCA9ICdwcmltYXJ5JztcblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgcGFyYW1ldGVycy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIFBhcmFtcyA9IHtcbiAgW2tleTogc3RyaW5nXTogYW55XG59O1xuXG4vKipcbiAqIE1hdHJpeCBhbmQgUXVlcnkgcGFyYW1ldGVycy5cbiAqXG4gKiBgUGFyYW1NYXBgIG1ha2VzIGl0IGVhc2llciB0byB3b3JrIHdpdGggcGFyYW1ldGVycyBhcyB0aGV5IGNvdWxkIGhhdmUgZWl0aGVyIGEgc2luZ2xlIHZhbHVlIG9yXG4gKiBtdWx0aXBsZSB2YWx1ZS4gQmVjYXVzZSB0aGlzIHNob3VsZCBiZSBrbm93biBieSB0aGUgdXNlciwgY2FsbGluZyBgZ2V0YCBvciBgZ2V0QWxsYCByZXR1cm5zIHRoZVxuICogY29ycmVjdCB0eXBlIChlaXRoZXIgYHN0cmluZ2Agb3IgYHN0cmluZ1tdYCkuXG4gKlxuICogVGhlIEFQSSBpcyBpbnNwaXJlZCBieSB0aGUgVVJMU2VhcmNoUGFyYW1zIGludGVyZmFjZS5cbiAqIHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvVVJMU2VhcmNoUGFyYW1zXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBhcmFtTWFwIHtcbiAgaGFzKG5hbWU6IHN0cmluZyk6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBSZXR1cm4gYSBzaW5nbGUgdmFsdWUgZm9yIHRoZSBnaXZlbiBwYXJhbWV0ZXIgbmFtZTpcbiAgICogLSB0aGUgdmFsdWUgd2hlbiB0aGUgcGFyYW1ldGVyIGhhcyBhIHNpbmdsZSB2YWx1ZSxcbiAgICogLSB0aGUgZmlyc3QgdmFsdWUgaWYgdGhlIHBhcmFtZXRlciBoYXMgbXVsdGlwbGUgdmFsdWVzLFxuICAgKiAtIGBudWxsYCB3aGVuIHRoZXJlIGlzIG5vIHN1Y2ggcGFyYW1ldGVyLlxuICAgKi9cbiAgZ2V0KG5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsO1xuICAvKipcbiAgICogUmV0dXJuIGFuIGFycmF5IG9mIHZhbHVlcyBmb3IgdGhlIGdpdmVuIHBhcmFtZXRlciBuYW1lLlxuICAgKlxuICAgKiBJZiB0aGVyZSBpcyBubyBzdWNoIHBhcmFtZXRlciwgYW4gZW1wdHkgYXJyYXkgaXMgcmV0dXJuZWQuXG4gICAqL1xuICBnZXRBbGwobmFtZTogc3RyaW5nKTogc3RyaW5nW107XG5cbiAgLyoqIE5hbWUgb2YgdGhlIHBhcmFtZXRlcnMgKi9cbiAgcmVhZG9ubHkga2V5czogc3RyaW5nW107XG59XG5cbmNsYXNzIFBhcmFtc0FzTWFwIGltcGxlbWVudHMgUGFyYW1NYXAge1xuICBwcml2YXRlIHBhcmFtczogUGFyYW1zO1xuXG4gIGNvbnN0cnVjdG9yKHBhcmFtczogUGFyYW1zKSB7IHRoaXMucGFyYW1zID0gcGFyYW1zIHx8IHt9OyB9XG5cbiAgaGFzKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5wYXJhbXMuaGFzT3duUHJvcGVydHkobmFtZSk7IH1cblxuICBnZXQobmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIGlmICh0aGlzLmhhcyhuYW1lKSkge1xuICAgICAgY29uc3QgdiA9IHRoaXMucGFyYW1zW25hbWVdO1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodikgPyB2WzBdIDogdjtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldEFsbChuYW1lOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKHRoaXMuaGFzKG5hbWUpKSB7XG4gICAgICBjb25zdCB2ID0gdGhpcy5wYXJhbXNbbmFtZV07XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2KSA/IHYgOiBbdl07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgZ2V0IGtleXMoKTogc3RyaW5nW10geyByZXR1cm4gT2JqZWN0LmtleXModGhpcy5wYXJhbXMpOyB9XG59XG5cbi8qKlxuICogQ29udmVydCBhIGBQYXJhbXNgIGluc3RhbmNlIHRvIGEgYFBhcmFtTWFwYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9QYXJhbU1hcChwYXJhbXM6IFBhcmFtcyk6IFBhcmFtTWFwIHtcbiAgcmV0dXJuIG5ldyBQYXJhbXNBc01hcChwYXJhbXMpO1xufVxuXG5jb25zdCBOQVZJR0FUSU9OX0NBTkNFTElOR19FUlJPUiA9ICduZ05hdmlnYXRpb25DYW5jZWxpbmdFcnJvcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYXZpZ2F0aW9uQ2FuY2VsaW5nRXJyb3IobWVzc2FnZTogc3RyaW5nKSB7XG4gIGNvbnN0IGVycm9yID0gRXJyb3IoJ05hdmlnYXRpb25DYW5jZWxpbmdFcnJvcjogJyArIG1lc3NhZ2UpO1xuICAoZXJyb3IgYXMgYW55KVtOQVZJR0FUSU9OX0NBTkNFTElOR19FUlJPUl0gPSB0cnVlO1xuICByZXR1cm4gZXJyb3I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05hdmlnYXRpb25DYW5jZWxpbmdFcnJvcihlcnJvcjogRXJyb3IpIHtcbiAgcmV0dXJuIGVycm9yICYmIChlcnJvciBhcyBhbnkpW05BVklHQVRJT05fQ0FOQ0VMSU5HX0VSUk9SXTtcbn1cblxuLy8gTWF0Y2hlcyB0aGUgcm91dGUgY29uZmlndXJhdGlvbiAoYHJvdXRlYCkgYWdhaW5zdCB0aGUgYWN0dWFsIFVSTCAoYHNlZ21lbnRzYCkuXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFVybE1hdGNoZXIoXG4gICAgc2VnbWVudHM6IFVybFNlZ21lbnRbXSwgc2VnbWVudEdyb3VwOiBVcmxTZWdtZW50R3JvdXAsIHJvdXRlOiBSb3V0ZSk6IFVybE1hdGNoUmVzdWx0fG51bGwge1xuICBjb25zdCBwYXJ0cyA9IHJvdXRlLnBhdGggIS5zcGxpdCgnLycpO1xuXG4gIGlmIChwYXJ0cy5sZW5ndGggPiBzZWdtZW50cy5sZW5ndGgpIHtcbiAgICAvLyBUaGUgYWN0dWFsIFVSTCBpcyBzaG9ydGVyIHRoYW4gdGhlIGNvbmZpZywgbm8gbWF0Y2hcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChyb3V0ZS5wYXRoTWF0Y2ggPT09ICdmdWxsJyAmJlxuICAgICAgKHNlZ21lbnRHcm91cC5oYXNDaGlsZHJlbigpIHx8IHBhcnRzLmxlbmd0aCA8IHNlZ21lbnRzLmxlbmd0aCkpIHtcbiAgICAvLyBUaGUgY29uZmlnIGlzIGxvbmdlciB0aGFuIHRoZSBhY3R1YWwgVVJMIGJ1dCB3ZSBhcmUgbG9va2luZyBmb3IgYSBmdWxsIG1hdGNoLCByZXR1cm4gbnVsbFxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcG9zUGFyYW1zOiB7W2tleTogc3RyaW5nXTogVXJsU2VnbWVudH0gPSB7fTtcblxuICAvLyBDaGVjayBlYWNoIGNvbmZpZyBwYXJ0IGFnYWluc3QgdGhlIGFjdHVhbCBVUkxcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHBhcnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpbmRleF07XG4gICAgY29uc3Qgc2VnbWVudCA9IHNlZ21lbnRzW2luZGV4XTtcbiAgICBjb25zdCBpc1BhcmFtZXRlciA9IHBhcnQuc3RhcnRzV2l0aCgnOicpO1xuICAgIGlmIChpc1BhcmFtZXRlcikge1xuICAgICAgcG9zUGFyYW1zW3BhcnQuc3Vic3RyaW5nKDEpXSA9IHNlZ21lbnQ7XG4gICAgfSBlbHNlIGlmIChwYXJ0ICE9PSBzZWdtZW50LnBhdGgpIHtcbiAgICAgIC8vIFRoZSBhY3R1YWwgVVJMIHBhcnQgZG9lcyBub3QgbWF0Y2ggdGhlIGNvbmZpZywgbm8gbWF0Y2hcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7Y29uc3VtZWQ6IHNlZ21lbnRzLnNsaWNlKDAsIHBhcnRzLmxlbmd0aCksIHBvc1BhcmFtc307XG59XG4iXX0=