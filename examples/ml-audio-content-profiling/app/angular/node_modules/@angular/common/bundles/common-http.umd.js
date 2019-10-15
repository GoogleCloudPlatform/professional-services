/**
 * @license Angular v7.0.4
 * (c) 2010-2018 Google, Inc. https://angular.io/
 * License: MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('rxjs'), require('rxjs/operators'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('@angular/common/http', ['exports', '@angular/core', 'rxjs', 'rxjs/operators', '@angular/common'], factory) :
    (factory((global.ng = global.ng || {}, global.ng.common = global.ng.common || {}, global.ng.common.http = {}),global.ng.core,global.rxjs,global.rxjs.operators,global.ng.common));
}(this, (function (exports,core,rxjs,operators,common) { 'use strict';

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Transforms an `HttpRequest` into a stream of `HttpEvent`s, one of which will likely be a
     * `HttpResponse`.
     *
     * `HttpHandler` is injectable. When injected, the handler instance dispatches requests to the
     * first interceptor in the chain, which dispatches to the second, etc, eventually reaching the
     * `HttpBackend`.
     *
     * In an `HttpInterceptor`, the `HttpHandler` parameter is the next interceptor in the chain.
     *
     * @publicApi
     */
    var HttpHandler = /** @class */ (function () {
        function HttpHandler() {
        }
        return HttpHandler;
    }());
    /**
     * A final `HttpHandler` which will dispatch the request via browser HTTP APIs to a backend.
     *
     * Interceptors sit between the `HttpClient` interface and the `HttpBackend`.
     *
     * When injected, `HttpBackend` dispatches requests directly to the backend, without going
     * through the interceptor chain.
     *
     * @publicApi
     */
    var HttpBackend = /** @class */ (function () {
        function HttpBackend() {
        }
        return HttpBackend;
    }());

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Immutable set of Http headers, with lazy parsing.
     *
     * @publicApi
     */
    var HttpHeaders = /** @class */ (function () {
        function HttpHeaders(headers) {
            var _this = this;
            /**
             * Internal map of lowercased header names to the normalized
             * form of the name (the form seen first).
             */
            this.normalizedNames = new Map();
            /**
             * Queued updates to be materialized the next initialization.
             */
            this.lazyUpdate = null;
            if (!headers) {
                this.headers = new Map();
            }
            else if (typeof headers === 'string') {
                this.lazyInit = function () {
                    _this.headers = new Map();
                    headers.split('\n').forEach(function (line) {
                        var index = line.indexOf(':');
                        if (index > 0) {
                            var name_1 = line.slice(0, index);
                            var key = name_1.toLowerCase();
                            var value = line.slice(index + 1).trim();
                            _this.maybeSetNormalizedName(name_1, key);
                            if (_this.headers.has(key)) {
                                _this.headers.get(key).push(value);
                            }
                            else {
                                _this.headers.set(key, [value]);
                            }
                        }
                    });
                };
            }
            else {
                this.lazyInit = function () {
                    _this.headers = new Map();
                    Object.keys(headers).forEach(function (name) {
                        var values = headers[name];
                        var key = name.toLowerCase();
                        if (typeof values === 'string') {
                            values = [values];
                        }
                        if (values.length > 0) {
                            _this.headers.set(key, values);
                            _this.maybeSetNormalizedName(name, key);
                        }
                    });
                };
            }
        }
        /**
         * Checks for existence of header by given name.
         */
        HttpHeaders.prototype.has = function (name) {
            this.init();
            return this.headers.has(name.toLowerCase());
        };
        /**
         * Returns first header that matches given name.
         */
        HttpHeaders.prototype.get = function (name) {
            this.init();
            var values = this.headers.get(name.toLowerCase());
            return values && values.length > 0 ? values[0] : null;
        };
        /**
         * Returns the names of the headers
         */
        HttpHeaders.prototype.keys = function () {
            this.init();
            return Array.from(this.normalizedNames.values());
        };
        /**
         * Returns list of header values for a given name.
         */
        HttpHeaders.prototype.getAll = function (name) {
            this.init();
            return this.headers.get(name.toLowerCase()) || null;
        };
        HttpHeaders.prototype.append = function (name, value) {
            return this.clone({ name: name, value: value, op: 'a' });
        };
        HttpHeaders.prototype.set = function (name, value) {
            return this.clone({ name: name, value: value, op: 's' });
        };
        HttpHeaders.prototype.delete = function (name, value) {
            return this.clone({ name: name, value: value, op: 'd' });
        };
        HttpHeaders.prototype.maybeSetNormalizedName = function (name, lcName) {
            if (!this.normalizedNames.has(lcName)) {
                this.normalizedNames.set(lcName, name);
            }
        };
        HttpHeaders.prototype.init = function () {
            var _this = this;
            if (!!this.lazyInit) {
                if (this.lazyInit instanceof HttpHeaders) {
                    this.copyFrom(this.lazyInit);
                }
                else {
                    this.lazyInit();
                }
                this.lazyInit = null;
                if (!!this.lazyUpdate) {
                    this.lazyUpdate.forEach(function (update) { return _this.applyUpdate(update); });
                    this.lazyUpdate = null;
                }
            }
        };
        HttpHeaders.prototype.copyFrom = function (other) {
            var _this = this;
            other.init();
            Array.from(other.headers.keys()).forEach(function (key) {
                _this.headers.set(key, other.headers.get(key));
                _this.normalizedNames.set(key, other.normalizedNames.get(key));
            });
        };
        HttpHeaders.prototype.clone = function (update) {
            var clone = new HttpHeaders();
            clone.lazyInit =
                (!!this.lazyInit && this.lazyInit instanceof HttpHeaders) ? this.lazyInit : this;
            clone.lazyUpdate = (this.lazyUpdate || []).concat([update]);
            return clone;
        };
        HttpHeaders.prototype.applyUpdate = function (update) {
            var key = update.name.toLowerCase();
            switch (update.op) {
                case 'a':
                case 's':
                    var value = update.value;
                    if (typeof value === 'string') {
                        value = [value];
                    }
                    if (value.length === 0) {
                        return;
                    }
                    this.maybeSetNormalizedName(update.name, key);
                    var base = (update.op === 'a' ? this.headers.get(key) : undefined) || [];
                    base.push.apply(base, __spread(value));
                    this.headers.set(key, base);
                    break;
                case 'd':
                    var toDelete_1 = update.value;
                    if (!toDelete_1) {
                        this.headers.delete(key);
                        this.normalizedNames.delete(key);
                    }
                    else {
                        var existing = this.headers.get(key);
                        if (!existing) {
                            return;
                        }
                        existing = existing.filter(function (value) { return toDelete_1.indexOf(value) === -1; });
                        if (existing.length === 0) {
                            this.headers.delete(key);
                            this.normalizedNames.delete(key);
                        }
                        else {
                            this.headers.set(key, existing);
                        }
                    }
                    break;
            }
        };
        /**
         * @internal
         */
        HttpHeaders.prototype.forEach = function (fn) {
            var _this = this;
            this.init();
            Array.from(this.normalizedNames.keys())
                .forEach(function (key) { return fn(_this.normalizedNames.get(key), _this.headers.get(key)); });
        };
        return HttpHeaders;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A `HttpParameterCodec` that uses `encodeURIComponent` and `decodeURIComponent` to
     * serialize and parse URL parameter keys and values.
     *
     * @publicApi
     */
    var HttpUrlEncodingCodec = /** @class */ (function () {
        function HttpUrlEncodingCodec() {
        }
        HttpUrlEncodingCodec.prototype.encodeKey = function (key) { return standardEncoding(key); };
        HttpUrlEncodingCodec.prototype.encodeValue = function (value) { return standardEncoding(value); };
        HttpUrlEncodingCodec.prototype.decodeKey = function (key) { return decodeURIComponent(key); };
        HttpUrlEncodingCodec.prototype.decodeValue = function (value) { return decodeURIComponent(value); };
        return HttpUrlEncodingCodec;
    }());
    function paramParser(rawParams, codec) {
        var map = new Map();
        if (rawParams.length > 0) {
            var params = rawParams.split('&');
            params.forEach(function (param) {
                var eqIdx = param.indexOf('=');
                var _a = __read(eqIdx == -1 ?
                    [codec.decodeKey(param), ''] :
                    [codec.decodeKey(param.slice(0, eqIdx)), codec.decodeValue(param.slice(eqIdx + 1))], 2), key = _a[0], val = _a[1];
                var list = map.get(key) || [];
                list.push(val);
                map.set(key, list);
            });
        }
        return map;
    }
    function standardEncoding(v) {
        return encodeURIComponent(v)
            .replace(/%40/gi, '@')
            .replace(/%3A/gi, ':')
            .replace(/%24/gi, '$')
            .replace(/%2C/gi, ',')
            .replace(/%3B/gi, ';')
            .replace(/%2B/gi, '+')
            .replace(/%3D/gi, '=')
            .replace(/%3F/gi, '?')
            .replace(/%2F/gi, '/');
    }
    /**
     * An HTTP request/response body that represents serialized parameters,
     * per the MIME type `application/x-www-form-urlencoded`.
     *
     * This class is immutable - all mutation operations return a new instance.
     *
     * @publicApi
     */
    var HttpParams = /** @class */ (function () {
        function HttpParams(options) {
            if (options === void 0) { options = {}; }
            var _this = this;
            this.updates = null;
            this.cloneFrom = null;
            this.encoder = options.encoder || new HttpUrlEncodingCodec();
            if (!!options.fromString) {
                if (!!options.fromObject) {
                    throw new Error("Cannot specify both fromString and fromObject.");
                }
                this.map = paramParser(options.fromString, this.encoder);
            }
            else if (!!options.fromObject) {
                this.map = new Map();
                Object.keys(options.fromObject).forEach(function (key) {
                    var value = options.fromObject[key];
                    _this.map.set(key, Array.isArray(value) ? value : [value]);
                });
            }
            else {
                this.map = null;
            }
        }
        /**
         * Check whether the body has one or more values for the given parameter name.
         */
        HttpParams.prototype.has = function (param) {
            this.init();
            return this.map.has(param);
        };
        /**
         * Get the first value for the given parameter name, or `null` if it's not present.
         */
        HttpParams.prototype.get = function (param) {
            this.init();
            var res = this.map.get(param);
            return !!res ? res[0] : null;
        };
        /**
         * Get all values for the given parameter name, or `null` if it's not present.
         */
        HttpParams.prototype.getAll = function (param) {
            this.init();
            return this.map.get(param) || null;
        };
        /**
         * Get all the parameter names for this body.
         */
        HttpParams.prototype.keys = function () {
            this.init();
            return Array.from(this.map.keys());
        };
        /**
         * Construct a new body with an appended value for the given parameter name.
         */
        HttpParams.prototype.append = function (param, value) { return this.clone({ param: param, value: value, op: 'a' }); };
        /**
         * Construct a new body with a new value for the given parameter name.
         */
        HttpParams.prototype.set = function (param, value) { return this.clone({ param: param, value: value, op: 's' }); };
        /**
         * Construct a new body with either the given value for the given parameter
         * removed, if a value is given, or all values for the given parameter removed
         * if not.
         */
        HttpParams.prototype.delete = function (param, value) { return this.clone({ param: param, value: value, op: 'd' }); };
        /**
         * Serialize the body to an encoded string, where key-value pairs (separated by `=`) are
         * separated by `&`s.
         */
        HttpParams.prototype.toString = function () {
            var _this = this;
            this.init();
            return this.keys()
                .map(function (key) {
                var eKey = _this.encoder.encodeKey(key);
                return _this.map.get(key).map(function (value) { return eKey + '=' + _this.encoder.encodeValue(value); })
                    .join('&');
            })
                .join('&');
        };
        HttpParams.prototype.clone = function (update) {
            var clone = new HttpParams({ encoder: this.encoder });
            clone.cloneFrom = this.cloneFrom || this;
            clone.updates = (this.updates || []).concat([update]);
            return clone;
        };
        HttpParams.prototype.init = function () {
            var _this = this;
            if (this.map === null) {
                this.map = new Map();
            }
            if (this.cloneFrom !== null) {
                this.cloneFrom.init();
                this.cloneFrom.keys().forEach(function (key) { return _this.map.set(key, _this.cloneFrom.map.get(key)); });
                this.updates.forEach(function (update) {
                    switch (update.op) {
                        case 'a':
                        case 's':
                            var base = (update.op === 'a' ? _this.map.get(update.param) : undefined) || [];
                            base.push(update.value);
                            _this.map.set(update.param, base);
                            break;
                        case 'd':
                            if (update.value !== undefined) {
                                var base_1 = _this.map.get(update.param) || [];
                                var idx = base_1.indexOf(update.value);
                                if (idx !== -1) {
                                    base_1.splice(idx, 1);
                                }
                                if (base_1.length > 0) {
                                    _this.map.set(update.param, base_1);
                                }
                                else {
                                    _this.map.delete(update.param);
                                }
                            }
                            else {
                                _this.map.delete(update.param);
                                break;
                            }
                    }
                });
                this.cloneFrom = null;
            }
        };
        return HttpParams;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Determine whether the given HTTP method may include a body.
     */
    function mightHaveBody(method) {
        switch (method) {
            case 'DELETE':
            case 'GET':
            case 'HEAD':
            case 'OPTIONS':
            case 'JSONP':
                return false;
            default:
                return true;
        }
    }
    /**
     * Safely assert whether the given value is an ArrayBuffer.
     *
     * In some execution environments ArrayBuffer is not defined.
     */
    function isArrayBuffer(value) {
        return typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer;
    }
    /**
     * Safely assert whether the given value is a Blob.
     *
     * In some execution environments Blob is not defined.
     */
    function isBlob(value) {
        return typeof Blob !== 'undefined' && value instanceof Blob;
    }
    /**
     * Safely assert whether the given value is a FormData instance.
     *
     * In some execution environments FormData is not defined.
     */
    function isFormData(value) {
        return typeof FormData !== 'undefined' && value instanceof FormData;
    }
    /**
     * An outgoing HTTP request with an optional typed body.
     *
     * `HttpRequest` represents an outgoing request, including URL, method,
     * headers, body, and other request configuration options. Instances should be
     * assumed to be immutable. To modify a `HttpRequest`, the `clone`
     * method should be used.
     *
     * @publicApi
     */
    var HttpRequest = /** @class */ (function () {
        function HttpRequest(method, url, third, fourth) {
            this.url = url;
            /**
             * The request body, or `null` if one isn't set.
             *
             * Bodies are not enforced to be immutable, as they can include a reference to any
             * user-defined data type. However, interceptors should take care to preserve
             * idempotence by treating them as such.
             */
            this.body = null;
            /**
             * Whether this request should be made in a way that exposes progress events.
             *
             * Progress events are expensive (change detection runs on each event) and so
             * they should only be requested if the consumer intends to monitor them.
             */
            this.reportProgress = false;
            /**
             * Whether this request should be sent with outgoing credentials (cookies).
             */
            this.withCredentials = false;
            /**
             * The expected response type of the server.
             *
             * This is used to parse the response appropriately before returning it to
             * the requestee.
             */
            this.responseType = 'json';
            this.method = method.toUpperCase();
            // Next, need to figure out which argument holds the HttpRequestInit
            // options, if any.
            var options;
            // Check whether a body argument is expected. The only valid way to omit
            // the body argument is to use a known no-body method like GET.
            if (mightHaveBody(this.method) || !!fourth) {
                // Body is the third argument, options are the fourth.
                this.body = (third !== undefined) ? third : null;
                options = fourth;
            }
            else {
                // No body required, options are the third argument. The body stays null.
                options = third;
            }
            // If options have been passed, interpret them.
            if (options) {
                // Normalize reportProgress and withCredentials.
                this.reportProgress = !!options.reportProgress;
                this.withCredentials = !!options.withCredentials;
                // Override default response type of 'json' if one is provided.
                if (!!options.responseType) {
                    this.responseType = options.responseType;
                }
                // Override headers if they're provided.
                if (!!options.headers) {
                    this.headers = options.headers;
                }
                if (!!options.params) {
                    this.params = options.params;
                }
            }
            // If no headers have been passed in, construct a new HttpHeaders instance.
            if (!this.headers) {
                this.headers = new HttpHeaders();
            }
            // If no parameters have been passed in, construct a new HttpUrlEncodedParams instance.
            if (!this.params) {
                this.params = new HttpParams();
                this.urlWithParams = url;
            }
            else {
                // Encode the parameters to a string in preparation for inclusion in the URL.
                var params = this.params.toString();
                if (params.length === 0) {
                    // No parameters, the visible URL is just the URL given at creation time.
                    this.urlWithParams = url;
                }
                else {
                    // Does the URL already have query parameters? Look for '?'.
                    var qIdx = url.indexOf('?');
                    // There are 3 cases to handle:
                    // 1) No existing parameters -> append '?' followed by params.
                    // 2) '?' exists and is followed by existing query string ->
                    //    append '&' followed by params.
                    // 3) '?' exists at the end of the url -> append params directly.
                    // This basically amounts to determining the character, if any, with
                    // which to join the URL and parameters.
                    var sep = qIdx === -1 ? '?' : (qIdx < url.length - 1 ? '&' : '');
                    this.urlWithParams = url + sep + params;
                }
            }
        }
        /**
         * Transform the free-form body into a serialized format suitable for
         * transmission to the server.
         */
        HttpRequest.prototype.serializeBody = function () {
            // If no body is present, no need to serialize it.
            if (this.body === null) {
                return null;
            }
            // Check whether the body is already in a serialized form. If so,
            // it can just be returned directly.
            if (isArrayBuffer(this.body) || isBlob(this.body) || isFormData(this.body) ||
                typeof this.body === 'string') {
                return this.body;
            }
            // Check whether the body is an instance of HttpUrlEncodedParams.
            if (this.body instanceof HttpParams) {
                return this.body.toString();
            }
            // Check whether the body is an object or array, and serialize with JSON if so.
            if (typeof this.body === 'object' || typeof this.body === 'boolean' ||
                Array.isArray(this.body)) {
                return JSON.stringify(this.body);
            }
            // Fall back on toString() for everything else.
            return this.body.toString();
        };
        /**
         * Examine the body and attempt to infer an appropriate MIME type
         * for it.
         *
         * If no such type can be inferred, this method will return `null`.
         */
        HttpRequest.prototype.detectContentTypeHeader = function () {
            // An empty body has no content type.
            if (this.body === null) {
                return null;
            }
            // FormData bodies rely on the browser's content type assignment.
            if (isFormData(this.body)) {
                return null;
            }
            // Blobs usually have their own content type. If it doesn't, then
            // no type can be inferred.
            if (isBlob(this.body)) {
                return this.body.type || null;
            }
            // Array buffers have unknown contents and thus no type can be inferred.
            if (isArrayBuffer(this.body)) {
                return null;
            }
            // Technically, strings could be a form of JSON data, but it's safe enough
            // to assume they're plain strings.
            if (typeof this.body === 'string') {
                return 'text/plain';
            }
            // `HttpUrlEncodedParams` has its own content-type.
            if (this.body instanceof HttpParams) {
                return 'application/x-www-form-urlencoded;charset=UTF-8';
            }
            // Arrays, objects, and numbers will be encoded as JSON.
            if (typeof this.body === 'object' || typeof this.body === 'number' ||
                Array.isArray(this.body)) {
                return 'application/json';
            }
            // No type could be inferred.
            return null;
        };
        HttpRequest.prototype.clone = function (update) {
            if (update === void 0) { update = {}; }
            // For method, url, and responseType, take the current value unless
            // it is overridden in the update hash.
            var method = update.method || this.method;
            var url = update.url || this.url;
            var responseType = update.responseType || this.responseType;
            // The body is somewhat special - a `null` value in update.body means
            // whatever current body is present is being overridden with an empty
            // body, whereas an `undefined` value in update.body implies no
            // override.
            var body = (update.body !== undefined) ? update.body : this.body;
            // Carefully handle the boolean options to differentiate between
            // `false` and `undefined` in the update args.
            var withCredentials = (update.withCredentials !== undefined) ? update.withCredentials : this.withCredentials;
            var reportProgress = (update.reportProgress !== undefined) ? update.reportProgress : this.reportProgress;
            // Headers and params may be appended to if `setHeaders` or
            // `setParams` are used.
            var headers = update.headers || this.headers;
            var params = update.params || this.params;
            // Check whether the caller has asked to add headers.
            if (update.setHeaders !== undefined) {
                // Set every requested header.
                headers =
                    Object.keys(update.setHeaders)
                        .reduce(function (headers, name) { return headers.set(name, update.setHeaders[name]); }, headers);
            }
            // Check whether the caller has asked to set params.
            if (update.setParams) {
                // Set every requested param.
                params = Object.keys(update.setParams)
                    .reduce(function (params, param) { return params.set(param, update.setParams[param]); }, params);
            }
            // Finally, construct the new HttpRequest using the pieces from above.
            return new HttpRequest(method, url, body, {
                params: params, headers: headers, reportProgress: reportProgress, responseType: responseType, withCredentials: withCredentials,
            });
        };
        return HttpRequest;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    (function (HttpEventType) {
        /**
         * The request was sent out over the wire.
         */
        HttpEventType[HttpEventType["Sent"] = 0] = "Sent";
        /**
         * An upload progress event was received.
         */
        HttpEventType[HttpEventType["UploadProgress"] = 1] = "UploadProgress";
        /**
         * The response status code and headers were received.
         */
        HttpEventType[HttpEventType["ResponseHeader"] = 2] = "ResponseHeader";
        /**
         * A download progress event was received.
         */
        HttpEventType[HttpEventType["DownloadProgress"] = 3] = "DownloadProgress";
        /**
         * The full response including the body was received.
         */
        HttpEventType[HttpEventType["Response"] = 4] = "Response";
        /**
         * A custom event from an interceptor or a backend.
         */
        HttpEventType[HttpEventType["User"] = 5] = "User";
    })(exports.HttpEventType || (exports.HttpEventType = {}));
    /**
     * Base class for both `HttpResponse` and `HttpHeaderResponse`.
     *
     * @publicApi
     */
    var HttpResponseBase = /** @class */ (function () {
        /**
         * Super-constructor for all responses.
         *
         * The single parameter accepted is an initialization hash. Any properties
         * of the response passed there will override the default values.
         */
        function HttpResponseBase(init, defaultStatus, defaultStatusText) {
            if (defaultStatus === void 0) { defaultStatus = 200; }
            if (defaultStatusText === void 0) { defaultStatusText = 'OK'; }
            // If the hash has values passed, use them to initialize the response.
            // Otherwise use the default values.
            this.headers = init.headers || new HttpHeaders();
            this.status = init.status !== undefined ? init.status : defaultStatus;
            this.statusText = init.statusText || defaultStatusText;
            this.url = init.url || null;
            // Cache the ok value to avoid defining a getter.
            this.ok = this.status >= 200 && this.status < 300;
        }
        return HttpResponseBase;
    }());
    /**
     * A partial HTTP response which only includes the status and header data,
     * but no response body.
     *
     * `HttpHeaderResponse` is a `HttpEvent` available on the response
     * event stream, only when progress events are requested.
     *
     * @publicApi
     */
    var HttpHeaderResponse = /** @class */ (function (_super) {
        __extends(HttpHeaderResponse, _super);
        /**
         * Create a new `HttpHeaderResponse` with the given parameters.
         */
        function HttpHeaderResponse(init) {
            if (init === void 0) { init = {}; }
            var _this = _super.call(this, init) || this;
            _this.type = exports.HttpEventType.ResponseHeader;
            return _this;
        }
        /**
         * Copy this `HttpHeaderResponse`, overriding its contents with the
         * given parameter hash.
         */
        HttpHeaderResponse.prototype.clone = function (update) {
            if (update === void 0) { update = {}; }
            // Perform a straightforward initialization of the new HttpHeaderResponse,
            // overriding the current parameters with new ones if given.
            return new HttpHeaderResponse({
                headers: update.headers || this.headers,
                status: update.status !== undefined ? update.status : this.status,
                statusText: update.statusText || this.statusText,
                url: update.url || this.url || undefined,
            });
        };
        return HttpHeaderResponse;
    }(HttpResponseBase));
    /**
     * A full HTTP response, including a typed response body (which may be `null`
     * if one was not returned).
     *
     * `HttpResponse` is a `HttpEvent` available on the response event
     * stream.
     *
     * @publicApi
     */
    var HttpResponse = /** @class */ (function (_super) {
        __extends(HttpResponse, _super);
        /**
         * Construct a new `HttpResponse`.
         */
        function HttpResponse(init) {
            if (init === void 0) { init = {}; }
            var _this = _super.call(this, init) || this;
            _this.type = exports.HttpEventType.Response;
            _this.body = init.body !== undefined ? init.body : null;
            return _this;
        }
        HttpResponse.prototype.clone = function (update) {
            if (update === void 0) { update = {}; }
            return new HttpResponse({
                body: (update.body !== undefined) ? update.body : this.body,
                headers: update.headers || this.headers,
                status: (update.status !== undefined) ? update.status : this.status,
                statusText: update.statusText || this.statusText,
                url: update.url || this.url || undefined,
            });
        };
        return HttpResponse;
    }(HttpResponseBase));
    /**
     * A response that represents an error or failure, either from a
     * non-successful HTTP status, an error while executing the request,
     * or some other failure which occurred during the parsing of the response.
     *
     * Any error returned on the `Observable` response stream will be
     * wrapped in an `HttpErrorResponse` to provide additional context about
     * the state of the HTTP layer when the error occurred. The error property
     * will contain either a wrapped Error object or the error response returned
     * from the server.
     *
     * @publicApi
     */
    var HttpErrorResponse = /** @class */ (function (_super) {
        __extends(HttpErrorResponse, _super);
        function HttpErrorResponse(init) {
            var _this = 
            // Initialize with a default status of 0 / Unknown Error.
            _super.call(this, init, 0, 'Unknown Error') || this;
            _this.name = 'HttpErrorResponse';
            /**
             * Errors are never okay, even when the status code is in the 2xx success range.
             */
            _this.ok = false;
            // If the response was successful, then this was a parse error. Otherwise, it was
            // a protocol-level failure of some sort. Either the request failed in transit
            // or the server returned an unsuccessful status code.
            if (_this.status >= 200 && _this.status < 300) {
                _this.message = "Http failure during parsing for " + (init.url || '(unknown url)');
            }
            else {
                _this.message =
                    "Http failure response for " + (init.url || '(unknown url)') + ": " + init.status + " " + init.statusText;
            }
            _this.error = init.error || null;
            return _this;
        }
        return HttpErrorResponse;
    }(HttpResponseBase));

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Construct an instance of `HttpRequestOptions<T>` from a source `HttpMethodOptions` and
     * the given `body`. Basically, this clones the object and adds the body.
     */
    function addBody(options, body) {
        return {
            body: body,
            headers: options.headers,
            observe: options.observe,
            params: options.params,
            reportProgress: options.reportProgress,
            responseType: options.responseType,
            withCredentials: options.withCredentials,
        };
    }
    /**
     * Perform HTTP requests.
     *
     * `HttpClient` is available as an injectable class, with methods to perform HTTP requests.
     * Each request method has multiple signatures, and the return type varies according to which
     * signature is called (mainly the values of `observe` and `responseType`).
     *
     * @publicApi
     */
    var HttpClient = /** @class */ (function () {
        function HttpClient(handler) {
            this.handler = handler;
        }
        /**
         * Constructs an `Observable` for a particular HTTP request that, when subscribed,
         * fires the request through the chain of registered interceptors and on to the
         * server.
         *
         * This method can be called in one of two ways. Either an `HttpRequest`
         * instance can be passed directly as the only parameter, or a method can be
         * passed as the first parameter, a string URL as the second, and an
         * options hash as the third.
         *
         * If a `HttpRequest` object is passed directly, an `Observable` of the
         * raw `HttpEvent` stream will be returned.
         *
         * If a request is instead built by providing a URL, the options object
         * determines the return type of `request()`. In addition to configuring
         * request parameters such as the outgoing headers and/or the body, the options
         * hash specifies two key pieces of information about the request: the
         * `responseType` and what to `observe`.
         *
         * The `responseType` value determines how a successful response body will be
         * parsed. If `responseType` is the default `json`, a type interface for the
         * resulting object may be passed as a type parameter to `request()`.
         *
         * The `observe` value determines the return type of `request()`, based on what
         * the consumer is interested in observing. A value of `events` will return an
         * `Observable<HttpEvent>` representing the raw `HttpEvent` stream,
         * including progress events by default. A value of `response` will return an
         * `Observable<HttpResponse<T>>` where the `T` parameter of `HttpResponse`
         * depends on the `responseType` and any optionally provided type parameter.
         * A value of `body` will return an `Observable<T>` with the same `T` body type.
         */
        HttpClient.prototype.request = function (first, url, options) {
            var _this = this;
            if (options === void 0) { options = {}; }
            var req;
            // Firstly, check whether the primary argument is an instance of `HttpRequest`.
            if (first instanceof HttpRequest) {
                // It is. The other arguments must be undefined (per the signatures) and can be
                // ignored.
                req = first;
            }
            else {
                // It's a string, so it represents a URL. Construct a request based on it,
                // and incorporate the remaining arguments (assuming GET unless a method is
                // provided.
                // Figure out the headers.
                var headers = undefined;
                if (options.headers instanceof HttpHeaders) {
                    headers = options.headers;
                }
                else {
                    headers = new HttpHeaders(options.headers);
                }
                // Sort out parameters.
                var params = undefined;
                if (!!options.params) {
                    if (options.params instanceof HttpParams) {
                        params = options.params;
                    }
                    else {
                        params = new HttpParams({ fromObject: options.params });
                    }
                }
                // Construct the request.
                req = new HttpRequest(first, url, (options.body !== undefined ? options.body : null), {
                    headers: headers,
                    params: params,
                    reportProgress: options.reportProgress,
                    // By default, JSON is assumed to be returned for all calls.
                    responseType: options.responseType || 'json',
                    withCredentials: options.withCredentials,
                });
            }
            // Start with an Observable.of() the initial request, and run the handler (which
            // includes all interceptors) inside a concatMap(). This way, the handler runs
            // inside an Observable chain, which causes interceptors to be re-run on every
            // subscription (this also makes retries re-run the handler, including interceptors).
            var events$ = rxjs.of(req).pipe(operators.concatMap(function (req) { return _this.handler.handle(req); }));
            // If coming via the API signature which accepts a previously constructed HttpRequest,
            // the only option is to get the event stream. Otherwise, return the event stream if
            // that is what was requested.
            if (first instanceof HttpRequest || options.observe === 'events') {
                return events$;
            }
            // The requested stream contains either the full response or the body. In either
            // case, the first step is to filter the event stream to extract a stream of
            // responses(s).
            var res$ = events$.pipe(operators.filter(function (event) { return event instanceof HttpResponse; }));
            // Decide which stream to return.
            switch (options.observe || 'body') {
                case 'body':
                    // The requested stream is the body. Map the response stream to the response
                    // body. This could be done more simply, but a misbehaving interceptor might
                    // transform the response body into a different format and ignore the requested
                    // responseType. Guard against this by validating that the response is of the
                    // requested type.
                    switch (req.responseType) {
                        case 'arraybuffer':
                            return res$.pipe(operators.map(function (res) {
                                // Validate that the body is an ArrayBuffer.
                                if (res.body !== null && !(res.body instanceof ArrayBuffer)) {
                                    throw new Error('Response is not an ArrayBuffer.');
                                }
                                return res.body;
                            }));
                        case 'blob':
                            return res$.pipe(operators.map(function (res) {
                                // Validate that the body is a Blob.
                                if (res.body !== null && !(res.body instanceof Blob)) {
                                    throw new Error('Response is not a Blob.');
                                }
                                return res.body;
                            }));
                        case 'text':
                            return res$.pipe(operators.map(function (res) {
                                // Validate that the body is a string.
                                if (res.body !== null && typeof res.body !== 'string') {
                                    throw new Error('Response is not a string.');
                                }
                                return res.body;
                            }));
                        case 'json':
                        default:
                            // No validation needed for JSON responses, as they can be of any type.
                            return res$.pipe(operators.map(function (res) { return res.body; }));
                    }
                case 'response':
                    // The response stream was requested directly, so return it.
                    return res$;
                default:
                    // Guard against new future observe types being added.
                    throw new Error("Unreachable: unhandled observe type " + options.observe + "}");
            }
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * DELETE request to be executed on the server. See the individual overloads for
         * details of `delete()`'s return type based on the provided options.
         */
        HttpClient.prototype.delete = function (url, options) {
            if (options === void 0) { options = {}; }
            return this.request('DELETE', url, options);
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * GET request to be executed on the server. See the individual overloads for
         * details of `get()`'s return type based on the provided options.
         */
        HttpClient.prototype.get = function (url, options) {
            if (options === void 0) { options = {}; }
            return this.request('GET', url, options);
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * HEAD request to be executed on the server. See the individual overloads for
         * details of `head()`'s return type based on the provided options.
         */
        HttpClient.prototype.head = function (url, options) {
            if (options === void 0) { options = {}; }
            return this.request('HEAD', url, options);
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause a request
         * with the special method `JSONP` to be dispatched via the interceptor pipeline.
         *
         * A suitable interceptor must be installed (e.g. via the `HttpClientJsonpModule`).
         * If no such interceptor is reached, then the `JSONP` request will likely be
         * rejected by the configured backend.
         */
        HttpClient.prototype.jsonp = function (url, callbackParam) {
            return this.request('JSONP', url, {
                params: new HttpParams().append(callbackParam, 'JSONP_CALLBACK'),
                observe: 'body',
                responseType: 'json',
            });
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * OPTIONS request to be executed on the server. See the individual overloads for
         * details of `options()`'s return type based on the provided options.
         */
        HttpClient.prototype.options = function (url, options) {
            if (options === void 0) { options = {}; }
            return this.request('OPTIONS', url, options);
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * PATCH request to be executed on the server. See the individual overloads for
         * details of `patch()`'s return type based on the provided options.
         */
        HttpClient.prototype.patch = function (url, body, options) {
            if (options === void 0) { options = {}; }
            return this.request('PATCH', url, addBody(options, body));
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * POST request to be executed on the server. See the individual overloads for
         * details of `post()`'s return type based on the provided options.
         */
        HttpClient.prototype.post = function (url, body, options) {
            if (options === void 0) { options = {}; }
            return this.request('POST', url, addBody(options, body));
        };
        /**
         * Constructs an `Observable` which, when subscribed, will cause the configured
         * PUT request to be executed on the server. See the individual overloads for
         * details of `put()`'s return type based on the provided options.
         */
        HttpClient.prototype.put = function (url, body, options) {
            if (options === void 0) { options = {}; }
            return this.request('PUT', url, addBody(options, body));
        };
        HttpClient = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [HttpHandler])
        ], HttpClient);
        return HttpClient;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * `HttpHandler` which applies an `HttpInterceptor` to an `HttpRequest`.
     *
     *
     */
    var HttpInterceptorHandler = /** @class */ (function () {
        function HttpInterceptorHandler(next, interceptor) {
            this.next = next;
            this.interceptor = interceptor;
        }
        HttpInterceptorHandler.prototype.handle = function (req) {
            return this.interceptor.intercept(req, this.next);
        };
        return HttpInterceptorHandler;
    }());
    /**
     * A multi-provider token which represents the array of `HttpInterceptor`s that
     * are registered.
     *
     * @publicApi
     */
    var HTTP_INTERCEPTORS = new core.InjectionToken('HTTP_INTERCEPTORS');
    var NoopInterceptor = /** @class */ (function () {
        function NoopInterceptor() {
        }
        NoopInterceptor.prototype.intercept = function (req, next) {
            return next.handle(req);
        };
        NoopInterceptor = __decorate([
            core.Injectable()
        ], NoopInterceptor);
        return NoopInterceptor;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    // Every request made through JSONP needs a callback name that's unique across the
    // whole page. Each request is assigned an id and the callback name is constructed
    // from that. The next id to be assigned is tracked in a global variable here that
    // is shared among all applications on the page.
    var nextRequestId = 0;
    // Error text given when a JSONP script is injected, but doesn't invoke the callback
    // passed in its URL.
    var JSONP_ERR_NO_CALLBACK = 'JSONP injected script did not invoke callback.';
    // Error text given when a request is passed to the JsonpClientBackend that doesn't
    // have a request method JSONP.
    var JSONP_ERR_WRONG_METHOD = 'JSONP requests must use JSONP request method.';
    var JSONP_ERR_WRONG_RESPONSE_TYPE = 'JSONP requests must use Json response type.';
    /**
     * DI token/abstract type representing a map of JSONP callbacks.
     *
     * In the browser, this should always be the `window` object.
     *
     *
     */
    var JsonpCallbackContext = /** @class */ (function () {
        function JsonpCallbackContext() {
        }
        return JsonpCallbackContext;
    }());
    /**
     * `HttpBackend` that only processes `HttpRequest` with the JSONP method,
     * by performing JSONP style requests.
     *
     * @publicApi
     */
    var JsonpClientBackend = /** @class */ (function () {
        function JsonpClientBackend(callbackMap, document) {
            this.callbackMap = callbackMap;
            this.document = document;
        }
        /**
         * Get the name of the next callback method, by incrementing the global `nextRequestId`.
         */
        JsonpClientBackend.prototype.nextCallback = function () { return "ng_jsonp_callback_" + nextRequestId++; };
        /**
         * Process a JSONP request and return an event stream of the results.
         */
        JsonpClientBackend.prototype.handle = function (req) {
            var _this = this;
            // Firstly, check both the method and response type. If either doesn't match
            // then the request was improperly routed here and cannot be handled.
            if (req.method !== 'JSONP') {
                throw new Error(JSONP_ERR_WRONG_METHOD);
            }
            else if (req.responseType !== 'json') {
                throw new Error(JSONP_ERR_WRONG_RESPONSE_TYPE);
            }
            // Everything else happens inside the Observable boundary.
            return new rxjs.Observable(function (observer) {
                // The first step to make a request is to generate the callback name, and replace the
                // callback placeholder in the URL with the name. Care has to be taken here to ensure
                // a trailing &, if matched, gets inserted back into the URL in the correct place.
                var callback = _this.nextCallback();
                var url = req.urlWithParams.replace(/=JSONP_CALLBACK(&|$)/, "=" + callback + "$1");
                // Construct the <script> tag and point it at the URL.
                var node = _this.document.createElement('script');
                node.src = url;
                // A JSONP request requires waiting for multiple callbacks. These variables
                // are closed over and track state across those callbacks.
                // The response object, if one has been received, or null otherwise.
                var body = null;
                // Whether the response callback has been called.
                var finished = false;
                // Whether the request has been cancelled (and thus any other callbacks)
                // should be ignored.
                var cancelled = false;
                // Set the response callback in this.callbackMap (which will be the window
                // object in the browser. The script being loaded via the <script> tag will
                // eventually call this callback.
                _this.callbackMap[callback] = function (data) {
                    // Data has been received from the JSONP script. Firstly, delete this callback.
                    delete _this.callbackMap[callback];
                    // Next, make sure the request wasn't cancelled in the meantime.
                    if (cancelled) {
                        return;
                    }
                    // Set state to indicate data was received.
                    body = data;
                    finished = true;
                };
                // cleanup() is a utility closure that removes the <script> from the page and
                // the response callback from the window. This logic is used in both the
                // success, error, and cancellation paths, so it's extracted out for convenience.
                var cleanup = function () {
                    // Remove the <script> tag if it's still on the page.
                    if (node.parentNode) {
                        node.parentNode.removeChild(node);
                    }
                    // Remove the response callback from the callbackMap (window object in the
                    // browser).
                    delete _this.callbackMap[callback];
                };
                // onLoad() is the success callback which runs after the response callback
                // if the JSONP script loads successfully. The event itself is unimportant.
                // If something went wrong, onLoad() may run without the response callback
                // having been invoked.
                var onLoad = function (event) {
                    // Do nothing if the request has been cancelled.
                    if (cancelled) {
                        return;
                    }
                    // Cleanup the page.
                    cleanup();
                    // Check whether the response callback has run.
                    if (!finished) {
                        // It hasn't, something went wrong with the request. Return an error via
                        // the Observable error path. All JSONP errors have status 0.
                        observer.error(new HttpErrorResponse({
                            url: url,
                            status: 0,
                            statusText: 'JSONP Error',
                            error: new Error(JSONP_ERR_NO_CALLBACK),
                        }));
                        return;
                    }
                    // Success. body either contains the response body or null if none was
                    // returned.
                    observer.next(new HttpResponse({
                        body: body,
                        status: 200,
                        statusText: 'OK', url: url,
                    }));
                    // Complete the stream, the response is over.
                    observer.complete();
                };
                // onError() is the error callback, which runs if the script returned generates
                // a Javascript error. It emits the error via the Observable error channel as
                // a HttpErrorResponse.
                var onError = function (error) {
                    // If the request was already cancelled, no need to emit anything.
                    if (cancelled) {
                        return;
                    }
                    cleanup();
                    // Wrap the error in a HttpErrorResponse.
                    observer.error(new HttpErrorResponse({
                        error: error,
                        status: 0,
                        statusText: 'JSONP Error', url: url,
                    }));
                };
                // Subscribe to both the success (load) and error events on the <script> tag,
                // and add it to the page.
                node.addEventListener('load', onLoad);
                node.addEventListener('error', onError);
                _this.document.body.appendChild(node);
                // The request has now been successfully sent.
                observer.next({ type: exports.HttpEventType.Sent });
                // Cancellation handler.
                return function () {
                    // Track the cancellation so event listeners won't do anything even if already scheduled.
                    cancelled = true;
                    // Remove the event listeners so they won't run if the events later fire.
                    node.removeEventListener('load', onLoad);
                    node.removeEventListener('error', onError);
                    // And finally, clean up the page.
                    cleanup();
                };
            });
        };
        JsonpClientBackend = __decorate([
            core.Injectable(),
            __param(1, core.Inject(common.DOCUMENT)),
            __metadata("design:paramtypes", [JsonpCallbackContext, Object])
        ], JsonpClientBackend);
        return JsonpClientBackend;
    }());
    /**
     * An `HttpInterceptor` which identifies requests with the method JSONP and
     * shifts them to the `JsonpClientBackend`.
     *
     * @publicApi
     */
    var JsonpInterceptor = /** @class */ (function () {
        function JsonpInterceptor(jsonp) {
            this.jsonp = jsonp;
        }
        JsonpInterceptor.prototype.intercept = function (req, next) {
            if (req.method === 'JSONP') {
                return this.jsonp.handle(req);
            }
            // Fall through for normal HTTP requests.
            return next.handle(req);
        };
        JsonpInterceptor = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [JsonpClientBackend])
        ], JsonpInterceptor);
        return JsonpInterceptor;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var XSSI_PREFIX = /^\)\]\}',?\n/;
    /**
     * Determine an appropriate URL for the response, by checking either
     * XMLHttpRequest.responseURL or the X-Request-URL header.
     */
    function getResponseUrl(xhr) {
        if ('responseURL' in xhr && xhr.responseURL) {
            return xhr.responseURL;
        }
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
            return xhr.getResponseHeader('X-Request-URL');
        }
        return null;
    }
    /**
     * A wrapper around the `XMLHttpRequest` constructor.
     *
     * @publicApi
     */
    var XhrFactory = /** @class */ (function () {
        function XhrFactory() {
        }
        return XhrFactory;
    }());
    /**
     * A factory for @{link HttpXhrBackend} that uses the `XMLHttpRequest` browser API.
     *
     *
     */
    var BrowserXhr = /** @class */ (function () {
        function BrowserXhr() {
        }
        BrowserXhr.prototype.build = function () { return (new XMLHttpRequest()); };
        BrowserXhr = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [])
        ], BrowserXhr);
        return BrowserXhr;
    }());
    /**
     * An `HttpBackend` which uses the XMLHttpRequest API to send
     * requests to a backend server.
     *
     * @publicApi
     */
    var HttpXhrBackend = /** @class */ (function () {
        function HttpXhrBackend(xhrFactory) {
            this.xhrFactory = xhrFactory;
        }
        /**
         * Process a request and return a stream of response events.
         */
        HttpXhrBackend.prototype.handle = function (req) {
            var _this = this;
            // Quick check to give a better error message when a user attempts to use
            // HttpClient.jsonp() without installing the JsonpClientModule
            if (req.method === 'JSONP') {
                throw new Error("Attempted to construct Jsonp request without JsonpClientModule installed.");
            }
            // Everything happens on Observable subscription.
            return new rxjs.Observable(function (observer) {
                // Start by setting up the XHR object with request method, URL, and withCredentials flag.
                var xhr = _this.xhrFactory.build();
                xhr.open(req.method, req.urlWithParams);
                if (!!req.withCredentials) {
                    xhr.withCredentials = true;
                }
                // Add all the requested headers.
                req.headers.forEach(function (name, values) { return xhr.setRequestHeader(name, values.join(',')); });
                // Add an Accept header if one isn't present already.
                if (!req.headers.has('Accept')) {
                    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
                }
                // Auto-detect the Content-Type header if one isn't present already.
                if (!req.headers.has('Content-Type')) {
                    var detectedType = req.detectContentTypeHeader();
                    // Sometimes Content-Type detection fails.
                    if (detectedType !== null) {
                        xhr.setRequestHeader('Content-Type', detectedType);
                    }
                }
                // Set the responseType if one was requested.
                if (req.responseType) {
                    var responseType = req.responseType.toLowerCase();
                    // JSON responses need to be processed as text. This is because if the server
                    // returns an XSSI-prefixed JSON response, the browser will fail to parse it,
                    // xhr.response will be null, and xhr.responseText cannot be accessed to
                    // retrieve the prefixed JSON data in order to strip the prefix. Thus, all JSON
                    // is parsed by first requesting text and then applying JSON.parse.
                    xhr.responseType = ((responseType !== 'json') ? responseType : 'text');
                }
                // Serialize the request body if one is present. If not, this will be set to null.
                var reqBody = req.serializeBody();
                // If progress events are enabled, response headers will be delivered
                // in two events - the HttpHeaderResponse event and the full HttpResponse
                // event. However, since response headers don't change in between these
                // two events, it doesn't make sense to parse them twice. So headerResponse
                // caches the data extracted from the response whenever it's first parsed,
                // to ensure parsing isn't duplicated.
                var headerResponse = null;
                // partialFromXhr extracts the HttpHeaderResponse from the current XMLHttpRequest
                // state, and memoizes it into headerResponse.
                var partialFromXhr = function () {
                    if (headerResponse !== null) {
                        return headerResponse;
                    }
                    // Read status and normalize an IE9 bug (http://bugs.jquery.com/ticket/1450).
                    var status = xhr.status === 1223 ? 204 : xhr.status;
                    var statusText = xhr.statusText || 'OK';
                    // Parse headers from XMLHttpRequest - this step is lazy.
                    var headers = new HttpHeaders(xhr.getAllResponseHeaders());
                    // Read the response URL from the XMLHttpResponse instance and fall back on the
                    // request URL.
                    var url = getResponseUrl(xhr) || req.url;
                    // Construct the HttpHeaderResponse and memoize it.
                    headerResponse = new HttpHeaderResponse({ headers: headers, status: status, statusText: statusText, url: url });
                    return headerResponse;
                };
                // Next, a few closures are defined for the various events which XMLHttpRequest can
                // emit. This allows them to be unregistered as event listeners later.
                // First up is the load event, which represents a response being fully available.
                var onLoad = function () {
                    // Read response state from the memoized partial data.
                    var _a = partialFromXhr(), headers = _a.headers, status = _a.status, statusText = _a.statusText, url = _a.url;
                    // The body will be read out if present.
                    var body = null;
                    if (status !== 204) {
                        // Use XMLHttpRequest.response if set, responseText otherwise.
                        body = (typeof xhr.response === 'undefined') ? xhr.responseText : xhr.response;
                    }
                    // Normalize another potential bug (this one comes from CORS).
                    if (status === 0) {
                        status = !!body ? 200 : 0;
                    }
                    // ok determines whether the response will be transmitted on the event or
                    // error channel. Unsuccessful status codes (not 2xx) will always be errors,
                    // but a successful status code can still result in an error if the user
                    // asked for JSON data and the body cannot be parsed as such.
                    var ok = status >= 200 && status < 300;
                    // Check whether the body needs to be parsed as JSON (in many cases the browser
                    // will have done that already).
                    if (req.responseType === 'json' && typeof body === 'string') {
                        // Save the original body, before attempting XSSI prefix stripping.
                        var originalBody = body;
                        body = body.replace(XSSI_PREFIX, '');
                        try {
                            // Attempt the parse. If it fails, a parse error should be delivered to the user.
                            body = body !== '' ? JSON.parse(body) : null;
                        }
                        catch (error) {
                            // Since the JSON.parse failed, it's reasonable to assume this might not have been a
                            // JSON response. Restore the original body (including any XSSI prefix) to deliver
                            // a better error response.
                            body = originalBody;
                            // If this was an error request to begin with, leave it as a string, it probably
                            // just isn't JSON. Otherwise, deliver the parsing error to the user.
                            if (ok) {
                                // Even though the response status was 2xx, this is still an error.
                                ok = false;
                                // The parse error contains the text of the body that failed to parse.
                                body = { error: error, text: body };
                            }
                        }
                    }
                    if (ok) {
                        // A successful response is delivered on the event stream.
                        observer.next(new HttpResponse({
                            body: body,
                            headers: headers,
                            status: status,
                            statusText: statusText,
                            url: url || undefined,
                        }));
                        // The full body has been received and delivered, no further events
                        // are possible. This request is complete.
                        observer.complete();
                    }
                    else {
                        // An unsuccessful request is delivered on the error channel.
                        observer.error(new HttpErrorResponse({
                            // The error in this case is the response body (error from the server).
                            error: body,
                            headers: headers,
                            status: status,
                            statusText: statusText,
                            url: url || undefined,
                        }));
                    }
                };
                // The onError callback is called when something goes wrong at the network level.
                // Connection timeout, DNS error, offline, etc. These are actual errors, and are
                // transmitted on the error channel.
                var onError = function (error) {
                    var res = new HttpErrorResponse({
                        error: error,
                        status: xhr.status || 0,
                        statusText: xhr.statusText || 'Unknown Error',
                    });
                    observer.error(res);
                };
                // The sentHeaders flag tracks whether the HttpResponseHeaders event
                // has been sent on the stream. This is necessary to track if progress
                // is enabled since the event will be sent on only the first download
                // progerss event.
                var sentHeaders = false;
                // The download progress event handler, which is only registered if
                // progress events are enabled.
                var onDownProgress = function (event) {
                    // Send the HttpResponseHeaders event if it hasn't been sent already.
                    if (!sentHeaders) {
                        observer.next(partialFromXhr());
                        sentHeaders = true;
                    }
                    // Start building the download progress event to deliver on the response
                    // event stream.
                    var progressEvent = {
                        type: exports.HttpEventType.DownloadProgress,
                        loaded: event.loaded,
                    };
                    // Set the total number of bytes in the event if it's available.
                    if (event.lengthComputable) {
                        progressEvent.total = event.total;
                    }
                    // If the request was for text content and a partial response is
                    // available on XMLHttpRequest, include it in the progress event
                    // to allow for streaming reads.
                    if (req.responseType === 'text' && !!xhr.responseText) {
                        progressEvent.partialText = xhr.responseText;
                    }
                    // Finally, fire the event.
                    observer.next(progressEvent);
                };
                // The upload progress event handler, which is only registered if
                // progress events are enabled.
                var onUpProgress = function (event) {
                    // Upload progress events are simpler. Begin building the progress
                    // event.
                    var progress = {
                        type: exports.HttpEventType.UploadProgress,
                        loaded: event.loaded,
                    };
                    // If the total number of bytes being uploaded is available, include
                    // it.
                    if (event.lengthComputable) {
                        progress.total = event.total;
                    }
                    // Send the event.
                    observer.next(progress);
                };
                // By default, register for load and error events.
                xhr.addEventListener('load', onLoad);
                xhr.addEventListener('error', onError);
                // Progress events are only enabled if requested.
                if (req.reportProgress) {
                    // Download progress is always enabled if requested.
                    xhr.addEventListener('progress', onDownProgress);
                    // Upload progress depends on whether there is a body to upload.
                    if (reqBody !== null && xhr.upload) {
                        xhr.upload.addEventListener('progress', onUpProgress);
                    }
                }
                // Fire the request, and notify the event stream that it was fired.
                xhr.send(reqBody);
                observer.next({ type: exports.HttpEventType.Sent });
                // This is the return from the Observable function, which is the
                // request cancellation handler.
                return function () {
                    // On a cancellation, remove all registered event listeners.
                    xhr.removeEventListener('error', onError);
                    xhr.removeEventListener('load', onLoad);
                    if (req.reportProgress) {
                        xhr.removeEventListener('progress', onDownProgress);
                        if (reqBody !== null && xhr.upload) {
                            xhr.upload.removeEventListener('progress', onUpProgress);
                        }
                    }
                    // Finally, abort the in-flight request.
                    xhr.abort();
                };
            });
        };
        HttpXhrBackend = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [XhrFactory])
        ], HttpXhrBackend);
        return HttpXhrBackend;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var XSRF_COOKIE_NAME = new core.InjectionToken('XSRF_COOKIE_NAME');
    var XSRF_HEADER_NAME = new core.InjectionToken('XSRF_HEADER_NAME');
    /**
     * Retrieves the current XSRF token to use with the next outgoing request.
     *
     * @publicApi
     */
    var HttpXsrfTokenExtractor = /** @class */ (function () {
        function HttpXsrfTokenExtractor() {
        }
        return HttpXsrfTokenExtractor;
    }());
    /**
     * `HttpXsrfTokenExtractor` which retrieves the token from a cookie.
     */
    var HttpXsrfCookieExtractor = /** @class */ (function () {
        function HttpXsrfCookieExtractor(doc, platform, cookieName) {
            this.doc = doc;
            this.platform = platform;
            this.cookieName = cookieName;
            this.lastCookieString = '';
            this.lastToken = null;
            /**
             * @internal for testing
             */
            this.parseCount = 0;
        }
        HttpXsrfCookieExtractor.prototype.getToken = function () {
            if (this.platform === 'server') {
                return null;
            }
            var cookieString = this.doc.cookie || '';
            if (cookieString !== this.lastCookieString) {
                this.parseCount++;
                this.lastToken = common.ɵparseCookieValue(cookieString, this.cookieName);
                this.lastCookieString = cookieString;
            }
            return this.lastToken;
        };
        HttpXsrfCookieExtractor = __decorate([
            core.Injectable(),
            __param(0, core.Inject(common.DOCUMENT)), __param(1, core.Inject(core.PLATFORM_ID)),
            __param(2, core.Inject(XSRF_COOKIE_NAME)),
            __metadata("design:paramtypes", [Object, String, String])
        ], HttpXsrfCookieExtractor);
        return HttpXsrfCookieExtractor;
    }());
    /**
     * `HttpInterceptor` which adds an XSRF token to eligible outgoing requests.
     */
    var HttpXsrfInterceptor = /** @class */ (function () {
        function HttpXsrfInterceptor(tokenService, headerName) {
            this.tokenService = tokenService;
            this.headerName = headerName;
        }
        HttpXsrfInterceptor.prototype.intercept = function (req, next) {
            var lcUrl = req.url.toLowerCase();
            // Skip both non-mutating requests and absolute URLs.
            // Non-mutating requests don't require a token, and absolute URLs require special handling
            // anyway as the cookie set
            // on our origin is not the same as the token expected by another origin.
            if (req.method === 'GET' || req.method === 'HEAD' || lcUrl.startsWith('http://') ||
                lcUrl.startsWith('https://')) {
                return next.handle(req);
            }
            var token = this.tokenService.getToken();
            // Be careful not to overwrite an existing header of the same name.
            if (token !== null && !req.headers.has(this.headerName)) {
                req = req.clone({ headers: req.headers.set(this.headerName, token) });
            }
            return next.handle(req);
        };
        HttpXsrfInterceptor = __decorate([
            core.Injectable(),
            __param(1, core.Inject(XSRF_HEADER_NAME)),
            __metadata("design:paramtypes", [HttpXsrfTokenExtractor, String])
        ], HttpXsrfInterceptor);
        return HttpXsrfInterceptor;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An injectable `HttpHandler` that applies multiple interceptors
     * to a request before passing it to the given `HttpBackend`.
     *
     * The interceptors are loaded lazily from the injector, to allow
     * interceptors to themselves inject classes depending indirectly
     * on `HttpInterceptingHandler` itself.
     * @see `HttpInterceptor`
     */
    var HttpInterceptingHandler = /** @class */ (function () {
        function HttpInterceptingHandler(backend, injector) {
            this.backend = backend;
            this.injector = injector;
            this.chain = null;
        }
        HttpInterceptingHandler.prototype.handle = function (req) {
            if (this.chain === null) {
                var interceptors = this.injector.get(HTTP_INTERCEPTORS, []);
                this.chain = interceptors.reduceRight(function (next, interceptor) { return new HttpInterceptorHandler(next, interceptor); }, this.backend);
            }
            return this.chain.handle(req);
        };
        HttpInterceptingHandler = __decorate([
            core.Injectable(),
            __metadata("design:paramtypes", [HttpBackend, core.Injector])
        ], HttpInterceptingHandler);
        return HttpInterceptingHandler;
    }());
    /**
     * Factory function that determines where to store JSONP callbacks.
     *
     * Ordinarily JSONP callbacks are stored on the `window` object, but this may not exist
     * in test environments. In that case, callbacks are stored on an anonymous object instead.
     *
     *
     */
    function jsonpCallbackContext() {
        if (typeof window === 'object') {
            return window;
        }
        return {};
    }
    /**
     * Configures XSRF protection support for outgoing requests.
     *
     * For a server that supports a cookie-based XSRF protection system,
     * use directly to configure XSRF protection with the correct
     * cookie and header names.
     *
     * If no names are supplied, the default cookie name is `XSRF-TOKEN`
     * and the default header name is `X-XSRF-TOKEN`.
     *
     * @publicApi
     */
    var HttpClientXsrfModule = /** @class */ (function () {
        function HttpClientXsrfModule() {
        }
        HttpClientXsrfModule_1 = HttpClientXsrfModule;
        /**
         * Disable the default XSRF protection.
         */
        HttpClientXsrfModule.disable = function () {
            return {
                ngModule: HttpClientXsrfModule_1,
                providers: [
                    { provide: HttpXsrfInterceptor, useClass: NoopInterceptor },
                ],
            };
        };
        /**
         * Configure XSRF protection.
         * @param options An object that can specify either or both
         * cookie name or header name.
         * - Cookie name default is `XSRF-TOKEN`.
         * - Header name default is `X-XSRF-TOKEN`.
         *
         */
        HttpClientXsrfModule.withOptions = function (options) {
            if (options === void 0) { options = {}; }
            return {
                ngModule: HttpClientXsrfModule_1,
                providers: [
                    options.cookieName ? { provide: XSRF_COOKIE_NAME, useValue: options.cookieName } : [],
                    options.headerName ? { provide: XSRF_HEADER_NAME, useValue: options.headerName } : [],
                ],
            };
        };
        var HttpClientXsrfModule_1;
        HttpClientXsrfModule = HttpClientXsrfModule_1 = __decorate([
            core.NgModule({
                providers: [
                    HttpXsrfInterceptor,
                    { provide: HTTP_INTERCEPTORS, useExisting: HttpXsrfInterceptor, multi: true },
                    { provide: HttpXsrfTokenExtractor, useClass: HttpXsrfCookieExtractor },
                    { provide: XSRF_COOKIE_NAME, useValue: 'XSRF-TOKEN' },
                    { provide: XSRF_HEADER_NAME, useValue: 'X-XSRF-TOKEN' },
                ],
            })
        ], HttpClientXsrfModule);
        return HttpClientXsrfModule;
    }());
    /**
     * Configures the [dependency injector](guide/glossary#injector) for `HttpClient`
     * with supporting services for XSRF. Automatically imported by `HttpClientModule`.
     *
     * You can add interceptors to the chain behind `HttpClient` by binding them to the
     * multiprovider for built-in [DI token](guide/glossary#di-token) `HTTP_INTERCEPTORS`.
     *
     * @publicApi
     */
    var HttpClientModule = /** @class */ (function () {
        function HttpClientModule() {
        }
        HttpClientModule = __decorate([
            core.NgModule({
                /**
                 * Optional configuration for XSRF protection.
                 */
                imports: [
                    HttpClientXsrfModule.withOptions({
                        cookieName: 'XSRF-TOKEN',
                        headerName: 'X-XSRF-TOKEN',
                    }),
                ],
                /**
                 * Configures the [dependency injector](guide/glossary#injector) where it is imported
                 * with supporting services for HTTP communications.
                 */
                providers: [
                    HttpClient,
                    { provide: HttpHandler, useClass: HttpInterceptingHandler },
                    HttpXhrBackend,
                    { provide: HttpBackend, useExisting: HttpXhrBackend },
                    BrowserXhr,
                    { provide: XhrFactory, useExisting: BrowserXhr },
                ],
            })
        ], HttpClientModule);
        return HttpClientModule;
    }());
    /**
     * Configures the [dependency injector](guide/glossary#injector) for `HttpClient`
     * with supporting services for JSONP.
     * Without this module, Jsonp requests reach the backend
     * with method JSONP, where they are rejected.
     *
     * You can add interceptors to the chain behind `HttpClient` by binding them to the
     * multiprovider for built-in [DI token](guide/glossary#di-token) `HTTP_INTERCEPTORS`.
     *
     * @publicApi
     */
    var HttpClientJsonpModule = /** @class */ (function () {
        function HttpClientJsonpModule() {
        }
        HttpClientJsonpModule = __decorate([
            core.NgModule({
                providers: [
                    JsonpClientBackend,
                    { provide: JsonpCallbackContext, useFactory: jsonpCallbackContext },
                    { provide: HTTP_INTERCEPTORS, useClass: JsonpInterceptor, multi: true },
                ],
            })
        ], HttpClientJsonpModule);
        return HttpClientJsonpModule;
    }());

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.ɵangular_packages_common_http_http_a = NoopInterceptor;
    exports.ɵangular_packages_common_http_http_b = JsonpCallbackContext;
    exports.ɵangular_packages_common_http_http_c = jsonpCallbackContext;
    exports.ɵangular_packages_common_http_http_d = BrowserXhr;
    exports.ɵangular_packages_common_http_http_g = HttpXsrfCookieExtractor;
    exports.ɵangular_packages_common_http_http_h = HttpXsrfInterceptor;
    exports.ɵangular_packages_common_http_http_e = XSRF_COOKIE_NAME;
    exports.ɵangular_packages_common_http_http_f = XSRF_HEADER_NAME;
    exports.HttpBackend = HttpBackend;
    exports.HttpHandler = HttpHandler;
    exports.HttpClient = HttpClient;
    exports.HttpHeaders = HttpHeaders;
    exports.HTTP_INTERCEPTORS = HTTP_INTERCEPTORS;
    exports.JsonpClientBackend = JsonpClientBackend;
    exports.JsonpInterceptor = JsonpInterceptor;
    exports.HttpClientJsonpModule = HttpClientJsonpModule;
    exports.HttpClientModule = HttpClientModule;
    exports.HttpClientXsrfModule = HttpClientXsrfModule;
    exports.ɵHttpInterceptingHandler = HttpInterceptingHandler;
    exports.HttpParams = HttpParams;
    exports.HttpUrlEncodingCodec = HttpUrlEncodingCodec;
    exports.HttpRequest = HttpRequest;
    exports.HttpErrorResponse = HttpErrorResponse;
    exports.HttpHeaderResponse = HttpHeaderResponse;
    exports.HttpResponse = HttpResponse;
    exports.HttpResponseBase = HttpResponseBase;
    exports.HttpXhrBackend = HttpXhrBackend;
    exports.XhrFactory = XhrFactory;
    exports.HttpXsrfTokenExtractor = HttpXsrfTokenExtractor;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=common-http.umd.js.map
