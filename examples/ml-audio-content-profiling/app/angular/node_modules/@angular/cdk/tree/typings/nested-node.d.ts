/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, IterableDiffers, OnDestroy, QueryList } from '@angular/core';
import { CdkTreeNodeOutlet } from './outlet';
import { CdkTree, CdkTreeNode } from './tree';
/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * For example:
 *   ```html
 *   <cdk-nested-tree-node>
 *     {{node.name}}
 *     <ng-template cdkTreeNodeOutlet></ng-template>
 *   </cdk-nested-tree-node>
 *   ```
 * The children of node will be automatically added to `cdkTreeNodeOutlet`, the result dom will be
 * like this:
 *   ```html
 *   <cdk-nested-tree-node>
 *     {{node.name}}
 *      <cdk-nested-tree-node>{{child1.name}}</cdk-nested-tree-node>
 *      <cdk-nested-tree-node>{{child2.name}}</cdk-nested-tree-node>
 *   </cdk-nested-tree-node>
 *   ```
 */
export declare class CdkNestedTreeNode<T> extends CdkTreeNode<T> implements AfterContentInit, OnDestroy {
    protected _elementRef: ElementRef<HTMLElement>;
    protected _tree: CdkTree<T>;
    protected _differs: IterableDiffers;
    /** Differ used to find the changes in the data provided by the data source. */
    private _dataDiffer;
    /** The children data dataNodes of current node. They will be placed in `CdkTreeNodeOutlet`. */
    protected _children: T[];
    /** The children node placeholder. */
    nodeOutlet: QueryList<CdkTreeNodeOutlet>;
    constructor(_elementRef: ElementRef<HTMLElement>, _tree: CdkTree<T>, _differs: IterableDiffers);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Add children dataNodes to the NodeOutlet */
    protected updateChildrenNodes(children?: T[]): void;
    /** Clear the children dataNodes. */
    protected _clear(): void;
    /** Gets the outlet for the current node. */
    private _getNodeOutlet;
}
