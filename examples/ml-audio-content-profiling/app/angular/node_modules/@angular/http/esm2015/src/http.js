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
import { Injectable } from '@angular/core';
import { RequestOptions } from './base_request_options';
import { RequestMethod } from './enums';
import { ConnectionBackend } from './interfaces';
import { Request } from './static_request';
/**
 * @param {?} backend
 * @param {?} request
 * @return {?}
 */
function httpRequest(backend, request) {
    return backend.createConnection(request).response;
}
/**
 * @param {?} defaultOpts
 * @param {?} providedOpts
 * @param {?} method
 * @param {?} url
 * @return {?}
 */
function mergeOptions(defaultOpts, providedOpts, method, url) {
    /** @type {?} */
    const newOptions = defaultOpts;
    if (providedOpts) {
        // Hack so Dart can used named parameters
        return /** @type {?} */ (newOptions.merge(new RequestOptions({
            method: providedOpts.method || method,
            url: providedOpts.url || url,
            search: providedOpts.search,
            params: providedOpts.params,
            headers: providedOpts.headers,
            body: providedOpts.body,
            withCredentials: providedOpts.withCredentials,
            responseType: providedOpts.responseType
        })));
    }
    return /** @type {?} */ (newOptions.merge(new RequestOptions({ method, url })));
}
/**
 * Performs http requests using `XMLHttpRequest` as the default backend.
 *
 * `Http` is available as an injectable class, with methods to perform http requests. Calling
 * `request` returns an `Observable` which will emit a single {\@link Response} when a
 * response is received.
 *
 * \@usageNotes
 * ### Example
 *
 * ```typescript
 * import {Http, HTTP_PROVIDERS} from '\@angular/http';
 * import {map} from 'rxjs/operators';
 *
 * \@Component({
 *   selector: 'http-app',
 *   viewProviders: [HTTP_PROVIDERS],
 *   templateUrl: 'people.html'
 * })
 * class PeopleComponent {
 *   constructor(http: Http) {
 *     http.get('people.json')
 *       // Call map on the response observable to get the parsed people object
 *       .pipe(map(res => res.json()))
 *       // Subscribe to the observable to get the parsed people object and attach it to the
 *       // component
 *       .subscribe(people => this.people = people);
 *   }
 * }
 * ```
 *
 *
 * ### Example
 *
 * ```
 * http.get('people.json').subscribe((res:Response) => this.people = res.json());
 * ```
 *
 * The default construct used to perform requests, `XMLHttpRequest`, is abstracted as a "Backend" (
 * {\@link XHRBackend} in this case), which could be mocked with dependency injection by replacing
 * the {\@link XHRBackend} provider, as in the following example:
 *
 * ### Example
 *
 * ```typescript
 * import {BaseRequestOptions, Http} from '\@angular/http';
 * import {MockBackend} from '\@angular/http/testing';
 * var injector = Injector.resolveAndCreate([
 *   BaseRequestOptions,
 *   MockBackend,
 *   {provide: Http, useFactory:
 *       function(backend, defaultOptions) {
 *         return new Http(backend, defaultOptions);
 *       },
 *       deps: [MockBackend, BaseRequestOptions]}
 * ]);
 * var http = injector.get(Http);
 * http.get('request-from-mock-backend.json').subscribe((res:Response) => doSomething(res));
 * ```
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class Http {
    /**
     * @param {?} _backend
     * @param {?} _defaultOptions
     */
    constructor(_backend, _defaultOptions) {
        this._backend = _backend;
        this._defaultOptions = _defaultOptions;
    }
    /**
     * Performs any type of http request. First argument is required, and can either be a url or
     * a {\@link Request} instance. If the first argument is a url, an optional {\@link RequestOptions}
     * object can be provided as the 2nd argument. The options object will be merged with the values
     * of {\@link BaseRequestOptions} before performing the request.
     * @param {?} url
     * @param {?=} options
     * @return {?}
     */
    request(url, options) {
        /** @type {?} */
        let responseObservable;
        if (typeof url === 'string') {
            responseObservable = httpRequest(this._backend, new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, /** @type {?} */ (url))));
        }
        else if (url instanceof Request) {
            responseObservable = httpRequest(this._backend, url);
        }
        else {
            throw new Error('First argument must be a url string or Request instance.');
        }
        return responseObservable;
    }
    /**
     * Performs a request with `get` http method.
     * @param {?} url
     * @param {?=} options
     * @return {?}
     */
    get(url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, url)));
    }
    /**
     * Performs a request with `post` http method.
     * @param {?} url
     * @param {?} body
     * @param {?=} options
     * @return {?}
     */
    post(url, body, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions.merge(new RequestOptions({ body: body })), options, RequestMethod.Post, url)));
    }
    /**
     * Performs a request with `put` http method.
     * @param {?} url
     * @param {?} body
     * @param {?=} options
     * @return {?}
     */
    put(url, body, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions.merge(new RequestOptions({ body: body })), options, RequestMethod.Put, url)));
    }
    /**
     * Performs a request with `delete` http method.
     * @param {?} url
     * @param {?=} options
     * @return {?}
     */
    delete(url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Delete, url)));
    }
    /**
     * Performs a request with `patch` http method.
     * @param {?} url
     * @param {?} body
     * @param {?=} options
     * @return {?}
     */
    patch(url, body, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions.merge(new RequestOptions({ body: body })), options, RequestMethod.Patch, url)));
    }
    /**
     * Performs a request with `head` http method.
     * @param {?} url
     * @param {?=} options
     * @return {?}
     */
    head(url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Head, url)));
    }
    /**
     * Performs a request with `options` http method.
     * @param {?} url
     * @param {?=} options
     * @return {?}
     */
    options(url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Options, url)));
    }
}
Http.decorators = [
    { type: Injectable }
];
/** @nocollapse */
Http.ctorParameters = () => [
    { type: ConnectionBackend },
    { type: RequestOptions }
];
if (false) {
    /** @type {?} */
    Http.prototype._backend;
    /** @type {?} */
    Http.prototype._defaultOptions;
}
/**
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class Jsonp extends Http {
    /**
     * @param {?} backend
     * @param {?} defaultOptions
     */
    constructor(backend, defaultOptions) {
        super(backend, defaultOptions);
    }
    /**
     * Performs any type of http request. First argument is required, and can either be a url or
     * a {\@link Request} instance. If the first argument is a url, an optional {\@link RequestOptions}
     * object can be provided as the 2nd argument. The options object will be merged with the values
     * of {\@link BaseRequestOptions} before performing the request.
     *
     * \@security Regular XHR is the safest alternative to JSONP for most applications, and is
     * supported by all current browsers. Because JSONP creates a `<script>` element with
     * contents retrieved from a remote source, attacker-controlled data introduced by an untrusted
     * source could expose your application to XSS risks. Data exposed by JSONP may also be
     * readable by malicious third-party websites. In addition, JSONP introduces potential risk for
     * future security issues (e.g. content sniffing).  For more detail, see the
     * [Security Guide](http://g.co/ng/security).
     * @param {?} url
     * @param {?=} options
     * @return {?}
     */
    request(url, options) {
        /** @type {?} */
        let responseObservable;
        if (typeof url === 'string') {
            url =
                new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, /** @type {?} */ (url)));
        }
        if (url instanceof Request) {
            if (url.method !== RequestMethod.Get) {
                throw new Error('JSONP requests must use GET request method.');
            }
            responseObservable = httpRequest(this._backend, url);
        }
        else {
            throw new Error('First argument must be a url string or Request instance.');
        }
        return responseObservable;
    }
}
Jsonp.decorators = [
    { type: Injectable }
];
/** @nocollapse */
Jsonp.ctorParameters = () => [
    { type: ConnectionBackend },
    { type: RequestOptions }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2h0dHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBR3pDLE9BQU8sRUFBcUIsY0FBYyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN0QyxPQUFPLEVBQUMsaUJBQWlCLEVBQWtDLE1BQU0sY0FBYyxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQzs7Ozs7O0FBR3pDLFNBQVMsV0FBVyxDQUFDLE9BQTBCLEVBQUUsT0FBZ0I7SUFDL0QsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDO0NBQ25EOzs7Ozs7OztBQUVELFNBQVMsWUFBWSxDQUNqQixXQUErQixFQUFFLFlBQTRDLEVBQzdFLE1BQXFCLEVBQUUsR0FBVzs7SUFDcEMsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDO0lBQy9CLElBQUksWUFBWSxFQUFFOztRQUVoQix5QkFBTyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDO1lBQ3pDLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTSxJQUFJLE1BQU07WUFDckMsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHLElBQUksR0FBRztZQUM1QixNQUFNLEVBQUUsWUFBWSxDQUFDLE1BQU07WUFDM0IsTUFBTSxFQUFFLFlBQVksQ0FBQyxNQUFNO1lBQzNCLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTztZQUM3QixJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUk7WUFDdkIsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlO1lBQzdDLFlBQVksRUFBRSxZQUFZLENBQUMsWUFBWTtTQUN4QyxD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RCxrQkFBa0IsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN0RDthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFDO1NBQzdFO1FBQ0QsT0FBTyxrQkFBa0IsQ0FBQztLQUMzQjs7O1lBbkNGLFVBQVU7Ozs7WUFyTEgsaUJBQWlCO1lBRkcsY0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QmFzZVJlcXVlc3RPcHRpb25zLCBSZXF1ZXN0T3B0aW9uc30gZnJvbSAnLi9iYXNlX3JlcXVlc3Rfb3B0aW9ucyc7XG5pbXBvcnQge1JlcXVlc3RNZXRob2R9IGZyb20gJy4vZW51bXMnO1xuaW1wb3J0IHtDb25uZWN0aW9uQmFja2VuZCwgUmVxdWVzdEFyZ3MsIFJlcXVlc3RPcHRpb25zQXJnc30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7UmVxdWVzdH0gZnJvbSAnLi9zdGF0aWNfcmVxdWVzdCc7XG5pbXBvcnQge1Jlc3BvbnNlfSBmcm9tICcuL3N0YXRpY19yZXNwb25zZSc7XG5cbmZ1bmN0aW9uIGh0dHBSZXF1ZXN0KGJhY2tlbmQ6IENvbm5lY3Rpb25CYWNrZW5kLCByZXF1ZXN0OiBSZXF1ZXN0KTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICByZXR1cm4gYmFja2VuZC5jcmVhdGVDb25uZWN0aW9uKHJlcXVlc3QpLnJlc3BvbnNlO1xufVxuXG5mdW5jdGlvbiBtZXJnZU9wdGlvbnMoXG4gICAgZGVmYXVsdE9wdHM6IEJhc2VSZXF1ZXN0T3B0aW9ucywgcHJvdmlkZWRPcHRzOiBSZXF1ZXN0T3B0aW9uc0FyZ3MgfCB1bmRlZmluZWQsXG4gICAgbWV0aG9kOiBSZXF1ZXN0TWV0aG9kLCB1cmw6IHN0cmluZyk6IFJlcXVlc3RBcmdzIHtcbiAgY29uc3QgbmV3T3B0aW9ucyA9IGRlZmF1bHRPcHRzO1xuICBpZiAocHJvdmlkZWRPcHRzKSB7XG4gICAgLy8gSGFjayBzbyBEYXJ0IGNhbiB1c2VkIG5hbWVkIHBhcmFtZXRlcnNcbiAgICByZXR1cm4gbmV3T3B0aW9ucy5tZXJnZShuZXcgUmVxdWVzdE9wdGlvbnMoe1xuICAgICAgbWV0aG9kOiBwcm92aWRlZE9wdHMubWV0aG9kIHx8IG1ldGhvZCxcbiAgICAgIHVybDogcHJvdmlkZWRPcHRzLnVybCB8fCB1cmwsXG4gICAgICBzZWFyY2g6IHByb3ZpZGVkT3B0cy5zZWFyY2gsXG4gICAgICBwYXJhbXM6IHByb3ZpZGVkT3B0cy5wYXJhbXMsXG4gICAgICBoZWFkZXJzOiBwcm92aWRlZE9wdHMuaGVhZGVycyxcbiAgICAgIGJvZHk6IHByb3ZpZGVkT3B0cy5ib2R5LFxuICAgICAgd2l0aENyZWRlbnRpYWxzOiBwcm92aWRlZE9wdHMud2l0aENyZWRlbnRpYWxzLFxuICAgICAgcmVzcG9uc2VUeXBlOiBwcm92aWRlZE9wdHMucmVzcG9uc2VUeXBlXG4gICAgfSkpIGFzIFJlcXVlc3RBcmdzO1xuICB9XG5cbiAgcmV0dXJuIG5ld09wdGlvbnMubWVyZ2UobmV3IFJlcXVlc3RPcHRpb25zKHttZXRob2QsIHVybH0pKSBhcyBSZXF1ZXN0QXJncztcbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBodHRwIHJlcXVlc3RzIHVzaW5nIGBYTUxIdHRwUmVxdWVzdGAgYXMgdGhlIGRlZmF1bHQgYmFja2VuZC5cbiAqXG4gKiBgSHR0cGAgaXMgYXZhaWxhYmxlIGFzIGFuIGluamVjdGFibGUgY2xhc3MsIHdpdGggbWV0aG9kcyB0byBwZXJmb3JtIGh0dHAgcmVxdWVzdHMuIENhbGxpbmdcbiAqIGByZXF1ZXN0YCByZXR1cm5zIGFuIGBPYnNlcnZhYmxlYCB3aGljaCB3aWxsIGVtaXQgYSBzaW5nbGUge0BsaW5rIFJlc3BvbnNlfSB3aGVuIGFcbiAqIHJlc3BvbnNlIGlzIHJlY2VpdmVkLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7SHR0cCwgSFRUUF9QUk9WSURFUlN9IGZyb20gJ0Bhbmd1bGFyL2h0dHAnO1xuICogaW1wb3J0IHttYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdodHRwLWFwcCcsXG4gKiAgIHZpZXdQcm92aWRlcnM6IFtIVFRQX1BST1ZJREVSU10sXG4gKiAgIHRlbXBsYXRlVXJsOiAncGVvcGxlLmh0bWwnXG4gKiB9KVxuICogY2xhc3MgUGVvcGxlQ29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoaHR0cDogSHR0cCkge1xuICogICAgIGh0dHAuZ2V0KCdwZW9wbGUuanNvbicpXG4gKiAgICAgICAvLyBDYWxsIG1hcCBvbiB0aGUgcmVzcG9uc2Ugb2JzZXJ2YWJsZSB0byBnZXQgdGhlIHBhcnNlZCBwZW9wbGUgb2JqZWN0XG4gKiAgICAgICAucGlwZShtYXAocmVzID0+IHJlcy5qc29uKCkpKVxuICogICAgICAgLy8gU3Vic2NyaWJlIHRvIHRoZSBvYnNlcnZhYmxlIHRvIGdldCB0aGUgcGFyc2VkIHBlb3BsZSBvYmplY3QgYW5kIGF0dGFjaCBpdCB0byB0aGVcbiAqICAgICAgIC8vIGNvbXBvbmVudFxuICogICAgICAgLnN1YnNjcmliZShwZW9wbGUgPT4gdGhpcy5wZW9wbGUgPSBwZW9wbGUpO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIGh0dHAuZ2V0KCdwZW9wbGUuanNvbicpLnN1YnNjcmliZSgocmVzOlJlc3BvbnNlKSA9PiB0aGlzLnBlb3BsZSA9IHJlcy5qc29uKCkpO1xuICogYGBgXG4gKlxuICogVGhlIGRlZmF1bHQgY29uc3RydWN0IHVzZWQgdG8gcGVyZm9ybSByZXF1ZXN0cywgYFhNTEh0dHBSZXF1ZXN0YCwgaXMgYWJzdHJhY3RlZCBhcyBhIFwiQmFja2VuZFwiIChcbiAqIHtAbGluayBYSFJCYWNrZW5kfSBpbiB0aGlzIGNhc2UpLCB3aGljaCBjb3VsZCBiZSBtb2NrZWQgd2l0aCBkZXBlbmRlbmN5IGluamVjdGlvbiBieSByZXBsYWNpbmdcbiAqIHRoZSB7QGxpbmsgWEhSQmFja2VuZH0gcHJvdmlkZXIsIGFzIGluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZTpcbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7QmFzZVJlcXVlc3RPcHRpb25zLCBIdHRwfSBmcm9tICdAYW5ndWxhci9odHRwJztcbiAqIGltcG9ydCB7TW9ja0JhY2tlbmR9IGZyb20gJ0Bhbmd1bGFyL2h0dHAvdGVzdGluZyc7XG4gKiB2YXIgaW5qZWN0b3IgPSBJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtcbiAqICAgQmFzZVJlcXVlc3RPcHRpb25zLFxuICogICBNb2NrQmFja2VuZCxcbiAqICAge3Byb3ZpZGU6IEh0dHAsIHVzZUZhY3Rvcnk6XG4gKiAgICAgICBmdW5jdGlvbihiYWNrZW5kLCBkZWZhdWx0T3B0aW9ucykge1xuICogICAgICAgICByZXR1cm4gbmV3IEh0dHAoYmFja2VuZCwgZGVmYXVsdE9wdGlvbnMpO1xuICogICAgICAgfSxcbiAqICAgICAgIGRlcHM6IFtNb2NrQmFja2VuZCwgQmFzZVJlcXVlc3RPcHRpb25zXX1cbiAqIF0pO1xuICogdmFyIGh0dHAgPSBpbmplY3Rvci5nZXQoSHR0cCk7XG4gKiBodHRwLmdldCgncmVxdWVzdC1mcm9tLW1vY2stYmFja2VuZC5qc29uJykuc3Vic2NyaWJlKChyZXM6UmVzcG9uc2UpID0+IGRvU29tZXRoaW5nKHJlcykpO1xuICogYGBgXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBIdHRwIHtcbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIF9iYWNrZW5kOiBDb25uZWN0aW9uQmFja2VuZCwgcHJvdGVjdGVkIF9kZWZhdWx0T3B0aW9uczogUmVxdWVzdE9wdGlvbnMpIHt9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGFueSB0eXBlIG9mIGh0dHAgcmVxdWVzdC4gRmlyc3QgYXJndW1lbnQgaXMgcmVxdWlyZWQsIGFuZCBjYW4gZWl0aGVyIGJlIGEgdXJsIG9yXG4gICAqIGEge0BsaW5rIFJlcXVlc3R9IGluc3RhbmNlLiBJZiB0aGUgZmlyc3QgYXJndW1lbnQgaXMgYSB1cmwsIGFuIG9wdGlvbmFsIHtAbGluayBSZXF1ZXN0T3B0aW9uc31cbiAgICogb2JqZWN0IGNhbiBiZSBwcm92aWRlZCBhcyB0aGUgMm5kIGFyZ3VtZW50LiBUaGUgb3B0aW9ucyBvYmplY3Qgd2lsbCBiZSBtZXJnZWQgd2l0aCB0aGUgdmFsdWVzXG4gICAqIG9mIHtAbGluayBCYXNlUmVxdWVzdE9wdGlvbnN9IGJlZm9yZSBwZXJmb3JtaW5nIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgcmVxdWVzdCh1cmw6IHN0cmluZ3xSZXF1ZXN0LCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIGxldCByZXNwb25zZU9ic2VydmFibGU6IGFueTtcbiAgICBpZiAodHlwZW9mIHVybCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlc3BvbnNlT2JzZXJ2YWJsZSA9IGh0dHBSZXF1ZXN0KFxuICAgICAgICAgIHRoaXMuX2JhY2tlbmQsXG4gICAgICAgICAgbmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKHRoaXMuX2RlZmF1bHRPcHRpb25zLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLkdldCwgPHN0cmluZz51cmwpKSk7XG4gICAgfSBlbHNlIGlmICh1cmwgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICByZXNwb25zZU9ic2VydmFibGUgPSBodHRwUmVxdWVzdCh0aGlzLl9iYWNrZW5kLCB1cmwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG11c3QgYmUgYSB1cmwgc3RyaW5nIG9yIFJlcXVlc3QgaW5zdGFuY2UuJyk7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZU9ic2VydmFibGU7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSByZXF1ZXN0IHdpdGggYGdldGAgaHR0cCBtZXRob2QuXG4gICAqL1xuICBnZXQodXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9uc0FyZ3MpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChcbiAgICAgICAgbmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKHRoaXMuX2RlZmF1bHRPcHRpb25zLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLkdldCwgdXJsKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgcmVxdWVzdCB3aXRoIGBwb3N0YCBodHRwIG1ldGhvZC5cbiAgICovXG4gIHBvc3QodXJsOiBzdHJpbmcsIGJvZHk6IGFueSwgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zQXJncyk6IE9ic2VydmFibGU8UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KG5ldyBSZXF1ZXN0KG1lcmdlT3B0aW9ucyhcbiAgICAgICAgdGhpcy5fZGVmYXVsdE9wdGlvbnMubWVyZ2UobmV3IFJlcXVlc3RPcHRpb25zKHtib2R5OiBib2R5fSkpLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLlBvc3QsXG4gICAgICAgIHVybCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHJlcXVlc3Qgd2l0aCBgcHV0YCBodHRwIG1ldGhvZC5cbiAgICovXG4gIHB1dCh1cmw6IHN0cmluZywgYm9keTogYW55LCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QobmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKFxuICAgICAgICB0aGlzLl9kZWZhdWx0T3B0aW9ucy5tZXJnZShuZXcgUmVxdWVzdE9wdGlvbnMoe2JvZHk6IGJvZHl9KSksIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuUHV0LFxuICAgICAgICB1cmwpKSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSByZXF1ZXN0IHdpdGggYGRlbGV0ZWAgaHR0cCBtZXRob2QuXG4gICAqL1xuICBkZWxldGUgKHVybDogc3RyaW5nLCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoXG4gICAgICAgIG5ldyBSZXF1ZXN0KG1lcmdlT3B0aW9ucyh0aGlzLl9kZWZhdWx0T3B0aW9ucywgb3B0aW9ucywgUmVxdWVzdE1ldGhvZC5EZWxldGUsIHVybCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHJlcXVlc3Qgd2l0aCBgcGF0Y2hgIGh0dHAgbWV0aG9kLlxuICAgKi9cbiAgcGF0Y2godXJsOiBzdHJpbmcsIGJvZHk6IGFueSwgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zQXJncyk6IE9ic2VydmFibGU8UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KG5ldyBSZXF1ZXN0KG1lcmdlT3B0aW9ucyhcbiAgICAgICAgdGhpcy5fZGVmYXVsdE9wdGlvbnMubWVyZ2UobmV3IFJlcXVlc3RPcHRpb25zKHtib2R5OiBib2R5fSkpLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLlBhdGNoLFxuICAgICAgICB1cmwpKSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSByZXF1ZXN0IHdpdGggYGhlYWRgIGh0dHAgbWV0aG9kLlxuICAgKi9cbiAgaGVhZCh1cmw6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zQXJncyk6IE9ic2VydmFibGU8UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KFxuICAgICAgICBuZXcgUmVxdWVzdChtZXJnZU9wdGlvbnModGhpcy5fZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuSGVhZCwgdXJsKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgcmVxdWVzdCB3aXRoIGBvcHRpb25zYCBodHRwIG1ldGhvZC5cbiAgICovXG4gIG9wdGlvbnModXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9uc0FyZ3MpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChcbiAgICAgICAgbmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKHRoaXMuX2RlZmF1bHRPcHRpb25zLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLk9wdGlvbnMsIHVybCkpKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBKc29ucCBleHRlbmRzIEh0dHAge1xuICBjb25zdHJ1Y3RvcihiYWNrZW5kOiBDb25uZWN0aW9uQmFja2VuZCwgZGVmYXVsdE9wdGlvbnM6IFJlcXVlc3RPcHRpb25zKSB7XG4gICAgc3VwZXIoYmFja2VuZCwgZGVmYXVsdE9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGFueSB0eXBlIG9mIGh0dHAgcmVxdWVzdC4gRmlyc3QgYXJndW1lbnQgaXMgcmVxdWlyZWQsIGFuZCBjYW4gZWl0aGVyIGJlIGEgdXJsIG9yXG4gICAqIGEge0BsaW5rIFJlcXVlc3R9IGluc3RhbmNlLiBJZiB0aGUgZmlyc3QgYXJndW1lbnQgaXMgYSB1cmwsIGFuIG9wdGlvbmFsIHtAbGluayBSZXF1ZXN0T3B0aW9uc31cbiAgICogb2JqZWN0IGNhbiBiZSBwcm92aWRlZCBhcyB0aGUgMm5kIGFyZ3VtZW50LiBUaGUgb3B0aW9ucyBvYmplY3Qgd2lsbCBiZSBtZXJnZWQgd2l0aCB0aGUgdmFsdWVzXG4gICAqIG9mIHtAbGluayBCYXNlUmVxdWVzdE9wdGlvbnN9IGJlZm9yZSBwZXJmb3JtaW5nIHRoZSByZXF1ZXN0LlxuICAgKlxuICAgKiBAc2VjdXJpdHkgUmVndWxhciBYSFIgaXMgdGhlIHNhZmVzdCBhbHRlcm5hdGl2ZSB0byBKU09OUCBmb3IgbW9zdCBhcHBsaWNhdGlvbnMsIGFuZCBpc1xuICAgKiBzdXBwb3J0ZWQgYnkgYWxsIGN1cnJlbnQgYnJvd3NlcnMuIEJlY2F1c2UgSlNPTlAgY3JlYXRlcyBhIGA8c2NyaXB0PmAgZWxlbWVudCB3aXRoXG4gICAqIGNvbnRlbnRzIHJldHJpZXZlZCBmcm9tIGEgcmVtb3RlIHNvdXJjZSwgYXR0YWNrZXItY29udHJvbGxlZCBkYXRhIGludHJvZHVjZWQgYnkgYW4gdW50cnVzdGVkXG4gICAqIHNvdXJjZSBjb3VsZCBleHBvc2UgeW91ciBhcHBsaWNhdGlvbiB0byBYU1Mgcmlza3MuIERhdGEgZXhwb3NlZCBieSBKU09OUCBtYXkgYWxzbyBiZVxuICAgKiByZWFkYWJsZSBieSBtYWxpY2lvdXMgdGhpcmQtcGFydHkgd2Vic2l0ZXMuIEluIGFkZGl0aW9uLCBKU09OUCBpbnRyb2R1Y2VzIHBvdGVudGlhbCByaXNrIGZvclxuICAgKiBmdXR1cmUgc2VjdXJpdHkgaXNzdWVzIChlLmcuIGNvbnRlbnQgc25pZmZpbmcpLiAgRm9yIG1vcmUgZGV0YWlsLCBzZWUgdGhlXG4gICAqIFtTZWN1cml0eSBHdWlkZV0oaHR0cDovL2cuY28vbmcvc2VjdXJpdHkpLlxuICAgKi9cbiAgcmVxdWVzdCh1cmw6IHN0cmluZ3xSZXF1ZXN0LCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIGxldCByZXNwb25zZU9ic2VydmFibGU6IGFueTtcbiAgICBpZiAodHlwZW9mIHVybCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHVybCA9XG4gICAgICAgICAgbmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKHRoaXMuX2RlZmF1bHRPcHRpb25zLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLkdldCwgPHN0cmluZz51cmwpKTtcbiAgICB9XG4gICAgaWYgKHVybCBpbnN0YW5jZW9mIFJlcXVlc3QpIHtcbiAgICAgIGlmICh1cmwubWV0aG9kICE9PSBSZXF1ZXN0TWV0aG9kLkdldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0pTT05QIHJlcXVlc3RzIG11c3QgdXNlIEdFVCByZXF1ZXN0IG1ldGhvZC4nKTtcbiAgICAgIH1cbiAgICAgIHJlc3BvbnNlT2JzZXJ2YWJsZSA9IGh0dHBSZXF1ZXN0KHRoaXMuX2JhY2tlbmQsIHVybCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIHVybCBzdHJpbmcgb3IgUmVxdWVzdCBpbnN0YW5jZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3BvbnNlT2JzZXJ2YWJsZTtcbiAgfVxufVxuIl19