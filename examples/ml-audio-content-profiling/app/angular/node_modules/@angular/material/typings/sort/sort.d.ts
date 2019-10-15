/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { CanDisable, CanDisableCtor, HasInitialized, HasInitializedCtor } from '@angular/material/core';
import { Subject } from 'rxjs';
import { SortDirection } from './sort-direction';
/** Interface for a directive that holds sorting state consumed by `MatSortHeader`. */
export interface MatSortable {
    /** The id of the column being sorted. */
    id: string;
    /** Starting sort direction. */
    start: 'asc' | 'desc';
    /** Whether to disable clearing the sorting state. */
    disableClear: boolean;
}
/** The current sort state. */
export interface Sort {
    /** The id of the column being sorted. */
    active: string;
    /** The sort direction. */
    direction: SortDirection;
}
/** @docs-private */
export declare class MatSortBase {
}
export declare const _MatSortMixinBase: HasInitializedCtor & CanDisableCtor & typeof MatSortBase;
/** Container for MatSortables to manage the sort state and provide default sort parameters. */
export declare class MatSort extends _MatSortMixinBase implements CanDisable, HasInitialized, OnChanges, OnDestroy, OnInit {
    /** Collection of all registered sortables that this directive manages. */
    sortables: Map<string, MatSortable>;
    /** Used to notify any child components listening to state changes. */
    readonly _stateChanges: Subject<void>;
    /** The id of the most recently sorted MatSortable. */
    active: string;
    /**
     * The direction to set when an MatSortable is initially sorted.
     * May be overriden by the MatSortable's sort start.
     */
    start: 'asc' | 'desc';
    /** The sort direction of the currently active MatSortable. */
    direction: SortDirection;
    private _direction;
    /**
     * Whether to disable the user from clearing the sort by finishing the sort direction cycle.
     * May be overriden by the MatSortable's disable clear input.
     */
    disableClear: boolean;
    private _disableClear;
    /** Event emitted when the user changes either the active sort or sort direction. */
    readonly sortChange: EventEmitter<Sort>;
    /**
     * Register function to be used by the contained MatSortables. Adds the MatSortable to the
     * collection of MatSortables.
     */
    register(sortable: MatSortable): void;
    /**
     * Unregister function to be used by the contained MatSortables. Removes the MatSortable from the
     * collection of contained MatSortables.
     */
    deregister(sortable: MatSortable): void;
    /** Sets the active sort id and determines the new sort direction. */
    sort(sortable: MatSortable): void;
    /** Returns the next sort direction of the active sortable, checking for potential overrides. */
    getNextSortDirection(sortable: MatSortable): SortDirection;
    ngOnInit(): void;
    ngOnChanges(): void;
    ngOnDestroy(): void;
}
