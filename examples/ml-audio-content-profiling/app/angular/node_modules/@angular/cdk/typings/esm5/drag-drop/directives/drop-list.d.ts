/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, OnDestroy, QueryList, ChangeDetectorRef, AfterContentInit } from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { CdkDrag } from './drag';
import { DragDropRegistry } from '../drag-drop-registry';
import { CdkDragDrop, CdkDragEnter, CdkDragExit, CdkDragSortEvent } from '../drag-events';
import { CdkDropListContainer } from '../drop-list-container';
import { CdkDropListGroup } from './drop-list-group';
import { DropListRef } from '../drop-list-ref';
import { DragRef } from '../drag-ref';
import { DragDrop } from '../drag-drop';
/**
 * Internal compile-time-only representation of a `CdkDropList`.
 * Used to avoid circular import issues between the `CdkDropList` and the `CdkDrag`.
 * @docs-private
 */
export interface CdkDropListInternal extends CdkDropList {
}
/** Container that wraps a set of draggable items. */
export declare class CdkDropList<T = any> implements CdkDropListContainer, AfterContentInit, OnDestroy {
    /** Element that the drop list is attached to. */
    element: ElementRef<HTMLElement>;
    private _changeDetectorRef;
    private _dir?;
    private _group?;
    /** Emits when the list has been destroyed. */
    private _destroyed;
    /** Keeps track of the drop lists that are currently on the page. */
    private static _dropLists;
    /** Reference to the underlying drop list instance. */
    _dropListRef: DropListRef<CdkDropList<T>>;
    /** Draggable items in the container. */
    _draggables: QueryList<CdkDrag>;
    /**
     * Other draggable containers that this container is connected to and into which the
     * container's items can be transferred. Can either be references to other drop containers,
     * or their unique IDs.
     */
    connectedTo: (CdkDropList | string)[] | CdkDropList | string;
    /** Arbitrary data to attach to this container. */
    data: T;
    /** Direction in which the list is oriented. */
    orientation: 'horizontal' | 'vertical';
    /**
     * Unique ID for the drop zone. Can be used as a reference
     * in the `connectedTo` of another `CdkDropList`.
     */
    id: string;
    /** Locks the position of the draggable elements inside the container along the specified axis. */
    lockAxis: 'x' | 'y';
    /** Whether starting a dragging sequence from this container is disabled. */
    disabled: boolean;
    private _disabled;
    /**
     * Function that is used to determine whether an item
     * is allowed to be moved into a drop container.
     */
    enterPredicate: (drag: CdkDrag, drop: CdkDropList) => boolean;
    /** Emits when the user drops an item inside the container. */
    dropped: EventEmitter<CdkDragDrop<T, any>>;
    /**
     * Emits when the user has moved a new drag item into this container.
     */
    entered: EventEmitter<CdkDragEnter<T>>;
    /**
     * Emits when the user removes an item from the container
     * by dragging it into another container.
     */
    exited: EventEmitter<CdkDragExit<T>>;
    /** Emits as the user is swapping items while actively dragging. */
    sorted: EventEmitter<CdkDragSortEvent<T>>;
    constructor(
    /** Element that the drop list is attached to. */
    element: ElementRef<HTMLElement>, dragDropRegistry: DragDropRegistry<DragRef, DropListRef>, _changeDetectorRef: ChangeDetectorRef, _dir?: Directionality | undefined, _group?: CdkDropListGroup<CdkDropList<any>> | undefined, _document?: any, 
    /**
     * @deprecated `dragDropRegistry` and `_document` parameters to be removed.
     * Also `dragDrop` parameter to be made required.
     * @breaking-change 8.0.0.
     */
    dragDrop?: DragDrop);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Starts dragging an item. */
    start(): void;
    /**
     * Drops an item into this container.
     * @param item Item being dropped into the container.
     * @param currentIndex Index at which the item should be inserted.
     * @param previousContainer Container from which the item got dragged in.
     * @param isPointerOverContainer Whether the user's pointer was over the
     *    container when the item was dropped.
     */
    drop(item: CdkDrag, currentIndex: number, previousContainer: Partial<CdkDropListContainer>, isPointerOverContainer: boolean): void;
    /**
     * Emits an event to indicate that the user moved an item into the container.
     * @param item Item that was moved into the container.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     */
    enter(item: CdkDrag, pointerX: number, pointerY: number): void;
    /**
     * Removes an item from the container after it was dragged into another container by the user.
     * @param item Item that was dragged out.
     */
    exit(item: CdkDrag): void;
    /**
     * Figures out the index of an item in the container.
     * @param item Item whose index should be determined.
     */
    getItemIndex(item: CdkDrag): number;
    /**
     * Sorts an item inside the container based on its position.
     * @param item Item to be sorted.
     * @param pointerX Position of the item along the X axis.
     * @param pointerY Position of the item along the Y axis.
     * @param pointerDelta Direction in which the pointer is moving along each axis.
     */
    _sortItem(item: CdkDrag, pointerX: number, pointerY: number, pointerDelta: {
        x: number;
        y: number;
    }): void;
    /**
     * Figures out whether an item should be moved into a sibling
     * drop container, based on its current position.
     * @param item Drag item that is being moved.
     * @param x Position of the item along the X axis.
     * @param y Position of the item along the Y axis.
     */
    _getSiblingContainerFromPosition(item: CdkDrag, x: number, y: number): CdkDropListContainer | null;
    /**
     * Checks whether the user's pointer is positioned over the container.
     * @param x Pointer position along the X axis.
     * @param y Pointer position along the Y axis.
     */
    _isOverContainer(x: number, y: number): boolean;
    /** Syncs the inputs of the CdkDropList with the options of the underlying DropListRef. */
    private _syncInputs;
    /** Handles events from the underlying DropListRef. */
    private _handleEvents;
}
