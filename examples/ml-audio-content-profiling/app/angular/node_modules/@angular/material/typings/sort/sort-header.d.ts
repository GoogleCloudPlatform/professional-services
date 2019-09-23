/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CanDisable, CanDisableCtor } from '@angular/material/core';
import { MatSort, MatSortable } from './sort';
import { SortDirection } from './sort-direction';
import { MatSortHeaderIntl } from './sort-header-intl';
/** @docs-private */
export declare class MatSortHeaderBase {
}
export declare const _MatSortHeaderMixinBase: CanDisableCtor & typeof MatSortHeaderBase;
/**
 * Valid positions for the arrow to be in for its opacity and translation. If the state is a
 * sort direction, the position of the arrow will be above/below and opacity 0. If the state is
 * hint, the arrow will be in the center with a slight opacity. Active state means the arrow will
 * be fully opaque in the center.
 *
 * @docs-private
 */
export declare type ArrowViewState = SortDirection | 'hint' | 'active';
/**
 * States describing the arrow's animated position (animating fromState to toState).
 * If the fromState is not defined, there will be no animated transition to the toState.
 * @docs-private
 */
export interface ArrowViewStateTransition {
    fromState?: ArrowViewState;
    toState: ArrowViewState;
}
/** Column definition associated with a `MatSortHeader`. */
interface MatSortHeaderColumnDef {
    name: string;
}
/**
 * Applies sorting behavior (click to change sort) and styles to an element, including an
 * arrow to display the current sort direction.
 *
 * Must be provided with an id and contained within a parent MatSort directive.
 *
 * If used on header cells in a CdkTable, it will automatically default its id from its containing
 * column definition.
 */
export declare class MatSortHeader extends _MatSortHeaderMixinBase implements CanDisable, MatSortable, OnDestroy, OnInit {
    _intl: MatSortHeaderIntl;
    _sort: MatSort;
    _columnDef: MatSortHeaderColumnDef;
    private _rerenderSubscription;
    /**
     * Flag set to true when the indicator should be displayed while the sort is not active. Used to
     * provide an affordance that the header is sortable by showing on focus and hover.
     */
    _showIndicatorHint: boolean;
    /**
     * The view transition state of the arrow (translation/ opacity) - indicates its `from` and `to`
     * position through the animation. If animations are currently disabled, the fromState is removed
     * so that there is no animation displayed.
     */
    _viewState: ArrowViewStateTransition;
    /** The direction the arrow should be facing according to the current state. */
    _arrowDirection: SortDirection;
    /**
     * Whether the view state animation should show the transition between the `from` and `to` states.
     */
    _disableViewStateAnimation: boolean;
    /**
     * ID of this sort header. If used within the context of a CdkColumnDef, this will default to
     * the column's name.
     */
    id: string;
    /** Sets the position of the arrow that displays when sorted. */
    arrowPosition: 'before' | 'after';
    /** Overrides the sort start value of the containing MatSort for this MatSortable. */
    start: 'asc' | 'desc';
    /** Overrides the disable clear value of the containing MatSort for this MatSortable. */
    disableClear: boolean;
    private _disableClear;
    constructor(_intl: MatSortHeaderIntl, changeDetectorRef: ChangeDetectorRef, _sort: MatSort, _columnDef: MatSortHeaderColumnDef);
    ngOnInit(): void;
    ngOnDestroy(): void;
    /**
     * Sets the "hint" state such that the arrow will be semi-transparently displayed as a hint to the
     * user showing what the active sort will become. If set to false, the arrow will fade away.
     */
    _setIndicatorHintVisible(visible: boolean): void;
    /**
     * Sets the animation transition view state for the arrow's position and opacity. If the
     * `disableViewStateAnimation` flag is set to true, the `fromState` will be ignored so that
     * no animation appears.
     */
    _setAnimationTransitionState(viewState: ArrowViewStateTransition): void;
    /** Triggers the sort on this sort header and removes the indicator hint. */
    _handleClick(): void;
    /** Whether this MatSortHeader is currently sorted in either ascending or descending order. */
    _isSorted(): boolean;
    /** Returns the animation state for the arrow direction (indicator and pointers). */
    _getArrowDirectionState(): string;
    /** Returns the arrow position state (opacity, translation). */
    _getArrowViewState(): string;
    /**
     * Updates the direction the arrow should be pointing. If it is not sorted, the arrow should be
     * facing the start direction. Otherwise if it is sorted, the arrow should point in the currently
     * active sorted direction. The reason this is updated through a function is because the direction
     * should only be changed at specific times - when deactivated but the hint is displayed and when
     * the sort is active and the direction changes. Otherwise the arrow's direction should linger
     * in cases such as the sort becoming deactivated but we want to animate the arrow away while
     * preserving its direction, even though the next sort direction is actually different and should
     * only be changed once the arrow displays again (hint or activation).
     */
    _updateArrowDirection(): void;
    _isDisabled(): boolean;
    /**
     * Gets the aria-sort attribute that should be applied to this sort header. If this header
     * is not sorted, returns null so that the attribute is removed from the host element. Aria spec
     * says that the aria-sort property should only be present on one header at a time, so removing
     * ensures this is true.
     */
    _getAriaSortAttribute(): "ascending" | "descending" | null;
    /** Whether the arrow inside the sort header should be rendered. */
    _renderArrow(): boolean;
}
export {};
