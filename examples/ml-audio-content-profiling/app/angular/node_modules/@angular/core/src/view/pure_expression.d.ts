/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NodeDef, PureExpressionData, ViewData } from './types';
export declare function purePipeDef(checkIndex: number, argCount: number): NodeDef;
export declare function pureArrayDef(checkIndex: number, argCount: number): NodeDef;
export declare function pureObjectDef(checkIndex: number, propToIndex: {
    [p: string]: number;
}): NodeDef;
export declare function createPureExpression(view: ViewData, def: NodeDef): PureExpressionData;
export declare function checkAndUpdatePureExpressionInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): boolean;
export declare function checkAndUpdatePureExpressionDynamic(view: ViewData, def: NodeDef, values: any[]): boolean;
