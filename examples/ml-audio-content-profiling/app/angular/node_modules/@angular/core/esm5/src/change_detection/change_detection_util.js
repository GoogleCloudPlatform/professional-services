/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getSymbolIterator, looseIdentical } from '../util';
export function devModeEqual(a, b) {
    var isListLikeIterableA = isListLikeIterable(a);
    var isListLikeIterableB = isListLikeIterable(b);
    if (isListLikeIterableA && isListLikeIterableB) {
        return areIterablesEqual(a, b, devModeEqual);
    }
    else {
        var isAObject = a && (typeof a === 'object' || typeof a === 'function');
        var isBObject = b && (typeof b === 'object' || typeof b === 'function');
        if (!isListLikeIterableA && isAObject && !isListLikeIterableB && isBObject) {
            return true;
        }
        else {
            return looseIdentical(a, b);
        }
    }
}
/**
 * Indicates that the result of a {@link Pipe} transformation has changed even though the
 * reference has not changed.
 *
 * Wrapped values are unwrapped automatically during the change detection, and the unwrapped value
 * is stored.
 *
 * Example:
 *
 * ```
 * if (this._latestValue === this._latestReturnedValue) {
 *    return this._latestReturnedValue;
 *  } else {
 *    this._latestReturnedValue = this._latestValue;
 *    return WrappedValue.wrap(this._latestValue); // this will force update
 *  }
 * ```
 *
 * @publicApi
 */
var WrappedValue = /** @class */ (function () {
    function WrappedValue(value) {
        this.wrapped = value;
    }
    /** Creates a wrapped value. */
    WrappedValue.wrap = function (value) { return new WrappedValue(value); };
    /**
     * Returns the underlying value of a wrapped value.
     * Returns the given `value` when it is not wrapped.
     **/
    WrappedValue.unwrap = function (value) { return WrappedValue.isWrapped(value) ? value.wrapped : value; };
    /** Returns true if `value` is a wrapped value. */
    WrappedValue.isWrapped = function (value) { return value instanceof WrappedValue; };
    return WrappedValue;
}());
export { WrappedValue };
/**
 * Represents a basic change from a previous to a new value.
 *
 * @publicApi
 */
