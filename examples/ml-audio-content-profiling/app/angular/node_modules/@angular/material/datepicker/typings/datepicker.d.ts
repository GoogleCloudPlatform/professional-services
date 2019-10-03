/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayRef, ScrollStrategy } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { AfterViewInit, ElementRef, EventEmitter, InjectionToken, NgZone, OnDestroy, ViewContainerRef } from '@angular/core';
import { CanColor, CanColorCtor, DateAdapter, ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { MatCalendar } from './calendar';
import { MatDatepickerInput } from './datepicker-input';
import { MatCalendarCellCssClasses } from './calendar-body';
/** Injection token that determines the scroll handling while the calendar is open. */
export declare const MAT_DATEPICKER_SCROLL_STRATEGY: InjectionToken<() => ScrollStrategy>;
/** @docs-private */
export declare function MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy;
/** @docs-private */
export declare const MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER: {
    provide: InjectionToken<() => ScrollStrategy>;
    deps: (typeof Overlay)[];
    useFactory: typeof MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY;
};
/** @docs-private */
export declare class MatDatepickerContentBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatDatepickerContentMixinBase: CanColorCtor & typeof MatDatepickerContentBase;
/**
 * Component used as the content for the datepicker dialog and popup. We use this instead of using
 * MatCalendar directly as the content so we can control the initial focus. This also gives us a
 * place to put additional features of the popup that are not part of the calendar itself in the
 * future. (e.g. confirmation buttons).
 * @docs-private
 */
export declare class MatDatepickerContent<D> extends _MatDatepickerContentMixinBase implements AfterViewInit, CanColor {
    /** Reference to the internal calendar component. */
    _calendar: MatCalendar<D>;
    /** Reference to the datepicker that created the overlay. */
    datepicker: MatDatepicker<D>;
    /** Whether the datepicker is above or below the input. */
    _isAbove: boolean;
    constructor(elementRef: ElementRef);
    ngAfterViewInit(): void;
}
/** Component responsible for managing the datepicker popup/dialog. */
export declare class MatDatepicker<D> implements OnDestroy, CanColor {
    private _dialog;
    private _overlay;
    private _ngZone;
    private _viewContainerRef;
    private _dateAdapter;
    private _dir;
    private _document;
    private _scrollStrategy;
    /** An input indicating the type of the custom header component for the calendar, if set. */
    calendarHeaderComponent: ComponentType<any>;
    /** The date to open the calendar to initially. */
    startAt: D | null;
    private _startAt;
    /** The view that the calendar should start in. */
    startView: 'month' | 'year' | 'multi-year';
    /** Color palette to use on the datepicker's calendar. */
    color: ThemePalette;
    _color: ThemePalette;
    /**
     * Whether the calendar UI is in touch mode. In touch mode the calendar opens in a dialog rather
     * than a popup and elements have more padding to allow for bigger touch targets.
     */
    touchUi: boolean;
    private _touchUi;
    /** Whether the datepicker pop-up should be disabled. */
    disabled: boolean;
    private _disabled;
    /**
     * Emits selected year in multiyear view.
     * This doesn't imply a change on the selected date.
     */
    readonly yearSelected: EventEmitter<D>;
    /**
     * Emits selected month in year view.
     * This doesn't imply a change on the selected date.
     */
    readonly monthSelected: EventEmitter<D>;
    /** Classes to be passed to the date picker panel. Supports the same syntax as `ngClass`. */
    panelClass: string | string[];
    /** Function that can be used to add custom CSS classes to dates. */
    dateClass: (date: D) => MatCalendarCellCssClasses;
    /** Emits when the datepicker has been opened. */
    openedStream: EventEmitter<void>;
    /** Emits when the datepicker has been closed. */
    closedStream: EventEmitter<void>;
    /** Whether the calendar is open. */
    opened: boolean;
    private _opened;
    /** The id for the datepicker calendar. */
    id: string;
    /** The currently selected date. */
    _selected: D | null;
    private _validSelected;
    /** The minimum selectable date. */
    readonly _minDate: D | null;
    /** The maximum selectable date. */
    readonly _maxDate: D | null;
    readonly _dateFilter: (date: D | null) => boolean;
    /** A reference to the overlay when the calendar is opened as a popup. */
    _popupRef: OverlayRef;
    /** A reference to the dialog when the calendar is opened as a dialog. */
    private _dialogRef;
    /** A portal containing the calendar for this datepicker. */
    private _calendarPortal;
    /** Reference to the component instantiated in popup mode. */
    private _popupComponentRef;
    /** The element that was focused before the datepicker was opened. */
    private _focusedElementBeforeOpen;
    /** Subscription to value changes in the associated input element. */
    private _inputSubscription;
    /** The input element this datepicker is associated with. */
    _datepickerInput: MatDatepickerInput<D>;
    /** Emits when the datepicker is disabled. */
    readonly _disabledChange: Subject<boolean>;
    /** Emits new selected date when selected date changes. */
    readonly _selectedChanged: Subject<D>;
    constructor(_dialog: MatDialog, _overlay: Overlay, _ngZone: NgZone, _viewContainerRef: ViewContainerRef, scrollStrategy: any, _dateAdapter: DateAdapter<D>, _dir: Directionality, _document: any);
    ngOnDestroy(): void;
    /** Selects the given date */
    select(date: D): void;
    /** Emits the selected year in multiyear view */
    _selectYear(normalizedYear: D): void;
    /** Emits selected month in year view */
    _selectMonth(normalizedMonth: D): void;
    /**
     * Register an input with this datepicker.
     * @param input The datepicker input to register with this datepicker.
     */
    _registerInput(input: MatDatepickerInput<D>): void;
    /** Open the calendar. */
    open(): void;
    /** Close the calendar. */
    close(): void;
    /** Open the calendar as a dialog. */
    private _openAsDialog;
    /** Open the calendar as a popup. */
    private _openAsPopup;
    /** Create the popup. */
    private _createPopup;
    /** Create the popup PositionStrategy. */
    private _createPopupPositionStrategy;
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    private _getValidDateOrNull;
    /** Passes the current theme color along to the calendar overlay. */
    private _setColor;
}
