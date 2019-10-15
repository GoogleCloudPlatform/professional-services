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
/** @type {?} */
const __window = typeof window !== 'undefined' && window;
/** @type {?} */
const __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope && self;
/** @type {?} */
const __global = typeof global !== 'undefined' && global;
/** @type {?} */
const _global = __global || __window || __self;
/** @type {?} */
const promise = Promise.resolve(0);
export { _global as global };
/** @type {?} */
let _symbolIterator = null;
/**
 * @return {?}
 */
export function getSymbolIterator() {
    if (!_symbolIterator) {
        /** @type {?} */
        const Symbol = _global['Symbol'];
        if (Symbol && Symbol.iterator) {
            _symbolIterator = Symbol.iterator;
        }
        else {
            /** @type {?} */
            const keys = Object.getOwnPropertyNames(Map.prototype);
            for (let i = 0; i < keys.length; ++i) {
                /** @type {?} */
                const key = keys[i];
                if (key !== 'entries' && key !== 'size' &&
                    (/** @type {?} */ (Map)).prototype[key] === Map.prototype['entries']) {
                    _symbolIterator = key;
                }
            }
        }
    }
    return _symbolIterator;
}
/**
 * @param {?} fn
 * @return {?}
 */
export function scheduleMicroTask(fn) {
    if (typeof Zone === 'undefined') {
        // use promise to schedule microTask instead of use Zone
        promise.then(() => { fn && fn.apply(null, null); });
    }
    else {
        Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
    }
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function looseIdentical(a, b) {
    return a === b || typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b);
}
/**
 * @param {?} token
 * @return {?}
 */
export function stringify(token) {
    if (typeof token === 'string') {
        return token;
    }
    if (token instanceof Array) {
        return '[' + token.map(stringify).join(', ') + ']';
    }
    if (token == null) {
        return '' + token;
    }
    if (token.overriddenName) {
        return `${token.overriddenName}`;
    }
    if (token.name) {
        return `${token.name}`;
    }
    /** @type {?} */
    const res = token.toString();
    if (res == null) {
        return '' + res;
    }
    /** @type {?} */
    const newLineIndex = res.indexOf('\n');
    return newLineIndex === -1 ? res : res.substring(0, newLineIndex);
}
/**
 * Convince closure compiler that the wrapped function has no side-effects.
 *
 * Closure compiler always assumes that `toString` has no side-effects. We use this quirk to
 * allow us to execute a function but have closure compiler mark the call as no-side-effects.
 * It is important that the return value for the `noSideEffects` function be assigned
 * to something which is retained otherwise the call to `noSideEffects` will be removed by closure
 * compiler.
 * @param {?} fn
 * @return {?}
 */
