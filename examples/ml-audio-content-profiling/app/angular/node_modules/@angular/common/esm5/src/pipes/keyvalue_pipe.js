/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { KeyValueDiffers, Pipe } from '@angular/core';
function makeKeyValuePair(key, value) {
    return { key: key, value: value };
}
/**
 * @ngModule CommonModule
 * @description
 *
 * Transforms Object or Map into an array of key value pairs.
 *
 * The output array will be ordered by keys.
 * By default the comparator will be by Unicode point value.
 * You can optionally pass a compareFn if your keys are complex types.
 *
 * @usageNotes
 * ### Examples
 *
 * This examples show how an Object or a Map and be iterated by ngFor with the use of this keyvalue
 * pipe.
 *
 * {@example common/pipes/ts/keyvalue_pipe.ts region='KeyValuePipe'}
 *
 * @publicApi
 */
var KeyValuePipe = /** @class */ (function () {
    function KeyValuePipe(differs) {
        this.differs = differs;
    }
    KeyValuePipe.prototype.transform = function (input, compareFn) {
        var _this = this;
        if (compareFn === void 0) { compareFn = defaultComparator; }
        if (!input || (!(input instanceof Map) && typeof input !== 'object')) {
            return null;
        }
        if (!this.differ) {
            // make a differ for whatever type we've been passed in
            this.differ = this.differs.find(input).create();
        }
        var differChanges = this.differ.diff(input);
        if (differChanges) {
            this.keyValues = [];
            differChanges.forEachItem(function (r) {
                _this.keyValues.push(makeKeyValuePair(r.key, r.currentValue));
            });
            this.keyValues.sort(compareFn);
        }
        return this.keyValues;
    };
    KeyValuePipe = tslib_1.__decorate([
        Pipe({ name: 'keyvalue', pure: false }),
        tslib_1.__metadata("design:paramtypes", [KeyValueDiffers])
    ], KeyValuePipe);
    return KeyValuePipe;
}());
export { KeyValuePipe };
export function defaultComparator(keyValueA, keyValueB) {
    var a = keyValueA.key;
    var b = keyValueB.key;
    // if same exit with 0;
    if (a === b)
        return 0;
    // make sure that undefined are at the end of the sort.
    if (a === undefined)
        return 1;
    if (b === undefined)
        return -1;
    // make sure that nulls are at the end of the sort.
    if (a === null)
        return 1;
    if (b === null)
        return -1;
    if (typeof a == 'string' && typeof b == 'string') {
        return a < b ? -1 : 1;
    }
    if (typeof a == 'number' && typeof b == 'number') {
        return a - b;
    }
    if (typeof a == 'boolean' && typeof b == 'boolean') {
        return a < b ? -1 : 1;
    }
    // `a` and `b` are of different types. Compare their string values.
    var aString = String(a);
    var bString = String(b);
    return aString == bString ? 0 : aString < bString ? -1 : 1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5dmFsdWVfcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9zcmMvcGlwZXMva2V5dmFsdWVfcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBRUgsT0FBTyxFQUF3RCxlQUFlLEVBQUUsSUFBSSxFQUFnQixNQUFNLGVBQWUsQ0FBQztBQUUxSCxTQUFTLGdCQUFnQixDQUFPLEdBQU0sRUFBRSxLQUFRO0lBQzlDLE9BQU8sRUFBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQztBQUNsQyxDQUFDO0FBYUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFFSDtJQUNFLHNCQUE2QixPQUF3QjtRQUF4QixZQUFPLEdBQVAsT0FBTyxDQUFpQjtJQUFHLENBQUM7SUFrQnpELGdDQUFTLEdBQVQsVUFDSSxLQUEwRCxFQUMxRCxTQUErRTtRQUZuRixpQkF1QkM7UUFyQkcsMEJBQUEsRUFBQSw2QkFBK0U7UUFFakYsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFlBQVksR0FBRyxDQUFDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLEVBQUU7WUFDcEUsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLHVEQUF1RDtZQUN2RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2pEO1FBRUQsSUFBTSxhQUFhLEdBQStCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQVksQ0FBQyxDQUFDO1FBRWpGLElBQUksYUFBYSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBQ3BCLGFBQWEsQ0FBQyxXQUFXLENBQUMsVUFBQyxDQUE2QjtnQkFDdEQsS0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsWUFBYyxDQUFDLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUExQ1UsWUFBWTtRQUR4QixJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQztpREFFRSxlQUFlO09BRDFDLFlBQVksQ0EyQ3hCO0lBQUQsbUJBQUM7Q0FBQSxBQTNDRCxJQTJDQztTQTNDWSxZQUFZO0FBNkN6QixNQUFNLFVBQVUsaUJBQWlCLENBQzdCLFNBQXlCLEVBQUUsU0FBeUI7SUFDdEQsSUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztJQUN4QixJQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDO0lBQ3hCLHVCQUF1QjtJQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFDdEIsdURBQXVEO0lBQ3ZELElBQUksQ0FBQyxLQUFLLFNBQVM7UUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5QixJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUMvQixtREFBbUQ7SUFDbkQsSUFBSSxDQUFDLEtBQUssSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pCLElBQUksQ0FBQyxLQUFLLElBQUk7UUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzFCLElBQUksT0FBTyxDQUFDLElBQUksUUFBUSxJQUFJLE9BQU8sQ0FBQyxJQUFJLFFBQVEsRUFBRTtRQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7SUFDRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLFFBQVEsSUFBSSxPQUFPLENBQUMsSUFBSSxRQUFRLEVBQUU7UUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2Q7SUFDRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLFNBQVMsSUFBSSxPQUFPLENBQUMsSUFBSSxTQUFTLEVBQUU7UUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3ZCO0lBQ0QsbUVBQW1FO0lBQ25FLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixJQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUIsT0FBTyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtLZXlWYWx1ZUNoYW5nZVJlY29yZCwgS2V5VmFsdWVDaGFuZ2VzLCBLZXlWYWx1ZURpZmZlciwgS2V5VmFsdWVEaWZmZXJzLCBQaXBlLCBQaXBlVHJhbnNmb3JtfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuZnVuY3Rpb24gbWFrZUtleVZhbHVlUGFpcjxLLCBWPihrZXk6IEssIHZhbHVlOiBWKTogS2V5VmFsdWU8SywgVj4ge1xuICByZXR1cm4ge2tleToga2V5LCB2YWx1ZTogdmFsdWV9O1xufVxuXG4vKipcbiAqIEEga2V5IHZhbHVlIHBhaXIuXG4gKiBVc3VhbGx5IHVzZWQgdG8gcmVwcmVzZW50IHRoZSBrZXkgdmFsdWUgcGFpcnMgZnJvbSBhIE1hcCBvciBPYmplY3QuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleVZhbHVlPEssIFY+IHtcbiAga2V5OiBLO1xuICB2YWx1ZTogVjtcbn1cblxuLyoqXG4gKiBAbmdNb2R1bGUgQ29tbW9uTW9kdWxlXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBUcmFuc2Zvcm1zIE9iamVjdCBvciBNYXAgaW50byBhbiBhcnJheSBvZiBrZXkgdmFsdWUgcGFpcnMuXG4gKlxuICogVGhlIG91dHB1dCBhcnJheSB3aWxsIGJlIG9yZGVyZWQgYnkga2V5cy5cbiAqIEJ5IGRlZmF1bHQgdGhlIGNvbXBhcmF0b3Igd2lsbCBiZSBieSBVbmljb2RlIHBvaW50IHZhbHVlLlxuICogWW91IGNhbiBvcHRpb25hbGx5IHBhc3MgYSBjb21wYXJlRm4gaWYgeW91ciBrZXlzIGFyZSBjb21wbGV4IHR5cGVzLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZXNcbiAqXG4gKiBUaGlzIGV4YW1wbGVzIHNob3cgaG93IGFuIE9iamVjdCBvciBhIE1hcCBhbmQgYmUgaXRlcmF0ZWQgYnkgbmdGb3Igd2l0aCB0aGUgdXNlIG9mIHRoaXMga2V5dmFsdWVcbiAqIHBpcGUuXG4gKlxuICoge0BleGFtcGxlIGNvbW1vbi9waXBlcy90cy9rZXl2YWx1ZV9waXBlLnRzIHJlZ2lvbj0nS2V5VmFsdWVQaXBlJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBQaXBlKHtuYW1lOiAna2V5dmFsdWUnLCBwdXJlOiBmYWxzZX0pXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVQaXBlIGltcGxlbWVudHMgUGlwZVRyYW5zZm9ybSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZGlmZmVyczogS2V5VmFsdWVEaWZmZXJzKSB7fVxuXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGRpZmZlciAhOiBLZXlWYWx1ZURpZmZlcjxhbnksIGFueT47XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIGtleVZhbHVlcyAhOiBBcnJheTxLZXlWYWx1ZTxhbnksIGFueT4+O1xuXG4gIHRyYW5zZm9ybTxLLCBWPihpbnB1dDogbnVsbCwgY29tcGFyZUZuPzogKGE6IEtleVZhbHVlPEssIFY+LCBiOiBLZXlWYWx1ZTxLLCBWPikgPT4gbnVtYmVyKTogbnVsbDtcbiAgdHJhbnNmb3JtPFY+KFxuICAgICAgaW5wdXQ6IHtba2V5OiBzdHJpbmddOiBWfXxNYXA8c3RyaW5nLCBWPixcbiAgICAgIGNvbXBhcmVGbj86IChhOiBLZXlWYWx1ZTxzdHJpbmcsIFY+LCBiOiBLZXlWYWx1ZTxzdHJpbmcsIFY+KSA9PiBudW1iZXIpOlxuICAgICAgQXJyYXk8S2V5VmFsdWU8c3RyaW5nLCBWPj47XG4gIHRyYW5zZm9ybTxWPihcbiAgICAgIGlucHV0OiB7W2tleTogbnVtYmVyXTogVn18TWFwPG51bWJlciwgVj4sXG4gICAgICBjb21wYXJlRm4/OiAoYTogS2V5VmFsdWU8bnVtYmVyLCBWPiwgYjogS2V5VmFsdWU8bnVtYmVyLCBWPikgPT4gbnVtYmVyKTpcbiAgICAgIEFycmF5PEtleVZhbHVlPG51bWJlciwgVj4+O1xuICB0cmFuc2Zvcm08SywgVj4oaW5wdXQ6IE1hcDxLLCBWPiwgY29tcGFyZUZuPzogKGE6IEtleVZhbHVlPEssIFY+LCBiOiBLZXlWYWx1ZTxLLCBWPikgPT4gbnVtYmVyKTpcbiAgICAgIEFycmF5PEtleVZhbHVlPEssIFY+PjtcbiAgdHJhbnNmb3JtPEssIFY+KFxuICAgICAgaW5wdXQ6IG51bGx8e1trZXk6IHN0cmluZ106IFYsIFtrZXk6IG51bWJlcl06IFZ9fE1hcDxLLCBWPixcbiAgICAgIGNvbXBhcmVGbjogKGE6IEtleVZhbHVlPEssIFY+LCBiOiBLZXlWYWx1ZTxLLCBWPikgPT4gbnVtYmVyID0gZGVmYXVsdENvbXBhcmF0b3IpOlxuICAgICAgQXJyYXk8S2V5VmFsdWU8SywgVj4+fG51bGwge1xuICAgIGlmICghaW5wdXQgfHwgKCEoaW5wdXQgaW5zdGFuY2VvZiBNYXApICYmIHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZGlmZmVyKSB7XG4gICAgICAvLyBtYWtlIGEgZGlmZmVyIGZvciB3aGF0ZXZlciB0eXBlIHdlJ3ZlIGJlZW4gcGFzc2VkIGluXG4gICAgICB0aGlzLmRpZmZlciA9IHRoaXMuZGlmZmVycy5maW5kKGlucHV0KS5jcmVhdGUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBkaWZmZXJDaGFuZ2VzOiBLZXlWYWx1ZUNoYW5nZXM8SywgVj58bnVsbCA9IHRoaXMuZGlmZmVyLmRpZmYoaW5wdXQgYXMgYW55KTtcblxuICAgIGlmIChkaWZmZXJDaGFuZ2VzKSB7XG4gICAgICB0aGlzLmtleVZhbHVlcyA9IFtdO1xuICAgICAgZGlmZmVyQ2hhbmdlcy5mb3JFYWNoSXRlbSgocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHtcbiAgICAgICAgdGhpcy5rZXlWYWx1ZXMucHVzaChtYWtlS2V5VmFsdWVQYWlyKHIua2V5LCByLmN1cnJlbnRWYWx1ZSAhKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMua2V5VmFsdWVzLnNvcnQoY29tcGFyZUZuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMua2V5VmFsdWVzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0Q29tcGFyYXRvcjxLLCBWPihcbiAgICBrZXlWYWx1ZUE6IEtleVZhbHVlPEssIFY+LCBrZXlWYWx1ZUI6IEtleVZhbHVlPEssIFY+KTogbnVtYmVyIHtcbiAgY29uc3QgYSA9IGtleVZhbHVlQS5rZXk7XG4gIGNvbnN0IGIgPSBrZXlWYWx1ZUIua2V5O1xuICAvLyBpZiBzYW1lIGV4aXQgd2l0aCAwO1xuICBpZiAoYSA9PT0gYikgcmV0dXJuIDA7XG4gIC8vIG1ha2Ugc3VyZSB0aGF0IHVuZGVmaW5lZCBhcmUgYXQgdGhlIGVuZCBvZiB0aGUgc29ydC5cbiAgaWYgKGEgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7XG4gIGlmIChiID09PSB1bmRlZmluZWQpIHJldHVybiAtMTtcbiAgLy8gbWFrZSBzdXJlIHRoYXQgbnVsbHMgYXJlIGF0IHRoZSBlbmQgb2YgdGhlIHNvcnQuXG4gIGlmIChhID09PSBudWxsKSByZXR1cm4gMTtcbiAgaWYgKGIgPT09IG51bGwpIHJldHVybiAtMTtcbiAgaWYgKHR5cGVvZiBhID09ICdzdHJpbmcnICYmIHR5cGVvZiBiID09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiAxO1xuICB9XG4gIGlmICh0eXBlb2YgYSA9PSAnbnVtYmVyJyAmJiB0eXBlb2YgYiA9PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBhIC0gYjtcbiAgfVxuICBpZiAodHlwZW9mIGEgPT0gJ2Jvb2xlYW4nICYmIHR5cGVvZiBiID09ICdib29sZWFuJykge1xuICAgIHJldHVybiBhIDwgYiA/IC0xIDogMTtcbiAgfVxuICAvLyBgYWAgYW5kIGBiYCBhcmUgb2YgZGlmZmVyZW50IHR5cGVzLiBDb21wYXJlIHRoZWlyIHN0cmluZyB2YWx1ZXMuXG4gIGNvbnN0IGFTdHJpbmcgPSBTdHJpbmcoYSk7XG4gIGNvbnN0IGJTdHJpbmcgPSBTdHJpbmcoYik7XG4gIHJldHVybiBhU3RyaW5nID09IGJTdHJpbmcgPyAwIDogYVN0cmluZyA8IGJTdHJpbmcgPyAtMSA6IDE7XG59XG4iXX0=