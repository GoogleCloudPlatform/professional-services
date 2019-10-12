/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FilePredicate, Tree } from './interface';
import { VirtualTree } from './virtual';
export declare class FilteredTree extends VirtualTree {
    constructor(tree: Tree, filter?: FilePredicate<boolean>);
}
