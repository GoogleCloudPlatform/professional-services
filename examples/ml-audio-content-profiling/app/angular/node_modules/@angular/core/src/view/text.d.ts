/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NodeDef, TextData, ViewData } from './types';
export declare function textDef(checkIndex: number, ngContentIndex: number | null, staticText: string[]): NodeDef;
export declare function createText(view: ViewData, renderHost: any, def: NodeDef): TextData;
export declare function checkAndUpdateTextInline(view: ViewData, def: NodeDef, v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any): boolean;
export declare function checkAndUpdateTextDynamic(view: ViewData, def: NodeDef, values: any[]): boolean;
