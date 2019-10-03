/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { Directionality } from '@angular/cdk/bidi';
import { MatCalendarBody, MatCalendarCell } from './calendar-body';
export declare const yearsPerPage = 24;
export declare const yearsPerRow = 4;
/**
 * An internal component used to display a year selector in the datepicker.
 * @docs-private
 */
export declare class MatMultiYearView<D> implements AfterContentInit {
    private _changeDetectorRef;
    _dateAdapter: DateAdapter<D>;
    private _dir?;
    /** The date to display in this multi-year view (everything other than the year is ignored). */
    activeDate: D;
    private _activeDate;
    /** The currently selected date. */
    selected: D | null;
    private _selected;
    /** The minimum selectable date. */
    minDate: D | null;
    private _minDate;
    /** The maximum selectable date. */
    maxDate: D | null;
    private _maxDate;
    /** A function used to filter which dates are selectable. */
    dateFilter: (date: D) => boolean;
    /** Emits when a new year is selected. */
    readonly selectedChange: EventEmitter<D>;
    /** Emits the selected year. This doesn't imply a change on the selected date */
    readonly yearSelected: EventEmitter<D>;
    /** Emits when any date is activated. */
    readonly activeDateChange: EventEmitter<D>;
    /** The body of calendar table */
    _matCalendarBody: MatCalendarBody;
    /** Grid of calendar cells representing the currently displayed years. */
    _years: MatCalendarCell[][];
    /** The year that today falls on. */
    _todayYear: number;
    /** The year of the selected date. Null if the selected date is null. */
    _selectedYear: number | null;
    constructor(_changeDetectorRef: ChangeDetectorRef, _dateAdapter: DateAdapter<D>, _dir?: Directionality | undefined);
    ngAfterContentInit(): void;
    /** Initializes this multi-year view. */
    _init(): void;
    /** Handles when a new year is selected. */
    _yearSelected(year: number): void;
    /** Handles keydown events on the calendar body when calendar is in multi-year view. */
    _handleCalendarBodyKeydown(event: KeyboardEvent): void;
    _getActiveCell(): number;
    /** Focuses the active cell after the microtask queue is empty. */
    _focusActiveCell(): void;
    /** Creates an MatCalendarCell for the given year. */
    private _createCellForYear;
    /** Whether the given year is enabled. */
    private _shouldEnableYear;
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    private _getValidDateOrNull;
    /** Determines whether the user has the RTL layout direction. */
    private _isRtl;
}
