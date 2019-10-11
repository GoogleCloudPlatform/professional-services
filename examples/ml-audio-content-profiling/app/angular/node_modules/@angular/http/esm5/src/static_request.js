/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Body } from './body';
import { ContentType } from './enums';
import { Headers } from './headers';
import { normalizeMethodName } from './http_utils';
import { URLSearchParams } from './url_search_params';
// TODO(jeffbcross): properly implement body accessors
/**
 * Creates `Request` instances from provided values.
 *
 * The Request's interface is inspired by the Request constructor defined in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#request-class),
 * but is considered a static value whose body can be accessed many times. There are other
 * differences in the implementation, but this is the most significant.
 *
 * `Request` instances are typically created by higher-level classes, like {@link Http} and
 * {@link Jsonp}, but it may occasionally be useful to explicitly create `Request` instances.
 * One such example is when creating services that wrap higher-level services, like {@link Http},
 * where it may be useful to generate a `Request` with arbitrary headers and search params.
 *
 * ```typescript
 * import {Injectable, Injector} from '@angular/core';
 * import {HTTP_PROVIDERS, Http, Request, RequestMethod} from '@angular/http';
 *
 * @Injectable()
 * class AutoAuthenticator {
 *   constructor(public http:Http) {}
 *   request(url:string) {
 *     return this.http.request(new Request({
 *       method: RequestMethod.Get,
 *       url: url,
 *       search: 'password=123'
 *     }));
 *   }
 * }
 *
 * var injector = Injector.resolveAndCreate([HTTP_PROVIDERS, AutoAuthenticator]);
 * var authenticator = injector.get(AutoAuthenticator);
 * authenticator.request('people.json').subscribe(res => {
 *   //URL should have included '?password=123'
 *   console.log('people', res.json());
 * });
 * ```
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
var Request = /** @class */ (function (_super) {
    tslib_1.__extends(Request, _super);
    function Request(requestOptions) {
        var _this = _super.call(this) || this;
        // TODO: assert that url is present
        var url = requestOptions.url;
        _this.url = requestOptions.url;
        var paramsArg = requestOptions.params || requestOptions.search;
        if (paramsArg) {
            var params = void 0;
            if (typeof paramsArg === 'object' && !(paramsArg instanceof URLSearchParams)) {
                params = urlEncodeParams(paramsArg).toString();
            }
            else {
                params = paramsArg.toString();
            }
            if (params.length > 0) {
                var prefix = '?';
                if (_this.url.indexOf('?') != -1) {
                    prefix = (_this.url[_this.url.length - 1] == '&') ? '' : '&';
                }
                // TODO: just delete search-query-looking string in url?
                _this.url = url + prefix + params;
            }
        }
        _this._body = requestOptions.body;
        _this.method = normalizeMethodName(requestOptions.method);
        // TODO(jeffbcross): implement behavior
        // Defaults to 'omit', consistent with browser
        _this.headers = new Headers(requestOptions.headers);
        _this.contentType = _this.detectContentType();
        _this.withCredentials = requestOptions.withCredentials;
        _this.responseType = requestOptions.responseType;
        return _this;
    }
    /**
     * Returns the content type enum based on header options.
     */
    Request.prototype.detectContentType = function () {
        switch (this.headers.get('content-type')) {
            case 'application/json':
                return ContentType.JSON;
            case 'application/x-www-form-urlencoded':
                return ContentType.FORM;
            case 'multipart/form-data':
                return ContentType.FORM_DATA;
            case 'text/plain':
            case 'text/html':
                return ContentType.TEXT;
            case 'application/octet-stream':
                return this._body instanceof ArrayBuffer ? ContentType.ARRAY_BUFFER : ContentType.BLOB;
            default:
                return this.detectContentTypeFromBody();
        }
    };
    /**
     * Returns the content type of request's body based on its type.
     */
    Request.prototype.detectContentTypeFromBody = function () {
        if (this._body == null) {
            return ContentType.NONE;
        }
        else if (this._body instanceof URLSearchParams) {
            return ContentType.FORM;
        }
        else if (this._body instanceof FormData) {
            return ContentType.FORM_DATA;
        }
        else if (this._body instanceof Blob) {
            return ContentType.BLOB;
        }
        else if (this._body instanceof ArrayBuffer) {
            return ContentType.ARRAY_BUFFER;
        }
        else if (this._body && typeof this._body === 'object') {
            return ContentType.JSON;
        }
        else {
            return ContentType.TEXT;
        }
    };
    /**
     * Returns the request's body according to its type. If body is undefined, return
     * null.
     */
    Request.prototype.getBody = function () {
        switch (this.contentType) {
            case ContentType.JSON:
                return this.text();
            case ContentType.FORM:
                return this.text();
            case ContentType.FORM_DATA:
                return this._body;
            case ContentType.TEXT:
                return this.text();
            case ContentType.BLOB:
                return this.blob();
            case ContentType.ARRAY_BUFFER:
                return this.arrayBuffer();
            default:
                return null;
        }
    };
    return Request;
}(Body));
export { Request };
function urlEncodeParams(params) {
    var searchParams = new URLSearchParams();
    Object.keys(params).forEach(function (key) {
        var value = params[key];
        if (value && Array.isArray(value)) {
            value.forEach(function (element) { return searchParams.append(key, element.toString()); });
        }
        else {
            searchParams.append(key, value.toString());
        }
    });
    return searchParams;
}
var noop = function () { };
var ɵ0 = noop;
var w = typeof window == 'object' ? window : noop;
var FormData = w /** TODO #9100 */['FormData'] || noop;
var Blob = w /** TODO #9100 */['Blob'] || noop;
export var ArrayBuffer = w /** TODO #9100 */['ArrayBuffer'] || noop;
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGljX3JlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9odHRwL3NyYy9zdGF0aWNfcmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUMsV0FBVyxFQUFxQyxNQUFNLFNBQVMsQ0FBQztBQUN4RSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUVqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHcEQsc0RBQXNEO0FBQ3REOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Q0c7QUFDSDtJQUE2QixtQ0FBSTtJQWlCL0IsaUJBQVksY0FBMkI7UUFBdkMsWUFDRSxpQkFBTyxTQTZCUjtRQTVCQyxtQ0FBbUM7UUFDbkMsSUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQztRQUMvQixLQUFJLENBQUMsR0FBRyxHQUFHLGNBQWMsQ0FBQyxHQUFLLENBQUM7UUFDaEMsSUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLE1BQU0sSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDO1FBQ2pFLElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSSxNQUFNLFNBQVEsQ0FBQztZQUNuQixJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxZQUFZLGVBQWUsQ0FBQyxFQUFFO2dCQUM1RSxNQUFNLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ2hEO2lCQUFNO2dCQUNMLE1BQU0sR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDL0I7WUFD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Q0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzVDO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRUQsSUFBTSxJQUFJLEdBQUcsY0FBWSxDQUFDLENBQUM7O0FBQzNCLElBQU0sQ0FBQyxHQUFHLE9BQU8sTUFBTSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDcEQsSUFBTSxRQUFRLEdBQUksQ0FBUSxDQUFDLGlCQUFrQixDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUNsRSxJQUFNLElBQUksR0FBSSxDQUFRLENBQUMsaUJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQzFELE1BQU0sQ0FBQyxJQUFNLFdBQVcsR0FDbkIsQ0FBUSxDQUFDLGlCQUFrQixDQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCb2R5fSBmcm9tICcuL2JvZHknO1xuaW1wb3J0IHtDb250ZW50VHlwZSwgUmVxdWVzdE1ldGhvZCwgUmVzcG9uc2VDb250ZW50VHlwZX0gZnJvbSAnLi9lbnVtcyc7XG5pbXBvcnQge0hlYWRlcnN9IGZyb20gJy4vaGVhZGVycyc7XG5pbXBvcnQge25vcm1hbGl6ZU1ldGhvZE5hbWV9IGZyb20gJy4vaHR0cF91dGlscyc7XG5pbXBvcnQge1JlcXVlc3RBcmdzfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtVUkxTZWFyY2hQYXJhbXN9IGZyb20gJy4vdXJsX3NlYXJjaF9wYXJhbXMnO1xuXG5cbi8vIFRPRE8oamVmZmJjcm9zcyk6IHByb3Blcmx5IGltcGxlbWVudCBib2R5IGFjY2Vzc29yc1xuLyoqXG4gKiBDcmVhdGVzIGBSZXF1ZXN0YCBpbnN0YW5jZXMgZnJvbSBwcm92aWRlZCB2YWx1ZXMuXG4gKlxuICogVGhlIFJlcXVlc3QncyBpbnRlcmZhY2UgaXMgaW5zcGlyZWQgYnkgdGhlIFJlcXVlc3QgY29uc3RydWN0b3IgZGVmaW5lZCBpbiB0aGUgW0ZldGNoXG4gKiBTcGVjXShodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jcmVxdWVzdC1jbGFzcyksXG4gKiBidXQgaXMgY29uc2lkZXJlZCBhIHN0YXRpYyB2YWx1ZSB3aG9zZSBib2R5IGNhbiBiZSBhY2Nlc3NlZCBtYW55IHRpbWVzLiBUaGVyZSBhcmUgb3RoZXJcbiAqIGRpZmZlcmVuY2VzIGluIHRoZSBpbXBsZW1lbnRhdGlvbiwgYnV0IHRoaXMgaXMgdGhlIG1vc3Qgc2lnbmlmaWNhbnQuXG4gKlxuICogYFJlcXVlc3RgIGluc3RhbmNlcyBhcmUgdHlwaWNhbGx5IGNyZWF0ZWQgYnkgaGlnaGVyLWxldmVsIGNsYXNzZXMsIGxpa2Uge0BsaW5rIEh0dHB9IGFuZFxuICoge0BsaW5rIEpzb25wfSwgYnV0IGl0IG1heSBvY2Nhc2lvbmFsbHkgYmUgdXNlZnVsIHRvIGV4cGxpY2l0bHkgY3JlYXRlIGBSZXF1ZXN0YCBpbnN0YW5jZXMuXG4gKiBPbmUgc3VjaCBleGFtcGxlIGlzIHdoZW4gY3JlYXRpbmcgc2VydmljZXMgdGhhdCB3cmFwIGhpZ2hlci1sZXZlbCBzZXJ2aWNlcywgbGlrZSB7QGxpbmsgSHR0cH0sXG4gKiB3aGVyZSBpdCBtYXkgYmUgdXNlZnVsIHRvIGdlbmVyYXRlIGEgYFJlcXVlc3RgIHdpdGggYXJiaXRyYXJ5IGhlYWRlcnMgYW5kIHNlYXJjaCBwYXJhbXMuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3Rvcn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge0hUVFBfUFJPVklERVJTLCBIdHRwLCBSZXF1ZXN0LCBSZXF1ZXN0TWV0aG9kfSBmcm9tICdAYW5ndWxhci9odHRwJztcbiAqXG4gKiBASW5qZWN0YWJsZSgpXG4gKiBjbGFzcyBBdXRvQXV0aGVudGljYXRvciB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBodHRwOkh0dHApIHt9XG4gKiAgIHJlcXVlc3QodXJsOnN0cmluZykge1xuICogICAgIHJldHVybiB0aGlzLmh0dHAucmVxdWVzdChuZXcgUmVxdWVzdCh7XG4gKiAgICAgICBtZXRob2Q6IFJlcXVlc3RNZXRob2QuR2V0LFxuICogICAgICAgdXJsOiB1cmwsXG4gKiAgICAgICBzZWFyY2g6ICdwYXNzd29yZD0xMjMnXG4gKiAgICAgfSkpO1xuICogICB9XG4gKiB9XG4gKlxuICogdmFyIGluamVjdG9yID0gSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbSFRUUF9QUk9WSURFUlMsIEF1dG9BdXRoZW50aWNhdG9yXSk7XG4gKiB2YXIgYXV0aGVudGljYXRvciA9IGluamVjdG9yLmdldChBdXRvQXV0aGVudGljYXRvcik7XG4gKiBhdXRoZW50aWNhdG9yLnJlcXVlc3QoJ3Blb3BsZS5qc29uJykuc3Vic2NyaWJlKHJlcyA9PiB7XG4gKiAgIC8vVVJMIHNob3VsZCBoYXZlIGluY2x1ZGVkICc/cGFzc3dvcmQ9MTIzJ1xuICogICBjb25zb2xlLmxvZygncGVvcGxlJywgcmVzLmpzb24oKSk7XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgUmVxdWVzdCBleHRlbmRzIEJvZHkge1xuICAvKipcbiAgICogSHR0cCBtZXRob2Qgd2l0aCB3aGljaCB0byBwZXJmb3JtIHRoZSByZXF1ZXN0LlxuICAgKi9cbiAgbWV0aG9kOiBSZXF1ZXN0TWV0aG9kO1xuICAvKipcbiAgICoge0BsaW5rIEhlYWRlcnN9IGluc3RhbmNlXG4gICAqL1xuICBoZWFkZXJzOiBIZWFkZXJzO1xuICAvKiogVXJsIG9mIHRoZSByZW1vdGUgcmVzb3VyY2UgKi9cbiAgdXJsOiBzdHJpbmc7XG4gIC8qKiBUeXBlIG9mIHRoZSByZXF1ZXN0IGJvZHkgKiovXG4gIHByaXZhdGUgY29udGVudFR5cGU6IENvbnRlbnRUeXBlO1xuICAvKiogRW5hYmxlIHVzZSBjcmVkZW50aWFscyAqL1xuICB3aXRoQ3JlZGVudGlhbHM6IGJvb2xlYW47XG4gIC8qKiBCdWZmZXIgdG8gc3RvcmUgdGhlIHJlc3BvbnNlICovXG4gIHJlc3BvbnNlVHlwZTogUmVzcG9uc2VDb250ZW50VHlwZTtcbiAgY29uc3RydWN0b3IocmVxdWVzdE9wdGlvbnM6IFJlcXVlc3RBcmdzKSB7XG4gICAgc3VwZXIoKTtcbiAgICAvLyBUT0RPOiBhc3NlcnQgdGhhdCB1cmwgaXMgcHJlc2VudFxuICAgIGNvbnN0IHVybCA9IHJlcXVlc3RPcHRpb25zLnVybDtcbiAgICB0aGlzLnVybCA9IHJlcXVlc3RPcHRpb25zLnVybCAhO1xuICAgIGNvbnN0IHBhcmFtc0FyZyA9IHJlcXVlc3RPcHRpb25zLnBhcmFtcyB8fCByZXF1ZXN0T3B0aW9ucy5zZWFyY2g7XG4gICAgaWYgKHBhcmFtc0FyZykge1xuICAgICAgbGV0IHBhcmFtczogc3RyaW5nO1xuICAgICAgaWYgKHR5cGVvZiBwYXJhbXNBcmcgPT09ICdvYmplY3QnICYmICEocGFyYW1zQXJnIGluc3RhbmNlb2YgVVJMU2VhcmNoUGFyYW1zKSkge1xuICAgICAgICBwYXJhbXMgPSB1cmxFbmNvZGVQYXJhbXMocGFyYW1zQXJnKS50b1N0cmluZygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zQXJnLnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGV0IHByZWZpeCA9ICc/JztcbiAgICAgICAgaWYgKHRoaXMudXJsLmluZGV4T2YoJz8nKSAhPSAtMSkge1xuICAgICAgICAgIHByZWZpeCA9ICh0aGlzLnVybFt0aGlzLnVybC5sZW5ndGggLSAxXSA9PSAnJicpID8gJycgOiAnJic7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzoganVzdCBkZWxldGUgc2VhcmNoLXF1ZXJ5LWxvb2tpbmcgc3RyaW5nIGluIHVybD9cbiAgICAgICAgdGhpcy51cmwgPSB1cmwgKyBwcmVmaXggKyBwYXJhbXM7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2JvZHkgPSByZXF1ZXN0T3B0aW9ucy5ib2R5O1xuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kTmFtZShyZXF1ZXN0T3B0aW9ucy5tZXRob2QgISk7XG4gICAgLy8gVE9ETyhqZWZmYmNyb3NzKTogaW1wbGVtZW50IGJlaGF2aW9yXG4gICAgLy8gRGVmYXVsdHMgdG8gJ29taXQnLCBjb25zaXN0ZW50IHdpdGggYnJvd3NlclxuICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKHJlcXVlc3RPcHRpb25zLmhlYWRlcnMpO1xuICAgIHRoaXMuY29udGVudFR5cGUgPSB0aGlzLmRldGVjdENvbnRlbnRUeXBlKCk7XG4gICAgdGhpcy53aXRoQ3JlZGVudGlhbHMgPSByZXF1ZXN0T3B0aW9ucy53aXRoQ3JlZGVudGlhbHMgITtcbiAgICB0aGlzLnJlc3BvbnNlVHlwZSA9IHJlcXVlc3RPcHRpb25zLnJlc3BvbnNlVHlwZSAhO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbnRlbnQgdHlwZSBlbnVtIGJhc2VkIG9uIGhlYWRlciBvcHRpb25zLlxuICAgKi9cbiAgZGV0ZWN0Q29udGVudFR5cGUoKTogQ29udGVudFR5cGUge1xuICAgIHN3aXRjaCAodGhpcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykpIHtcbiAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL2pzb24nOlxuICAgICAgICByZXR1cm4gQ29udGVudFR5cGUuSlNPTjtcbiAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc6XG4gICAgICAgIHJldHVybiBDb250ZW50VHlwZS5GT1JNO1xuICAgICAgY2FzZSAnbXVsdGlwYXJ0L2Zvcm0tZGF0YSc6XG4gICAgICAgIHJldHVybiBDb250ZW50VHlwZS5GT1JNX0RBVEE7XG4gICAgICBjYXNlICd0ZXh0L3BsYWluJzpcbiAgICAgIGNhc2UgJ3RleHQvaHRtbCc6XG4gICAgICAgIHJldHVybiBDb250ZW50VHlwZS5URVhUO1xuICAgICAgY2FzZSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvZHkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciA/IENvbnRlbnRUeXBlLkFSUkFZX0JVRkZFUiA6IENvbnRlbnRUeXBlLkJMT0I7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5kZXRlY3RDb250ZW50VHlwZUZyb21Cb2R5KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbnRlbnQgdHlwZSBvZiByZXF1ZXN0J3MgYm9keSBiYXNlZCBvbiBpdHMgdHlwZS5cbiAgICovXG4gIGRldGVjdENvbnRlbnRUeXBlRnJvbUJvZHkoKTogQ29udGVudFR5cGUge1xuICAgIGlmICh0aGlzLl9ib2R5ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBDb250ZW50VHlwZS5OT05FO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keSBpbnN0YW5jZW9mIFVSTFNlYXJjaFBhcmFtcykge1xuICAgICAgcmV0dXJuIENvbnRlbnRUeXBlLkZPUk07XG4gICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgIHJldHVybiBDb250ZW50VHlwZS5GT1JNX0RBVEE7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5IGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgcmV0dXJuIENvbnRlbnRUeXBlLkJMT0I7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBDb250ZW50VHlwZS5BUlJBWV9CVUZGRVI7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5ICYmIHR5cGVvZiB0aGlzLl9ib2R5ID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIENvbnRlbnRUeXBlLkpTT047XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBDb250ZW50VHlwZS5URVhUO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSByZXF1ZXN0J3MgYm9keSBhY2NvcmRpbmcgdG8gaXRzIHR5cGUuIElmIGJvZHkgaXMgdW5kZWZpbmVkLCByZXR1cm5cbiAgICogbnVsbC5cbiAgICovXG4gIGdldEJvZHkoKTogYW55IHtcbiAgICBzd2l0Y2ggKHRoaXMuY29udGVudFR5cGUpIHtcbiAgICAgIGNhc2UgQ29udGVudFR5cGUuSlNPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpO1xuICAgICAgY2FzZSBDb250ZW50VHlwZS5GT1JNOlxuICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCk7XG4gICAgICBjYXNlIENvbnRlbnRUeXBlLkZPUk1fREFUQTpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JvZHk7XG4gICAgICBjYXNlIENvbnRlbnRUeXBlLlRFWFQ6XG4gICAgICAgIHJldHVybiB0aGlzLnRleHQoKTtcbiAgICAgIGNhc2UgQ29udGVudFR5cGUuQkxPQjpcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpO1xuICAgICAgY2FzZSBDb250ZW50VHlwZS5BUlJBWV9CVUZGRVI6XG4gICAgICAgIHJldHVybiB0aGlzLmFycmF5QnVmZmVyKCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdXJsRW5jb2RlUGFyYW1zKHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0pOiBVUkxTZWFyY2hQYXJhbXMge1xuICBjb25zdCBzZWFyY2hQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKCk7XG4gIE9iamVjdC5rZXlzKHBhcmFtcykuZm9yRWFjaChrZXkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gcGFyYW1zW2tleV07XG4gICAgaWYgKHZhbHVlICYmIEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB2YWx1ZS5mb3JFYWNoKGVsZW1lbnQgPT4gc2VhcmNoUGFyYW1zLmFwcGVuZChrZXksIGVsZW1lbnQudG9TdHJpbmcoKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWFyY2hQYXJhbXMuYXBwZW5kKGtleSwgdmFsdWUudG9TdHJpbmcoKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHNlYXJjaFBhcmFtcztcbn1cblxuY29uc3Qgbm9vcCA9IGZ1bmN0aW9uKCkge307XG5jb25zdCB3ID0gdHlwZW9mIHdpbmRvdyA9PSAnb2JqZWN0JyA/IHdpbmRvdyA6IG5vb3A7XG5jb25zdCBGb3JtRGF0YSA9ICh3IGFzIGFueSAvKiogVE9ETyAjOTEwMCAqLylbJ0Zvcm1EYXRhJ10gfHwgbm9vcDtcbmNvbnN0IEJsb2IgPSAodyBhcyBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pWydCbG9iJ10gfHwgbm9vcDtcbmV4cG9ydCBjb25zdCBBcnJheUJ1ZmZlcjogQXJyYXlCdWZmZXJDb25zdHJ1Y3RvciA9XG4gICAgKHcgYXMgYW55IC8qKiBUT0RPICM5MTAwICovKVsnQXJyYXlCdWZmZXInXSB8fCBub29wO1xuIl19