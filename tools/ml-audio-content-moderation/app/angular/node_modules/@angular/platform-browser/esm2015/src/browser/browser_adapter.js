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
import { ɵparseCookieValue as parseCookieValue } from '@angular/common';
import { ɵglobal as global } from '@angular/core';
import { setRootDomAdapter } from '../dom/dom_adapter';
import { GenericBrowserDomAdapter } from './generic_browser_adapter';
/** @type {?} */
const _attrToPropMap = {
    'class': 'className',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex',
};
/** @type {?} */
const DOM_KEY_LOCATION_NUMPAD = 3;
/** @type {?} */
const _keyMap = {
    // The following values are here for cross-browser compatibility and to match the W3C standard
    // cf http://www.w3.org/TR/DOM-Level-3-Events-key/
    '\b': 'Backspace',
    '\t': 'Tab',
    '\x7F': 'Delete',
    '\x1B': 'Escape',
    'Del': 'Delete',
    'Esc': 'Escape',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight',
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Menu': 'ContextMenu',
    'Scroll': 'ScrollLock',
    'Win': 'OS'
};
/** @type {?} */
const _chromeNumKeyPadMap = {
    'A': '1',
    'B': '2',
    'C': '3',
    'D': '4',
    'E': '5',
    'F': '6',
    'G': '7',
    'H': '8',
    'I': '9',
    'J': '*',
    'K': '+',
    'M': '-',
    'N': '.',
    'O': '/',
    '\x60': '0',
    '\x90': 'NumLock'
};
/** @type {?} */
let nodeContains;
if (global['Node']) {
    nodeContains = global['Node'].prototype.contains || function (node) {
        return !!(this.compareDocumentPosition(node) & 16);
    };
}
/**
 * A `DomAdapter` powered by full browser DOM APIs.
 *
 * \@security Tread carefully! Interacting with the DOM directly is dangerous and
 * can introduce XSS risks.
 */
