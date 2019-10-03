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
import { global } from '../util';
/**
 * A scope function for the Web Tracing Framework (WTF).
 *
 * \@publicApi
 * @record
 */
export function WtfScopeFn() { }
/**
 * @record
 */
function WTF() { }
/** @type {?} */
WTF.prototype.trace;
/**
 * @record
 */
function Trace() { }
/** @type {?} */
Trace.prototype.events;
/** @type {?} */
Trace.prototype.leaveScope;
/** @type {?} */
Trace.prototype.beginTimeRange;
/** @type {?} */
Trace.prototype.endTimeRange;
/**
 * @record
 */
export function Range() { }
/**
 * @record
 */
function Events() { }
/** @type {?} */
Events.prototype.createScope;
/**
 * @record
 */
export function Scope() { }
/** @type {?} */
let trace;
/** @type {?} */
let events;
/**
 * @return {?}
 */
export function detectWTF() {
    /** @type {?} */
    const wtf = (/** @type {?} */ (global /** TODO #9100 */) /** TODO #9100 */)['wtf'];
    if (wtf) {
        trace = wtf['trace'];
        if (trace) {
            events = trace['events'];
            return true;
        }
    }
    return false;
}
/**
 * @param {?} signature
 * @param {?=} flags
 * @return {?}
 */
export function createScope(signature, flags = null) {
    return events.createScope(signature, flags);
}
/**
 * @template T
 * @param {?} scope
 * @param {?=} returnValue
 * @return {?}
 */
export function leave(scope, returnValue) {
    trace.leaveScope(scope, returnValue);
    return returnValue;
}
/**
 * @param {?} rangeType
 * @param {?} action
 * @return {?}
 */
export function startTimeRange(rangeType, action) {
    return trace.beginTimeRange(rangeType, action);
}
/**
 * @param {?} range
 * @return {?}
 */
export function endTimeRange(range) {
    trace.endTimeRange(range);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3RmX2ltcGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9wcm9maWxlL3d0Zl9pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0Qi9CLElBQUksS0FBSyxDQUFROztBQUNqQixJQUFJLE1BQU0sQ0FBUzs7OztBQUVuQixNQUFNLFVBQVUsU0FBUzs7SUFDdkIsTUFBTSxHQUFHLEdBQVEsbUJBQUMsTUFBYSxDQUFDLGlCQUFpQixvQkFBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFELElBQUksR0FBRyxFQUFFO1FBQ1AsS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQixJQUFJLEtBQUssRUFBRTtZQUNULE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekIsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxTQUFpQixFQUFFLFFBQWEsSUFBSTtJQUM5RCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0NBQzdDOzs7Ozs7O0FBSUQsTUFBTSxVQUFVLEtBQUssQ0FBSSxLQUFZLEVBQUUsV0FBaUI7SUFDdEQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDckMsT0FBTyxXQUFXLENBQUM7Q0FDcEI7Ozs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsU0FBaUIsRUFBRSxNQUFjO0lBQzlELE9BQU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7Q0FDaEQ7Ozs7O0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxLQUFZO0lBQ3ZDLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDM0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi91dGlsJztcblxuLyoqXG4gKiBBIHNjb3BlIGZ1bmN0aW9uIGZvciB0aGUgV2ViIFRyYWNpbmcgRnJhbWV3b3JrIChXVEYpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBXdGZTY29wZUZuIHsgKGFyZzA/OiBhbnksIGFyZzE/OiBhbnkpOiBhbnk7IH1cblxuaW50ZXJmYWNlIFdURiB7XG4gIHRyYWNlOiBUcmFjZTtcbn1cblxuaW50ZXJmYWNlIFRyYWNlIHtcbiAgZXZlbnRzOiBFdmVudHM7XG4gIGxlYXZlU2NvcGUoc2NvcGU6IFNjb3BlLCByZXR1cm5WYWx1ZTogYW55KTogYW55IC8qKiBUT0RPICM5MTAwICovO1xuICBiZWdpblRpbWVSYW5nZShyYW5nZVR5cGU6IHN0cmluZywgYWN0aW9uOiBzdHJpbmcpOiBSYW5nZTtcbiAgZW5kVGltZVJhbmdlKHJhbmdlOiBSYW5nZSk6IGFueSAvKiogVE9ETyAjOTEwMCAqLztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSYW5nZSB7fVxuXG5pbnRlcmZhY2UgRXZlbnRzIHtcbiAgY3JlYXRlU2NvcGUoc2lnbmF0dXJlOiBzdHJpbmcsIGZsYWdzOiBhbnkpOiBTY29wZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTY29wZSB7ICguLi5hcmdzOiBhbnlbXSAvKiogVE9ETyAjOTEwMCAqLyk6IGFueTsgfVxuXG5sZXQgdHJhY2U6IFRyYWNlO1xubGV0IGV2ZW50czogRXZlbnRzO1xuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0V1RGKCk6IGJvb2xlYW4ge1xuICBjb25zdCB3dGY6IFdURiA9IChnbG9iYWwgYXMgYW55IC8qKiBUT0RPICM5MTAwICovKVsnd3RmJ107XG4gIGlmICh3dGYpIHtcbiAgICB0cmFjZSA9IHd0ZlsndHJhY2UnXTtcbiAgICBpZiAodHJhY2UpIHtcbiAgICAgIGV2ZW50cyA9IHRyYWNlWydldmVudHMnXTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY29wZShzaWduYXR1cmU6IHN0cmluZywgZmxhZ3M6IGFueSA9IG51bGwpOiBhbnkge1xuICByZXR1cm4gZXZlbnRzLmNyZWF0ZVNjb3BlKHNpZ25hdHVyZSwgZmxhZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGVhdmU8VD4oc2NvcGU6IFNjb3BlKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZTxUPihzY29wZTogU2NvcGUsIHJldHVyblZhbHVlPzogVCk6IFQ7XG5leHBvcnQgZnVuY3Rpb24gbGVhdmU8VD4oc2NvcGU6IFNjb3BlLCByZXR1cm5WYWx1ZT86IGFueSk6IGFueSB7XG4gIHRyYWNlLmxlYXZlU2NvcGUoc2NvcGUsIHJldHVyblZhbHVlKTtcbiAgcmV0dXJuIHJldHVyblZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRUaW1lUmFuZ2UocmFuZ2VUeXBlOiBzdHJpbmcsIGFjdGlvbjogc3RyaW5nKTogUmFuZ2Uge1xuICByZXR1cm4gdHJhY2UuYmVnaW5UaW1lUmFuZ2UocmFuZ2VUeXBlLCBhY3Rpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5kVGltZVJhbmdlKHJhbmdlOiBSYW5nZSk6IHZvaWQge1xuICB0cmFjZS5lbmRUaW1lUmFuZ2UocmFuZ2UpO1xufVxuIl19