export function noSideEffects(fn) {
    return '' + { toString: fn };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBY0EsTUFBTSxRQUFRLEdBQUcsT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQzs7QUFDekQsTUFBTSxNQUFNLEdBQUcsT0FBTyxJQUFJLEtBQUssV0FBVyxJQUFJLE9BQU8saUJBQWlCLEtBQUssV0FBVztJQUNsRixJQUFJLFlBQVksaUJBQWlCLElBQUksSUFBSSxDQUFDOztBQUM5QyxNQUFNLFFBQVEsR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksTUFBTSxDQUFDOztBQUl6RCxNQUFNLE9BQU8sR0FBMEIsUUFBUSxJQUFJLFFBQVEsSUFBSSxNQUFNLENBQUM7O0FBRXRFLE1BQU0sT0FBTyxHQUFpQixPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBTWpELE9BQU8sRUFBQyxPQUFPLElBQUksTUFBTSxFQUFDLENBQUM7O0FBSTNCLElBQUksZUFBZSxHQUFRLElBQUksQ0FBQzs7OztBQUNoQyxNQUFNLFVBQVUsaUJBQWlCO0lBQy9CLElBQUksQ0FBQyxlQUFlLEVBQUU7O1FBQ3BCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzdCLGVBQWUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQ25DO2FBQU07O1lBRUwsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTs7Z0JBQ3BDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxHQUFHLEtBQUssU0FBUyxJQUFJLEdBQUcsS0FBSyxNQUFNO29CQUNuQyxtQkFBQyxHQUFVLEVBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDNUQsZUFBZSxHQUFHLEdBQUcsQ0FBQztpQkFDdkI7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLGVBQWUsQ0FBQztDQUN4Qjs7Ozs7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsRUFBWTtJQUM1QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFdBQVcsRUFBRTs7UUFFL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDckQ7U0FBTTtRQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDekQ7Q0FDRjs7Ozs7O0FBR0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxDQUFNLEVBQUUsQ0FBTTtJQUMzQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzFGOzs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBVTtJQUNsQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUM3QixPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFO1FBQzFCLE9BQU8sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztLQUNwRDtJQUVELElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtRQUNqQixPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7S0FDbkI7SUFFRCxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUU7UUFDeEIsT0FBTyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUNsQztJQUVELElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtRQUNkLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDeEI7O0lBRUQsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRTdCLElBQUksR0FBRyxJQUFJLElBQUksRUFBRTtRQUNmLE9BQU8sRUFBRSxHQUFHLEdBQUcsQ0FBQztLQUNqQjs7SUFFRCxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0NBQ25FOzs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsYUFBYSxDQUFDLEVBQWM7SUFDMUMsT0FBTyxFQUFFLEdBQUcsRUFBQyxRQUFRLEVBQUUsRUFBRSxFQUFDLENBQUM7Q0FDNUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRPRE8oanRlcGxpdHo2MDIpOiBMb2FkIFdvcmtlckdsb2JhbFNjb3BlIGZyb20gbGliLndlYndvcmtlci5kLnRzIGZpbGUgIzM0OTJcbmRlY2xhcmUgdmFyIFdvcmtlckdsb2JhbFNjb3BlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi87XG4vLyBDb21tb25KUyAvIE5vZGUgaGF2ZSBnbG9iYWwgY29udGV4dCBleHBvc2VkIGFzIFwiZ2xvYmFsXCIgdmFyaWFibGUuXG4vLyBXZSBkb24ndCB3YW50IHRvIGluY2x1ZGUgdGhlIHdob2xlIG5vZGUuZC50cyB0aGlzIHRoaXMgY29tcGlsYXRpb24gdW5pdCBzbyB3ZSdsbCBqdXN0IGZha2Vcbi8vIHRoZSBnbG9iYWwgXCJnbG9iYWxcIiB2YXIgZm9yIG5vdy5cbmRlY2xhcmUgdmFyIGdsb2JhbDogYW55IC8qKiBUT0RPICM5MTAwICovO1xuY29uc3QgX193aW5kb3cgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3c7XG5jb25zdCBfX3NlbGYgPSB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHNlbGYgaW5zdGFuY2VvZiBXb3JrZXJHbG9iYWxTY29wZSAmJiBzZWxmO1xuY29uc3QgX19nbG9iYWwgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWw7XG5cbi8vIENoZWNrIF9fZ2xvYmFsIGZpcnN0LCBiZWNhdXNlIGluIE5vZGUgdGVzdHMgYm90aCBfX2dsb2JhbCBhbmQgX193aW5kb3cgbWF5IGJlIGRlZmluZWQgYW5kIF9nbG9iYWxcbi8vIHNob3VsZCBiZSBfX2dsb2JhbCBpbiB0aGF0IGNhc2UuXG5jb25zdCBfZ2xvYmFsOiB7W25hbWU6IHN0cmluZ106IGFueX0gPSBfX2dsb2JhbCB8fCBfX3dpbmRvdyB8fCBfX3NlbGY7XG5cbmNvbnN0IHByb21pc2U6IFByb21pc2U8YW55PiA9IFByb21pc2UucmVzb2x2ZSgwKTtcbi8qKlxuICogQXR0ZW50aW9uOiB3aGVuZXZlciBwcm92aWRpbmcgYSBuZXcgdmFsdWUsIGJlIHN1cmUgdG8gYWRkIGFuXG4gKiBlbnRyeSBpbnRvIHRoZSBjb3JyZXNwb25kaW5nIGAuLi4uZXh0ZXJucy5qc2AgZmlsZSxcbiAqIHNvIHRoYXQgY2xvc3VyZSB3b24ndCB1c2UgdGhhdCBnbG9iYWwgZm9yIGl0cyBwdXJwb3Nlcy5cbiAqL1xuZXhwb3J0IHtfZ2xvYmFsIGFzIGdsb2JhbH07XG5cbi8vIFdoZW4gU3ltYm9sLml0ZXJhdG9yIGRvZXNuJ3QgZXhpc3QsIHJldHJpZXZlcyB0aGUga2V5IHVzZWQgaW4gZXM2LXNoaW1cbmRlY2xhcmUgY29uc3QgU3ltYm9sOiBhbnk7XG5sZXQgX3N5bWJvbEl0ZXJhdG9yOiBhbnkgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bWJvbEl0ZXJhdG9yKCk6IHN0cmluZ3xzeW1ib2wge1xuICBpZiAoIV9zeW1ib2xJdGVyYXRvcikge1xuICAgIGNvbnN0IFN5bWJvbCA9IF9nbG9iYWxbJ1N5bWJvbCddO1xuICAgIGlmIChTeW1ib2wgJiYgU3ltYm9sLml0ZXJhdG9yKSB7XG4gICAgICBfc3ltYm9sSXRlcmF0b3IgPSBTeW1ib2wuaXRlcmF0b3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGVzNi1zaGltIHNwZWNpZmljIGxvZ2ljXG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoTWFwLnByb3RvdHlwZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKGtleSAhPT0gJ2VudHJpZXMnICYmIGtleSAhPT0gJ3NpemUnICYmXG4gICAgICAgICAgICAoTWFwIGFzIGFueSkucHJvdG90eXBlW2tleV0gPT09IE1hcC5wcm90b3R5cGVbJ2VudHJpZXMnXSkge1xuICAgICAgICAgIF9zeW1ib2xJdGVyYXRvciA9IGtleTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gX3N5bWJvbEl0ZXJhdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVNaWNyb1Rhc2soZm46IEZ1bmN0aW9uKSB7XG4gIGlmICh0eXBlb2YgWm9uZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyB1c2UgcHJvbWlzZSB0byBzY2hlZHVsZSBtaWNyb1Rhc2sgaW5zdGVhZCBvZiB1c2UgWm9uZVxuICAgIHByb21pc2UudGhlbigoKSA9PiB7IGZuICYmIGZuLmFwcGx5KG51bGwsIG51bGwpOyB9KTtcbiAgfSBlbHNlIHtcbiAgICBab25lLmN1cnJlbnQuc2NoZWR1bGVNaWNyb1Rhc2soJ3NjaGVkdWxlTWljcm90YXNrJywgZm4pO1xuICB9XG59XG5cbi8vIEpTIGhhcyBOYU4gIT09IE5hTlxuZXhwb3J0IGZ1bmN0aW9uIGxvb3NlSWRlbnRpY2FsKGE6IGFueSwgYjogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBhID09PSBiIHx8IHR5cGVvZiBhID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgYiA9PT0gJ251bWJlcicgJiYgaXNOYU4oYSkgJiYgaXNOYU4oYik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkodG9rZW46IGFueSk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgaWYgKHRva2VuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICByZXR1cm4gJ1snICsgdG9rZW4ubWFwKHN0cmluZ2lmeSkuam9pbignLCAnKSArICddJztcbiAgfVxuXG4gIGlmICh0b2tlbiA9PSBudWxsKSB7XG4gICAgcmV0dXJuICcnICsgdG9rZW47XG4gIH1cblxuICBpZiAodG9rZW4ub3ZlcnJpZGRlbk5hbWUpIHtcbiAgICByZXR1cm4gYCR7dG9rZW4ub3ZlcnJpZGRlbk5hbWV9YDtcbiAgfVxuXG4gIGlmICh0b2tlbi5uYW1lKSB7XG4gICAgcmV0dXJuIGAke3Rva2VuLm5hbWV9YDtcbiAgfVxuXG4gIGNvbnN0IHJlcyA9IHRva2VuLnRvU3RyaW5nKCk7XG5cbiAgaWYgKHJlcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuICcnICsgcmVzO1xuICB9XG5cbiAgY29uc3QgbmV3TGluZUluZGV4ID0gcmVzLmluZGV4T2YoJ1xcbicpO1xuICByZXR1cm4gbmV3TGluZUluZGV4ID09PSAtMSA/IHJlcyA6IHJlcy5zdWJzdHJpbmcoMCwgbmV3TGluZUluZGV4KTtcbn1cblxuLyoqXG4gKiBDb252aW5jZSBjbG9zdXJlIGNvbXBpbGVyIHRoYXQgdGhlIHdyYXBwZWQgZnVuY3Rpb24gaGFzIG5vIHNpZGUtZWZmZWN0cy5cbiAqXG4gKiBDbG9zdXJlIGNvbXBpbGVyIGFsd2F5cyBhc3N1bWVzIHRoYXQgYHRvU3RyaW5nYCBoYXMgbm8gc2lkZS1lZmZlY3RzLiBXZSB1c2UgdGhpcyBxdWlyayB0b1xuICogYWxsb3cgdXMgdG8gZXhlY3V0ZSBhIGZ1bmN0aW9uIGJ1dCBoYXZlIGNsb3N1cmUgY29tcGlsZXIgbWFyayB0aGUgY2FsbCBhcyBuby1zaWRlLWVmZmVjdHMuXG4gKiBJdCBpcyBpbXBvcnRhbnQgdGhhdCB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgYG5vU2lkZUVmZmVjdHNgIGZ1bmN0aW9uIGJlIGFzc2lnbmVkXG4gKiB0byBzb21ldGhpbmcgd2hpY2ggaXMgcmV0YWluZWQgb3RoZXJ3aXNlIHRoZSBjYWxsIHRvIGBub1NpZGVFZmZlY3RzYCB3aWxsIGJlIHJlbW92ZWQgYnkgY2xvc3VyZVxuICogY29tcGlsZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub1NpZGVFZmZlY3RzKGZuOiAoKSA9PiB2b2lkKTogc3RyaW5nIHtcbiAgcmV0dXJuICcnICsge3RvU3RyaW5nOiBmbn07XG59Il19