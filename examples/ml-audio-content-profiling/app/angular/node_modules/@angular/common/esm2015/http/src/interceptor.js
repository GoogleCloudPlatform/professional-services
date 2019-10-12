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
import { Injectable, InjectionToken } from '@angular/core';
/**
 * Intercepts `HttpRequest` and handles them.
 *
 * Most interceptors will transform the outgoing request before passing it to the
 * next interceptor in the chain, by calling `next.handle(transformedReq)`.
 *
 * In rare cases, interceptors may wish to completely handle a request themselves,
 * and not delegate to the remainder of the chain. This behavior is allowed.
 *
 * \@publicApi
 * @record
 */
export function HttpInterceptor() { }
/**
 * Intercept an outgoing `HttpRequest` and optionally transform it or the
 * response.
 *
 * Typically an interceptor will transform the outgoing request before returning
 * `next.handle(transformedReq)`. An interceptor may choose to transform the
 * response event stream as well, by applying additional Rx operators on the stream
 * returned by `next.handle()`.
 *
 * More rarely, an interceptor may choose to completely handle the request itself,
 * and compose a new event stream instead of invoking `next.handle()`. This is
 * acceptable behavior, but keep in mind further interceptors will be skipped entirely.
 *
 * It is also rare but valid for an interceptor to return multiple responses on the
 * event stream for a single request.
 * @type {?}
 */
HttpInterceptor.prototype.intercept;
/**
 * `HttpHandler` which applies an `HttpInterceptor` to an `HttpRequest`.
 *
 *
 */
export class HttpInterceptorHandler {
    /**
     * @param {?} next
     * @param {?} interceptor
     */
    constructor(next, interceptor) {
        this.next = next;
        this.interceptor = interceptor;
    }
    /**
     * @param {?} req
     * @return {?}
     */
    handle(req) {
        return this.interceptor.intercept(req, this.next);
    }
}
if (false) {
    /** @type {?} */
    HttpInterceptorHandler.prototype.next;
    /** @type {?} */
    HttpInterceptorHandler.prototype.interceptor;
}
/** *
 * A multi-provider token which represents the array of `HttpInterceptor`s that
 * are registered.
 *
 * \@publicApi
  @type {?} */
