/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { GenericBrowserDomAdapter } from './generic_browser_adapter';
/**
 * A `DomAdapter` powered by full browser DOM APIs.
 *
 * @security Tread carefully! Interacting with the DOM directly is dangerous and
 * can introduce XSS risks.
 */
export declare class BrowserDomAdapter extends GenericBrowserDomAdapter {
    parse(templateHtml: string): void;
    static makeCurrent(): void;
    hasProperty(element: Node, name: string): boolean;
    setProperty(el: Node, name: string, value: any): void;
    getProperty(el: Node, name: string): any;
    invoke(el: Node, methodName: string, args: any[]): any;
    logError(error: string): void;
    log(error: string): void;
    logGroup(error: string): void;
    logGroupEnd(): void;
    readonly attrToPropMap: any;
    contains(nodeA: any, nodeB: any): boolean;
    querySelector(el: HTMLElement, selector: string): any;
    querySelectorAll(el: any, selector: string): any[];
    on(el: Node, evt: any, listener: any): void;
    onAndCancel(el: Node, evt: any, listener: any): Function;
    dispatchEvent(el: Node, evt: any): void;
    createMouseEvent(eventType: string): MouseEvent;
    createEvent(eventType: any): Event;
    preventDefault(evt: Event): void;
    isPrevented(evt: Event): boolean;
    getInnerHTML(el: HTMLElement): string;
    getTemplateContent(el: Node): Node | null;
    getOuterHTML(el: HTMLElement): string;
    nodeName(node: Node): string;
    nodeValue(node: Node): string | null;
    type(node: HTMLInputElement): string;
    content(node: Node): Node;
    firstChild(el: Node): Node | null;
    nextSibling(el: Node): Node | null;
    parentElement(el: Node): Node | null;
    childNodes(el: any): Node[];
    childNodesAsList(el: Node): any[];
    clearNodes(el: Node): void;
    appendChild(el: Node, node: Node): void;
    removeChild(el: Node, node: Node): void;
    replaceChild(el: Node, newChild: Node, oldChild: Node): void;
    remove(node: Node): Node;
    insertBefore(parent: Node, ref: Node, node: Node): void;
    insertAllBefore(parent: Node, ref: Node, nodes: Node[]): void;
    insertAfter(parent: Node, ref: Node, node: any): void;
    setInnerHTML(el: Element, value: string): void;
    getText(el: Node): string | null;
    setText(el: Node, value: string): void;
    getValue(el: any): string;
    setValue(el: any, value: string): void;
    getChecked(el: any): boolean;
    setChecked(el: any, value: boolean): void;
    createComment(text: string): Comment;
    createTemplate(html: any): HTMLElement;
    createElement(tagName: string, doc?: Document): HTMLElement;
    createElementNS(ns: string, tagName: string, doc?: Document): Element;
    createTextNode(text: string, doc?: Document): Text;
    createScriptTag(attrName: string, attrValue: string, doc?: Document): HTMLScriptElement;
    createStyleElement(css: string, doc?: Document): HTMLStyleElement;
    createShadowRoot(el: HTMLElement): DocumentFragment;
    getShadowRoot(el: HTMLElement): DocumentFragment;
    getHost(el: HTMLElement): HTMLElement;
    clone(node: Node): Node;
    getElementsByClassName(element: any, name: string): HTMLElement[];
    getElementsByTagName(element: any, name: string): HTMLElement[];
    classList(element: any): any[];
    addClass(element: any, className: string): void;
    removeClass(element: any, className: string): void;
    hasClass(element: any, className: string): boolean;
    setStyle(element: any, styleName: string, styleValue: string): void;
    removeStyle(element: any, stylename: string): void;
    getStyle(element: any, stylename: string): string;
    hasStyle(element: any, styleName: string, styleValue?: string | null): boolean;
    tagName(element: any): string;
    attributeMap(element: any): Map<string, string>;
    hasAttribute(element: Element, attribute: string): boolean;
    hasAttributeNS(element: Element, ns: string, attribute: string): boolean;
    getAttribute(element: Element, attribute: string): string | null;
    getAttributeNS(element: Element, ns: string, name: string): string | null;
    setAttribute(element: Element, name: string, value: string): void;
    setAttributeNS(element: Element, ns: string, name: string, value: string): void;
    removeAttribute(element: Element, attribute: string): void;
    removeAttributeNS(element: Element, ns: string, name: string): void;
    templateAwareRoot(el: Node): any;
    createHtmlDocument(): HTMLDocument;
    getDefaultDocument(): Document;
    getBoundingClientRect(el: Element): any;
    getTitle(doc: Document): string;
    setTitle(doc: Document, newTitle: string): void;
    elementMatches(n: any, selector: string): boolean;
    isTemplateElement(el: Node): boolean;
    isTextNode(node: Node): boolean;
    isCommentNode(node: Node): boolean;
    isElementNode(node: Node): boolean;
    hasShadowRoot(node: any): boolean;
    isShadowRoot(node: any): boolean;
    importIntoDoc(node: Node): any;
    adoptNode(node: Node): any;
    getHref(el: Element): string;
    getEventKey(event: any): string;
    getGlobalEventTarget(doc: Document, target: string): EventTarget | null;
    getHistory(): History;
    getLocation(): Location;
    getBaseHref(doc: Document): string | null;
    resetBaseElement(): void;
    getUserAgent(): string;
    setData(element: Element, name: string, value: string): void;
    getData(element: Element, name: string): string | null;
    getComputedStyle(element: any): any;
    supportsWebAnimation(): boolean;
    performanceNow(): number;
    supportsCookies(): boolean;
    getCookie(name: string): string | null;
    setCookie(name: string, value: string): void;
}
