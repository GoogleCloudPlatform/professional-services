/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HttpEvent, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observer } from 'rxjs';
/**
 * A mock requests that was received and is ready to be answered.
 *
 * This interface allows access to the underlying `HttpRequest`, and allows
 * responding with `HttpEvent`s or `HttpErrorResponse`s.
 *
 * @publicApi
 */
export declare class TestRequest {
    request: HttpRequest<any>;
    private observer;
    /**
     * Whether the request was cancelled after it was sent.
     */
    readonly cancelled: boolean;
    constructor(request: HttpRequest<any>, observer: Observer<HttpEvent<any>>);
    /**
     * Resolve the request by returning a body plus additional HTTP information (such as response
     * headers) if provided.
     *
     * Both successful and unsuccessful responses can be delivered via `flush()`.
     */
    flush(body: ArrayBuffer | Blob | string | number | Object | (string | number | Object | null)[] | null, opts?: {
        headers?: HttpHeaders | {
            [name: string]: string | string[];
        };
        status?: number;
        statusText?: string;
    }): void;
    /**
     * Resolve the request by returning an `ErrorEvent` (e.g. simulating a network failure).
     */
    error(error: ErrorEvent, opts?: {
        headers?: HttpHeaders | {
            [name: string]: string | string[];
        };
        status?: number;
        statusText?: string;
    }): void;
    /**
     * Deliver an arbitrary `HttpEvent` (such as a progress event) on the response stream for this
     * request.
     */
    event(event: HttpEvent<any>): void;
}
