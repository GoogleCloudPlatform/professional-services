"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const exception_1 = require("../exception");
class DependencyNotFoundException extends exception_1.BaseException {
    constructor() { super('One of the dependencies is not part of the set.'); }
}
exports.DependencyNotFoundException = DependencyNotFoundException;
class CircularDependencyFoundException extends exception_1.BaseException {
    constructor() { super('Circular dependencies found.'); }
}
exports.CircularDependencyFoundException = CircularDependencyFoundException;
class PartiallyOrderedSet {
    constructor() {
        this._items = new Map();
    }
    _checkCircularDependencies(item, deps) {
        if (deps.has(item)) {
            throw new CircularDependencyFoundException();
        }
        deps.forEach(dep => this._checkCircularDependencies(item, this._items.get(dep) || new Set()));
    }
    clear() {
        this._items.clear();
    }
    has(item) {
        return this._items.has(item);
    }
    get size() {
        return this._items.size;
    }
    forEach(callbackfn, thisArg) {
        for (const x of this) {
            callbackfn.call(thisArg, x, x, this);
        }
    }
    /**
     * Returns an iterable of [v,v] pairs for every value `v` in the set.
     */
    *entries() {
        for (const item of this) {
            yield [item, item];
        }
    }
    /**
     * Despite its name, returns an iterable of the values in the set,
     */
    keys() {
        return this.values();
    }
    /**
     * Returns an iterable of values in the set.
     */
    values() {
        return this[Symbol.iterator]();
    }
    add(item, deps = new Set()) {
        if (Array.isArray(deps)) {
            deps = new Set(deps);
        }
        // Verify item is not already in the set.
        if (this._items.has(item)) {
            const itemDeps = this._items.get(item) || new Set();
            // If the dependency list is equal, just return, otherwise remove and keep going.
            let equal = true;
            for (const dep of deps) {
                if (!itemDeps.has(dep)) {
                    equal = false;
                    break;
                }
            }
            if (equal) {
                for (const dep of itemDeps) {
                    if (!deps.has(dep)) {
                        equal = false;
                        break;
                    }
                }
            }
            if (equal) {
                return this;
            }
            else {
                this._items.delete(item);
            }
        }
        // Verify all dependencies are part of the Set.
        for (const dep of deps) {
            if (!this._items.has(dep)) {
                throw new DependencyNotFoundException();
            }
        }
        // Verify there's no dependency cycle.
        this._checkCircularDependencies(item, deps);
        this._items.set(item, new Set(deps));
        return this;
    }
    delete(item) {
        if (!this._items.has(item)) {
            return false;
        }
        // Remove it from all dependencies if force == true.
        this._items.forEach(value => value.delete(item));
        return this._items.delete(item);
    }
    *[Symbol.iterator]() {
        const copy = new Map(this._items);
        for (const [key, value] of copy.entries()) {
            copy.set(key, new Set(value));
        }
        while (copy.size > 0) {
            const run = [];
            // Take the first item without dependencies.
            for (const [item, deps] of copy.entries()) {
                if (deps.size == 0) {
                    run.push(item);
                }
            }
            for (const item of run) {
                copy.forEach(s => s.delete(item));
                copy.delete(item);
                yield item;
            }
            if (run.length == 0) {
                // uh oh...
                throw new CircularDependencyFoundException();
            }
        }
    }
    get [Symbol.toStringTag]() {
        return 'Set';
    }
}
exports.PartiallyOrderedSet = PartiallyOrderedSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGlhbGx5LW9yZGVyZWQtc2V0LmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9jb3JlL3NyYy91dGlscy9wYXJ0aWFsbHktb3JkZXJlZC1zZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFDSCw0Q0FBNkM7QUFFN0MsTUFBYSwyQkFBNEIsU0FBUSx5QkFBYTtJQUM1RCxnQkFBZ0IsS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzVFO0FBRkQsa0VBRUM7QUFDRCxNQUFhLGdDQUFpQyxTQUFRLHlCQUFhO0lBQ2pFLGdCQUFnQixLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDekQ7QUFGRCw0RUFFQztBQUVELE1BQWEsbUJBQW1CO0lBQWhDO1FBQ1UsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7SUErSXhDLENBQUM7SUE3SVcsMEJBQTBCLENBQUMsSUFBTyxFQUFFLElBQVk7UUFDeEQsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxnQ0FBZ0MsRUFBRSxDQUFDO1NBQzlDO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDaEcsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDRCxHQUFHLENBQUMsSUFBTztRQUNULE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUNELElBQUksSUFBSTtR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RjtBQWhKRCxrREFnSkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnLi4vZXhjZXB0aW9uJztcblxuZXhwb3J0IGNsYXNzIERlcGVuZGVuY3lOb3RGb3VuZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoJ09uZSBvZiB0aGUgZGVwZW5kZW5jaWVzIGlzIG5vdCBwYXJ0IG9mIHRoZSBzZXQuJyk7IH1cbn1cbmV4cG9ydCBjbGFzcyBDaXJjdWxhckRlcGVuZGVuY3lGb3VuZEV4Y2VwdGlvbiBleHRlbmRzIEJhc2VFeGNlcHRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoJ0NpcmN1bGFyIGRlcGVuZGVuY2llcyBmb3VuZC4nKTsgfVxufVxuXG5leHBvcnQgY2xhc3MgUGFydGlhbGx5T3JkZXJlZFNldDxUPiBpbXBsZW1lbnRzIFNldDxUPiB7XG4gIHByaXZhdGUgX2l0ZW1zID0gbmV3IE1hcDxULCBTZXQ8VD4+KCk7XG5cbiAgcHJvdGVjdGVkIF9jaGVja0NpcmN1bGFyRGVwZW5kZW5jaWVzKGl0ZW06IFQsIGRlcHM6IFNldDxUPikge1xuICAgIGlmIChkZXBzLmhhcyhpdGVtKSkge1xuICAgICAgdGhyb3cgbmV3IENpcmN1bGFyRGVwZW5kZW5jeUZvdW5kRXhjZXB0aW9uKCk7XG4gICAgfVxuXG4gICAgZGVwcy5mb3JFYWNoKGRlcCA9PiB0aGlzLl9jaGVja0NpcmN1bGFyRGVwZW5kZW5jaWVzKGl0ZW0sIHRoaXMuX2l0ZW1zLmdldChkZXApIHx8IG5ldyBTZXQoKSkpO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5faXRlbXMuY2xlYXIoKTtcbiAgfVxuICBoYXMoaXRlbTogVCkge1xuICAgIHJldHVybiB0aGlzLl9pdGVtcy5oYXMoaXRlbSk7XG4gIH1cbiAgZ2V0IHNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2l0ZW1zLnNpemU7XG4gIH1cbiAgZm9yRWFjaChcbiAgICBjYWxsYmFja2ZuOiAodmFsdWU6IFQsIHZhbHVlMjogVCwgc2V0OiBQYXJ0aWFsbHlPcmRlcmVkU2V0PFQ+KSA9PiB2b2lkLFxuICAgIHRoaXNBcmc/OiBhbnksICAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWFueVxuICApOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHggb2YgdGhpcykge1xuICAgICAgY2FsbGJhY2tmbi5jYWxsKHRoaXNBcmcsIHgsIHgsIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGl0ZXJhYmxlIG9mIFt2LHZdIHBhaXJzIGZvciBldmVyeSB2YWx1ZSBgdmAgaW4gdGhlIHNldC5cbiAgICovXG4gICplbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W1QsIFRdPiB7XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHRoaXMpIHtcbiAgICAgIHlpZWxkIFtpdGVtLCBpdGVtXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzcGl0ZSBpdHMgbmFtZSwgcmV0dXJucyBhbiBpdGVyYWJsZSBvZiB0aGUgdmFsdWVzIGluIHRoZSBzZXQsXG4gICAqL1xuICBrZXlzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8VD4ge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gaXRlcmFibGUgb2YgdmFsdWVzIGluIHRoZSBzZXQuXG4gICAqL1xuICB2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxUPiB7XG4gICAgcmV0dXJuIHRoaXNbU3ltYm9sLml0ZXJhdG9yXSgpO1xuICB9XG5cblxuICBhZGQoaXRlbTogVCwgZGVwczogKFNldDxUPiB8IFRbXSkgPSBuZXcgU2V0KCkpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShkZXBzKSkge1xuICAgICAgZGVwcyA9IG5ldyBTZXQoZGVwcyk7XG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IGl0ZW0gaXMgbm90IGFscmVhZHkgaW4gdGhlIHNldC5cbiAgICBpZiAodGhpcy5faXRlbXMuaGFzKGl0ZW0pKSB7XG4gICAgICBjb25zdCBpdGVtRGVwcyA9IHRoaXMuX2l0ZW1zLmdldChpdGVtKSB8fCBuZXcgU2V0PFQ+KCk7XG5cbiAgICAgIC8vIElmIHRoZSBkZXBlbmRlbmN5IGxpc3QgaXMgZXF1YWwsIGp1c3QgcmV0dXJuLCBvdGhlcndpc2UgcmVtb3ZlIGFuZCBrZWVwIGdvaW5nLlxuICAgICAgbGV0IGVxdWFsID0gdHJ1ZTtcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcbiAgICAgICAgaWYgKCFpdGVtRGVwcy5oYXMoZGVwKSkge1xuICAgICAgICAgIGVxdWFsID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChlcXVhbCkge1xuICAgICAgICBmb3IgKGNvbnN0IGRlcCBvZiBpdGVtRGVwcykge1xuICAgICAgICAgIGlmICghZGVwcy5oYXMoZGVwKSkge1xuICAgICAgICAgICAgZXF1YWwgPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZXF1YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9pdGVtcy5kZWxldGUoaXRlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IGFsbCBkZXBlbmRlbmNpZXMgYXJlIHBhcnQgb2YgdGhlIFNldC5cbiAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSB7XG4gICAgICBpZiAoIXRoaXMuX2l0ZW1zLmhhcyhkZXApKSB7XG4gICAgICAgIHRocm93IG5ldyBEZXBlbmRlbmN5Tm90Rm91bmRFeGNlcHRpb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBWZXJpZnkgdGhlcmUncyBubyBkZXBlbmRlbmN5IGN5Y2xlLlxuICAgIHRoaXMuX2NoZWNrQ2lyY3VsYXJEZXBlbmRlbmNpZXMoaXRlbSwgZGVwcyk7XG5cbiAgICB0aGlzLl9pdGVtcy5zZXQoaXRlbSwgbmV3IFNldChkZXBzKSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRlbGV0ZShpdGVtOiBUKSB7XG4gICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMoaXRlbSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgaXQgZnJvbSBhbGwgZGVwZW5kZW5jaWVzIGlmIGZvcmNlID09IHRydWUuXG4gICAgdGhpcy5faXRlbXMuZm9yRWFjaCh2YWx1ZSA9PiB2YWx1ZS5kZWxldGUoaXRlbSkpO1xuXG4gICAgcmV0dXJuIHRoaXMuX2l0ZW1zLmRlbGV0ZShpdGVtKTtcbiAgfVxuXG4gICpbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICBjb25zdCBjb3B5OiBNYXA8VCwgU2V0PFQ+PiA9IG5ldyBNYXAodGhpcy5faXRlbXMpO1xuXG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgY29weS5lbnRyaWVzKCkpIHtcbiAgICAgIGNvcHkuc2V0KGtleSwgbmV3IFNldCh2YWx1ZSkpO1xuICAgIH1cblxuICAgIHdoaWxlIChjb3B5LnNpemUgPiAwKSB7XG4gICAgICBjb25zdCBydW4gPSBbXTtcbiAgICAgIC8vIFRha2UgdGhlIGZpcnN0IGl0ZW0gd2l0aG91dCBkZXBlbmRlbmNpZXMuXG4gICAgICBmb3IgKGNvbnN0IFtpdGVtLCBkZXBzXSBvZiBjb3B5LmVudHJpZXMoKSkge1xuICAgICAgICBpZiAoZGVwcy5zaXplID09IDApIHtcbiAgICAgICAgICBydW4ucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcnVuKSB7XG4gICAgICAgIGNvcHkuZm9yRWFjaChzID0+IHMuZGVsZXRlKGl0ZW0pKTtcbiAgICAgICAgY29weS5kZWxldGUoaXRlbSk7XG4gICAgICAgIHlpZWxkIGl0ZW07XG4gICAgICB9XG5cbiAgICAgIGlmIChydW4ubGVuZ3RoID09IDApIHtcbiAgICAgICAgLy8gdWggb2guLi5cbiAgICAgICAgdGhyb3cgbmV3IENpcmN1bGFyRGVwZW5kZW5jeUZvdW5kRXhjZXB0aW9uKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IFtTeW1ib2wudG9TdHJpbmdUYWddKCk6ICdTZXQnIHtcbiAgICByZXR1cm4gJ1NldCc7XG4gIH1cbn1cbiJdfQ==