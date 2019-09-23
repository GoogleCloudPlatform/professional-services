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
import { looseIdentical, stringify } from '../../util';
import { isJsObject } from '../change_detection_util';
/**
 * @template K, V
 */
export class DefaultKeyValueDifferFactory {
    constructor() { }
    /**
     * @param {?} obj
     * @return {?}
     */
    supports(obj) { return obj instanceof Map || isJsObject(obj); }
    /**
     * @template K, V
     * @return {?}
     */
    create() { return new DefaultKeyValueDiffer(); }
}
/**
 * @template K, V
 */
export class DefaultKeyValueDiffer {
    constructor() {
        this._records = new Map();
        this._mapHead = null;
        this._appendAfter = null;
        this._previousMapHead = null;
        this._changesHead = null;
        this._changesTail = null;
        this._additionsHead = null;
        this._additionsTail = null;
        this._removalsHead = null;
        this._removalsTail = null;
    }
    /**
     * @return {?}
     */
    get isDirty() {
        return this._additionsHead !== null || this._changesHead !== null ||
            this._removalsHead !== null;
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._mapHead; record !== null; record = record._next) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachPreviousItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachChangedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._changesHead; record !== null; record = record._nextChanged) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachAddedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachRemovedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
            fn(record);
        }
    }
    /**
     * @param {?=} map
     * @return {?}
     */
    diff(map) {
        if (!map) {
            map = new Map();
        }
        else if (!(map instanceof Map || isJsObject(map))) {
            throw new Error(`Error trying to diff '${stringify(map)}'. Only maps and objects are allowed`);
        }
        return this.check(map) ? this : null;
    }
    /**
     * @return {?}
     */
    onDestroy() { }
    /**
     * Check the current state of the map vs the previous.
     * The algorithm is optimised for when the keys do no change.
     * @param {?} map
     * @return {?}
     */
    check(map) {
        this._reset();
        /** @type {?} */
        let insertBefore = this._mapHead;
        this._appendAfter = null;
        this._forEach(map, (value, key) => {
            if (insertBefore && insertBefore.key === key) {
                this._maybeAddToChanges(insertBefore, value);
                this._appendAfter = insertBefore;
                insertBefore = insertBefore._next;
            }
            else {
                /** @type {?} */
                const record = this._getOrCreateRecordForKey(key, value);
                insertBefore = this._insertBeforeOrAppend(insertBefore, record);
            }
        });
        // Items remaining at the end of the list have been deleted
        if (insertBefore) {
            if (insertBefore._prev) {
                insertBefore._prev._next = null;
            }
            this._removalsHead = insertBefore;
            for (let record = insertBefore; record !== null; record = record._nextRemoved) {
                if (record === this._mapHead) {
                    this._mapHead = null;
                }
                this._records.delete(record.key);
                record._nextRemoved = record._next;
                record.previousValue = record.currentValue;
                record.currentValue = null;
                record._prev = null;
                record._next = null;
            }
        }
        // Make sure tails have no next records from previous runs
        if (this._changesTail)
            this._changesTail._nextChanged = null;
        if (this._additionsTail)
            this._additionsTail._nextAdded = null;
        return this.isDirty;
    }
    /**
     * Inserts a record before `before` or append at the end of the list when `before` is null.
     *
     * Notes:
     * - This method appends at `this._appendAfter`,
     * - This method updates `this._appendAfter`,
     * - The return value is the new value for the insertion pointer.
     * @param {?} before
     * @param {?} record
     * @return {?}
     */
    _insertBeforeOrAppend(before, record) {
        if (before) {
            /** @type {?} */
            const prev = before._prev;
            record._next = before;
            record._prev = prev;
            before._prev = record;
            if (prev) {
                prev._next = record;
            }
            if (before === this._mapHead) {
                this._mapHead = record;
            }
            this._appendAfter = before;
            return before;
        }
        if (this._appendAfter) {
            this._appendAfter._next = record;
            record._prev = this._appendAfter;
        }
        else {
            this._mapHead = record;
        }
        this._appendAfter = record;
        return null;
    }
    /**
     * @param {?} key
     * @param {?} value
     * @return {?}
     */
    _getOrCreateRecordForKey(key, value) {
        if (this._records.has(key)) {
            /** @type {?} */
            const record = /** @type {?} */ ((this._records.get(key)));
            this._maybeAddToChanges(record, value);
            /** @type {?} */
            const prev = record._prev;
            /** @type {?} */
            const next = record._next;
            if (prev) {
                prev._next = next;
            }
            if (next) {
                next._prev = prev;
            }
            record._next = null;
            record._prev = null;
            return record;
        }
        /** @type {?} */
        const record = new KeyValueChangeRecord_(key);
        this._records.set(key, record);
        record.currentValue = value;
        this._addToAdditions(record);
        return record;
    }
    /**
     * \@internal
     * @return {?}
     */
    _reset() {
        if (this.isDirty) {
            /** @type {?} */
            let record;
            // let `_previousMapHead` contain the state of the map before the changes
            this._previousMapHead = this._mapHead;
            for (record = this._previousMapHead; record !== null; record = record._next) {
                record._nextPrevious = record._next;
            }
            // Update `record.previousValue` with the value of the item before the changes
            // We need to update all changed items (that's those which have been added and changed)
            for (record = this._changesHead; record !== null; record = record._nextChanged) {
                record.previousValue = record.currentValue;
            }
            for (record = this._additionsHead; record != null; record = record._nextAdded) {
                record.previousValue = record.currentValue;
            }
            this._changesHead = this._changesTail = null;
            this._additionsHead = this._additionsTail = null;
            this._removalsHead = null;
        }
    }
    /**
     * @param {?} record
     * @param {?} newValue
     * @return {?}
     */
    _maybeAddToChanges(record, newValue) {
        if (!looseIdentical(newValue, record.currentValue)) {
            record.previousValue = record.currentValue;
            record.currentValue = newValue;
            this._addToChanges(record);
        }
    }
    /**
     * @param {?} record
     * @return {?}
     */
    _addToAdditions(record) {
        if (this._additionsHead === null) {
            this._additionsHead = this._additionsTail = record;
        }
        else {
            /** @type {?} */ ((this._additionsTail))._nextAdded = record;
            this._additionsTail = record;
        }
    }
    /**
     * @param {?} record
     * @return {?}
     */
    _addToChanges(record) {
        if (this._changesHead === null) {
            this._changesHead = this._changesTail = record;
        }
        else {
            /** @type {?} */ ((this._changesTail))._nextChanged = record;
            this._changesTail = record;
        }
    }
    /**
     * \@internal
     * @template K, V
     * @param {?} obj
     * @param {?} fn
     * @return {?}
     */
    _forEach(obj, fn) {
        if (obj instanceof Map) {
            obj.forEach(fn);
        }
        else {
            Object.keys(obj).forEach(k => fn(obj[k], k));
        }
    }
}
if (false) {
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._records;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._mapHead;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._appendAfter;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._previousMapHead;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._changesHead;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._changesTail;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._additionsHead;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._additionsTail;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._removalsHead;
    /** @type {?} */
    DefaultKeyValueDiffer.prototype._removalsTail;
}
/**
 * @template K, V
 */
