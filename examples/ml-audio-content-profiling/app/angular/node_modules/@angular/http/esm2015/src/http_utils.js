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
import { RequestMethod } from './enums';
/**
 * @param {?} method
 * @return {?}
 */
export function normalizeMethodName(method) {
    if (typeof method !== 'string')
        return method;
    switch (method.toUpperCase()) {
        case 'GET':
            return RequestMethod.Get;
        case 'POST':
            return RequestMethod.Post;
        case 'PUT':
            return RequestMethod.Put;
        case 'DELETE':
            return RequestMethod.Delete;
        case 'OPTIONS':
            return RequestMethod.Options;
        case 'HEAD':
            return RequestMethod.Head;
        case 'PATCH':
            return RequestMethod.Patch;
    }
    throw new Error(`Invalid request method. The method "${method}" is not supported.`);
}
/** @type {?} */
export const isSuccess = (status) => (status >= 200 && status < 300);
/**
 * @param {?} xhr
 * @return {?}
 */
export function getResponseURL(xhr) {
    if ('responseURL' in xhr) {
        return xhr.responseURL;
    }
    if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
        return xhr.getResponseHeader('X-Request-URL');
    }
    return null;
}
/**
 * @param {?} input
 * @return {?}
 */
export function stringToArrayBuffer8(input) {
    /** @type {?} */
    const view = new Uint8Array(input.length);
    for (let i = 0, strLen = input.length; i < strLen; i++) {
        view[i] = input.charCodeAt(i);
    }
    return view.buffer;
}
/**
 * @param {?} input
 * @return {?}
 */
export function stringToArrayBuffer(input) {
    /** @type {?} */
    const view = new Uint16Array(input.length);
    for (let i = 0, strLen = input.length; i < strLen; i++) {
        view[i] = input.charCodeAt(i);
    }
    return view.buffer;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF91dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2h0dHBfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7OztBQUV0QyxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBOEI7SUFDaEUsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRO1FBQUUsT0FBTyxNQUFNLENBQUM7SUFFOUMsUUFBUSxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUU7UUFDNUIsS0FBSyxLQUFLO1lBQ1IsT0FBTyxhQUFhLENBQUMsR0FBRyxDQUFDO1FBQzNCLEtBQUssTUFBTTtZQUNULE9BQU8sYUFBYSxDQUFDLElBQUksQ0FBQztRQUM1QixLQUFLLEtBQUs7WUFDUixPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUM7UUFDM0IsS0FBSyxRQUFRO1lBQ1gsT0FBTyxhQUFhLENBQUMsTUFBTSxDQUFDO1FBQzlCLEtBQUssU0FBUztZQUNaLE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQztRQUMvQixLQUFLLE1BQU07WUFDVCxPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDNUIsS0FBSyxPQUFPO1lBQ1YsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDO0tBQzlCO0lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsTUFBTSxxQkFBcUIsQ0FBQyxDQUFDO0NBQ3JGOztBQUVELGFBQWEsU0FBUyxHQUFHLENBQUMsTUFBYyxFQUFXLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDOzs7OztBQUV0RixNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQVE7SUFDckMsSUFBSSxhQUFhLElBQUksR0FBRyxFQUFFO1FBQ3hCLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQztLQUN4QjtJQUNELElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEVBQUU7UUFDeEQsT0FBTyxHQUFHLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDL0M7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFhOztJQUNoRCxNQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0RCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMvQjtJQUNELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztDQUNwQjs7Ozs7QUFHRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBYTs7SUFDL0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7SUFDRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7Q0FDcEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVxdWVzdE1ldGhvZH0gZnJvbSAnLi9lbnVtcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVNZXRob2ROYW1lKG1ldGhvZDogc3RyaW5nIHwgUmVxdWVzdE1ldGhvZCk6IFJlcXVlc3RNZXRob2Qge1xuICBpZiAodHlwZW9mIG1ldGhvZCAhPT0gJ3N0cmluZycpIHJldHVybiBtZXRob2Q7XG5cbiAgc3dpdGNoIChtZXRob2QudG9VcHBlckNhc2UoKSkge1xuICAgIGNhc2UgJ0dFVCc6XG4gICAgICByZXR1cm4gUmVxdWVzdE1ldGhvZC5HZXQ7XG4gICAgY2FzZSAnUE9TVCc6XG4gICAgICByZXR1cm4gUmVxdWVzdE1ldGhvZC5Qb3N0O1xuICAgIGNhc2UgJ1BVVCc6XG4gICAgICByZXR1cm4gUmVxdWVzdE1ldGhvZC5QdXQ7XG4gICAgY2FzZSAnREVMRVRFJzpcbiAgICAgIHJldHVybiBSZXF1ZXN0TWV0aG9kLkRlbGV0ZTtcbiAgICBjYXNlICdPUFRJT05TJzpcbiAgICAgIHJldHVybiBSZXF1ZXN0TWV0aG9kLk9wdGlvbnM7XG4gICAgY2FzZSAnSEVBRCc6XG4gICAgICByZXR1cm4gUmVxdWVzdE1ldGhvZC5IZWFkO1xuICAgIGNhc2UgJ1BBVENIJzpcbiAgICAgIHJldHVybiBSZXF1ZXN0TWV0aG9kLlBhdGNoO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZXF1ZXN0IG1ldGhvZC4gVGhlIG1ldGhvZCBcIiR7bWV0aG9kfVwiIGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG59XG5cbmV4cG9ydCBjb25zdCBpc1N1Y2Nlc3MgPSAoc3RhdHVzOiBudW1iZXIpOiBib29sZWFuID0+IChzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXNwb25zZVVSTCh4aHI6IGFueSk6IHN0cmluZ3xudWxsIHtcbiAgaWYgKCdyZXNwb25zZVVSTCcgaW4geGhyKSB7XG4gICAgcmV0dXJuIHhoci5yZXNwb25zZVVSTDtcbiAgfVxuICBpZiAoL15YLVJlcXVlc3QtVVJMOi9tLnRlc3QoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSkge1xuICAgIHJldHVybiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtUmVxdWVzdC1VUkwnKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQXJyYXlCdWZmZXI4KGlucHV0OiBTdHJpbmcpOiBBcnJheUJ1ZmZlciB7XG4gIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShpbnB1dC5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMCwgc3RyTGVuID0gaW5wdXQubGVuZ3RoOyBpIDwgc3RyTGVuOyBpKyspIHtcbiAgICB2aWV3W2ldID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gdmlldy5idWZmZXI7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvQXJyYXlCdWZmZXIoaW5wdXQ6IFN0cmluZyk6IEFycmF5QnVmZmVyIHtcbiAgY29uc3QgdmlldyA9IG5ldyBVaW50MTZBcnJheShpbnB1dC5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMCwgc3RyTGVuID0gaW5wdXQubGVuZ3RoOyBpIDwgc3RyTGVuOyBpKyspIHtcbiAgICB2aWV3W2ldID0gaW5wdXQuY2hhckNvZGVBdChpKTtcbiAgfVxuICByZXR1cm4gdmlldy5idWZmZXI7XG59XG4iXX0=