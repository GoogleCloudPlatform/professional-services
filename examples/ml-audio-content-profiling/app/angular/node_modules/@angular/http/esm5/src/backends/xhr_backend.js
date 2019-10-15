/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
var XSSI_PREFIX = /^\)\]\}',?\n/;
/**
 * Creates connections using `XMLHttpRequest`. Given a fully-qualified
 * request, an `XHRConnection` will immediately create an `XMLHttpRequest` object and send the
 * request.
 *
 * This class would typically not be created or interacted with directly inside applications, though
 * the {@link MockConnection} may be interacted with in tests.
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var XHRConnection = /** @class */ (function () {
    function XHRConnection(req, browserXHR, baseResponseOptions) {
        var _this = this;
        this.request = req;
        this.response = new Observable(function (responseObserver) {
            var _xhr = browserXHR.build();
            _xhr.open(RequestMethod[req.method].toUpperCase(), req.url);
            if (req.withCredentials != null) {
                _xhr.withCredentials = req.withCredentials;
            }
            // load event handler
            var onLoad = function () {
                // normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
                var status = _xhr.status === 1223 ? 204 : _xhr.status;
                var body = null;
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
                var headers = Headers.fromResponseHeaderString(_xhr.getAllResponseHeaders());
                // IE 9 does not provide the way to get URL of response
                var url = getResponseURL(_xhr) || req.url;
                var statusText = _xhr.statusText || 'OK';
                var responseOptions = new ResponseOptions({ body: body, status: status, headers: headers, statusText: statusText, url: url });
                if (baseResponseOptions != null) {
                    responseOptions = baseResponseOptions.merge(responseOptions);
                }
                var response = new Response(responseOptions);
                response.ok = isSuccess(status);
                if (response.ok) {
                    responseObserver.next(response);
                    // TODO(gdi2290): defer complete if array buffer until done
                    responseObserver.complete();
                    return;
                }
                responseObserver.error(response);
            };
            // error event handler
            var onError = function (err) {
                var responseOptions = new ResponseOptions({
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
            _this.setDetectedContentType(req, _xhr);
            if (req.headers == null) {
                req.headers = new Headers();
            }
            if (!req.headers.has('Accept')) {
                req.headers.append('Accept', 'application/json, text/plain, */*');
            }
            req.headers.forEach(function (values, name) { return _xhr.setRequestHeader(name, values.join(',')); });
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
            _xhr.send(_this.request.getBody());
            return function () {
                _xhr.removeEventListener('load', onLoad);
                _xhr.removeEventListener('error', onError);
                _xhr.abort();
            };
        });
    }
    XHRConnection.prototype.setDetectedContentType = function (req /** TODO Request */, _xhr /** XMLHttpRequest */) {
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
                var blob = req.blob();
                if (blob.type) {
                    _xhr.setRequestHeader('content-type', blob.type);
                }
                break;
        }
    };
    return XHRConnection;
}());
export { XHRConnection };
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
 * @publicApi
 */
var CookieXSRFStrategy = /** @class */ (function () {
    function CookieXSRFStrategy(_cookieName, _headerName) {
        if (_cookieName === void 0) { _cookieName = 'XSRF-TOKEN'; }
        if (_headerName === void 0) { _headerName = 'X-XSRF-TOKEN'; }
        this._cookieName = _cookieName;
        this._headerName = _headerName;
    }
    CookieXSRFStrategy.prototype.configureRequest = function (req) {
        var xsrfToken = getDOM().getCookie(this._cookieName);
        if (xsrfToken) {
            req.headers.set(this._headerName, xsrfToken);
        }
    };
    return CookieXSRFStrategy;
}());
export { CookieXSRFStrategy };
/**
 * Creates {@link XHRConnection} instances.
 *
 * This class would typically not be used by end users, but could be
 * overridden if a different backend implementation should be used,
 * such as in a node backend.
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * import {Http, MyNodeBackend, HTTP_PROVIDERS, BaseRequestOptions} from '@angular/http';
 * @Component({
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
 * @publicApi
 */
var XHRBackend = /** @class */ (function () {
    function XHRBackend(_browserXHR, _baseResponseOptions, _xsrfStrategy) {
        this._browserXHR = _browserXHR;
        this._baseResponseOptions = _baseResponseOptions;
        this._xsrfStrategy = _xsrfStrategy;
    }
    XHRBackend.prototype.createConnection = function (request) {
        this._xsrfStrategy.configureRequest(request);
        return new XHRConnection(request, this._browserXHR, this._baseResponseOptions);
    };
    XHRBackend = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [BrowserXhr, ResponseOptions,
            XSRFStrategy])
    ], XHRBackend);
    return XHRBackend;
}());
export { XHRBackend };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGhyX2JhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9odHRwL3NyYy9iYWNrZW5kcy94aHJfYmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUMsT0FBTyxJQUFJLE1BQU0sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzVELE9BQU8sRUFBQyxVQUFVLEVBQVcsTUFBTSxNQUFNLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxXQUFXLEVBQWMsYUFBYSxFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNuRyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBZ0MsWUFBWSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFFLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQztBQUVuQzs7Ozs7Ozs7OztHQVVHO0FBQ0g7SUFTRSx1QkFBWSxHQUFZLEVBQUUsVUFBc0IsRUFBRSxtQkFBcUM7UUFBdkYsaUJBNkdDO1FBNUdDLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxVQUFVLENBQVcsVUFBQyxnQkFBb0M7WUFDNUUsSUFBTSxJQUFJLEdBQW1CLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoRCxJQUFJ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QkFBcUMsRUFDdEUsYUFBMkI7UUFEM0IsZ0JBQVcsR0FBWCxXQUFXLENBQVk7UUFBVSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQWlCO1FBQ3RFLGtCQUFhLEdBQWIsYUFBYSxDQUFjO0lBQUcsQ0FBQztJQUUzQyxxQ0FBZ0IsR0FBaEIsVUFBaUIsT0FBZ0I7UUFDL0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QyxPQUFPLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ2pGLENBQUM7SUFSVSxVQUFVO1FBRHRCLFVBQVUsRUFBRTtpREFHYyxVQUFVLEVBQWdDLGVBQWU7WUFDdkQsWUFBWTtPQUg1QixVQUFVLENBU3RCO0lBQUQsaUJBQUM7Q0FBQSxBQVRELElBU0M7U0FUWSxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHvJtWdldERPTSBhcyBnZXRET019IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlcn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1Jlc3BvbnNlT3B0aW9uc30gZnJvbSAnLi4vYmFzZV9yZXNwb25zZV9vcHRpb25zJztcbmltcG9ydCB7Q29udGVudFR5cGUsIFJlYWR5U3RhdGUsIFJlcXVlc3RNZXRob2QsIFJlc3BvbnNlQ29udGVudFR5cGUsIFJlc3BvbnNlVHlwZX0gZnJvbSAnLi4vZW51bXMnO1xuaW1wb3J0IHtIZWFkZXJzfSBmcm9tICcuLi9oZWFkZXJzJztcbmltcG9ydCB7Z2V0UmVzcG9uc2VVUkwsIGlzU3VjY2Vzc30gZnJvbSAnLi4vaHR0cF91dGlscyc7XG5pbXBvcnQge0Nvbm5lY3Rpb24sIENvbm5lY3Rpb25CYWNrZW5kLCBYU1JGU3RyYXRlZ3l9IGZyb20gJy4uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtSZXF1ZXN0fSBmcm9tICcuLi9zdGF0aWNfcmVxdWVzdCc7XG5pbXBvcnQge1Jlc3BvbnNlfSBmcm9tICcuLi9zdGF0aWNfcmVzcG9uc2UnO1xuaW1wb3J0IHtCcm93c2VyWGhyfSBmcm9tICcuL2Jyb3dzZXJfeGhyJztcblxuY29uc3QgWFNTSV9QUkVGSVggPSAvXlxcKVxcXVxcfScsP1xcbi87XG5cbi8qKlxuICogQ3JlYXRlcyBjb25uZWN0aW9ucyB1c2luZyBgWE1MSHR0cFJlcXVlc3RgLiBHaXZlbiBhIGZ1bGx5LXF1YWxpZmllZFxuICogcmVxdWVzdCwgYW4gYFhIUkNvbm5lY3Rpb25gIHdpbGwgaW1tZWRpYXRlbHkgY3JlYXRlIGFuIGBYTUxIdHRwUmVxdWVzdGAgb2JqZWN0IGFuZCBzZW5kIHRoZVxuICogcmVxdWVzdC5cbiAqXG4gKiBUaGlzIGNsYXNzIHdvdWxkIHR5cGljYWxseSBub3QgYmUgY3JlYXRlZCBvciBpbnRlcmFjdGVkIHdpdGggZGlyZWN0bHkgaW5zaWRlIGFwcGxpY2F0aW9ucywgdGhvdWdoXG4gKiB0aGUge0BsaW5rIE1vY2tDb25uZWN0aW9ufSBtYXkgYmUgaW50ZXJhY3RlZCB3aXRoIGluIHRlc3RzLlxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgWEhSQ29ubmVjdGlvbiBpbXBsZW1lbnRzIENvbm5lY3Rpb24ge1xuICByZXF1ZXN0OiBSZXF1ZXN0O1xuICAvKipcbiAgICogUmVzcG9uc2Uge0BsaW5rIEV2ZW50RW1pdHRlcn0gd2hpY2ggZW1pdHMgYSBzaW5nbGUge0BsaW5rIFJlc3BvbnNlfSB2YWx1ZSBvbiBsb2FkIGV2ZW50IG9mXG4gICAqIGBYTUxIdHRwUmVxdWVzdGAuXG4gICAqL1xuICByZXNwb25zZTogT2JzZXJ2YWJsZTxSZXNwb25zZT47XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICByZWFkeVN0YXRlICE6IFJlYWR5U3RhdGU7XG4gIGNvbnN0cnVjdG9yKHJlcTogUmVxdWVzdCwgYnJvd3NlclhIUjogQnJvd3NlclhociwgYmFzZVJlc3BvbnNlT3B0aW9ucz86IFJlc3BvbnNlT3B0aW9ucykge1xuICAgIHRoaXMucmVxdWVzdCA9IHJlcTtcbiAgICB0aGlzLnJlc3BvbnNlID0gbmV3IE9ic2VydmFibGU8UmVzcG9uc2U+KChyZXNwb25zZU9ic2VydmVyOiBPYnNlcnZlcjxSZXNwb25zZT4pID0+IHtcbiAgICAgIGNvbnN0IF94aHI6IFhNTEh0dHBSZXF1ZXN0ID0gYnJvd3NlclhIUi5idWlsZCgpO1xuICAgICAgX3hoci5vcGVuKFJlcXVlc3RNZXRob2RbcmVxLm1ldGhvZF0udG9VcHBlckNhc2UoKSwgcmVxLnVybCk7XG4gICAgICBpZiAocmVxLndpdGhDcmVkZW50aWFscyAhPSBudWxsKSB7XG4gICAgICAgIF94aHIud2l0aENyZWRlbnRpYWxzID0gcmVxLndpdGhDcmVkZW50aWFscztcbiAgICAgIH1cbiAgICAgIC8vIGxvYWQgZXZlbnQgaGFuZGxlclxuICAgICAgY29uc3Qgb25Mb2FkID0gKCkgPT4ge1xuICAgICAgICAvLyBub3JtYWxpemUgSUU5IGJ1ZyAoaHR0cDovL2J1Z3MuanF1ZXJ5LmNvbS90aWNrZXQvMTQ1MClcbiAgICAgICAgbGV0IHN0YXR1czogbnVtYmVyID0gX3hoci5zdGF0dXMgPT09IDEyMjMgPyAyMDQgOiBfeGhyLnN0YXR1cztcblxuICAgICAgICBsZXQgYm9keTogYW55ID0gbnVsbDtcblxuICAgICAgICAvLyBIVFRQIDIwNCBtZWFucyBubyBjb250ZW50XG4gICAgICAgIGlmIChzdGF0dXMgIT09IDIwNCkge1xuICAgICAgICAgIC8vIHJlc3BvbnNlVGV4dCBpcyB0aGUgb2xkLXNjaG9vbCB3YXkgb2YgcmV0cmlldmluZyByZXNwb25zZSAoc3VwcG9ydGVkIGJ5IElFOCAmIDkpXG4gICAgICAgICAgLy8gcmVzcG9uc2UvcmVzcG9uc2VUeXBlIHByb3BlcnRpZXMgd2VyZSBpbnRyb2R1Y2VkIGluIFJlc291cmNlTG9hZGVyIExldmVsMiBzcGVjXG4gICAgICAgICAgLy8gKHN1cHBvcnRlZCBieSBJRTEwKVxuICAgICAgICAgIGJvZHkgPSAodHlwZW9mIF94aHIucmVzcG9uc2UgPT09ICd1bmRlZmluZWQnKSA/IF94aHIucmVzcG9uc2VUZXh0IDogX3hoci5yZXNwb25zZTtcblxuICAgICAgICAgIC8vIEltcGxpY2l0bHkgc3RyaXAgYSBwb3RlbnRpYWwgWFNTSSBwcmVmaXguXG4gICAgICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZShYU1NJX1BSRUZJWCwgJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZpeCBzdGF0dXMgY29kZSB3aGVuIGl0IGlzIDAgKDAgc3RhdHVzIGlzIHVuZG9jdW1lbnRlZCkuXG4gICAgICAgIC8vIE9jY3VycyB3aGVuIGFjY2Vzc2luZyBmaWxlIHJlc291cmNlcyBvciBvbiBBbmRyb2lkIDQuMSBzdG9jayBicm93c2VyXG4gICAgICAgIC8vIHdoaWxlIHJldHJpZXZpbmcgZmlsZXMgZnJvbSBhcHBsaWNhdGlvbiBjYWNoZS5cbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gMCkge1xuICAgICAgICAgIHN0YXR1cyA9IGJvZHkgPyAyMDAgOiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGVhZGVyczogSGVhZGVycyA9IEhlYWRlcnMuZnJvbVJlc3BvbnNlSGVhZGVyU3RyaW5nKF94aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpO1xuICAgICAgICAvLyBJRSA5IGRvZXMgbm90IHByb3ZpZGUgdGhlIHdheSB0byBnZXQgVVJMIG9mIHJlc3BvbnNlXG4gICAgICAgIGNvbnN0IHVybCA9IGdldFJlc3BvbnNlVVJMKF94aHIpIHx8IHJlcS51cmw7XG4gICAgICAgIGNvbnN0IHN0YXR1c1RleHQ6IHN0cmluZyA9IF94aHIuc3RhdHVzVGV4dCB8fCAnT0snO1xuXG4gICAgICAgIGxldCByZXNwb25zZU9wdGlvbnMgPSBuZXcgUmVzcG9uc2VPcHRpb25zKHtib2R5LCBzdGF0dXMsIGhlYWRlcnMsIHN0YXR1c1RleHQsIHVybH0pO1xuICAgICAgICBpZiAoYmFzZVJlc3BvbnNlT3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgcmVzcG9uc2VPcHRpb25zID0gYmFzZVJlc3BvbnNlT3B0aW9ucy5tZXJnZShyZXNwb25zZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKHJlc3BvbnNlT3B0aW9ucyk7XG4gICAgICAgIHJlc3BvbnNlLm9rID0gaXNTdWNjZXNzKHN0YXR1cyk7XG4gICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgIHJlc3BvbnNlT2JzZXJ2ZXIubmV4dChyZXNwb25zZSk7XG4gICAgICAgICAgLy8gVE9ETyhnZGkyMjkwKTogZGVmZXIgY29tcGxldGUgaWYgYXJyYXkgYnVmZmVyIHVudGlsIGRvbmVcbiAgICAgICAgICByZXNwb25zZU9ic2VydmVyLmNvbXBsZXRlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc3BvbnNlT2JzZXJ2ZXIuZXJyb3IocmVzcG9uc2UpO1xuICAgICAgfTtcbiAgICAgIC8vIGVycm9yIGV2ZW50IGhhbmRsZXJcbiAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyOiBFcnJvckV2ZW50KSA9PiB7XG4gICAgICAgIGxldCByZXNwb25zZU9wdGlvbnMgPSBuZXcgUmVzcG9uc2VPcHRpb25zKHtcbiAgICAgICAgICBib2R5OiBlcnIsXG4gICAgICAgICAgdHlwZTogUmVzcG9uc2VUeXBlLkVycm9yLFxuICAgICAgICAgIHN0YXR1czogX3hoci5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogX3hoci5zdGF0dXNUZXh0LFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGJhc2VSZXNwb25zZU9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgICAgIHJlc3BvbnNlT3B0aW9ucyA9IGJhc2VSZXNwb25zZU9wdGlvbnMubWVyZ2UocmVzcG9uc2VPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICByZXNwb25zZU9ic2VydmVyLmVycm9yKG5ldyBSZXNwb25zZShyZXNwb25zZU9wdGlvbnMpKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuc2V0RGV0ZWN0ZWRDb250ZW50VHlwZShyZXEsIF94aHIpO1xuXG4gICAgICBpZiAocmVxLmhlYWRlcnMgPT0gbnVsbCkge1xuICAgICAgICByZXEuaGVhZGVycyA9IG5ldyBIZWFkZXJzKCk7XG4gICAgICB9XG4gICAgICBpZiAoIXJlcS5oZWFkZXJzLmhhcygnQWNjZXB0JykpIHtcbiAgICAgICAgcmVxLmhlYWRlcnMuYXBwZW5kKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbiwgdGV4dC9wbGFpbiwgKi8qJyk7XG4gICAgICB9XG4gICAgICByZXEuaGVhZGVycy5mb3JFYWNoKCh2YWx1ZXMsIG5hbWUpID0+IF94aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lICEsIHZhbHVlcy5qb2luKCcsJykpKTtcblxuICAgICAgLy8gU2VsZWN0IHRoZSBjb3JyZWN0IGJ1ZmZlciB0eXBlIHRvIHN0b3JlIHRoZSByZXNwb25zZVxuICAgICAgaWYgKHJlcS5yZXNwb25zZVR5cGUgIT0gbnVsbCAmJiBfeGhyLnJlc3BvbnNlVHlwZSAhPSBudWxsKSB7XG4gICAgICAgIHN3aXRjaCAocmVxLnJlc3BvbnNlVHlwZSkge1xuICAgICAgICAgIGNhc2UgUmVzcG9uc2VDb250ZW50VHlwZS5BcnJheUJ1ZmZlcjpcbiAgICAgICAgICAgIF94aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgUmVzcG9uc2VDb250ZW50VHlwZS5Kc29uOlxuICAgICAgICAgICAgX3hoci5yZXNwb25zZVR5cGUgPSAnanNvbic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFJlc3BvbnNlQ29udGVudFR5cGUuVGV4dDpcbiAgICAgICAgICAgIF94aHIucmVzcG9uc2VUeXBlID0gJ3RleHQnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBSZXNwb25zZUNvbnRlbnRUeXBlLkJsb2I6XG4gICAgICAgICAgICBfeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBzZWxlY3RlZCByZXNwb25zZVR5cGUgaXMgbm90IHN1cHBvcnRlZCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIF94aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZCk7XG4gICAgICBfeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvcik7XG5cbiAgICAgIF94aHIuc2VuZCh0aGlzLnJlcXVlc3QuZ2V0Qm9keSgpKTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgX3hoci5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgb25Mb2FkKTtcbiAgICAgICAgX3hoci5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIG9uRXJyb3IpO1xuICAgICAgICBfeGhyLmFib3J0KCk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgc2V0RGV0ZWN0ZWRDb250ZW50VHlwZShyZXE6IGFueSAvKiogVE9ETyBSZXF1ZXN0ICovLCBfeGhyOiBhbnkgLyoqIFhNTEh0dHBSZXF1ZXN0ICovKSB7XG4gICAgLy8gU2tpcCBpZiBhIGN1c3RvbSBDb250ZW50LVR5cGUgaGVhZGVyIGlzIHByb3ZpZGVkXG4gICAgaWYgKHJlcS5oZWFkZXJzICE9IG51bGwgJiYgcmVxLmhlYWRlcnMuZ2V0KCdDb250ZW50LVR5cGUnKSAhPSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBkZXRlY3RlZCBjb250ZW50IHR5cGVcbiAgICBzd2l0Y2ggKHJlcS5jb250ZW50VHlwZSkge1xuICAgICAgY2FzZSBDb250ZW50VHlwZS5OT05FOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29udGVudFR5cGUuSlNPTjpcbiAgICAgICAgX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgQ29udGVudFR5cGUuRk9STTpcbiAgICAgICAgX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbnRlbnRUeXBlLlRFWFQ6XG4gICAgICAgIF94aHIuc2V0UmVxdWVzdEhlYWRlcignY29udGVudC10eXBlJywgJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIENvbnRlbnRUeXBlLkJMT0I6XG4gICAgICAgIGNvbnN0IGJsb2IgPSByZXEuYmxvYigpO1xuICAgICAgICBpZiAoYmxvYi50eXBlKSB7XG4gICAgICAgICAgX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdjb250ZW50LXR5cGUnLCBibG9iLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIGBYU1JGQ29uZmlndXJhdGlvbmAgc2V0cyB1cCBDcm9zcyBTaXRlIFJlcXVlc3QgRm9yZ2VyeSAoWFNSRikgcHJvdGVjdGlvbiBmb3IgdGhlIGFwcGxpY2F0aW9uXG4gKiB1c2luZyBhIGNvb2tpZS4gU2VlIGh0dHBzOi8vd3d3Lm93YXNwLm9yZy9pbmRleC5waHAvQ3Jvc3MtU2l0ZV9SZXF1ZXN0X0ZvcmdlcnlfKENTUkYpXG4gKiBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBYU1JGLlxuICpcbiAqIEFwcGxpY2F0aW9ucyBjYW4gY29uZmlndXJlIGN1c3RvbSBjb29raWUgYW5kIGhlYWRlciBuYW1lcyBieSBiaW5kaW5nIGFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3NcbiAqIHdpdGggZGlmZmVyZW50IGBjb29raWVOYW1lYCBhbmQgYGhlYWRlck5hbWVgIHZhbHVlcy4gU2VlIHRoZSBtYWluIEhUVFAgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqXG4gKiBAZGVwcmVjYXRlZCBzZWUgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h0dHBcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIENvb2tpZVhTUkZTdHJhdGVneSBpbXBsZW1lbnRzIFhTUkZTdHJhdGVneSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfY29va2llTmFtZTogc3RyaW5nID0gJ1hTUkYtVE9LRU4nLCBwcml2YXRlIF9oZWFkZXJOYW1lOiBzdHJpbmcgPSAnWC1YU1JGLVRPS0VOJykge31cblxuICBjb25maWd1cmVSZXF1ZXN0KHJlcTogUmVxdWVzdCk6IHZvaWQge1xuICAgIGNvbnN0IHhzcmZUb2tlbiA9IGdldERPTSgpLmdldENvb2tpZSh0aGlzLl9jb29raWVOYW1lKTtcbiAgICBpZiAoeHNyZlRva2VuKSB7XG4gICAgICByZXEuaGVhZGVycy5zZXQodGhpcy5faGVhZGVyTmFtZSwgeHNyZlRva2VuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHtAbGluayBYSFJDb25uZWN0aW9ufSBpbnN0YW5jZXMuXG4gKlxuICogVGhpcyBjbGFzcyB3b3VsZCB0eXBpY2FsbHkgbm90IGJlIHVzZWQgYnkgZW5kIHVzZXJzLCBidXQgY291bGQgYmVcbiAqIG92ZXJyaWRkZW4gaWYgYSBkaWZmZXJlbnQgYmFja2VuZCBpbXBsZW1lbnRhdGlvbiBzaG91bGQgYmUgdXNlZCxcbiAqIHN1Y2ggYXMgaW4gYSBub2RlIGJhY2tlbmQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0h0dHAsIE15Tm9kZUJhY2tlbmQsIEhUVFBfUFJPVklERVJTLCBCYXNlUmVxdWVzdE9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2h0dHAnO1xuICogQENvbXBvbmVudCh7XG4gKiAgIHZpZXdQcm92aWRlcnM6IFtcbiAqICAgICBIVFRQX1BST1ZJREVSUyxcbiAqICAgICB7cHJvdmlkZTogSHR0cCwgdXNlRmFjdG9yeTogKGJhY2tlbmQsIG9wdGlvbnMpID0+IHtcbiAqICAgICAgIHJldHVybiBuZXcgSHR0cChiYWNrZW5kLCBvcHRpb25zKTtcbiAqICAgICB9LCBkZXBzOiBbTXlOb2RlQmFja2VuZCwgQmFzZVJlcXVlc3RPcHRpb25zXX1dXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihodHRwOkh0dHApIHtcbiAqICAgICBodHRwLnJlcXVlc3QoJ3Blb3BsZS5qc29uJykuc3Vic2NyaWJlKHJlcyA9PiB0aGlzLnBlb3BsZSA9IHJlcy5qc29uKCkpO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgWEhSQmFja2VuZCBpbXBsZW1lbnRzIENvbm5lY3Rpb25CYWNrZW5kIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9icm93c2VyWEhSOiBCcm93c2VyWGhyLCBwcml2YXRlIF9iYXNlUmVzcG9uc2VPcHRpb25zOiBSZXNwb25zZU9wdGlvbnMsXG4gICAgICBwcml2YXRlIF94c3JmU3RyYXRlZ3k6IFhTUkZTdHJhdGVneSkge31cblxuICBjcmVhdGVDb25uZWN0aW9uKHJlcXVlc3Q6IFJlcXVlc3QpOiBYSFJDb25uZWN0aW9uIHtcbiAgICB0aGlzLl94c3JmU3RyYXRlZ3kuY29uZmlndXJlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICByZXR1cm4gbmV3IFhIUkNvbm5lY3Rpb24ocmVxdWVzdCwgdGhpcy5fYnJvd3NlclhIUiwgdGhpcy5fYmFzZVJlc3BvbnNlT3B0aW9ucyk7XG4gIH1cbn1cbiJdfQ==