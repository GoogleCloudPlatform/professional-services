import { ɵAnimationEngine as AnimationEngine } from '@angular/animations/browser';
import { NgZone, Renderer2, RendererFactory2, RendererStyleFlags2, RendererType2 } from '@angular/core';
export declare class AnimationRendererFactory implements RendererFactory2 {
    private delegate;
    private engine;
    private _zone;
    private _currentId;
    private _microtaskId;
    private _animationCallbacksBuffer;
    private _rendererCache;
    private _cdRecurDepth;
    private promise;
    constructor(delegate: RendererFactory2, engine: AnimationEngine, _zone: NgZone);
    createRenderer(hostElement: any, type: RendererType2): Renderer2;
    begin(): void;
    private _scheduleCountTask;
    end(): void;
    whenRenderingDone(): Promise<any>;
}
export declare class BaseAnimationRenderer implements Renderer2 {
    protected namespaceId: string;
    delegate: Renderer2;
    engine: AnimationEngine;
    constructor(namespaceId: string, delegate: Renderer2, engine: AnimationEngine);
    readonly data: {
        [key: string]: any;
    };
    destroyNode: ((n: any) => void) | null;
    destroy(): void;
    createElement(name: string, namespace?: string | null | undefined): any;
    createComment(value: string): any;
    createText(value: string): any;
    appendChild(parent: any, newChild: any): void;
    insertBefore(parent: any, newChild: any, refChild: any): void;
    removeChild(parent: any, oldChild: any): void;
    selectRootElement(selectorOrNode: any, preserveContent?: boolean): any;
    parentNode(node: any): any;
    nextSibling(node: any): any;
    setAttribute(el: any, name: string, value: string, namespace?: string | null | undefined): void;
    removeAttribute(el: any, name: string, namespace?: string | null | undefined): void;
    addClass(el: any, name: string): void;
    removeClass(el: any, name: string): void;
    setStyle(el: any, style: string, value: any, flags?: RendererStyleFlags2 | undefined): void;
    removeStyle(el: any, style: string, flags?: RendererStyleFlags2 | undefined): void;
    setProperty(el: any, name: string, value: any): void;
    setValue(node: any, value: string): void;
    listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void;
    protected disableAnimations(element: any, value: boolean): void;
}
export declare class AnimationRenderer extends BaseAnimationRenderer implements Renderer2 {
    factory: AnimationRendererFactory;
    constructor(factory: AnimationRendererFactory, namespaceId: string, delegate: Renderer2, engine: AnimationEngine);
    setProperty(el: any, name: string, value: any): void;
    listen(target: 'window' | 'document' | 'body' | any, eventName: string, callback: (event: any) => any): () => void;
}
