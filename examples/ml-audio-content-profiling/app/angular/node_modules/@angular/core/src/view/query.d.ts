/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { QueryList } from '../linker/query_list';
import { NodeDef, NodeFlags, QueryBindingType, QueryValueType, ViewData } from './types';
export declare function queryDef(flags: NodeFlags, id: number, bindings: {
    [propName: string]: QueryBindingType;
}): NodeDef;
export declare function createQuery(): QueryList<any>;
export declare function dirtyParentQueries(view: ViewData): void;
export declare function checkAndUpdateQuery(view: ViewData, nodeDef: NodeDef): void;
export declare function getQueryValue(view: ViewData, nodeDef: NodeDef, queryValueType: QueryValueType): any;