export class BrowserDomAdapter extends GenericBrowserDomAdapter {
    /**
     * @param {?} templateHtml
     * @return {?}
     */
    parse(templateHtml) { throw new Error('parse not implemented'); }
    /**
     * @return {?}
     */
    static makeCurrent() { setRootDomAdapter(new BrowserDomAdapter()); }
    /**
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    hasProperty(element, name) { return name in element; }
    /**
     * @param {?} el
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setProperty(el, name, value) { (/** @type {?} */ (el))[name] = value; }
    /**
     * @param {?} el
     * @param {?} name
     * @return {?}
     */
    getProperty(el, name) { return (/** @type {?} */ (el))[name]; }
    /**
     * @param {?} el
     * @param {?} methodName
     * @param {?} args
     * @return {?}
     */
    invoke(el, methodName, args) { (/** @type {?} */ (el))[methodName](...args); }
    /**
     * @param {?} error
     * @return {?}
     */
    logError(error) {
        if (window.console) {
            if (console.error) {
                console.error(error);
            }
            else {
                console.log(error);
            }
        }
    }
    /**
     * @param {?} error
     * @return {?}
     */
    log(error) {
        if (window.console) {
            window.console.log && window.console.log(error);
        }
    }
    /**
     * @param {?} error
     * @return {?}
     */
    logGroup(error) {
        if (window.console) {
            window.console.group && window.console.group(error);
        }
    }
    /**
     * @return {?}
     */
    logGroupEnd() {
        if (window.console) {
            window.console.groupEnd && window.console.groupEnd();
        }
    }
    /**
     * @return {?}
     */
    get attrToPropMap() { return _attrToPropMap; }
    /**
     * @param {?} nodeA
     * @param {?} nodeB
     * @return {?}
     */
    contains(nodeA, nodeB) { return nodeContains.call(nodeA, nodeB); }
    /**
     * @param {?} el
     * @param {?} selector
     * @return {?}
     */
    querySelector(el, selector) { return el.querySelector(selector); }
    /**
     * @param {?} el
     * @param {?} selector
     * @return {?}
     */
    querySelectorAll(el, selector) { return el.querySelectorAll(selector); }
    /**
     * @param {?} el
     * @param {?} evt
     * @param {?} listener
     * @return {?}
     */
    on(el, evt, listener) { el.addEventListener(evt, listener, false); }
    /**
     * @param {?} el
     * @param {?} evt
     * @param {?} listener
     * @return {?}
     */
    onAndCancel(el, evt, listener) {
        el.addEventListener(evt, listener, false);
        // Needed to follow Dart's subscription semantic, until fix of
        // https://code.google.com/p/dart/issues/detail?id=17406
        return () => { el.removeEventListener(evt, listener, false); };
    }
    /**
     * @param {?} el
     * @param {?} evt
     * @return {?}
     */
    dispatchEvent(el, evt) { el.dispatchEvent(evt); }
    /**
     * @param {?} eventType
     * @return {?}
     */
    createMouseEvent(eventType) {
        /** @type {?} */
        const evt = this.getDefaultDocument().createEvent('MouseEvent');
        evt.initEvent(eventType, true, true);
        return evt;
    }
    /**
     * @param {?} eventType
     * @return {?}
     */
    createEvent(eventType) {
        /** @type {?} */
        const evt = this.getDefaultDocument().createEvent('Event');
        evt.initEvent(eventType, true, true);
        return evt;
    }
    /**
     * @param {?} evt
     * @return {?}
     */
    preventDefault(evt) {
        evt.preventDefault();
        evt.returnValue = false;
    }
    /**
     * @param {?} evt
     * @return {?}
     */
    isPrevented(evt) {
        return evt.defaultPrevented || evt.returnValue != null && !evt.returnValue;
    }
    /**
     * @param {?} el
     * @return {?}
     */
    getInnerHTML(el) { return el.innerHTML; }
    /**
     * @param {?} el
     * @return {?}
     */
    getTemplateContent(el) {
        return 'content' in el && this.isTemplateElement(el) ? (/** @type {?} */ (el)).content : null;
    }
    /**
     * @param {?} el
     * @return {?}
     */
    getOuterHTML(el) { return el.outerHTML; }
    /**
     * @param {?} node
     * @return {?}
     */
    nodeName(node) { return node.nodeName; }
    /**
     * @param {?} node
     * @return {?}
     */
    nodeValue(node) { return node.nodeValue; }
    /**
     * @param {?} node
     * @return {?}
     */
    type(node) { return node.type; }
    /**
     * @param {?} node
     * @return {?}
     */
    content(node) {
        if (this.hasProperty(node, 'content')) {
            return (/** @type {?} */ (node)).content;
        }
        else {
            return node;
        }
    }
    /**
     * @param {?} el
     * @return {?}
     */
    firstChild(el) { return el.firstChild; }
    /**
     * @param {?} el
     * @return {?}
     */
    nextSibling(el) { return el.nextSibling; }
    /**
     * @param {?} el
     * @return {?}
     */
    parentElement(el) { return el.parentNode; }
    /**
     * @param {?} el
     * @return {?}
     */
    childNodes(el) { return el.childNodes; }
    /**
     * @param {?} el
     * @return {?}
     */
    childNodesAsList(el) {
        /** @type {?} */
        const childNodes = el.childNodes;
        /** @type {?} */
        const res = new Array(childNodes.length);
        for (let i = 0; i < childNodes.length; i++) {
            res[i] = childNodes[i];
        }
        return res;
    }
    /**
     * @param {?} el
     * @return {?}
     */
    clearNodes(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
    /**
     * @param {?} el
     * @param {?} node
     * @return {?}
     */
    appendChild(el, node) { el.appendChild(node); }
    /**
     * @param {?} el
     * @param {?} node
     * @return {?}
     */
    removeChild(el, node) { el.removeChild(node); }
    /**
     * @param {?} el
     * @param {?} newChild
     * @param {?} oldChild
     * @return {?}
     */
    replaceChild(el, newChild, oldChild) { el.replaceChild(newChild, oldChild); }
    /**
     * @param {?} node
     * @return {?}
     */
    remove(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return node;
    }
    /**
     * @param {?} parent
     * @param {?} ref
     * @param {?} node
     * @return {?}
     */
    insertBefore(parent, ref, node) { parent.insertBefore(node, ref); }
    /**
     * @param {?} parent
     * @param {?} ref
     * @param {?} nodes
     * @return {?}
     */
    insertAllBefore(parent, ref, nodes) {
        nodes.forEach((n) => parent.insertBefore(n, ref));
    }
    /**
     * @param {?} parent
     * @param {?} ref
     * @param {?} node
     * @return {?}
     */
    insertAfter(parent, ref, node) { parent.insertBefore(node, ref.nextSibling); }
    /**
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    setInnerHTML(el, value) { el.innerHTML = value; }
    /**
     * @param {?} el
     * @return {?}
     */
    getText(el) { return el.textContent; }
    /**
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    setText(el, value) { el.textContent = value; }
    /**
     * @param {?} el
     * @return {?}
     */
    getValue(el) { return el.value; }
    /**
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    setValue(el, value) { el.value = value; }
    /**
     * @param {?} el
     * @return {?}
     */
    getChecked(el) { return el.checked; }
    /**
     * @param {?} el
     * @param {?} value
     * @return {?}
     */
    setChecked(el, value) { el.checked = value; }
    /**
     * @param {?} text
     * @return {?}
     */
    createComment(text) { return this.getDefaultDocument().createComment(text); }
    /**
     * @param {?} html
     * @return {?}
     */
    createTemplate(html) {
        /** @type {?} */
        const t = this.getDefaultDocument().createElement('template');
        t.innerHTML = html;
        return t;
    }
    /**
     * @param {?} tagName
     * @param {?=} doc
     * @return {?}
     */
    createElement(tagName, doc) {
        doc = doc || this.getDefaultDocument();
        return doc.createElement(tagName);
    }
    /**
     * @param {?} ns
     * @param {?} tagName
     * @param {?=} doc
     * @return {?}
     */
    createElementNS(ns, tagName, doc) {
        doc = doc || this.getDefaultDocument();
        return doc.createElementNS(ns, tagName);
    }
    /**
     * @param {?} text
     * @param {?=} doc
     * @return {?}
     */
    createTextNode(text, doc) {
        doc = doc || this.getDefaultDocument();
        return doc.createTextNode(text);
    }
    /**
     * @param {?} attrName
     * @param {?} attrValue
     * @param {?=} doc
     * @return {?}
     */
    createScriptTag(attrName, attrValue, doc) {
        doc = doc || this.getDefaultDocument();
        /** @type {?} */
        const el = /** @type {?} */ (doc.createElement('SCRIPT'));
        el.setAttribute(attrName, attrValue);
        return el;
    }
    /**
     * @param {?} css
     * @param {?=} doc
     * @return {?}
     */
    createStyleElement(css, doc) {
        doc = doc || this.getDefaultDocument();
        /** @type {?} */
        const style = /** @type {?} */ (doc.createElement('style'));
        this.appendChild(style, this.createTextNode(css, doc));
        return style;
    }
    /**
     * @param {?} el
     * @return {?}
     */
    createShadowRoot(el) { return (/** @type {?} */ (el)).createShadowRoot(); }
    /**
     * @param {?} el
     * @return {?}
     */
    getShadowRoot(el) { return (/** @type {?} */ (el)).shadowRoot; }
    /**
     * @param {?} el
     * @return {?}
     */
    getHost(el) { return (/** @type {?} */ (el)).host; }
    /**
     * @param {?} node
     * @return {?}
     */
    clone(node) { return node.cloneNode(true); }
    /**
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    getElementsByClassName(element, name) {
        return element.getElementsByClassName(name);
    }
    /**
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    getElementsByTagName(element, name) {
        return element.getElementsByTagName(name);
    }
    /**
     * @param {?} element
     * @return {?}
     */
    classList(element) { return Array.prototype.slice.call(element.classList, 0); }
    /**
     * @param {?} element
     * @param {?} className
     * @return {?}
     */
    addClass(element, className) { element.classList.add(className); }
    /**
     * @param {?} element
     * @param {?} className
     * @return {?}
     */
    removeClass(element, className) { element.classList.remove(className); }
    /**
     * @param {?} element
     * @param {?} className
     * @return {?}
     */
    hasClass(element, className) {
        return element.classList.contains(className);
    }
    /**
     * @param {?} element
     * @param {?} styleName
     * @param {?} styleValue
     * @return {?}
     */
    setStyle(element, styleName, styleValue) {
        element.style[styleName] = styleValue;
    }
    /**
     * @param {?} element
     * @param {?} stylename
     * @return {?}
     */
    removeStyle(element, stylename) {
        // IE requires '' instead of null
        // see https://github.com/angular/angular/issues/7916
        element.style[stylename] = '';
    }
    /**
     * @param {?} element
     * @param {?} stylename
     * @return {?}
     */
    getStyle(element, stylename) { return element.style[stylename]; }
    /**
     * @param {?} element
     * @param {?} styleName
     * @param {?=} styleValue
     * @return {?}
     */
    hasStyle(element, styleName, styleValue) {
        /** @type {?} */
        const value = this.getStyle(element, styleName) || '';
        return styleValue ? value == styleValue : value.length > 0;
    }
    /**
     * @param {?} element
     * @return {?}
     */
    tagName(element) { return element.tagName; }
    /**
     * @param {?} element
     * @return {?}
     */
    attributeMap(element) {
        /** @type {?} */
        const res = new Map();
        /** @type {?} */
        const elAttrs = element.attributes;
        for (let i = 0; i < elAttrs.length; i++) {
            /** @type {?} */
            const attrib = elAttrs.item(i);
            res.set(attrib.name, attrib.value);
        }
        return res;
    }
    /**
     * @param {?} element
     * @param {?} attribute
     * @return {?}
     */
    hasAttribute(element, attribute) {
        return element.hasAttribute(attribute);
    }
    /**
     * @param {?} element
     * @param {?} ns
     * @param {?} attribute
     * @return {?}
     */
    hasAttributeNS(element, ns, attribute) {
        return element.hasAttributeNS(ns, attribute);
    }
    /**
     * @param {?} element
     * @param {?} attribute
     * @return {?}
     */
    getAttribute(element, attribute) {
        return element.getAttribute(attribute);
    }
    /**
     * @param {?} element
     * @param {?} ns
     * @param {?} name
     * @return {?}
     */
    getAttributeNS(element, ns, name) {
        return element.getAttributeNS(ns, name);
    }
    /**
     * @param {?} element
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setAttribute(element, name, value) { element.setAttribute(name, value); }
    /**
     * @param {?} element
     * @param {?} ns
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setAttributeNS(element, ns, name, value) {
        element.setAttributeNS(ns, name, value);
    }
    /**
     * @param {?} element
     * @param {?} attribute
     * @return {?}
     */
    removeAttribute(element, attribute) { element.removeAttribute(attribute); }
    /**
     * @param {?} element
     * @param {?} ns
     * @param {?} name
     * @return {?}
     */
    removeAttributeNS(element, ns, name) {
        element.removeAttributeNS(ns, name);
    }
    /**
     * @param {?} el
     * @return {?}
     */
    templateAwareRoot(el) { return this.isTemplateElement(el) ? this.content(el) : el; }
    /**
     * @return {?}
     */
    createHtmlDocument() {
        return document.implementation.createHTMLDocument('fakeTitle');
    }
    /**
     * @return {?}
     */
    getDefaultDocument() { return document; }
    /**
     * @param {?} el
     * @return {?}
     */
    getBoundingClientRect(el) {
        try {
            return el.getBoundingClientRect();
        }
        catch (e) {
            return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
        }
    }
    /**
     * @param {?} doc
     * @return {?}
     */
    getTitle(doc) { return doc.title; }
    /**
     * @param {?} doc
     * @param {?} newTitle
     * @return {?}
     */
    setTitle(doc, newTitle) { doc.title = newTitle || ''; }
    /**
     * @param {?} n
     * @param {?} selector
     * @return {?}
     */
    elementMatches(n, selector) {
        if (this.isElementNode(n)) {
            return n.matches && n.matches(selector) ||
                n.msMatchesSelector && n.msMatchesSelector(selector) ||
                n.webkitMatchesSelector && n.webkitMatchesSelector(selector);
        }
        return false;
    }
    /**
     * @param {?} el
     * @return {?}
     */
    isTemplateElement(el) {
        return this.isElementNode(el) && el.nodeName === 'TEMPLATE';
    }
    /**
     * @param {?} node
     * @return {?}
     */
    isTextNode(node) { return node.nodeType === Node.TEXT_NODE; }
    /**
     * @param {?} node
     * @return {?}
     */
    isCommentNode(node) { return node.nodeType === Node.COMMENT_NODE; }
    /**
     * @param {?} node
     * @return {?}
     */
    isElementNode(node) { return node.nodeType === Node.ELEMENT_NODE; }
    /**
     * @param {?} node
     * @return {?}
     */
    hasShadowRoot(node) {
        return node.shadowRoot != null && node instanceof HTMLElement;
    }
    /**
     * @param {?} node
     * @return {?}
     */
    isShadowRoot(node) { return node instanceof DocumentFragment; }
    /**
     * @param {?} node
     * @return {?}
     */
    importIntoDoc(node) { return document.importNode(this.templateAwareRoot(node), true); }
    /**
     * @param {?} node
     * @return {?}
     */
    adoptNode(node) { return document.adoptNode(node); }
    /**
     * @param {?} el
     * @return {?}
     */
    getHref(el) { return /** @type {?} */ ((el.getAttribute('href'))); }
    /**
     * @param {?} event
     * @return {?}
     */
    getEventKey(event) {
        /** @type {?} */
        let key = event.key;
        if (key == null) {
            key = event.keyIdentifier;
            // keyIdentifier is defined in the old draft of DOM Level 3 Events implemented by Chrome and
            // Safari cf
            // http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/events.html#Events-KeyboardEvents-Interfaces
            if (key == null) {
                return 'Unidentified';
            }
            if (key.startsWith('U+')) {
                key = String.fromCharCode(parseInt(key.substring(2), 16));
                if (event.location === DOM_KEY_LOCATION_NUMPAD && _chromeNumKeyPadMap.hasOwnProperty(key)) {
                    // There is a bug in Chrome for numeric keypad keys:
                    // https://code.google.com/p/chromium/issues/detail?id=155654
                    // 1, 2, 3 ... are reported as A, B, C ...
                    key = (/** @type {?} */ (_chromeNumKeyPadMap))[key];
                }
            }
        }
        return _keyMap[key] || key;
    }
    /**
     * @param {?} doc
     * @param {?} target
     * @return {?}
     */
    getGlobalEventTarget(doc, target) {
        if (target === 'window') {
            return window;
        }
        if (target === 'document') {
            return doc;
        }
        if (target === 'body') {
            return doc.body;
        }
        return null;
    }
    /**
     * @return {?}
     */
    getHistory() { return window.history; }
    /**
     * @return {?}
     */
    getLocation() { return window.location; }
    /**
     * @param {?} doc
     * @return {?}
     */
    getBaseHref(doc) {
        /** @type {?} */
        const href = getBaseElementHref();
        return href == null ? null : relativePath(href);
    }
    /**
     * @return {?}
     */
    resetBaseElement() { baseElement = null; }
    /**
     * @return {?}
     */
    getUserAgent() { return window.navigator.userAgent; }
    /**
     * @param {?} element
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setData(element, name, value) {
        this.setAttribute(element, 'data-' + name, value);
    }
    /**
     * @param {?} element
     * @param {?} name
     * @return {?}
     */
    getData(element, name) {
        return this.getAttribute(element, 'data-' + name);
    }
    /**
     * @param {?} element
     * @return {?}
     */
    getComputedStyle(element) { return getComputedStyle(element); }
    /**
     * @return {?}
     */
    supportsWebAnimation() {
        return typeof (/** @type {?} */ (Element)).prototype['animate'] === 'function';
    }
    /**
     * @return {?}
     */
    performanceNow() {
        // performance.now() is not available in all browsers, see
        // http://caniuse.com/#search=performance.now
        return window.performance && window.performance.now ? window.performance.now() :
            new Date().getTime();
    }
    /**
     * @return {?}
     */
    supportsCookies() { return true; }
    /**
     * @param {?} name
     * @return {?}
     */
    getCookie(name) { return parseCookieValue(document.cookie, name); }
    /**
     * @param {?} name
     * @param {?} value
     * @return {?}
     */
    setCookie(name, value) {
        // document.cookie is magical, assigning into it assigns/overrides one cookie value, but does
        // not clear other cookies.
        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    }
}
/** @type {?} */
let baseElement = null;
/**
 * @return {?}
 */
