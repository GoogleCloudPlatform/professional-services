/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef } from '@angular/core';
import { DragDropRegistry } from './drag-drop-registry';
import { Direction } from '@angular/cdk/bidi';
import { Subject } from 'rxjs';
import { DragRefInternal as DragRef } from './drag-ref';
/**
 * Internal compile-time-only representation of a `DropListRef`.
 * Used to avoid circular import issues between the `DropListRef` and the `DragRef`.
 * @docs-private
 */
export interface DropListRefInternal extends DropListRef {
}
/**
 * Reference to a drop list. Used to manipulate or dispose of the container.
 * @docs-private
 */
export declare class DropListRef<T = any> {
    private _dragDropRegistry;
    private _document;
    /** Element that the drop list is attached to. */
    readonly element: HTMLElement;
    /**
     * Unique ID for the drop list.
     * @deprecated No longer being used. To be removed.
     * @breaking-change 8.0.0
     */
    id: string;
    /** Whether starting a dragging sequence from this container is disabled. */
    disabled: boolean;
    /** Locks the position of the draggable elements inside the container along the specified axis. */
    lockAxis: 'x' | 'y';
    /**
     * Function that is used to determine whether an item
     * is allowed to be moved into a drop container.
     */
    enterPredicate: (drag: DragRef, drop: DropListRef) => boolean;
    /** Emits right before dragging has started. */
    beforeStarted: Subject<void>;
    /**
     * Emits when the user has moved a new drag item into this container.
     */
    entered: Subject<{
        item: DragRef;
        container: DropListRef<any>;
    }>;
    /**
     * Emits when the user removes an item from the container
     * by dragging it into another container.
     */
    exited: Subject<{
        item: DragRef;
        container: DropListRef<any>;
    }>;
    /** Emits when the user drops an item inside the container. */
    dropped: Subject<{
        item: DragRef;
        currentIndex: number;
        previousIndex: number;
        container: DropListRef<any>;
        previousContainer: DropListRef<any>;
        isPointerOverContainer: boolean;
    }>;
    /** Emits as the user is swapping items while actively dragging. */
    sorted: Subject<{
        previousIndex: number;
        currentIndex: number;
        container: DropListRef<any>;
        item: DragRef;
    }>;
    /** Arbitrary data that can be attached to the drop list. */
    data: T;
    /** Whether an item in the list is being dragged. */
    private _isDragging;
    /** Cache of the dimensions of all the items inside the container. */
    private _itemPositions;
    /** Cached `ClientRect` of the drop list. */
    private _clientRect;
    /**
     * Draggable items that are currently active inside the container. Includes the items
     * from `_draggables`, as well as any items that have been dragged in, but haven't
     * been dropped yet.
     */
    private _activeDraggables;
    /**
     * Keeps track of the item that was last swapped with the dragged item, as
     * well as what direction the pointer was moving in when the swap occured.
     */
    private _previousSwap;
    /** Draggable items in the container. */
    private _draggables;
    /** Drop lists that are connected to the current one. */
    private _siblings;
    /** Direction in which the list is oriented. */
    private _orientation;
    /** Connected siblings that currently have a dragged item. */
    private _activeSiblings;
    /** Layout direction of the drop list. */
    private _direction;
    constructor(element: ElementRef<HTMLElement> | HTMLElement, _dragDropRegistry: DragDropRegistry<DragRef, DropListRef>, _document: any);
    /** Removes the drop list functionality from the DOM element. */
    dispose(): void;
    /** Whether an item from this list is currently being dragged. */
    isDragging(): boolean;
    /** Starts dragging an item. */
    start(): void;
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     */
    enter(item: DragRef, pointerX: number, pointerY: number): void;
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param item Item that was dragged out.
     */
    exit(item: DragRef): void;
    /**
     * Drops an item into this container.
     * @param item Item being dropped into the container.
     * @param currentIndex Index at which the item should be inserted.
     * @param previousContainer Container from which the item got dragged in.
     * @param isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     */
    drop(item: DragRef, currentIndex: number, previousContainer: DropListRef, isPointerOverContainer: boolean): void;
    /**
     * Sets the draggable items that are a part of this list.
     * @param items Items that are a part of this list.
     */
    withItems(items: DragRef[]): this;
    /** Sets the layout direction of the drop list. */
    withDirection(direction: Direction): this;
    /**
     * Sets the containers that are connected to this one. When two or more containers are
     * connected, the user will be allowed to transfer items between them.
     * @param connectedTo Other containers that the current containers should be connected to.
     */
    connectedTo(connectedTo: DropListRef[]): this;
    /**
     * Sets the orientation of the container.
     * @param orientation New orientation for the container.
     */
    withOrientation(orientation: 'vertical' | 'horizontal'): this;
    /**
     * Figures out the index of an item in the container.
     * @param item Item whose index should be determined.
     */
    getItemIndex(item: DragRef): number;
    /**
     * Whether the list is able to receive the item that
     * is currently being dragged inside a connected drop list.
     */
    isReceiving(): boolean;
    /**
     * Sorts an item inside the container based on its position.
     * @param item Item to be sorted.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param pointerDelta Direction in which the pointer is moving along each axis.
     */
    _sortItem(item: DragRef, pointerX: number, pointerY: number, pointerDelta: {
        x: number;
        y: number;
    }): void;
    /** Caches the position of the drop list. */
    private _cacheOwnPosition;
    /** Refreshes the position cache of the items and sibling containers. */
    private _cacheItemPositions;
    /** Resets the container to its initial state. */
    private _reset;
    /**
     * Gets the offset in pixels by which the items that aren't being dragged should be moved.
     * @param currentIndex Index of the item currently being dragged.
     * @param siblings All of the items in the list.
     * @param delta Direction in which the user is moving.
     */
    private _getSiblingOffsetPx;
    /**
     * Checks whether the pointer coordinates are close to the drop container.
     * @param pointerX Coordinates along the X axis.
     * @param pointerY Coordinates along the Y axis.
     */
    private _isPointerNearDropContainer;
    /**
     * Gets the offset in pixels by which the item that is being dragged should be moved.
     * @param currentPosition Current position of the item.
     * @param newPosition Position of the item where the current item should be moved.
     * @param delta Direction in which the user is moving.
     */
    private _getItemOffsetPx;
    /**
     * Gets the index of an item in the drop container, based on the position of the user's pointer.
     * @param item Item that is being sorted.
     * @param pointerX Position of the user's pointer along the X axis.
     * @param pointerY Position of the user's pointer along the Y axis.
     * @param delta Direction in which the user is moving their pointer.
     */
    private _getItemIndexFromPointerPosition;
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param x Pointer position along the X axis.
     * @param y Pointer position along the Y axis.
     */
    _isOverContainer(x: number, y: number): boolean;
    /**
     * Figures out whether an item should be moved into a sibling
     * drop container, based on its current position.
     * @param item Drag item that is being moved.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _getSiblingContainerFromPosition(item: DragRef, x: number, y: number): DropListRef | undefined;
    /**
     * Checks whether the drop list can receive the passed-in item.
     * @param item Item that is being dragged into the list.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _canReceive(item: DragRef, x: number, y: number): boolean;
    /**
     * Called by one of the connected drop lists when a dragging sequence has started.
     * @param sibling Sibling in which dragging has started.
     */
    _startReceiving(sibling: DropListRef): void;
    /**
     * Called by a connected drop list when dragging has stopped.
     * @param sibling Sibling whose dragging has stopped.
     */
    _stopReceiving(sibling: DropListRef): void;
}
