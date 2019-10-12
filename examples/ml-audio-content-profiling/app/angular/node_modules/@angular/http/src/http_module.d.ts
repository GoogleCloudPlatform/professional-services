/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { JSONPBackend } from './backends/jsonp_backend';
import { CookieXSRFStrategy, XHRBackend } from './backends/xhr_backend';
import { RequestOptions } from './base_request_options';
import { Http, Jsonp } from './http';
export declare function _createDefaultCookieXSRFStrategy(): CookieXSRFStrategy;
export declare function httpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http;
export declare function jsonpFactory(jsonpBackend: JSONPBackend, requestOptions: RequestOptions): Jsonp;
/**
 * The module that includes http's providers
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
export declare class HttpModule {
}
/**
 * The module that includes jsonp's providers
 *
 * @deprecated see https://angular.io/guide/http
 * @publicApi
 */
export declare class JsonpModule {
}
