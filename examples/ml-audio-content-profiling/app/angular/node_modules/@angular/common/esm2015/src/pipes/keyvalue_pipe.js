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
import { KeyValueDiffers, Pipe } from '@angular/core';
/**
 * @template K, V
 * @param {?} key
 * @param {?} value
 * @return {?}
 */
function makeKeyValuePair(key, value) {
    return { key: key, value: value };
}
/**
 * A key value pair.
 * Usually used to represent the key value pairs from a Map or Object.
 *
 * \@publicApi
 * @record
 * @template K, V
 */
export function KeyValue() { }
/** @type {?} */
KeyValue.prototype.key;
/** @type {?} */
KeyValue.prototype.value;
/**
 * \@ngModule CommonModule
 * \@description
 *
 * Transforms Object or Map into an array of key value pairs.
 *
 * The output array will be ordered by keys.
 * By default the comparator will be by Unicode point value.
 * You can optionally pass a compareFn if your keys are complex types.
 *
 * \@usageNotes
 * ### Examples
 *
 * This examples show how an Object or a Map and be iterated by ngFor with the use of this keyvalue
 * pipe.
 *
 * {\@example common/pipes/ts/keyvalue_pipe.ts region='KeyValuePipe'}
 *
 * \@publicApi
 */
export class KeyValuePipe {
    /**
     * @param {?} differs
     */
    constructor(differs) {
        this.differs = differs;
    }
    /**
     * @template K, V
     * @param {?} input
     * @param {?=} compareFn
     * @return {?}
     */
    transform(input, compareFn = defaultComparator) {
        if (!input || (!(input instanceof Map) && typeof input !== 'object')) {
            return null;
        }
        if (!this.differ) {
            // make a differ for whatever type we've been passed in
            this.differ = this.differs.find(input).create();
        }
        /** @type {?} */
        const differChanges = this.differ.diff(/** @type {?} */ (input));
        if (differChanges) {
            this.keyValues = [];
            differChanges.forEachItem((r) => {
                this.keyValues.push(makeKeyValuePair(r.key, /** @type {?} */ ((r.currentValue))));
            });
            this.keyValues.sort(compareFn);
        }
        return this.keyValues;
    }
}
KeyValuePipe.decorators = [
    { type: Pipe, args: [{ name: 'keyvalue', pure: false },] }
];
/** @nocollapse */
KeyValuePipe.ctorParameters = () => [
    { type: KeyValueDiffers }
];
if (false) {
    /** @type {?} */
    KeyValuePipe.prototype.differ;
    /** @type {?} */
    KeyValuePipe.prototype.keyValues;
    /** @type {?} */
    KeyValuePipe.prototype.differs;
}
/**
 * @template K, V
 * @param {?} keyValueA
 * @param {?} keyValueB
 * @return {?}
 */
