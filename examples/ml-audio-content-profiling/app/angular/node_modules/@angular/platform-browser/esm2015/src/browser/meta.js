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
import { Inject, Injectable, inject } from '@angular/core';
import { getDOM } from '../dom/dom_adapter';
import { DOCUMENT } from '../dom/dom_tokens';
import * as i0 from "@angular/core";
/** @typedef {?} */
var MetaDefinition;
export { MetaDefinition };
/**
 * Factory to create Meta service.
 * @return {?}
 */
export function createMeta() {
    return new Meta(inject(DOCUMENT));
}
/**
 * A service that can be used to get and add meta tags.
 *
 * \@publicApi
 */
export class Meta {
    /**
     * @param {?} _doc
     */
    constructor(_doc) {
        this._doc = _doc;
        this._dom = getDOM();
    }
    /**
     * @param {?} tag
     * @param {?=} forceCreation
     * @return {?}
     */
    addTag(tag, forceCreation = false) {
        if (!tag)
            return null;
        return this._getOrCreateElement(tag, forceCreation);
    }
    /**
     * @param {?} tags
     * @param {?=} forceCreation
     * @return {?}
     */
    addTags(tags, forceCreation = false) {
        if (!tags)
            return [];
        return tags.reduce((result, tag) => {
            if (tag) {
                result.push(this._getOrCreateElement(tag, forceCreation));
            }
            return result;
        }, []);
    }
    /**
     * @param {?} attrSelector
     * @return {?}
     */
    getTag(attrSelector) {
        if (!attrSelector)
            return null;
        return this._dom.querySelector(this._doc, `meta[${attrSelector}]`) || null;
    }
    /**
     * @param {?} attrSelector
     * @return {?}
     */
    getTags(attrSelector) {
        if (!attrSelector)
            return [];
        /** @type {?} */
        const list = this._dom.querySelectorAll(this._doc, `meta[${attrSelector}]`);
        return list ? [].slice.call(list) : [];
    }
    /**
     * @param {?} tag
     * @param {?=} selector
     * @return {?}
     */
    updateTag(tag, selector) {
        if (!tag)
            return null;
        selector = selector || this._parseSelector(tag);
        /** @type {?} */
        const meta = /** @type {?} */ ((this.getTag(selector)));
        if (meta) {
            return this._setMetaElementAttributes(tag, meta);
        }
        return this._getOrCreateElement(tag, true);
    }
    /**
     * @param {?} attrSelector
     * @return {?}
     */
    removeTag(attrSelector) { this.removeTagElement(/** @type {?} */ ((this.getTag(attrSelector)))); }
    /**
     * @param {?} meta
     * @return {?}
     */
    removeTagElement(meta) {
        if (meta) {
            this._dom.remove(meta);
        }
    }
    /**
     * @param {?} meta
     * @param {?=} forceCreation
     * @return {?}
     */
    _getOrCreateElement(meta, forceCreation = false) {
        if (!forceCreation) {
            /** @type {?} */
            const selector = this._parseSelector(meta);
            /** @type {?} */
            const elem = /** @type {?} */ ((this.getTag(selector)));
            // It's allowed to have multiple elements with the same name so it's not enough to
            // just check that element with the same name already present on the page. We also need to
            // check if element has tag attributes
            if (elem && this._containsAttributes(meta, elem))
                return elem;
        }
        /** @type {?} */
        const element = /** @type {?} */ (this._dom.createElement('meta'));
        this._setMetaElementAttributes(meta, element);
        /** @type {?} */
        const head = this._dom.getElementsByTagName(this._doc, 'head')[0];
        this._dom.appendChild(head, element);
        return element;
    }
    /**
     * @param {?} tag
     * @param {?} el
     * @return {?}
     */
    _setMetaElementAttributes(tag, el) {
        Object.keys(tag).forEach((prop) => this._dom.setAttribute(el, prop, tag[prop]));
        return el;
    }
    /**
     * @param {?} tag
     * @return {?}
     */
    _parseSelector(tag) {
        /** @type {?} */
        const attr = tag.name ? 'name' : 'property';
        return `${attr}="${tag[attr]}"`;
    }
    /**
     * @param {?} tag
     * @param {?} elem
     * @return {?}
     */
    _containsAttributes(tag, elem) {
        return Object.keys(tag).every((key) => this._dom.getAttribute(elem, key) === tag[key]);
    }
}
Meta.decorators = [
    { type: Injectable, args: [{ providedIn: 'root', useFactory: createMeta, deps: [] },] }
];
/** @nocollapse */
Meta.ctorParameters = () => [
    { type: undefined, decorators: [{ type: Inject, args: [DOCUMENT,] }] }
];
/** @nocollapse */ Meta.ngInjectableDef = i0.defineInjectable({ factory: createMeta, token: Meta, providedIn: "root" });
if (false) {
    /** @type {?} */
    Meta.prototype._dom;
    /** @type {?} */
    Meta.prototype._doc;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3BsYXRmb3JtLWJyb3dzZXIvc3JjL2Jyb3dzZXIvbWV0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV6RCxPQUFPLEVBQWEsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7QUF3QjNDLE1BQU0sVUFBVSxVQUFVO0lBQ3hCLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Q0FDbkM7Ozs7OztBQVFELE1BQU0sT0FBTyxJQUFJOzs7O0lBRWYsWUFBc0MsSUFBUztRQUFULFNBQUksR0FBSixJQUFJLENBQUs7UUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFDO0tBQUU7Ozs7OztJQUUxRSxNQUFNLENBQUMsR0FBbUIsRUFBRSxnQkFBeUIsS0FBSztRQUN4RCxJQUFJLENBQUMsR0FBRztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNyRDs7Ozs7O0lBRUQsT0FBTyxDQUFDLElBQXNCLEVBQUUsZ0JBQXlCLEtBQUs7UUFDNUQsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUNyQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUF5QixFQUFFLEdBQW1CLEVBQUUsRUFBRTtZQUNwRSxJQUFJLEdBQUcsRUFBRTtnQkFDUCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENB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SSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEYsT0FBTyxFQUFFLENBQUM7Ozs7OztJQUdKLGNBQWMsQ0FBQyxHQUFtQjs7UUFDeEMsTUFBTSxJQUFJLEdBQVcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7UUFDcEQsT0FBTyxHQUFHLElBQUksS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQzs7Ozs7OztJQUcxQixtQkFBbUIsQ0FBQyxHQUFtQixFQUFFLElBQXFCO1FBQ3BFLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7OztZQTdFbEcsVUFBVSxTQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7Ozs7NENBR25ELE1BQU0sU0FBQyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgaW5qZWN0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtEb21BZGFwdGVyLCBnZXRET019IGZyb20gJy4uL2RvbS9kb21fYWRhcHRlcic7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICcuLi9kb20vZG9tX3Rva2Vucyc7XG5cblxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBtZXRhIGVsZW1lbnQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBNZXRhRGVmaW5pdGlvbiA9IHtcbiAgY2hhcnNldD86IHN0cmluZzsgY29udGVudD86IHN0cmluZzsgaHR0cEVxdWl2Pzogc3RyaW5nOyBpZD86IHN0cmluZzsgaXRlbXByb3A/OiBzdHJpbmc7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIHByb3BlcnR5Pzogc3RyaW5nO1xuICBzY2hlbWU/OiBzdHJpbmc7XG4gIHVybD86IHN0cmluZztcbn0gJlxue1xuICAvLyBUT0RPKElnb3JNaW5hcik6IHRoaXMgdHlwZSBsb29rcyB3cm9uZ1xuICBbcHJvcDogc3RyaW5nXTogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBGYWN0b3J5IHRvIGNyZWF0ZSBNZXRhIHNlcnZpY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNZXRhKCkge1xuICByZXR1cm4gbmV3IE1ldGEoaW5qZWN0KERPQ1VNRU5UKSk7XG59XG5cbi8qKlxuICogQSBzZXJ2aWNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2V0IGFuZCBhZGQgbWV0YSB0YWdzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290JywgdXNlRmFjdG9yeTogY3JlYXRlTWV0YSwgZGVwczogW119KVxuZXhwb3J0IGNsYXNzIE1ldGEge1xuICBwcml2YXRlIF9kb206IERvbUFkYXB0ZXI7XG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoRE9DVU1FTlQpIHByaXZhdGUgX2RvYzogYW55KSB7IHRoaXMuX2RvbSA9IGdldERPTSgpOyB9XG5cbiAgYWRkVGFnKHRhZzogTWV0YURlZmluaXRpb24sIGZvcmNlQ3JlYXRpb246IGJvb2xlYW4gPSBmYWxzZSk6IEhUTUxNZXRhRWxlbWVudHxudWxsIHtcbiAgICBpZiAoIXRhZykgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHRoaXMuX2dldE9yQ3JlYXRlRWxlbWVudCh0YWcsIGZvcmNlQ3JlYXRpb24pO1xuICB9XG5cbiAgYWRkVGFncyh0YWdzOiBNZXRhRGVmaW5pdGlvbltdLCBmb3JjZUNyZWF0aW9uOiBib29sZWFuID0gZmFsc2UpOiBIVE1MTWV0YUVsZW1lbnRbXSB7XG4gICAgaWYgKCF0YWdzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHRhZ3MucmVkdWNlKChyZXN1bHQ6IEhUTUxNZXRhRWxlbWVudFtdLCB0YWc6IE1ldGFEZWZpbml0aW9uKSA9PiB7XG4gICAgICBpZiAodGFnKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHRoaXMuX2dldE9yQ3JlYXRlRWxlbWVudCh0YWcsIGZvcmNlQ3JlYXRpb24pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgW10pO1xuICB9XG5cbiAgZ2V0VGFnKGF0dHJTZWxlY3Rvcjogc3RyaW5nKTogSFRNTE1ldGFFbGVtZW50fG51bGwge1xuICAgIGlmICghYXR0clNlbGVjdG9yKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gdGhpcy5fZG9tLnF1ZXJ5U2VsZWN0b3IodGhpcy5fZG9jLCBgbWV0YVske2F0dHJTZWxlY3Rvcn1dYCkgfHwgbnVsbDtcbiAgfVxuXG4gIGdldFRhZ3MoYXR0clNlbGVjdG9yOiBzdHJpbmcpOiBIVE1MTWV0YUVsZW1lbnRbXSB7XG4gICAgaWYgKCFhdHRyU2VsZWN0b3IpIHJldHVybiBbXTtcbiAgICBjb25zdCBsaXN0IC8qTm9kZUxpc3QqLyA9IHRoaXMuX2RvbS5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuX2RvYywgYG1ldGFbJHthdHRyU2VsZWN0b3J9XWApO1xuICAgIHJldHVybiBsaXN0ID8gW10uc2xpY2UuY2FsbChsaXN0KSA6IFtdO1xuICB9XG5cbiAgdXBkYXRlVGFnKHRhZzogTWV0YURlZmluaXRpb24sIHNlbGVjdG9yPzogc3RyaW5nKTogSFRNTE1ldGFFbGVtZW50fG51bGwge1xuICAgIGlmICghdGFnKSByZXR1cm4gbnVsbDtcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IHRoaXMuX3BhcnNlU2VsZWN0b3IodGFnKTtcbiAgICBjb25zdCBtZXRhOiBIVE1MTWV0YUVsZW1lbnQgPSB0aGlzLmdldFRhZyhzZWxlY3RvcikgITtcbiAgICBpZiAobWV0YSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NldE1ldGFFbGVtZW50QXR0cmlidXRlcyh0YWcsIG1ldGEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZ2V0T3JDcmVhdGVFbGVtZW50KHRhZywgdHJ1ZSk7XG4gIH1cblxuICByZW1vdmVUYWcoYXR0clNlbGVjdG9yOiBzdHJpbmcpOiB2b2lkIHsgdGhpcy5yZW1vdmVUYWdFbGVtZW50KHRoaXMuZ2V0VGFnKGF0dHJTZWxlY3RvcikgISk7IH1cblxuICByZW1vdmVUYWdFbGVtZW50KG1ldGE6IEhUTUxNZXRhRWxlbWVudCk6IHZvaWQge1xuICAgIGlmIChtZXRhKSB7XG4gICAgICB0aGlzLl9kb20ucmVtb3ZlKG1ldGEpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldE9yQ3JlYXRlRWxlbWVudChtZXRhOiBNZXRhRGVmaW5pdGlvbiwgZm9yY2VDcmVhdGlvbjogYm9vbGVhbiA9IGZhbHNlKTpcbiAgICAgIEhUTUxNZXRhRWxlbWVudCB7XG4gICAgaWYgKCFmb3JjZUNyZWF0aW9uKSB7XG4gICAgICBjb25zdCBzZWxlY3Rvcjogc3RyaW5nID0gdGhpcy5fcGFyc2VTZWxlY3RvcihtZXRhKTtcbiAgICAgIGNvbnN0IGVsZW06IEhUTUxNZXRhRWxlbWVudCA9IHRoaXMuZ2V0VGFnKHNlbGVjdG9yKSAhO1xuICAgICAgLy8gSXQncyBhbGxvd2VkIHRvIGhhdmUgbXVsdGlwbGUgZWxlbWVudHMgd2l0aCB0aGUgc2FtZSBuYW1lIHNvIGl0J3Mgbm90IGVub3VnaCB0b1xuICAgICAgLy8ganVzdCBjaGVjayB0aGF0IGVsZW1lbnQgd2l0aCB0aGUgc2FtZSBuYW1lIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgcGFnZS4gV2UgYWxzbyBuZWVkIHRvXG4gICAgICAvLyBjaGVjayBpZiBlbGVtZW50IGhhcyB0YWcgYXR0cmlidXRlc1xuICAgICAgaWYgKGVsZW0gJiYgdGhpcy5fY29udGFpbnNBdHRyaWJ1dGVzKG1ldGEsIGVsZW0pKSByZXR1cm4gZWxlbTtcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudDogSFRNTE1ldGFFbGVtZW50ID0gdGhpcy5fZG9tLmNyZWF0ZUVsZW1lbnQoJ21ldGEnKSBhcyBIVE1MTWV0YUVsZW1lbnQ7XG4gICAgdGhpcy5fc2V0TWV0YUVsZW1lbnRBdHRyaWJ1dGVzKG1ldGEsIGVsZW1lbnQpO1xuICAgIGNvbnN0IGhlYWQgPSB0aGlzLl9kb20uZ2V0RWxlbWVudHNCeVRhZ05hbWUodGhpcy5fZG9jLCAnaGVhZCcpWzBdO1xuICAgIHRoaXMuX2RvbS5hcHBlbmRDaGlsZChoZWFkLCBlbGVtZW50KTtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIHByaXZhdGUgX3NldE1ldGFFbGVtZW50QXR0cmlidXRlcyh0YWc6IE1ldGFEZWZpbml0aW9uLCBlbDogSFRNTE1ldGFFbGVtZW50KTogSFRNTE1ldGFFbGVtZW50IHtcbiAgICBPYmplY3Qua2V5cyh0YWcpLmZvckVhY2goKHByb3A6IHN0cmluZykgPT4gdGhpcy5fZG9tLnNldEF0dHJpYnV0ZShlbCwgcHJvcCwgdGFnW3Byb3BdKSk7XG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGFyc2VTZWxlY3Rvcih0YWc6IE1ldGFEZWZpbml0aW9uKTogc3RyaW5nIHtcbiAgICBjb25zdCBhdHRyOiBzdHJpbmcgPSB0YWcubmFtZSA/ICduYW1lJyA6ICdwcm9wZXJ0eSc7XG4gICAgcmV0dXJuIGAke2F0dHJ9PVwiJHt0YWdbYXR0cl19XCJgO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29udGFpbnNBdHRyaWJ1dGVzKHRhZzogTWV0YURlZmluaXRpb24sIGVsZW06IEhUTUxNZXRhRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0YWcpLmV2ZXJ5KChrZXk6IHN0cmluZykgPT4gdGhpcy5fZG9tLmdldEF0dHJpYnV0ZShlbGVtLCBrZXkpID09PSB0YWdba2V5XSk7XG4gIH1cbn1cbiJdfQ==