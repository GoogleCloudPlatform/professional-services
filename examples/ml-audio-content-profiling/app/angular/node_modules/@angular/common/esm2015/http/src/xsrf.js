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
import { DOCUMENT, ɵparseCookieValue as parseCookieValue } from '@angular/common';
import { Inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
/** @type {?} */
export const XSRF_COOKIE_NAME = new InjectionToken('XSRF_COOKIE_NAME');
/** @type {?} */
export const XSRF_HEADER_NAME = new InjectionToken('XSRF_HEADER_NAME');
/**
 * Retrieves the current XSRF token to use with the next outgoing request.
 *
 * \@publicApi
 * @abstract
 */
export class HttpXsrfTokenExtractor {
}
if (false) {
    /**
     * Get the XSRF token to use with an outgoing request.
     *
     * Will be called for every request, so the token may change between requests.
     * @abstract
     * @return {?}
     */
    HttpXsrfTokenExtractor.prototype.getToken = function () { };
}
/**
 * `HttpXsrfTokenExtractor` which retrieves the token from a cookie.
 */
export class HttpXsrfCookieExtractor {
    /**
     * @param {?} doc
     * @param {?} platform
     * @param {?} cookieName
     */
    constructor(doc, platform, cookieName) {
        this.doc = doc;
        this.platform = platform;
        this.cookieName = cookieName;
        this.lastCookieString = '';
        this.lastToken = null;
        /**
         * \@internal for testing
         */
        this.parseCount = 0;
    }
    /**
     * @return {?}
     */
    getToken() {
        if (this.platform === 'server') {
            return null;
        }
        /** @type {?} */
        const cookieString = this.doc.cookie || '';
        if (cookieString !== this.lastCookieString) {
            this.parseCount++;
            this.lastToken = parseCookieValue(cookieString, this.cookieName);
            this.lastCookieString = cookieString;
        }
        return this.lastToken;
    }
}
HttpXsrfCookieExtractor.decorators = [
    { type: Injectable }
];
/** @nocollapse */
HttpXsrfCookieExtractor.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] },
    { type: String, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: String, decorators: [{ type: Inject, args: [XSRF_COOKIE_NAME,] }] }
];
if (false) {
    /** @type {?} */
    HttpXsrfCookieExtractor.prototype.lastCookieString;
    /** @type {?} */
    HttpXsrfCookieExtractor.prototype.lastToken;
    /**
     * \@internal for testing
     * @type {?}
     */
    HttpXsrfCookieExtractor.prototype.parseCount;
    /** @type {?} */
    HttpXsrfCookieExtractor.prototype.doc;
    /** @type {?} */
    HttpXsrfCookieExtractor.prototype.platform;
    /** @type {?} */
    HttpXsrfCookieExtractor.prototype.cookieName;
}
/**
 * `HttpInterceptor` which adds an XSRF token to eligible outgoing requests.
 */
