/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentChecked, AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, OnDestroy, QueryList, InjectionToken } from '@angular/core';
import { CanColor, CanColorCtor, CanDisableRipple, CanDisableRippleCtor, ThemePalette } from '@angular/material/core';
import { MatTab } from './tab';
import { MatTabHeader } from './tab-header';
/** A simple change event emitted on focus or selection changes. */
export declare class MatTabChangeEvent {
    /** Index of the currently-selected tab. */
    index: number;
    /** Reference to the currently-selected tab. */
    tab: MatTab;
}
/** Possible positions for the tab header. */
export declare type MatTabHeaderPosition = 'above' | 'below';
/** Object that can be used to configure the default options for the tabs module. */
export interface MatTabsConfig {
    /** Duration for the tab animation. Must be a valid CSS value (e.g. 600ms). */
    animationDuration?: string;
}
/** Injection token that can be used to provide the default options the tabs module. */
export declare const MAT_TABS_CONFIG: InjectionToken<{}>;
/** @docs-private */
export declare class MatTabGroupBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatTabGroupMixinBase: CanColorCtor & CanDisableRippleCtor & typeof MatTabGroupBase;
/**
 * Material design tab-group component.  Supports basic tab pairs (label + content) and includes
 * animated ink-bar, keyboard navigation, and screen reader.
 * See: https://material.io/design/components/tabs.html
 */
export declare class MatTabGroup extends _MatTabGroupMixinBase implements AfterContentInit, AfterContentChecked, OnDestroy, CanColor, CanDisableRipple {
    private _changeDetectorRef;
    _tabs: QueryList<MatTab>;
    _tabBodyWrapper: ElementRef;
    _tabHeader: MatTabHeader;
    /** The tab index that should be selected after the content has been checked. */
    private _indexToSelect;
    /** Snapshot of the height of the tab body wrapper before another tab is activated. */
    private _tabBodyWrapperHeight;
    /** Subscription to tabs being added/removed. */
    private _tabsSubscription;
    /** Subscription to changes in the tab labels. */
    private _tabLabelSubscription;
    /** Whether the tab group should grow to the size of the active tab. */
    dynamicHeight: boolean;
    private _dynamicHeight;
    /** The index of the active tab. */
    selectedIndex: number | null;
    private _selectedIndex;
    /** Position of the tab header. */
    headerPosition: MatTabHeaderPosition;
    /** Duration for the tab animation. Will be normalized to milliseconds if no units are set. */
    animationDuration: string;
    private _animationDuration;
    /** Background color of the tab group. */
    backgroundColor: ThemePalette;
    private _backgroundColor;
    /** Output to enable support for two-way binding on `[(selectedIndex)]` */
    readonly selectedIndexChange: EventEmitter<number>;
    /** Event emitted when focus has changed within a tab group. */
    readonly focusChange: EventEmitter<MatTabChangeEvent>;
    /** Event emitted when the body animation has completed */
    readonly animationDone: EventEmitter<void>;
    /** Event emitted when the tab selection has changed. */
    readonly selectedTabChange: EventEmitter<MatTabChangeEvent>;
    private _groupId;
    constructor(elementRef: ElementRef, _changeDetectorRef: ChangeDetectorRef, defaultConfig?: MatTabsConfig);
    /**
     * After the content is checked, this component knows what tabs have been defined
     * and what the selected index should be. This is where we can know exactly what position
     * each tab should be in according to the new selected index, and additionally we know how
     * a new selected tab should transition in (from the left or right).
     */
    ngAfterContentChecked(): void;
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Re-aligns the ink bar to the selected tab element. */
    realignInkBar(): void;
    _focusChanged(index: number): void;
    private _createChangeEvent;
    /**
     * Subscribes to changes in the tab labels. This is needed, because the @Input for the label is
     * on the MatTab component, whereas the data binding is inside the MatTabGroup. In order for the
     * binding to be updated, we need to subscribe to changes in it and trigger change detection
     * manually.
     */
    private _subscribeToTabLabels;
    /** Clamps the given index to the bounds of 0 and the tabs length. */
    private _clampTabIndex;
    /** Returns a unique id for each tab label element */
    _getTabLabelId(i: number): string;
    /** Returns a unique id for each tab content element */
    _getTabContentId(i: number): string;
    /**
     * Sets the height of the body wrapper to the height of the activating tab if dynamic
     * height property is true.
     */
    _setTabBodyWrapperHeight(tabHeight: number): void;
    /** Removes the height of the tab body wrapper. */
    _removeTabBodyWrapperHeight(): void;
    /** Handle click events, setting new selected index if appropriate. */
    _handleClick(tab: MatTab, tabHeader: MatTabHeader, index: number): void;
    /** Retrieves the tabindex for the tab. */
    _getTabIndex(tab: MatTab, idx: number): number | null;
}
