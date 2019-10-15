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
/**
 * Injectable completer that allows signaling completion of an asynchronous test. Used internally.
 */
export class AsyncTestCompleter {
    constructor() {
        this._promise = new Promise((res, rej) => {
            this._resolve = res;
            this._reject = rej;
        });
    }
    /**
     * @param {?=} value
     * @return {?}
     */
    done(value) { this._resolve(value); }
    /**
     * @param {?=} error
     * @param {?=} stackTrace
     * @return {?}
     */
    fail(error, stackTrace) { this._reject(error); }
    /**
     * @return {?}
     */
    get promise() { return this._promise; }
}
if (false) {
    /** @type {?} */
    AsyncTestCompleter.prototype._resolve;
    /** @type {?} */
    AsyncTestCompleter.prototype._reject;
    /** @type {?} */
    AsyncTestCompleter.prototype._promise;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNfdGVzdF9jb21wbGV0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL2FzeW5jX3Rlc3RfY29tcGxldGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBV0EsTUFBTSxPQUFPLGtCQUFrQjs7d0JBS0ksSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7U0FDcEIsQ0FBQzs7Ozs7O0lBQ0YsSUFBSSxDQUFDLEtBQVcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQUUzQyxJQUFJLENBQUMsS0FBVyxFQUFFLFVBQW1CLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFOzs7O0lBRS9ELElBQUksT0FBTyxLQUFtQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtDQUN0RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBJbmplY3RhYmxlIGNvbXBsZXRlciB0aGF0IGFsbG93cyBzaWduYWxpbmcgY29tcGxldGlvbiBvZiBhbiBhc3luY2hyb25vdXMgdGVzdC4gVXNlZCBpbnRlcm5hbGx5LlxuICovXG5leHBvcnQgY2xhc3MgQXN5bmNUZXN0Q29tcGxldGVyIHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgX3Jlc29sdmUgITogKHJlc3VsdDogYW55KSA9PiB2b2lkO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSBfcmVqZWN0ICE6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSBfcHJvbWlzZTogUHJvbWlzZTxhbnk+ID0gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgdGhpcy5fcmVzb2x2ZSA9IHJlcztcbiAgICB0aGlzLl9yZWplY3QgPSByZWo7XG4gIH0pO1xuICBkb25lKHZhbHVlPzogYW55KSB7IHRoaXMuX3Jlc29sdmUodmFsdWUpOyB9XG5cbiAgZmFpbChlcnJvcj86IGFueSwgc3RhY2tUcmFjZT86IHN0cmluZykgeyB0aGlzLl9yZWplY3QoZXJyb3IpOyB9XG5cbiAgZ2V0IHByb21pc2UoKTogUHJvbWlzZTxhbnk+IHsgcmV0dXJuIHRoaXMuX3Byb21pc2U7IH1cbn1cbiJdfQ==