export const HTTP_INTERCEPTORS = new InjectionToken('HTTP_INTERCEPTORS');
export class NoopInterceptor {
    /**
     * @param {?} req
     * @param {?} next
     * @return {?}
     */
    intercept(req, next) {
        return next.handle(req);
    }
}
NoopInterceptor.decorators = [
    { type: Injectable }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJjZXB0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21tb24vaHR0cC9zcmMvaW50ZXJjZXB0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJDekQsTUFBTSxPQUFPLHNCQUFzQjs7Ozs7SUFDakMsWUFBb0IsSUFBaUIsRUFBVSxXQUE0QjtRQUF2RCxTQUFJLEdBQUosSUFBSSxDQUFhO1FBQVUsZ0JBQVcsR0FBWCxXQUFXLENBQWlCO0tBQUk7Ozs7O0lBRS9FLE1BQU0sQ0FBQyxHQUFxQjtRQUMxQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDbkQ7Q0FDRjs7Ozs7Ozs7Ozs7OztBQVFELGFBQWEsaUJBQWlCLEdBQUcsSUFBSSxjQUFjLENBQW9CLG1CQUFtQixDQUFDLENBQUM7QUFHNUYsTUFBTSxPQUFPLGVBQWU7Ozs7OztJQUMxQixTQUFTLENBQUMsR0FBcUIsRUFBRSxJQUFpQjtRQUNoRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDekI7OztZQUpGLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtIdHRwSGFuZGxlcn0gZnJvbSAnLi9iYWNrZW5kJztcbmltcG9ydCB7SHR0cFJlcXVlc3R9IGZyb20gJy4vcmVxdWVzdCc7XG5pbXBvcnQge0h0dHBFdmVudH0gZnJvbSAnLi9yZXNwb25zZSc7XG5cbi8qKlxuICogSW50ZXJjZXB0cyBgSHR0cFJlcXVlc3RgIGFuZCBoYW5kbGVzIHRoZW0uXG4gKlxuICogTW9zdCBpbnRlcmNlcHRvcnMgd2lsbCB0cmFuc2Zvcm0gdGhlIG91dGdvaW5nIHJlcXVlc3QgYmVmb3JlIHBhc3NpbmcgaXQgdG8gdGhlXG4gKiBuZXh0IGludGVyY2VwdG9yIGluIHRoZSBjaGFpbiwgYnkgY2FsbGluZyBgbmV4dC5oYW5kbGUodHJhbnNmb3JtZWRSZXEpYC5cbiAqXG4gKiBJbiByYXJlIGNhc2VzLCBpbnRlcmNlcHRvcnMgbWF5IHdpc2ggdG8gY29tcGxldGVseSBoYW5kbGUgYSByZXF1ZXN0IHRoZW1zZWx2ZXMsXG4gKiBhbmQgbm90IGRlbGVnYXRlIHRvIHRoZSByZW1haW5kZXIgb2YgdGhlIGNoYWluLiBUaGlzIGJlaGF2aW9yIGlzIGFsbG93ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBJbnRlcmNlcHRvciB7XG4gIC8qKlxuICAgKiBJbnRlcmNlcHQgYW4gb3V0Z29pbmcgYEh0dHBSZXF1ZXN0YCBhbmQgb3B0aW9uYWxseSB0cmFuc2Zvcm0gaXQgb3IgdGhlXG4gICAqIHJlc3BvbnNlLlxuICAgKlxuICAgKiBUeXBpY2FsbHkgYW4gaW50ZXJjZXB0b3Igd2lsbCB0cmFuc2Zvcm0gdGhlIG91dGdvaW5nIHJlcXVlc3QgYmVmb3JlIHJldHVybmluZ1xuICAgKiBgbmV4dC5oYW5kbGUodHJhbnNmb3JtZWRSZXEpYC4gQW4gaW50ZXJjZXB0b3IgbWF5IGNob29zZSB0byB0cmFuc2Zvcm0gdGhlXG4gICAqIHJlc3BvbnNlIGV2ZW50IHN0cmVhbSBhcyB3ZWxsLCBieSBhcHBseWluZyBhZGRpdGlvbmFsIFJ4IG9wZXJhdG9ycyBvbiB0aGUgc3RyZWFtXG4gICAqIHJldHVybmVkIGJ5IGBuZXh0LmhhbmRsZSgpYC5cbiAgICpcbiAgICogTW9yZSByYXJlbHksIGFuIGludGVyY2VwdG9yIG1heSBjaG9vc2UgdG8gY29tcGxldGVseSBoYW5kbGUgdGhlIHJlcXVlc3QgaXRzZWxmLFxuICAgKiBhbmQgY29tcG9zZSBhIG5ldyBldmVudCBzdHJlYW0gaW5zdGVhZCBvZiBpbnZva2luZyBgbmV4dC5oYW5kbGUoKWAuIFRoaXMgaXNcbiAgICogYWNjZXB0YWJsZSBiZWhhdmlvciwgYnV0IGtlZXAgaW4gbWluZCBmdXJ0aGVyIGludGVyY2VwdG9ycyB3aWxsIGJlIHNraXBwZWQgZW50aXJlbHkuXG4gICAqXG4gICAqIEl0IGlzIGFsc28gcmFyZSBidXQgdmFsaWQgZm9yIGFuIGludGVyY2VwdG9yIHRvIHJldHVybiBtdWx0aXBsZSByZXNwb25zZXMgb24gdGhlXG4gICAqIGV2ZW50IHN0cmVhbSBmb3IgYSBzaW5nbGUgcmVxdWVzdC5cbiAgICovXG4gIGludGVyY2VwdChyZXE6IEh0dHBSZXF1ZXN0PGFueT4sIG5leHQ6IEh0dHBIYW5kbGVyKTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj47XG59XG5cbi8qKlxuICogYEh0dHBIYW5kbGVyYCB3aGljaCBhcHBsaWVzIGFuIGBIdHRwSW50ZXJjZXB0b3JgIHRvIGFuIGBIdHRwUmVxdWVzdGAuXG4gKlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIEh0dHBJbnRlcmNlcHRvckhhbmRsZXIgaW1wbGVtZW50cyBIdHRwSGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbmV4dDogSHR0cEhhbmRsZXIsIHByaXZhdGUgaW50ZXJjZXB0b3I6IEh0dHBJbnRlcmNlcHRvcikge31cblxuICBoYW5kbGUocmVxOiBIdHRwUmVxdWVzdDxhbnk+KTogT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4ge1xuICAgIHJldHVybiB0aGlzLmludGVyY2VwdG9yLmludGVyY2VwdChyZXEsIHRoaXMubmV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBIG11bHRpLXByb3ZpZGVyIHRva2VuIHdoaWNoIHJlcHJlc2VudHMgdGhlIGFycmF5IG9mIGBIdHRwSW50ZXJjZXB0b3JgcyB0aGF0XG4gKiBhcmUgcmVnaXN0ZXJlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBIVFRQX0lOVEVSQ0VQVE9SUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxIdHRwSW50ZXJjZXB0b3JbXT4oJ0hUVFBfSU5URVJDRVBUT1JTJyk7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBOb29wSW50ZXJjZXB0b3IgaW1wbGVtZW50cyBIdHRwSW50ZXJjZXB0b3Ige1xuICBpbnRlcmNlcHQocmVxOiBIdHRwUmVxdWVzdDxhbnk+LCBuZXh0OiBIdHRwSGFuZGxlcik6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxKTtcbiAgfVxufVxuIl19