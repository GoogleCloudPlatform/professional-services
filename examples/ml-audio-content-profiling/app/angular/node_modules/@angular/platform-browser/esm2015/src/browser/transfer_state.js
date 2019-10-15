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
import { APP_ID, Injectable, NgModule } from '@angular/core';
import { DOCUMENT } from '../dom/dom_tokens';
/**
 * @param {?} text
 * @return {?}
 */
export function escapeHtml(text) {
    /** @type {?} */
    const escapedText = {
        '&': '&a;',
        '"': '&q;',
        '\'': '&s;',
        '<': '&l;',
        '>': '&g;',
    };
    return text.replace(/[&"'<>]/g, s => escapedText[s]);
}
/**
 * @param {?} text
 * @return {?}
 */
export function unescapeHtml(text) {
    /** @type {?} */
    const unescapedText = {
        '&a;': '&',
        '&q;': '"',
        '&s;': '\'',
        '&l;': '<',
        '&g;': '>',
    };
    return text.replace(/&[^;]+;/g, s => unescapedText[s]);
}
/** @typedef {?} */
var StateKey;
export { StateKey };
/**
 * Create a `StateKey<T>` that can be used to store value of type T with `TransferState`.
 *
 * Example:
 *
 * ```
 * const COUNTER_KEY = makeStateKey<number>('counter');
 * let value = 10;
 *
 * transferState.set(COUNTER_KEY, value);
 * ```
 *
 * \@publicApi
 * @template T
 * @param {?} key
 * @return {?}
 */
export function makeStateKey(key) {
    return /** @type {?} */ (key);
}
/**
 * A key value store that is transferred from the application on the server side to the application
 * on the client side.
 *
 * `TransferState` will be available as an injectable token. To use it import
 * `ServerTransferStateModule` on the server and `BrowserTransferStateModule` on the client.
 *
 * The values in the store are serialized/deserialized using JSON.stringify/JSON.parse. So only
 * boolean, number, string, null and non-class objects will be serialized and deserialzied in a
 * non-lossy manner.
 *
 * \@publicApi
 */
export class TransferState {
    constructor() {
        this.store = {};
        this.onSerializeCallbacks = {};
    }
    /**
     * \@internal
     * @param {?} initState
     * @return {?}
     */
    static init(initState) {
        /** @type {?} */
        const transferState = new TransferState();
        transferState.store = initState;
        return transferState;
    }
    /**
     * Get the value corresponding to a key. Return `defaultValue` if key is not found.
     * @template T
     * @param {?} key
     * @param {?} defaultValue
     * @return {?}
     */
    get(key, defaultValue) {
        return this.store[key] !== undefined ? /** @type {?} */ (this.store[key]) : defaultValue;
    }
    /**
     * Set the value corresponding to a key.
     * @template T
     * @param {?} key
     * @param {?} value
     * @return {?}
     */
    set(key, value) { this.store[key] = value; }
    /**
     * Remove a key from the store.
     * @template T
     * @param {?} key
     * @return {?}
     */
    remove(key) { delete this.store[key]; }
    /**
     * Test whether a key exists in the store.
     * @template T
     * @param {?} key
     * @return {?}
     */
    hasKey(key) { return this.store.hasOwnProperty(key); }
    /**
     * Register a callback to provide the value for a key when `toJson` is called.
     * @template T
     * @param {?} key
     * @param {?} callback
     * @return {?}
     */
    onSerialize(key, callback) {
        this.onSerializeCallbacks[key] = callback;
    }
    /**
     * Serialize the current state of the store to JSON.
     * @return {?}
     */
    toJson() {
        // Call the onSerialize callbacks and put those values into the store.
        for (const key in this.onSerializeCallbacks) {
            if (this.onSerializeCallbacks.hasOwnProperty(key)) {
                try {
                    this.store[key] = this.onSerializeCallbacks[key]();
                }
                catch (e) {
                    console.warn('Exception in onSerialize callback: ', e);
                }
            }
        }
        return JSON.stringify(this.store);
    }
}
TransferState.decorators = [
    { type: Injectable }
];
if (false) {
    /** @type {?} */
    TransferState.prototype.store;
    /** @type {?} */
    TransferState.prototype.onSerializeCallbacks;
}
/**
 * @param {?} doc
 * @param {?} appId
 * @return {?}
 */
export function initTransferState(doc, appId) {
    /** @type {?} */
    const script = doc.getElementById(appId + '-state');
    /** @type {?} */
    let initialState = {};
    if (script && script.textContent) {
        try {
            initialState = JSON.parse(unescapeHtml(script.textContent));
        }
        catch (e) {
            console.warn('Exception while restoring TransferState for app ' + appId, e);
        }
    }
    return TransferState.init(initialState);
}
/**
 * NgModule to install on the client side while using the `TransferState` to transfer state from
 * server to client.
 *
 * \@publicApi
 */
export class BrowserTransferStateModule {
}
BrowserTransferStateModule.decorators = [
    { type: NgModule, args: [{
                providers: [{ provide: TransferState, useFactory: initTransferState, deps: [DOCUMENT, APP_ID] }],
            },] }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmZXJfc3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGF0Zm9ybS1icm93c2VyL3NyYy9icm93c2VyL3RyYW5zZmVyX3N0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7QUFFM0MsTUFBTSxVQUFVLFVBQVUsQ0FBQyxJQUFZOztJQUNyQyxNQUFNLFdBQVcsR0FBMEI7UUFDekMsR0FBRyxFQUFFLEtBQUs7UUFDVixHQUFHLEVBQUUsS0FBSztRQUNWLElBQUksRUFBRSxLQUFLO1FBQ1gsR0FBRyxFQUFFLEtBQUs7UUFDVixHQUFHLEVBQUUsS0FBSztLQUNYLENBQUM7SUFDRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEQ7Ozs7O0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxJQUFZOztJQUN2QyxNQUFNLGFBQWEsR0FBMEI7UUFDM0MsS0FBSyxFQUFFLEdBQUc7UUFDVixLQUFLLEVBQUUsR0FBRztRQUNWLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLEdBQUc7UUFDVixLQUFLLEVBQUUsR0FBRztLQUNYLENBQUM7SUFDRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDeEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdDRCxNQUFNLFVBQVUsWUFBWSxDQUFXLEdBQVc7SUFDaEQseUJBQU8sR0FBa0IsRUFBQztDQUMzQjs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSxPQUFPLGFBQWE7O3FCQUN1QixFQUFFO29DQUNtQixFQUFFOzs7Ozs7O0lBR3RFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBYTs7UUFDdkIsTUFBTSxhQUFhLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUMxQyxhQUFhLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUNoQyxPQUFPLGFBQWEsQ0FBQztLQUN0Qjs7Ozs7Ozs7SUFLRCxHQUFHLENBQUksR0FBZ0IsRUFBRSxZQUFlO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxtQkFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBTSxFQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7S0FDNUU7Ozs7Ozs7O0lBS0QsR0FBRyxDQUFJLEdBQWdCLEVBQUUsS0FBUSxJQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEVBQUU7Ozs7Ozs7SUFLckUsTUFBTSxDQUFJLEdBQWdCLElBQVUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Ozs7Ozs7SUFLN0QsTUFBTSxDQUFJLEdBQWdCLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFOzs7Ozs7OztJQUt0RSxXQUFXLENBQUksR0FBZ0IsRUFBRSxRQUFpQjtRQUNoRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDO0tBQzNDOzs7OztJQUtELE1BQU07O1FBRUosS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDM0MsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNqRCxJQUFJO29CQUNGLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7aUJBQ3BEO2dCQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ3hEO2FBQ0Y7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkM7OztZQXhERixVQUFVOzs7Ozs7Ozs7Ozs7O0FBMkRYLE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxHQUFhLEVBQUUsS0FBYTs7SUFHNUQsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUM7O0lBQ3BELElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO1FBQ2hDLElBQUk7WUFDRixZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7U0FDN0Q7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0RBQWtELEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzdFO0tBQ0Y7SUFDRCxPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7Q0FDekM7Ozs7Ozs7QUFXRCxNQUFNLE9BQU8sMEJBQTBCOzs7WUFIdEMsUUFBUSxTQUFDO2dCQUNSLFNBQVMsRUFBRSxDQUFDLEVBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7YUFDL0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVBQX0lELCBJbmplY3RhYmxlLCBOZ01vZHVsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICcuLi9kb20vZG9tX3Rva2Vucyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVIdG1sKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGVzY2FwZWRUZXh0OiB7W2s6IHN0cmluZ106IHN0cmluZ30gPSB7XG4gICAgJyYnOiAnJmE7JyxcbiAgICAnXCInOiAnJnE7JyxcbiAgICAnXFwnJzogJyZzOycsXG4gICAgJzwnOiAnJmw7JyxcbiAgICAnPic6ICcmZzsnLFxuICB9O1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bJlwiJzw+XS9nLCBzID0+IGVzY2FwZWRUZXh0W3NdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuZXNjYXBlSHRtbCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB1bmVzY2FwZWRUZXh0OiB7W2s6IHN0cmluZ106IHN0cmluZ30gPSB7XG4gICAgJyZhOyc6ICcmJyxcbiAgICAnJnE7JzogJ1wiJyxcbiAgICAnJnM7JzogJ1xcJycsXG4gICAgJyZsOyc6ICc8JyxcbiAgICAnJmc7JzogJz4nLFxuICB9O1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKC8mW147XSs7L2csIHMgPT4gdW5lc2NhcGVkVGV4dFtzXSk7XG59XG5cbi8qKlxuICogQSB0eXBlLXNhZmUga2V5IHRvIHVzZSB3aXRoIGBUcmFuc2ZlclN0YXRlYC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogY29uc3QgQ09VTlRFUl9LRVkgPSBtYWtlU3RhdGVLZXk8bnVtYmVyPignY291bnRlcicpO1xuICogbGV0IHZhbHVlID0gMTA7XG4gKlxuICogdHJhbnNmZXJTdGF0ZS5zZXQoQ09VTlRFUl9LRVksIHZhbHVlKTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgU3RhdGVLZXk8VD4gPSBzdHJpbmcgJiB7X19ub3RfYV9zdHJpbmc6IG5ldmVyfTtcblxuLyoqXG4gKiBDcmVhdGUgYSBgU3RhdGVLZXk8VD5gIHRoYXQgY2FuIGJlIHVzZWQgdG8gc3RvcmUgdmFsdWUgb2YgdHlwZSBUIHdpdGggYFRyYW5zZmVyU3RhdGVgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBjb25zdCBDT1VOVEVSX0tFWSA9IG1ha2VTdGF0ZUtleTxudW1iZXI+KCdjb3VudGVyJyk7XG4gKiBsZXQgdmFsdWUgPSAxMDtcbiAqXG4gKiB0cmFuc2ZlclN0YXRlLnNldChDT1VOVEVSX0tFWSwgdmFsdWUpO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFrZVN0YXRlS2V5PFQgPSB2b2lkPihrZXk6IHN0cmluZyk6IFN0YXRlS2V5PFQ+IHtcbiAgcmV0dXJuIGtleSBhcyBTdGF0ZUtleTxUPjtcbn1cblxuLyoqXG4gKiBBIGtleSB2YWx1ZSBzdG9yZSB0aGF0IGlzIHRyYW5zZmVycmVkIGZyb20gdGhlIGFwcGxpY2F0aW9uIG9uIHRoZSBzZXJ2ZXIgc2lkZSB0byB0aGUgYXBwbGljYXRpb25cbiAqIG9uIHRoZSBjbGllbnQgc2lkZS5cbiAqXG4gKiBgVHJhbnNmZXJTdGF0ZWAgd2lsbCBiZSBhdmFpbGFibGUgYXMgYW4gaW5qZWN0YWJsZSB0b2tlbi4gVG8gdXNlIGl0IGltcG9ydFxuICogYFNlcnZlclRyYW5zZmVyU3RhdGVNb2R1bGVgIG9uIHRoZSBzZXJ2ZXIgYW5kIGBCcm93c2VyVHJhbnNmZXJTdGF0ZU1vZHVsZWAgb24gdGhlIGNsaWVudC5cbiAqXG4gKiBUaGUgdmFsdWVzIGluIHRoZSBzdG9yZSBhcmUgc2VyaWFsaXplZC9kZXNlcmlhbGl6ZWQgdXNpbmcgSlNPTi5zdHJpbmdpZnkvSlNPTi5wYXJzZS4gU28gb25seVxuICogYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcsIG51bGwgYW5kIG5vbi1jbGFzcyBvYmplY3RzIHdpbGwgYmUgc2VyaWFsaXplZCBhbmQgZGVzZXJpYWx6aWVkIGluIGFcbiAqIG5vbi1sb3NzeSBtYW5uZXIuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJTdGF0ZSB7XG4gIHByaXZhdGUgc3RvcmU6IHtbazogc3RyaW5nXToge30gfCB1bmRlZmluZWR9ID0ge307XG4gIHByaXZhdGUgb25TZXJpYWxpemVDYWxsYmFja3M6IHtbazogc3RyaW5nXTogKCkgPT4ge30gfCB1bmRlZmluZWR9ID0ge307XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgaW5pdChpbml0U3RhdGU6IHt9KSB7XG4gICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IG5ldyBUcmFuc2ZlclN0YXRlKCk7XG4gICAgdHJhbnNmZXJTdGF0ZS5zdG9yZSA9IGluaXRTdGF0ZTtcbiAgICByZXR1cm4gdHJhbnNmZXJTdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHZhbHVlIGNvcnJlc3BvbmRpbmcgdG8gYSBrZXkuIFJldHVybiBgZGVmYXVsdFZhbHVlYCBpZiBrZXkgaXMgbm90IGZvdW5kLlxuICAgKi9cbiAgZ2V0PFQ+KGtleTogU3RhdGVLZXk8VD4sIGRlZmF1bHRWYWx1ZTogVCk6IFQge1xuICAgIHJldHVybiB0aGlzLnN0b3JlW2tleV0gIT09IHVuZGVmaW5lZCA/IHRoaXMuc3RvcmVba2V5XSBhcyBUIDogZGVmYXVsdFZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdmFsdWUgY29ycmVzcG9uZGluZyB0byBhIGtleS5cbiAgICovXG4gIHNldDxUPihrZXk6IFN0YXRlS2V5PFQ+LCB2YWx1ZTogVCk6IHZvaWQgeyB0aGlzLnN0b3JlW2tleV0gPSB2YWx1ZTsgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBrZXkgZnJvbSB0aGUgc3RvcmUuXG4gICAqL1xuICByZW1vdmU8VD4oa2V5OiBTdGF0ZUtleTxUPik6IHZvaWQgeyBkZWxldGUgdGhpcy5zdG9yZVtrZXldOyB9XG5cbiAgLyoqXG4gICAqIFRlc3Qgd2hldGhlciBhIGtleSBleGlzdHMgaW4gdGhlIHN0b3JlLlxuICAgKi9cbiAgaGFzS2V5PFQ+KGtleTogU3RhdGVLZXk8VD4pIHsgcmV0dXJuIHRoaXMuc3RvcmUuaGFzT3duUHJvcGVydHkoa2V5KTsgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIHByb3ZpZGUgdGhlIHZhbHVlIGZvciBhIGtleSB3aGVuIGB0b0pzb25gIGlzIGNhbGxlZC5cbiAgICovXG4gIG9uU2VyaWFsaXplPFQ+KGtleTogU3RhdGVLZXk8VD4sIGNhbGxiYWNrOiAoKSA9PiBUKTogdm9pZCB7XG4gICAgdGhpcy5vblNlcmlhbGl6ZUNhbGxiYWNrc1trZXldID0gY2FsbGJhY2s7XG4gIH1cblxuICAvKipcbiAgICogU2VyaWFsaXplIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBzdG9yZSB0byBKU09OLlxuICAgKi9cbiAgdG9Kc29uKCk6IHN0cmluZyB7XG4gICAgLy8gQ2FsbCB0aGUgb25TZXJpYWxpemUgY2FsbGJhY2tzIGFuZCBwdXQgdGhvc2UgdmFsdWVzIGludG8gdGhlIHN0b3JlLlxuICAgIGZvciAoY29uc3Qga2V5IGluIHRoaXMub25TZXJpYWxpemVDYWxsYmFja3MpIHtcbiAgICAgIGlmICh0aGlzLm9uU2VyaWFsaXplQ2FsbGJhY2tzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aGlzLnN0b3JlW2tleV0gPSB0aGlzLm9uU2VyaWFsaXplQ2FsbGJhY2tzW2tleV0oKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignRXhjZXB0aW9uIGluIG9uU2VyaWFsaXplIGNhbGxiYWNrOiAnLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5zdG9yZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRUcmFuc2ZlclN0YXRlKGRvYzogRG9jdW1lbnQsIGFwcElkOiBzdHJpbmcpIHtcbiAgLy8gTG9jYXRlIHRoZSBzY3JpcHQgdGFnIHdpdGggdGhlIEpTT04gZGF0YSB0cmFuc2ZlcnJlZCBmcm9tIHRoZSBzZXJ2ZXIuXG4gIC8vIFRoZSBpZCBvZiB0aGUgc2NyaXB0IHRhZyBpcyBzZXQgdG8gdGhlIEFuZ3VsYXIgYXBwSWQgKyAnc3RhdGUnLlxuICBjb25zdCBzY3JpcHQgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoYXBwSWQgKyAnLXN0YXRlJyk7XG4gIGxldCBpbml0aWFsU3RhdGUgPSB7fTtcbiAgaWYgKHNjcmlwdCAmJiBzY3JpcHQudGV4dENvbnRlbnQpIHtcbiAgICB0cnkge1xuICAgICAgaW5pdGlhbFN0YXRlID0gSlNPTi5wYXJzZSh1bmVzY2FwZUh0bWwoc2NyaXB0LnRleHRDb250ZW50KSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKCdFeGNlcHRpb24gd2hpbGUgcmVzdG9yaW5nIFRyYW5zZmVyU3RhdGUgZm9yIGFwcCAnICsgYXBwSWQsIGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gVHJhbnNmZXJTdGF0ZS5pbml0KGluaXRpYWxTdGF0ZSk7XG59XG5cbi8qKlxuICogTmdNb2R1bGUgdG8gaW5zdGFsbCBvbiB0aGUgY2xpZW50IHNpZGUgd2hpbGUgdXNpbmcgdGhlIGBUcmFuc2ZlclN0YXRlYCB0byB0cmFuc2ZlciBzdGF0ZSBmcm9tXG4gKiBzZXJ2ZXIgdG8gY2xpZW50LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQE5nTW9kdWxlKHtcbiAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IFRyYW5zZmVyU3RhdGUsIHVzZUZhY3Rvcnk6IGluaXRUcmFuc2ZlclN0YXRlLCBkZXBzOiBbRE9DVU1FTlQsIEFQUF9JRF19XSxcbn0pXG5leHBvcnQgY2xhc3MgQnJvd3NlclRyYW5zZmVyU3RhdGVNb2R1bGUge1xufVxuIl19