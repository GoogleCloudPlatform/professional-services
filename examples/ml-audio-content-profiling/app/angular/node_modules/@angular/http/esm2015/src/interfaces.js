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
 * Abstract class from which real backends are derived.
 *
 * The primary purpose of a `ConnectionBackend` is to create new connections to fulfill a given
 * {\@link Request}.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 * @abstract
 */
export class ConnectionBackend {
}
if (false) {
    /**
     * @abstract
     * @param {?} request
     * @return {?}
     */
    ConnectionBackend.prototype.createConnection = function (request) { };
}
/**
 * Abstract class from which real connections are derived.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 * @abstract
 */
export class Connection {
}
if (false) {
    /** @type {?} */
    Connection.prototype.readyState;
    /** @type {?} */
    Connection.prototype.request;
    /** @type {?} */
    Connection.prototype.response;
}
/**
 * An XSRFStrategy configures XSRF protection (e.g. via headers) on an HTTP request.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 * @abstract
 */
export class XSRFStrategy {
}
if (false) {
    /**
     * @abstract
     * @param {?} req
     * @return {?}
     */
    XSRFStrategy.prototype.configureRequest = function (req) { };
}
/**
 * Interface for options to construct a RequestOptions, based on
 * [RequestInit](https://fetch.spec.whatwg.org/#requestinit) from the Fetch spec.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 * @record
 */
export function RequestOptionsArgs() { }
/** @type {?|undefined} */
RequestOptionsArgs.prototype.url;
/** @type {?|undefined} */
RequestOptionsArgs.prototype.method;
/**
 * @deprecated from 4.0.0. Use params instead.
 * @type {?|undefined}
 */
RequestOptionsArgs.prototype.search;
/** @type {?|undefined} */
RequestOptionsArgs.prototype.params;
/** @type {?|undefined} */
RequestOptionsArgs.prototype.headers;
/** @type {?|undefined} */
RequestOptionsArgs.prototype.body;
/** @type {?|undefined} */
RequestOptionsArgs.prototype.withCredentials;
/** @type {?|undefined} */
RequestOptionsArgs.prototype.responseType;
/**
 * Required structure when constructing new Request();
 * @record
 */
export function RequestArgs() { }
/** @type {?} */
RequestArgs.prototype.url;
/**
 * Interface for options to construct a Response, based on
 * [ResponseInit](https://fetch.spec.whatwg.org/#responseinit) from the Fetch spec.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 * @record
 */
