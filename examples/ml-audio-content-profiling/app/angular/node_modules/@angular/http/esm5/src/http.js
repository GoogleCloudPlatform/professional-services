/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injectable } from '@angular/core';
import { RequestOptions } from './base_request_options';
import { RequestMethod } from './enums';
import { ConnectionBackend } from './interfaces';
import { Request } from './static_request';
function httpRequest(backend, request) {
    return backend.createConnection(request).response;
}
function mergeOptions(defaultOpts, providedOpts, method, url) {
    var newOptions = defaultOpts;
    if (providedOpts) {
        // Hack so Dart can used named parameters
        return newOptions.merge(new RequestOptions({
            method: providedOpts.method || method,
            url: providedOpts.url || url,
            search: providedOpts.search,
            params: providedOpts.params,
            headers: providedOpts.headers,
            body: providedOpts.body,
            withCredentials: providedOpts.withCredentials,
            responseType: providedOpts.responseType
        }));
    }
    return newOptions.merge(new RequestOptions({ method: method, url: url }));
}
/**
 * Performs http requests using `XMLHttpRequest` as the default backend.
 *
 * `Http` is available as an injectable class, with methods to perform http requests. Calling
 * `request` returns an `Observable` which will emit a single {@link Response} when a
 * response is received.
 *
 * @usageNotes
 * ### Example
 *
 * ```typescript
 * import {Http, HTTP_PROVIDERS} from '@angular/http';
 * import {map} from 'rxjs/operators';
 *
 * @Component({
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
 * {@link XHRBackend} in this case), which could be mocked with dependency injection by replacing
 * the {@link XHRBackend} provider, as in the following example:
 *
 * ### Example
 *
 * ```typescript
 * import {BaseRequestOptions, Http} from '@angular/http';
 * import {MockBackend} from '@angular/http/testing';
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
 * @publicApi
 */