export class HttpXsrfInterceptor {
    /**
     * @param {?} tokenService
     * @param {?} headerName
     */
    constructor(tokenService, headerName) {
        this.tokenService = tokenService;
        this.headerName = headerName;
    }
    /**
     * @param {?} req
     * @param {?} next
     * @return {?}
     */
    intercept(req, next) {
        /** @type {?} */
        const lcUrl = req.url.toLowerCase();
        // Skip both non-mutating requests and absolute URLs.
        // Non-mutating requests don't require a token, and absolute URLs require special handling
        // anyway as the cookie set
        // on our origin is not the same as the token expected by another origin.
        if (req.method === 'GET' || req.method === 'HEAD' || lcUrl.startsWith('http://') ||
            lcUrl.startsWith('https://')) {
            return next.handle(req);
        }
        /** @type {?} */
        const token = this.tokenService.getToken();
        // Be careful not to overwrite an existing header of the same name.
        if (token !== null && !req.headers.has(this.headerName)) {
            req = req.clone({ headers: req.headers.set(this.headerName, token) });
        }
        return next.handle(req);
    }
}
HttpXsrfInterceptor.decorators = [
    { type: Injectable }
];
/** @nocollapse */
HttpXsrfInterceptor.ctorParameters = () => [
    { type: HttpXsrfTokenExtractor },
    { type: String, decorators: [{ type: Inject, args: [XSRF_HEADER_NAME,] }] }
];
if (false) {
    /** @type {?} */
    HttpXsrfInterceptor.prototype.tokenService;
    /** @type {?} */
    HttpXsrfInterceptor.prototype.headerName;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieHNyZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9odHRwL3NyYy94c3JmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7O0FBUTlFLGFBQWEsZ0JBQWdCLEdBQUcsSUFBSSxjQUFjLENBQVMsa0JBQWtCLENBQUMsQ0FBQzs7QUFDL0UsYUFBYSxnQkFBZ0IsR0FBRyxJQUFJLGNBQWMsQ0FBUyxrQkFBa0IsQ0FBQyxDQUFDOzs7Ozs7O0FBTy9FLE1BQU0sT0FBZ0Isc0JBQXNCO0NBTzNDOzs7Ozs7Ozs7Ozs7OztBQU1ELE1BQU0sT0FBTyx1QkFBdUI7Ozs7OztJQVNsQyxZQUM4QixHQUFRLEVBQStCLFFBQWdCLEVBQy9DLFVBQWtCO1FBRDFCLFFBQUcsR0FBSCxHQUFHLENBQUs7UUFBK0IsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFRO2dDQVZyQixFQUFFO3lCQUNKLElBQUk7Ozs7UUFLckMsa0JBQXFCLENBQUMsQ0FBQztLQUlxQzs7OztJQUU1RCxRQUFRO1FBQ04sSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUM5QixPQUFPLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUMzQyxJQUFJLFlBQVksS0FBSyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDMUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsWUFBWSxDQUFDO1NBQ3RDO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0tBQ3ZCOzs7WUF6QkYsVUFBVTs7Ozs0Q0FXSixNQUFNLFNBQUMsUUFBUTt5Q0FBcUIsTUFBTSxTQUFDLFdBQVc7eUNBQ3RELE1BQU0sU0FBQyxnQkFBZ0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQjlCLE1BQU0sT0FBTyxtQkFBbUI7Ozs7O0lBQzlCLFlBQ1ksY0FDMEIsVUFBa0I7UUFENUMsaUJBQVksR0FBWixZQUFZO1FBQ2MsZUFBVSxHQUFWLFVBQVUsQ0FBUTtLQUFJOzs7Ozs7SUFFNUQsU0FBUyxDQUFDLEdBQXFCLEVBQUUsSUFBaUI7O1FBQ2hELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7Ozs7O1FBS3BDLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxLQUFLLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxNQUFNLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7WUFDNUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNoQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7O1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7UUFHM0MsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZELEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDO1NBQ3JFO1FBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3pCOzs7WUF2QkYsVUFBVTs7OztZQUdpQixzQkFBc0I7eUNBQzNDLE1BQU0sU0FBQyxnQkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RE9DVU1FTlQsIMm1cGFyc2VDb29raWVWYWx1ZSBhcyBwYXJzZUNvb2tpZVZhbHVlfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtJbmplY3QsIEluamVjdGFibGUsIEluamVjdGlvblRva2VuLCBQTEFURk9STV9JRH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0h0dHBIYW5kbGVyfSBmcm9tICcuL2JhY2tlbmQnO1xuaW1wb3J0IHtIdHRwSW50ZXJjZXB0b3J9IGZyb20gJy4vaW50ZXJjZXB0b3InO1xuaW1wb3J0IHtIdHRwUmVxdWVzdH0gZnJvbSAnLi9yZXF1ZXN0JztcbmltcG9ydCB7SHR0cEV2ZW50fSBmcm9tICcuL3Jlc3BvbnNlJztcblxuZXhwb3J0IGNvbnN0IFhTUkZfQ09PS0lFX05BTUUgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignWFNSRl9DT09LSUVfTkFNRScpO1xuZXhwb3J0IGNvbnN0IFhTUkZfSEVBREVSX05BTUUgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignWFNSRl9IRUFERVJfTkFNRScpO1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgY3VycmVudCBYU1JGIHRva2VuIHRvIHVzZSB3aXRoIHRoZSBuZXh0IG91dGdvaW5nIHJlcXVlc3QuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSHR0cFhzcmZUb2tlbkV4dHJhY3RvciB7XG4gIC8qKlxuICAgKiBHZXQgdGhlIFhTUkYgdG9rZW4gdG8gdXNlIHdpdGggYW4gb3V0Z29pbmcgcmVxdWVzdC5cbiAgICpcbiAgICogV2lsbCBiZSBjYWxsZWQgZm9yIGV2ZXJ5IHJlcXVlc3QsIHNvIHRoZSB0b2tlbiBtYXkgY2hhbmdlIGJldHdlZW4gcmVxdWVzdHMuXG4gICAqL1xuICBhYnN0cmFjdCBnZXRUb2tlbigpOiBzdHJpbmd8bnVsbDtcbn1cblxuLyoqXG4gKiBgSHR0cFhzcmZUb2tlbkV4dHJhY3RvcmAgd2hpY2ggcmV0cmlldmVzIHRoZSB0b2tlbiBmcm9tIGEgY29va2llLlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgSHR0cFhzcmZDb29raWVFeHRyYWN0b3IgaW1wbGVtZW50cyBIdHRwWHNyZlRva2VuRXh0cmFjdG9yIHtcbiAgcHJpdmF0ZSBsYXN0Q29va2llU3RyaW5nOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBsYXN0VG9rZW46IHN0cmluZ3xudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogQGludGVybmFsIGZvciB0ZXN0aW5nXG4gICAqL1xuICBwYXJzZUNvdW50OiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBkb2M6IGFueSwgQEluamVjdChQTEFURk9STV9JRCkgcHJpdmF0ZSBwbGF0Zm9ybTogc3RyaW5nLFxuICAgICAgQEluamVjdChYU1JGX0NPT0tJRV9OQU1FKSBwcml2YXRlIGNvb2tpZU5hbWU6IHN0cmluZykge31cblxuICBnZXRUb2tlbigpOiBzdHJpbmd8bnVsbCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gPT09ICdzZXJ2ZXInKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY29va2llU3RyaW5nID0gdGhpcy5kb2MuY29va2llIHx8ICcnO1xuICAgIGlmIChjb29raWVTdHJpbmcgIT09IHRoaXMubGFzdENvb2tpZVN0cmluZykge1xuICAgICAgdGhpcy5wYXJzZUNvdW50Kys7XG4gICAgICB0aGlzLmxhc3RUb2tlbiA9IHBhcnNlQ29va2llVmFsdWUoY29va2llU3RyaW5nLCB0aGlzLmNvb2tpZU5hbWUpO1xuICAgICAgdGhpcy5sYXN0Q29va2llU3RyaW5nID0gY29va2llU3RyaW5nO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5sYXN0VG9rZW47XG4gIH1cbn1cblxuLyoqXG4gKiBgSHR0cEludGVyY2VwdG9yYCB3aGljaCBhZGRzIGFuIFhTUkYgdG9rZW4gdG8gZWxpZ2libGUgb3V0Z29pbmcgcmVxdWVzdHMuXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBIdHRwWHNyZkludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHRva2VuU2VydmljZTogSHR0cFhzcmZUb2tlbkV4dHJhY3RvcixcbiAgICAgIEBJbmplY3QoWFNSRl9IRUFERVJfTkFNRSkgcHJpdmF0ZSBoZWFkZXJOYW1lOiBzdHJpbmcpIHt9XG5cbiAgaW50ZXJjZXB0KHJlcTogSHR0cFJlcXVlc3Q8YW55PiwgbmV4dDogSHR0cEhhbmRsZXIpOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gICAgY29uc3QgbGNVcmwgPSByZXEudXJsLnRvTG93ZXJDYXNlKCk7XG4gICAgLy8gU2tpcCBib3RoIG5vbi1tdXRhdGluZyByZXF1ZXN0cyBhbmQgYWJzb2x1dGUgVVJMcy5cbiAgICAvLyBOb24tbXV0YXRpbmcgcmVxdWVzdHMgZG9uJ3QgcmVxdWlyZSBhIHRva2VuLCBhbmQgYWJzb2x1dGUgVVJMcyByZXF1aXJlIHNwZWNpYWwgaGFuZGxpbmdcbiAgICAvLyBhbnl3YXkgYXMgdGhlIGNvb2tpZSBzZXRcbiAgICAvLyBvbiBvdXIgb3JpZ2luIGlzIG5vdCB0aGUgc2FtZSBhcyB0aGUgdG9rZW4gZXhwZWN0ZWQgYnkgYW5vdGhlciBvcmlnaW4uXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdHRVQnIHx8IHJlcS5tZXRob2QgPT09ICdIRUFEJyB8fCBsY1VybC5zdGFydHNXaXRoKCdodHRwOi8vJykgfHxcbiAgICAgICAgbGNVcmwuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSkge1xuICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcSk7XG4gICAgfVxuICAgIGNvbnN0IHRva2VuID0gdGhpcy50b2tlblNlcnZpY2UuZ2V0VG9rZW4oKTtcblxuICAgIC8vIEJlIGNhcmVmdWwgbm90IHRvIG92ZXJ3cml0ZSBhbiBleGlzdGluZyBoZWFkZXIgb2YgdGhlIHNhbWUgbmFtZS5cbiAgICBpZiAodG9rZW4gIT09IG51bGwgJiYgIXJlcS5oZWFkZXJzLmhhcyh0aGlzLmhlYWRlck5hbWUpKSB7XG4gICAgICByZXEgPSByZXEuY2xvbmUoe2hlYWRlcnM6IHJlcS5oZWFkZXJzLnNldCh0aGlzLmhlYWRlck5hbWUsIHRva2VuKX0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV4dC5oYW5kbGUocmVxKTtcbiAgfVxufVxuIl19