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
 * This helper class is used to get hold of an inert tree of DOM elements containing dirty HTML
 * that needs sanitizing.
 * Depending upon browser support we must use one of three strategies for doing this.
 * Support: Safari 10.x -> XHR strategy
 * Support: Firefox -> DomParser strategy
 * Default: InertDocument strategy
 */
export class InertBodyHelper {
    /**
     * @param {?} defaultDoc
     */
    constructor(defaultDoc) {
        this.defaultDoc = defaultDoc;
        this.inertDocument = this.defaultDoc.implementation.createHTMLDocument('sanitization-inert');
        this.inertBodyElement = this.inertDocument.body;
        if (this.inertBodyElement == null) {
            /** @type {?} */
            const inertHtml = this.inertDocument.createElement('html');
            this.inertDocument.appendChild(inertHtml);
            this.inertBodyElement = this.inertDocument.createElement('body');
            inertHtml.appendChild(this.inertBodyElement);
        }
        this.inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
        if (this.inertBodyElement.querySelector && !this.inertBodyElement.querySelector('svg')) {
            // We just hit the Safari 10.1 bug - which allows JS to run inside the SVG G element
            // so use the XHR strategy.
            this.getInertBodyElement = this.getInertBodyElement_XHR;
            return;
        }
        this.inertBodyElement.innerHTML =
            '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
        if (this.inertBodyElement.querySelector && this.inertBodyElement.querySelector('svg img')) {
            // We just hit the Firefox bug - which prevents the inner img JS from being sanitized
            // so use the DOMParser strategy, if it is available.
            // If the DOMParser is not available then we are not in Firefox (Server/WebWorker?) so we
            // fall through to the default strategy below.
            if (isDOMParserAvailable()) {
                this.getInertBodyElement = this.getInertBodyElement_DOMParser;
                return;
            }
        }
        // None of the bugs were hit so it is safe for us to use the default InertDocument strategy
        this.getInertBodyElement = this.getInertBodyElement_InertDocument;
    }
    /**
     * Use XHR to create and fill an inert body element (on Safari 10.1)
     * See
     * https://github.com/cure53/DOMPurify/blob/a992d3a75031cb8bb032e5ea8399ba972bdf9a65/src/purify.js#L439-L449
     * @param {?} html
     * @return {?}
     */
    getInertBodyElement_XHR(html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            html = encodeURI(html);
        }
        catch (e) {
            return null;
        }
        /** @type {?} */
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
        xhr.send(undefined);
        /** @type {?} */
        const body = xhr.response.body;
        body.removeChild(/** @type {?} */ ((body.firstChild)));
        return body;
    }
    /**
     * Use DOMParser to create and fill an inert body element (on Firefox)
     * See https://github.com/cure53/DOMPurify/releases/tag/0.6.7
     *
     * @param {?} html
     * @return {?}
     */
    getInertBodyElement_DOMParser(html) {
        // We add these extra elements to ensure that the rest of the content is parsed as expected
        // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the
        // `<head>` tag.
        html = '<body><remove></remove>' + html + '</body>';
        try {
            /** @type {?} */
            const body = /** @type {?} */ (new (/** @type {?} */ (window))
                .DOMParser()
                .parseFromString(html, 'text/html')
                .body);
            body.removeChild(/** @type {?} */ ((body.firstChild)));
            return body;
        }
        catch (e) {
            return null;
        }
    }
    /**
     * Use an HTML5 `template` element, if supported, or an inert body element created via
     * `createHtmlDocument` to create and fill an inert DOM element.
     * This is the default sane strategy to use if the browser does not require one of the specialised
     * strategies above.
     * @param {?} html
     * @return {?}
     */
    getInertBodyElement_InertDocument(html) {
        /** @type {?} */
        const templateEl = this.inertDocument.createElement('template');
        if ('content' in templateEl) {
            templateEl.innerHTML = html;
            return templateEl;
        }
        this.inertBodyElement.innerHTML = html;
        // Support: IE 9-11 only
        // strip custom-namespaced attributes on IE<=11
        if ((/** @type {?} */ (this.defaultDoc)).documentMode) {
            this.stripCustomNsAttrs(this.inertBodyElement);
        }
        return this.inertBodyElement;
    }
    /**
     * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1'
     * attribute to declare ns1 namespace and prefixes the attribute with 'ns1' (e.g.
     * 'ns1:xlink:foo').
     *
     * This is undesirable since we don't want to allow any of these custom attributes. This method
     * strips them all.
     * @param {?} el
     * @return {?}
     */
    stripCustomNsAttrs(el) {
        /** @type {?} */
        const elAttrs = el.attributes;
        // loop backwards so that we can support removals.
        for (let i = elAttrs.length - 1; 0 < i; i--) {
            /** @type {?} */
            const attrib = elAttrs.item(i);
            /** @type {?} */
            const attrName = /** @type {?} */ ((attrib)).name;
            if (attrName === 'xmlns:ns1' || attrName.indexOf('ns1:') === 0) {
                el.removeAttribute(attrName);
            }
        }
        /** @type {?} */
        let childNode = /** @type {?} */ (el.firstChild);
        while (childNode) {
            if (childNode.nodeType === Node.ELEMENT_NODE)
                this.stripCustomNsAttrs(/** @type {?} */ (childNode));
            childNode = childNode.nextSibling;
        }
    }
}
if (false) {
    /** @type {?} */
    InertBodyHelper.prototype.inertBodyElement;
    /** @type {?} */
    InertBodyHelper.prototype.inertDocument;
    /**
     * Get an inert DOM element containing DOM created from the dirty HTML string provided.
     * The implementation of this is determined in the constructor, when the class is instantiated.
     * @type {?}
     */
    InertBodyHelper.prototype.getInertBodyElement;
    /** @type {?} */
    InertBodyHelper.prototype.defaultDoc;
}
/**
 * We need to determine whether the DOMParser exists in the global context.
 * The try-catch is because, on some browsers, trying to access this property
 * on window can actually throw an error.
 *
 * @suppress {uselessCode}
 * @return {?}
 */
