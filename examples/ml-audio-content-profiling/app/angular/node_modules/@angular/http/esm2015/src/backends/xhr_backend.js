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
import { ɵgetDOM as getDOM } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { ResponseOptions } from '../base_response_options';
import { ContentType, RequestMethod, ResponseContentType, ResponseType } from '../enums';
import { Headers } from '../headers';
import { getResponseURL, isSuccess } from '../http_utils';
import { XSRFStrategy } from '../interfaces';
import { Response } from '../static_response';
import { BrowserXhr } from './browser_xhr';
/** @type {?} */
const XSSI_PREFIX = /^\)\]\}',?\n/;
/**
 * Creates connections using `XMLHttpRequest`. Given a fully-qualified
 * request, an `XHRConnection` will immediately create an `XMLHttpRequest` object and send the
 * request.
 *
 * This class would typically not be created or interacted with directly inside applications, though
 * the {\@link MockConnection} may be interacted with in tests.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class XHRConnection {
    /**
     * @param {?} req
     * @param {?} browserXHR
     * @param {?=} baseResponseOptions
     */
    constructor(req, browserXHR, baseResponseOptions) {
        this.request = req;
        this.response = new Observable((responseObserver) => {
            /** @type {?} */
            const _xhr = browserXHR.build();
            _xhr.open(RequestMethod[req.method].toUpperCase(), req.url);
            if (req.withCredentials != null) {
                _xhr.withCredentials = req.withCredentials;
            }
            /** @type {?} */
            const onLoad = () => {
                /** @type {?} */
                let status = _xhr.status === 1223 ? 204 : _xhr.status;
                /** @type {?} */
                let body = null;
                // HTTP 204 means no content
                if (status !== 204) {
                    // responseText is the old-school way of retrieving response (supported by IE8 & 9)
                    // response/responseType properties were introduced in ResourceLoader Level2 spec
                    // (supported by IE10)
                    body = (typeof _xhr.response === 'undefined') ? _xhr.responseText : _xhr.response;
                    // Implicitly strip a potential XSSI prefix.
                    if (typeof body === 'string') {
                        body = body.replace(XSSI_PREFIX, '');
                    }
                }
                // fix status code when it is 0 (0 status is undocumented).
                // Occurs when accessing file resources or on Android 4.1 stock browser
                // while retrieving files from application cache.
                if (status === 0) {
                    status = body ? 200 : 0;
                }
                /** @type {?} */
                const headers = Headers.fromResponseHeaderString(_xhr.getAllResponseHeaders());
                /** @type {?} */
                const url = getResponseURL(_xhr) || req.url;
                /** @type {?} */
                const statusText = _xhr.statusText || 'OK';
                /** @type {?} */
                let responseOptions = new ResponseOptions({ body, status, headers, statusText, url });
                if (baseResponseOptions != null) {
                    responseOptions = baseResponseOptions.merge(responseOptions);
                }
                /** @type {?} */
                const response = new Response(responseOptions);
                response.ok = isSuccess(status);
                if (response.ok) {
                    responseObserver.next(response);
                    // TODO(gdi2290): defer complete if array buffer until done
                    responseObserver.complete();
                    return;
                }
                responseObserver.error(response);
            };
            /** @type {?} */
            const onError = (err) => {
                /** @type {?} */
                let responseOptions = new ResponseOptions({
                    body: err,
                    type: ResponseType.Error,
                    status: _xhr.status,
                    statusText: _xhr.statusText,
                });
                if (baseResponseOptions != null) {
                    responseOptions = baseResponseOptions.merge(responseOptions);
                }
                responseObserver.error(new Response(responseOptions));
            };
            this.setDetectedContentType(req, _xhr);
            if (req.headers == null) {
                req.headers = new Headers();
            }
            if (!req.headers.has('Accept')) {
                req.headers.append('Accept', 'application/json, text/plain, */*');
            }
            req.headers.forEach((values, name) => _xhr.setRequestHeader(/** @type {?} */ ((name)), values.join(',')));
            // Select the correct buffer type to store the response
            if (req.responseType != null && _xhr.responseType != null) {
                switch (req.responseType) {
                    case ResponseContentType.ArrayBuffer:
                        _xhr.responseType = 'arraybuffer';
                        break;
                    case ResponseContentType.Json:
                        _xhr.responseType = 'json';
                        break;
                    case ResponseContentType.Text:
                        _xhr.responseType = 'text';
                        break;
                    case ResponseContentType.Blob:
                        _xhr.responseType = 'blob';
                        break;
                    default:
                        throw new Error('The selected responseType is not supported');
                }
            }
            _xhr.addEventListener('load', onLoad);
            _xhr.addEventListener('error', onError);
            _xhr.send(this.request.getBody());
            return () => {
                _xhr.removeEventListener('load', onLoad);
                _xhr.removeEventListener('error', onError);
                _xhr.abort();
            };
        });
    }
    /**
     * @param {?} req
     * @param {?} _xhr
     * @return {?}
     */
    setDetectedContentType(req /** TODO Request */, _xhr /** XMLHttpRequest */) {
        // Skip if a custom Content-Type header is provided
        if (req.headers != null && req.headers.get('Content-Type') != null) {
            return;
        }
        // Set the detected content type
        switch (req.contentType) {
            case ContentType.NONE:
                break;
            case ContentType.JSON:
                _xhr.setRequestHeader('content-type', 'application/json');
                break;
            case ContentType.FORM:
                _xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
                break;
            case ContentType.TEXT:
                _xhr.setRequestHeader('content-type', 'text/plain');
                break;
            case ContentType.BLOB:
                /** @type {?} */
                const blob = req.blob();
                if (blob.type) {
                    _xhr.setRequestHeader('content-type', blob.type);
                }
                break;
        }
    }
}
if (false) {
    /** @type {?} */
    XHRConnection.prototype.request;
    /**
     * Response {\@link EventEmitter} which emits a single {\@link Response} value on load event of
     * `XMLHttpRequest`.
     * @type {?}
     */
    XHRConnection.prototype.response;
    /** @type {?} */
    XHRConnection.prototype.readyState;
}
/**
 * `XSRFConfiguration` sets up Cross Site Request Forgery (XSRF) protection for the application
 * using a cookie. See https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)
 * for more information on XSRF.
 *
 * Applications can configure custom cookie and header names by binding an instance of this class
 * with different `cookieName` and `headerName` values. See the main HTTP documentation for more
 * details.
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class CookieXSRFStrategy {
    /**
     * @param {?=} _cookieName
     * @param {?=} _headerName
     */
    constructor(_cookieName = 'XSRF-TOKEN', _headerName = 'X-XSRF-TOKEN') {
        this._cookieName = _cookieName;
        this._headerName = _headerName;
    }
    /**
     * @param {?} req
     * @return {?}
     */
    configureRequest(req) {
        /** @type {?} */
        const xsrfToken = getDOM().getCookie(this._cookieName);
        if (xsrfToken) {
            req.headers.set(this._headerName, xsrfToken);
        }
    }
}
if (false) {
    /** @type {?} */
    CookieXSRFStrategy.prototype._cookieName;
    /** @type {?} */
    CookieXSRFStrategy.prototype._headerName;
}
/**
 * Creates {\@link XHRConnection} instances.
 *
 * This class would typically not be used by end users, but could be
 * overridden if a different backend implementation should be used,
 * such as in a node backend.
 *
 * \@usageNotes
 * ### Example
 *
 * ```
 * import {Http, MyNodeBackend, HTTP_PROVIDERS, BaseRequestOptions} from '\@angular/http';
 * \@Component({
 *   viewProviders: [
 *     HTTP_PROVIDERS,
 *     {provide: Http, useFactory: (backend, options) => {
 *       return new Http(backend, options);
 *     }, deps: [MyNodeBackend, BaseRequestOptions]}]
 * })
 * class MyComponent {
 *   constructor(http:Http) {
 *     http.request('people.json').subscribe(res => this.people = res.json());
 *   }
 * }
 * ```
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class XHRBackend {
    /**
     * @param {?} _browserXHR
     * @param {?} _baseResponseOptions
     * @param {?} _xsrfStrategy
     */
    constructor(_browserXHR, _baseResponseOptions, _xsrfStrategy) {
        this._browserXHR = _browserXHR;
        this._baseResponseOptions = _baseResponseOptions;
        this._xsrfStrategy = _xsrfStrategy;
    }
    /**
     * @param {?} request
     * @return {?}
     */
    createConnection(request) {
        this._xsrfStrategy.configureRequest(request);
        return new XHRConnection(request, this._browserXHR, this._baseResponseOptions);
    }
}
XHRBackend.decorators = [
    { type: Injectable }
];
/** @nocollapse */
XHRBackend.ctorParameters = () => [
    { type: BrowserXhr },
    { type: ResponseOptions },
    { type: XSRFStrategy }
];
if (false) {
    /** @type {?} */
    XHRBackend.prototype._browserXHR;
    /** @type {?} */
    XHRBackend.prototype._baseResponseOptions;
    /** @type {?} */
    XHRBackend.prototype._xsrfStrategy;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGhyX2JhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9odHRwL3NyYy9iYWNrZW5kcy94aHJfYmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFDLE9BQU8sSUFBSSxNQUFNLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsVUFBVSxFQUFXLE1BQU0sTUFBTSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsV0FBVyxFQUFjLGFBQWEsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbkcsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLEVBQWdDLFlBQVksRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUxRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDNUMsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUFFekMsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDOzs7Ozs7Ozs7Ozs7QUFhbkMsTUFBTSxPQUFPLGFBQWE7Ozs7OztJQVN4QixZQUFZLEdBQVksRUFBRSxVQUFzQixFQUFFLG1CQUFxQztRQUNyRixJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksVUFBVSxDQUFXLENBQUMsZ0JBQW9DLEVBQUUsRUFBRTs7WUFDaEYsTUFBTSxJQUFJLEdBQW1CLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoRCxJQUFJLENB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dCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge8m1Z2V0RE9NIGFzIGdldERPTX0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG5pbXBvcnQge09ic2VydmFibGUsIE9ic2VydmVyfSBmcm9tICdyeGpzJztcbmltcG9ydCB7UmVzcG9uc2VPcHRpb25zfSBmcm9tICcuLi9iYXNlX3Jlc3BvbnNlX29wdGlvbnMnO1xuaW1wb3J0IHtDb250ZW50VHlwZSwgUmVhZHlTdGF0ZSwgUmVxdWVzdE1ldGhvZCwgUmVzcG9uc2VDb250ZW50VHlwZSwgUmVzcG9uc2VUeXBlfSBmcm9tICcuLi9lbnVtcyc7XG5pbXBvcnQge0hlYWRlcnN9IGZyb20gJy4uL2hlYWRlcnMnO1xuaW1wb3J0IHtnZXRSZXNwb25zZVVSTCwgaXNTdWNjZXNzfSBmcm9tICcuLi9odHRwX3V0aWxzJztcbmltcG9ydCB7Q29ubmVjdGlvbiwgQ29ubmVjdGlvbkJhY2tlbmQsIFhTUkZTdHJhdGVneX0gZnJvbSAnLi4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge1JlcXVlc3R9IGZyb20gJy4uL3N0YXRpY19yZXF1ZXN0JztcbmltcG9ydCB7UmVzcG9uc2V9IGZyb20gJy4uL3N0YXRpY19yZXNwb25zZSc7XG5pbXBvcnQge0Jyb3dzZXJYaHJ9IGZyb20gJy4vYnJvd3Nlcl94aHInO1xuXG5jb25zdCBYU1NJX1BSRUZJWCA9IC9eXFwpXFxdXFx9Jyw/XFxuLztcblxuLyoqXG4gKiBDcmVhdGVzIGNvbm5lY3Rpb25zIHVzaW5nIGBYTUxIdHRwUmVxdWVzdGAuIEdpdmVuIGEgZnVsbHktcXVhbGlmaWVkXG4gKiByZXF1ZXN0LCBhbiBgWEhSQ29ubmVjdGlvbmAgd2lsbCBpbW1lZGlhdGVseSBjcmVhdGUgYW4gYFhNTEh0dHBSZXF1ZXN0YCBvYmplY3QgYW5kIHNlbmQgdGhlXG4gKiByZXF1ZXN0LlxuICpcbiAqIFRoaXMgY2xhc3Mgd291bGQgdHlwaWNhbGx5IG5vdCBiZSBjcmVhdGVkIG9yIGludGVyYWN0ZWQgd2l0aCBkaXJlY3RseSBpbnNpZGUgYXBwbGljYXRpb25zLCB0aG91Z2hcbiAqIHRoZSB7QGxpbmsgTW9ja0Nvbm5lY3Rpb259IG1heSBiZSBpbnRlcmFjdGVkIHdpdGggaW4gdGVzdHMuXG4gKlxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBYSFJDb25uZWN0aW9uIGltcGxlbWVudHMgQ29ubmVjdGlvbiB7XG4gIHJlcXVlc3Q6IFJlcXVlc3Q7XG4gIC8qKlxuICAgKiBSZXNwb25zZSB7QGxpbmsgRXZlbnRFbWl0dGVyfSB3aGljaCBlbWl0cyBhIHNpbmdsZSB7QGxpbmsgUmVzcG9uc2V9IHZhbHVlIG9uIGxvYWQgZXZlbnQgb2ZcbiAgICogYFhNTEh0dHBSZXF1ZXN0YC5cbiAgICovXG4gIHJlc3BvbnNlOiBPYnNlcnZhYmxlPFJlc3BvbnNlPjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHJlYWR5U3RhdGUgITogUmVhZHlTdGF0ZTtcbiAgY29uc3RydWN0b3IocmVxOiBSZXF1ZXN0LCBicm93c2VyWEhSOiBCcm93c2VyWGhyLCBiYXNlUmVzcG9uc2VPcHRpb25zPzogUmVzcG9uc2VPcHRpb25zKSB7XG4gICAgdGhpcy5yZXF1ZXN0ID0gcmVxO1xuICAgIHRoaXMucmVzcG9uc2UgPSBuZXcgT2JzZXJ2YWJsZTxSZXNwb25zZT4oKHJlc3BvbnNlT2JzZXJ2ZXI6IE9ic2VydmVyPFJlc3BvbnNlPikgPT4ge1xuICAgICAgY29uc3QgX3hocjogWE1MSHR0cFJlcXVlc3QgPSBicm93c2VyWEhSLmJ1aWxkKCk7XG4gICAgICBfeGhyLm9wZW4oUmVxdWVzdE1ldGhvZFtyZXEubWV0aG9kXS50b1VwcGVyQ2FzZSgpLCByZXEudXJsKTtcbiAgICAgIGlmIChyZXEud2l0aENyZWRlbnRpYWxzICE9IG51bGwpIHtcbiAgICAgICAgX3hoci53aXRoQ3JlZGVudGlhbHMgPSByZXEud2l0aENyZWRlbnRpYWxzO1xuICAgICAgfVxuICAgICAgLy8gbG9hZCBldmVudCBoYW5kbGVyXG4gICAgICBjb25zdCBvbkxvYWQgPSAoKSA9PiB7XG4gICAgICAgIC8vIG5vcm1hbGl6ZSBJRTkgYnVnIChodHRwOi8vYnVncy5qcXVlcnkuY29tL3RpY2tldC8xNDUwKVxuICAgICAgICBsZXQgc3RhdHVzOiBudW1iZXIgPSBfeGhyLnN0YXR1cyA9PT0gMTIyMyA/IDIwNCA6IF94aHIuc3RhdHVzO1xuXG4gICAgICAgIGxldCBib2R5OiBhbnkgPSBudWxsO1xuXG4gICAgICAgIC8vIEhUVFAgMjA0IG1lYW5zIG5vIGNvbnRlbnRcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gMjA0KSB7XG4gICAgICAgICAgLy8gcmVzcG9uc2VUZXh0IGlzIHRoZSBvbGQtc2Nob29sIHdheSBvZiByZXRyaWV2aW5nIHJlc3BvbnNlIChzdXBwb3J0ZWQgYnkgSUU4ICYgOSlcbiAgICAgICAgICAvLyByZXNwb25zZS9yZXNwb25zZVR5cGUgcHJvcGVydGllcyB3ZXJlIGludHJvZHVjZWQgaW4gUmVzb3VyY2VMb2FkZXIgTGV2ZWwyIHNwZWNcbiAgICAgICAgICAvLyAoc3VwcG9ydGVkIGJ5IElFMTApXG4gICAgICAgICAgYm9keSA9ICh0eXBlb2YgX3hoci5yZXNwb25zZSA9PT0gJ3VuZGVmaW5lZCcpID8gX3hoci5yZXNwb25zZVRleHQgOiBfeGhyLnJlc3BvbnNlO1xuXG4gICAgICAgICAgLy8gSW1wbGljaXRseSBzdHJpcCBhIHBvdGVudGlhbCBYU1NJIHByZWZpeC5cbiAgICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBib2R5ID0gYm9keS5yZXBsYWNlKFhTU0lfUFJFRklYLCAnJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZml4IHN0YXR1cyBjb2RlIHdoZW4gaXQgaXMgMCAoMCBzdGF0dXMgaXMgdW5kb2N1bWVudGVkKS5cbiAgICAgICAgLy8gT2NjdXJzIHdoZW4gYWNjZXNzaW5nIGZpbGUgcmVzb3VyY2VzIG9yIG9uIEFuZHJvaWQgNC4xIHN0b2NrIGJyb3dzZXJcbiAgICAgICAgLy8gd2hpbGUgcmV0cmlldmluZyBmaWxlcyBmcm9tIGFwcGxpY2F0aW9uIGNhY2hlLlxuICAgICAgICBpZiAoc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgc3RhdHVzID0gYm9keSA/IDIwMCA6IDA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBoZWFkZXJzOiBIZWFkZXJzID0gSGVhZGVycy5mcm9tUmVzcG9uc2VIZWFkZXJTdHJpbmcoX3hoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSk7XG4gICAgICAgIC8vIElFIDkgZG9lcyBub3QgcHJvdmlkZSB0aGUgd2F5IHRvIGdldCBVUkwgb2YgcmVzcG9uc2VcbiAgICAgICAgY29uc3QgdXJsID0gZ2V0UmVzcG9uc2VVUkwoX3hocikgfHwgcmVxLnVybDtcbiAgICAgICAgY29uc3Qgc3RhdHVzVGV4dDogc3RyaW5nID0gX3hoci5zdGF0dXNUZXh0IHx8ICdPSyc7XG5cbiAgICAgICAgbGV0IHJlc3BvbnNlT3B0aW9ucyA9IG5ldyBSZXNwb25zZU9wdGlvbnMoe2JvZHksIHN0YXR1cywgaGVhZGVycywgc3RhdHVzVGV4dCwgdXJsfSk7XG4gICAgICAgIGlmIChiYXNlUmVzcG9uc2VPcHRpb25zICE9IG51bGwpIHtcbiAgICAgICAgICByZXNwb25zZU9wdGlvbnMgPSBiYXNlUmVzcG9uc2VPcHRpb25zLm1lcmdlKHJlc3BvbnNlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UocmVzcG9uc2VPcHRpb25zKTtcbiAgICAgICAgcmVzcG9uc2Uub2sgPSBpc1N1Y2Nlc3Moc3RhdHVzKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgcmVzcG9uc2VPYnNlcnZlci5uZXh0KHJlc3BvbnNlKTtcbiAgICAgICAgICAvLyBUT0RPKGdkaTIyOTApOiBkZWZlciBjb21wbGV0ZSBpZiBhcnJheSBidWZmZXIgdW50aWwgZG9uZVxuICAgICAgICAgIHJlc3BvbnNlT2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVzcG9uc2VPYnNlcnZlci5lcnJvcihyZXNwb25zZSk7XG4gICAgICB9O1xuICAgICAgLy8gZXJyb3IgZXZlbnQgaGFuZGxlclxuICAgICAgY29uc3Qgb25FcnJvciA9IChlcnI6IEVycm9yRXZlbnQpID0+IHtcbiAgICAgICAgbGV0IHJlc3BvbnNlT3B0aW9ucyA9IG5ldyBSZXNwb25zZU9wdGlvbnMoe1xuICAgICAgICAgIGJvZHk6IGVycixcbiAgICAgICAgICB0eXBlOiBSZXNwb25zZVR5cGUuRXJyb3IsXG4gICAgICAgICAgc3RhdHVzOiBfeGhyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiBfeGhyLnN0YXR1c1RleHQsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYmFzZVJlc3BvbnNlT3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgcmVzcG9uc2VPcHRpb25zID0gYmFzZVJlc3BvbnNlT3B0aW9ucy5tZXJnZShyZXNwb25zZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3BvbnNlT2JzZXJ2ZXIuZXJyb3IobmV3IFJlc3BvbnNlKHJlc3BvbnNlT3B0aW9ucykpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5zZXREZXRlY3RlZENvbnRlbnRUeXBlKHJlcSwgX3hocik7XG5cbiAgICAgIGlmIChyZXEuaGVhZGVycyA9PSBudWxsKSB7XG4gICAgICAgIHJlcS5oZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAgIH1cbiAgICAgIGlmICghcmVxLmhlYWRlcnMuaGFzKCdBY2NlcHQnKSkge1xuICAgICAgICByZXEuaGVhZGVycy5hcHBlbmQoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L3BsYWluLCAqLyonKTtcbiAgICAgIH1cbiAgICAgIHJlcS5oZWFkZXJzLmZvckVhY2goKHZhbHVlcywgbmFtZSkgPT4gX3hoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUgISwgdmFsdWVzLmpvaW4oJywnKSkpO1xuXG4gICAgICAvLyBTZWxlY3QgdGhlIGNvcnJlY3QgYnVmZmVyIHR5cGUgdG8gc3RvcmUgdGhlIHJlc3BvbnNlXG4gICAgICBpZiAocmVxLnJlc3BvbnNlVHlwZSAhPSBudWxsICYmIF94aHIucmVzcG9uc2VUeXBlICE9IG51bGwpIHtcbiAgICAgICAgc3dpdGNoIChyZXEucmVzcG9uc2VUeXBlKSB7XG4gICAgICAgICAgY2FzZSBSZXNwb25zZUNvbnRlbnRUeXBlLkFycmF5QnVmZmVyOlxuICAgICAgICAgICAgX3hoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBSZXNwb25zZUNvbnRlbnRUeXBlLkpzb246XG4gICAgICAgICAgICBfeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgUmVzcG9uc2VDb250ZW50VHlwZS5UZXh0OlxuICAgICAgICAgICAgX3hoci5yZXNwb25zZVR5cGUgPSAndGV4dCc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFJlc3BvbnNlQ29udGVudFR5cGUuQmxvYjpcbiAgICAgICAgICAgIF94aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHNlbGVjdGVkIHJlc3BvbnNlVHlwZSBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgX3hoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgb25Mb2FkKTtcbiAgICAgIF94aHIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBvbkVycm9yKTtcblxuICAgICAgX3hoci5zZW5kKHRoaXMucmVxdWVzdC5nZXRCb2R5KCkpO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBfeGhyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWQpO1xuICAgICAgICBfeGhyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICAgIF94aHIuYWJvcnQoKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBzZXREZXRlY3RlZENvbnRlbnRUeXBlKHJlcTogYW55IC8qKiBUT0RPIFJlcXVlc3QgKi8sIF94aHI6IGFueSAvKiogWE1MSHR0cFJlcXVlc3QgKi8pIHtcbiAgICAvLyBTa2lwIGlmIGEgY3VzdG9tIENvbnRlbnQtVHlwZSBoZWFkZXIgaXMgcHJvdmlkZWRcbiAgICBpZiAocmVxLmhlYWRlcnMgIT0gbnVsbCAmJiByZXEuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpICE9IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGRldGVjdGVkIGNvbnRlbnQgdHlwZVxuICAgIHN3aXRjaCAocmVxLmNvbnRlbnRUeXBlKSB7XG4gICAgICBjYXNlIENvbnRlbnRUeXBlLk5PTkU6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb250ZW50VHlwZS5KU09OOlxuICAgICAgICBfeGhyLnNldFJlcXVlc3RIZWFkZXIoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBDb250ZW50VHlwZS5GT1JNOlxuICAgICAgICBfeGhyLnNldFJlcXVlc3RIZWFkZXIoJ2NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOCcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29udGVudFR5cGUuVEVYVDpcbiAgICAgICAgX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbicpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29udGVudFR5cGUuQkxPQjpcbiAgICAgICAgY29uc3QgYmxvYiA9IHJlcS5ibG9iKCk7XG4gICAgICAgIGlmIChibG9iLnR5cGUpIHtcbiAgICAgICAgICBfeGhyLnNldFJlcXVlc3RIZWFkZXIoJ2NvbnRlbnQtdHlwZScsIGJsb2IudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogYFhTUkZDb25maWd1cmF0aW9uYCBzZXRzIHVwIENyb3NzIFNpdGUgUmVxdWVzdCBGb3JnZXJ5IChYU1JGKSBwcm90ZWN0aW9uIGZvciB0aGUgYXBwbGljYXRpb25cbiAqIHVzaW5nIGEgY29va2llLiBTZWUgaHR0cHM6Ly93d3cub3dhc3Aub3JnL2luZGV4LnBocC9Dcm9zcy1TaXRlX1JlcXVlc3RfRm9yZ2VyeV8oQ1NSRilcbiAqIGZvciBtb3JlIGluZm9ybWF0aW9uIG9uIFhTUkYuXG4gKlxuICogQXBwbGljYXRpb25zIGNhbiBjb25maWd1cmUgY3VzdG9tIGNvb2tpZSBhbmQgaGVhZGVyIG5hbWVzIGJ5IGJpbmRpbmcgYW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzc1xuICogd2l0aCBkaWZmZXJlbnQgYGNvb2tpZU5hbWVgIGFuZCBgaGVhZGVyTmFtZWAgdmFsdWVzLiBTZWUgdGhlIG1haW4gSFRUUCBkb2N1bWVudGF0aW9uIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgQ29va2llWFNSRlN0cmF0ZWd5IGltcGxlbWVudHMgWFNSRlN0cmF0ZWd5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9jb29raWVOYW1lOiBzdHJpbmcgPSAnWFNSRi1UT0tFTicsIHByaXZhdGUgX2hlYWRlck5hbWU6IHN0cmluZyA9ICdYLVhTUkYtVE9LRU4nKSB7fVxuXG4gIGNvbmZpZ3VyZVJlcXVlc3QocmVxOiBSZXF1ZXN0KTogdm9pZCB7XG4gICAgY29uc3QgeHNyZlRva2VuID0gZ2V0RE9NKCkuZ2V0Q29va2llKHRoaXMuX2Nvb2tpZU5hbWUpO1xuICAgIGlmICh4c3JmVG9rZW4pIHtcbiAgICAgIHJlcS5oZWFkZXJzLnNldCh0aGlzLl9oZWFkZXJOYW1lLCB4c3JmVG9rZW4pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMge0BsaW5rIFhIUkNvbm5lY3Rpb259IGluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGNsYXNzIHdvdWxkIHR5cGljYWxseSBub3QgYmUgdXNlZCBieSBlbmQgdXNlcnMsIGJ1dCBjb3VsZCBiZVxuICogb3ZlcnJpZGRlbiBpZiBhIGRpZmZlcmVudCBiYWNrZW5kIGltcGxlbWVudGF0aW9uIHNob3VsZCBiZSB1c2VkLFxuICogc3VjaCBhcyBpbiBhIG5vZGUgYmFja2VuZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIGltcG9ydCB7SHR0cCwgTXlOb2RlQmFja2VuZCwgSFRUUF9QUk9WSURFUlMsIEJhc2VSZXF1ZXN0T3B0aW9uc30gZnJvbSAnQGFuZ3VsYXIvaHR0cCc7XG4gKiBAQ29tcG9uZW50KHtcbiAqICAgdmlld1Byb3ZpZGVyczogW1xuICogICAgIEhUVFBfUFJPVklERVJTLFxuICogICAgIHtwcm92aWRlOiBIdHRwLCB1c2VGYWN0b3J5OiAoYmFja2VuZCwgb3B0aW9ucykgPT4ge1xuICogICAgICAgcmV0dXJuIG5ldyBIdHRwKGJhY2tlbmQsIG9wdGlvbnMpO1xuICogICAgIH0sIGRlcHM6IFtNeU5vZGVCYWNrZW5kLCBCYXNlUmVxdWVzdE9wdGlvbnNdfV1cbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKGh0dHA6SHR0cCkge1xuICogICAgIGh0dHAucmVxdWVzdCgncGVvcGxlLmpzb24nKS5zdWJzY3JpYmUocmVzID0+IHRoaXMucGVvcGxlID0gcmVzLmpzb24oKSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICogQGRlcHJlY2F0ZWQgc2VlIGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9odHRwXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBYSFJCYWNrZW5kIGltcGxlbWVudHMgQ29ubmVjdGlvbkJhY2tlbmQge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2Jyb3dzZXJYSFI6IEJyb3dzZXJYaHIsIHByaXZhdGUgX2Jhc2VSZXNwb25zZU9wdGlvbnM6IFJlc3BvbnNlT3B0aW9ucyxcbiAgICAgIHByaXZhdGUgX3hzcmZTdHJhdGVneTogWFNSRlN0cmF0ZWd5KSB7fVxuXG4gIGNyZWF0ZUNvbm5lY3Rpb24ocmVxdWVzdDogUmVxdWVzdCk6IFhIUkNvbm5lY3Rpb24ge1xuICAgIHRoaXMuX3hzcmZTdHJhdGVneS5jb25maWd1cmVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgIHJldHVybiBuZXcgWEhSQ29ubmVjdGlvbihyZXF1ZXN0LCB0aGlzLl9icm93c2VyWEhSLCB0aGlzLl9iYXNlUmVzcG9uc2VPcHRpb25zKTtcbiAgfVxufVxuIl19