class KeyValueChangeRecord_ {
    /**
     * @param {?} key
     */
    constructor(key) {
        this.key = key;
        this.previousValue = null;
        this.currentValue = null;
        /**
         * \@internal
         */
        this._nextPrevious = null;
        /**
         * \@internal
         */
        this._next = null;
        /**
         * \@internal
         */
        this._prev = null;
        /**
         * \@internal
         */
        this._nextAdded = null;
        /**
         * \@internal
         */
        this._nextRemoved = null;
        /**
         * \@internal
         */
        this._nextChanged = null;
    }
}
if (false) {
    /** @type {?} */
    KeyValueChangeRecord_.prototype.previousValue;
    /** @type {?} */
    KeyValueChangeRecord_.prototype.currentValue;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextPrevious;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._next;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._prev;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextAdded;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextRemoved;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextChanged;
    /** @type {?} */
    KeyValueChangeRecord_.prototype.key;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL2RpZmZlcnMvZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNyRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7Ozs7QUFJcEQsTUFBTSxPQUFPLDRCQUE0QjtJQUN2QyxpQkFBZ0I7Ozs7O0lBQ2hCLFFBQVEsQ0FBQyxHQUFRLElBQWEsT0FBTyxHQUFHLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFOzs7OztJQUU3RSxNQUFNLEtBQWlDLE9BQU8sSUFBSSxxQkFBcUIsRUFBUSxDQUFDLEVBQUU7Q0FDbkY7Ozs7QUFFRCxNQUFNLE9BQU8scUJBQXFCOzt3QkFDYixJQUFJLEdBQUcsRUFBa0M7d0JBQ1AsSUFBSTs0QkFFQSxJQUFJO2dDQUNBLElBQUk7NEJBQ1IsSUFBSTs0QkFDSixJQUFJOzhCQUNGLElBQUk7OEJBQ0osSUFBSTs2QkFDTCxJQUFJOzZCQUNKLElBQUk7Ozs7O0lBRTlELElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLGNBQWMsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJO1lBQzdELElBQUksQ0FBQyxhQUFhLEtBQUssSUFBSSxDQUFDO0tBQ2pDOzs7OztJQUVELFdBQVcsQ0FBQyxFQUEyQzs7UUFDckQsSUFBSSxNQUFNLENBQW1DO1FBQzdDLEtBQUssTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLLElBQUksRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRTtZQUNu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QyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzlDOztDQUVKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELE1BQU0scUJBQXFCOzs7O0lBaUJ6QixZQUFtQixHQUFNO1FBQU4sUUFBRyxHQUFILEdBQUcsQ0FBRztRQWhCekIscUJBQXdCLElBQUksQ0FBQztRQUM3QixvQkFBdUIsSUFBSSxDQUFDOzs7O1FBRzVCLHFCQUFrRCxJQUFJLENBQUM7Ozs7UUFFdkQsYUFBMEMsSUFBSSxDQUFDOzs7O1FBRS9DLGFBQTBDLElBQUksQ0FBQzs7OztRQUUvQyxrQkFBK0MsSUFBSSxDQUFDOzs7O1FBRXBELG9CQUFpRCxJQUFJLENBQUM7Ozs7UUFFdEQsb0JBQWlELElBQUksQ0FBQztLQUV6QjtDQUM5QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtsb29zZUlkZW50aWNhbCwgc3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsJztcbmltcG9ydCB7aXNKc09iamVjdH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7S2V5VmFsdWVDaGFuZ2VSZWNvcmQsIEtleVZhbHVlQ2hhbmdlcywgS2V5VmFsdWVEaWZmZXIsIEtleVZhbHVlRGlmZmVyRmFjdG9yeX0gZnJvbSAnLi9rZXl2YWx1ZV9kaWZmZXJzJztcblxuXG5leHBvcnQgY2xhc3MgRGVmYXVsdEtleVZhbHVlRGlmZmVyRmFjdG9yeTxLLCBWPiBpbXBsZW1lbnRzIEtleVZhbHVlRGlmZmVyRmFjdG9yeSB7XG4gIGNvbnN0cnVjdG9yKCkge31cbiAgc3VwcG9ydHMob2JqOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIE1hcCB8fCBpc0pzT2JqZWN0KG9iaik7IH1cblxuICBjcmVhdGU8SywgVj4oKTogS2V5VmFsdWVEaWZmZXI8SywgVj4geyByZXR1cm4gbmV3IERlZmF1bHRLZXlWYWx1ZURpZmZlcjxLLCBWPigpOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0S2V5VmFsdWVEaWZmZXI8SywgVj4gaW1wbGVtZW50cyBLZXlWYWx1ZURpZmZlcjxLLCBWPiwgS2V5VmFsdWVDaGFuZ2VzPEssIFY+IHtcbiAgcHJpdmF0ZSBfcmVjb3JkcyA9IG5ldyBNYXA8SywgS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+PigpO1xuICBwcml2YXRlIF9tYXBIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIC8vIF9hcHBlbmRBZnRlciBpcyB1c2VkIGluIHRoZSBjaGVjayBsb29wXG4gIHByaXZhdGUgX2FwcGVuZEFmdGVyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3ByZXZpb3VzTWFwSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9jaGFuZ2VzSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9jaGFuZ2VzVGFpbDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hZGRpdGlvbnNIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2FkZGl0aW9uc1RhaWw6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcmVtb3ZhbHNIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3JlbW92YWxzVGFpbDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuXG4gIGdldCBpc0RpcnR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hZGRpdGlvbnNIZWFkICE9PSBudWxsIHx8IHRoaXMuX2NoYW5nZXNIZWFkICE9PSBudWxsIHx8XG4gICAgICAgIHRoaXMuX3JlbW92YWxzSGVhZCAhPT0gbnVsbDtcbiAgfVxuXG4gIGZvckVhY2hJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX21hcEhlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0KSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hQcmV2aW91c0l0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fcHJldmlvdXNNYXBIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dFByZXZpb3VzKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hDaGFuZ2VkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9jaGFuZ2VzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRDaGFuZ2VkKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hBZGRlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fYWRkaXRpb25zSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRBZGRlZCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoUmVtb3ZlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fcmVtb3ZhbHNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dFJlbW92ZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZGlmZihtYXA/OiBNYXA8YW55LCBhbnk+fHtbazogc3RyaW5nXTogYW55fXxudWxsKTogYW55IHtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgIH0gZWxzZSBpZiAoIShtYXAgaW5zdGFuY2VvZiBNYXAgfHwgaXNKc09iamVjdChtYXApKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBFcnJvciB0cnlpbmcgdG8gZGlmZiAnJHtzdHJpbmdpZnkobWFwKX0nLiBPbmx5IG1hcHMgYW5kIG9iamVjdHMgYXJlIGFsbG93ZWRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jaGVjayhtYXApID8gdGhpcyA6IG51bGw7XG4gIH1cblxuICBvbkRlc3Ryb3koKSB7fVxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgbWFwIHZzIHRoZSBwcmV2aW91cy5cbiAgICogVGhlIGFsZ29yaXRobSBpcyBvcHRpbWlzZWQgZm9yIHdoZW4gdGhlIGtleXMgZG8gbm8gY2hhbmdlLlxuICAgKi9cbiAgY2hlY2sobWFwOiBNYXA8YW55LCBhbnk+fHtbazogc3RyaW5nXTogYW55fSk6IGJvb2xlYW4ge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG5cbiAgICBsZXQgaW5zZXJ0QmVmb3JlID0gdGhpcy5fbWFwSGVhZDtcbiAgICB0aGlzLl9hcHBlbmRBZnRlciA9IG51bGw7XG5cbiAgICB0aGlzLl9mb3JFYWNoKG1hcCwgKHZhbHVlOiBhbnksIGtleTogYW55KSA9PiB7XG4gICAgICBpZiAoaW5zZXJ0QmVmb3JlICYmIGluc2VydEJlZm9yZS5rZXkgPT09IGtleSkge1xuICAgICAgICB0aGlzLl9tYXliZUFkZFRvQ2hhbmdlcyhpbnNlcnRCZWZvcmUsIHZhbHVlKTtcbiAgICAgICAgdGhpcy5fYXBwZW5kQWZ0ZXIgPSBpbnNlcnRCZWZvcmU7XG4gICAgICAgIGluc2VydEJlZm9yZSA9IGluc2VydEJlZm9yZS5fbmV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlY29yZCA9IHRoaXMuX2dldE9yQ3JlYXRlUmVjb3JkRm9yS2V5KGtleSwgdmFsdWUpO1xuICAgICAgICBpbnNlcnRCZWZvcmUgPSB0aGlzLl9pbnNlcnRCZWZvcmVPckFwcGVuZChpbnNlcnRCZWZvcmUsIHJlY29yZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJdGVtcyByZW1haW5pbmcgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCBoYXZlIGJlZW4gZGVsZXRlZFxuICAgIGlmIChpbnNlcnRCZWZvcmUpIHtcbiAgICAgIGlmIChpbnNlcnRCZWZvcmUuX3ByZXYpIHtcbiAgICAgICAgaW5zZXJ0QmVmb3JlLl9wcmV2Ll9uZXh0ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkID0gaW5zZXJ0QmVmb3JlO1xuXG4gICAgICBmb3IgKGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gaW5zZXJ0QmVmb3JlOyByZWNvcmQgIT09IG51bGw7XG4gICAgICAgICAgIHJlY29yZCA9IHJlY29yZC5fbmV4dFJlbW92ZWQpIHtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdGhpcy5fbWFwSGVhZCkge1xuICAgICAgICAgIHRoaXMuX21hcEhlYWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlY29yZHMuZGVsZXRlKHJlY29yZC5rZXkpO1xuICAgICAgICByZWNvcmQuX25leHRSZW1vdmVkID0gcmVjb3JkLl9uZXh0O1xuICAgICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICAgIHJlY29yZC5jdXJyZW50VmFsdWUgPSBudWxsO1xuICAgICAgICByZWNvcmQuX3ByZXYgPSBudWxsO1xuICAgICAgICByZWNvcmQuX25leHQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0YWlscyBoYXZlIG5vIG5leHQgcmVjb3JkcyBmcm9tIHByZXZpb3VzIHJ1bnNcbiAgICBpZiAodGhpcy5fY2hhbmdlc1RhaWwpIHRoaXMuX2NoYW5nZXNUYWlsLl9uZXh0Q2hhbmdlZCA9IG51bGw7XG4gICAgaWYgKHRoaXMuX2FkZGl0aW9uc1RhaWwpIHRoaXMuX2FkZGl0aW9uc1RhaWwuX25leHRBZGRlZCA9IG51bGw7XG5cbiAgICByZXR1cm4gdGhpcy5pc0RpcnR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydHMgYSByZWNvcmQgYmVmb3JlIGBiZWZvcmVgIG9yIGFwcGVuZCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0IHdoZW4gYGJlZm9yZWAgaXMgbnVsbC5cbiAgICpcbiAgICogTm90ZXM6XG4gICAqIC0gVGhpcyBtZXRob2QgYXBwZW5kcyBhdCBgdGhpcy5fYXBwZW5kQWZ0ZXJgLFxuICAgKiAtIFRoaXMgbWV0aG9kIHVwZGF0ZXMgYHRoaXMuX2FwcGVuZEFmdGVyYCxcbiAgICogLSBUaGUgcmV0dXJuIHZhbHVlIGlzIHRoZSBuZXcgdmFsdWUgZm9yIHRoZSBpbnNlcnRpb24gcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2luc2VydEJlZm9yZU9yQXBwZW5kKFxuICAgICAgYmVmb3JlOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCxcbiAgICAgIHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+KTogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwge1xuICAgIGlmIChiZWZvcmUpIHtcbiAgICAgIGNvbnN0IHByZXYgPSBiZWZvcmUuX3ByZXY7XG4gICAgICByZWNvcmQuX25leHQgPSBiZWZvcmU7XG4gICAgICByZWNvcmQuX3ByZXYgPSBwcmV2O1xuICAgICAgYmVmb3JlLl9wcmV2ID0gcmVjb3JkO1xuICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgcHJldi5fbmV4dCA9IHJlY29yZDtcbiAgICAgIH1cbiAgICAgIGlmIChiZWZvcmUgPT09IHRoaXMuX21hcEhlYWQpIHtcbiAgICAgICAgdGhpcy5fbWFwSGVhZCA9IHJlY29yZDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fYXBwZW5kQWZ0ZXIgPSBiZWZvcmU7XG4gICAgICByZXR1cm4gYmVmb3JlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9hcHBlbmRBZnRlcikge1xuICAgICAgdGhpcy5fYXBwZW5kQWZ0ZXIuX25leHQgPSByZWNvcmQ7XG4gICAgICByZWNvcmQuX3ByZXYgPSB0aGlzLl9hcHBlbmRBZnRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbWFwSGVhZCA9IHJlY29yZDtcbiAgICB9XG5cbiAgICB0aGlzLl9hcHBlbmRBZnRlciA9IHJlY29yZDtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2dldE9yQ3JlYXRlUmVjb3JkRm9yS2V5KGtleTogSywgdmFsdWU6IFYpOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4ge1xuICAgIGlmICh0aGlzLl9yZWNvcmRzLmhhcyhrZXkpKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSB0aGlzLl9yZWNvcmRzLmdldChrZXkpICE7XG4gICAgICB0aGlzLl9tYXliZUFkZFRvQ2hhbmdlcyhyZWNvcmQsIHZhbHVlKTtcbiAgICAgIGNvbnN0IHByZXYgPSByZWNvcmQuX3ByZXY7XG4gICAgICBjb25zdCBuZXh0ID0gcmVjb3JkLl9uZXh0O1xuICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgcHJldi5fbmV4dCA9IG5leHQ7XG4gICAgICB9XG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICBuZXh0Ll9wcmV2ID0gcHJldjtcbiAgICAgIH1cbiAgICAgIHJlY29yZC5fbmV4dCA9IG51bGw7XG4gICAgICByZWNvcmQuX3ByZXYgPSBudWxsO1xuXG4gICAgICByZXR1cm4gcmVjb3JkO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY29yZCA9IG5ldyBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4oa2V5KTtcbiAgICB0aGlzLl9yZWNvcmRzLnNldChrZXksIHJlY29yZCk7XG4gICAgcmVjb3JkLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuX2FkZFRvQWRkaXRpb25zKHJlY29yZCk7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3Jlc2V0KCkge1xuICAgIGlmICh0aGlzLmlzRGlydHkpIHtcbiAgICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgICAgLy8gbGV0IGBfcHJldmlvdXNNYXBIZWFkYCBjb250YWluIHRoZSBzdGF0ZSBvZiB0aGUgbWFwIGJlZm9yZSB0aGUgY2hhbmdlc1xuICAgICAgdGhpcy5fcHJldmlvdXNNYXBIZWFkID0gdGhpcy5fbWFwSGVhZDtcbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fcHJldmlvdXNNYXBIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dCkge1xuICAgICAgICByZWNvcmQuX25leHRQcmV2aW91cyA9IHJlY29yZC5fbmV4dDtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIGByZWNvcmQucHJldmlvdXNWYWx1ZWAgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGl0ZW0gYmVmb3JlIHRoZSBjaGFuZ2VzXG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSBhbGwgY2hhbmdlZCBpdGVtcyAodGhhdCdzIHRob3NlIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBhbmQgY2hhbmdlZClcbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fY2hhbmdlc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0Q2hhbmdlZCkge1xuICAgICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICB9XG4gICAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2FkZGl0aW9uc0hlYWQ7IHJlY29yZCAhPSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRBZGRlZCkge1xuICAgICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NoYW5nZXNIZWFkID0gdGhpcy5fY2hhbmdlc1RhaWwgPSBudWxsO1xuICAgICAgdGhpcy5fYWRkaXRpb25zSGVhZCA9IHRoaXMuX2FkZGl0aW9uc1RhaWwgPSBudWxsO1xuICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgdGhlIHJlY29yZCBvciBhIGdpdmVuIGtleSB0byB0aGUgbGlzdCBvZiBjaGFuZ2VzIG9ubHkgd2hlbiB0aGUgdmFsdWUgaGFzIGFjdHVhbGx5IGNoYW5nZWRcbiAgcHJpdmF0ZSBfbWF5YmVBZGRUb0NoYW5nZXMocmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4sIG5ld1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIWxvb3NlSWRlbnRpY2FsKG5ld1ZhbHVlLCByZWNvcmQuY3VycmVudFZhbHVlKSkge1xuICAgICAgcmVjb3JkLnByZXZpb3VzVmFsdWUgPSByZWNvcmQuY3VycmVudFZhbHVlO1xuICAgICAgcmVjb3JkLmN1cnJlbnRWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy5fYWRkVG9DaGFuZ2VzKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYWRkVG9BZGRpdGlvbnMocmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4pIHtcbiAgICBpZiAodGhpcy5fYWRkaXRpb25zSGVhZCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fYWRkaXRpb25zSGVhZCA9IHRoaXMuX2FkZGl0aW9uc1RhaWwgPSByZWNvcmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FkZGl0aW9uc1RhaWwgIS5fbmV4dEFkZGVkID0gcmVjb3JkO1xuICAgICAgdGhpcy5fYWRkaXRpb25zVGFpbCA9IHJlY29yZDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hZGRUb0NoYW5nZXMocmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4pIHtcbiAgICBpZiAodGhpcy5fY2hhbmdlc0hlYWQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2NoYW5nZXNIZWFkID0gdGhpcy5fY2hhbmdlc1RhaWwgPSByZWNvcmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NoYW5nZXNUYWlsICEuX25leHRDaGFuZ2VkID0gcmVjb3JkO1xuICAgICAgdGhpcy5fY2hhbmdlc1RhaWwgPSByZWNvcmQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIF9mb3JFYWNoPEssIFY+KG9iajogTWFwPEssIFY+fHtbazogc3RyaW5nXTogVn0sIGZuOiAodjogViwgazogYW55KSA9PiB2b2lkKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgb2JqLmZvckVhY2goZm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goayA9PiBmbihvYmpba10sIGspKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+IGltcGxlbWVudHMgS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4ge1xuICBwcmV2aW91c1ZhbHVlOiBWfG51bGwgPSBudWxsO1xuICBjdXJyZW50VmFsdWU6IFZ8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dFByZXZpb3VzOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcHJldjogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0QWRkZWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dFJlbW92ZWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dENoYW5nZWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMga2V5OiBLKSB7fVxufVxuIl19