export function defaultComparator(keyValueA, keyValueB) {
    /** @type {?} */
    const a = keyValueA.key;
    /** @type {?} */
    const b = keyValueB.key;
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
    /** @type {?} */
    const aString = String(a);
    /** @type {?} */
    const bString = String(b);
    return aString == bString ? 0 : aString < bString ? -1 : 1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5dmFsdWVfcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbW1vbi9zcmMvcGlwZXMva2V5dmFsdWVfcGlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBd0QsZUFBZSxFQUFFLElBQUksRUFBZ0IsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7QUFFMUgsU0FBUyxnQkFBZ0IsQ0FBTyxHQUFNLEVBQUUsS0FBUTtJQUM5QyxPQUFPLEVBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUM7Q0FDakM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQ0QsTUFBTSxPQUFPLFlBQVk7Ozs7SUFDdkIsWUFBNkIsT0FBd0I7UUFBeEIsWUFBTyxHQUFQLE9BQU8sQ0FBaUI7S0FBSTs7Ozs7OztJQWtCekQsU0FBUyxDQUNMLEtBQTBELEVBQzFELFlBQThELGlCQUFpQjtRQUVqRixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssWUFBWSxHQUFHLENBQUMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsRUFBRTtZQUNwRSxPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7O1lBRWhCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDakQ7O1FBRUQsTUFBTSxhQUFhLEdBQStCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxtQkFBQyxLQUFZLEVBQUMsQ0FBQztRQUVqRixJQUFJLGFBQWEsRUFBRTtZQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNwQixhQUFhLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBNkIsRUFBRSxFQUFFO2dCQUMxRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxxQkFBRSxDQUFDLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQzthQUNoRSxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNoQztRQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztLQUN2Qjs7O1lBM0NGLElBQUksU0FBQyxFQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQzs7OztZQXJDMEIsZUFBZTs7Ozs7Ozs7Ozs7Ozs7OztBQW1GOUUsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixTQUF5QixFQUFFLFNBQXlCOztJQUN0RCxNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDOztJQUN4QixNQUFNLENBQUMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDOztJQUV4QixJQUFJLENBQUMsS0FBSyxDQUFDO1FBQUUsT0FBTyxDQUFDLENBQUM7O0lBRXRCLElBQUksQ0FBQyxLQUFLLFNBQVM7UUFBRSxPQUFPLENBQUMsQ0FBQztJQUM5QixJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzs7SUFFL0IsSUFBSSxDQUFDLEtBQUssSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pCLElBQUksQ0FBQyxLQUFLLElBQUk7UUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzFCLElBQUksT0FBTyxDQUFDLElBQUksUUFBUSxJQUFJLE9BQU8sQ0FBQyxJQUFJLFFBQVEsRUFBRTtRQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7SUFDRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLFFBQVEsSUFBSSxPQUFPLENBQUMsSUFBSSxRQUFRLEVBQUU7UUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2Q7SUFDRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLFNBQVMsSUFBSSxPQUFPLENBQUMsSUFBSSxTQUFTLEVBQUU7UUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3ZCOztJQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7SUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLE9BQU8sT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0tleVZhbHVlQ2hhbmdlUmVjb3JkLCBLZXlWYWx1ZUNoYW5nZXMsIEtleVZhbHVlRGlmZmVyLCBLZXlWYWx1ZURpZmZlcnMsIFBpcGUsIFBpcGVUcmFuc2Zvcm19IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5mdW5jdGlvbiBtYWtlS2V5VmFsdWVQYWlyPEssIFY+KGtleTogSywgdmFsdWU6IFYpOiBLZXlWYWx1ZTxLLCBWPiB7XG4gIHJldHVybiB7a2V5OiBrZXksIHZhbHVlOiB2YWx1ZX07XG59XG5cbi8qKlxuICogQSBrZXkgdmFsdWUgcGFpci5cbiAqIFVzdWFsbHkgdXNlZCB0byByZXByZXNlbnQgdGhlIGtleSB2YWx1ZSBwYWlycyBmcm9tIGEgTWFwIG9yIE9iamVjdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5VmFsdWU8SywgVj4ge1xuICBrZXk6IEs7XG4gIHZhbHVlOiBWO1xufVxuXG4vKipcbiAqIEBuZ01vZHVsZSBDb21tb25Nb2R1bGVcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRyYW5zZm9ybXMgT2JqZWN0IG9yIE1hcCBpbnRvIGFuIGFycmF5IG9mIGtleSB2YWx1ZSBwYWlycy5cbiAqXG4gKiBUaGUgb3V0cHV0IGFycmF5IHdpbGwgYmUgb3JkZXJlZCBieSBrZXlzLlxuICogQnkgZGVmYXVsdCB0aGUgY29tcGFyYXRvciB3aWxsIGJlIGJ5IFVuaWNvZGUgcG9pbnQgdmFsdWUuXG4gKiBZb3UgY2FuIG9wdGlvbmFsbHkgcGFzcyBhIGNvbXBhcmVGbiBpZiB5b3VyIGtleXMgYXJlIGNvbXBsZXggdHlwZXMuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlc1xuICpcbiAqIFRoaXMgZXhhbXBsZXMgc2hvdyBob3cgYW4gT2JqZWN0IG9yIGEgTWFwIGFuZCBiZSBpdGVyYXRlZCBieSBuZ0ZvciB3aXRoIHRoZSB1c2Ugb2YgdGhpcyBrZXl2YWx1ZVxuICogcGlwZS5cbiAqXG4gKiB7QGV4YW1wbGUgY29tbW9uL3BpcGVzL3RzL2tleXZhbHVlX3BpcGUudHMgcmVnaW9uPSdLZXlWYWx1ZVBpcGUnfVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQFBpcGUoe25hbWU6ICdrZXl2YWx1ZScsIHB1cmU6IGZhbHNlfSlcbmV4cG9ydCBjbGFzcyBLZXlWYWx1ZVBpcGUgaW1wbGVtZW50cyBQaXBlVHJhbnNmb3JtIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBkaWZmZXJzOiBLZXlWYWx1ZURpZmZlcnMpIHt9XG5cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgZGlmZmVyICE6IEtleVZhbHVlRGlmZmVyPGFueSwgYW55PjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUga2V5VmFsdWVzICE6IEFycmF5PEtleVZhbHVlPGFueSwgYW55Pj47XG5cbiAgdHJhbnNmb3JtPEssIFY+KGlucHV0OiBudWxsLCBjb21wYXJlRm4/OiAoYTogS2V5VmFsdWU8SywgVj4sIGI6IEtleVZhbHVlPEssIFY+KSA9PiBudW1iZXIpOiBudWxsO1xuICB0cmFuc2Zvcm08Vj4oXG4gICAgICBpbnB1dDoge1trZXk6IHN0cmluZ106IFZ9fE1hcDxzdHJpbmcsIFY+LFxuICAgICAgY29tcGFyZUZuPzogKGE6IEtleVZhbHVlPHN0cmluZywgVj4sIGI6IEtleVZhbHVlPHN0cmluZywgVj4pID0+IG51bWJlcik6XG4gICAgICBBcnJheTxLZXlWYWx1ZTxzdHJpbmcsIFY+PjtcbiAgdHJhbnNmb3JtPFY+KFxuICAgICAgaW5wdXQ6IHtba2V5OiBudW1iZXJdOiBWfXxNYXA8bnVtYmVyLCBWPixcbiAgICAgIGNvbXBhcmVGbj86IChhOiBLZXlWYWx1ZTxudW1iZXIsIFY+LCBiOiBLZXlWYWx1ZTxudW1iZXIsIFY+KSA9PiBudW1iZXIpOlxuICAgICAgQXJyYXk8S2V5VmFsdWU8bnVtYmVyLCBWPj47XG4gIHRyYW5zZm9ybTxLLCBWPihpbnB1dDogTWFwPEssIFY+LCBjb21wYXJlRm4/OiAoYTogS2V5VmFsdWU8SywgVj4sIGI6IEtleVZhbHVlPEssIFY+KSA9PiBudW1iZXIpOlxuICAgICAgQXJyYXk8S2V5VmFsdWU8SywgVj4+O1xuICB0cmFuc2Zvcm08SywgVj4oXG4gICAgICBpbnB1dDogbnVsbHx7W2tleTogc3RyaW5nXTogViwgW2tleTogbnVtYmVyXTogVn18TWFwPEssIFY+LFxuICAgICAgY29tcGFyZUZuOiAoYTogS2V5VmFsdWU8SywgVj4sIGI6IEtleVZhbHVlPEssIFY+KSA9PiBudW1iZXIgPSBkZWZhdWx0Q29tcGFyYXRvcik6XG4gICAgICBBcnJheTxLZXlWYWx1ZTxLLCBWPj58bnVsbCB7XG4gICAgaWYgKCFpbnB1dCB8fCAoIShpbnB1dCBpbnN0YW5jZW9mIE1hcCkgJiYgdHlwZW9mIGlucHV0ICE9PSAnb2JqZWN0JykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5kaWZmZXIpIHtcbiAgICAgIC8vIG1ha2UgYSBkaWZmZXIgZm9yIHdoYXRldmVyIHR5cGUgd2UndmUgYmVlbiBwYXNzZWQgaW5cbiAgICAgIHRoaXMuZGlmZmVyID0gdGhpcy5kaWZmZXJzLmZpbmQoaW5wdXQpLmNyZWF0ZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGRpZmZlckNoYW5nZXM6IEtleVZhbHVlQ2hhbmdlczxLLCBWPnxudWxsID0gdGhpcy5kaWZmZXIuZGlmZihpbnB1dCBhcyBhbnkpO1xuXG4gICAgaWYgKGRpZmZlckNoYW5nZXMpIHtcbiAgICAgIHRoaXMua2V5VmFsdWVzID0gW107XG4gICAgICBkaWZmZXJDaGFuZ2VzLmZvckVhY2hJdGVtKChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4ge1xuICAgICAgICB0aGlzLmtleVZhbHVlcy5wdXNoKG1ha2VLZXlWYWx1ZVBhaXIoci5rZXksIHIuY3VycmVudFZhbHVlICEpKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5rZXlWYWx1ZXMuc29ydChjb21wYXJlRm4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5rZXlWYWx1ZXM7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRDb21wYXJhdG9yPEssIFY+KFxuICAgIGtleVZhbHVlQTogS2V5VmFsdWU8SywgVj4sIGtleVZhbHVlQjogS2V5VmFsdWU8SywgVj4pOiBudW1iZXIge1xuICBjb25zdCBhID0ga2V5VmFsdWVBLmtleTtcbiAgY29uc3QgYiA9IGtleVZhbHVlQi5rZXk7XG4gIC8vIGlmIHNhbWUgZXhpdCB3aXRoIDA7XG4gIGlmIChhID09PSBiKSByZXR1cm4gMDtcbiAgLy8gbWFrZSBzdXJlIHRoYXQgdW5kZWZpbmVkIGFyZSBhdCB0aGUgZW5kIG9mIHRoZSBzb3J0LlxuICBpZiAoYSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTtcbiAgaWYgKGIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xO1xuICAvLyBtYWtlIHN1cmUgdGhhdCBudWxscyBhcmUgYXQgdGhlIGVuZCBvZiB0aGUgc29ydC5cbiAgaWYgKGEgPT09IG51bGwpIHJldHVybiAxO1xuICBpZiAoYiA9PT0gbnVsbCkgcmV0dXJuIC0xO1xuICBpZiAodHlwZW9mIGEgPT0gJ3N0cmluZycgJiYgdHlwZW9mIGIgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gYSA8IGIgPyAtMSA6IDE7XG4gIH1cbiAgaWYgKHR5cGVvZiBhID09ICdudW1iZXInICYmIHR5cGVvZiBiID09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGEgLSBiO1xuICB9XG4gIGlmICh0eXBlb2YgYSA9PSAnYm9vbGVhbicgJiYgdHlwZW9mIGIgPT0gJ2Jvb2xlYW4nKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiAxO1xuICB9XG4gIC8vIGBhYCBhbmQgYGJgIGFyZSBvZiBkaWZmZXJlbnQgdHlwZXMuIENvbXBhcmUgdGhlaXIgc3RyaW5nIHZhbHVlcy5cbiAgY29uc3QgYVN0cmluZyA9IFN0cmluZyhhKTtcbiAgY29uc3QgYlN0cmluZyA9IFN0cmluZyhiKTtcbiAgcmV0dXJuIGFTdHJpbmcgPT0gYlN0cmluZyA/IDAgOiBhU3RyaW5nIDwgYlN0cmluZyA/IC0xIDogMTtcbn1cbiJdfQ==