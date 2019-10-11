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
import { LocationStrategy } from '@angular/common';
import { EventEmitter, Injectable } from '@angular/core';
/**
 * A mock implementation of {\@link LocationStrategy} that allows tests to fire simulated
 * location events.
 *
 * \@publicApi
 */
export class MockLocationStrategy extends LocationStrategy {
    constructor() {
        super();
        this.internalBaseHref = '/';
        this.internalPath = '/';
        this.internalTitle = '';
        this.urlChanges = [];
        /**
         * \@internal
         */
        this._subject = new EventEmitter();
    }
    /**
     * @param {?} url
     * @return {?}
     */
    simulatePopState(url) {
        this.internalPath = url;
        this._subject.emit(new _MockPopStateEvent(this.path()));
    }
    /**
     * @param {?=} includeHash
     * @return {?}
     */
    path(includeHash = false) { return this.internalPath; }
    /**
     * @param {?} internal
     * @return {?}
     */
    prepareExternalUrl(internal) {
        if (internal.startsWith('/') && this.internalBaseHref.endsWith('/')) {
            return this.internalBaseHref + internal.substring(1);
        }
        return this.internalBaseHref + internal;
    }
    /**
     * @param {?} ctx
     * @param {?} title
     * @param {?} path
     * @param {?} query
     * @return {?}
     */
    pushState(ctx, title, path, query) {
        this.internalTitle = title;
        /** @type {?} */
        const url = path + (query.length > 0 ? ('?' + query) : '');
        this.internalPath = url;
        /** @type {?} */
        const externalUrl = this.prepareExternalUrl(url);
        this.urlChanges.push(externalUrl);
    }
    /**
     * @param {?} ctx
     * @param {?} title
     * @param {?} path
     * @param {?} query
     * @return {?}
     */
    replaceState(ctx, title, path, query) {
        this.internalTitle = title;
        /** @type {?} */
        const url = path + (query.length > 0 ? ('?' + query) : '');
        this.internalPath = url;
        /** @type {?} */
        const externalUrl = this.prepareExternalUrl(url);
        this.urlChanges.push('replace: ' + externalUrl);
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    onPopState(fn) { this._subject.subscribe({ next: fn }); }
    /**
     * @return {?}
     */
    getBaseHref() { return this.internalBaseHref; }
    /**
     * @return {?}
     */
    back() {
        if (this.urlChanges.length > 0) {
            this.urlChanges.pop();
            /** @type {?} */
            const nextUrl = this.urlChanges.length > 0 ? this.urlChanges[this.urlChanges.length - 1] : '';
            this.simulatePopState(nextUrl);
        }
    }
    /**
     * @return {?}
     */
    forward() { throw 'not implemented'; }
}
MockLocationStrategy.decorators = [
    { type: Injectable }
];
/** @nocollapse */
MockLocationStrategy.ctorParameters = () => [];
if (false) {
    /** @type {?} */
    MockLocationStrategy.prototype.internalBaseHref;
    /** @type {?} */
    MockLocationStrategy.prototype.internalPath;
    /** @type {?} */
    MockLocationStrategy.prototype.internalTitle;
    /** @type {?} */
    MockLocationStrategy.prototype.urlChanges;
    /**
     * \@internal
     * @type {?}
     */
    MockLocationStrategy.prototype._subject;
}
class _MockPopStateEvent {
    /**
     * @param {?} newUrl
     */
    constructor(newUrl) {
        this.newUrl = newUrl;
        this.pop = true;
        this.type = 'popstate';
    }
}
if (false) {
    /** @type {?} */
    _MockPopStateEvent.prototype.pop;
    /** @type {?} */
    _MockPopStateEvent.prototype.type;
    /** @type {?} */
    _MockPopStateEvent.prototype.newUrl;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja19sb2NhdGlvbl9zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi90ZXN0aW5nL3NyYy9tb2NrX2xvY2F0aW9uX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDakQsT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7QUFXdkQsTUFBTSxPQUFPLG9CQUFxQixTQUFRLGdCQUFnQjtJQU94RDtRQUFnQixLQUFLLEVBQUUsQ0FBQztRQU54Qix3QkFBMkIsR0FBRyxDQUFDO1FBQy9CLG9CQUF1QixHQUFHLENBQUM7UUFDM0IscUJBQXdCLEVBQUUsQ0FBQztRQUMzQixrQkFBdUIsRUFBRSxDQUFDOzs7O1FBRTFCLGdCQUE4QixJQUFJLFlBQVksRUFBRSxDQUFDO0tBQ3ZCOzs7OztJQUUxQixnQkFBZ0IsQ0FBQyxHQUFXO1FBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztLQUN6RDs7Ozs7SUFFRCxJQUFJLENBQUMsY0FBdUIsS0FBSyxJQUFZLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFOzs7OztJQUV4RSxrQkFBa0IsQ0FBQyxRQUFnQjtRQUNqQyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNuRSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3REO1FBQ0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDO0tBQ3pDOzs7Ozs7OztJQUVELFNBQVMsQ0FBQyxHQUFRLEVBQUUsS0FBYSxFQUFFLElBQVksRUFBRSxLQUFhO1FBQzVELElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDOztRQUUzQixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDOztRQUV4QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDbkM7Ozs7Ozs7O0lBRUQsWUFBWSxDQUFDLEdBQVEsRUFBRSxLQUFhLEVBQUUsSUFBWSxFQUFFLEtBQWE7UUFDL0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7O1FBRTNCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUM7O1FBRXhCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLENBQUM7S0FDakQ7Ozs7O0lBRUQsVUFBVSxDQUFDLEVBQXdCLElBQVUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxFQUFFOzs7O0lBRW5GLFdBQVcsS0FBYSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFOzs7O0lBRXZELElBQUk7UUFDRixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM5QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDOztZQUN0QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUM5RixJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDaEM7S0FDRjs7OztJQUVELE9BQU8sS0FBVyxNQUFNLGlCQUFpQixDQUFDLEVBQUU7OztZQXhEN0MsVUFBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJEWCxNQUFNLGtCQUFrQjs7OztJQUd0QixZQUFtQixNQUFjO1FBQWQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUZqQyxXQUFlLElBQUksQ0FBQztRQUNwQixZQUFlLFVBQVUsQ0FBQztLQUNXO0NBQ3RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0xvY2F0aW9uU3RyYXRlZ3l9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuXG4vKipcbiAqIEEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTG9jYXRpb25TdHJhdGVneX0gdGhhdCBhbGxvd3MgdGVzdHMgdG8gZmlyZSBzaW11bGF0ZWRcbiAqIGxvY2F0aW9uIGV2ZW50cy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBNb2NrTG9jYXRpb25TdHJhdGVneSBleHRlbmRzIExvY2F0aW9uU3RyYXRlZ3kge1xuICBpbnRlcm5hbEJhc2VIcmVmOiBzdHJpbmcgPSAnLyc7XG4gIGludGVybmFsUGF0aDogc3RyaW5nID0gJy8nO1xuICBpbnRlcm5hbFRpdGxlOiBzdHJpbmcgPSAnJztcbiAgdXJsQ2hhbmdlczogc3RyaW5nW10gPSBbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfc3ViamVjdDogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIGNvbnN0cnVjdG9yKCkgeyBzdXBlcigpOyB9XG5cbiAgc2ltdWxhdGVQb3BTdGF0ZSh1cmw6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuaW50ZXJuYWxQYXRoID0gdXJsO1xuICAgIHRoaXMuX3N1YmplY3QuZW1pdChuZXcgX01vY2tQb3BTdGF0ZUV2ZW50KHRoaXMucGF0aCgpKSk7XG4gIH1cblxuICBwYXRoKGluY2x1ZGVIYXNoOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5pbnRlcm5hbFBhdGg7IH1cblxuICBwcmVwYXJlRXh0ZXJuYWxVcmwoaW50ZXJuYWw6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGludGVybmFsLnN0YXJ0c1dpdGgoJy8nKSAmJiB0aGlzLmludGVybmFsQmFzZUhyZWYuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxCYXNlSHJlZiArIGludGVybmFsLnN1YnN0cmluZygxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW50ZXJuYWxCYXNlSHJlZiArIGludGVybmFsO1xuICB9XG5cbiAgcHVzaFN0YXRlKGN0eDogYW55LCB0aXRsZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmludGVybmFsVGl0bGUgPSB0aXRsZTtcblxuICAgIGNvbnN0IHVybCA9IHBhdGggKyAocXVlcnkubGVuZ3RoID4gMCA/ICgnPycgKyBxdWVyeSkgOiAnJyk7XG4gICAgdGhpcy5pbnRlcm5hbFBhdGggPSB1cmw7XG5cbiAgICBjb25zdCBleHRlcm5hbFVybCA9IHRoaXMucHJlcGFyZUV4dGVybmFsVXJsKHVybCk7XG4gICAgdGhpcy51cmxDaGFuZ2VzLnB1c2goZXh0ZXJuYWxVcmwpO1xuICB9XG5cbiAgcmVwbGFjZVN0YXRlKGN0eDogYW55LCB0aXRsZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIHF1ZXJ5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLmludGVybmFsVGl0bGUgPSB0aXRsZTtcblxuICAgIGNvbnN0IHVybCA9IHBhdGggKyAocXVlcnkubGVuZ3RoID4gMCA/ICgnPycgKyBxdWVyeSkgOiAnJyk7XG4gICAgdGhpcy5pbnRlcm5hbFBhdGggPSB1cmw7XG5cbiAgICBjb25zdCBleHRlcm5hbFVybCA9IHRoaXMucHJlcGFyZUV4dGVybmFsVXJsKHVybCk7XG4gICAgdGhpcy51cmxDaGFuZ2VzLnB1c2goJ3JlcGxhY2U6ICcgKyBleHRlcm5hbFVybCk7XG4gIH1cblxuICBvblBvcFN0YXRlKGZuOiAodmFsdWU6IGFueSkgPT4gdm9pZCk6IHZvaWQgeyB0aGlzLl9zdWJqZWN0LnN1YnNjcmliZSh7bmV4dDogZm59KTsgfVxuXG4gIGdldEJhc2VIcmVmKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmludGVybmFsQmFzZUhyZWY7IH1cblxuICBiYWNrKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnVybENoYW5nZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy51cmxDaGFuZ2VzLnBvcCgpO1xuICAgICAgY29uc3QgbmV4dFVybCA9IHRoaXMudXJsQ2hhbmdlcy5sZW5ndGggPiAwID8gdGhpcy51cmxDaGFuZ2VzW3RoaXMudXJsQ2hhbmdlcy5sZW5ndGggLSAxXSA6ICcnO1xuICAgICAgdGhpcy5zaW11bGF0ZVBvcFN0YXRlKG5leHRVcmwpO1xuICAgIH1cbiAgfVxuXG4gIGZvcndhcmQoKTogdm9pZCB7IHRocm93ICdub3QgaW1wbGVtZW50ZWQnOyB9XG59XG5cbmNsYXNzIF9Nb2NrUG9wU3RhdGVFdmVudCB7XG4gIHBvcDogYm9vbGVhbiA9IHRydWU7XG4gIHR5cGU6IHN0cmluZyA9ICdwb3BzdGF0ZSc7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuZXdVcmw6IHN0cmluZykge31cbn1cbiJdfQ==