export function ResponseOptionsArgs() { }
/** @type {?|undefined} */
ResponseOptionsArgs.prototype.body;
/** @type {?|undefined} */
ResponseOptionsArgs.prototype.status;
/** @type {?|undefined} */
ResponseOptionsArgs.prototype.statusText;
/** @type {?|undefined} */
ResponseOptionsArgs.prototype.headers;
/** @type {?|undefined} */
ResponseOptionsArgs.prototype.type;
/** @type {?|undefined} */
ResponseOptionsArgs.prototype.url;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2ludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLE1BQU0sT0FBZ0IsaUJBQWlCO0NBQXlEOzs7Ozs7Ozs7Ozs7Ozs7O0FBUWhHLE1BQU0sT0FBZ0IsVUFBVTtDQU0vQjs7Ozs7Ozs7Ozs7Ozs7OztBQVFELE1BQU0sT0FBZ0IsWUFBWTtDQUFtRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZWFkeVN0YXRlLCBSZXF1ZXN0TWV0aG9kLCBSZXNwb25zZUNvbnRlbnRUeXBlLCBSZXNwb25zZVR5cGV9IGZyb20gJy4vZW51bXMnO1xuaW1wb3J0IHtIZWFkZXJzfSBmcm9tICcuL2hlYWRlcnMnO1xuaW1wb3J0IHtSZXF1ZXN0fSBmcm9tICcuL3N0YXRpY19yZXF1ZXN0JztcbmltcG9ydCB7VVJMU2VhcmNoUGFyYW1zfSBmcm9tICcuL3VybF9zZWFyY2hfcGFyYW1zJztcblxuLyoqXG4gKiBBYnN0cmFjdCBjbGFzcyBmcm9tIHdoaWNoIHJlYWwgYmFja2VuZHMgYXJlIGRlcml2ZWQuXG4gKlxuICogVGhlIHByaW1hcnkgcHVycG9zZSBvZiBhIGBDb25uZWN0aW9uQmFja2VuZGAgaXMgdG8gY3JlYXRlIG5ldyBjb25uZWN0aW9ucyB0byBmdWxmaWxsIGEgZ2l2ZW5cbiAqIHtAbGluayBSZXF1ZXN0fS5cbiAqXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbm5lY3Rpb25CYWNrZW5kIHsgYWJzdHJhY3QgY3JlYXRlQ29ubmVjdGlvbihyZXF1ZXN0OiBhbnkpOiBDb25uZWN0aW9uOyB9XG5cbi8qKlxuICogQWJzdHJhY3QgY2xhc3MgZnJvbSB3aGljaCByZWFsIGNvbm5lY3Rpb25zIGFyZSBkZXJpdmVkLlxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29ubmVjdGlvbiB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICByZWFkeVN0YXRlICE6IFJlYWR5U3RhdGU7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICByZXF1ZXN0ICE6IFJlcXVlc3Q7XG4gIHJlc3BvbnNlOiBhbnk7ICAvLyBUT0RPOiBnZW5lcmljIG9mIDxSZXNwb25zZT47XG59XG5cbi8qKlxuICogQW4gWFNSRlN0cmF0ZWd5IGNvbmZpZ3VyZXMgWFNSRiBwcm90ZWN0aW9uIChlLmcuIHZpYSBoZWFkZXJzKSBvbiBhbiBIVFRQIHJlcXVlc3QuXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBYU1JGU3RyYXRlZ3kgeyBhYnN0cmFjdCBjb25maWd1cmVSZXF1ZXN0KHJlcTogUmVxdWVzdCk6IHZvaWQ7IH1cblxuLyoqXG4gKiBJbnRlcmZhY2UgZm9yIG9wdGlvbnMgdG8gY29uc3RydWN0IGEgUmVxdWVzdE9wdGlvbnMsIGJhc2VkIG9uXG4gKiBbUmVxdWVzdEluaXRdKGh0dHBzOi8vZmV0Y2guc3BlYy53aGF0d2cub3JnLyNyZXF1ZXN0aW5pdCkgZnJvbSB0aGUgRmV0Y2ggc3BlYy5cbiAqXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0T3B0aW9uc0FyZ3Mge1xuICB1cmw/OiBzdHJpbmd8bnVsbDtcbiAgbWV0aG9kPzogc3RyaW5nfFJlcXVlc3RNZXRob2R8bnVsbDtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gNC4wLjAuIFVzZSBwYXJhbXMgaW5zdGVhZC4gKi9cbiAgc2VhcmNoPzogc3RyaW5nfFVSTFNlYXJjaFBhcmFtc3x7W2tleTogc3RyaW5nXTogYW55IHwgYW55W119fG51bGw7XG4gIHBhcmFtcz86IHN0cmluZ3xVUkxTZWFyY2hQYXJhbXN8e1trZXk6IHN0cmluZ106IGFueSB8IGFueVtdfXxudWxsO1xuICBoZWFkZXJzPzogSGVhZGVyc3xudWxsO1xuICBib2R5PzogYW55O1xuICB3aXRoQ3JlZGVudGlhbHM/OiBib29sZWFufG51bGw7XG4gIHJlc3BvbnNlVHlwZT86IFJlc3BvbnNlQ29udGVudFR5cGV8bnVsbDtcbn1cblxuLyoqXG4gKiBSZXF1aXJlZCBzdHJ1Y3R1cmUgd2hlbiBjb25zdHJ1Y3RpbmcgbmV3IFJlcXVlc3QoKTtcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0QXJncyBleHRlbmRzIFJlcXVlc3RPcHRpb25zQXJncyB7IHVybDogc3RyaW5nfG51bGw7IH1cblxuLyoqXG4gKiBJbnRlcmZhY2UgZm9yIG9wdGlvbnMgdG8gY29uc3RydWN0IGEgUmVzcG9uc2UsIGJhc2VkIG9uXG4gKiBbUmVzcG9uc2VJbml0XShodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jcmVzcG9uc2Vpbml0KSBmcm9tIHRoZSBGZXRjaCBzcGVjLlxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc3BvbnNlT3B0aW9uc0FyZ3Mge1xuICBib2R5Pzogc3RyaW5nfE9iamVjdHxGb3JtRGF0YXxBcnJheUJ1ZmZlcnxCbG9ifG51bGw7XG4gIHN0YXR1cz86IG51bWJlcnxudWxsO1xuICBzdGF0dXNUZXh0Pzogc3RyaW5nfG51bGw7XG4gIGhlYWRlcnM/OiBIZWFkZXJzfG51bGw7XG4gIHR5cGU/OiBSZXNwb25zZVR5cGV8bnVsbDtcbiAgdXJsPzogc3RyaW5nfG51bGw7XG59XG4iXX0=