function getBaseElementHref() {
    if (!baseElement) {
        baseElement = /** @type {?} */ ((document.querySelector('base')));
        if (!baseElement) {
            return null;
        }
    }
    return baseElement.getAttribute('href');
}
/** @type {?} */
let urlParsingNode;
/**
 * @param {?} url
 * @return {?}
 */
function relativePath(url) {
    if (!urlParsingNode) {
        urlParsingNode = document.createElement('a');
    }
    urlParsingNode.setAttribute('href', url);
    return (urlParsingNode.pathname.charAt(0) === '/') ? urlParsingNode.pathname :
        '/' + urlParsingNode.pathname;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlcl9hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcGxhdGZvcm0tYnJvd3Nlci9zcmMvYnJvd3Nlci9icm93c2VyX2FkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsT0FBTyxJQUFJLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQzs7QUFFbkUsTUFBTSxjQUFjLEdBQUc7SUFDckIsT0FBTyxFQUFFLFdBQVc7SUFDcEIsV0FBVyxFQUFFLFdBQVc7SUFDeEIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsVUFBVSxFQUFFLFVBQVU7Q0FDdkIsQ0FBQzs7QUFFRixNQUFNLHVCQUF1QixHQUFHLENBQUMsQ0FBQzs7QUFHbEMsTUFBTSxPQUFPLEdBQTBCOzs7SUFHckMsSUFBSSxFQUFFLFdBQVc7SUFDakIsSUFBSSxFQUFFLEtBQUs7SUFDWCxNQUFNLEVBQUUsUUFBUTtJQUNoQixNQUFNLEVBQUUsUUFBUTtJQUNoQixLQUFLLEVBQUUsUUFBUTtJQUNmLEtBQUssRUFBRSxRQUFRO0lBQ2YsTUFBTSxFQUFFLFdBQVc7SUFDbkIsT0FBTyxFQUFFLFlBQVk7SUFDckIsSUFBSSxFQUFFLFNBQVM7SUFDZixNQUFNLEVBQUUsV0FBVztJQUNuQixNQUFNLEVBQUUsYUFBYTtJQUNyQixRQUFRLEVBQUUsWUFBWTtJQUN0QixLQUFLLEVBQUUsSUFBSTtDQUNaLENBQUM7O0FBS0YsTUFBTSxtQkFBbUIsR0FBRztJQUMxQixHQUFHLEVBQUUsR0FBRztJQUNSLEdBQUcsRUFBRSxHQUFHO0lB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LENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekIsR0FBRyxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUM7Q0FDcEYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ybVwYXJzZUNvb2tpZVZhbHVlIGFzIHBhcnNlQ29va2llVmFsdWV9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQge8m1Z2xvYmFsIGFzIGdsb2JhbH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7c2V0Um9vdERvbUFkYXB0ZXJ9IGZyb20gJy4uL2RvbS9kb21fYWRhcHRlcic7XG5cbmltcG9ydCB7R2VuZXJpY0Jyb3dzZXJEb21BZGFwdGVyfSBmcm9tICcuL2dlbmVyaWNfYnJvd3Nlcl9hZGFwdGVyJztcblxuY29uc3QgX2F0dHJUb1Byb3BNYXAgPSB7XG4gICdjbGFzcyc6ICdjbGFzc05hbWUnLFxuICAnaW5uZXJIdG1sJzogJ2lubmVySFRNTCcsXG4gICdyZWFkb25seSc6ICdyZWFkT25seScsXG4gICd0YWJpbmRleCc6ICd0YWJJbmRleCcsXG59O1xuXG5jb25zdCBET01fS0VZX0xPQ0FUSU9OX05VTVBBRCA9IDM7XG5cbi8vIE1hcCB0byBjb252ZXJ0IHNvbWUga2V5IG9yIGtleUlkZW50aWZpZXIgdmFsdWVzIHRvIHdoYXQgd2lsbCBiZSByZXR1cm5lZCBieSBnZXRFdmVudEtleVxuY29uc3QgX2tleU1hcDoge1trOiBzdHJpbmddOiBzdHJpbmd9ID0ge1xuICAvLyBUaGUgZm9sbG93aW5nIHZhbHVlcyBhcmUgaGVyZSBmb3IgY3Jvc3MtYnJvd3NlciBjb21wYXRpYmlsaXR5IGFuZCB0byBtYXRjaCB0aGUgVzNDIHN0YW5kYXJkXG4gIC8vIGNmIGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUV2ZW50cy1rZXkvXG4gICdcXGInOiAnQmFja3NwYWNlJyxcbiAgJ1xcdCc6ICdUYWInLFxuICAnXFx4N0YnOiAnRGVsZXRlJyxcbiAgJ1xceDFCJzogJ0VzY2FwZScsXG4gICdEZWwnOiAnRGVsZXRlJyxcbiAgJ0VzYyc6ICdFc2NhcGUnLFxuICAnTGVmdCc6ICdBcnJvd0xlZnQnLFxuICAnUmlnaHQnOiAnQXJyb3dSaWdodCcsXG4gICdVcCc6ICdBcnJvd1VwJyxcbiAgJ0Rvd24nOiAnQXJyb3dEb3duJyxcbiAgJ01lbnUnOiAnQ29udGV4dE1lbnUnLFxuICAnU2Nyb2xsJzogJ1Njcm9sbExvY2snLFxuICAnV2luJzogJ09TJ1xufTtcblxuLy8gVGhlcmUgaXMgYSBidWcgaW4gQ2hyb21lIGZvciBudW1lcmljIGtleXBhZCBrZXlzOlxuLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTE1NTY1NFxuLy8gMSwgMiwgMyAuLi4gYXJlIHJlcG9ydGVkIGFzIEEsIEIsIEMgLi4uXG5jb25zdCBfY2hyb21lTnVtS2V5UGFkTWFwID0ge1xuICAnQSc6ICcxJyxcbiAgJ0InOiAnMicsXG4gICdDJzogJzMnLFxuICAnRCc6ICc0JyxcbiAgJ0UnOiAnNScsXG4gICdGJzogJzYnLFxuICAnRyc6ICc3JyxcbiAgJ0gnOiAnOCcsXG4gICdJJzogJzknLFxuICAnSic6ICcqJyxcbiAgJ0snOiAnKycsXG4gICdNJzogJy0nLFxuICAnTic6ICcuJyxcbiAgJ08nOiAnLycsXG4gICdcXHg2MCc6ICcwJyxcbiAgJ1xceDkwJzogJ051bUxvY2snXG59O1xuXG5sZXQgbm9kZUNvbnRhaW5zOiAoYTogYW55LCBiOiBhbnkpID0+IGJvb2xlYW47XG5cbmlmIChnbG9iYWxbJ05vZGUnXSkge1xuICBub2RlQ29udGFpbnMgPSBnbG9iYWxbJ05vZGUnXS5wcm90b3R5cGUuY29udGFpbnMgfHwgZnVuY3Rpb24obm9kZSkge1xuICAgIHJldHVybiAhISh0aGlzLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5vZGUpICYgMTYpO1xuICB9O1xufVxuXG4vKipcbiAqIEEgYERvbUFkYXB0ZXJgIHBvd2VyZWQgYnkgZnVsbCBicm93c2VyIERPTSBBUElzLlxuICpcbiAqIEBzZWN1cml0eSBUcmVhZCBjYXJlZnVsbHkhIEludGVyYWN0aW5nIHdpdGggdGhlIERPTSBkaXJlY3RseSBpcyBkYW5nZXJvdXMgYW5kXG4gKiBjYW4gaW50cm9kdWNlIFhTUyByaXNrcy5cbiAqL1xuLyogdHNsaW50OmRpc2FibGU6cmVxdWlyZVBhcmFtZXRlclR5cGUgbm8tY29uc29sZSAqL1xuZXhwb3J0IGNsYXNzIEJyb3dzZXJEb21BZGFwdGVyIGV4dGVuZHMgR2VuZXJpY0Jyb3dzZXJEb21BZGFwdGVyIHtcbiAgcGFyc2UodGVtcGxhdGVIdG1sOiBzdHJpbmcpIHsgdGhyb3cgbmV3IEVycm9yKCdwYXJzZSBub3QgaW1wbGVtZW50ZWQnKTsgfVxuICBzdGF0aWMgbWFrZUN1cnJlbnQoKSB7IHNldFJvb3REb21BZGFwdGVyKG5ldyBCcm93c2VyRG9tQWRhcHRlcigpKTsgfVxuICBoYXNQcm9wZXJ0eShlbGVtZW50OiBOb2RlLCBuYW1lOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIG5hbWUgaW4gZWxlbWVudDsgfVxuICBzZXRQcm9wZXJ0eShlbDogTm9kZSwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7ICg8YW55PmVsKVtuYW1lXSA9IHZhbHVlOyB9XG4gIGdldFByb3BlcnR5KGVsOiBOb2RlLCBuYW1lOiBzdHJpbmcpOiBhbnkgeyByZXR1cm4gKDxhbnk+ZWwpW25hbWVdOyB9XG4gIGludm9rZShlbDogTm9kZSwgbWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IGFueSB7ICg8YW55PmVsKVttZXRob2ROYW1lXSguLi5hcmdzKTsgfVxuXG4gIC8vIFRPRE8odGJvc2NoKTogbW92ZSB0aGlzIGludG8gYSBzZXBhcmF0ZSBlbnZpcm9ubWVudCBjbGFzcyBvbmNlIHdlIGhhdmUgaXRcbiAgbG9nRXJyb3IoZXJyb3I6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh3aW5kb3cuY29uc29sZSkge1xuICAgICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbG9nKGVycm9yOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAod2luZG93LmNvbnNvbGUpIHtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmxvZyAmJiB3aW5kb3cuY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIGxvZ0dyb3VwKGVycm9yOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAod2luZG93LmNvbnNvbGUpIHtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmdyb3VwICYmIHdpbmRvdy5jb25zb2xlLmdyb3VwKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBsb2dHcm91cEVuZCgpOiB2b2lkIHtcbiAgICBpZiAod2luZG93LmNvbnNvbGUpIHtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmdyb3VwRW5kICYmIHdpbmRvdy5jb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGF0dHJUb1Byb3BNYXAoKTogYW55IHsgcmV0dXJuIF9hdHRyVG9Qcm9wTWFwOyB9XG5cbiAgY29udGFpbnMobm9kZUE6IGFueSwgbm9kZUI6IGFueSk6IGJvb2xlYW4geyByZXR1cm4gbm9kZUNvbnRhaW5zLmNhbGwobm9kZUEsIG5vZGVCKTsgfVxuICBxdWVyeVNlbGVjdG9yKGVsOiBIVE1MRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZyk6IGFueSB7IHJldHVybiBlbC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTsgfVxuICBxdWVyeVNlbGVjdG9yQWxsKGVsOiBhbnksIHNlbGVjdG9yOiBzdHJpbmcpOiBhbnlbXSB7IHJldHVybiBlbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTsgfVxuICBvbihlbDogTm9kZSwgZXZ0OiBhbnksIGxpc3RlbmVyOiBhbnkpIHsgZWwuYWRkRXZlbnRMaXN0ZW5lcihldnQsIGxpc3RlbmVyLCBmYWxzZSk7IH1cbiAgb25BbmRDYW5jZWwoZWw6IE5vZGUsIGV2dDogYW55LCBsaXN0ZW5lcjogYW55KTogRnVuY3Rpb24ge1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZ0LCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgIC8vIE5lZWRlZCB0byBmb2xsb3cgRGFydCdzIHN1YnNjcmlwdGlvbiBzZW1hbnRpYywgdW50aWwgZml4IG9mXG4gICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXJ0L2lzc3Vlcy9kZXRhaWw/aWQ9MTc0MDZcbiAgICByZXR1cm4gKCkgPT4geyBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2dCwgbGlzdGVuZXIsIGZhbHNlKTsgfTtcbiAgfVxuICBkaXNwYXRjaEV2ZW50KGVsOiBOb2RlLCBldnQ6IGFueSkgeyBlbC5kaXNwYXRjaEV2ZW50KGV2dCk7IH1cbiAgY3JlYXRlTW91c2VFdmVudChldmVudFR5cGU6IHN0cmluZyk6IE1vdXNlRXZlbnQge1xuICAgIGNvbnN0IGV2dDogTW91c2VFdmVudCA9IHRoaXMuZ2V0RGVmYXVsdERvY3VtZW50KCkuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnQnKTtcbiAgICBldnQuaW5pdEV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgcmV0dXJuIGV2dDtcbiAgfVxuICBjcmVhdGVFdmVudChldmVudFR5cGU6IGFueSk6IEV2ZW50IHtcbiAgICBjb25zdCBldnQ6IEV2ZW50ID0gdGhpcy5nZXREZWZhdWx0RG9jdW1lbnQoKS5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBldnQuaW5pdEV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgcmV0dXJuIGV2dDtcbiAgfVxuICBwcmV2ZW50RGVmYXVsdChldnQ6IEV2ZW50KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnJldHVyblZhbHVlID0gZmFsc2U7XG4gIH1cbiAgaXNQcmV2ZW50ZWQoZXZ0OiBFdmVudCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBldnQuZGVmYXVsdFByZXZlbnRlZCB8fCBldnQucmV0dXJuVmFsdWUgIT0gbnVsbCAmJiAhZXZ0LnJldHVyblZhbHVlO1xuICB9XG4gIGdldElubmVySFRNTChlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmcgeyByZXR1cm4gZWwuaW5uZXJIVE1MOyB9XG4gIGdldFRlbXBsYXRlQ29udGVudChlbDogTm9kZSk6IE5vZGV8bnVsbCB7XG4gICAgcmV0dXJuICdjb250ZW50JyBpbiBlbCAmJiB0aGlzLmlzVGVtcGxhdGVFbGVtZW50KGVsKSA/ICg8YW55PmVsKS5jb250ZW50IDogbnVsbDtcbiAgfVxuICBnZXRPdXRlckhUTUwoZWw6IEhUTUxFbGVtZW50KTogc3RyaW5nIHsgcmV0dXJuIGVsLm91dGVySFRNTDsgfVxuICBub2RlTmFtZShub2RlOiBOb2RlKTogc3RyaW5nIHsgcmV0dXJuIG5vZGUubm9kZU5hbWU7IH1cbiAgbm9kZVZhbHVlKG5vZGU6IE5vZGUpOiBzdHJpbmd8bnVsbCB7IHJldHVybiBub2RlLm5vZGVWYWx1ZTsgfVxuICB0eXBlKG5vZGU6IEhUTUxJbnB1dEVsZW1lbnQpOiBzdHJpbmcgeyByZXR1cm4gbm9kZS50eXBlOyB9XG4gIGNvbnRlbnQobm9kZTogTm9kZSk6IE5vZGUge1xuICAgIGlmICh0aGlzLmhhc1Byb3BlcnR5KG5vZGUsICdjb250ZW50JykpIHtcbiAgICAgIHJldHVybiAoPGFueT5ub2RlKS5jb250ZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gIH1cbiAgZmlyc3RDaGlsZChlbDogTm9kZSk6IE5vZGV8bnVsbCB7IHJldHVybiBlbC5maXJzdENoaWxkOyB9XG4gIG5leHRTaWJsaW5nKGVsOiBOb2RlKTogTm9kZXxudWxsIHsgcmV0dXJuIGVsLm5leHRTaWJsaW5nOyB9XG4gIHBhcmVudEVsZW1lbnQoZWw6IE5vZGUpOiBOb2RlfG51bGwgeyByZXR1cm4gZWwucGFyZW50Tm9kZTsgfVxuICBjaGlsZE5vZGVzKGVsOiBhbnkpOiBOb2RlW10geyByZXR1cm4gZWwuY2hpbGROb2RlczsgfVxuICBjaGlsZE5vZGVzQXNMaXN0KGVsOiBOb2RlKTogYW55W10ge1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBlbC5jaGlsZE5vZGVzO1xuICAgIGNvbnN0IHJlcyA9IG5ldyBBcnJheShjaGlsZE5vZGVzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXNbaV0gPSBjaGlsZE5vZGVzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xuICB9XG4gIGNsZWFyTm9kZXMoZWw6IE5vZGUpIHtcbiAgICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkge1xuICAgICAgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG4gICAgfVxuICB9XG4gIGFwcGVuZENoaWxkKGVsOiBOb2RlLCBub2RlOiBOb2RlKSB7IGVsLmFwcGVuZENoaWxkKG5vZGUpOyB9XG4gIHJlbW92ZUNoaWxkKGVsOiBOb2RlLCBub2RlOiBOb2RlKSB7IGVsLnJlbW92ZUNoaWxkKG5vZGUpOyB9XG4gIHJlcGxhY2VDaGlsZChlbDogTm9kZSwgbmV3Q2hpbGQ6IE5vZGUsIG9sZENoaWxkOiBOb2RlKSB7IGVsLnJlcGxhY2VDaGlsZChuZXdDaGlsZCwgb2xkQ2hpbGQpOyB9XG4gIHJlbW92ZShub2RlOiBOb2RlKTogTm9kZSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuICBpbnNlcnRCZWZvcmUocGFyZW50OiBOb2RlLCByZWY6IE5vZGUsIG5vZGU6IE5vZGUpIHsgcGFyZW50Lmluc2VydEJlZm9yZShub2RlLCByZWYpOyB9XG4gIGluc2VydEFsbEJlZm9yZShwYXJlbnQ6IE5vZGUsIHJlZjogTm9kZSwgbm9kZXM6IE5vZGVbXSkge1xuICAgIG5vZGVzLmZvckVhY2goKG46IGFueSkgPT4gcGFyZW50Lmluc2VydEJlZm9yZShuLCByZWYpKTtcbiAgfVxuICBpbnNlcnRBZnRlcihwYXJlbnQ6IE5vZGUsIHJlZjogTm9kZSwgbm9kZTogYW55KSB7IHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgcmVmLm5leHRTaWJsaW5nKTsgfVxuICBzZXRJbm5lckhUTUwoZWw6IEVsZW1lbnQsIHZhbHVlOiBzdHJpbmcpIHsgZWwuaW5uZXJIVE1MID0gdmFsdWU7IH1cbiAgZ2V0VGV4dChlbDogTm9kZSk6IHN0cmluZ3xudWxsIHsgcmV0dXJuIGVsLnRleHRDb250ZW50OyB9XG4gIHNldFRleHQoZWw6IE5vZGUsIHZhbHVlOiBzdHJpbmcpIHsgZWwudGV4dENvbnRlbnQgPSB2YWx1ZTsgfVxuICBnZXRWYWx1ZShlbDogYW55KTogc3RyaW5nIHsgcmV0dXJuIGVsLnZhbHVlOyB9XG4gIHNldFZhbHVlKGVsOiBhbnksIHZhbHVlOiBzdHJpbmcpIHsgZWwudmFsdWUgPSB2YWx1ZTsgfVxuICBnZXRDaGVja2VkKGVsOiBhbnkpOiBib29sZWFuIHsgcmV0dXJuIGVsLmNoZWNrZWQ7IH1cbiAgc2V0Q2hlY2tlZChlbDogYW55LCB2YWx1ZTogYm9vbGVhbikgeyBlbC5jaGVja2VkID0gdmFsdWU7IH1cbiAgY3JlYXRlQ29tbWVudCh0ZXh0OiBzdHJpbmcpOiBDb21tZW50IHsgcmV0dXJuIHRoaXMuZ2V0RGVmYXVsdERvY3VtZW50KCkuY3JlYXRlQ29tbWVudCh0ZXh0KTsgfVxuICBjcmVhdGVUZW1wbGF0ZShodG1sOiBhbnkpOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgdCA9IHRoaXMuZ2V0RGVmYXVsdERvY3VtZW50KCkuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICB0LmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIHQ7XG4gIH1cbiAgY3JlYXRlRWxlbWVudCh0YWdOYW1lOiBzdHJpbmcsIGRvYz86IERvY3VtZW50KTogSFRNTEVsZW1lbnQge1xuICAgIGRvYyA9IGRvYyB8fCB0aGlzLmdldERlZmF1bHREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgfVxuICBjcmVhdGVFbGVtZW50TlMobnM6IHN0cmluZywgdGFnTmFtZTogc3RyaW5nLCBkb2M/OiBEb2N1bWVudCk6IEVsZW1lbnQge1xuICAgIGRvYyA9IGRvYyB8fCB0aGlzLmdldERlZmF1bHREb2N1bWVudCgpO1xuICAgIHJldHVybiBkb2MuY3JlYXRlRWxlbWVudE5TKG5zLCB0YWdOYW1lKTtcbiAgfVxuICBjcmVhdGVUZXh0Tm9kZSh0ZXh0OiBzdHJpbmcsIGRvYz86IERvY3VtZW50KTogVGV4dCB7XG4gICAgZG9jID0gZG9jIHx8IHRoaXMuZ2V0RGVmYXVsdERvY3VtZW50KCk7XG4gICAgcmV0dXJuIGRvYy5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcbiAgfVxuICBjcmVhdGVTY3JpcHRUYWcoYXR0ck5hbWU6IHN0cmluZywgYXR0clZhbHVlOiBzdHJpbmcsIGRvYz86IERvY3VtZW50KTogSFRNTFNjcmlwdEVsZW1lbnQge1xuICAgIGRvYyA9IGRvYyB8fCB0aGlzLmdldERlZmF1bHREb2N1bWVudCgpO1xuICAgIGNvbnN0IGVsID0gPEhUTUxTY3JpcHRFbGVtZW50PmRvYy5jcmVhdGVFbGVtZW50KCdTQ1JJUFQnKTtcbiAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWx1ZSk7XG4gICAgcmV0dXJuIGVsO1xuICB9XG4gIGNyZWF0ZVN0eWxlRWxlbWVudChjc3M6IHN0cmluZywgZG9jPzogRG9jdW1lbnQpOiBIVE1MU3R5bGVFbGVtZW50IHtcbiAgICBkb2MgPSBkb2MgfHwgdGhpcy5nZXREZWZhdWx0RG9jdW1lbnQoKTtcbiAgICBjb25zdCBzdHlsZSA9IDxIVE1MU3R5bGVFbGVtZW50PmRvYy5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHRoaXMuYXBwZW5kQ2hpbGQoc3R5bGUsIHRoaXMuY3JlYXRlVGV4dE5vZGUoY3NzLCBkb2MpKTtcbiAgICByZXR1cm4gc3R5bGU7XG4gIH1cbiAgY3JlYXRlU2hhZG93Um9vdChlbDogSFRNTEVsZW1lbnQpOiBEb2N1bWVudEZyYWdtZW50IHsgcmV0dXJuICg8YW55PmVsKS5jcmVhdGVTaGFkb3dSb290KCk7IH1cbiAgZ2V0U2hhZG93Um9vdChlbDogSFRNTEVsZW1lbnQpOiBEb2N1bWVudEZyYWdtZW50IHsgcmV0dXJuICg8YW55PmVsKS5zaGFkb3dSb290OyB9XG4gIGdldEhvc3QoZWw6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQgeyByZXR1cm4gKDxhbnk+ZWwpLmhvc3Q7IH1cbiAgY2xvbmUobm9kZTogTm9kZSk6IE5vZGUgeyByZXR1cm4gbm9kZS5jbG9uZU5vZGUodHJ1ZSk7IH1cbiAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShlbGVtZW50OiBhbnksIG5hbWU6IHN0cmluZyk6IEhUTUxFbGVtZW50W10ge1xuICAgIHJldHVybiBlbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUobmFtZSk7XG4gIH1cbiAgZ2V0RWxlbWVudHNCeVRhZ05hbWUoZWxlbWVudDogYW55LCBuYW1lOiBzdHJpbmcpOiBIVE1MRWxlbWVudFtdIHtcbiAgICByZXR1cm4gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShuYW1lKTtcbiAgfVxuICBjbGFzc0xpc3QoZWxlbWVudDogYW55KTogYW55W10geyByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWxlbWVudC5jbGFzc0xpc3QsIDApOyB9XG4gIGFkZENsYXNzKGVsZW1lbnQ6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcpIHsgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7IH1cbiAgcmVtb3ZlQ2xhc3MoZWxlbWVudDogYW55LCBjbGFzc05hbWU6IHN0cmluZykgeyBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTsgfVxuICBoYXNDbGFzcyhlbGVtZW50OiBhbnksIGNsYXNzTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSk7XG4gIH1cbiAgc2V0U3R5bGUoZWxlbWVudDogYW55LCBzdHlsZU5hbWU6IHN0cmluZywgc3R5bGVWYWx1ZTogc3RyaW5nKSB7XG4gICAgZWxlbWVudC5zdHlsZVtzdHlsZU5hbWVdID0gc3R5bGVWYWx1ZTtcbiAgfVxuICByZW1vdmVTdHlsZShlbGVtZW50OiBhbnksIHN0eWxlbmFtZTogc3RyaW5nKSB7XG4gICAgLy8gSUUgcmVxdWlyZXMgJycgaW5zdGVhZCBvZiBudWxsXG4gICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzc5MTZcbiAgICBlbGVtZW50LnN0eWxlW3N0eWxlbmFtZV0gPSAnJztcbiAgfVxuICBnZXRTdHlsZShlbGVtZW50OiBhbnksIHN0eWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIGVsZW1lbnQuc3R5bGVbc3R5bGVuYW1lXTsgfVxuICBoYXNTdHlsZShlbGVtZW50OiBhbnksIHN0eWxlTmFtZTogc3RyaW5nLCBzdHlsZVZhbHVlPzogc3RyaW5nfG51bGwpOiBib29sZWFuIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuZ2V0U3R5bGUoZWxlbWVudCwgc3R5bGVOYW1lKSB8fCAnJztcbiAgICByZXR1cm4gc3R5bGVWYWx1ZSA/IHZhbHVlID09IHN0eWxlVmFsdWUgOiB2YWx1ZS5sZW5ndGggPiAwO1xuICB9XG4gIHRhZ05hbWUoZWxlbWVudDogYW55KTogc3RyaW5nIHsgcmV0dXJuIGVsZW1lbnQudGFnTmFtZTsgfVxuICBhdHRyaWJ1dGVNYXAoZWxlbWVudDogYW55KTogTWFwPHN0cmluZywgc3RyaW5nPiB7XG4gICAgY29uc3QgcmVzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgICBjb25zdCBlbEF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxBdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXR0cmliID0gZWxBdHRycy5pdGVtKGkpO1xuICAgICAgcmVzLnNldChhdHRyaWIubmFtZSwgYXR0cmliLnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxuICBoYXNBdHRyaWJ1dGUoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZWxlbWVudC5oYXNBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgfVxuICBoYXNBdHRyaWJ1dGVOUyhlbGVtZW50OiBFbGVtZW50LCBuczogc3RyaW5nLCBhdHRyaWJ1dGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBlbGVtZW50Lmhhc0F0dHJpYnV0ZU5TKG5zLCBhdHRyaWJ1dGUpO1xuICB9XG4gIGdldEF0dHJpYnV0ZShlbGVtZW50OiBFbGVtZW50LCBhdHRyaWJ1dGU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgICByZXR1cm4gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgfVxuICBnZXRBdHRyaWJ1dGVOUyhlbGVtZW50OiBFbGVtZW50LCBuczogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gICAgcmV0dXJuIGVsZW1lbnQuZ2V0QXR0cmlidXRlTlMobnMsIG5hbWUpO1xuICB9XG4gIHNldEF0dHJpYnV0ZShlbGVtZW50OiBFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHsgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpOyB9XG4gIHNldEF0dHJpYnV0ZU5TKGVsZW1lbnQ6IEVsZW1lbnQsIG5zOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlTlMobnMsIG5hbWUsIHZhbHVlKTtcbiAgfVxuICByZW1vdmVBdHRyaWJ1dGUoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpIHsgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlKTsgfVxuICByZW1vdmVBdHRyaWJ1dGVOUyhlbGVtZW50OiBFbGVtZW50LCBuczogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcbiAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZU5TKG5zLCBuYW1lKTtcbiAgfVxuICB0ZW1wbGF0ZUF3YXJlUm9vdChlbDogTm9kZSk6IGFueSB7IHJldHVybiB0aGlzLmlzVGVtcGxhdGVFbGVtZW50KGVsKSA/IHRoaXMuY29udGVudChlbCkgOiBlbDsgfVxuICBjcmVhdGVIdG1sRG9jdW1lbnQoKTogSFRNTERvY3VtZW50IHtcbiAgICByZXR1cm4gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCdmYWtlVGl0bGUnKTtcbiAgfVxuICBnZXREZWZhdWx0RG9jdW1lbnQoKTogRG9jdW1lbnQgeyByZXR1cm4gZG9jdW1lbnQ7IH1cbiAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsOiBFbGVtZW50KTogYW55IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB7dG9wOiAwLCBib3R0b206IDAsIGxlZnQ6IDAsIHJpZ2h0OiAwLCB3aWR0aDogMCwgaGVpZ2h0OiAwfTtcbiAgICB9XG4gIH1cbiAgZ2V0VGl0bGUoZG9jOiBEb2N1bWVudCk6IHN0cmluZyB7IHJldHVybiBkb2MudGl0bGU7IH1cbiAgc2V0VGl0bGUoZG9jOiBEb2N1bWVudCwgbmV3VGl0bGU6IHN0cmluZykgeyBkb2MudGl0bGUgPSBuZXdUaXRsZSB8fCAnJzsgfVxuICBlbGVtZW50TWF0Y2hlcyhuOiBhbnksIHNlbGVjdG9yOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5pc0VsZW1lbnROb2RlKG4pKSB7XG4gICAgICByZXR1cm4gbi5tYXRjaGVzICYmIG4ubWF0Y2hlcyhzZWxlY3RvcikgfHxcbiAgICAgICAgICBuLm1zTWF0Y2hlc1NlbGVjdG9yICYmIG4ubXNNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpIHx8XG4gICAgICAgICAgbi53ZWJraXRNYXRjaGVzU2VsZWN0b3IgJiYgbi53ZWJraXRNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpc1RlbXBsYXRlRWxlbWVudChlbDogTm9kZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzRWxlbWVudE5vZGUoZWwpICYmIGVsLm5vZGVOYW1lID09PSAnVEVNUExBVEUnO1xuICB9XG4gIGlzVGV4dE5vZGUobm9kZTogTm9kZSk6IGJvb2xlYW4geyByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREU7IH1cbiAgaXNDb21tZW50Tm9kZShub2RlOiBOb2RlKTogYm9vbGVhbiB7IHJldHVybiBub2RlLm5vZGVUeXBlID09PSBOb2RlLkNPTU1FTlRfTk9ERTsgfVxuICBpc0VsZW1lbnROb2RlKG5vZGU6IE5vZGUpOiBib29sZWFuIHsgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFOyB9XG4gIGhhc1NoYWRvd1Jvb3Qobm9kZTogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG5vZGUuc2hhZG93Um9vdCAhPSBudWxsICYmIG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudDtcbiAgfVxuICBpc1NoYWRvd1Jvb3Qobm9kZTogYW55KTogYm9vbGVhbiB7IHJldHVybiBub2RlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudDsgfVxuICBpbXBvcnRJbnRvRG9jKG5vZGU6IE5vZGUpOiBhbnkgeyByZXR1cm4gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0aGlzLnRlbXBsYXRlQXdhcmVSb290KG5vZGUpLCB0cnVlKTsgfVxuICBhZG9wdE5vZGUobm9kZTogTm9kZSk6IGFueSB7IHJldHVybiBkb2N1bWVudC5hZG9wdE5vZGUobm9kZSk7IH1cbiAgZ2V0SHJlZihlbDogRWxlbWVudCk6IHN0cmluZyB7IHJldHVybiBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSAhOyB9XG5cbiAgZ2V0RXZlbnRLZXkoZXZlbnQ6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGtleSA9IGV2ZW50LmtleTtcbiAgICBpZiAoa2V5ID09IG51bGwpIHtcbiAgICAgIGtleSA9IGV2ZW50LmtleUlkZW50aWZpZXI7XG4gICAgICAvLyBrZXlJZGVudGlmaWVyIGlzIGRlZmluZWQgaW4gdGhlIG9sZCBkcmFmdCBvZiBET00gTGV2ZWwgMyBFdmVudHMgaW1wbGVtZW50ZWQgYnkgQ2hyb21lIGFuZFxuICAgICAgLy8gU2FmYXJpIGNmXG4gICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi8yMDA3L1dELURPTS1MZXZlbC0zLUV2ZW50cy0yMDA3MTIyMS9ldmVudHMuaHRtbCNFdmVudHMtS2V5Ym9hcmRFdmVudHMtSW50ZXJmYWNlc1xuICAgICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnVW5pZGVudGlmaWVkJztcbiAgICAgIH1cbiAgICAgIGlmIChrZXkuc3RhcnRzV2l0aCgnVSsnKSkge1xuICAgICAgICBrZXkgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KGtleS5zdWJzdHJpbmcoMiksIDE2KSk7XG4gICAgICAgIGlmIChldmVudC5sb2NhdGlvbiA9PT0gRE9NX0tFWV9MT0NBVElPTl9OVU1QQUQgJiYgX2Nocm9tZU51bUtleVBhZE1hcC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgLy8gVGhlcmUgaXMgYSBidWcgaW4gQ2hyb21lIGZvciBudW1lcmljIGtleXBhZCBrZXlzOlxuICAgICAgICAgIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0xNTU2NTRcbiAgICAgICAgICAvLyAxLCAyLCAzIC4uLiBhcmUgcmVwb3J0ZWQgYXMgQSwgQiwgQyAuLi5cbiAgICAgICAgICBrZXkgPSAoX2Nocm9tZU51bUtleVBhZE1hcCBhcyBhbnkpW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gX2tleU1hcFtrZXldIHx8IGtleTtcbiAgfVxuICBnZXRHbG9iYWxFdmVudFRhcmdldChkb2M6IERvY3VtZW50LCB0YXJnZXQ6IHN0cmluZyk6IEV2ZW50VGFyZ2V0fG51bGwge1xuICAgIGlmICh0YXJnZXQgPT09ICd3aW5kb3cnKSB7XG4gICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbiAgICBpZiAodGFyZ2V0ID09PSAnZG9jdW1lbnQnKSB7XG4gICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAodGFyZ2V0ID09PSAnYm9keScpIHtcbiAgICAgIHJldHVybiBkb2MuYm9keTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgZ2V0SGlzdG9yeSgpOiBIaXN0b3J5IHsgcmV0dXJuIHdpbmRvdy5oaXN0b3J5OyB9XG4gIGdldExvY2F0aW9uKCk6IExvY2F0aW9uIHsgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbjsgfVxuICBnZXRCYXNlSHJlZihkb2M6IERvY3VtZW50KTogc3RyaW5nfG51bGwge1xuICAgIGNvbnN0IGhyZWYgPSBnZXRCYXNlRWxlbWVudEhyZWYoKTtcbiAgICByZXR1cm4gaHJlZiA9PSBudWxsID8gbnVsbCA6IHJlbGF0aXZlUGF0aChocmVmKTtcbiAgfVxuICByZXNldEJhc2VFbGVtZW50KCk6IHZvaWQgeyBiYXNlRWxlbWVudCA9IG51bGw7IH1cbiAgZ2V0VXNlckFnZW50KCk6IHN0cmluZyB7IHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDsgfVxuICBzZXREYXRhKGVsZW1lbnQ6IEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKGVsZW1lbnQsICdkYXRhLScgKyBuYW1lLCB2YWx1ZSk7XG4gIH1cbiAgZ2V0RGF0YShlbGVtZW50OiBFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKGVsZW1lbnQsICdkYXRhLScgKyBuYW1lKTtcbiAgfVxuICBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQ6IGFueSk6IGFueSB7IHJldHVybiBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpOyB9XG4gIC8vIFRPRE8odGJvc2NoKTogbW92ZSB0aGlzIGludG8gYSBzZXBhcmF0ZSBlbnZpcm9ubWVudCBjbGFzcyBvbmNlIHdlIGhhdmUgaXRcbiAgc3VwcG9ydHNXZWJBbmltYXRpb24oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZig8YW55PkVsZW1lbnQpLnByb3RvdHlwZVsnYW5pbWF0ZSddID09PSAnZnVuY3Rpb24nO1xuICB9XG4gIHBlcmZvcm1hbmNlTm93KCk6IG51bWJlciB7XG4gICAgLy8gcGVyZm9ybWFuY2Uubm93KCkgaXMgbm90IGF2YWlsYWJsZSBpbiBhbGwgYnJvd3NlcnMsIHNlZVxuICAgIC8vIGh0dHA6Ly9jYW5pdXNlLmNvbS8jc2VhcmNoPXBlcmZvcm1hbmNlLm5vd1xuICAgIHJldHVybiB3aW5kb3cucGVyZm9ybWFuY2UgJiYgd2luZG93LnBlcmZvcm1hbmNlLm5vdyA/IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxuICBzdXBwb3J0c0Nvb2tpZXMoKTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9XG5cbiAgZ2V0Q29va2llKG5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHsgcmV0dXJuIHBhcnNlQ29va2llVmFsdWUoZG9jdW1lbnQuY29va2llLCBuYW1lKTsgfVxuXG4gIHNldENvb2tpZShuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICAvLyBkb2N1bWVudC5jb29raWUgaXMgbWFnaWNhbCwgYXNzaWduaW5nIGludG8gaXQgYXNzaWducy9vdmVycmlkZXMgb25lIGNvb2tpZSB2YWx1ZSwgYnV0IGRvZXNcbiAgICAvLyBub3QgY2xlYXIgb3RoZXIgY29va2llcy5cbiAgICBkb2N1bWVudC5jb29raWUgPSBlbmNvZGVVUklDb21wb25lbnQobmFtZSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICB9XG59XG5cbmxldCBiYXNlRWxlbWVudDogSFRNTEVsZW1lbnR8bnVsbCA9IG51bGw7XG5mdW5jdGlvbiBnZXRCYXNlRWxlbWVudEhyZWYoKTogc3RyaW5nfG51bGwge1xuICBpZiAoIWJhc2VFbGVtZW50KSB7XG4gICAgYmFzZUVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdiYXNlJykgITtcbiAgICBpZiAoIWJhc2VFbGVtZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpO1xufVxuXG4vLyBiYXNlZCBvbiB1cmxVdGlscy5qcyBpbiBBbmd1bGFySlMgMVxubGV0IHVybFBhcnNpbmdOb2RlOiBhbnk7XG5mdW5jdGlvbiByZWxhdGl2ZVBhdGgodXJsOiBhbnkpOiBzdHJpbmcge1xuICBpZiAoIXVybFBhcnNpbmdOb2RlKSB7XG4gICAgdXJsUGFyc2luZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gIH1cbiAgdXJsUGFyc2luZ05vZGUuc2V0QXR0cmlidXRlKCdocmVmJywgdXJsKTtcbiAgcmV0dXJuICh1cmxQYXJzaW5nTm9kZS5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJykgPyB1cmxQYXJzaW5nTm9kZS5wYXRobmFtZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy8nICsgdXJsUGFyc2luZ05vZGUucGF0aG5hbWU7XG59XG4iXX0=