/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Renderer2, RendererFactory2, RendererStyleFlags2, RendererType2 } from '../render/api';
import { DebugContext } from './types';
export declare function initServicesIfNeeded(): void;
export declare function getCurrentDebugContext(): DebugContext | null;
export declare class DebugRendererFactory2 implements RendererFactory2 {
    private delegate;
    constructor(delegate: RendererFactory2);
    createRenderer(element: any, renderData: RendererType2 | null): Renderer2;
    begin(): void;
    end(): void;
    whenRenderingDone(): Promise<any>;
}
export declare class DebugRenderer2 implements Renderer2 {
    private delegate;
    readonly data: {
        [key: string]: any;
    };
    private createDebugContext;
    /**
     * Factory function used to create a `DebugContext` when a node is created.
     *
     * The `DebugContext` allows to retrieve information about the nodes that are useful in tests.
     *
     * The factory is configurable so that the `DebugRenderer2` could instantiate either a View Engine
     * or a Render context.
     */
    debugContextFactory: (nativeElement?: any) => DebugContext | null;
    constructor(delegate: Renderer2);
    destroyNode(node: any): void;
    destroy(): void;
    createElement(name: string, namespace?: string): any;
    createComment(value: string): any;
    createText(value: string): any;
    appendChild(parent: any, newChild: any): void;
    insertBefore(parent: any, newChild: any, refChild: any): void;
    removeChild(parent: any, oldChild: any): void;
    selectRootElement(selectorOrNode: string | any, preserveContent?: boolean): any;
    setAttribute(el: any, name: string, value: string, namespace?: string): void;
    removeAttribute(el: any, name: string, namespace?: string): void;
    addClass(el: any, name: string): void;
    removeClass(el: any, name: string): void;
    setStyle(el: any, style: string, value: any, flags: RendererStyleFlags2): void;
    removeStyle(el: any, style: string, flags: RendererStyleFlags2): void;
    setProperty(el: any, name: string, value: any): void;
    listen(target: 'document' | 'windows' | 'body' | any, eventName: string, callback: (event: any) => boolean): () => void;
    parentNode(node: any): any;
    nextSibling(node: any): any;
    setValue(node: any, value: string): void;
}
