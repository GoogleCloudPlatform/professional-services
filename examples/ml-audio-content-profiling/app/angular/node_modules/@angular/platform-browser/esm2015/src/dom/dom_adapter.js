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
/** @type {?} */
let _DOM = /** @type {?} */ ((null));
/**
 * @return {?}
 */
export function getDOM() {
    return _DOM;
}
/**
 * @param {?} adapter
 * @return {?}
 */
export function setDOM(adapter) {
    _DOM = adapter;
}
/**
 * @param {?} adapter
 * @return {?}
 */
export function setRootDomAdapter(adapter) {
    if (!_DOM) {
        _DOM = adapter;
    }
}
/**
 * Provides DOM operations in an environment-agnostic way.
 *
 * \@security Tread carefully! Interacting with the DOM directly is dangerous and
 * can introduce XSS risks.
 * @abstract
 */
export class DomAdapter {
    constructor() {
        this.resourceLoaderType = /** @type {?} */ ((null));
    }
    /**
     * Maps attribute names to their corresponding property names for cases
     * where attribute name doesn't match property name.
     * @return {?}
     */
    get attrToPropMap() { return this._attrToPropMap; }
    /**
     * @param {?} value
     * @return {?}
     */
    set attrToPropMap(value) { this._attrToPropMap = value; }
}
if (false) {
    /** @type {?} */
    DomAdapter.prototype.resourceLoaderType;
    /**
     * \@internal
     * @type {?}
     */
    DomAdapter.prototype._attrToPropMap;
    /**
     * @abstract
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    DomAdapter.prototype.hasProperty = function (element, name) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setProperty = function (el, name, value) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    DomAdapter.prototype.getProperty = function (el, name) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} methodName
     * @param {?} args
     * @return {?}
     */
    DomAdapter.prototype.invoke = function (el, methodName, args) { };
    /**
     * @abstract
     * @param {?} error
     * @return {?}
     */
    DomAdapter.prototype.logError = function (error) { };
    /**
     * @abstract
     * @param {?} error
     * @return {?}
     */
    DomAdapter.prototype.log = function (error) { };
    /**
     * @abstract
     * @param {?} error
     * @return {?}
     */
    DomAdapter.prototype.logGroup = function (error) { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.logGroupEnd = function () { };
    /**
     * @abstract
     * @param {?} nodeA
     * @param {?} nodeB
     * @return {?}
     */
    DomAdapter.prototype.contains = function (nodeA, nodeB) { };
    /**
     * @abstract
     * @param {?} templateHtml
     * @return {?}
     */
    DomAdapter.prototype.parse = function (templateHtml) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} selector
     * @return {?}
     */
    DomAdapter.prototype.querySelector = function (el, selector) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} selector
     * @return {?}
     */
    DomAdapter.prototype.querySelectorAll = function (el, selector) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} evt
     * @param {?} listener
     * @return {?}
     */
    DomAdapter.prototype.on = function (el, evt, listener) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} evt
     * @param {?} listener
     * @return {?}
     */
    DomAdapter.prototype.onAndCancel = function (el, evt, listener) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} evt
     * @return {?}
     */
    DomAdapter.prototype.dispatchEvent = function (el, evt) { };
    /**
     * @abstract
     * @param {?} eventType
     * @return {?}
     */
    DomAdapter.prototype.createMouseEvent = function (eventType) { };
    /**
     * @abstract
     * @param {?} eventType
     * @return {?}
     */
    DomAdapter.prototype.createEvent = function (eventType) { };
    /**
     * @abstract
     * @param {?} evt
     * @return {?}
     */
    DomAdapter.prototype.preventDefault = function (evt) { };
    /**
     * @abstract
     * @param {?} evt
     * @return {?}
     */
    DomAdapter.prototype.isPrevented = function (evt) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getInnerHTML = function (el) { };
    /**
     * Returns content if el is a <template> element, null otherwise.
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getTemplateContent = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getOuterHTML = function (el) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.nodeName = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.nodeValue = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.type = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.content = function (node) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.firstChild = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.nextSibling = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.parentElement = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.childNodes = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.childNodesAsList = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.clearNodes = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.appendChild = function (el, node) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.removeChild = function (el, node) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} newNode
     * @param {?} oldNode
     * @return {?}
     */
    DomAdapter.prototype.replaceChild = function (el, newNode, oldNode) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.remove = function (el) { };
    /**
     * @abstract
     * @param {?} parent
     * @param {?} ref
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.insertBefore = function (parent, ref, node) { };
    /**
     * @abstract
     * @param {?} parent
     * @param {?} ref
     * @param {?} nodes
     * @return {?}
     */
    DomAdapter.prototype.insertAllBefore = function (parent, ref, nodes) { };
    /**
     * @abstract
     * @param {?} parent
     * @param {?} el
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.insertAfter = function (parent, el, node) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setInnerHTML = function (el, value) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getText = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setText = function (el, value) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getValue = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setValue = function (el, value) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getChecked = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setChecked = function (el, value) { };
    /**
     * @abstract
     * @param {?} text
     * @return {?}
     */
    DomAdapter.prototype.createComment = function (text) { };
    /**
     * @abstract
     * @param {?} html
     * @return {?}
     */
    DomAdapter.prototype.createTemplate = function (html) { };
    /**
     * @abstract
     * @param {?} tagName
     * @param {?=} doc
     * @return {?}
     */
    DomAdapter.prototype.createElement = function (tagName, doc) { };
    /**
     * @abstract
     * @param {?} ns
     * @param {?} tagName
     * @param {?=} doc
     * @return {?}
     */
    DomAdapter.prototype.createElementNS = function (ns, tagName, doc) { };
    /**
     * @abstract
     * @param {?} text
     * @param {?=} doc
     * @return {?}
     */
    DomAdapter.prototype.createTextNode = function (text, doc) { };
    /**
     * @abstract
     * @param {?} attrName
     * @param {?} attrValue
     * @param {?=} doc
     * @return {?}
     */
    DomAdapter.prototype.createScriptTag = function (attrName, attrValue, doc) { };
    /**
     * @abstract
     * @param {?} css
     * @param {?=} doc
     * @return {?}
     */
    DomAdapter.prototype.createStyleElement = function (css, doc) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.createShadowRoot = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getShadowRoot = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getHost = function (el) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getDistributedNodes = function (el) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.clone = function (node) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    DomAdapter.prototype.getElementsByClassName = function (element, name) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    DomAdapter.prototype.getElementsByTagName = function (element, name) { };
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    DomAdapter.prototype.classList = function (element) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} className
     * @return {?}
     */
    DomAdapter.prototype.addClass = function (element, className) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} className
     * @return {?}
     */
    DomAdapter.prototype.removeClass = function (element, className) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} className
     * @return {?}
     */
    DomAdapter.prototype.hasClass = function (element, className) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} styleName
     * @param {?} styleValue
     * @return {?}
     */
    DomAdapter.prototype.setStyle = function (element, styleName, styleValue) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} styleName
     * @return {?}
     */
    DomAdapter.prototype.removeStyle = function (element, styleName) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} styleName
     * @return {?}
     */
    DomAdapter.prototype.getStyle = function (element, styleName) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} styleName
     * @param {?=} styleValue
     * @return {?}
     */
    DomAdapter.prototype.hasStyle = function (element, styleName, styleValue) { };
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    DomAdapter.prototype.tagName = function (element) { };
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    DomAdapter.prototype.attributeMap = function (element) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} attribute
     * @return {?}
     */
    DomAdapter.prototype.hasAttribute = function (element, attribute) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} ns
     * @param {?} attribute
     * @return {?}
     */
    DomAdapter.prototype.hasAttributeNS = function (element, ns, attribute) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} attribute
     * @return {?}
     */
    DomAdapter.prototype.getAttribute = function (element, attribute) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} ns
     * @param {?} attribute
     * @return {?}
     */
    DomAdapter.prototype.getAttributeNS = function (element, ns, attribute) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setAttribute = function (element, name, value) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} ns
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setAttributeNS = function (element, ns, name, value) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} attribute
     * @return {?}
     */
    DomAdapter.prototype.removeAttribute = function (element, attribute) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} ns
     * @param {?} attribute
     * @return {?}
     */
    DomAdapter.prototype.removeAttributeNS = function (element, ns, attribute) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.templateAwareRoot = function (el) { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.createHtmlDocument = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.getDefaultDocument = function () { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.getBoundingClientRect = function (el) { };
    /**
     * @abstract
     * @param {?} doc
     * @return {?}
     */
    DomAdapter.prototype.getTitle = function (doc) { };
    /**
     * @abstract
     * @param {?} doc
     * @param {?} newTitle
     * @return {?}
     */
    DomAdapter.prototype.setTitle = function (doc, newTitle) { };
    /**
     * @abstract
     * @param {?} n
     * @param {?} selector
     * @return {?}
     */
    DomAdapter.prototype.elementMatches = function (n, selector) { };
    /**
     * @abstract
     * @param {?} el
     * @return {?}
     */
    DomAdapter.prototype.isTemplateElement = function (el) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.isTextNode = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.isCommentNode = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.isElementNode = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.hasShadowRoot = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.isShadowRoot = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.importIntoDoc = function (node) { };
    /**
     * @abstract
     * @param {?} node
     * @return {?}
     */
    DomAdapter.prototype.adoptNode = function (node) { };
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    DomAdapter.prototype.getHref = function (element) { };
    /**
     * @abstract
     * @param {?} event
     * @return {?}
     */
    DomAdapter.prototype.getEventKey = function (event) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} baseUrl
     * @param {?} href
     * @return {?}
     */
    DomAdapter.prototype.resolveAndSetHref = function (element, baseUrl, href) { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.supportsDOMEvents = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.supportsNativeShadowDOM = function () { };
    /**
     * @abstract
     * @param {?} doc
     * @param {?} target
     * @return {?}
     */
    DomAdapter.prototype.getGlobalEventTarget = function (doc, target) { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.getHistory = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.getLocation = function () { };
    /**
     * @abstract
     * @param {?} doc
     * @return {?}
     */
    DomAdapter.prototype.getBaseHref = function (doc) { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.resetBaseElement = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.getUserAgent = function () { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setData = function (element, name, value) { };
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    DomAdapter.prototype.getComputedStyle = function (element) { };
    /**
     * @abstract
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    DomAdapter.prototype.getData = function (element, name) { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.supportsWebAnimation = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.performanceNow = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.getAnimationPrefix = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.getTransitionEnd = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.supportsAnimation = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DomAdapter.prototype.supportsCookies = function () { };
    /**
     * @abstract
     * @param {?} name
     * @return {?}
     */
    DomAdapter.prototype.getCookie = function (name) { };
    /**
     * @abstract
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    DomAdapter.prototype.setCookie = function (name, value) { };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tX2FkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9wbGF0Zm9ybS1icm93c2VyL3NyYy9kb20vZG9tX2FkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBVUEsSUFBSSxJQUFJLHNCQUFlLElBQUksR0FBRzs7OztBQUU5QixNQUFNLFVBQVUsTUFBTTtJQUNwQixPQUFPLElBQUksQ0FBQztDQUNiOzs7OztBQUVELE1BQU0sVUFBVSxNQUFNLENBQUMsT0FBbUI7SUFDeEMsSUFBSSxHQUFHLE9BQU8sQ0FBQztDQUNoQjs7Ozs7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsT0FBbUI7SUFDbkQsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULElBQUksR0FBRyxPQUFPLENBQUM7S0FDaEI7Q0FDRjs7Ozs7Ozs7QUFTRCxNQUFNLE9BQWdCLFVBQVU7O3FEQUNTLElBQUk7Ozs7Ozs7SUFlM0MsSUFBSSxhQUFhLEtBQThCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFOzs7OztJQUM1RSxJQUFJLGFBQWEsQ0FBQyxLQUE4QixJQUFJLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLEVBQUU7Q0FrSG5GIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5sZXQgX0RPTTogRG9tQWRhcHRlciA9IG51bGwgITtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldERPTSgpIHtcbiAgcmV0dXJuIF9ET007XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRET00oYWRhcHRlcjogRG9tQWRhcHRlcikge1xuICBfRE9NID0gYWRhcHRlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJvb3REb21BZGFwdGVyKGFkYXB0ZXI6IERvbUFkYXB0ZXIpIHtcbiAgaWYgKCFfRE9NKSB7XG4gICAgX0RPTSA9IGFkYXB0ZXI7XG4gIH1cbn1cblxuLyogdHNsaW50OmRpc2FibGU6cmVxdWlyZVBhcmFtZXRlclR5cGUgKi9cbi8qKlxuICogUHJvdmlkZXMgRE9NIG9wZXJhdGlvbnMgaW4gYW4gZW52aXJvbm1lbnQtYWdub3N0aWMgd2F5LlxuICpcbiAqIEBzZWN1cml0eSBUcmVhZCBjYXJlZnVsbHkhIEludGVyYWN0aW5nIHdpdGggdGhlIERPTSBkaXJlY3RseSBpcyBkYW5nZXJvdXMgYW5kXG4gKiBjYW4gaW50cm9kdWNlIFhTUyByaXNrcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIERvbUFkYXB0ZXIge1xuICBwdWJsaWMgcmVzb3VyY2VMb2FkZXJUeXBlOiBUeXBlPGFueT4gPSBudWxsICE7XG4gIGFic3RyYWN0IGhhc1Byb3BlcnR5KGVsZW1lbnQ6IGFueSwgbmFtZTogc3RyaW5nKTogYm9vbGVhbjtcbiAgYWJzdHJhY3Qgc2V0UHJvcGVydHkoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0UHJvcGVydHkoZWw6IEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgaW52b2tlKGVsOiBFbGVtZW50LCBtZXRob2ROYW1lOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogYW55O1xuXG4gIGFic3RyYWN0IGxvZ0Vycm9yKGVycm9yOiBhbnkpOiBhbnk7XG4gIGFic3RyYWN0IGxvZyhlcnJvcjogYW55KTogYW55O1xuICBhYnN0cmFjdCBsb2dHcm91cChlcnJvcjogYW55KTogYW55O1xuICBhYnN0cmFjdCBsb2dHcm91cEVuZCgpOiBhbnk7XG5cbiAgLyoqXG4gICAqIE1hcHMgYXR0cmlidXRlIG5hbWVzIHRvIHRoZWlyIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgbmFtZXMgZm9yIGNhc2VzXG4gICAqIHdoZXJlIGF0dHJpYnV0ZSBuYW1lIGRvZXNuJ3QgbWF0Y2ggcHJvcGVydHkgbmFtZS5cbiAgICovXG4gIGdldCBhdHRyVG9Qcm9wTWFwKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHsgcmV0dXJuIHRoaXMuX2F0dHJUb1Byb3BNYXA7IH1cbiAgc2V0IGF0dHJUb1Byb3BNYXAodmFsdWU6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9KSB7IHRoaXMuX2F0dHJUb1Byb3BNYXAgPSB2YWx1ZTsgfVxuICAvKiogQGludGVybmFsICovXG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBfYXR0clRvUHJvcE1hcCAhOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTtcblxuICBhYnN0cmFjdCBjb250YWlucyhub2RlQTogYW55LCBub2RlQjogYW55KTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgcGFyc2UodGVtcGxhdGVIdG1sOiBzdHJpbmcpOiBhbnk7XG4gIGFic3RyYWN0IHF1ZXJ5U2VsZWN0b3IoZWw6IGFueSwgc2VsZWN0b3I6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgcXVlcnlTZWxlY3RvckFsbChlbDogYW55LCBzZWxlY3Rvcjogc3RyaW5nKTogYW55W107XG4gIGFic3RyYWN0IG9uKGVsOiBhbnksIGV2dDogYW55LCBsaXN0ZW5lcjogYW55KTogYW55O1xuICBhYnN0cmFjdCBvbkFuZENhbmNlbChlbDogYW55LCBldnQ6IGFueSwgbGlzdGVuZXI6IGFueSk6IEZ1bmN0aW9uO1xuICBhYnN0cmFjdCBkaXNwYXRjaEV2ZW50KGVsOiBhbnksIGV2dDogYW55KTogYW55O1xuICBhYnN0cmFjdCBjcmVhdGVNb3VzZUV2ZW50KGV2ZW50VHlwZTogYW55KTogYW55O1xuICBhYnN0cmFjdCBjcmVhdGVFdmVudChldmVudFR5cGU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgcHJldmVudERlZmF1bHQoZXZ0OiBhbnkpOiBhbnk7XG4gIGFic3RyYWN0IGlzUHJldmVudGVkKGV2dDogYW55KTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgZ2V0SW5uZXJIVE1MKGVsOiBhbnkpOiBzdHJpbmc7XG4gIC8qKiBSZXR1cm5zIGNvbnRlbnQgaWYgZWwgaXMgYSA8dGVtcGxhdGU+IGVsZW1lbnQsIG51bGwgb3RoZXJ3aXNlLiAqL1xuICBhYnN0cmFjdCBnZXRUZW1wbGF0ZUNvbnRlbnQoZWw6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0T3V0ZXJIVE1MKGVsOiBhbnkpOiBzdHJpbmc7XG4gIGFic3RyYWN0IG5vZGVOYW1lKG5vZGU6IGFueSk6IHN0cmluZztcbiAgYWJzdHJhY3Qgbm9kZVZhbHVlKG5vZGU6IGFueSk6IHN0cmluZ3xudWxsO1xuICBhYnN0cmFjdCB0eXBlKG5vZGU6IGFueSk6IHN0cmluZztcbiAgYWJzdHJhY3QgY29udGVudChub2RlOiBhbnkpOiBhbnk7XG4gIGFic3RyYWN0IGZpcnN0Q2hpbGQoZWw6IGFueSk6IE5vZGV8bnVsbDtcbiAgYWJzdHJhY3QgbmV4dFNpYmxpbmcoZWw6IGFueSk6IE5vZGV8bnVsbDtcbiAgYWJzdHJhY3QgcGFyZW50RWxlbWVudChlbDogYW55KTogTm9kZXxudWxsO1xuICBhYnN0cmFjdCBjaGlsZE5vZGVzKGVsOiBhbnkpOiBOb2RlW107XG4gIGFic3RyYWN0IGNoaWxkTm9kZXNBc0xpc3QoZWw6IGFueSk6IE5vZGVbXTtcbiAgYWJzdHJhY3QgY2xlYXJOb2RlcyhlbDogYW55KTogYW55O1xuICBhYnN0cmFjdCBhcHBlbmRDaGlsZChlbDogYW55LCBub2RlOiBhbnkpOiBhbnk7XG4gIGFic3RyYWN0IHJlbW92ZUNoaWxkKGVsOiBhbnksIG5vZGU6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgcmVwbGFjZUNoaWxkKGVsOiBhbnksIG5ld05vZGU6IGFueSwgb2xkTm9kZTogYW55KTogYW55O1xuICBhYnN0cmFjdCByZW1vdmUoZWw6IGFueSk6IE5vZGU7XG4gIGFic3RyYWN0IGluc2VydEJlZm9yZShwYXJlbnQ6IGFueSwgcmVmOiBhbnksIG5vZGU6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgaW5zZXJ0QWxsQmVmb3JlKHBhcmVudDogYW55LCByZWY6IGFueSwgbm9kZXM6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgaW5zZXJ0QWZ0ZXIocGFyZW50OiBhbnksIGVsOiBhbnksIG5vZGU6IGFueSk6IGFueTtcbiAgYWJzdHJhY3Qgc2V0SW5uZXJIVE1MKGVsOiBhbnksIHZhbHVlOiBhbnkpOiBhbnk7XG4gIGFic3RyYWN0IGdldFRleHQoZWw6IGFueSk6IHN0cmluZ3xudWxsO1xuICBhYnN0cmFjdCBzZXRUZXh0KGVsOiBhbnksIHZhbHVlOiBzdHJpbmcpOiBhbnk7XG4gIGFic3RyYWN0IGdldFZhbHVlKGVsOiBhbnkpOiBzdHJpbmc7XG4gIGFic3RyYWN0IHNldFZhbHVlKGVsOiBhbnksIHZhbHVlOiBzdHJpbmcpOiBhbnk7XG4gIGFic3RyYWN0IGdldENoZWNrZWQoZWw6IGFueSk6IGJvb2xlYW47XG4gIGFic3RyYWN0IHNldENoZWNrZWQoZWw6IGFueSwgdmFsdWU6IGJvb2xlYW4pOiBhbnk7XG4gIGFic3RyYWN0IGNyZWF0ZUNvbW1lbnQodGV4dDogc3RyaW5nKTogYW55O1xuICBhYnN0cmFjdCBjcmVhdGVUZW1wbGF0ZShodG1sOiBhbnkpOiBIVE1MRWxlbWVudDtcbiAgYWJzdHJhY3QgY3JlYXRlRWxlbWVudCh0YWdOYW1lOiBhbnksIGRvYz86IGFueSk6IEhUTUxFbGVtZW50O1xuICBhYnN0cmFjdCBjcmVhdGVFbGVtZW50TlMobnM6IHN0cmluZywgdGFnTmFtZTogc3RyaW5nLCBkb2M/OiBhbnkpOiBFbGVtZW50O1xuICBhYnN0cmFjdCBjcmVhdGVUZXh0Tm9kZSh0ZXh0OiBzdHJpbmcsIGRvYz86IGFueSk6IFRleHQ7XG4gIGFic3RyYWN0IGNyZWF0ZVNjcmlwdFRhZyhhdHRyTmFtZTogc3RyaW5nLCBhdHRyVmFsdWU6IHN0cmluZywgZG9jPzogYW55KTogSFRNTEVsZW1lbnQ7XG4gIGFic3RyYWN0IGNyZWF0ZVN0eWxlRWxlbWVudChjc3M6IHN0cmluZywgZG9jPzogYW55KTogSFRNTFN0eWxlRWxlbWVudDtcbiAgYWJzdHJhY3QgY3JlYXRlU2hhZG93Um9vdChlbDogYW55KTogYW55O1xuICBhYnN0cmFjdCBnZXRTaGFkb3dSb290KGVsOiBhbnkpOiBhbnk7XG4gIGFic3RyYWN0IGdldEhvc3QoZWw6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0RGlzdHJpYnV0ZWROb2RlcyhlbDogYW55KTogTm9kZVtdO1xuICBhYnN0cmFjdCBjbG9uZSAvKjxUIGV4dGVuZHMgTm9kZT4qLyAobm9kZTogTm9kZSAvKlQqLyk6IE5vZGUgLypUKi87XG4gIGFic3RyYWN0IGdldEVsZW1lbnRzQnlDbGFzc05hbWUoZWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcpOiBIVE1MRWxlbWVudFtdO1xuICBhYnN0cmFjdCBnZXRFbGVtZW50c0J5VGFnTmFtZShlbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZyk6IEhUTUxFbGVtZW50W107XG4gIGFic3RyYWN0IGNsYXNzTGlzdChlbGVtZW50OiBhbnkpOiBhbnlbXTtcbiAgYWJzdHJhY3QgYWRkQ2xhc3MoZWxlbWVudDogYW55LCBjbGFzc05hbWU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgcmVtb3ZlQ2xhc3MoZWxlbWVudDogYW55LCBjbGFzc05hbWU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgaGFzQ2xhc3MoZWxlbWVudDogYW55LCBjbGFzc05hbWU6IHN0cmluZyk6IGJvb2xlYW47XG4gIGFic3RyYWN0IHNldFN0eWxlKGVsZW1lbnQ6IGFueSwgc3R5bGVOYW1lOiBzdHJpbmcsIHN0eWxlVmFsdWU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgcmVtb3ZlU3R5bGUoZWxlbWVudDogYW55LCBzdHlsZU5hbWU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0U3R5bGUoZWxlbWVudDogYW55LCBzdHlsZU5hbWU6IHN0cmluZyk6IHN0cmluZztcbiAgYWJzdHJhY3QgaGFzU3R5bGUoZWxlbWVudDogYW55LCBzdHlsZU5hbWU6IHN0cmluZywgc3R5bGVWYWx1ZT86IHN0cmluZyk6IGJvb2xlYW47XG4gIGFic3RyYWN0IHRhZ05hbWUoZWxlbWVudDogYW55KTogc3RyaW5nO1xuICBhYnN0cmFjdCBhdHRyaWJ1dGVNYXAoZWxlbWVudDogYW55KTogTWFwPHN0cmluZywgc3RyaW5nPjtcbiAgYWJzdHJhY3QgaGFzQXR0cmlidXRlKGVsZW1lbnQ6IGFueSwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuO1xuICBhYnN0cmFjdCBoYXNBdHRyaWJ1dGVOUyhlbGVtZW50OiBhbnksIG5zOiBzdHJpbmcsIGF0dHJpYnV0ZTogc3RyaW5nKTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgZ2V0QXR0cmlidXRlKGVsZW1lbnQ6IGFueSwgYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmd8bnVsbDtcbiAgYWJzdHJhY3QgZ2V0QXR0cmlidXRlTlMoZWxlbWVudDogYW55LCBuczogc3RyaW5nLCBhdHRyaWJ1dGU6IHN0cmluZyk6IHN0cmluZ3xudWxsO1xuICBhYnN0cmFjdCBzZXRBdHRyaWJ1dGUoZWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBhbnk7XG4gIGFic3RyYWN0IHNldEF0dHJpYnV0ZU5TKGVsZW1lbnQ6IGFueSwgbnM6IHN0cmluZywgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogYW55O1xuICBhYnN0cmFjdCByZW1vdmVBdHRyaWJ1dGUoZWxlbWVudDogYW55LCBhdHRyaWJ1dGU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgcmVtb3ZlQXR0cmlidXRlTlMoZWxlbWVudDogYW55LCBuczogc3RyaW5nLCBhdHRyaWJ1dGU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgdGVtcGxhdGVBd2FyZVJvb3QoZWw6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgY3JlYXRlSHRtbERvY3VtZW50KCk6IEhUTUxEb2N1bWVudDtcbiAgYWJzdHJhY3QgZ2V0RGVmYXVsdERvY3VtZW50KCk6IERvY3VtZW50O1xuICBhYnN0cmFjdCBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWw6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0VGl0bGUoZG9jOiBEb2N1bWVudCk6IHN0cmluZztcbiAgYWJzdHJhY3Qgc2V0VGl0bGUoZG9jOiBEb2N1bWVudCwgbmV3VGl0bGU6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3QgZWxlbWVudE1hdGNoZXMobjogYW55LCBzZWxlY3Rvcjogc3RyaW5nKTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgaXNUZW1wbGF0ZUVsZW1lbnQoZWw6IGFueSk6IGJvb2xlYW47XG4gIGFic3RyYWN0IGlzVGV4dE5vZGUobm9kZTogYW55KTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgaXNDb21tZW50Tm9kZShub2RlOiBhbnkpOiBib29sZWFuO1xuICBhYnN0cmFjdCBpc0VsZW1lbnROb2RlKG5vZGU6IGFueSk6IGJvb2xlYW47XG4gIGFic3RyYWN0IGhhc1NoYWRvd1Jvb3Qobm9kZTogYW55KTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgaXNTaGFkb3dSb290KG5vZGU6IGFueSk6IGJvb2xlYW47XG4gIGFic3RyYWN0IGltcG9ydEludG9Eb2MgLyo8VCBleHRlbmRzIE5vZGU+Ki8gKG5vZGU6IE5vZGUgLypUKi8pOiBOb2RlIC8qVCovO1xuICBhYnN0cmFjdCBhZG9wdE5vZGUgLyo8VCBleHRlbmRzIE5vZGU+Ki8gKG5vZGU6IE5vZGUgLypUKi8pOiBOb2RlIC8qVCovO1xuICBhYnN0cmFjdCBnZXRIcmVmKGVsZW1lbnQ6IGFueSk6IHN0cmluZztcbiAgYWJzdHJhY3QgZ2V0RXZlbnRLZXkoZXZlbnQ6IGFueSk6IHN0cmluZztcbiAgYWJzdHJhY3QgcmVzb2x2ZUFuZFNldEhyZWYoZWxlbWVudDogYW55LCBiYXNlVXJsOiBzdHJpbmcsIGhyZWY6IHN0cmluZyk6IGFueTtcbiAgYWJzdHJhY3Qgc3VwcG9ydHNET01FdmVudHMoKTogYm9vbGVhbjtcbiAgYWJzdHJhY3Qgc3VwcG9ydHNOYXRpdmVTaGFkb3dET00oKTogYm9vbGVhbjtcbiAgYWJzdHJhY3QgZ2V0R2xvYmFsRXZlbnRUYXJnZXQoZG9jOiBEb2N1bWVudCwgdGFyZ2V0OiBzdHJpbmcpOiBhbnk7XG4gIGFic3RyYWN0IGdldEhpc3RvcnkoKTogSGlzdG9yeTtcbiAgYWJzdHJhY3QgZ2V0TG9jYXRpb24oKTogTG9jYXRpb247XG4gIGFic3RyYWN0IGdldEJhc2VIcmVmKGRvYzogRG9jdW1lbnQpOiBzdHJpbmd8bnVsbDtcbiAgYWJzdHJhY3QgcmVzZXRCYXNlRWxlbWVudCgpOiB2b2lkO1xuICBhYnN0cmFjdCBnZXRVc2VyQWdlbnQoKTogc3RyaW5nO1xuICBhYnN0cmFjdCBzZXREYXRhKGVsZW1lbnQ6IGFueSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogYW55O1xuICBhYnN0cmFjdCBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQ6IGFueSk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0RGF0YShlbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsO1xuICBhYnN0cmFjdCBzdXBwb3J0c1dlYkFuaW1hdGlvbigpOiBib29sZWFuO1xuICBhYnN0cmFjdCBwZXJmb3JtYW5jZU5vdygpOiBudW1iZXI7XG4gIGFic3RyYWN0IGdldEFuaW1hdGlvblByZWZpeCgpOiBzdHJpbmc7XG4gIGFic3RyYWN0IGdldFRyYW5zaXRpb25FbmQoKTogc3RyaW5nO1xuICBhYnN0cmFjdCBzdXBwb3J0c0FuaW1hdGlvbigpOiBib29sZWFuO1xuXG4gIGFic3RyYWN0IHN1cHBvcnRzQ29va2llcygpOiBib29sZWFuO1xuICBhYnN0cmFjdCBnZXRDb29raWUobmFtZTogc3RyaW5nKTogc3RyaW5nfG51bGw7XG4gIGFic3RyYWN0IHNldENvb2tpZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBhbnk7XG59XG4iXX0=