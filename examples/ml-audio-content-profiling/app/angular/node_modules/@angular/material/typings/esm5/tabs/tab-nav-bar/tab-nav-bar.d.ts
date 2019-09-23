/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Directionality } from '@angular/cdk/bidi';
import { Platform } from '@angular/cdk/platform';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { AfterContentChecked, AfterContentInit, ChangeDetectorRef, ElementRef, NgZone, OnDestroy, QueryList } from '@angular/core';
import { CanColor, CanColorCtor, CanDisable, CanDisableCtor, CanDisableRipple, CanDisableRippleCtor, HasTabIndex, HasTabIndexCtor, RippleConfig, RippleGlobalOptions, RippleRenderer, RippleTarget, ThemePalette } from '@angular/material/core';
import { MatInkBar } from '../ink-bar';
import { FocusMonitor } from '@angular/cdk/a11y';
/** @docs-private */
export declare class MatTabNavBase {
    _elementRef: ElementRef;
    constructor(_elementRef: ElementRef);
}
export declare const _MatTabNavMixinBase: CanDisableRippleCtor & CanColorCtor & typeof MatTabNavBase;
/**
 * Navigation component matching the styles of the tab group header.
 * Provides anchored navigation with animated ink bar.
 */
export declare class MatTabNav extends _MatTabNavMixinBase implements AfterContentChecked, AfterContentInit, CanColor, CanDisableRipple, OnDestroy {
    private _dir;
    private _ngZone;
    private _changeDetectorRef;
    private _viewportRuler;
    /** Subject that emits when the component has been destroyed. */
    private readonly _onDestroy;
    private _activeLinkChanged;
    private _activeLinkElement;
    _inkBar: MatInkBar;
    /** Query list of all tab links of the tab navigation. */
    _tabLinks: QueryList<MatTabLink>;
    /** Background color of the tab nav. */
    backgroundColor: ThemePalette;
    private _backgroundColor;
    constructor(elementRef: ElementRef, _dir: Directionality, _ngZone: NgZone, _changeDetectorRef: ChangeDetectorRef, _viewportRuler: ViewportRuler);
    /**
     * Notifies the component that the active link has been changed.
     * @breaking-change 8.0.0 `element` parameter to be removed.
     */
    updateActiveLink(element: ElementRef): void;
    ngAfterContentInit(): void;
    /** Checks if the active link has been changed and, if so, will update the ink bar. */
    ngAfterContentChecked(): void;
    ngOnDestroy(): void;
    /** Aligns the ink bar to the active link. */
    _alignInkBar(): void;
}
export declare class MatTabLinkBase {
}
export declare const _MatTabLinkMixinBase: HasTabIndexCtor & CanDisableRippleCtor & CanDisableCtor & typeof MatTabLinkBase;
/**
 * Link inside of a `mat-tab-nav-bar`.
 */
export declare class MatTabLink extends _MatTabLinkMixinBase implements OnDestroy, CanDisable, CanDisableRipple, HasTabIndex, RippleTarget {
    private _tabNavBar;
    _elementRef: ElementRef;
    /**
     * @deprecated
     * @breaking-change 8.0.0 `_focusMonitor` parameter to be made required.
     */
    private _focusMonitor?;
    /** Whether the tab link is active or not. */
    protected _isActive: boolean;
    /** Reference to the RippleRenderer for the tab-link. */
    protected _tabLinkRipple: RippleRenderer;
    /** Whether the link is active. */
    active: boolean;
    /**
     * Ripple configuration for ripples that are launched on pointer down. The ripple config
     * is set to the global ripple options since we don't have any configurable options for
     * the tab link ripples.
     * @docs-private
     */
    rippleConfig: RippleConfig & RippleGlobalOptions;
    /**
     * Whether ripples are disabled on interaction.
     * @docs-private
     */
    readonly rippleDisabled: boolean;
    constructor(_tabNavBar: MatTabNav, _elementRef: ElementRef, ngZone: NgZone, platform: Platform, globalRippleOptions: RippleGlobalOptions | null, tabIndex: string, 
    /**
     * @deprecated
     * @breaking-change 8.0.0 `_focusMonitor` parameter to be made required.
     */
    _focusMonitor?: FocusMonitor | undefined);
    ngOnDestroy(): void;
}