var Http = /** @class */ (function () {
    function Http(_backend, _defaultOptions) {
        this._backend = _backend;
        this._defaultOptions = _defaultOptions;
    }
    /**
     * Performs any type of http request. First argument is required, and can either be a url or
     * a {@link Request} instance. If the first argument is a url, an optional {@link RequestOptions}
     * object can be provided as the 2nd argument. The options object will be merged with the values
     * of {@link BaseRequestOptions} before performing the request.
     */
    Http.prototype.request = function (url, options) {
        var responseObservable;
        if (typeof url === 'string') {
            responseObservable = httpRequest(this._backend, new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, url)));
        }
        else if (url instanceof Request) {
            responseObservable = httpRequest(this._backend, url);
        }
        else {
            throw new Error('First argument must be a url string or Request instance.');
        }
        return responseObservable;
    };
    /**
     * Performs a request with `get` http method.
     */
    Http.prototype.get = function (url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, url)));
    };
    /**
     * Performs a request with `post` http method.
     */
    Http.prototype.post = function (url, body, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions.merge(new RequestOptions({ body: body })), options, RequestMethod.Post, url)));
    };
    /**
     * Performs a request with `put` http method.
     */
    Http.prototype.put = function (url, body, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions.merge(new RequestOptions({ body: body })), options, RequestMethod.Put, url)));
    };
    /**
     * Performs a request with `delete` http method.
     */
    Http.prototype.delete = function (url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Delete, url)));
    };
    /**
     * Performs a request with `patch` http method.
     */
    Http.prototype.patch = function (url, body, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions.merge(new RequestOptions({ body: body })), options, RequestMethod.Patch, url)));
    };
    /**
     * Performs a request with `head` http method.
     */
    Http.prototype.head = function (url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Head, url)));
    };
    /**
     * Performs a request with `options` http method.
     */
    Http.prototype.options = function (url, options) {
        return this.request(new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Options, url)));
    };
    Http = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [ConnectionBackend, RequestOptions])
    ], Http);
    return Http;
}());
export { Http };
/**
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var Jsonp = /** @class */ (function (_super) {
    tslib_1.__extends(Jsonp, _super);
    function Jsonp(backend, defaultOptions) {
        return _super.call(this, backend, defaultOptions) || this;
    }
    /**
     * Performs any type of http request. First argument is required, and can either be a url or
     * a {@link Request} instance. If the first argument is a url, an optional {@link RequestOptions}
     * object can be provided as the 2nd argument. The options object will be merged with the values
     * of {@link BaseRequestOptions} before performing the request.
     *
     * @security Regular XHR is the safest alternative to JSONP for most applications, and is
     * supported by all current browsers. Because JSONP creates a `<script>` element with
     * contents retrieved from a remote source, attacker-controlled data introduced by an untrusted
     * source could expose your application to XSS risks. Data exposed by JSONP may also be
     * readable by malicious third-party websites. In addition, JSONP introduces potential risk for
     * future security issues (e.g. content sniffing).  For more detail, see the
     * [Security Guide](http://g.co/ng/security).
     */
    Jsonp.prototype.request = function (url, options) {
        var responseObservable;
        if (typeof url === 'string') {
            url =
                new Request(mergeOptions(this._defaultOptions, options, RequestMethod.Get, url));
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
    };
    Jsonp = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [ConnectionBackend, RequestOptions])
    ], Jsonp);
    return Jsonp;
}(Http));
export { Jsonp };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2h0dHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHekMsT0FBTyxFQUFxQixjQUFjLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxpQkFBaUIsRUFBa0MsTUFBTSxjQUFjLENBQUM7QUFDaEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBR3pDLFNBQVMsV0FBVyxDQUFDLE9BQTBCLEVBQUUsT0FBZ0I7SUFDL0QsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ3BELENBQUM7QUFFRCxTQUFTLFlBQVksQ0FDakIsV0FBK0IsRUFBRSxZQUE0QyxFQUM3RSxNQUFxQixFQUFFLEdBQVc7SUFDcEMsSUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDO0lBQy9CLElBQUksWUFBWSxFQUFFO1FBQ2hCLHlDQUF5QztRQUN6QyxPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxjQUFjLENBQUM7WUFDekMsTUFBTSxFQUFFLFlBQVksQ0FBQyxNQUFNLElBQUksTUFBTTtZQUNyQyxHQUFHLEVBQUUsWUFBWSxDQUFDLEdBQUcsSUFBSSxHQUFHO1lBQzVCLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtZQUMzQixNQUFNLEVBQUUsWUFBWSxDQUFDLE1BQU07WUFDM0IsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPO1lBQzdCLElBQUksRUFBRSxZQUFZLENBQUMsSUFBSTtZQUN2QixlQUFlLEVBQUUsWUFBWSxDQUFDLGVBQWU7WUFDN0MsWUFBWSxFQUFFLFlBQVksQ0FBQyxZQUFZO1NBQ3hDLENBQUMsQ0FBZ0IsQ0FBQztLQUNwQjtJQUVELE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxFQUFDLE1BQU0sUUFBQSxFQUFFLEdBQUcsS0FBQSxFQUFDLENBQUMsQ0FBZ0IsQ0FBQztBQUM1RSxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBOERHO0FBRUg7SUFDRSxjQUFzQixRQUEyQixFQUFZLGVBQStCO1FBQXRFLGFBQVEsR0FBUixRQUFRLENBQW1CO1FBQVksb0JBQWUsR0FBZixlQUFlLENBQWdCO0lBQUcsQ0FBQztJQUVoRzs7Ozs7T0FLRztJQUNILHNCQUFPLEdBQVAsVUFBUSxHQUFtQixFQUFFLE9BQTRCO1FBQ3ZELElBQUksa0JBQXVCLENBQUM7UUFDNUIsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7WUFDM0Isa0JBQWtCLEdBQUcsV0FBVyxDQUM1QixJQUFJLENBQUMsUUFBUSxFQUNiLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsR0FBRyxFQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvRjthQUFNLElBQUksR0FBRyxZQUFZLE9BQU8sRUFBRTtZQUNqQyxrQkFBa0IsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN0RDthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFDO1NBQzdFO1FBQ0QsT0FBTyxrQkFBa0IsQ0FBQztJQUM1QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxrQkFBRyxHQUFILFVBQUksR0FBVyxFQUFFLE9BQTRCO1FBQzNDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FDZixJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVEOztPQUVHO0lBQ0gsbUJBQUksR0FBSixVQUFLLEdBQVcsRUFBRSxJQUFTLEVBQUUsT0FBNEI7UUFDdkQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLFlBQVksQ0FDeEMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxjQUFjLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxFQUN6RixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDYixDQUFDO0lBRUQ7O09BRUc7SUFDSCxrQkFBRyxHQUFILFVBQUksR0FBVyxFQUFFLElBQVMsRUFBRSxPQUE0QjtRQUN0RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxHQUFHLEVBQ3hGLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRDs7T0FFRztJQUNILHFCQUFNLEdBQU4sVUFBUSxHQUFXLEVBQUUsT0FBNEI7UUFDL0MsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUNmLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRixDQUFDO0lBRUQ7O09BRUc7SUFDSCxvQkFBSyxHQUFMLFVBQU0sR0FBVyxFQUFFLElBQVMsRUFBRSxPQUE0QjtRQUN4RCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUN4QyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxLQUFLLEVBQzFGLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRDs7T0FFRztJQUNILG1CQUFJLEdBQUosVUFBSyxHQUFXLEVBQUUsT0FBNEI7UUFDNUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUNmLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RixDQUFDO0lBRUQ7O09BRUc7SUFDSCxzQkFBTyxHQUFQLFVBQVEsR0FBVyxFQUFFLE9BQTRCO1FBQy9DLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FDZixJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQWhGVSxJQUFJO1FBRGhCLFVBQVUsRUFBRTtpREFFcUIsaUJBQWlCLEVBQTZCLGNBQWM7T0FEakYsSUFBSSxDQWlGaEI7SUFBRCxXQUFDO0NBQUEsQUFqRkQsSUFpRkM7U0FqRlksSUFBSTtBQW9GakI7OztHQUdHO0FBRUg7SUFBMkIsaUNBQUk7SUFDN0IsZUFBWSxPQUEwQixFQUFFLGNBQThCO2VBQ3BFLGtCQUFNLE9BQU8sRUFBRSxjQUFjLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSCx1QkFBTyxHQUFQLFVBQVEsR0FBbUIsRUFBRSxPQUE0QjtRQUN2RCxJQUFJLGtCQUF1QixDQUFDO1FBQzVCLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQzNCLEdBQUc7Z0JBQ0MsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxHQUFHLEVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM5RjtRQUNELElBQUksR0FBRyxZQUFZLE9BQU8sRUFBRTtZQUMxQixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssYUFBYSxDQUFDLEdBQUcsRUFBRTtnQkFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO2FBQ2hFO1lBQ0Qsa0JBQWtCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDdEQ7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsMERBQTBELENBQUMsQ0FBQztTQUM3RTtRQUNELE9BQU8sa0JBQWtCLENBQUM7SUFDNUIsQ0FBQztJQWxDVSxLQUFLO1FBRGpCLFVBQVUsRUFBRTtpREFFVSxpQkFBaUIsRUFBa0IsY0FBYztPQUQzRCxLQUFLLENBbUNqQjtJQUFELFlBQUM7Q0FBQSxBQW5DRCxDQUEyQixJQUFJLEdBbUM5QjtTQW5DWSxLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtCYXNlUmVxdWVzdE9wdGlvbnMsIFJlcXVlc3RPcHRpb25zfSBmcm9tICcuL2Jhc2VfcmVxdWVzdF9vcHRpb25zJztcbmltcG9ydCB7UmVxdWVzdE1ldGhvZH0gZnJvbSAnLi9lbnVtcyc7XG5pbXBvcnQge0Nvbm5lY3Rpb25CYWNrZW5kLCBSZXF1ZXN0QXJncywgUmVxdWVzdE9wdGlvbnNBcmdzfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtSZXF1ZXN0fSBmcm9tICcuL3N0YXRpY19yZXF1ZXN0JztcbmltcG9ydCB7UmVzcG9uc2V9IGZyb20gJy4vc3RhdGljX3Jlc3BvbnNlJztcblxuZnVuY3Rpb24gaHR0cFJlcXVlc3QoYmFja2VuZDogQ29ubmVjdGlvbkJhY2tlbmQsIHJlcXVlc3Q6IFJlcXVlc3QpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gIHJldHVybiBiYWNrZW5kLmNyZWF0ZUNvbm5lY3Rpb24ocmVxdWVzdCkucmVzcG9uc2U7XG59XG5cbmZ1bmN0aW9uIG1lcmdlT3B0aW9ucyhcbiAgICBkZWZhdWx0T3B0czogQmFzZVJlcXVlc3RPcHRpb25zLCBwcm92aWRlZE9wdHM6IFJlcXVlc3RPcHRpb25zQXJncyB8IHVuZGVmaW5lZCxcbiAgICBtZXRob2Q6IFJlcXVlc3RNZXRob2QsIHVybDogc3RyaW5nKTogUmVxdWVzdEFyZ3Mge1xuICBjb25zdCBuZXdPcHRpb25zID0gZGVmYXVsdE9wdHM7XG4gIGlmIChwcm92aWRlZE9wdHMpIHtcbiAgICAvLyBIYWNrIHNvIERhcnQgY2FuIHVzZWQgbmFtZWQgcGFyYW1ldGVyc1xuICAgIHJldHVybiBuZXdPcHRpb25zLm1lcmdlKG5ldyBSZXF1ZXN0T3B0aW9ucyh7XG4gICAgICBtZXRob2Q6IHByb3ZpZGVkT3B0cy5tZXRob2QgfHwgbWV0aG9kLFxuICAgICAgdXJsOiBwcm92aWRlZE9wdHMudXJsIHx8IHVybCxcbiAgICAgIHNlYXJjaDogcHJvdmlkZWRPcHRzLnNlYXJjaCxcbiAgICAgIHBhcmFtczogcHJvdmlkZWRPcHRzLnBhcmFtcyxcbiAgICAgIGhlYWRlcnM6IHByb3ZpZGVkT3B0cy5oZWFkZXJzLFxuICAgICAgYm9keTogcHJvdmlkZWRPcHRzLmJvZHksXG4gICAgICB3aXRoQ3JlZGVudGlhbHM6IHByb3ZpZGVkT3B0cy53aXRoQ3JlZGVudGlhbHMsXG4gICAgICByZXNwb25zZVR5cGU6IHByb3ZpZGVkT3B0cy5yZXNwb25zZVR5cGVcbiAgICB9KSkgYXMgUmVxdWVzdEFyZ3M7XG4gIH1cblxuICByZXR1cm4gbmV3T3B0aW9ucy5tZXJnZShuZXcgUmVxdWVzdE9wdGlvbnMoe21ldGhvZCwgdXJsfSkpIGFzIFJlcXVlc3RBcmdzO1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIGh0dHAgcmVxdWVzdHMgdXNpbmcgYFhNTEh0dHBSZXF1ZXN0YCBhcyB0aGUgZGVmYXVsdCBiYWNrZW5kLlxuICpcbiAqIGBIdHRwYCBpcyBhdmFpbGFibGUgYXMgYW4gaW5qZWN0YWJsZSBjbGFzcywgd2l0aCBtZXRob2RzIHRvIHBlcmZvcm0gaHR0cCByZXF1ZXN0cy4gQ2FsbGluZ1xuICogYHJlcXVlc3RgIHJldHVybnMgYW4gYE9ic2VydmFibGVgIHdoaWNoIHdpbGwgZW1pdCBhIHNpbmdsZSB7QGxpbmsgUmVzcG9uc2V9IHdoZW4gYVxuICogcmVzcG9uc2UgaXMgcmVjZWl2ZWQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHtIdHRwLCBIVFRQX1BST1ZJREVSU30gZnJvbSAnQGFuZ3VsYXIvaHR0cCc7XG4gKiBpbXBvcnQge21hcH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ2h0dHAtYXBwJyxcbiAqICAgdmlld1Byb3ZpZGVyczogW0hUVFBfUFJPVklERVJTXSxcbiAqICAgdGVtcGxhdGVVcmw6ICdwZW9wbGUuaHRtbCdcbiAqIH0pXG4gKiBjbGFzcyBQZW9wbGVDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihodHRwOiBIdHRwKSB7XG4gKiAgICAgaHR0cC5nZXQoJ3Blb3BsZS5qc29uJylcbiAqICAgICAgIC8vIENhbGwgbWFwIG9uIHRoZSByZXNwb25zZSBvYnNlcnZhYmxlIHRvIGdldCB0aGUgcGFyc2VkIHBlb3BsZSBvYmplY3RcbiAqICAgICAgIC5waXBlKG1hcChyZXMgPT4gcmVzLmpzb24oKSkpXG4gKiAgICAgICAvLyBTdWJzY3JpYmUgdG8gdGhlIG9ic2VydmFibGUgdG8gZ2V0IHRoZSBwYXJzZWQgcGVvcGxlIG9iamVjdCBhbmQgYXR0YWNoIGl0IHRvIHRoZVxuICogICAgICAgLy8gY29tcG9uZW50XG4gKiAgICAgICAuc3Vic2NyaWJlKHBlb3BsZSA9PiB0aGlzLnBlb3BsZSA9IHBlb3BsZSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogaHR0cC5nZXQoJ3Blb3BsZS5qc29uJykuc3Vic2NyaWJlKChyZXM6UmVzcG9uc2UpID0+IHRoaXMucGVvcGxlID0gcmVzLmpzb24oKSk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgZGVmYXVsdCBjb25zdHJ1Y3QgdXNlZCB0byBwZXJmb3JtIHJlcXVlc3RzLCBgWE1MSHR0cFJlcXVlc3RgLCBpcyBhYnN0cmFjdGVkIGFzIGEgXCJCYWNrZW5kXCIgKFxuICoge0BsaW5rIFhIUkJhY2tlbmR9IGluIHRoaXMgY2FzZSksIHdoaWNoIGNvdWxkIGJlIG1vY2tlZCB3aXRoIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGJ5IHJlcGxhY2luZ1xuICogdGhlIHtAbGluayBYSFJCYWNrZW5kfSBwcm92aWRlciwgYXMgaW4gdGhlIGZvbGxvd2luZyBleGFtcGxlOlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHtCYXNlUmVxdWVzdE9wdGlvbnMsIEh0dHB9IGZyb20gJ0Bhbmd1bGFyL2h0dHAnO1xuICogaW1wb3J0IHtNb2NrQmFja2VuZH0gZnJvbSAnQGFuZ3VsYXIvaHR0cC90ZXN0aW5nJztcbiAqIHZhciBpbmplY3RvciA9IEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW1xuICogICBCYXNlUmVxdWVzdE9wdGlvbnMsXG4gKiAgIE1vY2tCYWNrZW5kLFxuICogICB7cHJvdmlkZTogSHR0cCwgdXNlRmFjdG9yeTpcbiAqICAgICAgIGZ1bmN0aW9uKGJhY2tlbmQsIGRlZmF1bHRPcHRpb25zKSB7XG4gKiAgICAgICAgIHJldHVybiBuZXcgSHR0cChiYWNrZW5kLCBkZWZhdWx0T3B0aW9ucyk7XG4gKiAgICAgICB9LFxuICogICAgICAgZGVwczogW01vY2tCYWNrZW5kLCBCYXNlUmVxdWVzdE9wdGlvbnNdfVxuICogXSk7XG4gKiB2YXIgaHR0cCA9IGluamVjdG9yLmdldChIdHRwKTtcbiAqIGh0dHAuZ2V0KCdyZXF1ZXN0LWZyb20tbW9jay1iYWNrZW5kLmpzb24nKS5zdWJzY3JpYmUoKHJlczpSZXNwb25zZSkgPT4gZG9Tb21ldGhpbmcocmVzKSk7XG4gKiBgYGBcbiAqXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEh0dHAge1xuICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgX2JhY2tlbmQ6IENvbm5lY3Rpb25CYWNrZW5kLCBwcm90ZWN0ZWQgX2RlZmF1bHRPcHRpb25zOiBSZXF1ZXN0T3B0aW9ucykge31cblxuICAvKipcbiAgICogUGVyZm9ybXMgYW55IHR5cGUgb2YgaHR0cCByZXF1ZXN0LiBGaXJzdCBhcmd1bWVudCBpcyByZXF1aXJlZCwgYW5kIGNhbiBlaXRoZXIgYmUgYSB1cmwgb3JcbiAgICogYSB7QGxpbmsgUmVxdWVzdH0gaW5zdGFuY2UuIElmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBhIHVybCwgYW4gb3B0aW9uYWwge0BsaW5rIFJlcXVlc3RPcHRpb25zfVxuICAgKiBvYmplY3QgY2FuIGJlIHByb3ZpZGVkIGFzIHRoZSAybmQgYXJndW1lbnQuIFRoZSBvcHRpb25zIG9iamVjdCB3aWxsIGJlIG1lcmdlZCB3aXRoIHRoZSB2YWx1ZXNcbiAgICogb2Yge0BsaW5rIEJhc2VSZXF1ZXN0T3B0aW9uc30gYmVmb3JlIHBlcmZvcm1pbmcgdGhlIHJlcXVlc3QuXG4gICAqL1xuICByZXF1ZXN0KHVybDogc3RyaW5nfFJlcXVlc3QsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9uc0FyZ3MpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gICAgbGV0IHJlc3BvbnNlT2JzZXJ2YWJsZTogYW55O1xuICAgIGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJykge1xuICAgICAgcmVzcG9uc2VPYnNlcnZhYmxlID0gaHR0cFJlcXVlc3QoXG4gICAgICAgICAgdGhpcy5fYmFja2VuZCxcbiAgICAgICAgICBuZXcgUmVxdWVzdChtZXJnZU9wdGlvbnModGhpcy5fZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuR2V0LCA8c3RyaW5nPnVybCkpKTtcbiAgICB9IGVsc2UgaWYgKHVybCBpbnN0YW5jZW9mIFJlcXVlc3QpIHtcbiAgICAgIHJlc3BvbnNlT2JzZXJ2YWJsZSA9IGh0dHBSZXF1ZXN0KHRoaXMuX2JhY2tlbmQsIHVybCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbXVzdCBiZSBhIHVybCBzdHJpbmcgb3IgUmVxdWVzdCBpbnN0YW5jZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3BvbnNlT2JzZXJ2YWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHJlcXVlc3Qgd2l0aCBgZ2V0YCBodHRwIG1ldGhvZC5cbiAgICovXG4gIGdldCh1cmw6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zQXJncyk6IE9ic2VydmFibGU8UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KFxuICAgICAgICBuZXcgUmVxdWVzdChtZXJnZU9wdGlvbnModGhpcy5fZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuR2V0LCB1cmwpKSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSByZXF1ZXN0IHdpdGggYHBvc3RgIGh0dHAgbWV0aG9kLlxuICAgKi9cbiAgcG9zdCh1cmw6IHN0cmluZywgYm9keTogYW55LCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QobmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKFxuICAgICAgICB0aGlzLl9kZWZhdWx0T3B0aW9ucy5tZXJnZShuZXcgUmVxdWVzdE9wdGlvbnMoe2JvZHk6IGJvZHl9KSksIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuUG9zdCxcbiAgICAgICAgdXJsKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgcmVxdWVzdCB3aXRoIGBwdXRgIGh0dHAgbWV0aG9kLlxuICAgKi9cbiAgcHV0KHVybDogc3RyaW5nLCBib2R5OiBhbnksIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9uc0FyZ3MpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChuZXcgUmVxdWVzdChtZXJnZU9wdGlvbnMoXG4gICAgICAgIHRoaXMuX2RlZmF1bHRPcHRpb25zLm1lcmdlKG5ldyBSZXF1ZXN0T3B0aW9ucyh7Ym9keTogYm9keX0pKSwgb3B0aW9ucywgUmVxdWVzdE1ldGhvZC5QdXQsXG4gICAgICAgIHVybCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHJlcXVlc3Qgd2l0aCBgZGVsZXRlYCBodHRwIG1ldGhvZC5cbiAgICovXG4gIGRlbGV0ZSAodXJsOiBzdHJpbmcsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9uc0FyZ3MpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdChcbiAgICAgICAgbmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKHRoaXMuX2RlZmF1bHRPcHRpb25zLCBvcHRpb25zLCBSZXF1ZXN0TWV0aG9kLkRlbGV0ZSwgdXJsKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGEgcmVxdWVzdCB3aXRoIGBwYXRjaGAgaHR0cCBtZXRob2QuXG4gICAqL1xuICBwYXRjaCh1cmw6IHN0cmluZywgYm9keTogYW55LCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QobmV3IFJlcXVlc3QobWVyZ2VPcHRpb25zKFxuICAgICAgICB0aGlzLl9kZWZhdWx0T3B0aW9ucy5tZXJnZShuZXcgUmVxdWVzdE9wdGlvbnMoe2JvZHk6IGJvZHl9KSksIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuUGF0Y2gsXG4gICAgICAgIHVybCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHJlcXVlc3Qgd2l0aCBgaGVhZGAgaHR0cCBtZXRob2QuXG4gICAqL1xuICBoZWFkKHVybDogc3RyaW5nLCBvcHRpb25zPzogUmVxdWVzdE9wdGlvbnNBcmdzKTogT2JzZXJ2YWJsZTxSZXNwb25zZT4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3QoXG4gICAgICAgIG5ldyBSZXF1ZXN0KG1lcmdlT3B0aW9ucyh0aGlzLl9kZWZhdWx0T3B0aW9ucywgb3B0aW9ucywgUmVxdWVzdE1ldGhvZC5IZWFkLCB1cmwpKSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYSByZXF1ZXN0IHdpdGggYG9wdGlvbnNgIGh0dHAgbWV0aG9kLlxuICAgKi9cbiAgb3B0aW9ucyh1cmw6IHN0cmluZywgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zQXJncyk6IE9ic2VydmFibGU8UmVzcG9uc2U+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KFxuICAgICAgICBuZXcgUmVxdWVzdChtZXJnZU9wdGlvbnModGhpcy5fZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuT3B0aW9ucywgdXJsKSkpO1xuICB9XG59XG5cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEpzb25wIGV4dGVuZHMgSHR0cCB7XG4gIGNvbnN0cnVjdG9yKGJhY2tlbmQ6IENvbm5lY3Rpb25CYWNrZW5kLCBkZWZhdWx0T3B0aW9uczogUmVxdWVzdE9wdGlvbnMpIHtcbiAgICBzdXBlcihiYWNrZW5kLCBkZWZhdWx0T3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgYW55IHR5cGUgb2YgaHR0cCByZXF1ZXN0LiBGaXJzdCBhcmd1bWVudCBpcyByZXF1aXJlZCwgYW5kIGNhbiBlaXRoZXIgYmUgYSB1cmwgb3JcbiAgICogYSB7QGxpbmsgUmVxdWVzdH0gaW5zdGFuY2UuIElmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBhIHVybCwgYW4gb3B0aW9uYWwge0BsaW5rIFJlcXVlc3RPcHRpb25zfVxuICAgKiBvYmplY3QgY2FuIGJlIHByb3ZpZGVkIGFzIHRoZSAybmQgYXJndW1lbnQuIFRoZSBvcHRpb25zIG9iamVjdCB3aWxsIGJlIG1lcmdlZCB3aXRoIHRoZSB2YWx1ZXNcbiAgICogb2Yge0BsaW5rIEJhc2VSZXF1ZXN0T3B0aW9uc30gYmVmb3JlIHBlcmZvcm1pbmcgdGhlIHJlcXVlc3QuXG4gICAqXG4gICAqIEBzZWN1cml0eSBSZWd1bGFyIFhIUiBpcyB0aGUgc2FmZXN0IGFsdGVybmF0aXZlIHRvIEpTT05QIGZvciBtb3N0IGFwcGxpY2F0aW9ucywgYW5kIGlzXG4gICAqIHN1cHBvcnRlZCBieSBhbGwgY3VycmVudCBicm93c2Vycy4gQmVjYXVzZSBKU09OUCBjcmVhdGVzIGEgYDxzY3JpcHQ+YCBlbGVtZW50IHdpdGhcbiAgICogY29udGVudHMgcmV0cmlldmVkIGZyb20gYSByZW1vdGUgc291cmNlLCBhdHRhY2tlci1jb250cm9sbGVkIGRhdGEgaW50cm9kdWNlZCBieSBhbiB1bnRydXN0ZWRcbiAgICogc291cmNlIGNvdWxkIGV4cG9zZSB5b3VyIGFwcGxpY2F0aW9uIHRvIFhTUyByaXNrcy4gRGF0YSBleHBvc2VkIGJ5IEpTT05QIG1heSBhbHNvIGJlXG4gICAqIHJlYWRhYmxlIGJ5IG1hbGljaW91cyB0aGlyZC1wYXJ0eSB3ZWJzaXRlcy4gSW4gYWRkaXRpb24sIEpTT05QIGludHJvZHVjZXMgcG90ZW50aWFsIHJpc2sgZm9yXG4gICAqIGZ1dHVyZSBzZWN1cml0eSBpc3N1ZXMgKGUuZy4gY29udGVudCBzbmlmZmluZykuICBGb3IgbW9yZSBkZXRhaWwsIHNlZSB0aGVcbiAgICogW1NlY3VyaXR5IEd1aWRlXShodHRwOi8vZy5jby9uZy9zZWN1cml0eSkuXG4gICAqL1xuICByZXF1ZXN0KHVybDogc3RyaW5nfFJlcXVlc3QsIG9wdGlvbnM/OiBSZXF1ZXN0T3B0aW9uc0FyZ3MpOiBPYnNlcnZhYmxlPFJlc3BvbnNlPiB7XG4gICAgbGV0IHJlc3BvbnNlT2JzZXJ2YWJsZTogYW55O1xuICAgIGlmICh0eXBlb2YgdXJsID09PSAnc3RyaW5nJykge1xuICAgICAgdXJsID1cbiAgICAgICAgICBuZXcgUmVxdWVzdChtZXJnZU9wdGlvbnModGhpcy5fZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMsIFJlcXVlc3RNZXRob2QuR2V0LCA8c3RyaW5nPnVybCkpO1xuICAgIH1cbiAgICBpZiAodXJsIGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgaWYgKHVybC5tZXRob2QgIT09IFJlcXVlc3RNZXRob2QuR2V0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSlNPTlAgcmVxdWVzdHMgbXVzdCB1c2UgR0VUIHJlcXVlc3QgbWV0aG9kLicpO1xuICAgICAgfVxuICAgICAgcmVzcG9uc2VPYnNlcnZhYmxlID0gaHR0cFJlcXVlc3QodGhpcy5fYmFja2VuZCwgdXJsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgdXJsIHN0cmluZyBvciBSZXF1ZXN0IGluc3RhbmNlLicpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2VPYnNlcnZhYmxlO1xuICB9XG59XG4iXX0=