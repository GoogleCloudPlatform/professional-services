/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TNode } from './interfaces/node';
/** Called when directives inject each other (creating a circular dependency) */
export declare function throwCyclicDependencyError(token: any): never;
/** Called when there are multiple component selectors that match a given node */
export declare function throwMultipleComponentError(tNode: TNode): never;
/** Throws an ExpressionChangedAfterChecked error if checkNoChanges mode is on. */
export declare function throwErrorIfNoChangesMode(creationMode: boolean, checkNoChangesMode: boolean, oldValue: any, currValue: any): never | void;
