/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Direction, Directionality } from '@angular/cdk/bidi';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { AfterContentChecked, AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, NgZone, OnDestroy, QueryList, AfterViewInit } from '@angular/core';
import { CanDisableRipple, CanDisableRippleCtor } from '@angular/material/core';
import { MatInkBar } from './ink-bar';
import { MatTabLabelWrapper } from './tab-label-wrapper';
import { Platform } from '@angular/cdk/platform';
/**
 * The directions that scrolling can go in when the header's tabs exceed the header width. 'After'
 * will scroll the header towards the end of the tabs list and 'before' will scroll towards the
 * beginning of the list.
 */
export declare type ScrollDirection = 'after' | 'before';
/** @docs-private */
export declare class MatTabHeaderBase {
}
export declare const _MatTabHeaderMixinBase: CanDisableRippleCtor & typeof MatTabHeaderBase;
/**
 * The header of the tab group which displays a list of all the tabs in the tab group. Includes
 * an ink bar that follows the currently selected tab. When the tabs list's width exceeds the
 * width of the header container, then arrows will be displayed to allow the user to scroll
 * left and right across the header.
 * @docs-private
 */
export declare class MatTabHeader extends _MatTabHeaderMixinBase implements AfterContentChecked, AfterContentInit, AfterViewInit, OnDestroy, CanDisableRipple {
    private _elementRef;
    private _changeDetectorRef;
    private _viewportRuler;
    private _dir;
    private _ngZone?;
    private _platform?;
    _labelWrappers: QueryList<MatTabLabelWrapper>;
    _inkBar: MatInkBar;
    _tabListContainer: ElementRef;
    _tabList: ElementRef;
    _nextPaginator: ElementRef<HTMLElement>;
    _previousPaginator: ElementRef<HTMLElement>;
    /** The distance in pixels that the tab labels should be translated to the left. */
    private _scrollDistance;
    /** Whether the header should scroll to the selected index after the view has been checked. */
    private _selectedIndexChanged;
    /** Emits when the component is destroyed. */
    private readonly _destroyed;
    /** Whether the controls for pagination should be displayed */
    _showPaginationControls: boolean;
    /** Whether the tab list can be scrolled more towards the end of the tab label list. */
    _disableScrollAfter: boolean;
    /** Whether the tab list can be scrolled more towards the beginning of the tab label list. */
    _disableScrollBefore: boolean;
    /**
     * The number of tab labels that are displayed on the header. When this changes, the header
     * should re-evaluate the scroll position.
     */
    private _tabLabelCount;
    /** Whether the scroll distance has changed and should be applied after the view is checked. */
    private _scrollDistanceChanged;
    /** Used to manage focus between the tabs. */
    private _keyManager;
    /** Cached text content of the header. */
    private _currentTextContent;
    /** Stream that will stop the automated scrolling. */
    private _stopScrolling;
    /** The index of the active tab. */
    selectedIndex: number;
    private _selectedIndex;
    /** Event emitted when the option is selected. */
    readonly selectFocusedIndex: EventEmitter<number>;
    /** Event emitted when a label is focused. */
    readonly indexFocused: EventEmitter<number>;
    constructor(_elementRef: ElementRef, _changeDetectorRef: ChangeDetectorRef, _viewportRuler: ViewportRuler, _dir: Directionality, _ngZone?: NgZone | undefined, _platform?: Platform | undefined);
    ngAfterContentChecked(): void;
    /** Handles keyboard events on the header. */
    _handleKeydown(event: KeyboardEvent): void;
    /**
     * Aligns the ink bar to the selected tab on load.
     */
    ngAfterContentInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /**
     * Callback for when the MutationObserver detects that the content has changed.
     */
    _onContentChanges(): void;
    /**
     * Updates the view whether pagination should be enabled or not.
     *
     * WARNING: Calling this method can be very costly in terms of performance.  It should be called
     * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
     * page.
     */
    updatePagination(): void;
    /** Tracks which element has focus; used for keyboard navigation */
    /** When the focus index is set, we must manually send focus to the correct label */
    focusIndex: number;
    /**
     * Determines if an index is valid.  If the tabs are not ready yet, we assume that the user is
     * providing a valid index and return true.
     */
    _isValidIndex(index: number): boolean;
    /**
     * Sets focus on the HTML element for the label wrapper and scrolls it into the view if
     * scrolling is enabled.
     */
    _setTabFocus(tabIndex: number): void;
    /** The layout direction of the containing app. */
    _getLayoutDirection(): Direction;
    /** Performs the CSS transformation on the tab list that will cause the list to scroll. */
    _updateTabScrollPosition(): void;
    /** Sets the distance in pixels that the tab header should be transformed in the X-axis. */
    scrollDistance: number;
    /**
     * Moves the tab list in the 'before' or 'after' direction (towards the beginning of the list or
     * the end of the list, respectively). The distance to scroll is computed to be a third of the
     * length of the tab list view window.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    _scrollHeader(direction: ScrollDirection): {
        maxScrollDistance: number;
        distance: number;
    };
    /** Handles click events on the pagination arrows. */
    _handlePaginatorClick(direction: ScrollDirection): void;
    /**
     * Moves the tab list such that the desired tab label (marked by index) is moved into view.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    _scrollToLabel(labelIndex: number): void;
    /**
     * Evaluate whether the pagination controls should be displayed. If the scroll width of the
     * tab list is wider than the size of the header container, then the pagination controls should
     * be shown.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    _checkPaginationEnabled(): void;
    /**
     * Evaluate whether the before and after controls should be enabled or disabled.
     * If the header is at the beginning of the list (scroll distance is equal to 0) then disable the
     * before button. If the header is at the end of the list (scroll distance is equal to the
     * maximum distance we can scroll), then disable the after button.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    _checkScrollingControls(): void;
    /**
     * Determines what is the maximum length in pixels that can be set for the scroll distance. This
     * is equal to the difference in width between the tab list container and tab header container.
     *
     * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
     * should be called sparingly.
     */
    _getMaxScrollDistance(): number;
    /** Tells the ink-bar to align itself to the current label wrapper */
    _alignInkBarToSelectedTab(): void;
    /** Stops the currently-running paginator interval.  */
    _stopInterval(): void;
    /**
     * Handles the user pressing down on one of the paginators.
     * Starts scrolling the header after a certain amount of time.
     * @param direction In which direction the paginator should be scrolled.
     */
    _handlePaginatorPress(direction: ScrollDirection): void;
    /**
     * Scrolls the header to a given position.
     * @param position Position to which to scroll.
     * @returns Information on the current scroll distance and the maximum.
     */
    private _scrollTo;
}
