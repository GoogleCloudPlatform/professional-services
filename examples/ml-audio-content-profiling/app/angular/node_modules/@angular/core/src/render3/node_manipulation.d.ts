/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainer } from './interfaces/container';
import { TContainerNode, TElementContainerNode, TElementNode, TNode, TViewNode } from './interfaces/node';
import { RComment, RElement, RNode, RText, Renderer3 } from './interfaces/renderer';
import { LViewData } from './interfaces/view';
/** Retrieves the parent element of a given node. */
export declare function getParentNative(tNode: TNode, currentView: LViewData): RElement | RComment | null;
/**
 * Gets the host element given a view. Will return null if the current view is an embedded view,
 * which does not have a host element.
 */
export declare function getHostNative(currentView: LViewData): RElement | null;
export declare function getLContainer(tNode: TViewNode, embeddedView: LViewData): LContainer | null;
/**
 * Retrieves render parent for a given view.
 * Might be null if a view is not yet attached to any container.
 */
export declare function getContainerRenderParent(tViewNode: TViewNode, view: LViewData): RElement | null;
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param lViewData LViewData for which we want a host element node
 * @returns The host node
 */
export declare function findComponentView(lViewData: LViewData): LViewData;
export declare function createTextNode(value: any, renderer: Renderer3): RText;
/**
 * Adds or removes all DOM elements associated with a view.
 *
 * Because some root nodes of the view may be containers, we sometimes need
 * to propagate deeply into the nested containers to remove all elements in the
 * views beneath it.
 *
 * @param viewToWalk The view from which elements should be added or removed
 * @param insertMode Whether or not elements should be added (if false, removing)
 * @param beforeNode The node before which elements should be added, if insert mode
 */
export declare function addRemoveViewFromContainer(viewToWalk: LViewData, insertMode: true, beforeNode: RNode | null): void;
export declare function addRemoveViewFromContainer(viewToWalk: LViewData, insertMode: false): void;
/**
 * Traverses down and up the tree of views and containers to remove listeners and
 * call onDestroy callbacks.
 *
 * Notes:
 *  - Because it's used for onDestroy calls, it needs to be bottom-up.
 *  - Must process containers instead of their views to avoid splicing
 *  when views are destroyed and re-added.
 *  - Using a while loop because it's faster than recursion
 *  - Destroy only called on movement to sibling or movement to parent (laterally or up)
 *
 *  @param rootView The view to destroy
 */
export declare function destroyViewTree(rootView: LViewData): void;
/**
 * Inserts a view into a container.
 *
 * This adds the view to the container's array of active views in the correct
 * position. It also adds the view's elements to the DOM if the container isn't a
 * root node of another view (in that case, the view's elements will be added when
 * the container's parent view is added later).
 *
 * @param lView The view to insert
 * @param lContainer The container into which the view should be inserted
 * @param parentView The new parent of the inserted view
 * @param index The index at which to insert the view
 * @param containerIndex The index of the container node, if dynamic
 */
export declare function insertView(lView: LViewData, lContainer: LContainer, parentView: LViewData, index: number, containerIndex: number): void;
/**
 * Detaches a view from a container.
 *
 * This method splices the view from the container's array of active views. It also
 * removes the view's elements from the DOM.
 *
 * @param lContainer The container from which to detach a view
 * @param removeIndex The index of the view to detach
 * @param detached Whether or not this view is already detached.
 */
export declare function detachView(lContainer: LContainer, removeIndex: number, detached: boolean): void;
/**
 * Removes a view from a container, i.e. detaches it and then destroys the underlying LView.
 *
 * @param lContainer The container from which to remove a view
 * @param tContainer The TContainer node associated with the LContainer
 * @param removeIndex The index of the view to remove
 */
export declare function removeView(lContainer: LContainer, containerHost: TElementNode | TContainerNode | TElementContainerNode, removeIndex: number): void;
/** Gets the child of the given LViewData */
export declare function getLViewChild(viewData: LViewData): LViewData | LContainer | null;
/**
 * A standalone function which destroys an LView,
 * conducting cleanup (e.g. removing listeners, calling onDestroys).
 *
 * @param view The view to be destroyed.
 */
export declare function destroyLView(view: LViewData): void;
/**
 * Determines which LViewOrLContainer to jump to when traversing back up the
 * tree in destroyViewTree.
 *
 * Normally, the view's parent LView should be checked, but in the case of
 * embedded views, the container (which is the view node's parent, but not the
 * LView's parent) needs to be checked for a possible next property.
 *
 * @param state The LViewOrLContainer for which we need a parent state
 * @param rootView The rootView, so we don't propagate too far up the view tree
 * @returns The correct parent LViewOrLContainer
 */
export declare function getParentState(state: LViewData | LContainer, rootView: LViewData): LViewData | LContainer | null;
export declare function getRenderParent(tNode: TNode, currentView: LViewData): RElement | null;
/**
 * Returns whether a native element can be inserted into the given parent.
 *
 * There are two reasons why we may not be able to insert a element immediately.
 * - Projection: When creating a child content element of a component, we have to skip the
 *   insertion because the content of a component will be projected.
 *   `<component><content>delayed due to projection</content></component>`
 * - Parent container is disconnected: This can happen when we are inserting a view into
 *   parent container, which itself is disconnected. For example the parent container is part
 *   of a View which has not be inserted or is mare for projection but has not been inserted
 *   into destination.
 *

 *
 * @param parent The parent where the child will be inserted into.
 * @param currentView Current LView being processed.
 * @return boolean Whether the child should be inserted now (or delayed until later).
 */
export declare function canInsertNativeNode(tNode: TNode, currentView: LViewData): boolean;
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {@link canInsertNativeNode}.
 *
 * @param childEl The child that should be appended
 * @param childTNode The TNode of the child element
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export declare function appendChild(childEl: RNode | null, childTNode: TNode, currentView: LViewData): boolean;
export declare function getBeforeNodeForView(index: number, views: LViewData[], containerNative: RComment): RComment;
/**
 * Removes the `child` element from the DOM if not in view and not projected.
 *
 * @param childTNode The TNode of the child to remove
 * @param childEl The child that should be removed
 * @param currentView The current LView
 * @returns Whether or not the child was removed
 */
export declare function removeChild(childTNode: TNode, childEl: RNode | null, currentView: LViewData): boolean;
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param projectedTNode The TNode to be projected
 * @param tProjectionNode The projection (ng-content) TNode
 * @param currentView Current LView
 * @param projectionView Projection view (view above current)
 */
export declare function appendProjectedNode(projectedTNode: TNode, tProjectionNode: TNode, currentView: LViewData, projectionView: LViewData): void;
