/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
/**
 * Data source that accepts a client-side data array and includes native support of filtering,
 * sorting (using MatSort), and pagination (using MatPaginator).
 *
 * Allows for sort customization by overriding sortingDataAccessor, which defines how data
 * properties are accessed. Also allows for filter customization by overriding filterTermAccessor,
 * which defines how row data is converted to a string for filter matching.
 */
export declare class MatTableDataSource<T> extends DataSource<T> {
    /** Stream that emits when a new data array is set on the data source. */
    private readonly _data;
    /** Stream emitting render data to the table (depends on ordered data changes). */
    private readonly _renderData;
    /** Stream that emits when a new filter string is set on the data source. */
    private readonly _filter;
    /** Used to react to internal changes of the paginator that are made by the data source itself. */
    private readonly _internalPageChanges;
    /**
     * Subscription to the changes that should trigger an update to the table's rendered rows, such
     * as filtering, sorting, pagination, or base data changes.
     */
    _renderChangesSubscription: Subscription;
    /**
     * The filtered set of data that has been matched by the filter string, or all the data if there
     * is no filter. Useful for knowing the set of data the table represents.
     * For example, a 'selectAll()' function would likely want to select the set of filtered data
     * shown to the user rather than all the data.
     */
    filteredData: T[];
    /** Array of data that should be rendered by the table, where each object represents one row. */
    data: T[];
    /**
     * Filter term that should be used to filter out objects from the data array. To override how
     * data objects match to this filter string, provide a custom function for filterPredicate.
     */
    filter: string;
    /**
     * Instance of the MatSort directive used by the table to control its sorting. Sort changes
     * emitted by the MatSort will trigger an update to the table's rendered data.
     */
    sort: MatSort | null;
    private _sort;
    /**
     * Instance of the MatPaginator component used by the table to control what page of the data is
     * displayed. Page changes emitted by the MatPaginator will trigger an update to the
     * table's rendered data.
     *
     * Note that the data source uses the paginator's properties to calculate which page of data
     * should be displayed. If the paginator receives its properties as template inputs,
     * e.g. `[pageLength]=100` or `[pageIndex]=1`, then be sure that the paginator's view has been
     * initialized before assigning it to this data source.
     */
    paginator: MatPaginator | null;
    private _paginator;
    /**
     * Data accessor function that is used for accessing data properties for sorting through
     * the default sortData function.
     * This default function assumes that the sort header IDs (which defaults to the column name)
     * matches the data's properties (e.g. column Xyz represents data['Xyz']).
     * May be set to a custom function for different behavior.
     * @param data Data object that is being accessed.
     * @param sortHeaderId The name of the column that represents the data.
     */
    sortingDataAccessor: ((data: T, sortHeaderId: string) => string | number);
    /**
     * Gets a sorted copy of the data array based on the state of the MatSort. Called
     * after changes are made to the filtered data or when sort changes are emitted from MatSort.
     * By default, the function retrieves the active sort and its direction and compares data
     * by retrieving data using the sortingDataAccessor. May be overridden for a custom implementation
     * of data ordering.
     * @param data The array of data that should be sorted.
     * @param sort The connected MatSort that holds the current sort state.
     */
    sortData: ((data: T[], sort: MatSort) => T[]);
    /**
     * Checks if a data object matches the data source's filter string. By default, each data object
     * is converted to a string of its properties and returns true if the filter has
     * at least one occurrence in that string. By default, the filter string has its whitespace
     * trimmed and the match is case-insensitive. May be overridden for a custom implementation of
     * filter matching.
     * @param data Data object used to check against the filter.
     * @param filter Filter string that has been set on the data source.
     * @returns Whether the filter matches against the data
     */
    filterPredicate: ((data: T, filter: string) => boolean);
    constructor(initialData?: T[]);
    /**
     * Subscribe to changes that should trigger an update to the table's rendered rows. When the
     * changes occur, process the current state of the filter, sort, and pagination along with
     * the provided base data and send it to the table for rendering.
     */
    _updateChangeSubscription(): void;
    /**
     * Returns a filtered data array where each filter object contains the filter string within
     * the result of the filterTermAccessor function. If no filter is set, returns the data array
     * as provided.
     */
    _filterData(data: T[]): T[];
    /**
     * Returns a sorted copy of the data if MatSort has a sort applied, otherwise just returns the
     * data array as provided. Uses the default data accessor for data lookup, unless a
     * sortDataAccessor function is defined.
     */
    _orderData(data: T[]): T[];
    /**
     * Returns a paged splice of the provided data array according to the provided MatPaginator's page
     * index and length. If there is no paginator provided, returns the data array as provided.
     */
    _pageData(data: T[]): T[];
    /**
     * Updates the paginator to reflect the length of the filtered data, and makes sure that the page
     * index does not exceed the paginator's last page. Values are changed in a resolved promise to
     * guard against making property changes within a round of change detection.
     */
    _updatePaginator(filteredDataLength: number): void;
    /**
     * Used by the MatTable. Called when it connects to the data source.
     * @docs-private
     */
    connect(): BehaviorSubject<T[]>;
    /**
     * Used by the MatTable. Called when it is destroyed. No-op.
     * @docs-private
     */
    disconnect(): void;
}
