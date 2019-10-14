/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainer } from './interfaces/container';
import { LContext } from './interfaces/context';
import { TNode } from './interfaces/node';
import { RComment, RElement, RText } from './interfaces/renderer';
import { StylingContext } from './interfaces/styling';
import { LViewData, RootContext, TData } from './interfaces/view';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 */
export declare function isDifferent(a: any, b: any, checkNoChangesMode: boolean): boolean;
export declare function stringify(value: any): string;
/**
 * Flattens an array in non-recursive way. Input arrays are not modified.
 */
export declare function flatten(list: any[]): any[];
/** Retrieves a value from any `LViewData` or `TData`. */
export declare function loadInternal<T>(index: number, arr: LViewData | TData): T;
export declare function assertDataInRangeInternal(index: number, arr: any[]): void;
/**
 * Takes the value of a slot in `LViewData` and returns the element node.
 *
 * Normally, element nodes are stored flat, but if the node has styles/classes on it,
 * it might be wrapped in a styling context. Or if that node has a directive that injects
 * ViewContainerRef, it may be wrapped in an LContainer. Or if that node is a component,
 * it will be wrapped in LViewData. It could even have all three, so we keep looping
 * until we find something that isn't an array.
 *
 * @param value The initial value in `LViewData`
 */
export declare function readElementValue(value: RElement | StylingContext | LContainer | LViewData): RElement;
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 */
export declare function getNativeByIndex(index: number, arr: LViewData): RElement;
export declare function getNativeByTNode(tNode: TNode, hostView: LViewData): RElement | RText | RComment;
export declare function getTNode(index: number, view: LViewData): TNode;
export declare function getComponentViewByIndex(nodeIndex: number, hostView: LViewData): LViewData;
export declare function isContentQueryHost(tNode: TNode): boolean;
export declare function isComponent(tNode: TNode): boolean;
export declare function isLContainer(value: RElement | RComment | LContainer | StylingContext): boolean;
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param component any component
 */
export declare function getRootView(target: LViewData | {}): LViewData;
export declare function getRootContext(viewOrComponent: LViewData | {}): RootContext;
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export declare function readPatchedData(target: any): LViewData | LContext | null;
export declare function readPatchedLViewData(target: any): LViewData | null;
