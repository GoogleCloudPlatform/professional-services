/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NodeDef, ViewData } from './types';
export declare function ngContentDef(ngContentIndex: null | number, index: number): NodeDef;
export declare function appendNgContent(view: ViewData, renderHost: any, def: NodeDef): void;
