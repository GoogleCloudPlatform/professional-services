"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
/** Naive priority queue; not intended for large datasets */
class PriorityQueue {
    constructor(_comparator) {
        this._comparator = _comparator;
        this._items = new Array();
    }
    clear() {
        this._items = new Array();
    }
    push(item) {
        const index = this._items.findIndex(existing => this._comparator(item, existing) <= 0);
        if (index === -1) {
            this._items.push(item);
        }
        else {
            this._items.splice(index, 0, item);
        }
    }
    pop() {
        if (this._items.length === 0) {
            return undefined;
        }
        return this._items.splice(0, 1)[0];
    }
    peek() {
        if (this._items.length === 0) {
            return undefined;
        }
        return this._items[0];
    }
    get size() {
        return this._items.length;
    }
    toArray() {
        return this._items.slice();
    }
}
exports.PriorityQueue = PriorityQueue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpb3JpdHktcXVldWUuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2NvcmUvc3JjL3V0aWxzL3ByaW9yaXR5LXF1ZXVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7O0FBRUgsNERBQTREO0FBQzVELE1BQWEsYUFBYTtJQUd4QixZQUFvQixXQUFtQztRQUFuQyxnQkFBVyxHQUFYLFdBQVcsQ0FBd0I7UUFGL0MsV0FBTSxHQUFHLElBQUksS0FBSyxFQUFLLENBQUM7SUFFMEIsQ0FBQztJQUUzRCxLQUFLO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBSyxDQUFDO0lBQy9CLENBQUM7SUFFRCxJQUFJLENBQUMsSUFBTztRQUNWLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFdkYsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEI7YUFBTTtZQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDcEM7SUFDSCxDQUFDO0lBRUQsR0FBRztRQUNELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzVCLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBRUQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELElBQUk7UUFDRixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM1QixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM1QixDQUFDO0lBRUQsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM3QixDQUFDO0NBQ0Y7QUExQ0Qsc0NBMENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKiogTmFpdmUgcHJpb3JpdHkgcXVldWU7IG5vdCBpbnRlbmRlZCBmb3IgbGFyZ2UgZGF0YXNldHMgKi9cbmV4cG9ydCBjbGFzcyBQcmlvcml0eVF1ZXVlPFQ+IHtcbiAgcHJpdmF0ZSBfaXRlbXMgPSBuZXcgQXJyYXk8VD4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9jb21wYXJhdG9yOiAoeDogVCwgeTogVCkgPT4gbnVtYmVyKSB7fVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX2l0ZW1zID0gbmV3IEFycmF5PFQ+KCk7XG4gIH1cblxuICBwdXNoKGl0ZW06IFQpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuX2l0ZW1zLmZpbmRJbmRleChleGlzdGluZyA9PiB0aGlzLl9jb21wYXJhdG9yKGl0ZW0sIGV4aXN0aW5nKSA8PSAwKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuX2l0ZW1zLnB1c2goaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2l0ZW1zLnNwbGljZShpbmRleCwgMCwgaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgcG9wKCk6IFQgfCB1bmRlZmluZWQge1xuICAgIGlmICh0aGlzLl9pdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX2l0ZW1zLnNwbGljZSgwLCAxKVswXTtcbiAgfVxuXG4gIHBlZWsoKTogVCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHRoaXMuX2l0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5faXRlbXNbMF07XG4gIH1cblxuICBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9pdGVtcy5sZW5ndGg7XG4gIH1cblxuICB0b0FycmF5KCk6IEFycmF5PFQ+IHtcbiAgICByZXR1cm4gdGhpcy5faXRlbXMuc2xpY2UoKTtcbiAgfVxufVxuIl19