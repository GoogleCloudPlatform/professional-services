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
/**
 * Polyfill for [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers), as
 * specified in the [Fetch Spec](https://fetch.spec.whatwg.org/#headers-class).
 *
 * The only known difference between this `Headers` implementation and the spec is the
 * lack of an `entries` method.
 *
 * \@usageNotes
 * ### Example
 *
 * ```
 * import {Headers} from '\@angular/http';
 *
 * var firstHeaders = new Headers();
 * firstHeaders.append('Content-Type', 'image/jpeg');
 * console.log(firstHeaders.get('Content-Type')) //'image/jpeg'
 *
 * // Create headers from Plain Old JavaScript Object
 * var secondHeaders = new Headers({
 *   'X-My-Custom-Header': 'Angular'
 * });
 * console.log(secondHeaders.get('X-My-Custom-Header')); //'Angular'
 *
 * var thirdHeaders = new Headers(secondHeaders);
 * console.log(thirdHeaders.get('X-My-Custom-Header')); //'Angular'
 * ```
 *
 * @deprecated see https://angular.io/guide/http
 * \@publicApi
 */
export class Headers {
    /**
     * @param {?=} headers
     */
    constructor(headers) {
        /**
         * \@internal header names are lower case
         */
        this._headers = new Map();
        /**
         * \@internal map lower case names to actual names
         */
        this._normalizedNames = new Map();
        if (!headers) {
            return;
        }
        if (headers instanceof Headers) {
            headers.forEach((values, name) => {
                values.forEach(value => this.append(name, value));
            });
            return;
        }
        Object.keys(headers).forEach((name) => {
            /** @type {?} */
            const values = Array.isArray(headers[name]) ? headers[name] : [headers[name]];
            this.delete(name);
            values.forEach(value => this.append(name, value));
        });
    }
    /**
     * Returns a new Headers instance from the given DOMString of Response Headers
     * @param {?} headersString
     * @return {?}
     */
    static fromResponseHeaderString(headersString) {
        /** @type {?} */
        const headers = new Headers();
        headersString.split('\n').forEach(line => {
            /** @type {?} */
            const index = line.indexOf(':');
            if (index > 0) {
                /** @type {?} */
                const name = line.slice(0, index);
                /** @type {?} */
                const value = line.slice(index + 1).trim();
                headers.set(name, value);
            }
        });
        return headers;
    }
    /**
     * Appends a header to existing list of header values for a given header name.
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    append(name, value) {
        /** @type {?} */
        const values = this.getAll(name);
        if (values === null) {
            this.set(name, value);
        }
        else {
            values.push(value);
        }
    }
    /**
     * Deletes all header values for the given name.
     * @param {?} name
     * @return {?}
     */
    delete(name) {
        /** @type {?} */
        const lcName = name.toLowerCase();
        this._normalizedNames.delete(lcName);
        this._headers.delete(lcName);
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEach(fn) {
        this._headers.forEach((values, lcName) => fn(values, this._normalizedNames.get(lcName), this._headers));
    }
    /**
     * Returns first header that matches given name.
     * @param {?} name
     * @return {?}
     */
    get(name) {
        /** @type {?} */
        const values = this.getAll(name);
        if (values === null) {
            return null;
        }
        return values.length > 0 ? values[0] : null;
    }
    /**
     * Checks for existence of header by given name.
     * @param {?} name
     * @return {?}
     */
    has(name) { return this._headers.has(name.toLowerCase()); }
    /**
     * Returns the names of the headers
     * @return {?}
     */
    keys() { return Array.from(this._normalizedNames.values()); }
    /**
     * Sets or overrides header value for given name.
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    set(name, value) {
        if (Array.isArray(value)) {
            if (value.length) {
                this._headers.set(name.toLowerCase(), [value.join(',')]);
            }
        }
        else {
            this._headers.set(name.toLowerCase(), [value]);
        }
        this.mayBeSetNormalizedName(name);
    }
    /**
     * Returns values of all headers.
     * @return {?}
     */
    values() { return Array.from(this._headers.values()); }
    /**
     * Returns string of all headers.
     * @return {?}
     */
    toJSON() {
        /** @type {?} */
        const serialized = {};
        this._headers.forEach((values, name) => {
            /** @type {?} */
            const split = [];
            values.forEach(v => split.push(...v.split(',')));
            serialized[/** @type {?} */ ((this._normalizedNames.get(name)))] = split;
        });
        return serialized;
    }
    /**
     * Returns list of header values for a given name.
     * @param {?} name
     * @return {?}
     */
    getAll(name) {
        return this.has(name) ? this._headers.get(name.toLowerCase()) || null : null;
    }
    /**
     * This method is not implemented.
     * @return {?}
     */
    entries() { throw new Error('"entries" method is not implemented on Headers class'); }
    /**
     * @param {?} name
     * @return {?}
     */
    mayBeSetNormalizedName(name) {
        /** @type {?} */
        const lcName = name.toLowerCase();
        if (!this._normalizedNames.has(lcName)) {
            this._normalizedNames.set(lcName, name);
        }
    }
}
if (false) {
    /**
     * \@internal header names are lower case
     * @type {?}
     */
    Headers.prototype._headers;
    /**
     * \@internal map lower case names to actual names
     * @type {?}
     */
    Headers.prototype._normalizedNames;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhZGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2h0dHAvc3JjL2hlYWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQ0EsTUFBTSxPQUFPLE9BQU87Ozs7SUFPbEIsWUFBWSxPQUE0Qzs7OztRQUx4RCxnQkFBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQzs7OztRQUU1Qyx3QkFBd0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUloRCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osT0FBTztTQUNSO1FBRUQsSUFBSSxPQUFPLFlBQVksT0FBTyxFQUFFO1lBQzlCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFnQixFQUFFLElBQVksRUFBRSxFQUFFO2dCQUNqRCxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUNuRCxDQUFDLENBQUM7WUFDSCxPQUFPO1NBQ1I7UUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxFQUFFOztZQUM1QyxNQUFNLE1BQU0sR0FBYSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FB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QUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVsQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN0QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6Qzs7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBQb2x5ZmlsbCBmb3IgW0hlYWRlcnNdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IZWFkZXJzL0hlYWRlcnMpLCBhc1xuICogc3BlY2lmaWVkIGluIHRoZSBbRmV0Y2ggU3BlY10oaHR0cHM6Ly9mZXRjaC5zcGVjLndoYXR3Zy5vcmcvI2hlYWRlcnMtY2xhc3MpLlxuICpcbiAqIFRoZSBvbmx5IGtub3duIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGlzIGBIZWFkZXJzYCBpbXBsZW1lbnRhdGlvbiBhbmQgdGhlIHNwZWMgaXMgdGhlXG4gKiBsYWNrIG9mIGFuIGBlbnRyaWVzYCBtZXRob2QuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0hlYWRlcnN9IGZyb20gJ0Bhbmd1bGFyL2h0dHAnO1xuICpcbiAqIHZhciBmaXJzdEhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICogZmlyc3RIZWFkZXJzLmFwcGVuZCgnQ29udGVudC1UeXBlJywgJ2ltYWdlL2pwZWcnKTtcbiAqIGNvbnNvbGUubG9nKGZpcnN0SGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpKSAvLydpbWFnZS9qcGVnJ1xuICpcbiAqIC8vIENyZWF0ZSBoZWFkZXJzIGZyb20gUGxhaW4gT2xkIEphdmFTY3JpcHQgT2JqZWN0XG4gKiB2YXIgc2Vjb25kSGVhZGVycyA9IG5ldyBIZWFkZXJzKHtcbiAqICAgJ1gtTXktQ3VzdG9tLUhlYWRlcic6ICdBbmd1bGFyJ1xuICogfSk7XG4gKiBjb25zb2xlLmxvZyhzZWNvbmRIZWFkZXJzLmdldCgnWC1NeS1DdXN0b20tSGVhZGVyJykpOyAvLydBbmd1bGFyJ1xuICpcbiAqIHZhciB0aGlyZEhlYWRlcnMgPSBuZXcgSGVhZGVycyhzZWNvbmRIZWFkZXJzKTtcbiAqIGNvbnNvbGUubG9nKHRoaXJkSGVhZGVycy5nZXQoJ1gtTXktQ3VzdG9tLUhlYWRlcicpKTsgLy8nQW5ndWxhcidcbiAqIGBgYFxuICpcbiAqIEBkZXByZWNhdGVkIHNlZSBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHR0cFxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSGVhZGVycyB7XG4gIC8qKiBAaW50ZXJuYWwgaGVhZGVyIG5hbWVzIGFyZSBsb3dlciBjYXNlICovXG4gIF9oZWFkZXJzOiBNYXA8c3RyaW5nLCBzdHJpbmdbXT4gPSBuZXcgTWFwKCk7XG4gIC8qKiBAaW50ZXJuYWwgbWFwIGxvd2VyIGNhc2UgbmFtZXMgdG8gYWN0dWFsIG5hbWVzICovXG4gIF9ub3JtYWxpemVkTmFtZXM6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG5cbiAgLy8gVE9ETyh2aWNiKTogYW55IC0+IHN0cmluZ3xzdHJpbmdbXVxuICBjb25zdHJ1Y3RvcihoZWFkZXJzPzogSGVhZGVyc3x7W25hbWU6IHN0cmluZ106IGFueX18bnVsbCkge1xuICAgIGlmICghaGVhZGVycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKCh2YWx1ZXM6IHN0cmluZ1tdLCBuYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4gdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIE9iamVjdC5rZXlzKGhlYWRlcnMpLmZvckVhY2goKG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgdmFsdWVzOiBzdHJpbmdbXSA9IEFycmF5LmlzQXJyYXkoaGVhZGVyc1tuYW1lXSkgPyBoZWFkZXJzW25hbWVdIDogW2hlYWRlcnNbbmFtZV1dO1xuICAgICAgdGhpcy5kZWxldGUobmFtZSk7XG4gICAgICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSkpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgSGVhZGVycyBpbnN0YW5jZSBmcm9tIHRoZSBnaXZlbiBET01TdHJpbmcgb2YgUmVzcG9uc2UgSGVhZGVyc1xuICAgKi9cbiAgc3RhdGljIGZyb21SZXNwb25zZUhlYWRlclN0cmluZyhoZWFkZXJzU3RyaW5nOiBzdHJpbmcpOiBIZWFkZXJzIHtcbiAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcblxuICAgIGhlYWRlcnNTdHJpbmcuc3BsaXQoJ1xcbicpLmZvckVhY2gobGluZSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IGxpbmUuaW5kZXhPZignOicpO1xuICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICBjb25zdCBuYW1lID0gbGluZS5zbGljZSgwLCBpbmRleCk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gbGluZS5zbGljZShpbmRleCArIDEpLnRyaW0oKTtcbiAgICAgICAgaGVhZGVycy5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cblxuICAvKipcbiAgICogQXBwZW5kcyBhIGhlYWRlciB0byBleGlzdGluZyBsaXN0IG9mIGhlYWRlciB2YWx1ZXMgZm9yIGEgZ2l2ZW4gaGVhZGVyIG5hbWUuXG4gICAqL1xuICBhcHBlbmQobmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgdmFsdWVzID0gdGhpcy5nZXRBbGwobmFtZSk7XG5cbiAgICBpZiAodmFsdWVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhbGwgaGVhZGVyIHZhbHVlcyBmb3IgdGhlIGdpdmVuIG5hbWUuXG4gICAqL1xuICBkZWxldGUgKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGxjTmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB0aGlzLl9ub3JtYWxpemVkTmFtZXMuZGVsZXRlKGxjTmFtZSk7XG4gICAgdGhpcy5faGVhZGVycy5kZWxldGUobGNOYW1lKTtcbiAgfVxuXG4gIGZvckVhY2goZm46ICh2YWx1ZXM6IHN0cmluZ1tdLCBuYW1lOiBzdHJpbmd8dW5kZWZpbmVkLCBoZWFkZXJzOiBNYXA8c3RyaW5nLCBzdHJpbmdbXT4pID0+IHZvaWQpOlxuICAgICAgdm9pZCB7XG4gICAgdGhpcy5faGVhZGVycy5mb3JFYWNoKFxuICAgICAgICAodmFsdWVzLCBsY05hbWUpID0+IGZuKHZhbHVlcywgdGhpcy5fbm9ybWFsaXplZE5hbWVzLmdldChsY05hbWUpLCB0aGlzLl9oZWFkZXJzKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBmaXJzdCBoZWFkZXIgdGhhdCBtYXRjaGVzIGdpdmVuIG5hbWUuXG4gICAqL1xuICBnZXQobmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuZ2V0QWxsKG5hbWUpO1xuXG4gICAgaWYgKHZhbHVlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPiAwID8gdmFsdWVzWzBdIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgZm9yIGV4aXN0ZW5jZSBvZiBoZWFkZXIgYnkgZ2l2ZW4gbmFtZS5cbiAgICovXG4gIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2hlYWRlcnMuaGFzKG5hbWUudG9Mb3dlckNhc2UoKSk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbmFtZXMgb2YgdGhlIGhlYWRlcnNcbiAgICovXG4gIGtleXMoKTogc3RyaW5nW10geyByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9ub3JtYWxpemVkTmFtZXMudmFsdWVzKCkpOyB9XG5cbiAgLyoqXG4gICAqIFNldHMgb3Igb3ZlcnJpZGVzIGhlYWRlciB2YWx1ZSBmb3IgZ2l2ZW4gbmFtZS5cbiAgICovXG4gIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8c3RyaW5nW10pOiB2b2lkIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGlmICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5faGVhZGVycy5zZXQobmFtZS50b0xvd2VyQ2FzZSgpLCBbdmFsdWUuam9pbignLCcpXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2hlYWRlcnMuc2V0KG5hbWUudG9Mb3dlckNhc2UoKSwgW3ZhbHVlXSk7XG4gICAgfVxuICAgIHRoaXMubWF5QmVTZXROb3JtYWxpemVkTmFtZShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHZhbHVlcyBvZiBhbGwgaGVhZGVycy5cbiAgICovXG4gIHZhbHVlcygpOiBzdHJpbmdbXVtdIHsgcmV0dXJuIEFycmF5LmZyb20odGhpcy5faGVhZGVycy52YWx1ZXMoKSk7IH1cblxuICAvKipcbiAgICogUmV0dXJucyBzdHJpbmcgb2YgYWxsIGhlYWRlcnMuXG4gICAqL1xuICAvLyBUT0RPKHZpY2IpOiByZXR1cm5zIHtbbmFtZTogc3RyaW5nXTogc3RyaW5nW119XG4gIHRvSlNPTigpOiB7W25hbWU6IHN0cmluZ106IGFueX0ge1xuICAgIGNvbnN0IHNlcmlhbGl6ZWQ6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nW119ID0ge307XG5cbiAgICB0aGlzLl9oZWFkZXJzLmZvckVhY2goKHZhbHVlczogc3RyaW5nW10sIG5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3Qgc3BsaXQ6IHN0cmluZ1tdID0gW107XG4gICAgICB2YWx1ZXMuZm9yRWFjaCh2ID0+IHNwbGl0LnB1c2goLi4udi5zcGxpdCgnLCcpKSk7XG4gICAgICBzZXJpYWxpemVkW3RoaXMuX25vcm1hbGl6ZWROYW1lcy5nZXQobmFtZSkgIV0gPSBzcGxpdDtcbiAgICB9KTtcblxuICAgIHJldHVybiBzZXJpYWxpemVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgbGlzdCBvZiBoZWFkZXIgdmFsdWVzIGZvciBhIGdpdmVuIG5hbWUuXG4gICAqL1xuICBnZXRBbGwobmFtZTogc3RyaW5nKTogc3RyaW5nW118bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuaGFzKG5hbWUpID8gdGhpcy5faGVhZGVycy5nZXQobmFtZS50b0xvd2VyQ2FzZSgpKSB8fCBudWxsIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyBub3QgaW1wbGVtZW50ZWQuXG4gICAqL1xuICBlbnRyaWVzKCkgeyB0aHJvdyBuZXcgRXJyb3IoJ1wiZW50cmllc1wiIG1ldGhvZCBpcyBub3QgaW1wbGVtZW50ZWQgb24gSGVhZGVycyBjbGFzcycpOyB9XG5cbiAgcHJpdmF0ZSBtYXlCZVNldE5vcm1hbGl6ZWROYW1lKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGxjTmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgIGlmICghdGhpcy5fbm9ybWFsaXplZE5hbWVzLmhhcyhsY05hbWUpKSB7XG4gICAgICB0aGlzLl9ub3JtYWxpemVkTmFtZXMuc2V0KGxjTmFtZSwgbmFtZSk7XG4gICAgfVxuICB9XG59XG4iXX0=