var SimpleChange = /** @class */ (function () {
    function SimpleChange(previousValue, currentValue, firstChange) {
        this.previousValue = previousValue;
        this.currentValue = currentValue;
        this.firstChange = firstChange;
    }
    /**
     * Check whether the new value is the first value assigned.
     */
    SimpleChange.prototype.isFirstChange = function () { return this.firstChange; };
    return SimpleChange;
}());
export { SimpleChange };
export function isListLikeIterable(obj) {
    if (!isJsObject(obj))
        return false;
    return Array.isArray(obj) ||
        (!(obj instanceof Map) && // JS Map are iterables but return entries as [k, v]
            getSymbolIterator() in obj); // JS Iterable have a Symbol.iterator prop
}
export function areIterablesEqual(a, b, comparator) {
    var iterator1 = a[getSymbolIterator()]();
    var iterator2 = b[getSymbolIterator()]();
    while (true) {
        var item1 = iterator1.next();
        var item2 = iterator2.next();
        if (item1.done && item2.done)
            return true;
        if (item1.done || item2.done)
            return false;
        if (!comparator(item1.value, item2.value))
            return false;
    }
}
export function iterateListLike(obj, fn) {
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            fn(obj[i]);
        }
    }
    else {
        var iterator = obj[getSymbolIterator()]();
        var item = void 0;
        while (!((item = iterator.next()).done)) {
            fn(item.value);
        }
    }
}
export function isJsObject(o) {
    return o !== null && (typeof o === 'function' || typeof o === 'object');
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlX2RldGVjdGlvbl91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUxRCxNQUFNLFVBQVUsWUFBWSxDQUFDLENBQU0sRUFBRSxDQUFNO0lBQ3pDLElBQU0sbUJBQW1CLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsSUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxJQUFJLG1CQUFtQixJQUFJLG1CQUFtQixFQUFFO1FBQzlDLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztLQUM5QztTQUFNO1FBQ0wsSUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDO1FBQzFFLElBQU0sU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsbUJBQW1CLElBQUksU0FBUyxJQUFJLENBQUMsbUJBQW1CLElBQUksU0FBUyxFQUFFO1lBQzFFLE9BQU8sSUFBSSxDQUFDO1NBQ2I7YUFBTTtZQUNMLE9BQU8sY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM3QjtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0g7SUFJRSxzQkFBWSxLQUFVO1FBQUks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QUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2hCO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxDQUFNO0lBQy9CLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQztBQUMxRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldFN5bWJvbEl0ZXJhdG9yLCBsb29zZUlkZW50aWNhbH0gZnJvbSAnLi4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXZNb2RlRXF1YWwoYTogYW55LCBiOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgaXNMaXN0TGlrZUl0ZXJhYmxlQSA9IGlzTGlzdExpa2VJdGVyYWJsZShhKTtcbiAgY29uc3QgaXNMaXN0TGlrZUl0ZXJhYmxlQiA9IGlzTGlzdExpa2VJdGVyYWJsZShiKTtcbiAgaWYgKGlzTGlzdExpa2VJdGVyYWJsZUEgJiYgaXNMaXN0TGlrZUl0ZXJhYmxlQikge1xuICAgIHJldHVybiBhcmVJdGVyYWJsZXNFcXVhbChhLCBiLCBkZXZNb2RlRXF1YWwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGlzQU9iamVjdCA9IGEgJiYgKHR5cGVvZiBhID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG4gICAgY29uc3QgaXNCT2JqZWN0ID0gYiAmJiAodHlwZW9mIGIgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBiID09PSAnZnVuY3Rpb24nKTtcbiAgICBpZiAoIWlzTGlzdExpa2VJdGVyYWJsZUEgJiYgaXNBT2JqZWN0ICYmICFpc0xpc3RMaWtlSXRlcmFibGVCICYmIGlzQk9iamVjdCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBsb29zZUlkZW50aWNhbChhLCBiKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgdGhhdCB0aGUgcmVzdWx0IG9mIGEge0BsaW5rIFBpcGV9IHRyYW5zZm9ybWF0aW9uIGhhcyBjaGFuZ2VkIGV2ZW4gdGhvdWdoIHRoZVxuICogcmVmZXJlbmNlIGhhcyBub3QgY2hhbmdlZC5cbiAqXG4gKiBXcmFwcGVkIHZhbHVlcyBhcmUgdW53cmFwcGVkIGF1dG9tYXRpY2FsbHkgZHVyaW5nIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uLCBhbmQgdGhlIHVud3JhcHBlZCB2YWx1ZVxuICogaXMgc3RvcmVkLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBpZiAodGhpcy5fbGF0ZXN0VmFsdWUgPT09IHRoaXMuX2xhdGVzdFJldHVybmVkVmFsdWUpIHtcbiAqICAgIHJldHVybiB0aGlzLl9sYXRlc3RSZXR1cm5lZFZhbHVlO1xuICogIH0gZWxzZSB7XG4gKiAgICB0aGlzLl9sYXRlc3RSZXR1cm5lZFZhbHVlID0gdGhpcy5fbGF0ZXN0VmFsdWU7XG4gKiAgICByZXR1cm4gV3JhcHBlZFZhbHVlLndyYXAodGhpcy5fbGF0ZXN0VmFsdWUpOyAvLyB0aGlzIHdpbGwgZm9yY2UgdXBkYXRlXG4gKiAgfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgV3JhcHBlZFZhbHVlIHtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gNS4zLCB1c2UgYHVud3JhcCgpYCBpbnN0ZWFkIC0gd2lsbCBzd2l0Y2ggdG8gcHJvdGVjdGVkICovXG4gIHdyYXBwZWQ6IGFueTtcblxuICBjb25zdHJ1Y3Rvcih2YWx1ZTogYW55KSB7IHRoaXMud3JhcHBlZCA9IHZhbHVlOyB9XG5cbiAgLyoqIENyZWF0ZXMgYSB3cmFwcGVkIHZhbHVlLiAqL1xuICBzdGF0aWMgd3JhcCh2YWx1ZTogYW55KTogV3JhcHBlZFZhbHVlIHsgcmV0dXJuIG5ldyBXcmFwcGVkVmFsdWUodmFsdWUpOyB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHVuZGVybHlpbmcgdmFsdWUgb2YgYSB3cmFwcGVkIHZhbHVlLlxuICAgKiBSZXR1cm5zIHRoZSBnaXZlbiBgdmFsdWVgIHdoZW4gaXQgaXMgbm90IHdyYXBwZWQuXG4gICAqKi9cbiAgc3RhdGljIHVud3JhcCh2YWx1ZTogYW55KTogYW55IHsgcmV0dXJuIFdyYXBwZWRWYWx1ZS5pc1dyYXBwZWQodmFsdWUpID8gdmFsdWUud3JhcHBlZCA6IHZhbHVlOyB9XG5cbiAgLyoqIFJldHVybnMgdHJ1ZSBpZiBgdmFsdWVgIGlzIGEgd3JhcHBlZCB2YWx1ZS4gKi9cbiAgc3RhdGljIGlzV3JhcHBlZCh2YWx1ZTogYW55KTogdmFsdWUgaXMgV3JhcHBlZFZhbHVlIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgV3JhcHBlZFZhbHVlOyB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGJhc2ljIGNoYW5nZSBmcm9tIGEgcHJldmlvdXMgdG8gYSBuZXcgdmFsdWUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgU2ltcGxlQ2hhbmdlIHtcbiAgY29uc3RydWN0b3IocHVibGljIHByZXZpb3VzVmFsdWU6IGFueSwgcHVibGljIGN1cnJlbnRWYWx1ZTogYW55LCBwdWJsaWMgZmlyc3RDaGFuZ2U6IGJvb2xlYW4pIHt9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG5ldyB2YWx1ZSBpcyB0aGUgZmlyc3QgdmFsdWUgYXNzaWduZWQuXG4gICAqL1xuICBpc0ZpcnN0Q2hhbmdlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5maXJzdENoYW5nZTsgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMaXN0TGlrZUl0ZXJhYmxlKG9iajogYW55KTogYm9vbGVhbiB7XG4gIGlmICghaXNKc09iamVjdChvYmopKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KG9iaikgfHxcbiAgICAgICghKG9iaiBpbnN0YW5jZW9mIE1hcCkgJiYgICAgICAvLyBKUyBNYXAgYXJlIGl0ZXJhYmxlcyBidXQgcmV0dXJuIGVudHJpZXMgYXMgW2ssIHZdXG4gICAgICAgZ2V0U3ltYm9sSXRlcmF0b3IoKSBpbiBvYmopOyAgLy8gSlMgSXRlcmFibGUgaGF2ZSBhIFN5bWJvbC5pdGVyYXRvciBwcm9wXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcmVJdGVyYWJsZXNFcXVhbChcbiAgICBhOiBhbnksIGI6IGFueSwgY29tcGFyYXRvcjogKGE6IGFueSwgYjogYW55KSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGl0ZXJhdG9yMSA9IGFbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTtcbiAgY29uc3QgaXRlcmF0b3IyID0gYltnZXRTeW1ib2xJdGVyYXRvcigpXSgpO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgaXRlbTEgPSBpdGVyYXRvcjEubmV4dCgpO1xuICAgIGNvbnN0IGl0ZW0yID0gaXRlcmF0b3IyLm5leHQoKTtcbiAgICBpZiAoaXRlbTEuZG9uZSAmJiBpdGVtMi5kb25lKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXRlbTEuZG9uZSB8fCBpdGVtMi5kb25lKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFjb21wYXJhdG9yKGl0ZW0xLnZhbHVlLCBpdGVtMi52YWx1ZSkpIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXRlcmF0ZUxpc3RMaWtlKG9iajogYW55LCBmbjogKHA6IGFueSkgPT4gYW55KSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgZm4ob2JqW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaXRlcmF0b3IgPSBvYmpbZ2V0U3ltYm9sSXRlcmF0b3IoKV0oKTtcbiAgICBsZXQgaXRlbTogYW55O1xuICAgIHdoaWxlICghKChpdGVtID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSkge1xuICAgICAgZm4oaXRlbS52YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0pzT2JqZWN0KG86IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gbyAhPT0gbnVsbCAmJiAodHlwZW9mIG8gPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG8gPT09ICdvYmplY3QnKTtcbn1cbiJdfQ==