/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HttpBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpTestingController, RequestMatch } from './api';
import { TestRequest } from './request';
/**
 * A testing backend for `HttpClient` which both acts as an `HttpBackend`
 * and as the `HttpTestingController`.
 *
 * `HttpClientTestingBackend` works by keeping a list of all open requests.
 * As requests come in, they're added to the list. Users can assert that specific
 * requests were made and then flush them. In the end, a verify() method asserts
 * that no unexpected requests were made.
 *
 *
 */
export declare class HttpClientTestingBackend implements HttpBackend, HttpTestingController {
    /**
     * List of pending requests which have not yet been expected.
     */
    private open;
    /**
     * Handle an incoming request by queueing it in the list of open requests.
     */
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>>;
    /**
     * Helper function to search for requests in the list of open requests.
     */
    private _match;
    /**
     * Search for requests in the list of open requests, and return all that match
     * without asserting anything about the number of matches.
     */
    match(match: string | RequestMatch | ((req: HttpRequest<any>) => boolean)): TestRequest[];
    /**
     * Expect that a single outstanding request matches the given matcher, and return
     * it.
     *
     * Requests returned through this API will no longer be in the list of open requests,
     * and thus will not match twice.
     */
    expectOne(match: string | RequestMatch | ((req: HttpRequest<any>) => boolean), description?: string): TestRequest;
    /**
     * Expect that no outstanding requests match the given matcher, and throw an error
     * if any do.
     */
    expectNone(match: string | RequestMatch | ((req: HttpRequest<any>) => boolean), description?: string): void;
    /**
     * Validate that there are no outstanding requests.
     */
    verify(opts?: {
        ignoreCancelled?: boolean;
    }): void;
    private descriptionFromMatcher;
}
