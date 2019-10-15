/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationEvent } from '@angular/animations';
import { AriaDescriber, FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { HammerLoader } from '@angular/platform-browser';
import { OriginConnectionPosition, Overlay, OverlayConnectionPosition, OverlayRef, ScrollStrategy } from '@angular/cdk/overlay';
import { ScrollDispatcher } from '@angular/cdk/scrolling';
import { Platform } from '@angular/cdk/platform';
import { ChangeDetectorRef, ElementRef, InjectionToken, NgZone, OnDestroy, ViewContainerRef } from '@angular/core';
import { Observable } from 'rxjs';
export declare type TooltipPosition = 'left' | 'right' | 'above' | 'below' | 'before' | 'after';
/** Time in ms to throttle repositioning after scroll events. */
export declare const SCROLL_THROTTLE_MS = 20;
/** CSS class that will be attached to the overlay panel. */
export declare const TOOLTIP_PANEL_CLASS = "mat-tooltip-panel";
/**
 * Creates an error to be thrown if the user supplied an invalid tooltip position.
 * @docs-private
 */
export declare function getMatTooltipInvalidPositionError(position: string): Error;
/** Injection token that determines the scroll handling while a tooltip is visible. */
export declare const MAT_TOOLTIP_SCROLL_STRATEGY: InjectionToken<() => ScrollStrategy>;
/** @docs-private */
export declare function MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy;
/** @docs-private */
export declare const MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER: {
    provide: InjectionToken<() => ScrollStrategy>;
    deps: (typeof Overlay)[];
    useFactory: typeof MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY;
};
/** Default `matTooltip` options that can be overridden. */
export interface MatTooltipDefaultOptions {
    showDelay: number;
    hideDelay: number;
    touchendHideDelay: number;
    position?: TooltipPosition;
}
/** Injection token to be used to override the default options for `matTooltip`. */
export declare const MAT_TOOLTIP_DEFAULT_OPTIONS: InjectionToken<MatTooltipDefaultOptions>;
/** @docs-private */
export declare function MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY(): MatTooltipDefaultOptions;
/**
 * Directive that attaches a material design tooltip to the host element. Animates the showing and
 * hiding of a tooltip provided position (defaults to below the element).
 *
 * https://material.io/design/components/tooltips.html
 */
export declare class MatTooltip implements OnDestroy {
    private _overlay;
    private _elementRef;
    private _scrollDispatcher;
    private _viewContainerRef;
    private _ngZone;
    private _ariaDescriber;
    private _focusMonitor;
    private _dir;
    private _defaultOptions;
    _overlayRef: OverlayRef | null;
    _tooltipInstance: TooltipComponent | null;
    private _portal;
    private _position;
    private _disabled;
    private _tooltipClass;
    private _scrollStrategy;
    /** Allows the user to define the position of the tooltip relative to the parent element */
    position: TooltipPosition;
    /** Disables the display of the tooltip. */
    disabled: boolean;
    /** The default delay in ms before showing the tooltip after show is called */
    showDelay: number;
    /** The default delay in ms before hiding the tooltip after hide is called */
    hideDelay: number;
    private _message;
    /** The message to be displayed in the tooltip */
    message: string;
    /** Classes to be passed to the tooltip. Supports the same syntax as `ngClass`. */
    tooltipClass: string | string[] | Set<string> | {
        [key: string]: any;
    };
    private _manualListeners;
    /** Emits when the component is destroyed. */
    private readonly _destroyed;
    constructor(_overlay: Overlay, _elementRef: ElementRef<HTMLElement>, _scrollDispatcher: ScrollDispatcher, _viewContainerRef: ViewContainerRef, _ngZone: NgZone, platform: Platform, _ariaDescriber: AriaDescriber, _focusMonitor: FocusMonitor, scrollStrategy: any, _dir: Directionality, _defaultOptions: MatTooltipDefaultOptions, hammerLoader?: HammerLoader);
    /**
     * Dispose the tooltip when destroyed.
     */
    ngOnDestroy(): void;
    /** Shows the tooltip after the delay in ms, defaults to tooltip-delay-show or 0ms if no input */
    show(delay?: number): void;
    /** Hides the tooltip after the delay in ms, defaults to tooltip-delay-hide or 0ms if no input */
    hide(delay?: number): void;
    /** Shows/hides the tooltip */
    toggle(): void;
    /** Returns true if the tooltip is currently visible to the user */
    _isTooltipVisible(): boolean;
    /** Handles the keydown events on the host element. */
    _handleKeydown(e: KeyboardEvent): void;
    /** Handles the touchend events on the host element. */
    _handleTouchend(): void;
    /** Create the overlay config and position strategy */
    private _createOverlay;
    /** Detaches the currently-attached tooltip. */
    private _detach;
    /** Updates the position of the current tooltip. */
    private _updatePosition;
    /**
     * Returns the origin position and a fallback position based on the user's position preference.
     * The fallback position is the inverse of the origin (e.g. `'below' -> 'above'`).
     */
    _getOrigin(): {
        main: OriginConnectionPosition;
        fallback: OriginConnectionPosition;
    };
    /** Returns the overlay position and a fallback position based on the user's preference */
    _getOverlayPosition(): {
        main: OverlayConnectionPosition;
        fallback: OverlayConnectionPosition;
    };
    /** Updates the tooltip message and repositions the overlay according to the new message length */
    private _updateTooltipMessage;
    /** Updates the tooltip class */
    private _setTooltipClass;
    /** Inverts an overlay position. */
    private _invertPosition;
}
export declare type TooltipVisibility = 'initial' | 'visible' | 'hidden';
/**
 * Internal component that wraps the tooltip's content.
 * @docs-private
 */
export declare class TooltipComponent implements OnDestroy {
    private _changeDetectorRef;
    private _breakpointObserver;
    /** Message to display in the tooltip */
    message: string;
    /** Classes to be added to the tooltip. Supports the same syntax as `ngClass`. */
    tooltipClass: string | string[] | Set<string> | {
        [key: string]: any;
    };
    /** The timeout ID of any current timer set to show the tooltip */
    _showTimeoutId: number | null;
    /** The timeout ID of any current timer set to hide the tooltip */
    _hideTimeoutId: number | null;
    /** Property watched by the animation framework to show or hide the tooltip */
    _visibility: TooltipVisibility;
    /** Whether interactions on the page should close the tooltip */
    private _closeOnInteraction;
    /** Subject for notifying that the tooltip has been hidden from the view */
    private readonly _onHide;
    /** Stream that emits whether the user has a handset-sized display.  */
    _isHandset: Observable<BreakpointState>;
    constructor(_changeDetectorRef: ChangeDetectorRef, _breakpointObserver: BreakpointObserver);
    /**
     * Shows the tooltip with an animation originating from the provided origin
     * @param delay Amount of milliseconds to the delay showing the tooltip.
     */
    show(delay: number): void;
    /**
     * Begins the animation to hide the tooltip after the provided delay in ms.
     * @param delay Amount of milliseconds to delay showing the tooltip.
     */
    hide(delay: number): void;
    /** Returns an observable that notifies when the tooltip has been hidden from view. */
    afterHidden(): Observable<void>;
    /** Whether the tooltip is being displayed. */
    isVisible(): boolean;
    ngOnDestroy(): void;
    _animationStart(): void;
    _animationDone(event: AnimationEvent): void;
    /**
     * Interactions on the HTML body should close the tooltip immediately as defined in the
     * material design spec.
     * https://material.io/design/components/tooltips.html#behavior
     */
    _handleBodyInteraction(): void;
    /**
     * Marks that the tooltip needs to be checked in the next change detection run.
     * Mainly used for rendering the initial text before positioning a tooltip, which
     * can be problematic in components with OnPush change detection.
     */
    _markForCheck(): void;
}
