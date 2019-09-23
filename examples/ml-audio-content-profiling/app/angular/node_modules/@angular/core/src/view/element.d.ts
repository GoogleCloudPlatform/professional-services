/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RendererType2 } from '../render/api';
import { SecurityContext } from '../sanitization/security';
import { BindingFlags, ElementData, ElementHandleEventFn, NodeDef, NodeFlags, QueryValueType, ViewData, ViewDefinitionFactory } from './types';
export declare function anchorDef(flags: NodeFlags, matchedQueriesDsl: null | [string | number, QueryValueType][], ngContentIndex: null | number, childCount: number, handleEvent?: null | ElementHandleEventFn, templateFactory?: ViewDefinitionFactory): NodeDef;
export declare function elementDef(checkIndex: number, flags: NodeFlags, matchedQueriesDsl: null | [string | number, QueryValueType][], ngContentIndex: null | number, childCount: number, namespaceAndName: string | null, fixedAttrs?: null | [string, string][], bindings?: null | [BindingFlags, string, string | SecurityContext | null][], outputs?: null | ([string, string])[], handleEvent?: null | ElementHandleEventFn, componentView?: null | ViewDefinitionFactory, componentRendererType?: RendererType2 | null): NodeDef;
export declare function createElement(view: ViewData, renderHost: any, def: NodeDef): ElementData;
export declare function listenToElementOutputs(view: ViewData, compView: ViewData, def: NodeDef, el: any): void;
export declare function checkAndUpdateElementInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): boolean;
export declare function checkAndUpdateElementDynamic(view: ViewData, def: NodeDef, values: any[]): boolean;