function isDOMParserAvailable() {
    try {
        return !!(/** @type {?} */ (window)).DOMParser;
    }
    catch (e) {
        return false;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5lcnRfYm9keS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3Nhbml0aXphdGlvbi9pbmVydF9ib2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsTUFBTSxPQUFPLGVBQWU7Ozs7SUFJMUIsWUFBb0IsVUFBb0I7UUFBcEIsZUFBVSxHQUFWLFVBQVUsQ0FBVTtRQUN0QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDN0YsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO1FBRWhELElBQUksSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUksRUFBRTs7WUFHakMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pFLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLHNEQUFzRCxDQUFDO1FBQ3pGLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7OztZQUd0RixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQ3hELE9BQU87U0FDUjtRQUVELElBQUks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QUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM5RCxFQUFFLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzlCO1NBQ0Y7O1FBQ0QsSUFBSSxTQUFTLHFCQUFHLEVBQUUsQ0FBQyxVQUF5QixFQUFDO1FBQzdDLE9BQU8sU0FBUyxFQUFFO1lBQ2hCLElBQUksU0FBUyxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWTtnQkFBRSxJQUFJLENBQUMsa0JBQWtCLG1CQUFDLFNBQW9CLEVBQUMsQ0FBQztZQUM1RixTQUFTLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUNuQzs7Q0FFSjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTRCxTQUFTLG9CQUFvQjtJQUMzQixJQUFJO1FBQ0YsT0FBTyxDQUFDLENBQUMsbUJBQUMsTUFBYSxFQUFDLENBQUMsU0FBUyxDQUFDO0tBQ3BDO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixPQUFPLEtBQUssQ0FBQztLQUNkO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogVGhpcyBoZWxwZXIgY2xhc3MgaXMgdXNlZCB0byBnZXQgaG9sZCBvZiBhbiBpbmVydCB0cmVlIG9mIERPTSBlbGVtZW50cyBjb250YWluaW5nIGRpcnR5IEhUTUxcbiAqIHRoYXQgbmVlZHMgc2FuaXRpemluZy5cbiAqIERlcGVuZGluZyB1cG9uIGJyb3dzZXIgc3VwcG9ydCB3ZSBtdXN0IHVzZSBvbmUgb2YgdGhyZWUgc3RyYXRlZ2llcyBmb3IgZG9pbmcgdGhpcy5cbiAqIFN1cHBvcnQ6IFNhZmFyaSAxMC54IC0+IFhIUiBzdHJhdGVneVxuICogU3VwcG9ydDogRmlyZWZveCAtPiBEb21QYXJzZXIgc3RyYXRlZ3lcbiAqIERlZmF1bHQ6IEluZXJ0RG9jdW1lbnQgc3RyYXRlZ3lcbiAqL1xuZXhwb3J0IGNsYXNzIEluZXJ0Qm9keUhlbHBlciB7XG4gIHByaXZhdGUgaW5lcnRCb2R5RWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgaW5lcnREb2N1bWVudDogRG9jdW1lbnQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBkZWZhdWx0RG9jOiBEb2N1bWVudCkge1xuICAgIHRoaXMuaW5lcnREb2N1bWVudCA9IHRoaXMuZGVmYXVsdERvYy5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoJ3Nhbml0aXphdGlvbi1pbmVydCcpO1xuICAgIHRoaXMuaW5lcnRCb2R5RWxlbWVudCA9IHRoaXMuaW5lcnREb2N1bWVudC5ib2R5O1xuXG4gICAgaWYgKHRoaXMuaW5lcnRCb2R5RWxlbWVudCA9PSBudWxsKSB7XG4gICAgICAvLyB1c3VhbGx5IHRoZXJlIHNob3VsZCBiZSBvbmx5IG9uZSBib2R5IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50LCBidXQgSUUgZG9lc24ndCBoYXZlIGFueSwgc29cbiAgICAgIC8vIHdlIG5lZWQgdG8gY3JlYXRlIG9uZS5cbiAgICAgIGNvbnN0IGluZXJ0SHRtbCA9IHRoaXMuaW5lcnREb2N1bWVudC5jcmVhdGVFbGVtZW50KCdodG1sJyk7XG4gICAgICB0aGlzLmluZXJ0RG9jdW1lbnQuYXBwZW5kQ2hpbGQoaW5lcnRIdG1sKTtcbiAgICAgIHRoaXMuaW5lcnRCb2R5RWxlbWVudCA9IHRoaXMuaW5lcnREb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XG4gICAgICBpbmVydEh0bWwuYXBwZW5kQ2hpbGQodGhpcy5pbmVydEJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQuaW5uZXJIVE1MID0gJzxzdmc+PGcgb25sb2FkPVwidGhpcy5wYXJlbnROb2RlLnJlbW92ZSgpXCI+PC9nPjwvc3ZnPic7XG4gICAgaWYgKHRoaXMuaW5lcnRCb2R5RWxlbWVudC5xdWVyeVNlbGVjdG9yICYmICF0aGlzLmluZXJ0Qm9keUVsZW1lbnQucXVlcnlTZWxlY3Rvcignc3ZnJykpIHtcbiAgICAgIC8vIFdlIGp1c3QgaGl0IHRoZSBTYWZhcmkgMTAuMSBidWcgLSB3aGljaCBhbGxvd3MgSlMgdG8gcnVuIGluc2lkZSB0aGUgU1ZHIEcgZWxlbWVudFxuICAgICAgLy8gc28gdXNlIHRoZSBYSFIgc3RyYXRlZ3kuXG4gICAgICB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnRfWEhSO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaW5lcnRCb2R5RWxlbWVudC5pbm5lckhUTUwgPVxuICAgICAgICAnPHN2Zz48cD48c3R5bGU+PGltZyBzcmM9XCI8L3N0eWxlPjxpbWcgc3JjPXggb25lcnJvcj1hbGVydCgxKS8vXCI+JztcbiAgICBpZiAodGhpcy5pbmVydEJvZHlFbGVtZW50LnF1ZXJ5U2VsZWN0b3IgJiYgdGhpcy5pbmVydEJvZHlFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N2ZyBpbWcnKSkge1xuICAgICAgLy8gV2UganVzdCBoaXQgdGhlIEZpcmVmb3ggYnVnIC0gd2hpY2ggcHJldmVudHMgdGhlIGlubmVyIGltZyBKUyBmcm9tIGJlaW5nIHNhbml0aXplZFxuICAgICAgLy8gc28gdXNlIHRoZSBET01QYXJzZXIgc3RyYXRlZ3ksIGlmIGl0IGlzIGF2YWlsYWJsZS5cbiAgICAgIC8vIElmIHRoZSBET01QYXJzZXIgaXMgbm90IGF2YWlsYWJsZSB0aGVuIHdlIGFyZSBub3QgaW4gRmlyZWZveCAoU2VydmVyL1dlYldvcmtlcj8pIHNvIHdlXG4gICAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRlZmF1bHQgc3RyYXRlZ3kgYmVsb3cuXG4gICAgICBpZiAoaXNET01QYXJzZXJBdmFpbGFibGUoKSkge1xuICAgICAgICB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnQgPSB0aGlzLmdldEluZXJ0Qm9keUVsZW1lbnRfRE9NUGFyc2VyO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm9uZSBvZiB0aGUgYnVncyB3ZXJlIGhpdCBzbyBpdCBpcyBzYWZlIGZvciB1cyB0byB1c2UgdGhlIGRlZmF1bHQgSW5lcnREb2N1bWVudCBzdHJhdGVneVxuICAgIHRoaXMuZ2V0SW5lcnRCb2R5RWxlbWVudCA9IHRoaXMuZ2V0SW5lcnRCb2R5RWxlbWVudF9JbmVydERvY3VtZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBpbmVydCBET00gZWxlbWVudCBjb250YWluaW5nIERPTSBjcmVhdGVkIGZyb20gdGhlIGRpcnR5IEhUTUwgc3RyaW5nIHByb3ZpZGVkLlxuICAgKiBUaGUgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBpcyBkZXRlcm1pbmVkIGluIHRoZSBjb25zdHJ1Y3Rvciwgd2hlbiB0aGUgY2xhc3MgaXMgaW5zdGFudGlhdGVkLlxuICAgKi9cbiAgZ2V0SW5lcnRCb2R5RWxlbWVudDogKGh0bWw6IHN0cmluZykgPT4gSFRNTEVsZW1lbnQgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBVc2UgWEhSIHRvIGNyZWF0ZSBhbmQgZmlsbCBhbiBpbmVydCBib2R5IGVsZW1lbnQgKG9uIFNhZmFyaSAxMC4xKVxuICAgKiBTZWVcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvYmxvYi9hOTkyZDNhNzUwMzFjYjhiYjAzMmU1ZWE4Mzk5YmE5NzJiZGY5YTY1L3NyYy9wdXJpZnkuanMjTDQzOS1MNDQ5XG4gICAqL1xuICBwcml2YXRlIGdldEluZXJ0Qm9keUVsZW1lbnRfWEhSKGh0bWw6IHN0cmluZykge1xuICAgIC8vIFdlIGFkZCB0aGVzZSBleHRyYSBlbGVtZW50cyB0byBlbnN1cmUgdGhhdCB0aGUgcmVzdCBvZiB0aGUgY29udGVudCBpcyBwYXJzZWQgYXMgZXhwZWN0ZWRcbiAgICAvLyBlLmcuIGxlYWRpbmcgd2hpdGVzcGFjZSBpcyBtYWludGFpbmVkIGFuZCB0YWdzIGxpa2UgYDxtZXRhPmAgZG8gbm90IGdldCBob2lzdGVkIHRvIHRoZVxuICAgIC8vIGA8aGVhZD5gIHRhZy5cbiAgICBodG1sID0gJzxib2R5PjxyZW1vdmU+PC9yZW1vdmU+JyArIGh0bWwgKyAnPC9ib2R5Pic7XG4gICAgdHJ5IHtcbiAgICAgIGh0bWwgPSBlbmNvZGVVUkkoaHRtbCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSAnZG9jdW1lbnQnO1xuICAgIHhoci5vcGVuKCdHRVQnLCAnZGF0YTp0ZXh0L2h0bWw7Y2hhcnNldD11dGYtOCwnICsgaHRtbCwgZmFsc2UpO1xuICAgIHhoci5zZW5kKHVuZGVmaW5lZCk7XG4gICAgY29uc3QgYm9keTogSFRNTEJvZHlFbGVtZW50ID0geGhyLnJlc3BvbnNlLmJvZHk7XG4gICAgYm9keS5yZW1vdmVDaGlsZChib2R5LmZpcnN0Q2hpbGQgISk7XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICAvKipcbiAgICogVXNlIERPTVBhcnNlciB0byBjcmVhdGUgYW5kIGZpbGwgYW4gaW5lcnQgYm9keSBlbGVtZW50IChvbiBGaXJlZm94KVxuICAgKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2N1cmU1My9ET01QdXJpZnkvcmVsZWFzZXMvdGFnLzAuNi43XG4gICAqXG4gICAqL1xuICBwcml2YXRlIGdldEluZXJ0Qm9keUVsZW1lbnRfRE9NUGFyc2VyKGh0bWw6IHN0cmluZykge1xuICAgIC8vIFdlIGFkZCB0aGVzZSBleHRyYSBlbGVtZW50cyB0byBlbnN1cmUgdGhhdCB0aGUgcmVzdCBvZiB0aGUgY29udGVudCBpcyBwYXJzZWQgYXMgZXhwZWN0ZWRcbiAgICAvLyBlLmcuIGxlYWRpbmcgd2hpdGVzcGFjZSBpcyBtYWludGFpbmVkIGFuZCB0YWdzIGxpa2UgYDxtZXRhPmAgZG8gbm90IGdldCBob2lzdGVkIHRvIHRoZVxuICAgIC8vIGA8aGVhZD5gIHRhZy5cbiAgICBodG1sID0gJzxib2R5PjxyZW1vdmU+PC9yZW1vdmU+JyArIGh0bWwgKyAnPC9ib2R5Pic7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGJvZHkgPSBuZXcgKHdpbmRvdyBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgIC5ET01QYXJzZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKVxuICAgICAgICAgICAgICAgICAgICAgICAuYm9keSBhcyBIVE1MQm9keUVsZW1lbnQ7XG4gICAgICBib2R5LnJlbW92ZUNoaWxkKGJvZHkuZmlyc3RDaGlsZCAhKTtcbiAgICAgIHJldHVybiBib2R5O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgYW4gSFRNTDUgYHRlbXBsYXRlYCBlbGVtZW50LCBpZiBzdXBwb3J0ZWQsIG9yIGFuIGluZXJ0IGJvZHkgZWxlbWVudCBjcmVhdGVkIHZpYVxuICAgKiBgY3JlYXRlSHRtbERvY3VtZW50YCB0byBjcmVhdGUgYW5kIGZpbGwgYW4gaW5lcnQgRE9NIGVsZW1lbnQuXG4gICAqIFRoaXMgaXMgdGhlIGRlZmF1bHQgc2FuZSBzdHJhdGVneSB0byB1c2UgaWYgdGhlIGJyb3dzZXIgZG9lcyBub3QgcmVxdWlyZSBvbmUgb2YgdGhlIHNwZWNpYWxpc2VkXG4gICAqIHN0cmF0ZWdpZXMgYWJvdmUuXG4gICAqL1xuICBwcml2YXRlIGdldEluZXJ0Qm9keUVsZW1lbnRfSW5lcnREb2N1bWVudChodG1sOiBzdHJpbmcpIHtcbiAgICAvLyBQcmVmZXIgdXNpbmcgPHRlbXBsYXRlPiBlbGVtZW50IGlmIHN1cHBvcnRlZC5cbiAgICBjb25zdCB0ZW1wbGF0ZUVsID0gdGhpcy5pbmVydERvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgaWYgKCdjb250ZW50JyBpbiB0ZW1wbGF0ZUVsKSB7XG4gICAgICB0ZW1wbGF0ZUVsLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICByZXR1cm4gdGVtcGxhdGVFbDtcbiAgICB9XG5cbiAgICB0aGlzLmluZXJ0Qm9keUVsZW1lbnQuaW5uZXJIVE1MID0gaHRtbDtcblxuICAgIC8vIFN1cHBvcnQ6IElFIDktMTEgb25seVxuICAgIC8vIHN0cmlwIGN1c3RvbS1uYW1lc3BhY2VkIGF0dHJpYnV0ZXMgb24gSUU8PTExXG4gICAgaWYgKCh0aGlzLmRlZmF1bHREb2MgYXMgYW55KS5kb2N1bWVudE1vZGUpIHtcbiAgICAgIHRoaXMuc3RyaXBDdXN0b21Oc0F0dHJzKHRoaXMuaW5lcnRCb2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaW5lcnRCb2R5RWxlbWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIElFOS0xMSBjb21lcyBhY3Jvc3MgYW4gdW5rbm93biBuYW1lc3BhY2VkIGF0dHJpYnV0ZSBlLmcuICd4bGluazpmb28nIGl0IGFkZHMgJ3htbG5zOm5zMSdcbiAgICogYXR0cmlidXRlIHRvIGRlY2xhcmUgbnMxIG5hbWVzcGFjZSBhbmQgcHJlZml4ZXMgdGhlIGF0dHJpYnV0ZSB3aXRoICduczEnIChlLmcuXG4gICAqICduczE6eGxpbms6Zm9vJykuXG4gICAqXG4gICAqIFRoaXMgaXMgdW5kZXNpcmFibGUgc2luY2Ugd2UgZG9uJ3Qgd2FudCB0byBhbGxvdyBhbnkgb2YgdGhlc2UgY3VzdG9tIGF0dHJpYnV0ZXMuIFRoaXMgbWV0aG9kXG4gICAqIHN0cmlwcyB0aGVtIGFsbC5cbiAgICovXG4gIHByaXZhdGUgc3RyaXBDdXN0b21Oc0F0dHJzKGVsOiBFbGVtZW50KSB7XG4gICAgY29uc3QgZWxBdHRycyA9IGVsLmF0dHJpYnV0ZXM7XG4gICAgLy8gbG9vcCBiYWNrd2FyZHMgc28gdGhhdCB3ZSBjYW4gc3VwcG9ydCByZW1vdmFscy5cbiAgICBmb3IgKGxldCBpID0gZWxBdHRycy5sZW5ndGggLSAxOyAwIDwgaTsgaS0tKSB7XG4gICAgICBjb25zdCBhdHRyaWIgPSBlbEF0dHJzLml0ZW0oaSk7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJpYiAhLm5hbWU7XG4gICAgICBpZiAoYXR0ck5hbWUgPT09ICd4bWxuczpuczEnIHx8IGF0dHJOYW1lLmluZGV4T2YoJ25zMTonKSA9PT0gMCkge1xuICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2hpbGROb2RlID0gZWwuZmlyc3RDaGlsZCBhcyBOb2RlIHwgbnVsbDtcbiAgICB3aGlsZSAoY2hpbGROb2RlKSB7XG4gICAgICBpZiAoY2hpbGROb2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkgdGhpcy5zdHJpcEN1c3RvbU5zQXR0cnMoY2hpbGROb2RlIGFzIEVsZW1lbnQpO1xuICAgICAgY2hpbGROb2RlID0gY2hpbGROb2RlLm5leHRTaWJsaW5nO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdlIG5lZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIERPTVBhcnNlciBleGlzdHMgaW4gdGhlIGdsb2JhbCBjb250ZXh0LlxuICogVGhlIHRyeS1jYXRjaCBpcyBiZWNhdXNlLCBvbiBzb21lIGJyb3dzZXJzLCB0cnlpbmcgdG8gYWNjZXNzIHRoaXMgcHJvcGVydHlcbiAqIG9uIHdpbmRvdyBjYW4gYWN0dWFsbHkgdGhyb3cgYW4gZXJyb3IuXG4gKlxuICogQHN1cHByZXNzIHt1c2VsZXNzQ29kZX1cbiAqL1xuZnVuY3Rpb24gaXNET01QYXJzZXJBdmFpbGFibGUoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdyBhcyBhbnkpLkRPTVBhcnNlcjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuIl19