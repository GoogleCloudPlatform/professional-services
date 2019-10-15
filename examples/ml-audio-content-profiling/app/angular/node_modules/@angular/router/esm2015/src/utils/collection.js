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
import { ɵisObservable as isObservable, ɵisPromise as isPromise } from '@angular/core';
import { from, of } from 'rxjs';
import { concatAll, every, last as lastValue, map, mergeAll } from 'rxjs/operators';
import { PRIMARY_OUTLET } from '../shared';
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function shallowEqualArrays(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; ++i) {
        if (!shallowEqual(a[i], b[i]))
            return false;
    }
    return true;
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function shallowEqual(a, b) {
    /** @type {?} */
    const k1 = Object.keys(a);
    /** @type {?} */
    const k2 = Object.keys(b);
    if (k1.length != k2.length) {
        return false;
    }
    /** @type {?} */
    let key;
    for (let i = 0; i < k1.length; i++) {
        key = k1[i];
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
/**
 * Flattens single-level nested arrays.
 * @template T
 * @param {?} arr
 * @return {?}
 */
export function flatten(arr) {
    return Array.prototype.concat.apply([], arr);
}
/**
 * Return the last element of an array.
 * @template T
 * @param {?} a
 * @return {?}
 */
export function last(a) {
    return a.length > 0 ? a[a.length - 1] : null;
}
/**
 * Verifys all booleans in an array are `true`.
 * @param {?} bools
 * @return {?}
 */
export function and(bools) {
    return !bools.some(v => !v);
}
/**
 * @template K, V
 * @param {?} map
 * @param {?} callback
 * @return {?}
 */
export function forEach(map, callback) {
    for (const prop in map) {
        if (map.hasOwnProperty(prop)) {
            callback(map[prop], prop);
        }
    }
}
/**
 * @template A, B
 * @param {?} obj
 * @param {?} fn
 * @return {?}
 */
export function waitForMap(obj, fn) {
    if (Object.keys(obj).length === 0) {
        return of({});
    }
    /** @type {?} */
    const waitHead = [];
    /** @type {?} */
    const waitTail = [];
    /** @type {?} */
    const res = {};
    forEach(obj, (a, k) => {
        /** @type {?} */
        const mapped = fn(k, a).pipe(map((r) => res[k] = r));
        if (k === PRIMARY_OUTLET) {
            waitHead.push(mapped);
        }
        else {
            waitTail.push(mapped);
        }
    });
    // Closure compiler has problem with using spread operator here. So just using Array.concat.
    return of.apply(null, waitHead.concat(waitTail)).pipe(concatAll(), lastValue(), map(() => res));
}
/**
 * ANDs Observables by merging all input observables, reducing to an Observable verifying all
 * input Observables return `true`.
 * @param {?} observables
 * @return {?}
 */
export function andObservables(observables) {
    return observables.pipe(mergeAll(), every((result) => result === true));
}
/**
 * @template T
 * @param {?} value
 * @return {?}
 */
export function wrapIntoObservable(value) {
    if (isObservable(value)) {
        return value;
    }
    if (isPromise(value)) {
        // Use `Promise.resolve()` to wrap promise-like instances.
        // Required ie when a Resolver returns a AngularJS `$q` promise to correctly trigger the
        // change detection.
        return from(Promise.resolve(value));
    }
    return of(/** @type {?} */ (value));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JvdXRlci9zcmMvdXRpbHMvY29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBa0IsYUFBYSxJQUFJLFlBQVksRUFBRSxVQUFVLElBQUksU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3RHLE9BQU8sRUFBYSxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzNDLE9BQU8sRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksSUFBSSxTQUFTLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWxGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxXQUFXLENBQUM7Ozs7OztBQUV6QyxNQUFNLFVBQVUsa0JBQWtCLENBQUMsQ0FBUSxFQUFFLENBQVE7SUFDbkQsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7S0FDN0M7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUFDLENBQXFCLEVBQUUsQ0FBcUI7O0lBQ3ZFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7O0lBQzFCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUIsSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUU7UUFDMUIsT0FBTyxLQUFLLENBQUM7S0FDZDs7SUFDRCxJQUFJLEdBQUcsQ0FBUztJQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNsQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3JCLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsT0FBTyxDQUFJLEdBQVU7SUFDbkMsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0NBQzlDOzs7Ozs7O0FBS0QsTUFBTSxVQUFVLElBQUksQ0FBSSxDQUFNO0lBQzVCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Q0FDOUM7Ozs7OztBQUtELE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBZ0I7SUFDbEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzdCOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLE9BQU8sQ0FBTyxHQUF1QixFQUFFLFFBQW1DO0lBQ3hGLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxFQUFFO1FBQ3RCLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QixRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzNCO0tBQ0Y7Q0FDRjs7Ozs7OztBQUVELE1BQU0sVUFBVSxVQUFVLENBQ3RCLEdBQXFCLEVBQUUsRUFBc0M7SUFDL0QsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDakMsT0FBTyxFQUFFLENBQUUsRUFBRSxDQUFDLENBQUM7S0FDaEI7O0lBRUQsTUFBTSxRQUFRLEdBQW9CLEVBQUUsQ0FBQzs7SUFDckMsTUFBTSxRQUFRLEdBQW9CLEVBQUUsQ0FBQzs7SUFDckMsTUFBTSxHQUFHLEdBQXFCLEVBQUUsQ0FBQztJQUVqQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBSSxFQUFFLENBQVMsRUFBRSxFQUFFOztRQUMvQixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxLQUFLLGNBQWMsRUFBRTtZQUN4QixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZCO2FBQU07WUFDTCxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZCO0tBQ0YsQ0FBQyxDQUFDOztJQUdILE9BQU8sRUFBRSxDQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztDQUNsRzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxjQUFjLENBQUMsV0FBd0M7SUFDckUsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLE1BQVcsRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDOUU7Ozs7OztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBSSxLQUF3RDtJQUU1RixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN2QixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7Ozs7UUFJcEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsT0FBTyxFQUFFLG1CQUFFLEtBQVUsRUFBQyxDQUFDO0NBQ3hCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeSwgybVpc09ic2VydmFibGUgYXMgaXNPYnNlcnZhYmxlLCDJtWlzUHJvbWlzZSBhcyBpc1Byb21pc2V9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBmcm9tLCBvZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtjb25jYXRBbGwsIGV2ZXJ5LCBsYXN0IGFzIGxhc3RWYWx1ZSwgbWFwLCBtZXJnZUFsbH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge1BSSU1BUllfT1VUTEVUfSBmcm9tICcuLi9zaGFyZWQnO1xuXG5leHBvcnQgZnVuY3Rpb24gc2hhbGxvd0VxdWFsQXJyYXlzKGE6IGFueVtdLCBiOiBhbnlbXSk6IGJvb2xlYW4ge1xuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7ICsraSkge1xuICAgIGlmICghc2hhbGxvd0VxdWFsKGFbaV0sIGJbaV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaGFsbG93RXF1YWwoYToge1t4OiBzdHJpbmddOiBhbnl9LCBiOiB7W3g6IHN0cmluZ106IGFueX0pOiBib29sZWFuIHtcbiAgY29uc3QgazEgPSBPYmplY3Qua2V5cyhhKTtcbiAgY29uc3QgazIgPSBPYmplY3Qua2V5cyhiKTtcbiAgaWYgKGsxLmxlbmd0aCAhPSBrMi5sZW5ndGgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IGtleTogc3RyaW5nO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGsxLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0gazFbaV07XG4gICAgaWYgKGFba2V5XSAhPT0gYltrZXldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEZsYXR0ZW5zIHNpbmdsZS1sZXZlbCBuZXN0ZWQgYXJyYXlzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbjxUPihhcnI6IFRbXVtdKTogVFtdIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycik7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsYXN0PFQ+KGE6IFRbXSk6IFR8bnVsbCB7XG4gIHJldHVybiBhLmxlbmd0aCA+IDAgPyBhW2EubGVuZ3RoIC0gMV0gOiBudWxsO1xufVxuXG4vKipcbiAqIFZlcmlmeXMgYWxsIGJvb2xlYW5zIGluIGFuIGFycmF5IGFyZSBgdHJ1ZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmQoYm9vbHM6IGJvb2xlYW5bXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJvb2xzLnNvbWUodiA9PiAhdik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JFYWNoPEssIFY+KG1hcDoge1trZXk6IHN0cmluZ106IFZ9LCBjYWxsYmFjazogKHY6IFYsIGs6IHN0cmluZykgPT4gdm9pZCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHByb3AgaW4gbWFwKSB7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgY2FsbGJhY2sobWFwW3Byb3BdLCBwcm9wKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdhaXRGb3JNYXA8QSwgQj4oXG4gICAgb2JqOiB7W2s6IHN0cmluZ106IEF9LCBmbjogKGs6IHN0cmluZywgYTogQSkgPT4gT2JzZXJ2YWJsZTxCPik6IE9ic2VydmFibGU8e1trOiBzdHJpbmddOiBCfT4ge1xuICBpZiAoT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2YgKHt9KTtcbiAgfVxuXG4gIGNvbnN0IHdhaXRIZWFkOiBPYnNlcnZhYmxlPEI+W10gPSBbXTtcbiAgY29uc3Qgd2FpdFRhaWw6IE9ic2VydmFibGU8Qj5bXSA9IFtdO1xuICBjb25zdCByZXM6IHtbazogc3RyaW5nXTogQn0gPSB7fTtcblxuICBmb3JFYWNoKG9iaiwgKGE6IEEsIGs6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IG1hcHBlZCA9IGZuKGssIGEpLnBpcGUobWFwKChyOiBCKSA9PiByZXNba10gPSByKSk7XG4gICAgaWYgKGsgPT09IFBSSU1BUllfT1VUTEVUKSB7XG4gICAgICB3YWl0SGVhZC5wdXNoKG1hcHBlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdhaXRUYWlsLnB1c2gobWFwcGVkKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIENsb3N1cmUgY29tcGlsZXIgaGFzIHByb2JsZW0gd2l0aCB1c2luZyBzcHJlYWQgb3BlcmF0b3IgaGVyZS4gU28ganVzdCB1c2luZyBBcnJheS5jb25jYXQuXG4gIHJldHVybiBvZiAuYXBwbHkobnVsbCwgd2FpdEhlYWQuY29uY2F0KHdhaXRUYWlsKSkucGlwZShjb25jYXRBbGwoKSwgbGFzdFZhbHVlKCksIG1hcCgoKSA9PiByZXMpKTtcbn1cblxuLyoqXG4gKiBBTkRzIE9ic2VydmFibGVzIGJ5IG1lcmdpbmcgYWxsIGlucHV0IG9ic2VydmFibGVzLCByZWR1Y2luZyB0byBhbiBPYnNlcnZhYmxlIHZlcmlmeWluZyBhbGxcbiAqIGlucHV0IE9ic2VydmFibGVzIHJldHVybiBgdHJ1ZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmRPYnNlcnZhYmxlcyhvYnNlcnZhYmxlczogT2JzZXJ2YWJsZTxPYnNlcnZhYmxlPGFueT4+KTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gIHJldHVybiBvYnNlcnZhYmxlcy5waXBlKG1lcmdlQWxsKCksIGV2ZXJ5KChyZXN1bHQ6IGFueSkgPT4gcmVzdWx0ID09PSB0cnVlKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwSW50b09ic2VydmFibGU8VD4odmFsdWU6IFQgfCBOZ01vZHVsZUZhY3Rvcnk8VD58IFByb21pc2U8VD58IE9ic2VydmFibGU8VD4pOlxuICAgIE9ic2VydmFibGU8VD4ge1xuICBpZiAoaXNPYnNlcnZhYmxlKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgLy8gVXNlIGBQcm9taXNlLnJlc29sdmUoKWAgdG8gd3JhcCBwcm9taXNlLWxpa2UgaW5zdGFuY2VzLlxuICAgIC8vIFJlcXVpcmVkIGllIHdoZW4gYSBSZXNvbHZlciByZXR1cm5zIGEgQW5ndWxhckpTIGAkcWAgcHJvbWlzZSB0byBjb3JyZWN0bHkgdHJpZ2dlciB0aGVcbiAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIHJldHVybiBmcm9tKFByb21pc2UucmVzb2x2ZSh2YWx1ZSkpO1xuICB9XG5cbiAgcmV0dXJuIG9mICh2YWx1ZSBhcyBUKTtcbn1cbiJdfQ==