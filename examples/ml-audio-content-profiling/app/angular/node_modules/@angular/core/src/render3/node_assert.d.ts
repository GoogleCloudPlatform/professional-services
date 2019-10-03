/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TNode, TNodeType } from './interfaces/node';
export declare function assertNodeType(tNode: TNode, type: TNodeType): void;
export declare function assertNodeOfPossibleTypes(tNode: TNode, ...types: TNodeType[]): void;
