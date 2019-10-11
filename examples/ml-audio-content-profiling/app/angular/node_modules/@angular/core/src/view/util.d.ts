/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
import { RendererType2 } from '../render/api';
import { BindingDef, BindingFlags, Definition, DefinitionFactory, DepDef, DepFlags, ElementData, NodeDef, QueryValueType, ViewData } from './types';
export declare const NOOP: any;
export declare function tokenKey(token: any): string;
export declare function unwrapValue(view: ViewData, nodeIdx: number, bindingIdx: number, value: any): any;
export declare function createRendererType2(values: {
    styles: (string | any[])[];
    encapsulation: ViewEncapsulation;
    data: {
        [kind: string]: any[];
    };
}): RendererType2;
export declare function resolveRendererType2(type?: RendererType2 | null): RendererType2 | null;
export declare function checkBinding(view: ViewData, def: NodeDef, bindingIdx: number, value: any): boolean;
export declare function checkAndUpdateBinding(view: ViewData, def: NodeDef, bindingIdx: number, value: any): boolean;
export declare function checkBindingNoChanges(view: ViewData, def: NodeDef, bindingIdx: number, value: any): void;
export declare function markParentViewsForCheck(view: ViewData): void;
export declare function markParentViewsForCheckProjectedViews(view: ViewData, endView: ViewData): void;
export declare function dispatchEvent(view: ViewData, nodeIndex: number, eventName: string, event: any): boolean | undefined;
export declare function declaredViewContainer(view: ViewData): ElementData | null;
/**
 * for component views, this is the host element.
 * for embedded views, this is the index of the parent node
 * that contains the view container.
 */
export declare function viewParentEl(view: ViewData): NodeDef | null;
export declare function renderNode(view: ViewData, def: NodeDef): any;
export declare function elementEventFullName(target: string | null, name: string): string;
export declare function isComponentView(view: ViewData): boolean;
export declare function isEmbeddedView(view: ViewData): boolean;
export declare function filterQueryId(queryId: number): number;
export declare function splitMatchedQueriesDsl(matchedQueriesDsl: [string | number, QueryValueType][] | null): {
    matchedQueries: {
        [queryId: string]: QueryValueType;
    };
    references: {
        [refId: string]: QueryValueType;
    };
    matchedQueryIds: number;
};
export declare function splitDepsDsl(deps: ([DepFlags, any] | any)[], sourceName?: string): DepDef[];
export declare function getParentRenderElement(view: ViewData, renderHost: any, def: NodeDef): any;
export declare function resolveDefinition<D extends Definition<any>>(factory: DefinitionFactory<D>): D;
export declare function rootRenderNodes(view: ViewData): any[];
export declare const enum RenderNodeAction {
    Collect = 0,
    AppendChild = 1,
    InsertBefore = 2,
    RemoveChild = 3
}
export declare function visitRootRenderNodes(view: ViewData, action: RenderNodeAction, parentNode: any, nextSibling: any, target?: any[]): void;
export declare function visitSiblingRenderNodes(view: ViewData, action: RenderNodeAction, startIndex: number, endIndex: number, parentNode: any, nextSibling: any, target?: any[]): void;
export declare function visitProjectedRenderNodes(view: ViewData, ngContentIndex: number, action: RenderNodeAction, parentNode: any, nextSibling: any, target?: any[]): void;
export declare function splitNamespace(name: string): string[];
export declare function calcBindingFlags(bindings: BindingDef[]): BindingFlags;
export declare function interpolate(valueCount: number, constAndInterp: string[]): string;
export declare function inlineInterpolate(valueCount: number, c0: string, a1: any, c1: string, a2?: any, c2?: string, a3?: any, c3?: string, a4?: any, c4?: string, a5?: any, c5?: string, a6?: any, c6?: string, a7?: any, c7?: string, a8?: any, c8?: string, a9?: any, c9?: string): string;
export declare const EMPTY_ARRAY: any[];
export declare const EMPTY_MAP: {
    [key: string]: any;
};
