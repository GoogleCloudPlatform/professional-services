/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di';
import { DebugContext } from '../view/index';
export declare class EventListener {
    name: string;
    callback: Function;
    constructor(name: string, callback: Function);
}
/**
 * @publicApi
 */
export declare class DebugNode {
    nativeNode: any;
    private _debugContext;
    listeners: EventListener[];
    parent: DebugElement | null;
    constructor(nativeNode: any, parent: DebugNode | null, _debugContext: DebugContext);
    readonly injector: Injector;
    readonly componentInstance: any;
    readonly context: any;
    readonly references: {
        [key: string]: any;
    };
    readonly providerTokens: any[];
}
/**
 * @publicApi
 */
export declare class DebugElement extends DebugNode {
    name: string;
    properties: {
        [key: string]: any;
    };
    attributes: {
        [key: string]: string | null;
    };
    classes: {
        [key: string]: boolean;
    };
    styles: {
        [key: string]: string | null;
    };
    childNodes: DebugNode[];
    nativeElement: any;
    constructor(nativeNode: any, parent: any, _debugContext: DebugContext);
    addChild(child: DebugNode): void;
    removeChild(child: DebugNode): void;
    insertChildrenAfter(child: DebugNode, newChildren: DebugNode[]): void;
    insertBefore(refChild: DebugNode, newChild: DebugNode): void;
    query(predicate: Predicate<DebugElement>): DebugElement;
    queryAll(predicate: Predicate<DebugElement>): DebugElement[];
    queryAllNodes(predicate: Predicate<DebugNode>): DebugNode[];
    readonly children: DebugElement[];
    triggerEventHandler(eventName: string, eventObj: any): void;
}
/**
 * @publicApi
 */
export declare function asNativeElements(debugEls: DebugElement[]): any;
/**
 * @publicApi
 */
export declare function getDebugNode(nativeNode: any): DebugNode | null;
export declare function getAllDebugNodes(): DebugNode[];
export declare function indexDebugNode(node: DebugNode): void;
export declare function removeDebugNodeFromIndex(node: DebugNode): void;
/**
 * A boolean-valued function over a value, possibly including context information
 * regarding that value's position in an array.
 *
 * @publicApi
 */
export interface Predicate<T> {
    (value: T): boolean;
}
