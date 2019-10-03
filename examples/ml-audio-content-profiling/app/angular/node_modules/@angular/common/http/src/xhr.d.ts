/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { HttpBackend } from './backend';
import { HttpRequest } from './request';
import { HttpEvent } from './response';
/**
 * A wrapper around the `XMLHttpRequest` constructor.
 *
 * @publicApi
 */
export declare abstract class XhrFactory {
    abstract build(): XMLHttpRequest;
}
/**
 * A factory for @{link HttpXhrBackend} that uses the `XMLHttpRequest` browser API.
 *
 *
 */
export declare class BrowserXhr implements XhrFactory {
    constructor();
    build(): any;
}
/**
 * An `HttpBackend` which uses the XMLHttpRequest API to send
 * requests to a backend server.
 *
 * @publicApi
 */
export declare class HttpXhrBackend implements HttpBackend {
    private xhrFactory;
    constructor(xhrFactory: XhrFactory);
    /**
     * Process a request and return a stream of response events.
     */
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>>;
}
